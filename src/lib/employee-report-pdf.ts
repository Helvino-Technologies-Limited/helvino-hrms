// ─── Employee Register PDF — HTML Generator ──────────────────────────────────
// Generates a comprehensive, print-ready HTML document used by html2canvas + jsPDF
// Restricted to SUPER_ADMIN / HR_MANAGER only.

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
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(n)
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '#16a34a',
    ON_LEAVE: '#ca8a04',
    SUSPENDED: '#dc2626',
    RESIGNED: '#64748b',
    TERMINATED: '#991b1b',
    PROBATION: '#7c3aed',
  }
  const color = map[status] ?? '#64748b'
  return `<span style="background:${color};color:#fff;padding:1px 6px;border-radius:3px;font-size:8px;font-weight:700;letter-spacing:.5px;">${status}</span>`
}

function employeeBlock(emp: Employee, index: number): string {
  const fullName = `${emp.firstName} ${emp.lastName}`
  const dept = emp.department?.name ?? '—'
  const manager = emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'

  return `
  <div class="emp-block" style="page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:18px;overflow:hidden;">
    <!-- Employee header bar -->
    <div style="background:linear-gradient(90deg,#1e3a8a,#1d4ed8);padding:8px 14px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="background:rgba(255,255,255,.18);color:#fff;font-weight:800;font-size:12px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${index}</div>
        <div>
          <div style="color:#fff;font-weight:700;font-size:13px;">${fullName}</div>
          <div style="color:#bfdbfe;font-size:10px;">${fmt(emp.jobTitle)} · ${dept}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="color:#bfdbfe;font-size:9px;margin-bottom:3px;">Employee Code</div>
        <div style="color:#fff;font-weight:700;font-size:12px;">${fmt(emp.employeeCode)}</div>
      </div>
    </div>

    <!-- Detail grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;background:#fff;">

      <!-- Column 1: Personal Information -->
      <div style="padding:10px 14px;border-right:1px solid #f1f5f9;">
        <div class="section-label">Personal Details</div>
        <table class="detail-table">
          <tr><td class="lbl">National ID</td><td class="val">${fmt(emp.nationalId)}</td></tr>
          <tr><td class="lbl">Date of Birth</td><td class="val">${fmtDate(emp.dateOfBirth)}</td></tr>
          <tr><td class="lbl">Gender</td><td class="val">${fmt(emp.gender)}</td></tr>
          <tr><td class="lbl">Address</td><td class="val">${fmt(emp.address)}${emp.city ? ', ' + emp.city : ''}${emp.country ? ', ' + emp.country : ''}</td></tr>
          <tr><td class="lbl">Email (Work)</td><td class="val">${fmt(emp.email)}</td></tr>
          <tr><td class="lbl">Email (Personal)</td><td class="val">${fmt(emp.personalEmail)}</td></tr>
          <tr><td class="lbl">Phone</td><td class="val">${fmt(emp.phone)}</td></tr>
          <tr><td class="lbl">Emergency Contact</td><td class="val">${fmt(emp.emergencyContact)}</td></tr>
          <tr><td class="lbl">Emergency Phone</td><td class="val">${fmt(emp.emergencyPhone)}</td></tr>
        </table>

        <div class="section-label" style="margin-top:8px;">Employment Details</div>
        <table class="detail-table">
          <tr><td class="lbl">Status</td><td class="val">${statusBadge(emp.employmentStatus)}</td></tr>
          <tr><td class="lbl">Type</td><td class="val">${fmt(emp.employmentType)}</td></tr>
          <tr><td class="lbl">Date Hired</td><td class="val">${fmtDate(emp.dateHired)}</td></tr>
          <tr><td class="lbl">Probation End</td><td class="val">${fmtDate(emp.probationEndDate)}</td></tr>
          <tr><td class="lbl">Department</td><td class="val">${dept}</td></tr>
          <tr><td class="lbl">Manager</td><td class="val">${manager}</td></tr>
        </table>
      </div>

      <!-- Column 2: Statutory & Compliance -->
      <div style="padding:10px 14px;border-right:1px solid #f1f5f9;">
        <div class="section-label">Statutory Compliance (Kenya)</div>
        <table class="detail-table">
          <tr>
            <td class="lbl">KRA PIN</td>
            <td class="val" style="font-family:monospace;font-size:10px;font-weight:700;color:#1d4ed8;">${fmt(emp.kraPin)}</td>
          </tr>
          <tr>
            <td class="lbl">NSSF Number</td>
            <td class="val" style="font-family:monospace;font-size:10px;font-weight:700;color:#1d4ed8;">${fmt(emp.nssfNumber)}</td>
          </tr>
          <tr>
            <td class="lbl">SHA Number</td>
            <td class="val" style="font-family:monospace;font-size:10px;font-weight:700;color:#1d4ed8;">${fmt(emp.shaNumber)}</td>
          </tr>
        </table>

        <div class="section-label" style="margin-top:8px;">Compensation</div>
        <table class="detail-table">
          <tr>
            <td class="lbl">Basic Salary</td>
            <td class="val" style="font-weight:700;color:#16a34a;font-size:11px;">${fmtCurrency(emp.basicSalary)}</td>
          </tr>
        </table>

        <div class="section-label" style="margin-top:8px;">Bank Details</div>
        <table class="detail-table">
          <tr><td class="lbl">Bank Name</td><td class="val">${fmt(emp.bankName)}</td></tr>
          <tr><td class="lbl">Branch</td><td class="val">${fmt(emp.bankBranch)}</td></tr>
          <tr><td class="lbl">Bank Code</td><td class="val">${fmt(emp.bankCode)}</td></tr>
          <tr>
            <td class="lbl">Account No.</td>
            <td class="val" style="font-family:monospace;font-size:10px;font-weight:700;">${fmt(emp.bankAccount)}</td>
          </tr>
          <tr><td class="lbl">M-Pesa No.</td><td class="val">${fmt(emp.mpesaPhone)}</td></tr>
        </table>
      </div>

      <!-- Column 3: Documents & Records -->
      <div style="padding:10px 14px;">
        <div class="section-label">Document Links</div>
        <table class="detail-table">
          <tr><td class="lbl">Contract</td><td class="val">${emp.contractUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">NDA</td><td class="val">${emp.ndaUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">National ID (Front)</td><td class="val">${emp.idFrontUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">National ID (Back)</td><td class="val">${emp.idBackUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">KRA PIN Certificate</td><td class="val">${emp.kraPinUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">NSSF Card</td><td class="val">${emp.nssfCardUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">SHA Card</td><td class="val">${emp.nhifCardUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
          <tr><td class="lbl">Passport Photo</td><td class="val">${emp.passportPhotoUrl ? '<span style="color:#16a34a;font-weight:600;">✓ On file</span>' : '<span style="color:#dc2626;">Not uploaded</span>'}</td></tr>
        </table>

        <div class="section-label" style="margin-top:8px;">System</div>
        <table class="detail-table">
          <tr><td class="lbl">Created</td><td class="val">${fmtDate(emp.createdAt)}</td></tr>
          <tr><td class="lbl">Updated</td><td class="val">${fmtDate(emp.updatedAt)}</td></tr>
        </table>
      </div>
    </div>
  </div>`
}

