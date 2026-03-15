import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { not: 'TERMINATED' } },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      jobTitle: true,
      nationalId: true,
      dateOfBirth: true,
      secretCodeHash: true,
      loginAttempts: true,
      accountLockedUntil: true,
      employmentStatus: true,
      department: { select: { name: true } },
      authLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, createdAt: true, ipAddress: true },
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return NextResponse.json({ employees })
}
