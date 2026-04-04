import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'HEAD_OF_SALES']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: only Admin or HR can edit services' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const before = await prisma.serviceCatalog.findUnique({
      where: { id },
      select: { name: true, category: true, isActive: true, basePrice: true },
    })

    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.basePrice !== undefined) {
      updateData.basePrice = body.basePrice !== null ? parseFloat(body.basePrice) : null
    }
    if (body.packages !== undefined) updateData.packages = body.packages
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)

    const service = await prisma.serviceCatalog.update({
      where: { id },
      data: updateData,
    })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'UPDATED',
      entity: 'SERVICE',
      entityId: id,
      label: before?.name ?? id,
      oldValues: before,
      newValues: updateData,
      req,
    })

    return NextResponse.json(service)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: only SUPER_ADMIN can delete services' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.serviceCatalog.findUnique({
      where: { id },
      select: { name: true, category: true },
    })

    await prisma.serviceCatalog.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'SERVICE',
      entityId: id,
      label: before?.name ?? id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
