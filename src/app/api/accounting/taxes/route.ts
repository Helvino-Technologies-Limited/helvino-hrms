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
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const taxes = await prisma.taxRecord.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(taxes)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch tax records' }, { status: 500 })
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
    const taxRecord = await prisma.taxRecord.create({
      data: {
        type: body.type,
        period: body.period,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        status: body.status || 'PENDING',
        reference: body.reference || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(taxRecord, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create tax record' }, { status: 500 })
  }
}
