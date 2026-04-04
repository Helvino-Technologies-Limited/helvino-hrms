import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSalesScope, buildCreatorFilter } from '@/lib/sales-scope'
import { logAudit } from '@/lib/audit'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'HEAD_OF_SALES']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scope = await getSalesScope(session.user.id)
    if (!ALLOWED_ROLES.includes(scope.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const creatorFilter = buildCreatorFilter(scope)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const leadId = searchParams.get('leadId')
    const search = searchParams.get('search')

    const where: any = { ...creatorFilter }
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (leadId) where.leadId = leadId
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { service: { select: { id: true, name: true, category: true } } },
        },
        lead: { select: { id: true, contactPerson: true, companyName: true } },
        client: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scope = await getSalesScope(session.user.id)
    if (!ALLOWED_ROLES.includes(scope.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const year = new Date().getFullYear()
    const count = await prisma.quotation.count()
    const quotationNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`

    const items: Array<{
      serviceId?: string
      name: string
      description?: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }> = (body.items || []).map((item: any) => {
      const quantity = parseInt(item.quantity) || 1
      const unitPrice = parseFloat(item.unitPrice) || 0
      const totalPrice = quantity * unitPrice
      return {
        serviceId: item.serviceId || null,
        name: item.name,
        description: item.description || null,
        quantity,
        unitPrice,
        totalPrice,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxRate = body.taxRate !== undefined ? parseFloat(body.taxRate) : 16
    const discountAmount = body.discountAmount ? parseFloat(body.discountAmount) : 0
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
    const totalAmount = subtotal - discountAmount + taxAmount

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          quotationNumber,
          leadId: body.leadId || null,
          clientId: body.clientId || null,
          clientName: body.clientName,
          clientEmail: body.clientEmail || null,
          deliveryTimeline: body.deliveryTimeline || null,
          projectScope: body.projectScope || null,
          terms: body.terms || null,
          notes: body.notes || null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          discountAmount,
          taxRate,
          taxAmount,
          subtotal,
          totalAmount,
          createdById: scope.empId || null,
        },
      })

      if (items.length > 0) {
        await tx.quotationItem.createMany({
          data: items.map((item) => ({
            quotationId: created.id,
            serviceId: item.serviceId || null,
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        })
      }

      return tx.quotation.findUnique({
        where: { id: created.id },
        include: {
          items: { include: { service: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          lead: { select: { id: true, contactPerson: true, companyName: true } },
          client: { select: { id: true, companyName: true } },
        },
      })
    })

    logAudit({
      employeeId: scope.empId,
      action: 'CREATED',
      entity: 'QUOTATION',
      entityId: quotation!.id,
      label: `${quotationNumber} — ${body.clientName} (KES ${totalAmount.toLocaleString()})`,
      newValues: { quotationNumber, clientName: body.clientName, totalAmount, status: 'DRAFT' },
      req,
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}
