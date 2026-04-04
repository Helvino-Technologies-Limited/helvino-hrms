import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity')
    const action = searchParams.get('action')
    const employeeId = searchParams.get('employeeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    // SALES_MANAGER only sees their own team's logs
    const empId = (session.user as any).employeeId as string | undefined
    let teamEmpIds: string[] | null = null

    if (session.user.role === 'SALES_MANAGER' && empId) {
      const agents = await prisma.employee.findMany({
        where: { managerId: empId },
        select: { id: true },
      })
      teamEmpIds = [empId, ...agents.map((a) => a.id)]
    }

    const where: any = {}

    // Restrict to CRM entities only
    const CRM_ENTITIES = ['LEAD', 'LEAD_ACTIVITY', 'CLIENT', 'QUOTATION', 'SALES_TASK', 'TEAM_TASK', 'MEETING', 'SUBSCRIPTION', 'SERVICE', 'LETTER', 'PORTFOLIO', 'SALES_TARGET']
    if (entity && CRM_ENTITIES.includes(entity)) {
      where.entity = entity
    } else {
      where.entity = { in: CRM_ENTITIES }
    }

    if (action) where.action = action
    if (employeeId) {
      where.employeeId = employeeId
    } else if (teamEmpIds) {
      where.employeeId = { in: teamEmpIds }
    }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    if (search) {
      where.OR = [
        { entity: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          employee: { select: { firstName: true, lastName: true, jobTitle: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
