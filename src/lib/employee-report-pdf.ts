// ─── Employee Register — HTML Generator ──────────────────────────────────────
// The HTML is rendered off-screen in a hidden div; the download function
// renders each logical section as a separate canvas, so employee cards are
// never split across pages.

const COMPANY = {
  name: 'Helvino Technologies Ltd',
  address: 'Siaya, Kenya',
  poBox: 'P.O Box 12345-40600 Siaya',
  phone: '0110421320',
  email: 'helvinotechltd@gmail.com',
  website: 'helvino.org',
  logo: 'https://helvino.org/images/logo.png',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Employee = Record<string, any>

function fmt(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

function fmtDate(val: unknown): string {
  if (!val) return '—'
  try {
    return new Date(String(val)).toLocaleDateString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

function fmtCurrency(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  const n = parseFloat(String(val))
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', minimumFractionDigits: 2,
  }).format(n)
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a',
  ON_LEAVE: '#ca8a04',
  SUSPENDED: '#dc2626',
  PROBATION: '#7c3aed',
  RESIGNED: '#475569',
  TERMINATED: '#991b1b',
}

function badge(status: string) {
  const bg = STATUS_COLOR[status] ?? '#64748b'
  return `<span style="background:${bg};color:#fff;padding:2px 7px;border-radius:3px;font-size:8.5px;font-weight:700;letter-spacing:.4px;white-space:nowrap;">${status.replace('_', ' ')}</span>`
}

function dtRow(label: string, value: string, mono = false) {
  return `<tr>
    <td style="padding:2.5px 0;font-size:8.5px;color:#64748b;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:2.5px 0 2.5px 8px;font-size:9px;color:${mono ? '#1d4ed8' : '#1e293b'};font-weight:${mono ? '700' : '500'};font-family:${mono ? 'monospace' : 'inherit'};vertical-align:top;">${value}</td>
  </tr>`
}

function docStatus(url: string | null) {
  return url
    ? `<span style="color:#16a34a;font-weight:700;font-size:8.5px;">&#10003; On file</span>`
    : `<span style="color:#dc2626;font-size:8.5px;">Not uploaded</span>`
}

function employeeCard(emp: Employee, index: number): string {
  const dept = emp.department?.name ?? '—'
  const manager = emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'
  const fullName = `${emp.firstName} ${emp.lastName}`
  const addr = [emp.address, emp.city, emp.country].filter(Boolean).join(', ') || '—'

  return `
<div class="emp-card">
  <div style="background:linear-gradient(90deg,#1e3a8a,#1d4ed8);padding:7px 12px;display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="background:rgba(255,255,255,.2);color:#fff;font-weight:800;font-size:11px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${index}</div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:12px;">${fullName}</div>
        <div style="color:#bfdbfe;font-size:9px;">${fmt(emp.jobTitle)} &nbsp;·&nbsp; ${dept}</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="color:#bfdbfe;font-size:8px;margin-bottom:2px;">Employee Code</div>
      <div style="color:#fff;font-weight:800;font-size:12px;letter-spacing:.5px;">${fmt(emp.employeeCode)}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;">
    <div style="padding:9px 11px;border-right:1px solid #e2e8f0;">
      <div class="ct">Personal Details</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('National ID', fmt(emp.nationalId))}
        ${dtRow('Date of Birth', fmtDate(emp.dateOfBirth))}
        ${dtRow('Gender', fmt(emp.gender))}
        ${dtRow('Address', addr)}
        ${dtRow('Work Email', fmt(emp.email))}
        ${dtRow('Personal Email', fmt(emp.personalEmail))}
        ${dtRow('Phone', fmt(emp.phone))}
        ${dtRow('Emergency Contact', fmt(emp.emergencyContact))}
        ${dtRow('Emergency Phone', fmt(emp.emergencyPhone))}
      </table>
      <div class="ct" style="margin-top:7px;">Employment</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('Status', badge(emp.employmentStatus))}
        ${dtRow('Type', fmt(emp.employmentType).replace('_', ' '))}
        ${dtRow('Date Hired', fmtDate(emp.dateHired))}
        ${dtRow('Probation End', fmtDate(emp.probationEndDate))}
        ${dtRow('Department', dept)}
        ${dtRow('Manager', manager)}
      </table>
    </div>
    <div style="padding:9px 11px;border-right:1px solid #e2e8f0;">
      <div class="ct">Statutory (Kenya)</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('KRA PIN', fmt(emp.kraPin), true)}
        ${dtRow('NSSF Number', fmt(emp.nssfNumber), true)}
        ${dtRow('SHA Number', fmt(emp.shaNumber), true)}
      </table>
      <div class="ct" style="margin-top:7px;">Compensation</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:2.5px 0;font-size:8.5px;color:#64748b;width:42%;">Basic Salary</td>
          <td style="padding:2.5px 0 2.5px 8px;font-size:10px;font-weight:800;color:#16a34a;">${fmtCurrency(emp.basicSalary)}</td>
        </tr>
      </table>
      <div class="ct" style="margin-top:7px;">Bank Details</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('Bank Name', fmt(emp.bankName))}
        ${dtRow('Branch', fmt(emp.bankBranch))}
        ${dtRow('Bank Code', fmt(emp.bankCode))}
        ${dtRow('Account No.', fmt(emp.bankAccount), true)}
        ${dtRow('M-Pesa No.', fmt(emp.mpesaPhone))}
      </table>
    </div>
    <div style="padding:9px 11px;">
      <div class="ct">Document Status</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('Employment Contract', docStatus(emp.contractUrl))}
        ${dtRow('NDA', docStatus(emp.ndaUrl))}
        ${dtRow('National ID (Front)', docStatus(emp.idFrontUrl))}
        ${dtRow('National ID (Back)', docStatus(emp.idBackUrl))}
        ${dtRow('KRA PIN Certificate', docStatus(emp.kraPinUrl))}
        ${dtRow('NSSF Card', docStatus(emp.nssfCardUrl))}
        ${dtRow('SHA Card', docStatus(emp.nhifCardUrl))}
        ${dtRow('Passport Photo', docStatus(emp.passportPhotoUrl))}
      </table>
      <div class="ct" style="margin-top:7px;">Record</div>
      <table style="width:100%;border-collapse:collapse;">
        ${dtRow('Added', fmtDate(emp.createdAt))}
        ${dtRow('Updated', fmtDate(emp.updatedAt))}
      </table>
    </div>
  </div>
</div>`
}

function summaryRow(emp: Employee, i: number): string {
  const dept = emp.department?.name ?? '—'
  return `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
    <td>${i}</td>
    <td style="font-weight:600;">${emp.firstName} ${emp.lastName}</td>
    <td style="font-family:monospace;">${fmt(emp.employeeCode)}</td>
    <td>${fmt(emp.jobTitle)}</td>
    <td>${dept}</td>
    <td>${badge(emp.employmentStatus)}</td>
    <td>${fmt(emp.employmentType).replace('_', ' ')}</td>
    <td style="font-family:monospace;">${fmt(emp.kraPin)}</td>
    <td style="font-family:monospace;">${fmt(emp.nssfNumber)}</td>
    <td style="font-family:monospace;">${fmt(emp.shaNumber)}</td>
    <td style="text-align:right;font-weight:700;color:#16a34a;">${fmtCurrency(emp.basicSalary)}</td>
    <td>${fmt(emp.bankName)}</td>
    <td style="font-family:monospace;">${fmt(emp.bankAccount)}</td>
  </tr>`
}

// ─── HTML sections ────────────────────────────────────────────────────────────
// We wrap each logical section in a div with a data-section attribute so the
// downloader can query them individually and render each as its own canvas.

export function generateEmployeeReportHtml(employees: Employee[]): string {
  const now = new Date()
  const reportDate = now.toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })
  const reportTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })

  const active    = employees.filter(e => e.employmentStatus === 'ACTIVE').length
  const onLeave   = employees.filter(e => e.employmentStatus === 'ON_LEAVE').length
  const probation = employees.filter(e => e.employmentStatus === 'PROBATION').length
  const suspended = employees.filter(e => e.employmentStatus === 'SUSPENDED').length

  const css = `
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#1e293b;background:#fff;}
    .wrap{width:1050px;padding:0;}
    .ct{font-size:8px;font-weight:700;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #dbeafe;padding-bottom:2px;margin-bottom:4px;}
    .emp-card{border:1px solid #d1d5db;border-radius:5px;margin-bottom:12px;overflow:hidden;}
    .sh{font-size:11px;font-weight:800;color:#1e3a8a;letter-spacing:.4px;text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:6px;}
    .sh .n{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#1e3a8a;color:#fff;font-size:10px;font-weight:800;flex-shrink:0;}
    .st{width:100%;border-collapse:collapse;font-size:8.5px;}
    .st thead th{background:#1e3a8a;color:#fff;padding:5px 7px;text-align:left;font-weight:700;white-space:nowrap;}
    .st td{padding:4px 7px;vertical-align:middle;border-bottom:1px solid #e2e8f0;}
    .st tbody tr:nth-child(even) td{background:#f8fafc;}
    .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
    .sc{border:1px solid #e2e8f0;border-radius:5px;padding:8px 10px;text-align:center;}
    .sc .n{font-size:20px;font-weight:800;color:#1d4ed8;}
    .sc .l{font-size:8px;color:#64748b;margin-top:1px;}
  `

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<style>${css}</style></head><body><div class="wrap">

