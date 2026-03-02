import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateWorkingDays, formatDate } from '@/lib/utils'
import { sendEmail, leaveRequestEmailHtml } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (session.user.role === 'EMPLOYEE') {
      where.employeeId = (session.user as any).employeeId
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true, department: true, jobTitle: true },
        },
        approver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { employeeId, leaveType, startDate, endDate, reason } = await req.json()

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 })

    const days = calculateWorkingDays(start, end)
    if (days === 0) return NextResponse.json({ error: 'No working days in selected range' }, { status: 400 })

    // Check leave balance
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year: new Date().getFullYear(),
        },
      },
    })

    if (balance && balance.remaining < days) {
      return NextResponse.json({
        error: `Insufficient ${leaveType} leave balance. Available: ${balance.remaining} days, Requested: ${days} days`,
      }, { status: 400 })
    }

    const leave = await prisma.leave.create({
      data: { employeeId, leaveType, startDate: start, endDate: end, days, reason: reason || null, status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true, email: true, manager: { select: { email: true } } } } },
    })

    // Update pending balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: days }, remaining: { decrement: days } },
      })
    }

    // Notify HR manager
    sendEmail({
      to: process.env.SMTP_USER!,
      subject: `Leave Request from ${leave.employee.firstName} ${leave.employee.lastName}`,
      html: leaveRequestEmailHtml(
        `${leave.employee.firstName} ${leave.employee.lastName}`,
        leaveType,
        formatDate(start),
        formatDate(end),
        days,
        reason || ''
      ),
    }).catch(console.error)

    return NextResponse.json(leave, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 })
  }
}
