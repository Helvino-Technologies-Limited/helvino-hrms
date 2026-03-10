import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InterviewStatus, InterviewType, ApplicantStatus } from '@prisma/client'

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

    const interview = await prisma.interview.findUnique({
      where: { id },
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

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    return NextResponse.json(interview)
  } catch (error) {
    console.error('GET /api/recruitment/interviews/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
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
      type,
      scheduledAt,
      location,
      meetingLink,
      interviewerId,
      notes,
      status,
      // Evaluation fields (only used when status = COMPLETED)
      technical,
      communication,
      problemSolving,
      culturalFit,
      overallScore,
      recommendation,
      evaluationNotes,
    } = body

    const data: Record<string, unknown> = {}

    if (type !== undefined) data.type = type as InterviewType
    if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt)
    if (location !== undefined) data.location = location
    if (meetingLink !== undefined) data.meetingLink = meetingLink
    if (interviewerId !== undefined) data.interviewerId = interviewerId || null
    if (notes !== undefined) data.notes = notes
    if (status !== undefined) data.status = status as InterviewStatus

    const interview = await prisma.interview.update({
      where: { id },
      data,
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

    const hasEvaluationData =
      technical !== undefined ||
      communication !== undefined ||
      problemSolving !== undefined ||
      culturalFit !== undefined ||
      overallScore !== undefined ||
      recommendation !== undefined ||
      evaluationNotes !== undefined

    if (status === InterviewStatus.COMPLETED && hasEvaluationData) {
      const evaluatorId = (session.user as any).employeeId || null

      await prisma.interviewEvaluation.upsert({
        where: { interviewId: id },
        create: {
          interviewId: id,
          technical: technical != null ? Number(technical) : null,
          communication: communication != null ? Number(communication) : null,
          problemSolving: problemSolving != null ? Number(problemSolving) : null,
          culturalFit: culturalFit != null ? Number(culturalFit) : null,
          overallScore: overallScore != null ? Number(overallScore) : null,
          recommendation: recommendation || null,
          notes: evaluationNotes || null,
          evaluatedById: evaluatorId,
        },
        update: {
          technical: technical != null ? Number(technical) : undefined,
          communication: communication != null ? Number(communication) : undefined,
          problemSolving: problemSolving != null ? Number(problemSolving) : undefined,
          culturalFit: culturalFit != null ? Number(culturalFit) : undefined,
          overallScore: overallScore != null ? Number(overallScore) : undefined,
          recommendation: recommendation !== undefined ? recommendation || null : undefined,
          notes: evaluationNotes !== undefined ? evaluationNotes || null : undefined,
          evaluatedById: evaluatorId,
        },
      })

      await prisma.applicant.update({
        where: { id: interview.applicantId },
        data: { status: ApplicantStatus.INTERVIEWED },
      })
    }

    // Re-fetch to return updated evaluation in response
    const updatedInterview = await prisma.interview.findUnique({
      where: { id },
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

    return NextResponse.json(updatedInterview)
  } catch (error) {
    console.error('PATCH /api/recruitment/interviews/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 })
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

    await prisma.interview.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Interview deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/recruitment/interviews/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 })
  }
}
