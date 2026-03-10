import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'
import { postJobToLinkedIn } from '@/lib/linkedin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        department: true,
        hiringManager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { applicants: true },
        },
        applicants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            score: true,
            source: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('GET /api/recruitment/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.job.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const body = await request.json()

    const {
      title,
      description,
      requirements,
      responsibilities,
      departmentId,
      type,
      location,
      salaryMin,
      salaryMax,
      positions,
      skills,
      experienceLevel,
      educationReq,
      benefits,
      hiringManagerId,
      status,
      deadline,
      postedAt,
    } = body

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (requirements !== undefined) updateData.requirements = requirements
    if (responsibilities !== undefined) updateData.responsibilities = responsibilities
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (type !== undefined) updateData.type = type
    if (location !== undefined) updateData.location = location
    if (salaryMin !== undefined) updateData.salaryMin = salaryMin != null ? Number(salaryMin) : null
    if (salaryMax !== undefined) updateData.salaryMax = salaryMax != null ? Number(salaryMax) : null
    if (positions !== undefined) updateData.positions = Number(positions)
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : []
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel
    if (educationReq !== undefined) updateData.educationReq = educationReq
    if (benefits !== undefined) updateData.benefits = benefits
    if (hiringManagerId !== undefined) updateData.hiringManagerId = hiringManagerId || null
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (postedAt !== undefined) updateData.postedAt = postedAt ? new Date(postedAt) : null

    if (status !== undefined) {
      updateData.status = status as JobStatus
      // If transitioning to OPEN and postedAt has never been set, stamp it now
      if (status === JobStatus.OPEN && existing.postedAt === null) {
        updateData.postedAt = new Date()
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        hiringManager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { applicants: true },
        },
      },
    })

    // Auto-post to LinkedIn when job is first published
    const isFirstPublish =
      status === JobStatus.OPEN && existing.postedAt === null
    if (isFirstPublish) {
      postJobToLinkedIn(job).catch(() => {}) // fire-and-forget, never block the response
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('PATCH /api/recruitment/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: { select: { applicants: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existing._count.applicants > 0) {
      // Has applicants — archive instead of delete
      const archived = await prisma.job.update({
        where: { id },
        data: { status: JobStatus.ARCHIVED },
      })
      return NextResponse.json({
        message: 'Job has applicants and has been archived instead of deleted.',
        job: archived,
      })
    }

    await prisma.job.delete({ where: { id } })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/recruitment/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
