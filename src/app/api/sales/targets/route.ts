import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  SALES_AGENT:   { clientTarget: 5,  revenueTarget: 250000 },
  SALES_MANAGER: { clientTarget: 10, revenueTarget: 500000 },
}

// Seed missing rows so callers always get both roles back
async function ensureDefaults() {
  await Promise.all(
    (Object.entries(DEFAULTS) as [string, { clientTarget: number; revenueTarget: number }][]).map(
      ([role, vals]) =>
        prisma.salesTarget.upsert({
          where: { role },
          create: { role, ...vals },
          update: {},
        })
    )
  )
}

// GET — anyone with dashboard access can read targets
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureDefaults()

    const targets = await prisma.salesTarget.findMany({
      orderBy: { role: 'asc' },
    })

    return NextResponse.json(targets)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
  }
}

// PATCH — admin/HR only
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    // body: [{ role: 'SALES_AGENT', clientTarget: 5, revenueTarget: 250000 }, ...]

    const updates = await Promise.all(
      (body as { role: string; clientTarget: number; revenueTarget: number }[]).map((item) =>
        prisma.salesTarget.upsert({
          where: { role: item.role },
          create: {
            role: item.role,
            clientTarget: Number(item.clientTarget),
            revenueTarget: Number(item.revenueTarget),
            updatedBy: session.user.id,
          },
          update: {
            clientTarget: Number(item.clientTarget),
            revenueTarget: Number(item.revenueTarget),
            updatedBy: session.user.id,
          },
        })
      )
    )

    return NextResponse.json(updates)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Failed to update targets' }, { status: 500 })
  }
}
