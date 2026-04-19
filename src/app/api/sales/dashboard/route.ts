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

    const VIEW_ALL = ['SUPER_ADMIN', 'HR_MANAGER', 'HEAD_OF_SALES']
    const IS_MANAGER = role === 'SALES_MANAGER'
    const IS_AGENT = role === 'SALES_AGENT'
    const IS_HEAD_OF_SALES = role === 'HEAD_OF_SALES'

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

      // If no agents are formally assigned yet, manager sees all sales data
      // (same as SUPER_ADMIN/HR_MANAGER) so the dashboard is never empty.
      // Once agents are linked via managerId the filter becomes team-scoped.
      if (agents.length > 0) {
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
      }
      // else: no agents linked yet → leave filters empty → see all sales data
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
          createdBy: { select: { firstName: true, lastName: true } },
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

    // Targets per role — read from DB (admin-configurable)
    const [agentTargetRow, managerTargetRow, personalTargetRow] = await Promise.all([
      prisma.salesTarget.findUnique({ where: { role: 'SALES_AGENT' } }),
      prisma.salesTarget.findUnique({ where: { role: 'SALES_MANAGER' } }),
      empId ? prisma.salesEmployeeTarget.findUnique({ where: { employeeId: empId } }) : Promise.resolve(null),
    ])
    const agentLeadTarget     = agentTargetRow?.leadTarget    ?? 10
    const agentClientTarget   = agentTargetRow?.clientTarget   ?? 5
    const agentRevenueTarget  = agentTargetRow?.revenueTarget  ?? 250000
    const mgLeadTarget        = managerTargetRow?.leadTarget   ?? 20
    const mgClientTarget      = managerTargetRow?.clientTarget  ?? 10
    const mgRevenueTarget     = managerTargetRow?.revenueTarget ?? 500000

    // Per-employee override takes priority over role default
    let leadTarget = 0
    let clientTarget = 0
    let revenueTarget = 0
    if (IS_AGENT) {
      leadTarget    = personalTargetRow?.leadTarget    ?? agentLeadTarget
      clientTarget  = personalTargetRow?.clientTarget  ?? agentClientTarget
      revenueTarget = personalTargetRow?.revenueTarget ?? agentRevenueTarget
    } else if (IS_MANAGER) {
      leadTarget    = personalTargetRow?.leadTarget    ?? mgLeadTarget
      clientTarget  = personalTargetRow?.clientTarget  ?? mgClientTarget
      revenueTarget = personalTargetRow?.revenueTarget ?? mgRevenueTarget
    }

    const revenueThisMonth = revenueThisMonthAgg._sum.totalAmount ?? 0
    const totalRevenue = revenueAgg._sum.totalAmount ?? 0

    // Manager's personal target stats (their own contribution, separate from team)
    let managerPersonalLeads = 0
    let managerPersonalClients = 0
    let managerPersonalRevenue = 0
    if (IS_MANAGER && empId) {
      const [mgLeads, mgClients, mgRevenue] = await Promise.all([
        prisma.lead.count({
          where: { createdById: empId, createdAt: { gte: monthStart, lt: monthEnd } },
        }),
        prisma.client.count({
          where: { createdById: empId, createdAt: { gte: monthStart, lt: monthEnd } },
        }),
        prisma.quotation.aggregate({
          where: { createdById: empId, status: 'APPROVED', createdAt: { gte: monthStart, lt: monthEnd } },
          _sum: { totalAmount: true },
        }),
      ])
      managerPersonalLeads = mgLeads
      managerPersonalClients = mgClients
      managerPersonalRevenue = Number(mgRevenue._sum.totalAmount ?? 0)
    }

    // Per-agent team performance (SALES_MANAGER only)
    let teamPerformance: Array<{
      id: string
      name: string
      leadsThisMonth: number
      clientsThisMonth: number
      revenueThisMonth: number
      leadTarget: number
      clientTarget: number
      revenueTarget: number
    }> = []

    // Applicant stats for managers
    let applicantStats: { total: number; newThisWeek: number; shortlisted: number; hired: number; byStatus: Record<string, number> } | null = null

    if (IS_MANAGER && empId) {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const [totalApplicants, newApplicantsThisWeek, shortlistedApplicants, hiredApplicants, applicantsByStatus] = await Promise.all([
        prisma.applicant.count({ where: { salesManagerId: empId } }),
        prisma.applicant.count({ where: { salesManagerId: empId, createdAt: { gte: weekAgo } } }),
        prisma.applicant.count({ where: { salesManagerId: empId, status: 'SHORTLISTED' } }),
        prisma.applicant.count({ where: { salesManagerId: empId, status: 'HIRED' } }),
        prisma.applicant.groupBy({ by: ['status'], where: { salesManagerId: empId }, _count: { status: true } }),
      ])
      const byStatus: Record<string, number> = {}
      applicantsByStatus.forEach(r => { byStatus[r.status] = r._count.status })
      applicantStats = { total: totalApplicants, newThisWeek: newApplicantsThisWeek, shortlisted: shortlistedApplicants, hired: hiredApplicants, byStatus }
    }

    // If no agents are formally assigned, show all SALES_AGENT employees as the team
    if (IS_MANAGER && teamAgents.length === 0) {
      const allAgents = await prisma.employee.findMany({
        where: { user: { role: 'SALES_AGENT' } },
        select: { id: true, firstName: true, lastName: true },
      })
      teamAgents = allAgents
    }

    if (IS_MANAGER && teamAgents.length > 0) {
      const agentIds = teamAgents.map((a) => a.id)
      const [agentLeadCounts, agentClientCounts, agentRevenueSums, agentEmpTargets] = await Promise.all([
        prisma.lead.groupBy({
          by: ['createdById'],
          where: { createdById: { in: agentIds }, createdAt: { gte: monthStart, lt: monthEnd } },
          _count: { id: true },
        }),
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
        prisma.salesEmployeeTarget.findMany({
          where: { employeeId: { in: agentIds } },
          select: { employeeId: true, leadTarget: true, clientTarget: true, revenueTarget: true },
        }),
      ])

      const leadCountMap = new Map(agentLeadCounts.map((r) => [r.createdById, r._count.id]))
      const clientCountMap = new Map(agentClientCounts.map((r) => [r.createdById, r._count.id]))
      const revenueMap = new Map(agentRevenueSums.map((r) => [r.createdById, r._sum.totalAmount ?? 0]))
      const empTargetMap = new Map(agentEmpTargets.map((t) => [t.employeeId, t]))

      teamPerformance = teamAgents.map((agent) => {
        const override = empTargetMap.get(agent.id)
        return {
          id: agent.id,
          name: `${agent.firstName} ${agent.lastName}`,
          leadsThisMonth: leadCountMap.get(agent.id) ?? 0,
          clientsThisMonth: clientCountMap.get(agent.id) ?? 0,
          revenueThisMonth: Number(revenueMap.get(agent.id) ?? 0),
          leadTarget: override?.leadTarget ?? agentLeadTarget,
          clientTarget: override?.clientTarget ?? agentClientTarget,
          revenueTarget: override?.revenueTarget ?? agentRevenueTarget,
        }
      })
    }

    // VIEW_ALL roles: build per-agent performance breakdown (all agents)
    const IS_VIEW_ALL = VIEW_ALL.includes(role)
    let agentsPerformance: Array<{
      id: string; name: string; totalLeads: number; leadsThisMonth: number;
      activeClients: number; paidClients: number; revenueTotal: number;
    }> = []

    if (IS_VIEW_ALL) {
      const allAgents = await prisma.employee.findMany({
        where: { user: { role: 'SALES_AGENT' } },
        select: { id: true, firstName: true, lastName: true },
      })
      if (allAgents.length > 0) {
        const agentIds = allAgents.map((a) => a.id)
        const [
          agentTotalLeads,
          agentMonthLeads,
          agentActiveClients,
          agentPaidClients,
          agentRevenue,
        ] = await Promise.all([
          prisma.lead.groupBy({ by: ['createdById'], where: { createdById: { in: agentIds } }, _count: { id: true } }),
          prisma.lead.groupBy({ by: ['createdById'], where: { createdById: { in: agentIds }, createdAt: { gte: monthStart, lt: monthEnd } }, _count: { id: true } }),
          prisma.client.groupBy({ by: ['createdById'], where: { createdById: { in: agentIds }, isActive: true }, _count: { id: true } }),
          prisma.client.groupBy({
            by: ['createdById'],
            where: {
              createdById: { in: agentIds },
              invoices: { some: { status: 'PAID' } },
            },
            _count: { id: true },
          }),
          prisma.quotation.groupBy({
            by: ['createdById'],
            where: { createdById: { in: agentIds }, status: 'APPROVED' },
            _sum: { totalAmount: true },
          }),
        ])
        const totalLeadMap = new Map(agentTotalLeads.map((r) => [r.createdById, r._count.id]))
        const monthLeadMap = new Map(agentMonthLeads.map((r) => [r.createdById, r._count.id]))
        const activeClientMap = new Map(agentActiveClients.map((r) => [r.createdById, r._count.id]))
        const paidClientMap = new Map(agentPaidClients.map((r) => [r.createdById, r._count.id]))
        const revenueMap = new Map(agentRevenue.map((r) => [r.createdById, Number(r._sum.totalAmount ?? 0)]))
        agentsPerformance = allAgents.map((a) => ({
          id: a.id,
          name: `${a.firstName} ${a.lastName}`,
          totalLeads: totalLeadMap.get(a.id) ?? 0,
          leadsThisMonth: monthLeadMap.get(a.id) ?? 0,
          activeClients: activeClientMap.get(a.id) ?? 0,
          paidClients: paidClientMap.get(a.id) ?? 0,
          revenueTotal: revenueMap.get(a.id) ?? 0,
        }))
      }
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
      target: (clientTarget > 0 || leadTarget > 0)
        ? {
            leadTarget,
            clientTarget,
            revenueTarget,
            leadsThisMonth,
            clientsThisMonth,
            revenueThisMonth,
            teamSize: IS_MANAGER ? teamEmpIds.length : undefined,
          }
        : null,
      managerTarget: IS_MANAGER ? {
        leadTarget,
        clientTarget,
        revenueTarget,
        leadsThisMonth: managerPersonalLeads,
        clientsThisMonth: managerPersonalClients,
        revenueThisMonth: managerPersonalRevenue,
        leadsRemaining: Math.max(0, leadTarget - managerPersonalLeads),
        clientsRemaining: Math.max(0, clientTarget - managerPersonalClients),
        revenueRemaining: Math.max(0, revenueTarget - managerPersonalRevenue),
      } : undefined,
      teamPerformance: IS_MANAGER ? teamPerformance : undefined,
      applicantStats: IS_MANAGER ? applicantStats : undefined,
      activeAgentsCount: IS_MANAGER ? teamAgents.length : undefined,
      agentsPerformance: IS_VIEW_ALL ? agentsPerformance : undefined,
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
