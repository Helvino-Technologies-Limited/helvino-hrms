import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: { notIn: ['TERMINATED', 'RESIGNED'] },
      },
      include: {
        department: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true, jobTitle: true } },
      },
      orderBy: [{ employmentStatus: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('[employee-report]', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
