import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const serviceType = searchParams.get('serviceType')
    const isPublished = searchParams.get('isPublished')
    const isProduct = searchParams.get('isProduct')

    const where: any = {}
    if (serviceType) where.serviceType = serviceType
    if (isPublished !== null && isPublished !== '') {
      where.isPublished = isPublished === 'true'
    }
    if (isProduct !== null && isProduct !== '') {
      where.isProduct = isProduct === 'true'
    }

    const items = await prisma.portfolio.findMany({
      where,
      orderBy: [{ isProduct: 'desc' }, { completedAt: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch portfolio items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN' && role !== 'SALES_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const item = await prisma.portfolio.create({
      data: {
        clientName: body.clientName,
        industry: body.industry || null,
        serviceType: body.serviceType,
        description: body.description || null,
        projectImages: body.projectImages || [],
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        testimonial: body.testimonial || null,
        caseStudy: body.caseStudy || null,
        isPublished: body.isPublished ?? body.published ?? false,
        demoUrl: body.demoUrl || null,
        isProduct: body.isProduct ?? false,
        productStatus: body.productStatus || 'AVAILABLE',
        pricing: body.pricing || null,
        features: body.features || [],
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 })
  }
}
