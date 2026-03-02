import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, leaveStatusEmailHtml } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status, comments } = await req.json()
    const approverId = (session.user as any).employeeId

    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
      include: { employee: true },
    })

    if (!leave) return NextResponse.json({ error: 'Leave record not found' }, { status: 404 })
    if (leave.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending leaves can be actioned' }, { status: 400 })
    }

    const updatedLeave = await prisma.leave.update({
      where: { id: params.id },
      data: { status, approvedBy: approverId || null, approvedAt: new Date(), comments: comments || null },
    })

    // Update leave balance
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          year: new Date().getFullYear(),
        },
      },
    })

    if (balance) {
      if (status === 'APPROVED') {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { used: { increment: leave.days }, pending: { decrement: leave.days } },
        })
      } else if (status === 'REJECTED' || status === 'CANCELLED') {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: leave.days }, remaining: { increment: leave.days } },
        })
      }
    }

    // Notify employee
    sendEmail({
      to: leave.employee.email,
      subject: `Leave Request ${status} — Helvino Technologies`,
      html: leaveStatusEmailHtml(
        `${leave.employee.firstName} ${leave.employee.lastName}`,
        status,
        leave.leaveType,
        comments
      ),
    }).catch(console.error)

    return NextResponse.json(updatedLeave)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 })
  }
}
