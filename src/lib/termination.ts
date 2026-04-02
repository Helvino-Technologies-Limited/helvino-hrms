const LOGO_URL = 'https://helvino.org/images/logo.png'

export const TERMINATION_REASONS: Record<string, string> = {
  REDUNDANCY: 'Redundancy',
  GROSS_MISCONDUCT: 'Gross Misconduct',
  PERFORMANCE: 'Poor Performance',
  RESIGNATION: 'Resignation Accepted',
  CONTRACT_EXPIRY: 'Expiry of Fixed-Term Contract',
  PROBATION_FAILURE: 'Failure to Complete Probation',
  MUTUAL_AGREEMENT: 'Mutual Agreement',
  OTHER: 'Other',
}

export function generateTerminationLetterHtml(data: {
  employeeCode: string
  firstName: string
  lastName: string
  jobTitle: string
  departmentName: string
  dateHired: string | Date
  reason: string
  reasonDetails?: string | null
  lastWorkingDay: string | Date
  noticeDays: number
  payInLieu: boolean
  issuedBy: string
  issuedByTitle: string
}): string {
  const year = new Date().getFullYear()
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const lastDay = new Date(data.lastWorkingDay).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const startDate = new Date(data.dateHired).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const reasonLabel = TERMINATION_REASONS[data.reason] || data.reason

  // Reason-specific opening paragraphs
  const reasonParagraph: Record<string, string> = {
    REDUNDANCY: `Following a review of the Company's operational structure and staffing requirements, your position of <strong>${data.jobTitle}</strong> has been identified as redundant. This decision was made in accordance with Section 40 of the Employment Act 2007 and was not a reflection of your individual performance.`,
    GROSS_MISCONDUCT: `Following a formal disciplinary investigation and hearing conducted in accordance with the Company's disciplinary procedures and the Employment Act 2007, it has been determined that your conduct constitutes <strong>gross misconduct</strong>. The specific details of the conduct are outlined in the disciplinary hearing minutes dated prior to this letter.`,
    PERFORMANCE: `Following a structured performance improvement process, including documented feedback, support plans, and review periods, the Company has concluded that you have been unable to meet the required performance standards for your role of <strong>${data.jobTitle}</strong>. This decision has been made in accordance with the Company's performance management policy.`,
    RESIGNATION: `This letter formally acknowledges the receipt of your resignation from the position of <strong>${data.jobTitle}</strong>. The Company accepts your resignation and confirms the terms of your departure as outlined herein.`,
    CONTRACT_EXPIRY: `Your fixed-term employment contract for the position of <strong>${data.jobTitle}</strong>, which commenced on <strong>${startDate}</strong>, has reached its agreed expiry date. This letter serves as formal confirmation that your contract will not be renewed beyond the expiry date.`,
    PROBATION_FAILURE: `Following a thorough review of your performance and conduct during the probationary period, the Company has determined that you have not demonstrated the required standards to be confirmed in the position of <strong>${data.jobTitle}</strong>. Specific feedback was communicated during your probation review meeting.`,
    MUTUAL_AGREEMENT: `Following discussions between yourself and the Company, both parties have agreed to bring your employment to an end by <strong>mutual agreement</strong>. This decision has been reached amicably and in the best interests of both parties.`,
    OTHER: `After careful consideration, the Company has determined that your employment in the position of <strong>${data.jobTitle}</strong> shall be terminated as outlined in this letter.`,
  }

  const openingPara = reasonParagraph[data.reason] || reasonParagraph.OTHER

  // Notice section
  const noticeSection = data.payInLieu
    ? `You are not required to work out your notice period. The Company shall pay you <strong>${data.noticeDays} days' salary in lieu of notice</strong> as part of your final settlement, in accordance with Section 36 of the Employment Act 2007.`
    : `You are required to serve a notice period of <strong>${data.noticeDays} calendar days</strong>. Your last working day is therefore confirmed as <strong>${lastDay}</strong>.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Termination Letter — ${data.firstName} ${data.lastName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;line-height:1.85;font-size:13.5px;background:#fff}
    .header{background:linear-gradient(135deg,#0f2744,#1e3a5f,#2563eb);padding:24px 48px;display:flex;align-items:center;gap:20px}
    .header-logo{width:60px;height:60px;object-fit:contain;background:#fff;border-radius:10px;padding:4px;flex-shrink:0}
    .header-logo-fallback{width:60px;height:60px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#1e3a5f;letter-spacing:0.5px;flex-shrink:0;text-align:center;line-height:1.2}
    .header-text h1{color:#fff;font-size:18px;font-weight:900;letter-spacing:0.3px}
    .header-text p{color:#93c5fd;font-size:11px;margin-top:3px}
    .doc-title{background:#fff1f2;border-bottom:3px solid #dc2626;padding:18px 48px;text-align:center}
    .doc-title h2{color:#991b1b;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:2px}
    .doc-title p{color:#b91c1c;font-size:11px;margin-top:4px}
    .body{padding:32px 48px;max-width:900px;margin:0 auto}
    .meta{display:flex;justify-content:space-between;margin-bottom:24px;font-size:12.5px;color:#64748b}
    .to-block{margin-bottom:24px}
    .to-block .label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
    .to-block .name{font-size:15px;font-weight:900;color:#1e293b}
    .to-block .details{font-size:12.5px;color:#475569;margin-top:2px}
    .subject{font-size:14px;font-weight:900;color:#1e293b;margin-bottom:20px;padding:12px 16px;background:#fff1f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0}
    p{margin-bottom:14px;font-size:13.5px;color:#334155}
    .section{margin:20px 0}
    .section h3{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;color:#991b1b;margin-bottom:8px;padding:5px 10px;background:#fff1f2;border-radius:4px;display:inline-block}
    .section ul{padding-left:22px;margin-top:6px}
    .section ul li{margin-bottom:5px;font-size:13px;color:#334155}
    table.details{width:100%;border-collapse:collapse;margin:10px 0;font-size:12.5px}
    table.details td{padding:8px 14px;border:1px solid #e2e8f0}
    table.details td:first-child{background:#fff1f2;font-weight:700;width:36%;color:#991b1b}
    .warning{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin:16px 0;font-size:12.5px;color:#991b1b}
    .sig-area{margin-top:48px;padding-top:24px;border-top:2px dashed #cbd5e1}
    .sig-block{display:inline-block;min-width:240px}
    .sig-block .party{font-size:13px;color:#334155;margin-bottom:4px;font-weight:700}
    .sig-block .party-sub{font-size:12px;color:#64748b;margin-bottom:16px}
    .sig-line{border-bottom:1.5px solid #475569;width:220px;margin-top:44px;margin-bottom:6px}
    .sig-label{font-size:11px;color:#64748b;line-height:1.6}
    .ack-block{margin-top:36px;padding-top:24px;border-top:1px dashed #e2e8f0}
    .ack-block p{font-size:12.5px;color:#64748b;font-style:italic}
    .footer{background:#f1f5f9;padding:14px 48px;border-top:2px solid #e2e8f0;font-size:10.5px;color:#94a3b8;text-align:center}
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
      <div style="color:#93c5fd;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">STRICTLY PRIVATE & CONFIDENTIAL</div>
      <div style="color:#fff;font-size:12px;font-weight:700;margin-top:2px">${today}</div>
      <div style="color:#93c5fd;font-size:10px;margin-top:4px">Ref: ${data.employeeCode}/TERM</div>
    </div>
  </div>

  <!-- Title band -->
  <div class="doc-title">
    <h2>Notice of Termination of Employment</h2>
    <p>Issued under the Employment Act 2007 (Cap. 226), Laws of Kenya — STRICTLY PRIVATE &amp; CONFIDENTIAL</p>
  </div>

  <div class="body">

    <!-- Metadata -->
    <div class="meta">
      <span>Date: <strong>${today}</strong></span>
      <span>Reference: <strong>${data.employeeCode}/TERM/${year}</strong></span>
    </div>

    <!-- To block -->
    <div class="to-block">
      <div class="label">To</div>
      <div class="name">${data.firstName} ${data.lastName}</div>
      <div class="details">${data.jobTitle} &nbsp;·&nbsp; ${data.departmentName} &nbsp;·&nbsp; Employee Code: ${data.employeeCode}</div>
    </div>

    <!-- Subject line -->
    <div class="subject">RE: Termination of Employment — ${reasonLabel}</div>

    <!-- Opening -->
    <p>Dear <strong>${data.firstName}</strong>,</p>
    <p>${openingPara}</p>
    ${data.reasonDetails ? `<p>${data.reasonDetails}</p>` : ''}

    <!-- Key details table -->
    <div class="section">
      <h3>Termination Details</h3>
      <table class="details">
        <tr><td>Employee Name</td><td>${data.firstName} ${data.lastName}</td></tr>
        <tr><td>Employee Code</td><td>${data.employeeCode}</td></tr>
        <tr><td>Position</td><td>${data.jobTitle}</td></tr>
        <tr><td>Department</td><td>${data.departmentName}</td></tr>
        <tr><td>Date of Employment</td><td>${startDate}</td></tr>
        <tr><td>Reason for Termination</td><td>${reasonLabel}</td></tr>
        <tr><td>Notice Period</td><td>${data.noticeDays} calendar days${data.payInLieu ? ' (paid in lieu)' : ''}</td></tr>
        <tr><td>Last Working Day</td><td><strong>${lastDay}</strong></td></tr>
      </table>
    </div>

    <!-- Notice & Final Pay -->
    <div class="section">
      <h3>Notice Period &amp; Final Pay</h3>
      <p>${noticeSection}</p>
      <p>Your final pay shall include:</p>
      <ul>
        <li>Salary earned up to and including your last working day;</li>
        ${data.payInLieu ? `<li><strong>${data.noticeDays} days' pay in lieu of notice</strong>, calculated at your current daily rate;</li>` : ''}
        <li>Accrued but untaken annual leave, paid at your current daily rate of pay;</li>
        <li>All statutory dues including NSSF, NHIF, and PAYE calculated on the final pay, as required by law;</li>
        <li>Any other entitlements owing as per your contract or applicable law.</li>
      </ul>
      <p>Final pay will be processed within <strong>7 (seven) working days</strong> of your last working day and paid to your registered bank account on record.</p>
    </div>

    <!-- Company Property -->
    <div class="section">
      <h3>Return of Company Property</h3>
      <p>On or before your last working day, you are required to return all Company property in your possession, including but not limited to:</p>
      <ul>
        <li>Laptop, mobile phone, and any electronic devices issued to you;</li>
        <li>Access cards, office keys, and security badges;</li>
        <li>Company vehicle (if applicable) and related documents;</li>
        <li>Client files, documents, data, and any materials belonging to the Company;</li>
        <li>Any other Company assets assigned to you.</li>
      </ul>
      <p>Failure to return Company property may result in the cost of replacement being deducted from your final settlement.</p>
    </div>

    <!-- Confidentiality -->
    <div class="section">
      <h3>Confidentiality &amp; Post-Employment Obligations</h3>
      <p>Your obligations under the Confidentiality, Non-Disclosure, Non-Competition, and Non-Solicitation clauses of your Employment Agreement remain fully in force after the termination of your employment. You must not disclose, use, or exploit any confidential information, trade secrets, or client data belonging to the Company or its clients, now or at any time in the future.</p>
    </div>

    <!-- Reference -->
    <div class="section">
      <h3>Reference Letter</h3>
      ${data.reason === 'GROSS_MISCONDUCT'
        ? `<p>In view of the circumstances of your departure, the Company is unable to provide a reference letter at this time. Any reference requests by prospective employers will be confirmed to the dates of employment only.</p>`
        : `<p>Upon request, the Company will provide a factual reference letter confirming your period of employment, position held, and responsibilities undertaken. Reference requests should be directed to <a href="mailto:info@helvino.org">info@helvino.org</a>.</p>`
      }
    </div>

    <!-- Warning / acknowledgement -->
    <div class="warning">
      <strong>⚠ Important:</strong> If you believe this decision is unfair or unlawful, you have the right to lodge a complaint with the <strong>Employment and Labour Relations Court of Kenya</strong> or the <strong>Labour Office</strong> within 3 years of this notice. Please seek independent legal advice if required.
    </div>

    <!-- Closing -->
    <p>We wish you the best in your future endeavours.</p>
    <p>Yours sincerely,</p>

    <!-- Signature block -->
    <div class="sig-area">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">
          <strong>${data.issuedBy}</strong><br>
          ${data.issuedByTitle}<br>
          Helvino Technologies Limited<br>
          Date: ${today}
        </div>
      </div>
    </div>

    <!-- Employee acknowledgement -->
    <div class="ack-block">
      <p>I, <strong>${data.firstName} ${data.lastName}</strong> (Employee Code: <strong>${data.employeeCode}</strong>), acknowledge receipt of this Notice of Termination of Employment and confirm that I have read and understood its contents.</p>
      <div style="margin-top:36px;display:flex;gap:48px">
        <div>
          <div style="border-bottom:1px solid #475569;width:200px;margin-bottom:6px"></div>
          <div style="font-size:11px;color:#64748b">Employee Signature</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #475569;width:160px;margin-bottom:6px"></div>
          <div style="font-size:11px;color:#64748b">Date</div>
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
    <p style="margin-top:4px">© ${year} Helvino Technologies Limited. This document is strictly private and confidential.</p>
  </div>
</body>
</html>`
}
