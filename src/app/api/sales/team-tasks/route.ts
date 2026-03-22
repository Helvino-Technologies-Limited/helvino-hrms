import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      where.assignedToId = empId
    } else if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tasks = await prisma.salesTeamTask.findMany({
      where,
      include: {
        manager: { select: { firstName: true, lastName: true, profilePhoto: true } },
        assignedTo: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch team tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = (session.user as any).employeeId as string | undefined
    if (!empId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const task = await prisma.salesTeamTask.create({
      data: {
        managerId: empId,
        assignedToId: body.assignedToId,
        title: body.title,
        description: body.description || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        priority: body.priority || 'MEDIUM',
        status: 'TODO',
        notes: body.notes || null,
      },
      include: {
        manager: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create team task' }, { status: 500 })
  }
}
