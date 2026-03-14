import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']
const VIEW_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const policyType = searchParams.get('policyType')
    const where: any = {}

    // Non-admin users only see ACTIVE policies
    if (!ADMIN_ROLES.includes(session.user.role)) {
      where.status = 'ACTIVE'
    } else if (status) {
      where.status = status
    }
    if (policyType) where.policyType = policyType

    const policies = await prisma.policy.findMany({
      where,
      include: {
        versions: {
          where: { isLatest: true },
          take: 1,
          include: {
            acceptances: {
              where: {
                employeeId: (session.user as any).employeeId || 'none',
              },
              take: 1,
            },
          },
        },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(policies)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const policy = await prisma.policy.create({
      data: {
        title: body.title,
        description: body.description || null,
        policyType: body.policyType || 'GENERAL',
        status: body.status || 'DRAFT',
        createdById: (session.user as any).employeeId || null,
      },
    })

    // If initial content was provided (from AI generation), create version 1.0 automatically
    if (body.initialContent?.trim()) {
      await prisma.policyVersion.create({
        data: {
          policyId: policy.id,
          versionNumber: '1.0',
          content: body.initialContent.trim(),
          effectiveDate: new Date(),
          isLatest: true,
        },
      })
      // Auto-activate if it was set to ACTIVE
      if (body.status === 'ACTIVE') {
        await prisma.policy.update({ where: { id: policy.id }, data: { status: 'ACTIVE' } })
      }
    }

    return NextResponse.json(policy, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 })
  }
}
