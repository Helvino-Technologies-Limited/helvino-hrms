import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'
import { postJobToLinkedIn } from '@/lib/linkedin'

async function generateSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')

  const existing = await prisma.job.findUnique({ where: { slug: base } })
  if (!existing) return base

  let counter = 1
  while (true) {
    const candidate = `${base}-${counter}`
    const found = await prisma.job.findUnique({ where: { slug: candidate } })
    if (!found) return candidate
    counter++
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status as JobStatus
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const jobs = await prisma.job.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('GET /api/recruitment/jobs error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug = await generateSlug(title)

    const jobStatus: JobStatus = status ?? JobStatus.OPEN
    const postedAt = jobStatus === JobStatus.OPEN ? new Date() : null

    const job = await prisma.job.create({
      data: {
        title,
        slug,
        description,
        requirements,
        responsibilities,
        departmentId: departmentId || null,
        type: type ?? 'Full-time',
        location,
        salaryMin: salaryMin != null ? Number(salaryMin) : null,
        salaryMax: salaryMax != null ? Number(salaryMax) : null,
        positions: positions != null ? Number(positions) : 1,
        skills: Array.isArray(skills) ? skills : [],
        experienceLevel,
        educationReq,
        benefits,
        hiringManagerId: hiringManagerId || null,
        status: jobStatus,
        postedAt,
        deadline: deadline ? new Date(deadline) : null,
      },
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

    // Auto-post to LinkedIn when job is created as OPEN
    if (jobStatus === JobStatus.OPEN) {
      postJobToLinkedIn(job).catch(() => {}) // fire-and-forget
    }

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('POST /api/recruitment/jobs error:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
