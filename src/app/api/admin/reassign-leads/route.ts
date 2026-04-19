import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/reassign-leads  { employeeCode: 'HTL0022' }
// Finds all leads created by this employee and ensures assignedToId is also set to them.
// Also runs the repair-link fix first so the session token is in sync.

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employeeCode } = await req.json()
  if (!employeeCode) return NextResponse.json({ error: 'employeeCode required' }, { status: 400 })

  const employee = await prisma.employee.findUnique({
    where: { employeeCode },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Step 1: Fix User→Employee link
  const user = await prisma.user.findUnique({
    where: { email: employee.email },
    select: { id: true, employeeId: true },
  })
  let linkFixed = false
  if (user && user.employeeId !== employee.id) {
    await prisma.user.update({ where: { id: user.id }, data: { employeeId: employee.id } })
    linkFixed = true
  }

  // Step 2: Find all leads where createdById = this employee's ID
  const createdLeads = await prisma.lead.findMany({
    where: { createdById: employee.id },
    select: { id: true, leadNumber: true, contactPerson: true, assignedToId: true },
  })

  // Step 3: For unassigned leads, set assignedToId to this employee
  const unassigned = createdLeads.filter(l => !l.assignedToId)
  if (unassigned.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: unassigned.map(l => l.id) }, assignedToId: null },
      data: { assignedToId: employee.id },
    })
  }

  return NextResponse.json({
    employee: `${employee.firstName} ${employee.lastName} (${employeeCode})`,
    linkFixed,
    totalLeadsCreated: createdLeads.length,
    leadsNowAssigned: unassigned.length,
    message: `Done. ${linkFixed ? 'User link repaired. ' : ''}${createdLeads.length} leads found. ${unassigned.length} leads now assigned to this employee.`,
  })
}
