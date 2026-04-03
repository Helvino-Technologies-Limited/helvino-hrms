import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

async function updateItem(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const before = await prisma.portfolio.findUnique({
      where: { id },
      select: { clientName: true, serviceType: true, isPublished: true },
    })

    const updateData: any = {}
    if (body.clientName !== undefined) updateData.clientName = body.clientName
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
    if (body.description !== undefined) updateData.description = body.description
    if (body.projectImages !== undefined) updateData.projectImages = body.projectImages
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    if (body.testimonial !== undefined) updateData.testimonial = body.testimonial
    if (body.caseStudy !== undefined) updateData.caseStudy = body.caseStudy
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished
    if (body.published !== undefined) updateData.isPublished = body.published
    if (body.demoUrl !== undefined) updateData.demoUrl = body.demoUrl || null
    if (body.isProduct !== undefined) updateData.isProduct = body.isProduct
    if (body.productStatus !== undefined) updateData.productStatus = body.productStatus
    if (body.pricing !== undefined) updateData.pricing = body.pricing || null
    if (body.features !== undefined) updateData.features = body.features

    const item = await prisma.portfolio.update({ where: { id }, data: updateData })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'UPDATED',
      entity: 'PORTFOLIO',
      entityId: id,
      label: before ? `${before.clientName} — ${before.serviceType}` : id,
      oldValues: before,
      newValues: updateData,
      req,
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return updateItem(req, ctx)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return updateItem(req, ctx)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.portfolio.findUnique({
      where: { id },
      select: { clientName: true, serviceType: true },
    })

    await prisma.portfolio.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'PORTFOLIO',
      entityId: id,
      label: before ? `${before.clientName} — ${before.serviceType}` : id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
