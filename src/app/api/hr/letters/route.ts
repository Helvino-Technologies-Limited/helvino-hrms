import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all' // 'all' | 'contracts' | 'terminations'

    const nameFilter = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { employeeCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [contracts, terminations] = await Promise.all([
      type !== 'terminations'
        ? prisma.employmentContract.findMany({
            where: { employee: nameFilter },
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeCode: true,
                  jobTitle: true,
                  department: { select: { name: true } },
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),

      type !== 'contracts'
        ? prisma.terminationLetter.findMany({
            where: { employee: nameFilter },
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeCode: true,
                  jobTitle: true,
                  department: { select: { name: true } },
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({ contracts, terminations })
  } catch (error) {
    console.error('HR letters fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch HR letters' }, { status: 500 })
  }
}
