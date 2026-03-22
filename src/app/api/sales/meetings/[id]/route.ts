import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined
    const body = await req.json()

    // SALES_MANAGER can only edit their own meetings
    if (session.user.role === 'SALES_MANAGER') {
      const existing = await prisma.salesTeamMeeting.findUnique({ where: { id }, select: { managerId: true } })
      if (!existing || existing.managerId !== empId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updateData: any = { ...body }
    if (body.meetingDate) updateData.meetingDate = new Date(body.meetingDate)

    const meeting = await prisma.salesTeamMeeting.update({
      where: { id },
      data: updateData,
      include: { manager: { select: { firstName: true, lastName: true } } },
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
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(session.user.role)) {
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

    await prisma.salesTeamMeeting.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
