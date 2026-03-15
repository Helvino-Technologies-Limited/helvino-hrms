import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const employees = await prisma.employee.findMany({
    where: {
      employmentStatus: { not: 'TERMINATED' },
      user: null,
    },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      nationalId: true,
      dateOfBirth: true,
      department: { select: { name: true } },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return NextResponse.json(employees)
}
