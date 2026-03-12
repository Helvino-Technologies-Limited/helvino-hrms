import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all active policies with their latest versions and acceptances
    const policies = await prisma.policy.findMany({
      where: { status: 'ACTIVE' },
      include: {
        versions: {
          where: { isLatest: true },
          include: {
            acceptances: {
              include: {
                employee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    jobTitle: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    })

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { employmentStatus: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        department: { select: { name: true } },
      },
    })

    // Build compliance matrix
    const complianceData = policies.map(policy => {
      const latestVersion = policy.versions[0]
      if (!latestVersion) {
        return {
          policy: { id: policy.id, title: policy.title, policyType: policy.policyType },
          totalEmployees: employees.length,
          accepted: 0,
          pending: employees.length,
          acceptanceRate: 0,
          acceptances: [],
        }
      }

      const acceptedEmployeeIds = new Set(
        latestVersion.acceptances.filter(a => a.accepted).map(a => a.employeeId)
      )

      const acceptanceDetails = employees.map(emp => ({
        employee: emp,
        accepted: acceptedEmployeeIds.has(emp.id),
        acceptedAt: latestVersion.acceptances.find(a => a.employeeId === emp.id)?.acceptedAt || null,
      }))

      return {
        policy: { id: policy.id, title: policy.title, policyType: policy.policyType },
        versionNumber: latestVersion.versionNumber,
        totalEmployees: employees.length,
        accepted: acceptedEmployeeIds.size,
        pending: employees.length - acceptedEmployeeIds.size,
        acceptanceRate: employees.length > 0 ? Math.round((acceptedEmployeeIds.size / employees.length) * 100) : 0,
        acceptances: acceptanceDetails,
      }
    })

    const overallAccepted = complianceData.reduce((sum, p) => sum + p.accepted, 0)
    const overallTotal = complianceData.reduce((sum, p) => sum + p.totalEmployees, 0)

    return NextResponse.json({
      summary: {
        totalPolicies: policies.length,
        totalEmployees: employees.length,
        overallAccepted,
        overallPending: overallTotal - overallAccepted,
        overallRate: overallTotal > 0 ? Math.round((overallAccepted / overallTotal) * 100) : 0,
      },
      policies: complianceData,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch compliance data' }, { status: 500 })
  }
}
