import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'HEAD_OF_SALES']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: { service: true },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, contactPerson: true, companyName: true, status: true } },
        client: { select: { id: true, companyName: true, contactPerson: true, email: true } },
      },
    })

    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, status: true, quotationNumber: true, clientName: true, totalAmount: true },
    })
    if (!existing) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

    const updateData: any = {}

    const scalarFields = [
      'clientName', 'clientEmail', 'deliveryTimeline', 'projectScope',
      'terms', 'notes', 'leadId', 'clientId',
    ]
    for (const field of scalarFields) {
      if (field in body) updateData[field] = body[field]
    }

    if (body.validUntil !== undefined) {
      updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null
    }
    if (body.discountAmount !== undefined) {
      updateData.discountAmount = parseFloat(body.discountAmount)
    }
    if (body.taxRate !== undefined) {
      updateData.taxRate = parseFloat(body.taxRate)
    }

    // Status transition timestamps
    if (body.status && body.status !== existing.status) {
      updateData.status = body.status
      const now = new Date()
      if (body.status === 'SENT') updateData.sentAt = now
      else if (body.status === 'VIEWED') updateData.viewedAt = now
      else if (body.status === 'APPROVED') updateData.approvedAt = now
      else if (body.status === 'REJECTED') {
        updateData.rejectedAt = now
        if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason
      }
    }

    const hasItemUpdate = Array.isArray(body.items)
    const hasFinancialUpdate = body.discountAmount !== undefined || body.taxRate !== undefined

    const quotation = await prisma.$transaction(async (tx) => {
      if (hasItemUpdate) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } })

        const items = body.items.map((item: any) => {
          const quantity = parseInt(item.quantity) || 1
          const unitPrice = parseFloat(item.unitPrice) || 0
          const totalPrice = quantity * unitPrice
          return {
            quotationId: id,
            serviceId: item.serviceId || null,
            name: item.name,
            description: item.description || null,
            quantity,
            unitPrice,
            totalPrice,
          }
        })

        if (items.length > 0) {
          await tx.quotationItem.createMany({ data: items })
        }

        const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

        const currentQuotation = await tx.quotation.findUnique({
          where: { id },
          select: { taxRate: true, discountAmount: true },
        })
        const taxRate = updateData.taxRate ?? currentQuotation?.taxRate ?? 16
        const discountAmount = updateData.discountAmount ?? currentQuotation?.discountAmount ?? 0
        const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
        const totalAmount = subtotal - discountAmount + taxAmount

        updateData.subtotal = subtotal
        updateData.taxAmount = taxAmount
        updateData.totalAmount = totalAmount
        updateData.discountAmount = discountAmount
        updateData.taxRate = taxRate
      } else if (hasFinancialUpdate) {
        const currentQuotation = await tx.quotation.findUnique({
          where: { id },
          select: { subtotal: true, taxRate: true, discountAmount: true },
        })
        const subtotal = currentQuotation?.subtotal ?? 0
        const taxRate = updateData.taxRate ?? currentQuotation?.taxRate ?? 16
        const discountAmount = updateData.discountAmount ?? currentQuotation?.discountAmount ?? 0
        const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
        const totalAmount = subtotal - discountAmount + taxAmount

        updateData.taxAmount = taxAmount
        updateData.totalAmount = totalAmount
      }

      return tx.quotation.update({
        where: { id },
        data: updateData,
        include: {
          items: { include: { service: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, contactPerson: true, companyName: true } },
          client: { select: { id: true, companyName: true } },
        },
      })
    })

    const empId = (session.user as any).employeeId as string | undefined
    const action = body.status && body.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED'
    logAudit({
      employeeId: empId,
      action,
      entity: 'QUOTATION',
      entityId: id,
      label: `${existing.quotationNumber} — ${existing.clientName}`,
      oldValues: { status: existing.status, totalAmount: existing.totalAmount },
      newValues: updateData,
      req,
    })

    return NextResponse.json(quotation)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, status: true, quotationNumber: true, clientName: true, totalAmount: true },
    })
    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })

    if (quotation.status !== 'DRAFT' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only DRAFT quotations can be deleted, or you must be a SUPER_ADMIN' },
        { status: 403 }
      )
    }

    await prisma.quotation.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'QUOTATION',
      entityId: id,
      label: `${quotation.quotationNumber} — ${quotation.clientName}`,
      oldValues: { status: quotation.status, totalAmount: quotation.totalAmount },
      req,
    })

    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 })
  }
}
