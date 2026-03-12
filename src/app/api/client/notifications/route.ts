import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json([], { status: 200 })
  }

  const notifications = await prisma.clientNotification.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(notifications)
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.clientNotification.updateMany({
    where: { clientId: session.user.clientId, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
