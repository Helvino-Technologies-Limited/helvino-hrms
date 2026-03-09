import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      // totalLeads
      prisma.lead.count(),

      // newLeads (status = NEW)
      prisma.lead.count({ where: { status: 'NEW' } }),

      // wonLeads
      prisma.lead.count({ where: { status: 'WON' } }),

      // lostLeads
      prisma.lead.count({ where: { status: 'LOST' } }),

      // activeLeads (not WON or LOST)
      prisma.lead.count({
        where: { status: { notIn: ['WON', 'LOST'] } },
      }),

      // totalClients (active)
      prisma.client.count({ where: { isActive: true } }),

      // totalQuotations
      prisma.quotation.count(),

      // pendingQuotations (DRAFT + SENT)
      prisma.quotation.count({
        where: { status: { in: ['DRAFT', 'SENT'] } },
      }),

      // approvedQuotations
      prisma.quotation.count({ where: { status: 'APPROVED' } }),

      // totalRevenue — sum of approved quotation totalAmount
      prisma.quotation.aggregate({
        where: { status: 'APPROVED' },
        _sum: { totalAmount: true },
      }),

      // expiringSubscriptions (within 30 days, still ACTIVE)
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          expiryDate: { gte: now, lte: in30Days },
        },
      }),

      // expiredSubscriptions
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),

      // todayTasks (deadline = today, not DONE)
      prisma.salesTask.count({
        where: {
          deadline: { gte: today, lt: tomorrow },
          status: { notIn: ['DONE'] },
        },
      }),

      // overdueTasks (deadline < today, not DONE or CANCELLED)
      prisma.salesTask.count({
        where: {
          deadline: { lt: today },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),

      // recentLeads — last 5 with assignedTo
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),

      // recentClients — last 5
      prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { isActive: true },
      }),

      // leadsByStatus
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // leadsBySource
      prisma.lead.groupBy({
        by: ['source'],
        _count: { source: true },
      }),

      // monthly lead counts — one query per bucket (6 total, spread via Promise.all)
      ...monthBuckets.map((bucket) =>
        prisma.lead.count({
          where: {
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
