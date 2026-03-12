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
    const bankAccountId = searchParams.get('bankAccountId')
    const where: any = {}
    if (bankAccountId) where.bankAccountId = bankAccountId

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: { select: { accountName: true, bankName: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
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
    const transaction = await prisma.bankTransaction.create({
      data: {
        bankAccountId: body.bankAccountId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        reference: body.reference || null,
        date: body.date ? new Date(body.date) : new Date(),
        reconciled: body.reconciled ?? false,
      },
    })

    // Update bank account balance
    const account = await prisma.bankAccount.findUnique({ where: { id: body.bankAccountId } })
    if (account) {
      const newBalance = body.type === 'CREDIT'
        ? account.balance + body.amount
        : account.balance - body.amount
      await prisma.bankAccount.update({
        where: { id: body.bankAccountId },
        data: { balance: newBalance },
      })
      // Update balance on transaction
      await prisma.bankTransaction.update({
        where: { id: transaction.id },
        data: { balance: newBalance },
      })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
  }
}
