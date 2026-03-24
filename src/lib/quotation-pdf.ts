const LOGO_URL = 'https://helvino.org/images/logo.png'

function fmtKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface QuotationPdfData {
  quotationNumber: string
  status: string
  createdAt: string | Date
  validUntil?: string | Date | null
  deliveryTimeline?: string | null
  clientName: string
  clientEmail?: string | null
  client?: { companyName?: string | null } | null
  items?: Array<{
    serviceName?: string | null
    name?: string | null
    description?: string | null
    quantity: number
    unitPrice: number
  }>
  discountAmount?: number | null
  taxRate?: number | null
  projectScope?: string | null
  termsAndConditions?: string | null
  notes?: string | null
  signerName?: string
  signerTitle?: string
}

export function generateQuotationHtml(q: QuotationPdfData): string {
  const subtotal = (q.items ?? []).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const discount = q.discountAmount ?? 0
  const taxRate  = q.taxRate ?? 16
  const taxable  = subtotal - discount
  const tax      = taxable * (taxRate / 100)
  const total    = taxable + tax
  const year     = new Date().getFullYear()

  const itemRows = (q.items ?? []).length > 0
    ? (q.items ?? []).map((item, i) => {
        const name = item.serviceName || item.name || '—'
        const desc = item.description || ''
        const lineTotal = item.quantity * item.unitPrice
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
        return `
        <tr style="background:${bg};border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 10px;color:#94a3b8;font-weight:600;font-size:12px;">${i + 1}</td>
          <td style="padding:8px 10px;font-weight:700;color:#1e293b;font-size:12px;">${name}</td>
          <td style="padding:8px 10px;color:#64748b;font-size:11px;max-width:220px;">${desc || '—'}</td>
          <td style="padding:8px 10px;text-align:center;color:#475569;font-weight:600;font-size:12px;">${item.quantity}</td>
          <td style="padding:8px 10px;text-align:right;color:#475569;font-size:12px;">${fmtKes(item.unitPrice)}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:700;color:#1e293b;font-size:12px;">${fmtKes(lineTotal)}</td>
        </tr>`
      }).join('')
    : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#94a3b8;font-size:12px;">No line items</td></tr>`

  const discountRow = discount > 0
    ? `<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Discount</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#dc2626;font-size:12px;">- ${fmtKes(discount)}</td></tr>`
    : ''

  const scopeSection = q.projectScope ? `
    <div class="section" style="margin-bottom:14px;">
      <div class="label">Project Scope</div>
      <div style="font-size:12px;color:#334155;line-height:1.75;white-space:pre-wrap;padding:10px 14px;background:#f8fafc;border-left:3px solid #1d4ed8;border-radius:0 6px 6px 0;">${q.projectScope}</div>
    </div>` : ''

  const termsSection = q.termsAndConditions ? `
    <div class="section" style="margin-bottom:14px;">
      <div class="label">Terms &amp; Conditions</div>
      <div style="font-size:12px;color:#334155;line-height:1.75;white-space:pre-wrap;padding:10px 14px;background:#f8fafc;border-radius:6px;">${q.termsAndConditions}</div>
    </div>` : ''

  const notesSection = q.notes ? `
    <div class="section" style="margin-bottom:14px;">
      <div class="label" style="color:#1d4ed8;">Additional Notes</div>
      <div style="font-size:12px;color:#1e40af;line-height:1.75;white-space:pre-wrap;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;">${q.notes}</div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quotation ${q.quotationNumber}</title>
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
    .title-row{padding:16px 0 12px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;border-bottom:1px solid #e2e8f0;margin-bottom:16px}
    .doc-title{font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#1d4ed8}
    .doc-number{font-size:13px;font-weight:700;color:#1e293b;margin-top:2px}
    .meta-right{text-align:right;font-size:11px;color:#64748b;line-height:1.8}
    .status-badge{display:inline-block;padding:2px 12px;border-radius:20px;font-size:10px;font-weight:700;background:#dbeafe;color:#1d4ed8;margin-top:4px}
    .client-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;padding:12px 0;border-bottom:1px solid #e2e8f0}
    .label{font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
    .client-name{font-weight:700;font-size:14px;color:#1e293b}
    .client-sub{font-size:11px;color:#64748b;margin-top:2px}
    .section{margin-bottom:14px}
    table.items{width:100%;border-collapse:collapse;margin-bottom:16px}
    table.items thead tr{background:#1e293b;color:#fff}
    table.items th{padding:9px 10px;font-weight:600;font-size:11px;text-align:left}
    table.items th:nth-child(4){text-align:center}
    table.items th:nth-child(5),table.items th:nth-child(6){text-align:right}
    .totals-wrap{display:flex;justify-content:flex-end;margin-top:4px;margin-bottom:16px}
    .totals{min-width:240px}
    .totals-row{display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:5px}
    .totals-row span:last-child{font-weight:600}
    .totals-total{display:flex;justify-content:space-between;border-top:2px solid #1e293b;padding-top:7px;margin-top:3px}
    .totals-total span:first-child{font-weight:900;color:#1e293b;font-size:13px}
    .totals-total span:last-child{font-weight:900;color:#1e293b;font-size:16px}
    .payment-box{padding:14px 16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:8px;margin-bottom:12px}
    .payment-label{font-size:9px;font-weight:700;color:#15803d;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
    .payment-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .payment-field-label{color:#16a34a;font-weight:700;font-size:9px;text-transform:uppercase;margin-bottom:3px}
    .payment-field-value{font-weight:900;color:#1e293b;font-size:14px;letter-spacing:2px}
    .payment-note{font-size:10px;color:#15803d;margin-top:8px}
    .validity-note{font-size:10px;color:#64748b;text-align:center;margin-top:8px;margin-bottom:4px}
    .sig-separator{margin:12px 0;height:1px;background:#e2e8f0}
    .sig-area{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:16px 0 24px;align-items:flex-start}
    .sig-heading{font-size:9px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px}
    .sig-line{height:48px;border-bottom:1.5px solid #334155;margin-bottom:6px;position:relative}
    .sig-name-text{position:absolute;bottom:4px;font-size:11px;color:#1e293b;font-style:italic;font-weight:600}
    .sig-detail{font-size:11px;color:#334155;line-height:1.8;margin-top:4px}
    .sig-detail strong{font-weight:700;margin-right:6px}
    .sig-underline{display:inline-block;min-width:130px;border-bottom:1px solid #94a3b8;padding-bottom:1px}
    .stamp-heading{font-size:9px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;text-align:center}
    .stamp-circle{width:110px;height:110px;border-radius:50%;border:2.5px dashed #94a3b8;display:flex;align-items:center;justify-content:center;margin:0 auto;background:#f8fafc}
    .stamp-text{font-size:8px;color:#cbd5e1;font-weight:600;letter-spacing:1px;text-align:center}
    .footer{border-top:3px solid #1d4ed8;margin:0 0 0;padding:8px 48px 16px}
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
        <div>Siaya, Kenya &nbsp;&middot;&nbsp; Reg. No. &middot; P.O Box 12345-40600 Siaya</div>
        <div>Tel: 0110421320 &nbsp;&middot;&nbsp; helvinotechltd@gmail.com</div>
        <div>helvino.org &nbsp;&middot;&nbsp; M-Pesa Paybill: <strong>522533</strong> &nbsp;A/c: <strong>8071524</strong></div>
      </div>
    </div>
  </div>
  <div class="accent-bar"></div>
  <div class="grey-line"></div>

  <!-- Body -->
  <div class="body">

    <!-- Title row -->
    <div class="title-row">
      <div>
        <div class="doc-title">QUOTATION</div>
        <div class="doc-number">${q.quotationNumber}</div>
      </div>
      <div class="meta-right">
        <div><strong>Date:</strong> ${fmtDate(q.createdAt)}</div>
        ${q.validUntil ? `<div><strong>Valid Until:</strong> ${fmtDate(q.validUntil)}</div>` : ''}
        <div><span class="status-badge">${q.status}</span></div>
      </div>
    </div>

    <!-- Client & delivery info -->
    <div class="client-row">
      <div>
        <div class="label">Prepared For</div>
        <div class="client-name">${q.clientName}</div>
        ${q.clientEmail ? `<div class="client-sub">${q.clientEmail}</div>` : ''}
        ${q.client?.companyName ? `<div class="client-sub">${q.client.companyName}</div>` : ''}
      </div>
      <div>
        ${q.deliveryTimeline ? `
        <div style="margin-bottom:8px">
          <div class="label">Delivery Timeline</div>
          <div style="font-size:12px;font-weight:600;color:#1e293b;">${q.deliveryTimeline}</div>
        </div>` : ''}
        ${q.validUntil ? `
        <div>
          <div class="label">Quotation Valid Until</div>
          <div style="font-size:12px;font-weight:600;color:#1e293b;">${fmtDate(q.validUntil)}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Services table -->
    <div class="section">
      <div class="label" style="margin-bottom:8px;">Services &amp; Pricing</div>
      <table class="items">
        <thead>
          <tr>
            <th style="width:32px">#</th>
            <th style="width:22%">Service</th>
            <th>Description</th>
            <th style="width:48px">Qty</th>
            <th style="width:120px">Unit Price</th>
            <th style="width:120px">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-wrap">
        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${fmtKes(subtotal)}</span></div>
          ${discountRow}
          <div class="totals-row"><span>VAT (${taxRate}%)</span><span>${fmtKes(tax)}</span></div>
          <div class="totals-total">
            <span>Total Amount</span>
            <span>${fmtKes(total)}</span>
          </div>
        </div>
      </div>
    </div>

    ${scopeSection}
    ${termsSection}
    ${notesSection}

    <!-- Payment Instructions -->
    <div class="payment-box">
      <div class="payment-label">Payment Instructions &mdash; M-Pesa Paybill</div>
      <div class="payment-grid">
        <div>
          <div class="payment-field-label">Business</div>
          <div style="font-weight:700;color:#1e293b;font-size:12px;">Helvino Technologies</div>
        </div>
        <div>
          <div class="payment-field-label">Paybill No</div>
          <div class="payment-field-value">522533</div>
        </div>
        <div>
          <div class="payment-field-label">Account No</div>
          <div class="payment-field-value">8071524</div>
        </div>
        <div>
          <div class="payment-field-label">Phone</div>
          <div style="font-weight:700;color:#1e293b;font-size:12px;">0110421320</div>
        </div>
      </div>
      <div class="payment-note">
        Use <strong>${q.quotationNumber}</strong> as your payment reference. Contact <strong>0110421320</strong> after payment to confirm.
      </div>
    </div>

    ${q.validUntil ? `<div class="validity-note">This quotation is valid until <strong>${fmtDate(q.validUntil)}</strong>. Thank you for choosing Helvino Technologies Ltd.</div>` : ''}

    <!-- Signature section -->
    <div class="sig-separator"></div>
    <div class="sig-area">
      <div>
        <div class="sig-heading">Authorised Signatory</div>
        <div class="sig-line">
          ${q.signerName ? `<div class="sig-name-text">${q.signerName}</div>` : ''}
        </div>
        <div class="sig-detail">
          <div><strong>Name:</strong> <span class="sig-underline">${q.signerName || ''}</span></div>
          <div><strong>Designation:</strong> <span class="sig-underline">${q.signerTitle || ''}</span></div>
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

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      <strong style="color:#1d4ed8">Helvino Technologies Ltd</strong>
      &nbsp;&middot;&nbsp; Siaya, Kenya
      &nbsp;&middot;&nbsp; 0110421320
      &nbsp;&middot;&nbsp; helvinotechltd@gmail.com
      &nbsp;&middot;&nbsp; helvino.org
      &nbsp;&middot;&nbsp; M-Pesa Paybill: 522533 &nbsp; A/c: 8071524
    </div>
  </div>

</body>
</html>`
}
