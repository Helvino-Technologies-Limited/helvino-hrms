import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, serviceType, description, businessNeeds, budget, timeline } = await req.json()
  if (!title || !serviceType || !description) {
    return NextResponse.json({ error: 'Title, service type, and description are required' }, { status: 400 })
  }

  const count = await prisma.serviceRequest.count()
  const requestNumber = `SRQ-${String(count + 1).padStart(4, '0')}`

  const request = await prisma.serviceRequest.create({
    data: {
      requestNumber,
      clientId: session.user.clientId,
      title,
      serviceType,
      description,
      businessNeeds,
      budget: budget ? parseFloat(budget) : null,
      timeline,
    },
  })

  // Create notification for admins (we'll just log it; email notification would go here)
  return NextResponse.json(request, { status: 201 })
}
