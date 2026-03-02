import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (session.user.role === 'EMPLOYEE') {
      where.employeeId = (session.user as any).employeeId
    }
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.date = { gte: startDate, lte: endDate }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            profilePhoto: true, department: true, jobTitle: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { employeeId, action, notes, location } = await req.json()
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (action === 'clock-in') {
      const existing = await prisma.attendance.findFirst({
        where: { employeeId, date: { gte: today }, clockOut: null },
      })
      if (existing) return NextResponse.json({ error: 'Already clocked in for today' }, { status: 400 })

      const clockIn = new Date()
      const workStart = new Date()
      workStart.setHours(8, 0, 0, 0)
      const lateThreshold = new Date(workStart.getTime() + 15 * 60000)
      const status = clockIn > lateThreshold ? 'LATE' : 'PRESENT'

      const record = await prisma.attendance.create({
        data: { employeeId, clockIn, date: new Date(), status, notes: notes || null, location: location || null, ipAddress },
      })
      return NextResponse.json({ ...record, action: 'clocked-in', status }, { status: 201 })
    }

    if (action === 'clock-out') {
      const record = await prisma.attendance.findFirst({
        where: { employeeId, date: { gte: today }, clockOut: null },
      })
      if (!record) return NextResponse.json({ error: 'No active clock-in found' }, { status: 400 })

      const clockOut = new Date()
      const totalHours = parseFloat(((clockOut.getTime() - record.clockIn.getTime()) / 3600000).toFixed(2))

      const updated = await prisma.attendance.update({
        where: { id: record.id },
        data: { clockOut, totalHours },
      })
      return NextResponse.json({ ...updated, action: 'clocked-out' })
    }

    return NextResponse.json({ error: 'Invalid action. Use clock-in or clock-out' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 })
  }
}
