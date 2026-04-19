import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/repair-links
// Finds every Employee whose User.employeeId is null or points to wrong ID, and fixes it.
// Admin-only. Safe to call multiple times (idempotent).

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: any[] = []

  // Get all employees with their linked user (if any)
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      employmentStatus: true,
      user: { select: { id: true, email: true, role: true, employeeId: true } },
    },
  })

  for (const emp of employees) {
    const empName = `${emp.firstName} ${emp.lastName}`

    // Find the User whose email matches this employee
    const userByEmail = await prisma.user.findUnique({
      where: { email: emp.email },
      select: { id: true, email: true, role: true, employeeId: true },
    })

    // Case 1: User email matches but employeeId is null or wrong
    if (userByEmail && userByEmail.employeeId !== emp.id) {
      const old = userByEmail.employeeId
      await prisma.user.update({
        where: { id: userByEmail.id },
        data: { employeeId: emp.id },
      })
      results.push({
        employee: `${emp.employeeCode} ${empName}`,
        action: 'FIXED',
        detail: `User ${userByEmail.email} employeeId: ${old ?? 'null'} → ${emp.id}`,
      })
      continue
    }

    // Case 2: Already correct
    if (userByEmail && userByEmail.employeeId === emp.id) {
      results.push({ employee: `${emp.employeeCode} ${empName}`, action: 'OK', detail: 'Link correct' })
      continue
    }

    // Case 3: No user found by email
    results.push({ employee: `${emp.employeeCode} ${empName}`, action: 'NO_USER', detail: `No user with email ${emp.email}` })
  }

  const fixed = results.filter(r => r.action === 'FIXED').length
  const ok = results.filter(r => r.action === 'OK').length
  const noUser = results.filter(r => r.action === 'NO_USER').length

  return NextResponse.json({
    summary: { fixed, ok, noUser, total: results.length },
    results,
  })
}
