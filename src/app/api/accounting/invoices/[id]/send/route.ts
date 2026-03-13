import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, invoiceEmailHtml } from '@/lib/email'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'FINANCE_OFFICER', 'SALES_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const recipientEmail = invoice.clientEmail
  if (!recipientEmail) return NextResponse.json({ error: 'No client email on this invoice' }, { status: 400 })

  const html = invoiceEmailHtml({
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: formatDate(invoice.issueDate),
    dueDate: formatDate(invoice.dueDate),
    items: invoice.items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    totalAmount: Number(invoice.totalAmount),
    balanceDue: Number(invoice.balanceDue),
    notes: invoice.notes ?? undefined,
    terms: invoice.terms ?? undefined,
  })

  await sendEmail({
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from Helvino Technologies Limited`,
    html,
  })

  // Mark as sent if still draft
  if (invoice.status === 'DRAFT') {
    await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  }

  return NextResponse.json({ success: true })
}
