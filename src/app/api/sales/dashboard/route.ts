import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const VIEW_ALL = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']
    const empId = (session.user as any).employeeId as string | undefined

    // Build scoped filters for each entity
    const leadFilter: any = {}
    const quotationFilter: any = {}
    const clientFilter: any = {}
    const taskFilter: any = {}
    const subscriptionFilter: any = {}

    if (!VIEW_ALL.includes(session.user.role) && empId) {
      leadFilter.OR = [{ assignedToId: empId }, { createdById: empId }]
      quotationFilter.createdById = empId
      clientFilter.OR = [{ assignedToId: empId }, { createdById: empId }]
      taskFilter.assignedToId = empId
      subscriptionFilter.client = { OR: [{ assignedToId: empId }, { createdById: empId }] }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
      revenueAgg,
      expiringSubscriptions,
      expiredSubscriptions,
      todayTasks,
      overdueTasks,
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
      prisma.quotation.aggregate({
        where: { ...quotationFilter, status: 'APPROVED' },
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

    const leadsByStatus = leadsByStatusRaw.map((row) => ({
      status: row.status,
      count: row._count.status,
    }))

    const leadsBySource = leadsBySourceRaw.map((row) => ({
      source: row.source,
      count: row._count.source,
    }))

    const monthlyLeads = monthBuckets.map((bucket, i) => ({
      month: bucket.label,
      count: monthlyLeadCounts[i] as number,
    }))

    return NextResponse.json({
      totalLeads,
      newLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      totalClients,
      totalQuotations,
      pendingQuotations,
      approvedQuotations,
      totalRevenue: revenueAgg._sum.totalAmount ?? 0,
      expiringSubscriptions,
      expiredSubscriptions,
      todayTasks,
      overdueTasks,
      recentLeads,
      recentClients,
      leadsByStatus,
      leadsBySource,
      monthlyLeads,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