function summaryRow(emp: Employee, index: number): string {
  const dept = emp.department?.name ?? '—'
  return `
  <tr style="background:${index % 2 === 0 ? '#f8fafc' : '#fff'};">
    <td style="padding:5px 8px;text-align:center;color:#64748b;font-size:9px;">${index}</td>
    <td style="padding:5px 8px;font-weight:600;font-size:10px;">${emp.firstName} ${emp.lastName}</td>
    <td style="padding:5px 8px;font-size:9px;color:#64748b;">${fmt(emp.employeeCode)}</td>
    <td style="padding:5px 8px;font-size:9px;">${fmt(emp.jobTitle)}</td>
    <td style="padding:5px 8px;font-size:9px;">${dept}</td>
    <td style="padding:5px 8px;">${statusBadge(emp.employmentStatus)}</td>
    <td style="padding:5px 8px;font-size:9px;">${fmt(emp.employmentType)}</td>
    <td style="padding:5px 8px;font-size:9px;font-family:monospace;">${fmt(emp.kraPin)}</td>
    <td style="padding:5px 8px;font-size:9px;font-family:monospace;">${fmt(emp.nssfNumber)}</td>
    <td style="padding:5px 8px;font-size:9px;font-family:monospace;">${fmt(emp.shaNumber)}</td>
    <td style="padding:5px 8px;font-size:9px;text-align:right;font-weight:600;color:#16a34a;">${fmtCurrency(emp.basicSalary)}</td>
    <td style="padding:5px 8px;font-size:9px;">${fmt(emp.bankName)}</td>
    <td style="padding:5px 8px;font-size:9px;font-family:monospace;">${fmt(emp.bankAccount)}</td>
  </tr>`
}

