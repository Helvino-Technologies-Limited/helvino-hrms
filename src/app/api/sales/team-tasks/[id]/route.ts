import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

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
      logAudit({
        employeeId: empId,
        action: existing.status !== body.status ? 'STATUS_CHANGED' : 'UPDATED',
        entity: 'TEAM_TASK',
        entityId: id,
        label: existing.title,
        oldValues: { status: existing.status },
        newValues: { status: body.status, notes: body.notes },
        req,
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

    logAudit({
      employeeId: empId,
      action: existing.status !== task.status ? 'STATUS_CHANGED' : 'UPDATED',
      entity: 'TEAM_TASK',
      entityId: id,
      label: existing.title,
      oldValues: { status: existing.status, priority: existing.priority },
      newValues: updateData,
      req,
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

    const before = await prisma.salesTeamTask.findUnique({
      where: { id },
      select: { title: true, status: true, managerId: true },
    })

    if (session.user.role === 'SALES_MANAGER') {
      if (!before || before.managerId !== empId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.salesTeamTask.delete({ where: { id } })

    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'TEAM_TASK',
      entityId: id,
      label: before?.title ?? id,
      oldValues: before ? { status: before.status } : null,
      req,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
