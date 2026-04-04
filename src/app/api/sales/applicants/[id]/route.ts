import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true } },
        salesManager: { select: { id: true, firstName: true, lastName: true } },
        interviews: { include: { evaluation: true, interviewer: { select: { firstName: true, lastName: true } } } },
        offer: true,
        notesList: { include: { author: { select: { firstName: true, lastName: true } } } },
      },
    })

    if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // SALES_MANAGER can only see their own applicants
    if (session.user.role === 'SALES_MANAGER' && applicant.salesManagerId !== empId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(applicant)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch applicant' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const empId = (session.user as any).employeeId as string | undefined
    const body = await req.json()

    // Verify ownership for SALES_MANAGER
    if (session.user.role === 'SALES_MANAGER') {
      const existing = await prisma.applicant.findUnique({ where: { id }, select: { salesManagerId: true } })
      if (!existing || existing.salesManagerId !== empId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const applicant = await prisma.applicant.update({ where: { id }, data: body })
    return NextResponse.json(applicant)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.applicant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 })
  }
}
