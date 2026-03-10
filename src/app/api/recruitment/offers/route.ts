import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const offers = await prisma.jobOffer.findMany({
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(offers)
  } catch (error) {
    console.error('GET /api/recruitment/offers error:', error)
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicantId, salary, startDate, probationPeriod, terms, notes } = body

    if (!applicantId || salary == null) {
      return NextResponse.json(
        { error: 'applicantId and salary are required' },
        { status: 400 }
      )
    }

    const employeeId = session.user?.employeeId ?? null

    const offer = await prisma.jobOffer.create({
      data: {
        applicantId,
        salary: Number(salary),
        startDate: startDate ? new Date(startDate) : null,
        probationPeriod: probationPeriod != null ? Number(probationPeriod) : null,
        terms: terms ?? null,
        notes: notes ?? null,
        sentAt: new Date(),
        createdById: employeeId,
      },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Update applicant status to OFFERED
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: ApplicantStatus.OFFERED },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('POST /api/recruitment/offers error:', error)
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }
}