<div data-section="header" style="padding:20px 28px 0;">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:10px;">
    <img src="${COMPANY.logo}" alt="Helvino Technologies" style="height:56px;width:auto;object-fit:contain;" crossorigin="anonymous"/>
    <div style="text-align:right;flex:1;">
      <div style="font-size:18px;font-weight:900;color:#1e293b;line-height:1.2;">${COMPANY.name}</div>
      <div style="font-size:9.5px;color:#64748b;margin-top:3px;line-height:1.8;">
        ${COMPANY.address} &nbsp;·&nbsp; ${COMPANY.poBox}<br/>
        Tel: ${COMPANY.phone} &nbsp;|&nbsp; ${COMPANY.email} &nbsp;|&nbsp; ${COMPANY.website}
      </div>
    </div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9);border-radius:2px;margin-bottom:3px;"></div>
  <div style="height:1px;background:#e2e8f0;margin-bottom:12px;"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
    <div>
      <div style="font-size:16px;font-weight:900;color:#1e3a8a;">EMPLOYEE REGISTER — CONFIDENTIAL</div>
      <div style="font-size:9.5px;color:#64748b;margin-top:2px;">Comprehensive Human Resources Personnel Report</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#64748b;line-height:1.9;">
      <div><strong style="color:#1e293b;">Date:</strong> ${reportDate} at ${reportTime}</div>
      <div><strong style="color:#1e293b;">Total employees:</strong> ${employees.length}</div>
      <div style="margin-top:3px;background:#fef2f2;border:1px solid #fca5a5;border-radius:3px;padding:2px 7px;font-size:8px;color:#991b1b;font-weight:700;">
        &#128274; STRICTLY CONFIDENTIAL — HR USE ONLY
      </div>
    </div>
  </div>
  <div class="stats" style="margin-bottom:0;">
    <div class="sc"><div class="n">${employees.length}</div><div class="l">Total</div></div>
    <div class="sc"><div class="n" style="color:#16a34a;">${active}</div><div class="l">Active</div></div>
    <div class="sc"><div class="n" style="color:#ca8a04;">${onLeave}</div><div class="l">On Leave</div></div>
    <div class="sc"><div class="n" style="color:#7c3aed;">${probation}</div><div class="l">Probation</div></div>
    <div class="sc"><div class="n" style="color:#dc2626;">${suspended}</div><div class="l">Suspended</div></div>
  </div>
