import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function computeDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function deriveStatus(expiryDate: Date): 'ACTIVE' | 'EXPIRED' {
  return expiryDate > new Date() ? 'ACTIVE' : 'EXPIRED'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const billingCycle = searchParams.get('billingCycle')
    const expiringParam = searchParams.get('expiring')

    const where: any = {}

    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (billingCycle) where.billingCycle = billingCycle

    if (expiringParam) {
      const days = parseInt(expiringParam, 10)
      if (!isNaN(days)) {
        const now = new Date()
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        where.expiryDate = { gte: now, lte: future }
        where.status = 'ACTIVE'
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        client: {
          select: { companyName: true, contactPerson: true, phone: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    })

    const enriched = subscriptions.map((sub) => ({
      ...sub,
      daysUntilExpiry: computeDaysUntilExpiry(sub.expiryDate),
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const expiryDate = new Date(body.expiryDate)
    const status = deriveStatus(expiryDate)

    const subscription = await prisma.subscription.create({
      data: {
        clientId: body.clientId,
        serviceName: body.serviceName,
        description: body.description || null,
        startDate: new Date(body.startDate),
        expiryDate,
        renewalPrice: parseFloat(body.renewalPrice),
        billingCycle: body.billingCycle || 'YEARLY',
        status,
        autoRenew: body.autoRenew ?? false,
        notes: body.notes || null,
      },
      include: {
        client: {
          select: { companyName: true, contactPerson: true, phone: true },
        },
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
