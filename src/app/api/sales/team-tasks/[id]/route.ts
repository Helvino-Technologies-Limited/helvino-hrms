import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined
    const role = session.user.role
    const body = await req.json()

    const existing = await prisma.salesTeamTask.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Manager can update everything; agent can only update status
    if (role === 'SALES_AGENT') {
      if (existing.assignedToId !== empId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const task = await prisma.salesTeamTask.update({
        where: { id },
        data: { status: body.status, notes: body.notes },
        include: {
          manager: { select: { firstName: true, lastName: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      })
      return NextResponse.json(task)
    }

    if (role === 'SALES_MANAGER' && existing.managerId !== empId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = { ...body }
    if (body.deadline) updateData.deadline = new Date(body.deadline)

    const task = await prisma.salesTeamTask.update({
      where: { id },
      data: updateData,
      include: {
        manager: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined

    if (session.user.role === 'SALES_MANAGER') {
      const existing = await prisma.salesTeamTask.findUnique({ where: { id }, select: { managerId: true } })
      if (!existing || existing.managerId !== empId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.salesTeamTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
