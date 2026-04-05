import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']
const SALES_ROLES_WITH_TARGETS = ['SALES_AGENT', 'SALES_MANAGER']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const isAdmin = ADMIN_ROLES.includes(session.user.role)

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true, lastName: true, employeeCode: true,
            email: true, phone: true, nationalId: true, kraPin: true,
            nssfNumber: true, shaNumber: true,
            bankName: true, bankBranch: true, bankCode: true,
            bankAccount: true, mpesaPhone: true, dateHired: true,
            jobTitle: true,
            department: { select: { name: true } },
            user: { select: { role: true } },
          },
        },
      },
    })

    if (!payroll) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Non-admins can only access their own payslip
    if (!isAdmin) {
      const freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { employeeId: true },
      })
      const empId = freshUser?.employeeId ?? (session.user as any).employeeId
      if (payroll.employeeId !== empId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Attach sales performance if employee is a sales role with targets
    let salesPerformance = null
    const empRole = payroll.employee.user?.role ?? ''
    if (SALES_ROLES_WITH_TARGETS.includes(empRole)) {
      const monthStart = new Date(payroll.year, payroll.month - 1, 1)
      const monthEnd   = new Date(payroll.year, payroll.month, 1)

      const [personalTarget, roleTarget, clientsRaw, revenueAgg] = await Promise.all([
        prisma.salesEmployeeTarget.findUnique({ where: { employeeId: payroll.employeeId } }),
        prisma.salesTarget.findUnique({ where: { role: empRole } }),
        prisma.client.findMany({
          where: { createdById: payroll.employeeId, createdAt: { gte: monthStart, lt: monthEnd } },
          select: { companyName: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.quotation.aggregate({
          where: {
            createdById: payroll.employeeId,
            status: 'APPROVED',
            createdAt: { gte: monthStart, lt: monthEnd },
          },
          _sum: { totalAmount: true },
        }),
      ])

      const defaultClient  = empRole === 'SALES_MANAGER' ? 10 : 5
      const defaultRevenue = empRole === 'SALES_MANAGER' ? 500000 : 250000
      const clientTarget   = personalTarget?.clientTarget  ?? roleTarget?.clientTarget  ?? defaultClient
      const revenueTarget  = personalTarget?.revenueTarget ?? roleTarget?.revenueTarget ?? defaultRevenue
      const clientsAchieved  = clientsRaw.length
      const revenueAchieved  = Number(revenueAgg._sum.totalAmount ?? 0)

      salesPerformance = {
        clientTarget,
        revenueTarget,
        clientsAchieved,
        revenueAchieved,
        targetMet: clientsAchieved >= clientTarget && revenueAchieved >= revenueTarget,
        clientsDetails: clientsRaw.map(c => ({
          companyName: c.companyName,
          createdAt: c.createdAt.toISOString(),
        })),
      }
    }

    return NextResponse.json({ ...payroll, salesPerformance })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 })
  }
}
