import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const empId = (session.user as any).employeeId as string | undefined
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    // SALES_MANAGER only sees their own applicants
    if (session.user.role === 'SALES_MANAGER' && empId) {
      where.salesManagerId = empId
    }

    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        job: { select: { id: true, title: true } },
        salesManager: { select: { id: true, firstName: true, lastName: true } },
        interviews: { include: { evaluation: true } },
        offer: true,
        notesList: { include: { author: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(applicants)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body

    const applicant = await prisma.applicant.update({
      where: { id },
      data,
    })

    return NextResponse.json(applicant)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
  }
}
