import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InterviewStatus, InterviewType, ApplicantStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicantId')
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}

    if (applicantId) {
      where.applicantId = applicantId
    }

    if (status) {
      where.status = status as InterviewStatus
    }

    if (date === 'today') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      where.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            job: {
              select: { title: true },
            },
          },
        },
        interviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        evaluation: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json(interviews)
  } catch (error) {
    console.error('GET /api/recruitment/interviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 })
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
      applicantId,
      type,
      scheduledAt,
      location,
      meetingLink,
      interviewerId,
      notes,
    } = body

    if (!applicantId || !type || !scheduledAt) {
      return NextResponse.json(
        { error: 'applicantId, type, and scheduledAt are required' },
        { status: 400 }
      )
    }

    const interview = await prisma.interview.create({
      data: {
        applicantId,
        type: type as InterviewType,
        scheduledAt: new Date(scheduledAt),
        location: location || null,
        meetingLink: meetingLink || null,
        interviewerId: interviewerId || null,
        notes: notes || null,
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            job: {
              select: { title: true },
            },
          },
        },
        interviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        evaluation: true,
      },
    })

    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: ApplicantStatus.INTERVIEW_SCHEDULED },
    })

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    console.error('POST /api/recruitment/interviews error:', error)
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 })
  }
}
