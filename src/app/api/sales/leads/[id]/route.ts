import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'HEAD_OF_SALES']

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

    // Fetch current state for audit diff
    const before = await prisma.lead.findUnique({
      where: { id },
      select: { leadNumber: true, contactPerson: true, companyName: true, status: true, priority: true, assignedToId: true },
    })

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

    const empId = (session.user as any).employeeId as string | undefined
    const action = before?.status !== lead.status ? 'STATUS_CHANGED' : 'UPDATED'
    logAudit({
      employeeId: empId,
      action,
      entity: 'LEAD',
      entityId: id,
      label: `${before?.leadNumber} — ${before?.contactPerson}`,
      oldValues: before ? { status: before.status, priority: before.priority, assignedToId: before.assignedToId } : null,
      newValues: { status: lead.status, priority: lead.priority, assignedToId: lead.assignedToId, ...updateData },
      req,
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

    if (!['SUPER_ADMIN', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions to delete leads' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.lead.findUnique({
      where: { id },
      select: { leadNumber: true, contactPerson: true, companyName: true, status: true },
    })

    await prisma.lead.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'LEAD',
      entityId: id,
      label: before ? `${before.leadNumber} — ${before.contactPerson}` : id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
