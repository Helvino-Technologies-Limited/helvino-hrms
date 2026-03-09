import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')

    const where: any = {}
    if (active === 'true') where.isActive = true

    const services = await prisma.serviceCatalog.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['SUPER_ADMIN', 'SALES_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: only SUPER_ADMIN or SALES_MANAGER can create services' }, { status: 403 })
    }

    const body = await req.json()

    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'name and category are required' }, { status: 400 })
    }

    const service = await prisma.serviceCatalog.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category,
        basePrice: body.basePrice ? parseFloat(body.basePrice) : null,
        packages: body.packages ?? null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
