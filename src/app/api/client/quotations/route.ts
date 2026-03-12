import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const quotations = await prisma.quotation.findMany({
    where: { clientId: session.user.clientId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(quotations)
}
