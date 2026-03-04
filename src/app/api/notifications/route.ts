import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = (session.user as any).employeeId

    const [announcements, leaves] = await Promise.all([
      prisma.announcement.findMany({
        take: 5,
        where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, content: true, publishedAt: true, type: true, readBy: true },
      }),
      employeeId
        ? prisma.leave.findMany({
            where: {
              employeeId,
              status: { in: ['APPROVED', 'REJECTED'] },
              updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: { id: true, leaveType: true, status: true, updatedAt: true, startDate: true },
          })
        : Promise.resolve([]),
    ])

    const items = [
      ...announcements.map((a) => ({
        id: `ann_${a.id}`,
        annId: a.id,
        type: 'announcement' as const,
        title: a.title,
        message: a.content.length > 90 ? a.content.slice(0, 90) + '…' : a.content,
        time: a.publishedAt,
        read: employeeId ? a.readBy.includes(employeeId) : true,
      })),
      ...leaves.map((l) => ({
        id: `leave_${l.id}`,
        annId: null,
        type: 'leave' as const,
        title: `Leave ${l.status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your ${l.leaveType.toLowerCase().replace('_', ' ')} leave starting ${new Date(l.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} was ${l.status.toLowerCase()}`,
        time: l.updatedAt,
        read: false,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8)

    return NextResponse.json({ items, unreadCount: items.filter((i) => !i.read).length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// Mark an announcement as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = (session.user as any).employeeId
    if (!employeeId) return NextResponse.json({ ok: true })

    const { announcementIds } = await req.json()
    if (!Array.isArray(announcementIds) || announcementIds.length === 0)
      return NextResponse.json({ ok: true })

    await Promise.all(
      announcementIds.map(async (id: string) => {
        const ann = await prisma.announcement.findUnique({ where: { id }, select: { readBy: true } })
        if (ann && !ann.readBy.includes(employeeId)) {
          await prisma.announcement.update({
            where: { id },
            data: { readBy: { push: employeeId } },
          })
        }
      })
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