export function generateEmployeeReportHtml(employees: Employee[]): string {
  const now = new Date()
  const reportDate = now.toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })
  const reportTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })

  const active = employees.filter(e => e.employmentStatus === 'ACTIVE').length
  const onLeave = employees.filter(e => e.employmentStatus === 'ON_LEAVE').length
  const probation = employees.filter(e => e.employmentStatus === 'PROBATION').length
  const inactive = employees.length - active - onLeave - probation

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color:#1e293b; background:#fff; width:1100px; }
  .section-label { font-size:8.5px;font-weight:700;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;border-bottom:1px solid #dbeafe;padding-bottom:2px; }
  .detail-table { width:100%;border-collapse:collapse; }
  .detail-table .lbl { font-size:8.5px;color:#64748b;padding:2px 0;width:45%;vertical-align:top; }
  .detail-table .val { font-size:9px;color:#1e293b;padding:2px 0 2px 6px;font-weight:500;vertical-align:top; }
  .stat-card { background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;text-align:center; }
  .stat-card .num { font-size:22px;font-weight:800;color:#1d4ed8; }
  .stat-card .lbl { font-size:9px;color:#64748b;margin-top:2px; }
  thead th { background:#1e3a8a;color:#fff;padding:6px 8px;font-size:9.5px;text-align:left;font-weight:700; }
</style>
</head>
<body>

<!-- ═══════════════════ LETTERHEAD ═══════════════════ -->
<div style="padding:24px 40px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;">
  <div style="flex-shrink:0;">
    <img src="${COMPANY.logo}" alt="Helvino Technologies" style="height:60px;width:auto;object-fit:contain;display:block;" crossorigin="anonymous"/>
  </div>
  <div style="text-align:right;flex:1;">
    <div style="font-size:19px;font-weight:900;color:#1e293b;line-height:1.2;">${COMPANY.name}</div>
    <div style="font-size:10.5px;color:#64748b;margin-top:4px;line-height:1.8;">
      <div>${COMPANY.address} · ${COMPANY.poBox}</div>
      <div>Tel: ${COMPANY.phone} &nbsp;|&nbsp; Email: ${COMPANY.email} &nbsp;|&nbsp; Web: ${COMPANY.website}</div>
    </div>
  </div>
</div>

<!-- accent bars -->
<div style="margin:10px 40px 0;height:4px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9);border-radius:2px;"></div>
<div style="margin:3px 40px 0;height:1px;background:#e2e8f0;"></div>

<!-- ═══════════════════ REPORT TITLE ═══════════════════ -->
<div style="padding:14px 40px 10px;display:flex;align-items:flex-start;justify-content:space-between;">
  <div>
    <div style="font-size:17px;font-weight:800;color:#1e3a8a;letter-spacing:-.3px;">EMPLOYEE REGISTER — CONFIDENTIAL</div>
    <div style="font-size:10px;color:#64748b;margin-top:3px;">Comprehensive Human Resources Employee Report</div>
  </div>
  <div style="text-align:right;font-size:9.5px;color:#64748b;line-height:1.8;">
    <div><strong style="color:#1e293b;">Date Generated:</strong> ${reportDate}</div>
    <div><strong style="color:#1e293b;">Time:</strong> ${reportTime}</div>
    <div><strong style="color:#1e293b;">Total Employees:</strong> ${employees.length}</div>
    <div style="margin-top:3px;background:#fff3cd;border:1px solid #ffc107;border-radius:3px;padding:2px 6px;font-size:8.5px;color:#856404;font-weight:700;">
      &#128274; STRICTLY CONFIDENTIAL — HR USE ONLY
    </div>
  </div>
</div>

<!-- ═══════════════════ STATS ROW ═══════════════════ -->
<div style="padding:0 40px 14px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">
  <div class="stat-card"><div class="num">${employees.length}</div><div class="lbl">Total Employees</div></div>
  <div class="stat-card"><div class="num" style="color:#16a34a;">${active}</div><div class="lbl">Active</div></div>
  <div class="stat-card"><div class="num" style="color:#ca8a04;">${onLeave}</div><div class="lbl">On Leave</div></div>
  <div class="stat-card"><div class="num" style="color:#7c3aed;">${probation}</div><div class="lbl">Probation</div></div>
  <div class="stat-card"><div class="num" style="color:#dc2626;">${inactive}</div><div class="lbl">Inactive/Separated</div></div>
</div>

<!-- ═══════════════════ SECTION 1: SUMMARY TABLE ═══════════════════ -->
<div style="padding:0 40px 20px;">
  <div style="font-size:11px;font-weight:700;color:#1e3a8a;letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
    <span style="display:inline-block;width:18px;height:18px;background:#1e3a8a;color:#fff;border-radius:50%;text-align:center;line-height:18px;font-size:10px;">1</span>
    Employee Summary Register
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
    <thead>
      <tr>
        <th style="width:30px;">#</th>
        <th>Full Name</th>
        <th>Emp. Code</th>
        <th>Job Title</th>
        <th>Department</th>
        <th>Status</th>
        <th>Type</th>
        <th>KRA PIN</th>
        <th>NSSF No.</th>
        <th>SHA No.</th>
        <th style="text-align:right;">Basic Salary</th>
        <th>Bank</th>
        <th>Account No.</th>
      </tr>
    </thead>
    <tbody>
      ${employees.map((emp, i) => summaryRow(emp, i + 1)).join('')}
    </tbody>
  </table>
</div>

<!-- ═══════════════════ SECTION 2: DETAILED PROFILES ═══════════════════ -->
<div style="padding:0 40px 20px;">
  <div style="font-size:11px;font-weight:700;color:#1e3a8a;letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:6px;">
    <span style="display:inline-block;width:18px;height:18px;background:#1e3a8a;color:#fff;border-radius:50%;text-align:center;line-height:18px;font-size:10px;">2</span>
    Detailed Employee Profiles
  </div>
  ${employees.map((emp, i) => employeeBlock(emp, i + 1)).join('')}
</div>

<!-- ═══════════════════ SIGNATURE & SEAL ═══════════════════ -->
<div style="padding:0 40px 28px;">
  <div style="border:1px solid #e2e8f0;border-radius:6px;padding:18px 24px;background:#f8fafc;">
    <div style="font-size:10px;font-weight:700;color:#1e3a8a;letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px;">
      Authorized By / HR Department Sign-off
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;">
      <!-- Prepared by -->
      <div>
        <div style="font-size:8.5px;color:#64748b;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:28px;">Prepared By (HR Officer)</div>
        <div style="border-bottom:1.5px solid #334155;margin-bottom:5px;"></div>
        <div style="font-size:9px;color:#64748b;">Name: ________________________</div>
        <div style="font-size:9px;color:#64748b;margin-top:3px;">Date: ________________________</div>
      </div>
      <!-- Reviewed by -->
      <div>
        <div style="font-size:8.5px;color:#64748b;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:28px;">Reviewed By (HR Manager)</div>
        <div style="border-bottom:1.5px solid #334155;margin-bottom:5px;"></div>
        <div style="font-size:9px;color:#64748b;">Name: ________________________</div>
        <div style="font-size:9px;color:#64748b;margin-top:3px;">Date: ________________________</div>
      </div>
      <!-- Company Seal -->
      <div style="text-align:center;">
        <div style="font-size:8.5px;color:#64748b;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;">Official Company Seal</div>
        <div style="width:100px;height:100px;border-radius:50%;border:2.5px dashed #94a3b8;display:flex;align-items:center;justify-content:center;margin:0 auto;background:#fff;">
          <div style="text-align:center;">
            <div style="font-size:7.5px;color:#94a3b8;font-weight:700;letter-spacing:.5px;">HELVINO TECH</div>
            <div style="font-size:6.5px;color:#cbd5e1;margin-top:2px;">OFFICIAL SEAL</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<div style="border-top:3px solid #1d4ed8;margin:0 40px;padding-top:8px;padding-bottom:18px;">
  <div style="font-size:8px;color:#64748b;text-align:center;line-height:1.7;">
    <strong style="color:#1d4ed8;">${COMPANY.name}</strong>
    &nbsp;·&nbsp; ${COMPANY.address}
    &nbsp;·&nbsp; ${COMPANY.phone}
    &nbsp;·&nbsp; ${COMPANY.email}
    &nbsp;·&nbsp; ${COMPANY.website}
    <br/>
    <span style="color:#dc2626;font-weight:600;">CONFIDENTIAL</span>
    &nbsp;—&nbsp; This document contains sensitive personal and financial information.
    Unauthorized disclosure is strictly prohibited. For internal HR use only.
    Generated on ${reportDate} at ${reportTime}.
  </div>
</div>

</body>
</html>`
}
