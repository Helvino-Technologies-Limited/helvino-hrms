import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const clientId = session.user.clientId

  const [
    activeServices,
    activeProjects,
    pendingQuotations,
    unpaidInvoices,
    expiringSoon,
    openTickets,
    recentNotifications,
  ] = await Promise.all([
    prisma.clientService.count({ where: { clientId, status: 'IN_PROGRESS' } }),
    prisma.clientProject.count({ where: { clientId, status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
    prisma.quotation.count({ where: { clientId, status: { in: ['SENT', 'VIEWED'] } } }),
    prisma.invoice.count({ where: { clientId, status: { in: ['SENT', 'OVERDUE'] } } }),
    prisma.subscription.count({
      where: {
        clientId,
        status: 'ACTIVE',
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.supportTicket.count({ where: { clientId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.clientNotification.findMany({
      where: { clientId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { companyName: true, contactPerson: true, email: true },
  })

  return NextResponse.json({
    client,
    stats: {
      activeServices,
      activeProjects,
      pendingQuotations,
      unpaidInvoices,
      expiringSoon,
      openTickets,
    },
    recentNotifications,
  })
}
