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
    const versions = await prisma.policyVersion.findMany({
      where: { policyId: id },
      include: {
        acceptances: {
          where: { employeeId: (session.user as any).employeeId || 'none' },
          take: 1,
        },
        _count: { select: { acceptances: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Mark previous versions as not latest
    await prisma.policyVersion.updateMany({
      where: { policyId: id },
      data: { isLatest: false },
    })

    const version = await prisma.policyVersion.create({
      data: {
        policyId: id,
        versionNumber: body.versionNumber,
        content: body.content,
        fileUrl: body.fileUrl || null,
        effectiveDate: new Date(body.effectiveDate),
        isLatest: true,
      },
    })

    // Auto-activate policy if it was draft
    await prisma.policy.update({
      where: { id },
      data: { status: 'ACTIVE' },
    })

    return NextResponse.json(version, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}
