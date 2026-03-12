import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { clientId: session.user.clientId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, description, category, priority } = await req.json()
  if (!subject || !description || !category) {
    return NextResponse.json({ error: 'Subject, description, and category are required' }, { status: 400 })
  }

  const count = await prisma.supportTicket.count()
  const ticketNumber = `TKT-${String(count + 1).padStart(4, '0')}`

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      clientId: session.user.clientId,
      subject,
      description,
      category,
      priority: priority || 'MEDIUM',
      messages: {
        create: {
          message: description,
          senderId: session.user.id,
          senderName: session.user.client?.contactPerson || session.user.name || 'Client',
          isClient: true,
        },
      },
    },
    include: { messages: true },
  })

  return NextResponse.json(ticket, { status: 201 })
}
