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

    const bankAccounts = await prisma.bankAccount.findMany({
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bankAccounts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
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
    const bankAccount = await prisma.bankAccount.create({
      data: {
        accountName: body.accountName,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountType: body.accountType || 'CURRENT',
        currency: body.currency || 'KES',
        balance: body.balance ?? 0,
        isActive: body.isActive ?? true,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(bankAccount, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 })
  }
}
