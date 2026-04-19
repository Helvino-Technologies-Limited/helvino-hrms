import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET  /api/admin/fix-employee-link?code=HTL0022   → diagnose one employee
// POST /api/admin/fix-employee-link  { employeeCode }  → force-fix the User→Employee link

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const code = req.nextUrl.searchParams.get('code') ?? ''

  const employee = await prisma.employee.findUnique({
    where: { employeeCode: code },
    select: {
      id: true, employeeCode: true, firstName: true, lastName: true,
      email: true, employmentStatus: true,
      user: { select: { id: true, email: true, role: true, employeeId: true } },
    },
  })

  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Find any User whose email matches employee email
  const userByEmail = await prisma.user.findUnique({
    where: { email: employee.email },
    select: { id: true, email: true, role: true, employeeId: true },
  })

  // Find leads that reference this employee's actual ID
  const leadsCreated = await prisma.lead.count({ where: { createdById: employee.id } })
  const leadsAssigned = await prisma.lead.count({ where: { assignedToId: employee.id } })

  // Find what User is currently linked to this employee (via User.employeeId = employee.id)
  const linkedUser = await prisma.user.findFirst({
    where: { employeeId: employee.id },
    select: { id: true, email: true, role: true, employeeId: true },
  })

  const issues: string[] = []
  if (!linkedUser) issues.push('No User has employeeId pointing to this Employee.id')
  if (userByEmail && userByEmail.employeeId !== employee.id) {
    issues.push(`User with matching email has employeeId="${userByEmail.employeeId}" but Employee.id="${employee.id}" — MISMATCH`)
  }
  if (!userByEmail) issues.push('No User found with same email as this Employee')

  return NextResponse.json({
    employee: { id: employee.id, code: employee.employeeCode, name: `${employee.firstName} ${employee.lastName}`, email: employee.email, status: employee.employmentStatus },
    linkedUser,
    userByEmail,
    leadsCreated,
    leadsAssigned,
    issues,
    fix: issues.length > 0
      ? { action: 'POST /api/admin/fix-employee-link', body: { employeeCode: code } }
      : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employeeCode } = await req.json()
  if (!employeeCode) return NextResponse.json({ error: 'employeeCode required' }, { status: 400 })

  const employee = await prisma.employee.findUnique({
    where: { employeeCode },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Find User by email match
  const user = await prisma.user.findUnique({
    where: { email: employee.email },
    select: { id: true, email: true, employeeId: true },
  })
  if (!user) return NextResponse.json({ error: `No User found with email ${employee.email}` }, { status: 404 })

  const wasEmployeeId = user.employeeId

  // Force-set the correct link
  await prisma.user.update({
    where: { id: user.id },
    data: { employeeId: employee.id },
  })

  return NextResponse.json({
    message: `Fixed: User ${user.email} now linked to Employee ${employee.firstName} ${employee.lastName} (${employeeCode})`,
    userId: user.id,
    employeeId: employee.id,
    previousEmployeeId: wasEmployeeId,
    changed: wasEmployeeId !== employee.id,
  })
}
