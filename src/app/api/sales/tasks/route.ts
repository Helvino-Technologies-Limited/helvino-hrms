import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSalesScope, buildAssigneeFilter } from '@/lib/sales-scope'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scope = await getSalesScope(session.user.id)
    const assigneeFilter = buildAssigneeFilter(scope)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedToId = searchParams.get('assignedToId')
    const clientId = searchParams.get('clientId')

    const where: any = { ...assigneeFilter }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedToId) where.assignedToId = assignedToId
    if (clientId) where.clientId = clientId

    const tasks = await prisma.salesTask.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        client: { select: { companyName: true } },
        clientService: { select: { serviceName: true } },
      },
      orderBy: [
        { deadline: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scope = await getSalesScope(session.user.id)
    const body = await req.json()

    const task = await prisma.salesTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        clientId: body.clientId || null,
        clientServiceId: body.clientServiceId || null,
        assignedToId: body.assignedToId || null,
        createdById: scope.empId || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'TODO',
        notes: body.notes || null,
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        client: { select: { companyName: true } },
        clientService: { select: { serviceName: true } },
      },
    })

    logAudit({
      employeeId: scope.empId,
      action: 'CREATED',
      entity: 'SALES_TASK',
      entityId: task.id,
      label: task.title,
      newValues: { title: task.title, priority: task.priority, status: task.status, clientId: body.clientId },
      req,
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
