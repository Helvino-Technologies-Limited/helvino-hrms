import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplate } from '@/lib/email'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmtKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: only HR/Admin can share payslips' }, { status: 403 })
    }

    const { id } = await params

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, email: true,
            jobTitle: true, department: { select: { name: true } },
            bankName: true, bankAccount: true,
          },
        },
      },
    })

    if (!payroll) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })

    const emp = payroll.employee
    const monthLabel = MONTH_NAMES[payroll.month - 1]
    const payslipRef = `PS-${payroll.year}${String(payroll.month).padStart(2, '0')}-`

    const totalDeductions = payroll.paye + payroll.nhif + payroll.nssf + payroll.otherDeductions

    const body = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);padding:24px 32px;border-radius:12px 12px 0 0;">
          <div style="color:#fff;font-size:20px;font-weight:900;">Payslip — ${monthLabel} ${payroll.year}</div>
          <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">${payslipRef} &nbsp;|&nbsp; ${emp.jobTitle} &nbsp;|&nbsp; ${emp.department?.name ?? ''}</div>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none;">
          <p style="color:#475569;font-size:14px;margin-bottom:20px;">
            Hi <strong>${emp.firstName}</strong>, please find your payslip for <strong>${monthLabel} ${payroll.year}</strong> below.
          </p>

          <!-- Earnings -->
          <div style="margin-bottom:16px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Earnings</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 0;font-size:13px;color:#475569;">Basic Salary</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#1e293b;">${fmtKes(payroll.basicSalary)}</td>
              </tr>
              ${payroll.allowances > 0 ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0;font-size:13px;color:#475569;">Allowances</td><td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#1e293b;">${fmtKes(payroll.allowances)}</td></tr>` : ''}
              ${payroll.overtime > 0  ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0;font-size:13px;color:#475569;">Overtime</td><td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#1e293b;">${fmtKes(payroll.overtime)}</td></tr>` : ''}
              ${payroll.bonuses > 0   ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0;font-size:13px;color:#475569;">Bonus</td><td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#1e293b;">${fmtKes(payroll.bonuses)}</td></tr>` : ''}
              <tr>
                <td style="padding:8px 0 4px;font-size:14px;font-weight:900;color:#1e293b;">Gross Salary</td>
                <td style="padding:8px 0 4px;text-align:right;font-size:14px;font-weight:900;color:#1e293b;">${fmtKes(payroll.grossSalary)}</td>
              </tr>
            </table>
          </div>

          <!-- Deductions -->
          <div style="margin-bottom:16px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Deductions</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 0;font-size:13px;color:#475569;">PAYE Tax</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#dc2626;">-${fmtKes(payroll.paye)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 0;font-size:13px;color:#475569;">NHIF (SHA)</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#dc2626;">-${fmtKes(payroll.nhif)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px 0;font-size:13px;color:#475569;">NSSF</td>
                <td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#dc2626;">-${fmtKes(payroll.nssf)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0 4px;font-size:14px;font-weight:900;color:#1e293b;">Total Deductions</td>
                <td style="padding:8px 0 4px;text-align:right;font-size:14px;font-weight:900;color:#dc2626;">-${fmtKes(totalDeductions)}</td>
              </tr>
            </table>
          </div>

          <!-- Net Pay -->
          <div style="padding:16px 20px;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div style="font-size:14px;font-weight:700;color:#bbf7d0;">Net Pay</div>
            <div style="font-size:22px;font-weight:900;color:#fff;">${fmtKes(payroll.netSalary)}</div>
          </div>

          ${emp.bankName ? `
          <div style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;font-size:12px;color:#64748b;">
            <strong style="color:#1e293b;">Payment via:</strong> ${emp.bankName}${emp.bankAccount ? ` — A/c: ${emp.bankAccount}` : ''}
          </div>` : ''}

          <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
            If you have any discrepancies, please contact HR within 5 working days.<br>
            Log in to the HRMS portal to view and download your full official payslip.
          </p>
        </div>
        <div style="padding:12px 32px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
          <div style="font-size:11px;color:#94a3b8;">
            <strong style="color:#1d4ed8">Helvino Technologies Ltd</strong>
            &nbsp;&middot;&nbsp; Siaya, Kenya &nbsp;&middot;&nbsp; 0110421320 &nbsp;&middot;&nbsp; helvinotechltd@gmail.com
          </div>
        </div>
      </div>
    `

    await sendEmail({
      to: emp.email,
      subject: `Your Payslip — ${monthLabel} ${payroll.year} | Helvino Technologies Ltd`,
      html: emailTemplate(`Payslip — ${monthLabel} ${payroll.year}`, body),
    })

    return NextResponse.json({ message: `Payslip emailed to ${emp.email}` })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message ?? 'Failed to send payslip' }, { status: 500 })
  }
}
