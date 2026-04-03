import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

function deriveStatus(expiryDate: Date): 'ACTIVE' | 'EXPIRED' {
  return expiryDate > new Date() ? 'ACTIVE' : 'EXPIRED'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const before = await prisma.subscription.findUnique({
      where: { id },
      select: { serviceName: true, status: true, expiryDate: true, clientId: true },
    })

    const updateData: any = {}

    if (body.serviceName !== undefined) updateData.serviceName = body.serviceName
    if (body.description !== undefined) updateData.description = body.description
    if (body.renewalPrice !== undefined) updateData.renewalPrice = parseFloat(body.renewalPrice)
    if (body.billingCycle !== undefined) updateData.billingCycle = body.billingCycle
    if (body.autoRenew !== undefined) updateData.autoRenew = body.autoRenew
    if (body.notes !== undefined) updateData.notes = body.notes

    if (body.expiryDate !== undefined) {
      const expiryDate = new Date(body.expiryDate)
      updateData.expiryDate = expiryDate
      updateData.status = body.status !== undefined ? body.status : deriveStatus(expiryDate)
    } else if (body.status !== undefined) {
      updateData.status = body.status
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { companyName: true, contactPerson: true, phone: true },
        },
      },
    })

    const empId = (session.user as any).employeeId as string | undefined
    const action = before?.status !== subscription.status ? 'STATUS_CHANGED' : 'UPDATED'
    logAudit({
      employeeId: empId,
      action,
      entity: 'SUBSCRIPTION',
      entityId: id,
      label: `${before?.serviceName ?? id} — ${subscription.client.companyName}`,
      oldValues: before ? { status: before.status, expiryDate: before.expiryDate } : null,
      newValues: updateData,
      req,
    })

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN access required' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.subscription.findUnique({
      where: { id },
      select: { serviceName: true, status: true },
    })

    await prisma.subscription.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'SUBSCRIPTION',
      entityId: id,
      label: before?.serviceName ?? id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ message: 'Subscription deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
