import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [projects, services] = await Promise.all([
    prisma.clientProject.findMany({
      where: { clientId: session.user.clientId },
      include: { milestones: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.clientService.findMany({
      where: { clientId: session.user.clientId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ projects, services })
}
