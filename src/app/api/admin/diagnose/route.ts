import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin-only endpoint: diagnose and optionally repair a user–employee link
// GET  /api/admin/diagnose?name=joseph+waithaka   → show diagnostic
// POST /api/admin/diagnose  body: { userId, employeeId }  → force-link user to employee

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const name = req.nextUrl.searchParams.get('name') ?? ''
  const parts = name.trim().toLowerCase().split(/\s+/)

  // Find employees whose name matches
  const employees = await prisma.employee.findMany({
    where: {
      OR: parts.map((p) => ({
        OR: [
          { firstName: { contains: p, mode: 'insensitive' } },
          { lastName:  { contains: p, mode: 'insensitive' } },
        ],
      })),
    },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      employmentStatus: true,
      user: { select: { id: true, email: true, role: true, employeeId: true } },
    },
  })

  const results = await Promise.all(employees.map(async (emp) => {
    const leadsAssigned = await prisma.lead.count({ where: { assignedToId: emp.id } })
    const leadsCreated  = await prisma.lead.count({ where: { createdById:  emp.id } })

    // Check if a User exists with the same email but no employeeId
    const userByEmail = await prisma.user.findUnique({
      where: { email: emp.email },
      select: { id: true, email: true, role: true, employeeId: true },
    })

    const issues: string[] = []
    if (!emp.user) issues.push('Employee has no linked User (User.employeeId not set)')
    if (userByEmail && !userByEmail.employeeId) issues.push('User with matching email exists but User.employeeId is NULL — auto-repair will fix on next login')
    if (userByEmail && userByEmail.employeeId && userByEmail.employeeId !== emp.id) issues.push(`User.employeeId (${userByEmail.employeeId}) does not match Employee.id (${emp.id})`)
    if (leadsCreated + leadsAssigned === 0) issues.push('No leads found for this employee ID')

    return {
      employee: { id: emp.id, name: `${emp.firstName} ${emp.lastName}`, email: emp.email, status: emp.employmentStatus },
      linkedUser: emp.user,
      userByEmail,
      leadsCreated,
      leadsAssigned,
      totalLeads: leadsCreated + leadsAssigned,
      issues,
      fix: issues.length > 0 && userByEmail && !userByEmail.employeeId
        ? { action: 'POST /api/admin/diagnose', body: { userId: userByEmail.id, employeeId: emp.id } }
        : null,
    }
  }))

  return NextResponse.json({ query: name, results })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, employeeId } = await req.json()
  if (!userId || !employeeId) {
    return NextResponse.json({ error: 'userId and employeeId required' }, { status: 400 })
  }

  // Verify employee exists
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, firstName: true, lastName: true } })
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Link
  await prisma.user.update({ where: { id: userId }, data: { employeeId } })

  return NextResponse.json({ message: `User ${user.email} linked to employee ${emp.firstName} ${emp.lastName}`, userId, employeeId })
}
