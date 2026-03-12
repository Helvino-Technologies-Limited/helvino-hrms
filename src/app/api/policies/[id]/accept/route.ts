import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VIEW_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const employeeId = (session.user as any).employeeId
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee profile required to accept policies' }, { status: 400 })
    }

    const { id } = await params
    const body = await req.json()
    const { policyVersionId } = body

    if (!policyVersionId) {
      return NextResponse.json({ error: 'policyVersionId is required' }, { status: 400 })
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null

    const acceptance = await prisma.employeePolicyAcceptance.upsert({
      where: {
        employeeId_policyVersionId: { employeeId, policyVersionId },
      },
      create: {
        employeeId,
        policyVersionId,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress,
      },
      update: {
        accepted: true,
        acceptedAt: new Date(),
        ipAddress,
      },
    })

    // Mark notification as read if exists
    await prisma.policyNotification.updateMany({
      where: { policyId: id, employeeId },
      data: { readStatus: true },
    })

    return NextResponse.json(acceptance)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to accept policy' }, { status: 500 })
  }
}
