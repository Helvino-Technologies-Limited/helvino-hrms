import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')

    const role = session.user.role
    const empId = (session.user as any).employeeId as string | undefined
    const where: any = {}
    if (employeeId) where.employeeId = employeeId

    if (role === 'EMPLOYEE' || role === 'SALES_AGENT') {
      where.employeeId = empId
    } else if ((role === 'DEPARTMENT_HEAD' || role === 'SALES_MANAGER') && empId) {
      const self = await prisma.employee.findUnique({ where: { id: empId }, select: { departmentId: true } })
      if (self?.departmentId) {
        const members = await prisma.employee.findMany({ where: { departmentId: self.departmentId }, select: { id: true } })
        where.employeeId = { in: members.map(m => m.id) }
      } else {
        where.employeeId = empId
      }
    }
    // SUPER_ADMIN, HR_MANAGER: no filter

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, jobTitle: true, department: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, jobTitle: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const reviewerId = (session.user as any).employeeId

    if (!reviewerId) return NextResponse.json({ error: 'Reviewer employee profile required' }, { status: 400 })

    const review = await prisma.performanceReview.create({
      data: {
        employeeId: body.employeeId,
        reviewerId,
        period: body.period,
        rating: parseInt(body.rating),
        comments: body.comments || null,
        goals: body.goals || null,
        strengths: body.strengths || null,
        improvements: body.improvements || null,
        status: body.status || 'SUBMITTED',
      },
      include: {
        employee: true,
        reviewer: true,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
