import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplate } from '@/lib/email'
import { generateTerminationLetterHtml } from '@/lib/termination'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const letter = await prisma.terminationLetter.findUnique({
      where: { employeeId: id },
    })
    return NextResponse.json(letter || null)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch termination letter' }, { status: 500 })
  }
}

// POST — create / regenerate termination letter
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()

    const { reason, reasonDetails, lastWorkingDay, noticeDays, payInLieu, issuedBy, issuedByTitle, send } = body

    if (!reason || !lastWorkingDay || !issuedBy) {
      return NextResponse.json({ error: 'reason, lastWorkingDay, and issuedBy are required' }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: { select: { name: true } } },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const letterHtml = generateTerminationLetterHtml({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      departmentName: employee.department?.name || 'General',
      dateHired: employee.dateHired,
      reason,
      reasonDetails: reasonDetails || null,
      lastWorkingDay: new Date(lastWorkingDay),
      noticeDays: Number(noticeDays) || 30,
      payInLieu: Boolean(payInLieu),
      issuedBy,
      issuedByTitle: issuedByTitle || 'HR Director',
    })

    const letter = await prisma.terminationLetter.upsert({
      where: { employeeId: id },
      update: {
        reason,
        reasonDetails: reasonDetails || null,
        lastWorkingDay: new Date(lastWorkingDay),
        noticeDays: Number(noticeDays) || 30,
        payInLieu: Boolean(payInLieu),
        issuedBy,
        issuedByTitle: issuedByTitle || 'HR Director',
        letterHtml,
        sentAt: send ? new Date() : undefined,
      },
      create: {
        employeeId: id,
        reason,
        reasonDetails: reasonDetails || null,
        lastWorkingDay: new Date(lastWorkingDay),
        noticeDays: Number(noticeDays) || 30,
        payInLieu: Boolean(payInLieu),
        issuedBy,
        issuedByTitle: issuedByTitle || 'HR Director',
        letterHtml,
        sentAt: send ? new Date() : null,
      },
    })

    if (send) {
      const recipient = employee.personalEmail || employee.email
      const lastDay = new Date(lastWorkingDay).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      await sendEmail({
        to: recipient,
        subject: `Notice of Termination of Employment — ${employee.firstName} ${employee.lastName}`,
        html: emailTemplate(
          'Notice of Termination of Employment',
          `
          <p>Dear <strong>${employee.firstName}</strong>,</p>
          <p>Please find attached your formal Notice of Termination of Employment from Helvino Technologies Limited.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#fef2f2;font-weight:bold;color:#991b1b;">Employee</td><td style="padding:8px;border:1px solid #e2e8f0;">${employee.firstName} ${employee.lastName} (${employee.employeeCode})</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#fef2f2;font-weight:bold;color:#991b1b;">Last Working Day</td><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${lastDay}</strong></td></tr>
          </table>
          <p>Please log in to the HR portal or contact HR at <a href="mailto:info@helvino.org" style="color:#2563eb;">info@helvino.org</a> if you have any questions.</p>
          <p style="color:#64748b;font-size:12px;">This communication is strictly private and confidential.</p>
          `
        ),
      })
    }

    return NextResponse.json({
      message: send ? 'Termination letter issued and sent.' : 'Termination letter generated.',
      letterHtml,
      letter,
    })
  } catch (error) {
    console.error('Termination letter error:', error)
    return NextResponse.json({ error: 'Failed to process termination letter' }, { status: 500 })
  }
}

// PATCH — resend existing termination letter email
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const { id } = await params

    const letter = await prisma.terminationLetter.findUnique({ where: { employeeId: id } })
    if (!letter) return NextResponse.json({ error: 'No termination letter found. Generate one first.' }, { status: 404 })

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, email: true, personalEmail: true, employeeCode: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    await prisma.terminationLetter.update({ where: { employeeId: id }, data: { sentAt: new Date() } })

    const recipient = employee.personalEmail || employee.email
    const lastDay = letter.lastWorkingDay.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    await sendEmail({
      to: recipient,
      subject: `[Reminder] Notice of Termination of Employment — ${employee.firstName} ${employee.lastName}`,
      html: emailTemplate(
        'Notice of Termination of Employment (Reminder)',
        `
        <p>Dear <strong>${employee.firstName}</strong>,</p>
        <p>This is a reminder of your Notice of Termination of Employment issued by Helvino Technologies Limited.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#fef2f2;font-weight:bold;color:#991b1b;">Last Working Day</td><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${lastDay}</strong></td></tr>
        </table>
        <p>Contact HR at <a href="mailto:info@helvino.org" style="color:#2563eb;">info@helvino.org</a> for any queries.</p>
        `
      ),
    })

    return NextResponse.json({ message: 'Termination letter resent.' })
  } catch (error) {
    console.error('Termination resend error:', error)
    return NextResponse.json({ error: 'Failed to resend' }, { status: 500 })
  }
}
