const LOGO_URL = 'https://helvino.org/images/logo.png'

function fmtKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface SalesPerformanceData {
  clientTarget: number
  revenueTarget: number
  clientsAchieved: number
  revenueAchieved: number
  targetMet: boolean
  clientsDetails?: Array<{ companyName: string; createdAt: string | Date }>
}

export interface PayslipPdfData {
  // Payroll record
  id: string
  month: number
  year: number
  basicSalary: number
  allowances: number
  overtime: number
  bonuses: number
  grossSalary: number
  paye: number
  nhif: number
  nssf: number
  otherDeductions: number
  netSalary: number
  status: string
  paymentDate?: string | Date | null
  paymentRef?: string | null
  generatedAt: string | Date

  // Employee
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
    jobTitle: string
    email: string
    phone?: string | null
    nationalId?: string | null
    kraPin?: string | null
    nssfNumber?: string | null
    shaNumber?: string | null
    bankName?: string | null
    bankBranch?: string | null
    bankCode?: string | null
    bankAccount?: string | null
    mpesaPhone?: string | null
    dateHired?: string | Date | null
    department?: { name: string } | null
  }

  // Sales (only for SALES_AGENT / SALES_MANAGER)
  salesPerformance?: SalesPerformanceData | null

  // Signatory (the admin/HR generating the document)
  signerName?: string
  signerTitle?: string
}

