import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    const announcements = await prisma.announcement.findMany({
      take: limit,
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, profilePhoto: true, jobTitle: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authorId = (session.user as any).employeeId
    if (!authorId) return NextResponse.json({ error: 'Employee profile required to post announcements' }, { status: 400 })

    const body = await req.json()
    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'GENERAL',
        priority: body.priority || 'NORMAL',
        departmentId: body.departmentId || null,
        authorId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
      include: {
        author: { select: { firstName: true, lastName: true, profilePhoto: true, jobTitle: true } },
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
