import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch the current manager's recruitment link (creates one if none)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = (session.user as any).employeeId as string | undefined
    if (!empId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let link = await prisma.salesManagerRecruitmentLink.findUnique({
      where: { managerId: empId },
    })

    if (!link) {
      link = await prisma.salesManagerRecruitmentLink.create({
        data: { managerId: empId },
      })
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch recruitment link' }, { status: 500 })
  }
}

// POST — regenerate a new token
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = (session.user as any).employeeId as string | undefined
    if (!empId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    if (!['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action } = await req.json().catch(() => ({})) as { action?: string }

    const existing = await prisma.salesManagerRecruitmentLink.findUnique({
      where: { managerId: empId },
    })

    if (!existing) {
      const link = await prisma.salesManagerRecruitmentLink.create({
        data: { managerId: empId },
      })
      return NextResponse.json(link)
    }

    if (action === 'regenerate') {
      // Generate new token by deleting and recreating
      const link = await prisma.salesManagerRecruitmentLink.update({
        where: { managerId: empId },
        data: { token: require('crypto').randomUUID(), updatedAt: new Date() },
      })
      return NextResponse.json(link)
    }

    // Toggle active/inactive
    const link = await prisma.salesManagerRecruitmentLink.update({
      where: { managerId: empId },
      data: { isActive: !existing.isActive },
    })
    return NextResponse.json(link)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update recruitment link' }, { status: 500 })
  }
}
