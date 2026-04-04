import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role
    const empId = (session.user as any).employeeId as string | undefined

    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!empId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    // Build agent filter
    const agentWhere: any = { user: { role: 'SALES_AGENT' } }
    if (role === 'SALES_MANAGER') {
      agentWhere.managerId = empId
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const agents = await prisma.employee.findMany({
      where: agentWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        phone: true,
        email: true,
        employmentStatus: true,
        dateHired: true,
        passportPhotoUrl: true,
        _count: {
          select: {
            leadsAssigned: true,
            clientsAssigned: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    })

    // Get monthly performance for each agent
    const agentIds = agents.map(a => a.id)
    const [agentClientCounts, agentRevenueSums] = agentIds.length > 0
      ? await Promise.all([
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
      : [[], []]

    const clientCountMap = new Map((agentClientCounts as any[]).map(r => [r.createdById, r._count.id]))
    const revenueMap = new Map((agentRevenueSums as any[]).map(r => [r.createdById, r._sum.totalAmount ?? 0]))

    const team = agents.map(agent => ({
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      jobTitle: agent.jobTitle,
      phone: agent.phone,
      email: agent.email,
      employmentStatus: agent.employmentStatus,
      dateHired: agent.dateHired,
      passportPhotoUrl: agent.passportPhotoUrl,
      totalLeads: agent._count.leadsAssigned,
      totalClients: agent._count.clientsAssigned,
      clientsThisMonth: clientCountMap.get(agent.id) ?? 0,
      revenueThisMonth: Number(revenueMap.get(agent.id) ?? 0),
    }))

    // Applicants scoped to this manager
    const applicantWhere: any = {}
    if (role === 'SALES_MANAGER') {
      applicantWhere.salesManagerId = empId
    }

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [applicants, applicantsByStatus, newApplicantsThisWeek] = await Promise.all([
      prisma.applicant.findMany({
        where: applicantWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          score: true,
          currentCompany: true,
          experienceYears: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.applicant.groupBy({
        by: ['status'],
        where: applicantWhere,
        _count: { status: true },
      }),
      prisma.applicant.count({ where: { ...applicantWhere, createdAt: { gte: weekAgo } } }),
    ])

    const byStatus: Record<string, number> = {}
    applicantsByStatus.forEach((r: any) => { byStatus[r.status] = r._count.status })

    return NextResponse.json({
      team,
      applicants,
      applicantStats: {
        total: applicants.length,
        newThisWeek: newApplicantsThisWeek,
        byStatus,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 })
  }
}
