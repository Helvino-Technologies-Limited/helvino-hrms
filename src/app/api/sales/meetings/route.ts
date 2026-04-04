import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = (session.user as any).employeeId as string | undefined
    const role = session.user.role

    const where: any = {}

    if (role === 'SALES_MANAGER' && empId) {
      where.managerId = empId
    } else if (role === 'SALES_AGENT' && empId) {
      const emp = await prisma.employee.findUnique({ where: { id: empId }, select: { managerId: true } })
      if (emp?.managerId) where.managerId = emp.managerId
      else return NextResponse.json([])
    } else if (!['SUPER_ADMIN', 'HR_MANAGER', 'HEAD_OF_SALES'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const meetings = await prisma.salesTeamMeeting.findMany({
      where,
      include: {
        manager: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
      orderBy: { meetingDate: 'asc' },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = (session.user as any).employeeId as string | undefined
    if (!empId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const meeting = await prisma.salesTeamMeeting.create({
      data: {
        managerId: empId,
        title: body.title,
        agenda: body.agenda || null,
        meetingDate: new Date(body.meetingDate),
        startTime: body.startTime,
        endTime: body.endTime || null,
        type: body.type || 'ONLINE',
        meetingLink: body.meetingLink || null,
        location: body.location || null,
        status: 'SCHEDULED',
      },
      include: {
        manager: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
    })

    logAudit({
      employeeId: empId,
      action: 'CREATED',
      entity: 'MEETING',
      entityId: meeting.id,
      label: `${meeting.title} — ${new Date(body.meetingDate).toLocaleDateString()}`,
      newValues: { title: meeting.title, meetingDate: body.meetingDate, type: body.type, status: 'SCHEDULED' },
      req,
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
