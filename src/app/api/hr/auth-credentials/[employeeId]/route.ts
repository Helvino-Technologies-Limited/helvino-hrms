import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateSecretCode } from '@/lib/secret-code'

// POST: generate/reset secret code for an employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { employeeId } = await params

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, firstName: true, lastName: true, email: true, nationalId: true, dateOfBirth: true },
  })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  if (!employee.nationalId || !employee.dateOfBirth) {
    return NextResponse.json(
      { error: 'Employee must have National ID and Date of Birth set before generating credentials.' },
      { status: 400 }
    )
  }

  const plainCode = generateSecretCode()
  const hash = await bcrypt.hash(plainCode, 12)

  await prisma.employee.update({
    where: { id: employeeId },
    data: { secretCodeHash: hash, loginAttempts: 0, accountLockedUntil: null },
  })

  return NextResponse.json({ secretCode: plainCode, employee: { id: employee.id, name: `${employee.firstName} ${employee.lastName}` } })
}

// PATCH: lock or unlock account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { employeeId } = await params
  const body = await request.json()
  const { action } = body // 'lock' | 'unlock'

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      loginAttempts: action === 'unlock' ? 0 : 5,
      accountLockedUntil: action === 'unlock' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  return NextResponse.json({ success: true })
}
