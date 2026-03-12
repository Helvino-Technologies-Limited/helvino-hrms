import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']
const VIEW_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            acceptances: {
              where: { employeeId: (session.user as any).employeeId || 'none' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    return NextResponse.json(policy)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const policy = await prisma.policy.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        policyType: body.policyType,
        status: body.status,
      },
    })

    return NextResponse.json(policy)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.policy.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 })
  }
}
