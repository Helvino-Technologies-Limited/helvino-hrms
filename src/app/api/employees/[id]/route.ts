import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const updateData: any = { ...body }
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth)
    if (body.dateHired) updateData.dateHired = new Date(body.dateHired)
    if (body.probationEndDate) updateData.probationEndDate = new Date(body.probationEndDate)
    if (body.basicSalary) updateData.basicSalary = parseFloat(body.basicSalary)
    if (body.departmentId === '') updateData.departmentId = null
    if (body.managerId === '') updateData.managerId = null

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData,
      include: { department: true },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Employee',
        entityId: employee.id,
        newValues: body,
      },
    })

    return NextResponse.json(employee)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.employee.update({
      where: { id: params.id },
      data: { employmentStatus: 'TERMINATED' },
    })

    return NextResponse.json({ message: 'Employee deactivated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate employee' }, { status: 500 })
  }
}
