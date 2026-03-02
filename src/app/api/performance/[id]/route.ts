import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const review = await prisma.performanceReview.update({
      where: { id },
      data: {
        rating: body.rating ? parseInt(body.rating) : undefined,
        comments: body.comments,
        goals: body.goals,
        strengths: body.strengths,
        improvements: body.improvements,
        status: body.status,
      },
    })
    return NextResponse.json(review)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.performanceReview.delete({ where: { id } })
    return NextResponse.json({ message: 'Review deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
