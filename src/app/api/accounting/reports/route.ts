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
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    const invoiceWhere: any = {}
    if (from || to) invoiceWhere.issueDate = dateFilter

    const expenseWhere: any = {}
    if (from || to) expenseWhere.date = dateFilter

    const [
      invoices,
      expenses,
      payments,
      bills,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          status: true,
          totalAmount: true,
          amountPaid: true,
          taxAmount: true,
          issueDate: true,
          clientName: true,
        },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        select: { category: true, amount: true, status: true, date: true },
      }),
      prisma.payment.findMany({
        where: from || to ? { paymentDate: dateFilter } : {},
        select: { amount: true, method: true, paymentDate: true },
      }),
      prisma.bill.findMany({
        where: from || to ? { createdAt: dateFilter } : {},
        select: { amount: true, amountPaid: true, status: true },
      }),
    ])

    // Profit & Loss
    const totalRevenue = invoices
      .filter(i => ['PAID', 'PARTIALLY_PAID'].includes(i.status))
      .reduce((sum, i) => sum + i.amountPaid, 0)

    const totalExpenses = expenses
      .filter(e => ['APPROVED', 'REIMBURSED'].includes(e.status))
      .reduce((sum, e) => sum + e.amount, 0)

    const totalBillsOwed = bills.reduce((sum, b) => sum + (b.amount - b.amountPaid), 0)

    const netProfit = totalRevenue - totalExpenses

    // Expense by category
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    })

    // Revenue by month (last 12 months)
    const revenueByMonth: Record<string, number> = {}
    payments.forEach(p => {
      const month = new Date(p.paymentDate).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
      revenueByMonth[month] = (revenueByMonth[month] || 0) + p.amount
    })

    // Payment methods breakdown
    const paymentMethods: Record<string, number> = {}
    payments.forEach(p => {
      paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount
    })

    // Outstanding invoices
    const outstandingInvoices = invoices
      .filter(i => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
      .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0)

    return NextResponse.json({
      profitLoss: {
        totalRevenue,
        totalExpenses,
        netProfit,
        outstandingInvoices,
        totalBillsOwed,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'PAID').length,
      },
      expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
      revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount })),
      paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({ method, amount })),
      invoiceStatusBreakdown: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'].map(s => ({
        status: s,
        count: invoices.filter(i => i.status === s).length,
        amount: invoices.filter(i => i.status === s).reduce((sum, i) => sum + i.totalAmount, 0),
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
