import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, employeeOfferLetterEmailHtml } from '@/lib/email'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'HEAD_OF_SALES']

function fmtSalary(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      employeeName,
      employeeEmail,
      position,
      salary,
      startDate,
      probation,
      letterBody,
      signatoryName,
      signatoryTitle,
      deadline,
      refNumber,
    } = body

    if (!employeeEmail || !employeeName || !position || !salary || !letterBody) {
      return NextResponse.json({ error: 'employeeEmail, employeeName, position, salary, letterBody required' }, { status: 400 })
    }

    const salaryStr = fmtSalary(Number(salary))
    const startDateStr = startDate
      ? new Date(startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'To be communicated'
    const deadlineStr = deadline
      ? new Date(deadline + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      : undefined

    const html = employeeOfferLetterEmailHtml({
      employeeName,
      position,
      salary: salaryStr,
      startDate: startDateStr,
      probation: Number(probation) || 3,
      letterBody,
      signatoryName,
      signatoryTitle,
      deadline: deadlineStr,
      refNumber: refNumber || `HL/HR/OL/${new Date().getFullYear()}`,
    })

    await sendEmail({
      to: employeeEmail,
      subject: `Employment Offer Letter — ${position} | Helvino Technologies Ltd`,
      html,
    })

    return NextResponse.json({ ok: true, sentTo: employeeEmail })
  } catch (err: any) {
    console.error('send-offer-to-employee error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
  }
}
