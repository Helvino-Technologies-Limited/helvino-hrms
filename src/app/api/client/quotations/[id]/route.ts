import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const quotation = await prisma.quotation.findFirst({
    where: { id, clientId: session.user.clientId },
    include: { items: true },
  })
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(quotation)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { action, reason } = await req.json()

  const quotation = await prisma.quotation.findFirst({
    where: { id, clientId: session.user.clientId, status: { in: ['SENT', 'VIEWED'] } },
  })
  if (!quotation) return NextResponse.json({ error: 'Not found or cannot be actioned' }, { status: 404 })

  let updateData: any = {}
  if (action === 'approve') {
    updateData = { status: 'APPROVED', approvedAt: new Date() }
  } else if (action === 'reject') {
    updateData = { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason }
  } else if (action === 'view') {
    updateData = { status: 'VIEWED', viewedAt: new Date() }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const updated = await prisma.quotation.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}
