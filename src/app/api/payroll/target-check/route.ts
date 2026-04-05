import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SALES_ROLES_WITH_TARGETS = ['SALES_AGENT', 'SALES_MANAGER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') ?? '0')
    const year = parseInt(searchParams.get('year') ?? '0')

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 })
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, employeeId: true },
    })

    const role: string = (freshUser?.role as string) ?? session.user.role
    const empId: string | null = freshUser?.employeeId ?? (session.user as any).employeeId ?? null

    // Only sales roles with configured targets are subject to the payslip gate
    if (!SALES_ROLES_WITH_TARGETS.includes(role)) {
      return NextResponse.json({ isSalesRole: false, hasTarget: false, targetMet: true })
    }

    if (!empId) {
      return NextResponse.json({ isSalesRole: true, hasTarget: false, targetMet: true })
    }

    // Resolve target: personal override takes priority over role default
    const [personalTarget, roleTarget] = await Promise.all([
      prisma.salesEmployeeTarget.findUnique({ where: { employeeId: empId } }),
      prisma.salesTarget.findUnique({ where: { role } }),
    ])

    const defaultClientTarget  = role === 'SALES_MANAGER' ? 10 : 5
    const defaultRevenueTarget = role === 'SALES_MANAGER' ? 500000 : 250000

    const clientTarget  = personalTarget?.clientTarget  ?? roleTarget?.clientTarget  ?? defaultClientTarget
    const revenueTarget = personalTarget?.revenueTarget ?? roleTarget?.revenueTarget ?? defaultRevenueTarget

    // Target period: 1st of month to last day of month
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 1) // exclusive upper bound

    // Last day of the month (for display)
    const lastDay = new Date(year, month, 0).getDate()
    const targetPeriodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Clients acquired during the target month
    const [clientsAchievedRaw, revenueAgg] = await Promise.all([
      prisma.client.count({
        where: {
          createdById: empId,
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.quotation.aggregate({
        where: {
          createdById: empId,
          status: 'APPROVED',
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
    ])

    const clientsAchieved  = clientsAchievedRaw
    const revenueAchieved  = Number(revenueAgg._sum.totalAmount ?? 0)

    const targetMet =
      clientsAchieved >= clientTarget && revenueAchieved >= revenueTarget

    return NextResponse.json({
      isSalesRole: true,
      hasTarget: true,
      targetMet,
      clientTarget,
      revenueTarget,
      clientsAchieved,
      revenueAchieved,
      targetPeriodEnd,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to check target' }, { status: 500 })
  }
}
