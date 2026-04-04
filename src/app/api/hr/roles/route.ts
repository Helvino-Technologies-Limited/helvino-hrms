import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

const VALID_ROLES = [
  'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER',
  'EMPLOYEE', 'SALES_MANAGER', 'SALES_AGENT', 'HEAD_OF_SALES',
]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''

    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: { not: 'TERMINATED' },
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
            { jobTitle: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(roleFilter && {
          user: { role: roleFilter as any },
        }),
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        profilePhoto: true,
        employmentStatus: true,
        department: { select: { name: true } },
        user: { select: { id: true, role: true, isActive: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('HR roles fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { employeeId, role } = body

    if (!employeeId || !role) {
      return NextResponse.json({ error: 'employeeId and role are required' }, { status: 400 })
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent SUPER_ADMIN from being demoted by HR_MANAGER
    if (session.user.role === 'HR_MANAGER' && role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'HR Managers cannot assign SUPER_ADMIN role' }, { status: 403 })
    }

    const updated = await prisma.user.updateMany({
      where: { employeeId },
      data: { role: role as any },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'No user account found for this employee' }, { status: 404 })
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: employeeId,
        newValues: { role, changedBy: session.user.id },
      },
    })

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('HR role change error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
