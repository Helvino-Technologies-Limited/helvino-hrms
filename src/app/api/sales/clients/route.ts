import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const VIEW_ALL = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']
    const empId = (session.user as any).employeeId as string | undefined
    const where: any = {}
    if (!VIEW_ALL.includes(session.user.role) && empId) {
      where.OR = [{ assignedToId: empId }, { createdById: empId }]
    }
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { services: true, subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const createdById = (session.user as any).employeeId

    const count = await prisma.client.count()
    const clientNumber = `CLT-${String(count + 1).padStart(4, '0')}`

    const client = await prisma.client.create({
      data: {
        clientNumber,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || 'Kenya',
        industry: body.industry || null,
        category: body.category || 'CORPORATE',
        tags: body.tags || [],
        website: body.website || null,
        notes: body.notes || null,
        assignedToId: body.assignedToId || null,
        createdById: createdById || null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
