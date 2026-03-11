import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedToId = searchParams.get('assignedToId')
    const clientId = searchParams.get('clientId')

    const VIEW_ALL = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']
    const empId = (session.user as any).employeeId as string | undefined
    const where: any = {}
    if (!VIEW_ALL.includes(session.user.role) && empId) {
      where.assignedToId = empId
    }
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

    const body = await req.json()
    const createdById = (session.user as any).employeeId

    const task = await prisma.salesTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        clientId: body.clientId || null,
        clientServiceId: body.clientServiceId || null,
        assignedToId: body.assignedToId || null,
        createdById: createdById || null,
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
