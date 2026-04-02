const LOGO_URL = 'https://helvino.org/images/logo.png'

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
  userRole?: string | null
  // Sales targets (editable per contract)
  agentClientTarget?: number | null
  agentRevenueTarget?: number | null
  managerClientTarget?: number | null
  managerRevenueTarget?: number | null
  // HR signatory
  signerName?: string | null
  signerTitle?: string | null
}): string {
  const year = new Date().getFullYear()
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const startDate = new Date(data.dateHired).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const probEnd = data.probationEndDate
    ? new Date(data.probationEndDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const salary = data.basicSalary
    ? `KES ${Number(data.basicSalary).toLocaleString('en-KE', { minimumFractionDigits: 2 })} gross per month`
    : 'As per separate offer letter'
  const empType = data.employmentType.replace(/_/g, ' ')
  let role = (data.userRole || '').toUpperCase()
  // Fallback: infer sales role from job title when User account has a generic role
  if (role !== 'SALES_MANAGER' && role !== 'SALES_AGENT') {
    const titleLower = (data.jobTitle || '').toLowerCase()
    if (
      titleLower.includes('sales manager') ||
      titleLower.includes('sales team lead') ||
      titleLower.includes('sales supervisor') ||
      titleLower.includes('sales director')
    ) {
      role = 'SALES_MANAGER'
    } else if (
      titleLower.includes('sales agent') ||
      titleLower.includes('sales representative') ||
      titleLower.includes('sales rep') ||
      titleLower.includes('sales executive')
    ) {
      role = 'SALES_AGENT'
    }
  }
  // Override SALES_AGENT → SALES_MANAGER if job title clearly says manager
  if (role === 'SALES_AGENT') {
    const titleLower = (data.jobTitle || '').toLowerCase()
    if (
      titleLower.includes('sales manager') ||
      titleLower.includes('sales team lead') ||
      titleLower.includes('sales supervisor') ||
      titleLower.includes('sales director')
    ) {
      role = 'SALES_MANAGER'
    }
  }

  let idx = 1

  // Resolved sales targets (custom or default)
  const agentClients = data.agentClientTarget ?? 5
  const agentRevenue = data.agentRevenueTarget ?? 250000
  const mgrClients   = data.managerClientTarget ?? 10
  const mgrRevenue   = data.managerRevenueTarget ?? 700000

  function fmtKes(n: number) {
    return `KES ${n.toLocaleString('en-KE')}`
  }
  function numWords(n: number) {
    const words: Record<number, string> = { 1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',
      11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty' }
    return words[n] ? `${n} (${words[n]})` : `${n}`
  }

  // Role-specific performance clause
  let performanceClause = ''
  if (role === 'SALES_AGENT') {
    performanceClause = `
    <div class="clause">
      <h3>${idx++}. Performance Standards</h3>
      <p>The Employee shall perform their duties as <strong>${data.jobTitle}</strong> to the highest professional standard. The following mandatory monthly performance standards shall apply to this role and shall form an integral part of this contract:</p>
      <table class="details" style="margin-top:10px">
        <tr><td>Monthly Client Acquisition Target</td><td>Minimum <strong>${numWords(agentClients)}</strong> new clients per calendar month</td></tr>
        <tr><td>Monthly Revenue Target</td><td>Minimum <strong>${fmtKes(agentRevenue)}</strong> gross revenue per calendar month</td></tr>
        <tr><td>Target Review Cycle</td><td>Quarterly — targets may be revised upward or downward by mutual written consent</td></tr>
      </table>
      <p style="margin-top:10px">These targets are the minimum performance standards against which the Employee's output shall be measured on a monthly basis. Consistent failure to meet these standards, without reasonable justification, may result in a formal performance improvement process as per Company policy. Exceptional performance above the stated targets shall be recognised and may attract performance bonuses at Management's discretion.</p>
    </div>`
  } else if (role === 'SALES_MANAGER') {
    performanceClause = `
    <div class="clause">
      <h3>${idx++}. Performance Standards &amp; Team Management</h3>
      <p>The Employee shall perform their duties as <strong>${data.jobTitle}</strong> to the highest professional standard. The following mandatory monthly performance standards shall apply to this role, covering both personal output and team management responsibilities, and shall form an integral part of this contract:</p>
      <table class="details" style="margin-top:10px">
        <tr><td>Team Monthly Client Acquisition Target</td><td>Minimum <strong>${numWords(mgrClients)}</strong> new clients per calendar month across the managed team</td></tr>
        <tr><td>Team Monthly Revenue Target</td><td>Minimum <strong>${fmtKes(mgrRevenue)}</strong> gross revenue per calendar month across the managed team</td></tr>
        <tr><td>Target Review Cycle</td><td>Quarterly — targets may be revised upward or downward by mutual written consent</td></tr>
      </table>
      <p style="margin-top:10px">These targets are the minimum performance standards against which the Employee's output and team performance shall be measured on a monthly basis. The Employee shall be responsible for recruiting, coaching, and managing a team of Sales Agents; setting individual agent targets aligned with the above; conducting regular performance reviews; and reporting team performance to the Company. Consistent failure to meet these standards may result in a formal performance improvement process. Exceptional team performance may attract management bonuses at the Company's discretion.</p>
    </div>`
  } else {
    // General performance clause for all other roles
    performanceClause = `
    <div class="clause">
      <h3>${idx++}. Performance Standards</h3>
      <p>The Employee shall perform their duties as <strong>${data.jobTitle}</strong> in the <strong>${data.departmentName}</strong> department to the highest professional standard. Specific key performance indicators (KPIs) aligned with the role shall be communicated within the first 30 days of employment and reviewed on an annual basis. The Employee is expected to actively participate in all scheduled performance appraisals and training programmes.</p>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Employment Contract — ${data.firstName} ${data.lastName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;line-height:1.8;font-size:13.5px;background:#fff}
    .header{background:linear-gradient(135deg,#0f2744,#1e3a5f,#2563eb);padding:24px 48px;display:flex;align-items:center;gap:20px}
    .header-logo{width:60px;height:60px;object-fit:contain;background:#fff;border-radius:10px;padding:4px;flex-shrink:0}
    .header-logo-fallback{width:60px;height:60px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#1e3a5f;letter-spacing:0.5px;flex-shrink:0;text-align:center;line-height:1.2}
    .header-text h1{color:#fff;font-size:18px;font-weight:900;letter-spacing:0.3px}
    .header-text p{color:#93c5fd;font-size:11px;margin-top:3px}
    .doc-title{background:#f0f7ff;border-bottom:3px solid #2563eb;padding:18px 48px;text-align:center}
    .doc-title h2{color:#1e3a5f;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:2px}
    .doc-title p{color:#64748b;font-size:11px;margin-top:4px}
    .body{padding:32px 48px;max-width:900px;margin:0 auto}
    .intro{font-size:13.5px;color:#334155;margin-bottom:24px;line-height:1.85;padding:16px 20px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0}
    .clause{margin:22px 0;page-break-inside:avoid}
    .clause h3{color:#1e3a5f;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;font-weight:900;padding:6px 10px;background:#f0f7ff;border-radius:4px;display:inline-block}
    .clause p,.clause ul{font-size:13px;color:#334155;margin-top:6px}
    .clause ul{padding-left:22px;margin-top:8px}
    .clause ul li{margin-bottom:5px}
    table.details{width:100%;border-collapse:collapse;margin:10px 0;font-size:12.5px}
    table.details td{padding:8px 14px;border:1px solid #e2e8f0}
    table.details td:first-child{background:#f0f7ff;font-weight:700;width:36%;color:#1e3a5f}
    .sig-area{margin-top:48px;padding-top:28px;border-top:2px dashed #cbd5e1;display:flex;gap:48px}
    .sig-block{flex:1}
    .sig-block .party{font-size:13px;color:#334155;margin-bottom:4px;font-weight:700}
    .sig-block .party-sub{font-size:12px;color:#64748b;margin-bottom:20px}
    .sig-line{border-bottom:1.5px solid #475569;margin-top:44px;margin-bottom:6px}
    .sig-label{font-size:11px;color:#64748b;line-height:1.6}
    .notice{background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:20px;font-size:12px;color:#78350f}
    .footer{background:#f1f5f9;padding:14px 48px;border-top:2px solid #e2e8f0;font-size:10.5px;color:#94a3b8;text-align:center;margin-top:0}
    .footer a{color:#2563eb;text-decoration:none}
    @media print{body{font-size:12px}.body{padding:20px 30px}.header{padding:16px 30px}}
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <img src="${LOGO_URL}" alt="Helvino Technologies" class="header-logo"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <div class="header-logo-fallback" style="display:none">HELVINO</div>
    <div class="header-text">
      <h1>Helvino Technologies Limited</h1>
      <p>Siaya, Kenya &nbsp;·&nbsp; info@helvino.org &nbsp;·&nbsp; +254 110 421 320 &nbsp;·&nbsp; helvino.org</p>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="color:#93c5fd;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Date Issued</div>
      <div style="color:#fff;font-size:12px;font-weight:700;margin-top:2px">${today}</div>
      <div style="color:#93c5fd;font-size:10px;margin-top:4px">Ref: ${data.employeeCode}</div>
    </div>
  </div>

  <!-- Document title -->
  <div class="doc-title">
    <h2>Employment Contract</h2>
    <p>Issued under the Employment Act 2007 (Cap. 226), Laws of Kenya</p>
  </div>

  <div class="body">

    <!-- Intro paragraph -->
    <p class="intro">
      This Employment Agreement ("<strong>Agreement</strong>") is entered into on <strong>${today}</strong>
      between <strong>Helvino Technologies Limited</strong>, a company duly incorporated under the laws of Kenya,
      Registration No. [Company Reg No.] ("<strong>Company</strong>"), and
      <strong>${data.firstName} ${data.lastName}</strong>, National ID No. ________________,
      Employee Code <strong>${data.employeeCode}</strong> ("<strong>Employee</strong>").
      Both parties agree to the terms and conditions set forth herein.
    </p>

    <!-- 1. Employment Details -->
    <div class="clause">
      <h3>${idx++}. Employment Details</h3>
      <table class="details">
        <tr><td>Full Name</td><td>${data.firstName} ${data.lastName}</td></tr>
        <tr><td>Employee Code</td><td>${data.employeeCode}</td></tr>
        <tr><td>Position / Job Title</td><td>${data.jobTitle}</td></tr>
        <tr><td>Department</td><td>${data.departmentName}</td></tr>
        <tr><td>Employment Type</td><td>${empType}</td></tr>
        <tr><td>Commencement Date</td><td>${startDate}</td></tr>
        ${probEnd ? `<tr><td>Probation End Date</td><td>${probEnd}</td></tr>` : ''}
        <tr><td>Gross Monthly Salary</td><td>${salary}</td></tr>
        <tr><td>Place of Work</td><td>Siaya, Kenya (or as directed by the Company)</td></tr>
      </table>
    </div>

    <!-- 2. Position & Duties -->
    <div class="clause">
      <h3>${idx++}. Position &amp; Duties</h3>
      <p>The Employee is appointed to the position of <strong>${data.jobTitle}</strong> in the <strong>${data.departmentName}</strong> department. The Employee shall:</p>
      <ul>
        <li>Diligently and faithfully perform all duties assigned by the Company;</li>
        <li>Devote full working time, attention, and ability to the Company's business;</li>
        <li>Follow all reasonable and lawful directions given by supervisors and management;</li>
        <li>Report to the designated line manager and adhere to the organisational hierarchy;</li>
        <li>Notify the Company promptly of any conflict of interest that may arise during employment.</li>
      </ul>
      <p style="margin-top:8px">The Company reserves the right to reasonably adjust the Employee's duties, reporting lines, or place of work with appropriate notice, provided such adjustments are consistent with the Employee's skills and experience.</p>
    </div>

    <!-- Probation (conditional) -->
    ${probEnd ? `
    <div class="clause">
      <h3>${idx++}. Probationary Period</h3>
      <p>The Employee shall serve a probationary period from <strong>${startDate}</strong> to <strong>${probEnd}</strong>. During this period:</p>
      <ul>
        <li>Either party may terminate this Agreement by giving <strong>seven (7) calendar days'</strong> written notice;</li>
        <li>The Employee's performance shall be reviewed at the midpoint and end of probation;</li>
        <li>Upon successful completion, the Employee shall receive written confirmation of permanent appointment;</li>
        <li>Leave entitlements accrue from the commencement date but cannot be taken during probation without prior approval.</li>
      </ul>
    </div>
    ` : ''}

    <!-- 3. Remuneration & Benefits -->
    <div class="clause">
      <h3>${idx++}. Remuneration &amp; Benefits</h3>
      <p>The Employee's remuneration package shall comprise:</p>
      <ul>
        <li><strong>Gross Monthly Salary:</strong> ${salary}, payable on or before the last working day of each month via bank transfer to the Employee's nominated account;</li>
        <li><strong>Statutory Deductions:</strong> PAYE (Pay As You Earn), NHIF, and NSSF contributions shall be deducted from gross salary in accordance with Kenyan law;</li>
        <li><strong>NHIF:</strong> Monthly contributions as per the NHIF Act rates in force;</li>
        <li><strong>NSSF:</strong> Monthly contributions as per the NSSF Act, 2013 rates;</li>
        <li><strong>Salary Reviews:</strong> The Company may, at its discretion, conduct annual salary reviews. Reviews do not constitute an automatic right to increment.</li>
      </ul>
    </div>

    <!-- Performance Targets (role-specific) -->
    ${performanceClause}

    <!-- Leave Entitlements -->
    <div class="clause">
      <h3>${idx++}. Leave Entitlements</h3>
      <p>The Employee shall be entitled to the following leave per year, subject to applicable law and Company policy:</p>
      <ul>
        <li><strong>Annual Leave:</strong> 21 (twenty-one) working days per year, accruing at 1.75 days per month;</li>
        <li><strong>Sick Leave:</strong> 14 (fourteen) working days on full pay per year (medical certificate required after 3 consecutive days);</li>
        <li><strong>Maternity Leave:</strong> 90 (ninety) calendar days on full pay (where applicable, per Section 29 of the Employment Act);</li>
        <li><strong>Paternity Leave:</strong> 14 (fourteen) calendar days on full pay within the first 2 months of birth (where applicable);</li>
        <li><strong>Compassionate Leave:</strong> Up to 5 (five) working days for bereavement of an immediate family member;</li>
        <li><strong>Public Holidays:</strong> All Kenyan gazetted public holidays as declared by the Government of Kenya.</li>
      </ul>
      <p style="margin-top:8px">All leave must be applied for in advance (except sick leave) and is subject to operational requirements and management approval.</p>
    </div>

    <!-- Working Hours -->
    <div class="clause">
      <h3>${idx++}. Working Hours</h3>
      <p>Normal working hours are <strong>Monday to Friday, 8:00 AM to 5:00 PM</strong>, with a one-hour unpaid lunch break between 1:00 PM and 2:00 PM, totalling 40 (forty) hours per week. The Employee may be required to work additional hours when necessary to fulfil business obligations. Overtime compensation, where applicable, shall be as per the Company's overtime policy and the Employment Act.</p>
    </div>

    <!-- Confidentiality & NDA -->
    <div class="clause">
      <h3>${idx++}. Confidentiality &amp; Non-Disclosure</h3>
      <p>The Employee acknowledges that in the course of employment, they will have access to confidential information belonging to the Company, its clients, suppliers, and partners. The Employee shall:</p>
      <ul>
        <li>Keep strictly confidential all trade secrets, client lists, financial data, pricing, product plans, strategies, and proprietary systems;</li>
        <li>Not disclose any confidential information to any third party, whether during or after employment, without prior written consent of the Company;</li>
        <li>Not use confidential information for personal gain or for the benefit of any competitor or third party;</li>
        <li>Return all Company property, data, and documents immediately upon termination of employment.</li>
      </ul>
      <p style="margin-top:8px">This obligation of confidentiality shall survive termination of this Agreement indefinitely.</p>
    </div>

    <!-- Intellectual Property -->
    <div class="clause">
      <h3>${idx++}. Intellectual Property</h3>
      <p>All inventions, developments, software code, designs, reports, marketing materials, databases, client relationships, methodologies, processes, and any other work product created by the Employee in the course of, or related to, their employment shall be the sole and exclusive property of <strong>Helvino Technologies Limited</strong>. The Employee irrevocably assigns all intellectual property rights in such works to the Company.</p>
    </div>

    <!-- Non-Competition & Non-Solicitation -->
    <div class="clause">
      <h3>${idx++}. Non-Competition &amp; Non-Solicitation</h3>
      <p>During the term of employment and for a period of <strong>12 (twelve) months</strong> following termination, the Employee shall not:</p>
      <ul>
        <li>Directly or indirectly engage in, own, manage, operate, or be employed by any business that competes with the Company's core services in Kenya;</li>
        <li>Solicit or attempt to solicit any client, customer, or supplier of the Company for the benefit of a competing business;</li>
        <li>Solicit or induce any employee of the Company to leave their employment.</li>
      </ul>
    </div>

    <!-- Termination -->
    <div class="clause">
      <h3>${idx++}. Termination of Employment</h3>
      <p>After successful completion of probation, this Agreement may be terminated as follows:</p>
      <ul>
        <li><strong>By either party:</strong> One (1) calendar month's written notice, or payment of one month's gross salary in lieu of notice;</li>
        <li><strong>Summary dismissal (without notice):</strong> The Company may terminate immediately, without notice or pay in lieu, in cases of gross misconduct including but not limited to: theft, fraud, assault, gross insubordination, wilful negligence, or serious breach of this Agreement;</li>
        <li><strong>Redundancy:</strong> In cases of redundancy, the Company shall comply with Sections 40–43 of the Employment Act 2007;</li>
        <li><strong>On termination</strong>, the Employee shall promptly return all Company property, complete all exit procedures, and cooperate fully with handover requirements.</li>
      </ul>
    </div>

    <!-- Disciplinary & Grievance -->
    <div class="clause">
      <h3>${idx++}. Disciplinary &amp; Grievance</h3>
      <p>The Employee shall be subject to the Company's disciplinary procedures as communicated from time to time. In cases of alleged misconduct, the Company shall follow a fair process including notice of the allegation, opportunity to respond, and right of appeal. Grievances shall be raised with the HR Department in the first instance and escalated as per the Company's grievance procedure.</p>
    </div>

    <!-- Code of Conduct -->
    <div class="clause">
      <h3>${idx++}. Code of Conduct &amp; Policies</h3>
      <p>The Employee agrees to abide by all Company policies, procedures, and codes of conduct as communicated in the Employee Handbook and any subsequent updates. This includes but is not limited to:</p>
      <ul>
        <li>Health, Safety &amp; Environment (HSE) policy;</li>
        <li>Anti-bribery and anti-corruption policy;</li>
        <li>Data protection and information security policy;</li>
        <li>Social media and acceptable use policy;</li>
        <li>Equal opportunity and anti-harassment policy.</li>
      </ul>
    </div>

    <!-- Governing Law -->
    <div class="clause">
      <h3>${idx++}. Governing Law</h3>
      <p>This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kenya, including the Employment Act 2007, the Labour Relations Act 2007, the Work Injury Benefits Act, and all applicable regulations. Any dispute arising under this Agreement shall be referred first to mediation and, if unresolved, to the Employment and Labour Relations Court of Kenya.</p>
    </div>

    <!-- Entire Agreement -->
    <div class="clause">
      <h3>${idx++}. Entire Agreement &amp; Amendments</h3>
      <p>This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, and agreements. No amendment or modification of this Agreement shall be valid unless made in writing and duly signed by both parties.</p>
    </div>

    <!-- Notice -->
    <div class="notice">
      <strong>⚠ Important:</strong> By signing below, both parties acknowledge that they have read, understood, and agree to be bound by all the terms and conditions of this Employment Contract. Digital signatures affixed to this document are legally binding under the Kenya Information and Communications Act (Cap. 411A).
    </div>

    <!-- Signatures -->
    <div class="sig-area">
      <div class="sig-block">
        <div class="party">For and on Behalf of:</div>
        <div class="party-sub">Helvino Technologies Limited</div>
        <div class="sig-line" style="display:flex;align-items:flex-end;padding-bottom:2px">
          ${data.signerName ? `<span style="font-family:'Brush Script MT',cursive;font-size:22px;color:#1e3a5f;letter-spacing:1px">${data.signerName}</span>` : ''}
        </div>
        <div class="sig-label">
          <strong>Authorised Signatory</strong><br>
          Name: <strong>${data.signerName || '___________________________'}</strong><br>
          Title: ${data.signerTitle || 'HR Director'}<br>
          Date: ${today}
        </div>
      </div>
      <div class="sig-block">
        <div class="party">Employee Acceptance:</div>
        <div class="party-sub">${data.firstName} ${data.lastName} &nbsp;·&nbsp; ${data.employeeCode}</div>
        <div class="sig-line"></div>
        <div class="sig-label">
          <strong>Employee Digital Signature</strong><br>
          Name: ___________________________<br>
          ID No.: ___________________________<br>
          Date: ___________________________
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    <p>
      <strong>Helvino Technologies Limited</strong> &nbsp;|&nbsp; Siaya, Kenya &nbsp;|&nbsp;
      <a href="mailto:info@helvino.org">info@helvino.org</a> &nbsp;|&nbsp;
      +254 110 421 320 &nbsp;|&nbsp;
      <a href="https://helvino.org">helvino.org</a>
    </p>
    <p style="margin-top:4px">
      © ${year} Helvino Technologies Limited. All rights reserved. &nbsp;|&nbsp;
      Digital signatures are legally binding under the Kenya Information and Communications Act.
    </p>
  </div>
</body>
</html>`
}
