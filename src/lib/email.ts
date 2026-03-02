import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email send error:', error)
  }
}

export function emailTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">Helvino Technologies Limited</h1>
          <p style="color:#93c5fd;margin:5px 0 0;">HR Management System</p>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
          <h2 style="color:#1e293b;margin-top:0;">${title}</h2>
          ${body}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Helvino Technologies Limited | 
            <a href="mailto:hr@helvino.org" style="color:#2563eb;">hr@helvino.org</a> | 
            0703445756 | helvino.org
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function welcomeEmailHtml(name: string, email: string, password: string): string {
  return emailTemplate(
    `Welcome, ${name}!`,
    `
    <p>Your Helvino HRMS account has been created. Use the credentials below to log in:</p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>Portal:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a></p>
      <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${password}</code></p>
    </div>
    <p style="color:#ef4444;"><strong>⚠ Please change your password immediately after first login.</strong></p>
    `
  )
}

export function leaveRequestEmailHtml(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number,
  reason: string
): string {
  return emailTemplate(
    'New Leave Request',
    `
    <p><strong>${employeeName}</strong> has submitted a leave request requiring your approval.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;">Leave Type</td><td style="padding:8px;border:1px solid #e2e8f0;">${leaveType}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;">Start Date</td><td style="padding:8px;border:1px solid #e2e8f0;">${startDate}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;">End Date</td><td style="padding:8px;border:1px solid #e2e8f0;">${endDate}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;">Days</td><td style="padding:8px;border:1px solid #e2e8f0;">${days} working day(s)</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;">Reason</td><td style="padding:8px;border:1px solid #e2e8f0;">${reason || 'Not provided'}</td></tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leaves" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Review Request →</a>
    `
  )
}

export function leaveStatusEmailHtml(employeeName: string, status: string, leaveType: string, comments?: string): string {
  const color = status === 'APPROVED' ? '#16a34a' : '#dc2626'
  const emoji = status === 'APPROVED' ? '✅' : '❌'
  return emailTemplate(
    `Leave Request ${status}`,
    `
    <p>Dear <strong>${employeeName}</strong>,</p>
    <p>Your <strong>${leaveType}</strong> leave request has been <span style="color:${color};font-weight:bold;">${emoji} ${status}</span>.</p>
    ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">View Details →</a>
    `
  )
}
