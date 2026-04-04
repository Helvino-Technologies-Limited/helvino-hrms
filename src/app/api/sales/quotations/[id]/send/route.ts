import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, quotationEmailHtml } from '@/lib/email'
import { logAudit } from '@/lib/audit'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'HEAD_OF_SALES'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { include: { service: true } } },
  })

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const recipientEmail = quotation.clientEmail
  if (!recipientEmail) return NextResponse.json({ error: 'No client email on this quotation' }, { status: 400 })

  const subtotal = quotation.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0)
  const discountAmount = Number(quotation.discountAmount) || 0
  const taxRate = Number(quotation.taxRate) || 16
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
  const totalAmount = subtotal - discountAmount + taxAmount

  const html = quotationEmailHtml({
    clientName: quotation.clientName,
    quotationNumber: quotation.quotationNumber,
    date: formatDate(quotation.createdAt),
    validUntil: quotation.validUntil ? formatDate(quotation.validUntil) : undefined,
    deliveryTimeline: quotation.deliveryTimeline ?? undefined,
    items: quotation.items.map(i => ({
      serviceName: i.name,
      description: i.description ?? undefined,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    projectScope: quotation.projectScope ?? undefined,
    notes: quotation.notes ?? undefined,
    terms: quotation.terms ?? undefined,
  })

  await sendEmail({
    to: recipientEmail,
    subject: `Quotation ${quotation.quotationNumber} from Helvino Technologies Limited`,
    html,
  })

  // Mark as sent if still draft
  if (quotation.status === 'DRAFT') {
    await prisma.quotation.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  }

  const empId = (session.user as any).employeeId as string | undefined
  logAudit({
    employeeId: empId,
    action: 'SENT',
    entity: 'QUOTATION',
    entityId: id,
    label: `${quotation.quotationNumber} — ${quotation.clientName} → ${recipientEmail}`,
    newValues: { quotationNumber: quotation.quotationNumber, sentTo: recipientEmail },
    req,
  })

  return NextResponse.json({ success: true })
}
