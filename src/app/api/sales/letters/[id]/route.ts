import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'HEAD_OF_SALES']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const letter = await prisma.letter.findUnique({ where: { id } })
    if (!letter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(letter)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch letter' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const before = await prisma.letter.findUnique({
      where: { id },
      select: { letterNumber: true, subject: true, status: true, toName: true },
    })

    const update: any = {}
    if (body.date !== undefined) update.date = new Date(body.date)
    if (body.toName !== undefined) update.toName = body.toName
    if (body.toOrganization !== undefined) update.toOrganization = body.toOrganization || null
    if (body.toAddress !== undefined) update.toAddress = body.toAddress || null
    if (body.toEmail !== undefined) update.toEmail = body.toEmail || null
    if (body.subject !== undefined) update.subject = body.subject
    if (body.body !== undefined) update.body = body.body
    if (body.signedBy !== undefined) update.signedBy = body.signedBy || null
    if (body.signerTitle !== undefined) update.signerTitle = body.signerTitle || null
    if (body.status !== undefined) update.status = body.status

    const letter = await prisma.letter.update({ where: { id }, data: update })

    const empId = (session.user as any).employeeId as string | undefined
    const action = before?.status !== letter.status ? 'STATUS_CHANGED' : 'UPDATED'
    logAudit({
      employeeId: empId,
      action,
      entity: 'LETTER',
      entityId: id,
      label: before ? `${before.letterNumber} — ${before.subject}` : id,
      oldValues: before ? { status: before.status } : null,
      newValues: update,
      req,
    })

    return NextResponse.json(letter)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can delete letters' }, { status: 403 })
    }

    const { id } = await params

    const before = await prisma.letter.findUnique({
      where: { id },
      select: { letterNumber: true, subject: true, toName: true },
    })

    await prisma.letter.delete({ where: { id } })

    const empId = (session.user as any).employeeId as string | undefined
    logAudit({
      employeeId: empId,
      action: 'DELETED',
      entity: 'LETTER',
      entityId: id,
      label: before ? `${before.letterNumber} — ${before.subject}` : id,
      oldValues: before,
      req,
    })

    return NextResponse.json({ message: 'Deleted' })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete letter' }, { status: 500 })
  }
}
