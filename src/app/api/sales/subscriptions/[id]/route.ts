import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function deriveStatus(expiryDate: Date): 'ACTIVE' | 'EXPIRED' {
  return expiryDate > new Date() ? 'ACTIVE' : 'EXPIRED'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

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
      // Recalculate status automatically when expiryDate is updated,
      // unless an explicit status override was also provided
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

    await prisma.subscription.delete({ where: { id } })

    return NextResponse.json({ message: 'Subscription deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
