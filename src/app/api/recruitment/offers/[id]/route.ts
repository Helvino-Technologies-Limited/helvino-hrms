import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus, OfferStatus } from '@prisma/client'

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

    const offer = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
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

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('GET /api/recruitment/offers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 })
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
    const { status, salary, startDate, probationPeriod, terms, notes } = body

    const data: Record<string, unknown> = {}

    if (salary !== undefined) data.salary = Number(salary)
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (probationPeriod !== undefined)
      data.probationPeriod = probationPeriod != null ? Number(probationPeriod) : null
    if (terms !== undefined) data.terms = terms
    if (notes !== undefined) data.notes = notes

    if (status !== undefined) {
      data.status = status as OfferStatus

      if (status === OfferStatus.ACCEPTED || status === OfferStatus.REJECTED) {
        data.respondedAt = new Date()
      }
    }

    const offer = await prisma.jobOffer.update({
      where: { id },
      data,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
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

    // Sync applicant status based on offer status change
    if (status === OfferStatus.ACCEPTED) {
      await prisma.applicant.update({
        where: { id: offer.applicantId },
        data: { status: ApplicantStatus.HIRED },
      })
    } else if (status === OfferStatus.REJECTED) {
      await prisma.applicant.update({
        where: { id: offer.applicantId },
        data: { status: ApplicantStatus.REJECTED },
      })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('PATCH /api/recruitment/offers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
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

    await prisma.jobOffer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Offer deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/recruitment/offers/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }
}
