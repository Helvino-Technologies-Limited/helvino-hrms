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

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalInvoices,
      totalRevenue,
      outstandingInvoices,
      overdueInvoices,
      totalExpenses,
      bankAccounts,
      recentInvoices,
      recentExpenses,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.aggregate({ _sum: { amountPaid: true }, where: { status: { in: ['PAID', 'PARTIALLY_PAID'] } } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true }, where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: { in: ['APPROVED', 'REIMBURSED'] } } }),
      prisma.bankAccount.findMany({ where: { isActive: true }, select: { balance: true } }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { companyName: true } } },
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { firstName: true, lastName: true } } },
      }),
    ])

    const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0)
    const totalRevenueAmount = totalRevenue._sum.amountPaid ?? 0
    const totalExpensesAmount = totalExpenses._sum.amount ?? 0
    const netProfit = totalRevenueAmount - totalExpensesAmount

    return NextResponse.json({
      stats: {
        totalRevenue: totalRevenueAmount,
        totalExpenses: totalExpensesAmount,
        netProfit,
        outstandingInvoices: outstandingInvoices._sum.balanceDue ?? 0,
        overdueInvoicesCount: overdueInvoices,
        bankBalance: totalBankBalance,
        totalInvoices,
      },
      recentInvoices,
      recentExpenses,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
