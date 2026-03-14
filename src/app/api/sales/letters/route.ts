import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const letters = await prisma.letter.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(letters)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Generate letter number: LTR-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.letter.count()
    const letterNumber = `LTR-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const letter = await prisma.letter.create({
      data: {
        letterNumber,
        date: body.date ? new Date(body.date) : new Date(),
        toName: body.toName,
        toOrganization: body.toOrganization || null,
        toAddress: body.toAddress || null,
        toEmail: body.toEmail || null,
        subject: body.subject,
        body: body.body,
        signedBy: body.signedBy || null,
        signerTitle: body.signerTitle || null,
        status: body.status || 'DRAFT',
        createdById: (session.user as any).employeeId || null,
      },
    })

    return NextResponse.json(letter, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 })
  }
}
