import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSalesScope, buildOwnerFilter } from '@/lib/sales-scope'
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

    const ownerFilter = buildOwnerFilter(scope)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const source = searchParams.get('source')
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search')

    const where: any = { ...ownerFilter }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (source) where.source = source
    if (assignedToId) where.assignedToId = assignedToId
    if (search) {
      // Use AND to combine scope filter with search — avoids overwriting ownerFilter.OR
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { contactPerson: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { leadNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
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

    // Duplicate detection: check by email or phone (if provided)
    const duplicateChecks: any[] = []
    if (body.email?.trim()) duplicateChecks.push({ email: { equals: body.email.trim(), mode: 'insensitive' } })
    if (body.phone?.trim()) duplicateChecks.push({ phone: body.phone.trim() })

    if (duplicateChecks.length > 0) {
      const existing = await prisma.lead.findFirst({
        where: { OR: duplicateChecks },
        select: { leadNumber: true, contactPerson: true },
      })
      if (existing) {
        return NextResponse.json(
          { error: `A lead with this email or phone already exists (${existing.leadNumber} — ${existing.contactPerson})` },
          { status: 409 }
        )
      }
    }

    const last = await prisma.lead.findFirst({
      orderBy: { leadNumber: 'desc' },
      select: { leadNumber: true },
    })
    const lastNum = last ? parseInt(last.leadNumber.replace('LEAD-', ''), 10) : 0
    const leadNumber = `LEAD-${String(lastNum + 1).padStart(4, '0')}`

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        companyName: body.companyName || null,
        contactPerson: body.contactPerson,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        location: body.location || null,
        industry: body.industry || null,
        source: body.source || 'WEBSITE',
        services: body.services || [],
        priority: body.priority || 'MEDIUM',
        status: body.status || 'NEW',
        notes: body.notes || null,
        expectedValue: body.expectedValue ? parseFloat(body.expectedValue) : null,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        assignedToId: body.assignedToId || null,
        createdById: scope.empId || null,
      },
    })

    logAudit({
      employeeId: scope.empId,
      action: 'CREATED',
      entity: 'LEAD',
      entityId: lead.id,
      label: `${lead.leadNumber} — ${lead.contactPerson}${lead.companyName ? ` (${lead.companyName})` : ''}`,
      newValues: { leadNumber: lead.leadNumber, contactPerson: lead.contactPerson, companyName: lead.companyName, status: lead.status, priority: lead.priority, source: lead.source },
      req,
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Failed to create lead' }, { status: 500 })
  }
}
