import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const activities = await prisma.leadActivity.findMany({
      where: { leadId: id },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
      },
      orderBy: { activityDate: 'desc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const leadExists = await prisma.lead.findUnique({ where: { id }, select: { id: true } })
    if (!leadExists) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: body.type,
        subject: body.subject,
        notes: body.notes || null,
        activityDate: body.activityDate ? new Date(body.activityDate) : new Date(),
        performedById: session.user.employeeId || null,
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
