/**
 * POST /api/cron/expire-jobs
 *
 * Expires and deletes jobs whose deadline has passed.
 * - Jobs with 0 applicants  → hard-deleted
 * - Jobs with applicants    → status set to EXPIRED (kept for records)
 *
 * Called automatically (fire-and-forget) from GET /api/recruitment/jobs,
 * and can also be hit by an external cron scheduler.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const now = new Date()

    // Find all OPEN or CLOSED jobs past their deadline
    const expired = await prisma.job.findMany({
      where: {
        status: { in: ['OPEN', 'CLOSED'] },
        deadline: { lt: now },
      },
      include: {
        _count: { select: { applicants: true } },
      },
    })

    if (expired.length === 0) {
      return NextResponse.json({ processed: 0, deleted: 0, archived: 0 })
    }

    const toDelete = expired.filter((j) => j._count.applicants === 0).map((j) => j.id)
    const toExpire = expired.filter((j) => j._count.applicants > 0).map((j) => j.id)

    const [deleted, expiredCount] = await Promise.all([
      toDelete.length > 0
        ? prisma.job.deleteMany({ where: { id: { in: toDelete } } })
        : Promise.resolve({ count: 0 }),
      toExpire.length > 0
        ? prisma.job.updateMany({
            where: { id: { in: toExpire } },
            data: { status: 'EXPIRED' },
          })
        : Promise.resolve({ count: 0 }),
    ])

    console.log(
      `[expire-jobs] ${deleted.count} deleted, ${expiredCount.count} marked EXPIRED`
    )

    return NextResponse.json({
      processed: expired.length,
      deleted: deleted.count,
      archived: expiredCount.count,
    })
  } catch (error) {
    console.error('[expire-jobs] error:', error)
    return NextResponse.json({ error: 'Failed to expire jobs' }, { status: 500 })
  }
}
