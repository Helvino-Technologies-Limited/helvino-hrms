import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicantId, content } = body

    if (!applicantId || !content) {
      return NextResponse.json(
        { error: 'applicantId and content are required' },
        { status: 400 }
      )
    }

    const employeeId = session.user?.employeeId ?? null

    const note = await prisma.recruitmentNote.create({
      data: {
        applicantId,
        content,
        authorId: employeeId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('POST /api/recruitment/notes error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Note id is required' }, { status: 400 })
    }

    await prisma.recruitmentNote.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/recruitment/notes error:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
