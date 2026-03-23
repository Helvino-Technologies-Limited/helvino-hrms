import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        job: true,
        salesManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        interviews: {
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
            evaluation: true,
          },
          orderBy: { scheduledAt: 'asc' },
        },
        offer: {
          include: {
            createdBy: true,
          },
        },
        notesList: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    return NextResponse.json(applicant)
  } catch (error) {
    console.error('GET /api/recruitment/applications/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch applicant' }, { status: 500 })
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

    const body = await request.json()

    const {
      status,
      score,
      notes,
      talentPool,
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      coverLetter,
      linkedIn,
      portfolio,
      expectedSalary,
      availableFrom,
      experienceYears,
      currentCompany,
      educationLevel,
      skills,
      source,
      interviewDate,
      jobId,
      offerLetterContent,
    } = body

    const data: Record<string, unknown> = {}

    if (status !== undefined) data.status = status as ApplicantStatus
    if (score !== undefined) data.score = score != null ? Number(score) : null
    if (notes !== undefined) data.notes = notes
    if (talentPool !== undefined) data.talentPool = talentPool
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone
    if (resumeUrl !== undefined) data.resumeUrl = resumeUrl
    if (coverLetter !== undefined) data.coverLetter = coverLetter
    if (linkedIn !== undefined) data.linkedIn = linkedIn
    if (portfolio !== undefined) data.portfolio = portfolio
    if (expectedSalary !== undefined)
      data.expectedSalary = expectedSalary != null ? Number(expectedSalary) : null
    if (availableFrom !== undefined)
      data.availableFrom = availableFrom ? new Date(availableFrom) : null
    if (experienceYears !== undefined)
      data.experienceYears = experienceYears != null ? Number(experienceYears) : null
    if (currentCompany !== undefined) data.currentCompany = currentCompany
    if (educationLevel !== undefined) data.educationLevel = educationLevel
    if (skills !== undefined) data.skills = Array.isArray(skills) ? skills : []
    if (source !== undefined) data.source = source
    if (interviewDate !== undefined)
      data.interviewDate = interviewDate ? new Date(interviewDate) : null
    if (jobId !== undefined) data.jobId = jobId || null
    if (offerLetterContent !== undefined) data.offerLetterContent = offerLetterContent || null

    const applicant = await prisma.applicant.update({
      where: { id },
      data,
      include: {
        job: true,
        salesManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        interviews: {
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
            evaluation: true,
          },
          orderBy: { scheduledAt: 'asc' },
        },
        offer: {
          include: {
            createdBy: true,
          },
        },
        notesList: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return NextResponse.json(applicant)
  } catch (error) {
    console.error('PATCH /api/recruitment/applications/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
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

    await prisma.applicant.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Applicant deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/recruitment/applications/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 })
  }
}
