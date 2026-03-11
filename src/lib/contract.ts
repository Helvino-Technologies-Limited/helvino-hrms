export function generateContractHtml(data: {
  employeeCode: string
  firstName: string
  lastName: string
  jobTitle: string
  departmentName: string
  employmentType: string
  dateHired: string | Date
  basicSalary?: number | null
  probationEndDate?: string | Date | null
}): string {
  const year = new Date().getFullYear()
  const startDate = new Date(data.dateHired).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const probEnd = data.probationEndDate
    ? new Date(data.probationEndDate).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null
  const salary = data.basicSalary
    ? `KES ${Number(data.basicSalary).toLocaleString('en-KE', { minimumFractionDigits: 2 })} gross per month`
    : 'As per separate offer letter'
  const empType = data.employmentType.replace(/_/g, ' ')
  let clauseIdx = 1

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#1e293b;line-height:1.75;font-size:14px;background:#fff}
    .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px 40px;text-align:center}
    .header h1{color:#fff;font-size:20px;letter-spacing:0.5px}
    .header p{color:#93c5fd;font-size:12px;margin-top:4px}
    .body{padding:32px 48px;max-width:800px;margin:0 auto}
    h2{color:#1e3a5f;text-align:center;font-size:17px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:24px}
    .clause{margin:20px 0}
    .clause h3{color:#2563eb;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:700}
    .clause p,.clause ul{font-size:13.5px;color:#334155}
    .clause ul{padding-left:20px;margin-top:6px}
    .clause ul li{margin-bottom:4px}
    table.details{width:100%;border-collapse:collapse;margin:10px 0}
    table.details td{padding:8px 12px;border:1px solid #e2e8f0;font-size:13px}
    table.details td:first-child{background:#f8fafc;font-weight:700;width:38%;color:#1e3a5f}
    .sig-area{margin-top:40px;padding-top:24px;border-top:2px dashed #cbd5e1;display:flex;gap:40px}
    .sig-block{flex:1}
    .sig-block p{font-size:13px;color:#334155;margin-bottom:4px}
    .sig-line{border-bottom:1px solid #1e293b;margin:36px 0 8px}
    .sig-label{font-size:12px;color:#64748b}
    .footer{background:#f8fafc;padding:14px 48px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
  </style>
</head>
<body>
  <div class="header">
    <h1>Helvino Technologies Limited</h1>
    <p>Employment Contract | Human Resources</p>
  </div>

  <div class="body">
    <h2>Letter of Employment</h2>

    <p style="font-size:13.5px;color:#334155;margin-bottom:20px">
      This Employment Agreement ("<strong>Agreement</strong>") is made on <strong>${startDate}</strong> between
      <strong>Helvino Technologies Limited</strong>, a company incorporated under the laws of Kenya
      ("<strong>Company</strong>"), and <strong>${data.firstName} ${data.lastName}</strong>
      ("<strong>Employee</strong>"), Employee Code: <strong>${data.employeeCode}</strong>.
    </p>

    <div class="clause">
      <h3>${clauseIdx++}. Employment Details</h3>
      <table class="details">
        <tr><td>Full Name</td><td>${data.firstName} ${data.lastName}</td></tr>
        <tr><td>Employee Code</td><td>${data.employeeCode}</td></tr>
        <tr><td>Position / Job Title</td><td>${data.jobTitle}</td></tr>
        <tr><td>Department</td><td>${data.departmentName}</td></tr>
        <tr><td>Employment Type</td><td>${empType}</td></tr>
        <tr><td>Commencement Date</td><td>${startDate}</td></tr>
        ${probEnd ? `<tr><td>Probation End Date</td><td>${probEnd}</td></tr>` : ''}
        <tr><td>Gross Monthly Salary</td><td>${salary}</td></tr>
      </table>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Position &amp; Duties</h3>
      <p>The Employee is appointed as <strong>${data.jobTitle}</strong> in the <strong>${data.departmentName}</strong> department.
      The Employee shall diligently perform all duties assigned and devote full working time and effort to the Company.
      Duties may be reasonably adjusted by the Company from time to time with appropriate notice.</p>
    </div>

    ${probEnd ? `
    <div class="clause">
      <h3>${clauseIdx++}. Probationary Period</h3>
      <p>The Employee will serve a probationary period ending on <strong>${probEnd}</strong>.
      During probation, either party may terminate this Agreement with <strong>seven (7) days</strong> written notice.
      Upon successful completion, the Employee shall be confirmed in their permanent role in writing.</p>
    </div>
    ` : ''}

    <div class="clause">
      <h3>${clauseIdx++}. Remuneration &amp; Benefits</h3>
      <p>The Employee shall receive a gross salary of <strong>${salary}</strong>.
      All statutory deductions — PAYE, NHIF, and NSSF — shall be applied in accordance with Kenyan law.
      Salary shall be paid on or before the last working day of each month via bank transfer.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Leave Entitlements</h3>
      <p>The Employee shall be entitled to the following leave annually, per the Employment Act, Cap 226:</p>
      <ul>
        <li>Annual Leave — <strong>21 working days</strong></li>
        <li>Sick Leave — <strong>14 working days</strong> (with medical certificate)</li>
        <li>Maternity Leave — <strong>90 calendar days</strong> (where applicable)</li>
        <li>Paternity Leave — <strong>14 calendar days</strong> (where applicable)</li>
        <li>Compassionate Leave — <strong>5 working days</strong></li>
      </ul>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Working Hours</h3>
      <p>Normal working hours are <strong>Monday to Friday, 8:00 AM to 5:00 PM</strong> with a one-hour lunch break.
      The Employee may be required to work additional hours when necessary to meet business needs,
      subject to applicable labor regulations.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Confidentiality &amp; Non-Disclosure</h3>
      <p>The Employee shall maintain strict confidentiality of all proprietary, financial, technical, strategic,
      and business information of the Company, its clients, and partners — both during and after employment.
      Unauthorized disclosure shall constitute grounds for immediate termination and legal action.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Intellectual Property</h3>
      <p>All works, inventions, software, designs, reports, and materials created by the Employee in the course of
      their employment shall be the exclusive property of Helvino Technologies Limited.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Termination</h3>
      <p>After probation, either party may terminate this Agreement with <strong>one (1) month</strong> written notice,
      or payment in lieu thereof. The Company reserves the right to terminate without notice in cases of gross misconduct,
      theft, fraud, or serious breach of this Agreement.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Code of Conduct</h3>
      <p>The Employee agrees to adhere to the Company's policies, procedures, and code of conduct as communicated
      from time to time. Violations may result in disciplinary action up to and including termination.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Governing Law</h3>
      <p>This Agreement shall be governed by the laws of the Republic of Kenya, including the Employment Act 2007,
      the Labor Relations Act 2007, and all applicable regulations.</p>
    </div>

    <div class="clause">
      <h3>${clauseIdx++}. Entire Agreement</h3>
      <p>This Agreement constitutes the entire understanding between the parties and supersedes all prior negotiations
      and agreements. Amendments must be in writing and signed by both parties.</p>
    </div>

    <div class="sig-area">
      <div class="sig-block">
        <p><strong>For and on Behalf of</strong><br>Helvino Technologies Limited</p>
        <div class="sig-line"></div>
        <p class="sig-label">Authorized Signatory — HR Department<br>Date: ${startDate}</p>
      </div>
      <div class="sig-block">
        <p><strong>Employee Acceptance</strong><br>${data.firstName} ${data.lastName}</p>
        <div class="sig-line"></div>
        <p class="sig-label">Employee Digital Signature<br>Date: __________________</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>© ${year} Helvino Technologies Limited | Nairobi, Kenya | hr@helvino.org | 0703445756 | helvinocrm.org</p>
    <p style="margin-top:4px">Digital signatures on this document are legally binding under the Kenya Information and Communications Act.</p>
  </div>
</body>
</html>`
}
