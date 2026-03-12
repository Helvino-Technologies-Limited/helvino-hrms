import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  const ticket = await prisma.supportTicket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const employee = session.user.employee
  const senderName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : session.user.name || 'Support Agent'

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      message,
      senderId: session.user.id,
      senderName,
      isClient: false,
    },
  })

  // Move status to WAITING_CLIENT after staff reply (unless already resolved/closed)
  if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'WAITING_CLIENT', updatedAt: new Date() },
    })
  } else {
    await prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } })
  }

  return NextResponse.json(msg, { status: 201 })
}
