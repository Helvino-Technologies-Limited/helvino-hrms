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

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, clientId: session.user.clientId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, clientId: session.user.clientId },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      message,
      senderId: session.user.id,
      senderName: session.user.client?.contactPerson || session.user.name || 'Client',
      isClient: true,
    },
  })

  // Update ticket status if it was waiting_client
  if (ticket.status === 'WAITING_CLIENT') {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    })
  } else {
    await prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } })
  }

  return NextResponse.json(msg, { status: 201 })
}
