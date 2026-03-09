import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null
    if (body.clientServiceId !== undefined) updateData.clientServiceId = body.clientServiceId || null
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    const task = await prisma.salesTask.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        client: { select: { companyName: true } },
        clientService: { select: { serviceName: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await prisma.salesTask.delete({ where: { id } })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
