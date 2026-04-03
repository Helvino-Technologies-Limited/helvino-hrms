import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, jobTitle: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        services: {
          include: { tasks: true },
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          orderBy: { expiryDate: 'asc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            items: true,
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            assignedTo: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    return NextResponse.json(client)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const before = await prisma.client.findUnique({
      where: { id },
      select: { clientNumber: true, companyName: true, isActive: true, assignedToId: true },
    })

    const { clientNumber, ...updateFields } = body

    const updateData: any = { ...updateFields }
    if (updateFields.tags !== undefined && !Array.isArray(updateFields.tags)) {
      updateData.tags = []
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'UPDATED',
      entity: 'CLIENT',
      entityId: id,
      label: before ? `${before.clientNumber} — ${before.companyName}` : id,
      oldValues: before ? { assignedToId: before.assignedToId } : null,
      newValues: updateData,
      req,
    })

    return NextResponse.json(client)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN access required' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.client.findUnique({
      where: { id },
      select: { clientNumber: true, companyName: true },
    })

    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DEACTIVATED',
      entity: 'CLIENT',
      entityId: id,
      label: before ? `${before.clientNumber} — ${before.companyName}` : id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      req,
    })

    return NextResponse.json({ message: 'Client deactivated successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to deactivate client' }, { status: 500 })
  }
}
