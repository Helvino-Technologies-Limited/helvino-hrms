import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

function generateInvoiceNumber(): string {
  const date = new Date()
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `INV-${yyyymmdd}-${rand}`
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
    const clientId = searchParams.get('clientId')
    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    // Auto-mark overdue invoices
    await prisma.invoice.updateMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    })

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        items: true,
        payments: { select: { amount: true, paymentDate: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
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
    const subtotal = body.items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) ?? 0
    const taxRate = body.taxRate ?? 16
    const taxAmount = subtotal * (taxRate / 100)
    const discountAmount = body.discountAmount ?? 0
    const totalAmount = subtotal + taxAmount - discountAmount

    let invoiceNumber = generateInvoiceNumber()
    // Ensure uniqueness
    let existing = await prisma.invoice.findUnique({ where: { invoiceNumber } })
    while (existing) {
      invoiceNumber = generateInvoiceNumber()
      existing = await prisma.invoice.findUnique({ where: { invoiceNumber } })
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: body.clientId || null,
        clientName: body.clientName,
        clientEmail: body.clientEmail || null,
        quotationId: body.quotationId || null,
        subscriptionId: body.subscriptionId || null,
        dueDate: new Date(body.dueDate),
        status: body.status || 'DRAFT',
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        notes: body.notes || null,
        terms: body.terms || null,
        createdById: (session.user as any).employeeId || null,
        items: {
          create: (body.items || []).map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
