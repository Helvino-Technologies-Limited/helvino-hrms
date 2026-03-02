import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const [
      totalEmployees,
      activeEmployees,
      departmentDistribution,
      employmentTypeBreakdown,
      pendingLeaves,
      leavesThisMonth,
      attendanceToday,
      openJobs,
      applicantsThisMonth,
      payrollSummary,
      recentHires,
      turnoverCount,
      avgPerformanceRating,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: 'ACTIVE' } }),
      prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
      prisma.employee.groupBy({ by: ['employmentType'], _count: { employmentType: true } }),
      prisma.leave.count({ where: { status: 'PENDING' } }),
      prisma.leave.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.attendance.count({ where: { date: { gte: todayStart } } }),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.applicant.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.payroll.aggregate({
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
        _sum: { netSalary: true, grossSalary: true, paye: true },
      }),
      prisma.employee.count({ where: { dateHired: { gte: startOfMonth } } }),
      prisma.employee.count({
        where: { employmentStatus: { in: ['RESIGNED', 'TERMINATED'] }, updatedAt: { gte: startOfYear } },
      }),
      prisma.performanceReview.aggregate({ _avg: { rating: true } }),
    ])

    // Monthly headcount growth (last 12 months)
    const monthlyGrowth = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const count = await prisma.employee.count({
        where: { dateHired: { lte: new Date(date.getFullYear(), date.getMonth() + 1, 0) } },
      })
      monthlyGrowth.push({
        month: date.toLocaleString('en-KE', { month: 'short', year: '2-digit' }),
        count,
      })
    }

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      departmentDistribution: departmentDistribution.map(d => ({
        name: d.name,
        count: d._count.employees,
      })),
      employmentTypeBreakdown: employmentTypeBreakdown.map(e => ({
        type: e.employmentType,
        count: (e._count as any).employmentType,
      })),
      pendingLeaves,
      leavesThisMonth,
      attendanceToday,
      openJobs,
      applicantsThisMonth,
      payrollSummary: payrollSummary._sum,
      recentHires,
      turnoverRate: totalEmployees > 0 ? parseFloat(((turnoverCount / totalEmployees) * 100).toFixed(1)) : 0,
      avgPerformanceRating: parseFloat((avgPerformanceRating._avg.rating || 0).toFixed(1)),
      monthlyGrowth,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
