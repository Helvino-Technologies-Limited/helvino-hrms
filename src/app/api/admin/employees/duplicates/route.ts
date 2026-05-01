import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find employees whose full name appears more than once
    const all = await prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        employmentStatus: true,
        nationalId: true,
        email: true,
        dateHired: true,
        user: { select: { id: true, email: true, isActive: true, role: true } },
        _count: {
          select: {
            leadsAssigned: true,
            leadsCreated: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    // Group by normalised full name
    const byName: Record<string, typeof all> = {}
    for (const emp of all) {
      const key = `${emp.firstName.trim().toLowerCase()} ${emp.lastName.trim().toLowerCase()}`
      if (!byName[key]) byName[key] = []
      byName[key].push(emp)
    }

    const duplicates = Object.entries(byName)
      .filter(([, group]) => group.length > 1)
      .map(([, group]) => group)

    return NextResponse.json({ duplicates })
  } catch (error) {
    console.error('Duplicates fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch duplicates' }, { status: 500 })
  }
}
