import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSalesScope, buildOwnerFilter } from '@/lib/sales-scope'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const scope = await getSalesScope(session.user.id)
    const ownerFilter = buildOwnerFilter(scope)

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = { ...ownerFilter }
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      const searchOr = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
      if (ownerFilter.OR) {
        where.AND = [{ OR: ownerFilter.OR }, { OR: searchOr }]
        delete where.OR
      } else {
        where.OR = searchOr
      }
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

    const scope = await getSalesScope(session.user.id)
    const body = await req.json()

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
        createdById: scope.empId || null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