</div>

<div data-section="summary" style="padding:16px 28px 0;">
  <div class="sh"><span class="n">1</span> Employee Summary Register</div>
  <table class="st">
    <thead><tr>
      <th>#</th><th>Full Name</th><th>Code</th><th>Job Title</th>
      <th>Department</th><th>Status</th><th>Type</th>
      <th>KRA PIN</th><th>NSSF No.</th><th>SHA No.</th>
      <th style="text-align:right;">Basic Salary</th><th>Bank</th><th>Account No.</th>
    </tr></thead>
    <tbody>${employees.map((e, i) => summaryRow(e, i + 1)).join('')}</tbody>
  </table>
</div>

<div data-section="detail-heading" style="padding:18px 28px 10px;">
  <div class="sh"><span class="n">2</span> Detailed Employee Profiles</div>
</div>

${employees.map((e, i) => `
<div data-section="card" style="padding:0 28px;">${employeeCard(e, i + 1)}</div>`).join('')}

<div data-section="signoff" style="padding:10px 28px 20px;">
  <div style="border:1px solid #e2e8f0;border-radius:5px;padding:14px 20px;background:#f8fafc;">
    <div style="font-size:10px;font-weight:700;color:#1e3a8a;letter-spacing:.4px;text-transform:uppercase;margin-bottom:14px;">
      HR Department Sign-off &amp; Authorization
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;">
      <div>
        <div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:26px;">Prepared By (HR Officer)</div>
        <div style="border-bottom:1.5px solid #334155;margin-bottom:5px;"></div>
        <div style="font-size:8.5px;color:#64748b;">Name: _______________________</div>
        <div style="font-size:8.5px;color:#64748b;margin-top:3px;">Date: _______________________</div>
      </div>
      <div>
        <div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:26px;">Reviewed By (HR Manager)</div>
        <div style="border-bottom:1.5px solid #334155;margin-bottom:5px;"></div>
        <div style="font-size:8.5px;color:#64748b;">Name: _______________________</div>
        <div style="font-size:8.5px;color:#64748b;margin-top:3px;">Date: _______________________</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">Official Company Seal</div>
        <div style="width:96px;height:96px;border-radius:50%;border:2px dashed #94a3b8;display:flex;align-items:center;justify-content:center;margin:0 auto;background:#fff;">
          <div>
            <div style="font-size:7px;color:#94a3b8;font-weight:700;letter-spacing:.5px;">HELVINO TECH</div>
            <div style="font-size:6px;color:#cbd5e1;margin-top:2px;">OFFICIAL SEAL</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div data-section="footer" style="padding:0 28px 20px;">
  <div style="border-top:3px solid #1d4ed8;padding-top:7px;">
    <div style="font-size:7.5px;color:#64748b;text-align:center;line-height:1.7;">
      <strong style="color:#1d4ed8;">${COMPANY.name}</strong>
      &nbsp;·&nbsp; ${COMPANY.address} &nbsp;·&nbsp; ${COMPANY.phone}
      &nbsp;·&nbsp; ${COMPANY.email} &nbsp;·&nbsp; ${COMPANY.website}<br/>
      <span style="color:#dc2626;font-weight:700;">CONFIDENTIAL</span>
      — This document contains sensitive personal &amp; financial data.
      Unauthorised disclosure is strictly prohibited. For internal HR use only.
      Generated ${reportDate} at ${reportTime}.
    </div>
  </div>
</div>

</div></body></html>`
}