export function generatePayslipHtml(p: PayslipPdfData): string {
  const monthLabel = MONTH_NAMES[p.month - 1]
  const payPeriod  = `${monthLabel} 1 – ${monthLabel} ${new Date(p.year, p.month, 0).getDate()}, ${p.year}`
  const payslipRef = `PS-${p.year}${String(p.month).padStart(2, '0')}-${p.employee.employeeCode}`

  const totalDeductions = p.paye + p.nhif + p.nssf + p.otherDeductions

  const statusColor: Record<string, string> = {
    DRAFT: '#64748b',
    PROCESSED: '#2563eb',
    PAID: '#16a34a',
  }
  const statusBg: Record<string, string> = {
    DRAFT: '#f1f5f9',
    PROCESSED: '#dbeafe',
    PAID: '#dcfce7',
  }
  const sc = statusColor[p.status] ?? '#64748b'
  const sb = statusBg[p.status]  ?? '#f1f5f9'

  // Sales performance section
  const salesSection = p.salesPerformance ? (() => {
    const sp = p.salesPerformance
    const clientPct  = sp.clientTarget  > 0 ? Math.min(100, Math.round((sp.clientsAchieved  / sp.clientTarget)  * 100)) : 0
    const revenuePct = sp.revenueTarget > 0 ? Math.min(100, Math.round((sp.revenueAchieved / sp.revenueTarget) * 100)) : 0
    const metColor   = sp.targetMet ? '#16a34a' : '#dc2626'
    const metBg      = sp.targetMet ? '#f0fdf4' : '#fef2f2'
    const metBorder  = sp.targetMet ? '#bbf7d0' : '#fecaca'
    const metLabel   = sp.targetMet ? 'TARGET ACHIEVED' : 'TARGET NOT MET'

    const clientRows = (sp.clientsDetails ?? []).map((c, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 10px;font-size:11px;color:#334155;font-weight:600;">${c.companyName}</td>
        <td style="padding:6px 10px;font-size:11px;color:#64748b;text-align:right;">${fmtDate(c.createdAt)}</td>
      </tr>`).join('')

    return `
    <!-- Sales Performance -->
    <div style="margin-bottom:16px;border:1.5px solid ${metBorder};border-radius:8px;overflow:hidden;background:${metBg};">
      <div style="padding:10px 14px;background:${metBg};border-bottom:1px solid ${metBorder};display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:9px;font-weight:700;color:${metColor};letter-spacing:1.5px;text-transform:uppercase;">Sales Performance — ${monthLabel} ${p.year}</div>
        <div style="font-size:9px;font-weight:900;color:${metColor};padding:3px 10px;background:#fff;border:1.5px solid ${metBorder};border-radius:20px;letter-spacing:1px;">${metLabel}</div>
      </div>
      <div style="padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <!-- Clients -->
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px;">
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;">Clients Acquired</div>
          <div style="font-size:20px;font-weight:900;color:#1e293b;">${sp.clientsAchieved} <span style="font-size:13px;font-weight:600;color:#94a3b8;">/ ${sp.clientTarget} target</span></div>
          <div style="margin-top:6px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
            <div style="width:${clientPct}%;height:6px;background:${metColor};border-radius:3px;"></div>
          </div>
          <div style="font-size:10px;color:${metColor};margin-top:4px;font-weight:600;">${clientPct}% of target</div>
        </div>
        <!-- Revenue -->
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px;">
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;">Revenue Generated</div>
          <div style="font-size:16px;font-weight:900;color:#1e293b;">${fmtKes(sp.revenueAchieved)}</div>
          <div style="font-size:10px;color:#64748b;margin-top:1px;">Target: ${fmtKes(sp.revenueTarget)}</div>
          <div style="margin-top:6px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
            <div style="width:${revenuePct}%;height:6px;background:${metColor};border-radius:3px;"></div>
          </div>
          <div style="font-size:10px;color:${metColor};margin-top:4px;font-weight:600;">${revenuePct}% of target</div>
        </div>
      </div>
      ${clientRows ? `
      <div style="border-top:1px solid ${metBorder};padding:10px 14px;">
        <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;">Clients Acquired This Month</div>
        <table style="width:100%;border-collapse:collapse;border-radius:6px;overflow:hidden;">
          <thead>
            <tr style="background:#1e293b;color:#fff;">
              <th style="padding:6px 10px;font-size:10px;font-weight:600;text-align:left;">Company Name</th>
              <th style="padding:6px 10px;font-size:10px;font-weight:600;text-align:right;">Date Added</th>
            </tr>
          </thead>
          <tbody>${clientRows}</tbody>
        </table>
      </div>` : ''}
    </div>`
  })() : ''

  // Overtime/bonus rows
  const extraEarnings = [
    p.overtime > 0 ? `<tr><td style="padding:5px 0;font-size:12px;color:#475569;">Overtime</td><td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${fmtKes(p.overtime)}</td></tr>` : '',
    p.bonuses > 0  ? `<tr><td style="padding:5px 0;font-size:12px;color:#475569;">Bonus</td><td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${fmtKes(p.bonuses)}</td></tr>` : '',
  ].join('')

  const otherDedRow = p.otherDeductions > 0
    ? `<tr><td style="padding:5px 0;font-size:12px;color:#475569;">Other Deductions</td><td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#dc2626;">-${fmtKes(p.otherDeductions)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payslip ${payslipRef}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;background:#fff;font-size:13px;line-height:1.6}
    .header{padding:24px 48px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
    .header-logo{height:56px;width:auto;object-fit:contain;display:block}
    .header-logo-fallback{height:56px;width:80px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#1e3a5f;letter-spacing:0.5px;background:#e2e8f0;border-radius:8px}
    .header-right{text-align:right;flex:1}
    .company-name{font-size:18px;font-weight:900;color:#1e293b;line-height:1.2}
    .company-meta{font-size:11px;color:#64748b;margin-top:4px;line-height:1.7}
    .accent-bar{margin:12px 48px 0;height:4px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9);border-radius:2px}
    .grey-line{margin:3px 48px 0;height:1px;background:#e2e8f0}
    .body{padding:0 48px}
    .label{font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
    .sig-area{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;padding:16px 0 24px;align-items:flex-start}
    .sig-heading{font-size:9px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px}
    .sig-line{height:48px;border-bottom:1.5px solid #334155;margin-bottom:6px;position:relative}
    .sig-detail{font-size:11px;color:#334155;line-height:1.8;margin-top:4px}
    .sig-detail strong{font-weight:700;margin-right:6px}
    .sig-underline{display:inline-block;min-width:110px;border-bottom:1px solid #94a3b8;padding-bottom:1px}
    .stamp-heading{font-size:9px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;text-align:center}
    .stamp-circle{width:90px;height:90px;border-radius:50%;border:2.5px dashed #94a3b8;display:flex;align-items:center;justify-content:center;margin:0 auto;background:#f8fafc}
    .stamp-text{font-size:8px;color:#cbd5e1;font-weight:600;letter-spacing:1px;text-align:center}
    .footer{border-top:3px solid #1d4ed8;margin:0;padding:8px 48px 16px}
    .footer-text{font-size:8.5px;color:#64748b;text-align:center;line-height:1.6}
    @media print{body{font-size:12px}.body{padding:0 30px}.header{padding:16px 30px 0}.footer{padding:6px 30px 12px}}
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <img src="${LOGO_URL}" alt="Helvino Technologies" class="header-logo"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="header-logo-fallback" style="display:none">HELVINO</div>
    </div>
    <div class="header-right">
      <div class="company-name">Helvino Technologies Ltd</div>
      <div class="company-meta">
        <div>Siaya, Kenya &nbsp;&middot;&nbsp; P.O Box 12345-40600 Siaya</div>
        <div>Tel: 0110421320 &nbsp;&middot;&nbsp; helvinotechltd@gmail.com</div>
        <div>helvino.org</div>
      </div>
    </div>
  </div>
  <div class="accent-bar"></div>
  <div class="grey-line"></div>

  <!-- Body -->
  <div class="body">

    <!-- Title row -->
    <div style="padding:16px 0 12px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;border-bottom:1px solid #e2e8f0;margin-bottom:16px;">
      <div>
        <div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#1d4ed8;">PAYSLIP</div>
        <div style="font-size:12px;font-weight:700;color:#64748b;margin-top:2px;">${payslipRef}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.8;">
        <div><strong>Pay Period:</strong> ${payPeriod}</div>
        <div><strong>Generated:</strong> ${fmtDate(p.generatedAt)}</div>
        ${p.paymentDate ? `<div><strong>Payment Date:</strong> ${fmtDate(p.paymentDate)}</div>` : ''}
        ${p.paymentRef  ? `<div><strong>Payment Ref:</strong> ${p.paymentRef}</div>` : ''}
        <div style="margin-top:4px;">
          <span style="display:inline-block;padding:2px 12px;border-radius:20px;font-size:10px;font-weight:700;background:${sb};color:${sc};">${p.status}</span>
        </div>
      </div>
    </div>

    <!-- Employee info -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div>
        <div class="label">Employee</div>
        <div style="font-weight:900;font-size:16px;color:#1e293b;">${p.employee.firstName} ${p.employee.lastName}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">${p.employee.jobTitle}</div>
        <div style="font-size:11px;color:#64748b;">${p.employee.department?.name ?? '—'}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Code: <strong style="color:#475569;">${p.employee.employeeCode}</strong></div>
        ${p.employee.dateHired ? `<div style="font-size:11px;color:#94a3b8;">Hire Date: <strong style="color:#475569;">${fmtDate(p.employee.dateHired)}</strong></div>` : ''}
      </div>
      <div style="font-size:11px;color:#64748b;line-height:1.9;">
        <div class="label">Bank &amp; Tax Details</div>
        ${p.employee.bankName    ? `<div><span style="color:#94a3b8;">Bank:</span> <strong style="color:#1e293b;">${p.employee.bankName}${p.employee.bankBranch ? ` — ${p.employee.bankBranch}` : ''}</strong></div>` : ''}
        ${p.employee.bankAccount ? `<div><span style="color:#94a3b8;">Account:</span> <strong style="color:#1e293b;">${p.employee.bankAccount}</strong>${p.employee.bankCode ? ` (${p.employee.bankCode})` : ''}</div>` : ''}
        ${p.employee.mpesaPhone  ? `<div><span style="color:#94a3b8;">M-Pesa:</span> <strong style="color:#1e293b;">${p.employee.mpesaPhone}</strong></div>` : ''}
        ${p.employee.kraPin      ? `<div><span style="color:#94a3b8;">KRA PIN:</span> <strong style="color:#1e293b;">${p.employee.kraPin}</strong></div>` : ''}
        ${p.employee.nssfNumber  ? `<div><span style="color:#94a3b8;">NSSF No:</span> <strong style="color:#1e293b;">${p.employee.nssfNumber}</strong></div>` : ''}
        ${p.employee.shaNumber   ? `<div><span style="color:#94a3b8;">SHA No:</span> <strong style="color:#1e293b;">${p.employee.shaNumber}</strong></div>` : ''}
        ${p.employee.nationalId  ? `<div><span style="color:#94a3b8;">ID No:</span> <strong style="color:#1e293b;">${p.employee.nationalId}</strong></div>` : ''}
      </div>
    </div>

    <!-- Earnings & Deductions side by side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

      <!-- Earnings -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="padding:8px 14px;background:#1e293b;">
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">Earnings</div>
        </div>
        <div style="padding:10px 14px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:12px;color:#475569;">Basic Salary</td>
              <td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${fmtKes(p.basicSalary)}</td>
            </tr>
            ${p.allowances > 0 ? `<tr><td style="padding:5px 0;font-size:12px;color:#475569;">Allowances</td><td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${fmtKes(p.allowances)}</td></tr>` : ''}
            ${extraEarnings}
            <tr style="border-top:2px solid #1e293b;">
              <td style="padding:7px 0 3px;font-size:13px;font-weight:900;color:#1e293b;">Gross Salary</td>
              <td style="padding:7px 0 3px;text-align:right;font-size:14px;font-weight:900;color:#1e293b;">${fmtKes(p.grossSalary)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Deductions -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="padding:8px 14px;background:#1e293b;">
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">Deductions</div>
        </div>
        <div style="padding:10px 14px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:12px;color:#475569;">PAYE Tax</td>
              <td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#dc2626;">-${fmtKes(p.paye)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:12px;color:#475569;">NHIF (SHA)</td>
              <td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#dc2626;">-${fmtKes(p.nhif)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:12px;color:#475569;">NSSF</td>
              <td style="padding:5px 0;text-align:right;font-size:12px;font-weight:600;color:#dc2626;">-${fmtKes(p.nssf)}</td>
            </tr>
            ${otherDedRow}
            <tr style="border-top:2px solid #1e293b;">
              <td style="padding:7px 0 3px;font-size:13px;font-weight:900;color:#1e293b;">Total Deductions</td>
              <td style="padding:7px 0 3px;text-align:right;font-size:14px;font-weight:900;color:#dc2626;">-${fmtKes(totalDeductions)}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Net Pay banner -->
    <div style="padding:16px 20px;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div>
        <div style="font-size:9px;font-weight:700;color:#bbf7d0;letter-spacing:1.5px;text-transform:uppercase;">Net Pay</div>
        <div style="font-size:10px;color:#86efac;margin-top:1px;">Amount payable to employee</div>
      </div>
      <div style="font-size:28px;font-weight:900;color:#fff;">${fmtKes(p.netSalary)}</div>
    </div>

    ${salesSection}

    <!-- Signature block -->
    <div style="border-top:1px solid #e2e8f0;margin-top:8px;"></div>
    <div class="sig-area">
      <div>
        <div class="sig-heading">HR / Finance Authorisation</div>
        <div class="sig-line">
          ${p.signerName ? `<div style="position:absolute;bottom:4px;font-size:11px;color:#1e293b;font-style:italic;font-weight:600;">${p.signerName}</div>` : ''}
        </div>
        <div class="sig-detail">
          <div><strong>Name:</strong> <span class="sig-underline">${p.signerName ?? ''}</span></div>
          <div><strong>Title:</strong> <span class="sig-underline">${p.signerTitle ?? ''}</span></div>
          <div><strong>Date:</strong> <span class="sig-underline"></span></div>
        </div>
      </div>
      <div>
        <div class="sig-heading">Employee Acknowledgement</div>
        <div class="sig-line"></div>
        <div class="sig-detail">
          <div><strong>Name:</strong> <span class="sig-underline">${p.employee.firstName} ${p.employee.lastName}</span></div>
          <div><strong>Date:</strong> <span class="sig-underline"></span></div>
        </div>
      </div>
      <div>
        <div class="stamp-heading">Official Stamp</div>
        <div class="stamp-circle">
          <div class="stamp-text">STAMP<br>HERE</div>
        </div>
      </div>
    </div>

    <div style="font-size:9.5px;color:#94a3b8;text-align:center;margin-bottom:12px;line-height:1.6;">
      This payslip is a confidential document issued by Helvino Technologies Ltd to the named employee only.<br>
      Any discrepancies must be reported to HR within 5 working days of receipt.
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      <strong style="color:#1d4ed8">Helvino Technologies Ltd</strong>
      &nbsp;&middot;&nbsp; Siaya, Kenya
      &nbsp;&middot;&nbsp; 0110421320
      &nbsp;&middot;&nbsp; helvinotechltd@gmail.com
      &nbsp;&middot;&nbsp; helvino.org
    </div>
  </div>

</body>
</html>`
}
