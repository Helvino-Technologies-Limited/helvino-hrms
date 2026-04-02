import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CAN_EDIT = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const target = await prisma.salesEmployeeTarget.findUnique({
      where: { employeeId: id },
    })

    return NextResponse.json(target ?? null)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch target' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!CAN_EDIT.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const clientTarget  = parseInt(body.clientTarget)
    const revenueTarget = parseFloat(body.revenueTarget)

    if (isNaN(clientTarget) || isNaN(revenueTarget)) {
      return NextResponse.json({ error: 'Invalid target values' }, { status: 400 })
    }

    const target = await prisma.salesEmployeeTarget.upsert({
      where: { employeeId: id },
      create: { employeeId: id, clientTarget, revenueTarget, updatedBy: session.user.id },
      update: { clientTarget, revenueTarget, updatedBy: session.user.id },
    })

    return NextResponse.json(target)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Failed to save target' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!CAN_EDIT.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.salesEmployeeTarget.deleteMany({ where: { employeeId: id } })

    return NextResponse.json({ message: 'Target reset to role default' })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Failed to reset target' }, { status: 500 })
  }
}
