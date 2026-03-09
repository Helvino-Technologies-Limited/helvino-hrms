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

    if (body.clientName !== undefined) updateData.clientName = body.clientName
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
    if (body.description !== undefined) updateData.description = body.description
    if (body.projectImages !== undefined) updateData.projectImages = body.projectImages
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    if (body.testimonial !== undefined) updateData.testimonial = body.testimonial
    if (body.caseStudy !== undefined) updateData.caseStudy = body.caseStudy
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

    const item = await prisma.portfolio.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 })
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

    await prisma.portfolio.delete({ where: { id } })

    return NextResponse.json({ message: 'Portfolio item deleted successfully' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 })
  }
}
