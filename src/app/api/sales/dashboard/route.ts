import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Always fetch the current role and employeeId from the DB using the
    // user's primary key — this is immune to stale JWT tokens.
    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, employeeId: true },
    })

    const role: string = (freshUser?.role as string) ?? session.user.role
    const empId: string | undefined = freshUser?.employeeId ?? (session.user as any).employeeId

    const VIEW_ALL = ['SUPER_ADMIN', 'HR_MANAGER']
    const IS_MANAGER = role === 'SALES_MANAGER'
    const IS_AGENT = role === 'SALES_AGENT'

    // Build scoped filters for each entity
    const leadFilter: any = {}
    const quotationFilter: any = {}
    const clientFilter: any = {}
    const taskFilter: any = {}
    const subscriptionFilter: any = {}

    let teamEmpIds: string[] = []
    let teamAgents: { id: string; firstName: string; lastName: string }[] = []

    if (IS_MANAGER && empId) {
      // Manager sees own + all agents assigned to them
      const agents = await prisma.employee.findMany({
        where: { managerId: empId },
        select: { id: true, firstName: true, lastName: true },
      })
      teamAgents = agents
      teamEmpIds = [empId, ...agents.map((a) => a.id)]
      leadFilter.OR = [
        { assignedToId: { in: teamEmpIds } },
        { createdById: { in: teamEmpIds } },
      ]
      quotationFilter.createdById = { in: teamEmpIds }
      clientFilter.OR = [
        { assignedToId: { in: teamEmpIds } },
        { createdById: { in: teamEmpIds } },
      ]
      taskFilter.assignedToId = { in: teamEmpIds }
      subscriptionFilter.client = {
        OR: [
          { assignedToId: { in: teamEmpIds } },
          { createdById: { in: teamEmpIds } },
        ],
      }
    } else if (IS_AGENT && empId) {
      leadFilter.OR = [{ assignedToId: empId }, { createdById: empId }]
      quotationFilter.createdById = empId
      clientFilter.OR = [{ assignedToId: empId }, { createdById: empId }]
      taskFilter.assignedToId = empId
      subscriptionFilter.client = { OR: [{ assignedToId: empId }, { createdById: empId }] }
    }
    // SUPER_ADMIN, HR_MANAGER, FINANCE_OFFICER see everything (no filters)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Build month buckets for last 6 months
    const monthBuckets: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const label = start.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthBuckets.push({ label, start, end })
    }

    const [
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      totalClients,
      totalQuotations,
      pendingQuotations,
      approvedQuotations,
      totalTasks,
      revenueAgg,
      revenueThisMonthAgg,
      expiringSubscriptions,
      expiredSubscriptions,
      todayTasks,
      overdueTasks,
      leadsThisMonth,
      clientsThisMonth,
      quotationsThisMonth,
      recentLeads,
      recentClients,
      leadsByStatusRaw,
      leadsBySourceRaw,
      ...monthlyLeadCounts
    ] = await Promise.all([
      prisma.lead.count({ where: leadFilter }),
      prisma.lead.count({ where: { ...leadFilter, status: 'NEW' } }),
      prisma.lead.count({ where: { ...leadFilter, status: 'WON' } }),
      prisma.lead.count({ where: { ...leadFilter, status: 'LOST' } }),
      prisma.lead.count({ where: { ...leadFilter, status: { notIn: ['WON', 'LOST'] } } }),
      prisma.client.count({ where: { ...clientFilter, isActive: true } }),
      prisma.quotation.count({ where: quotationFilter }),
      prisma.quotation.count({ where: { ...quotationFilter, status: { in: ['DRAFT', 'SENT'] } } }),
      prisma.quotation.count({ where: { ...quotationFilter, status: 'APPROVED' } }),
      prisma.salesTask.count({ where: taskFilter }),
      prisma.quotation.aggregate({
        where: { ...quotationFilter, status: 'APPROVED' },
        _sum: { totalAmount: true },
      }),
      prisma.quotation.aggregate({
        where: { ...quotationFilter, status: 'APPROVED', createdAt: { gte: monthStart, lt: monthEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.subscription.count({
        where: {
          ...subscriptionFilter,
          status: 'ACTIVE',
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.subscription.count({ where: { ...subscriptionFilter, status: 'EXPIRED' } }),
      prisma.salesTask.count({
        where: {
          ...taskFilter,
          deadline: { gte: today, lt: tomorrow },
          status: { notIn: ['DONE'] },
        },
      }),
      prisma.salesTask.count({
        where: {
          ...taskFilter,
          deadline: { lt: today },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
      prisma.lead.count({
        where: { ...leadFilter, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.client.count({
        where: { ...clientFilter, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.quotation.count({
        where: { ...quotationFilter, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.lead.findMany({
        take: 5,
        where: leadFilter,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.client.findMany({
        take: 5,
        where: { ...clientFilter, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: leadFilter,
        _count: { status: true },
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: leadFilter,
        _count: { source: true },
      }),
      ...monthBuckets.map((bucket) =>
        prisma.lead.count({
          where: {
            ...leadFilter,
            createdAt: { gte: bucket.start, lt: bucket.end },
          },
        })
      ),
    ])

    const statusBreakdown = leadsByStatusRaw.map((row) => ({
      status: row.status,
      count: row._count.status,
    }))

    const leadSources = leadsBySourceRaw.map((row) => ({
      source: row.source,
      count: row._count.source,
    }))

    const monthlyLeads = monthBuckets.map((bucket, i) => ({
      month: bucket.label,
      count: monthlyLeadCounts[i] as number,
    }))

    // Targets per role
    let clientTarget = 0
    let revenueTarget = 0
    if (IS_AGENT) {
      clientTarget = 5
      revenueTarget = 150000
    } else if (IS_MANAGER) {
      clientTarget = 10
      revenueTarget = 500000
    }

    const revenueThisMonth = revenueThisMonthAgg._sum.totalAmount ?? 0
    const totalRevenue = revenueAgg._sum.totalAmount ?? 0

    // Per-agent team performance (SALES_MANAGER only)
    let teamPerformance: Array<{
      id: string
      name: string
      clientsThisMonth: number
      revenueThisMonth: number
      clientTarget: number
      revenueTarget: number
    }> = []

    if (IS_MANAGER && teamAgents.length > 0) {
      const agentIds = teamAgents.map((a) => a.id)
      const [agentClientCounts, agentRevenueSums] = await Promise.all([
        prisma.client.groupBy({
          by: ['createdById'],
          where: { createdById: { in: agentIds }, createdAt: { gte: monthStart, lt: monthEnd } },
          _count: { id: true },
        }),
        prisma.quotation.groupBy({
          by: ['createdById'],
          where: { createdById: { in: agentIds }, status: 'APPROVED', createdAt: { gte: monthStart, lt: monthEnd } },
          _sum: { totalAmount: true },
        }),
      ])

      const clientCountMap = new Map(agentClientCounts.map((r) => [r.createdById, r._count.id]))
      const revenueMap = new Map(agentRevenueSums.map((r) => [r.createdById, r._sum.totalAmount ?? 0]))

      teamPerformance = teamAgents.map((agent) => ({
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        clientsThisMonth: clientCountMap.get(agent.id) ?? 0,
        revenueThisMonth: Number(revenueMap.get(agent.id) ?? 0),
        clientTarget: 5,
        revenueTarget: 250000,
      }))
    }

    return NextResponse.json({
      role: IS_MANAGER ? 'SALES_MANAGER' : IS_AGENT ? 'SALES_AGENT' : role,
      stats: {
        totalLeads,
        wonDeals: wonLeads,
        lostLeads,
        activeLeads,
        activeClients: totalClients,
        expiringSubscriptions,
        totalRevenue,
        totalQuotations,
        approvedQuotations,
      },
      quick: {
        todaysTasks: todayTasks,
        overdueTasks,
        pendingQuotations,
        newLeads,
        leadsThisMonth,
        clientsThisMonth,
        quotationsThisMonth,
        revenueThisMonth,
      },
      target: clientTarget > 0
        ? {
            clientTarget,
            revenueTarget,
            clientsThisMonth,
            revenueThisMonth,
            teamSize: IS_MANAGER ? teamEmpIds.length : undefined,
          }
        : null,
      teamPerformance: IS_MANAGER ? teamPerformance : undefined,
      recentLeads,
      recentClients,
      statusBreakdown,
      leadSources,
      monthlyLeads,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
