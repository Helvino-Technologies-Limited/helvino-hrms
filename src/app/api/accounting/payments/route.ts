import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

function generatePaymentNumber(): string {
  const date = new Date()
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `PAY-${yyyymmdd}-${rand}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      include: {
        invoice: { select: { invoiceNumber: true, totalAmount: true } },
        client: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
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

    let paymentNumber = generatePaymentNumber()
    let existing = await prisma.payment.findUnique({ where: { paymentNumber } })
    while (existing) {
      paymentNumber = generatePaymentNumber()
      existing = await prisma.payment.findUnique({ where: { paymentNumber } })
    }

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: body.invoiceId || null,
        clientId: body.clientId || null,
        amount: body.amount,
        method: body.method || 'BANK_TRANSFER',
        reference: body.reference || null,
        notes: body.notes || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        createdById: (session.user as any).employeeId || null,
      },
    })

    // Update invoice amountPaid and balanceDue
    if (body.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: body.invoiceId } })
      if (invoice) {
        const newAmountPaid = invoice.amountPaid + body.amount
        const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid)
        let newStatus: any = invoice.status
        if (newBalanceDue <= 0) {
          newStatus = 'PAID'
        } else if (newAmountPaid > 0) {
          newStatus = 'PARTIALLY_PAID'
        }
        await prisma.invoice.update({
          where: { id: body.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus,
            paidAt: newStatus === 'PAID' ? new Date() : undefined,
          },
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
