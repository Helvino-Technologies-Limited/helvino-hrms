import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, jobTitle: true } },
        directReports: { select: { id: true, firstName: true, lastName: true, jobTitle: true, profilePhoto: true, employmentStatus: true } },
        leaves: { orderBy: { createdAt: 'desc' }, take: 20, include: { approver: { select: { firstName: true, lastName: true } } } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
        reviewsReceived: { include: { reviewer: { select: { firstName: true, lastName: true, profilePhoto: true, jobTitle: true } } }, orderBy: { createdAt: 'desc' } },
        goals: { orderBy: { createdAt: 'desc' } },
        leaveBalances: { where: { year: new Date().getFullYear() } },
      },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    return NextResponse.json(employee)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()

    // Strip document fields and non-Employee fields — these go through /documents endpoint
    const docFields = ['idFrontUrl','idBackUrl','passportPhotoUrl','kraPinUrl','nhifCardUrl','nssfCardUrl']
    const { role: newRole, ...rest } = body
    const updateData: any = Object.fromEntries(
      Object.entries(rest).filter(([k]) => !docFields.includes(k))
    )

    // Coerce types — never let an empty string reach a typed Prisma field
    updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
    updateData.dateHired = body.dateHired ? new Date(body.dateHired) : undefined
    updateData.probationEndDate = body.probationEndDate ? new Date(body.probationEndDate) : null
    updateData.basicSalary = body.basicSalary !== '' && body.basicSalary != null ? parseFloat(body.basicSalary) : null
    if (body.departmentId === '') updateData.departmentId = null
    if (body.managerId === '') updateData.managerId = null
    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: { department: true },
    })
    // Update user role if changed
    if (newRole) {
      await prisma.user.updateMany({ where: { employeeId: id }, data: { role: newRole } })
    }
    // Exclude large base64 doc fields from audit log
    const auditExcludes = [...docFields, 'profilePhoto']
    const auditValues = Object.fromEntries(Object.entries(body).filter(([k]) => !auditExcludes.includes(k))) as any
    await prisma.auditLog.create({ data: { action: 'UPDATE', entity: 'Employee', entityId: id, newValues: auditValues } })
    return NextResponse.json(employee)
  } catch (error: any) {
    console.error('PATCH /api/employees/[id] error:', error)
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.employee.update({ where: { id }, data: { employmentStatus: 'TERMINATED' } })
    return NextResponse.json({ message: 'Employee deactivated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 })
  }
}
