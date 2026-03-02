import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const applicant = await prisma.applicant.update({
      where: { id: params.id },
      data: {
        status: body.status,
        score: body.score !== undefined ? parseInt(body.score) : undefined,
        notes: body.notes,
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : undefined,
      },
    })
    return NextResponse.json(applicant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.applicant.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Applicant deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
