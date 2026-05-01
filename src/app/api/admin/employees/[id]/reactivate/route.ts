import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, isActive: true } } },
    })

    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const previousStatus = employee.employmentStatus

    await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: {
          employmentStatus: 'ACTIVE',
          loginAttempts: 0,
          accountLockedUntil: null,
        },
      }),
      ...(employee.user
        ? [prisma.user.update({
            where: { id: employee.user.id },
            data: { isActive: true },
          })]
        : []),
    ])

    await prisma.auditLog.create({
      data: {
        action: 'REACTIVATE',
        entity: 'Employee',
        entityId: id,
        newValues: {
          employmentStatus: 'ACTIVE',
          previousStatus,
          reactivatedBy: session.user.id,
        },
      },
    })

    return NextResponse.json({
      message: `${employee.firstName} ${employee.lastName} has been reactivated.`,
      previousStatus,
    })
  } catch (error) {
    console.error('Reactivate employee error:', error)
    return NextResponse.json({ error: 'Failed to reactivate employee' }, { status: 500 })
  }
}
