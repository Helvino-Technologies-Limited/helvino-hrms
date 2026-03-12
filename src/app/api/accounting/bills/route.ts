import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

function generateBillNumber(): string {
  const date = new Date()
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `BILL-${yyyymmdd}-${rand}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const where: any = {}
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    // Auto-mark overdue bills
    await prisma.bill.updateMany({
      where: {
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    })

    const bills = await prisma.bill.findMany({
      where,
      include: {
        supplier: { select: { name: true, contactName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
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

    let billNumber = generateBillNumber()
    let existing = await prisma.bill.findUnique({ where: { billNumber } })
    while (existing) {
      billNumber = generateBillNumber()
      existing = await prisma.bill.findUnique({ where: { billNumber } })
    }

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        supplierId: body.supplierId,
        description: body.description,
        amount: body.amount,
        amountPaid: body.amountPaid ?? 0,
        dueDate: new Date(body.dueDate),
        status: body.status || 'UNPAID',
        notes: body.notes || null,
      },
      include: { supplier: true },
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}
