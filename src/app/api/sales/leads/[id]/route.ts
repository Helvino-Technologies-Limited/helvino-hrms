import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, jobTitle: true, profilePhoto: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        activities: {
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
          },
          orderBy: { activityDate: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
        convertedToClient: true,
      },
    })

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    return NextResponse.json(lead)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'companyName', 'contactPerson', 'phone', 'whatsapp', 'email',
      'location', 'industry', 'source', 'services', 'priority', 'status',
      'notes', 'expectedValue', 'expectedCloseDate', 'assignedToId',
      'lostReason', 'convertedToClientId',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (updateData.expectedValue !== undefined && updateData.expectedValue !== null) {
      updateData.expectedValue = parseFloat(updateData.expectedValue)
    }
    if (updateData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(updateData.expectedCloseDate)
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['SUPER_ADMIN', 'SALES_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions to delete leads' }, { status: 403 })
    }

    const { id } = await params

    await prisma.lead.delete({ where: { id } })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
