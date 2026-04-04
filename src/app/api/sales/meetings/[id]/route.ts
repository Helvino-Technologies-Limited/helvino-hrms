import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined
    const body = await req.json()

    if (session.user.role === 'SALES_MANAGER') {
      const existing = await prisma.salesTeamMeeting.findUnique({ where: { id }, select: { managerId: true } })
      if (!existing || existing.managerId !== empId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const before = await prisma.salesTeamMeeting.findUnique({
      where: { id },
      select: { title: true, status: true, meetingDate: true },
    })

    const updateData: any = { ...body }
    if (body.meetingDate) updateData.meetingDate = new Date(body.meetingDate)

    const meeting = await prisma.salesTeamMeeting.update({
      where: { id },
      data: updateData,
      include: { manager: { select: { firstName: true, lastName: true } } },
    })

    const action = before?.status !== meeting.status ? 'STATUS_CHANGED' : 'UPDATED'
    logAudit({
      employeeId: empId,
      action,
      entity: 'MEETING',
      entityId: id,
      label: before?.title ?? id,
      oldValues: before ? { status: before.status } : null,
      newValues: updateData,
      req,
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined

    if (session.user.role === 'SALES_MANAGER') {
      const existing = await prisma.salesTeamMeeting.findUnique({ where: { id }, select: { managerId: true } })
      if (!existing || existing.managerId !== empId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const before = await prisma.salesTeamMeeting.findUnique({
      where: { id },
      select: { title: true, status: true, meetingDate: true },
    })

    await prisma.salesTeamMeeting.delete({ where: { id } })

    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'MEETING',
      entityId: id,
      label: before?.title ?? id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
