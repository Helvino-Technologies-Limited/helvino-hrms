import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const where: any = {}
    if (year) where.year = parseInt(year)

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'asc' }],
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const budget = await prisma.budget.create({
      data: {
        name: body.name,
        department: body.department || null,
        category: body.category,
        amount: body.amount,
        spent: body.spent ?? 0,
        period: body.period,
        year: body.year,
        month: body.month || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}
