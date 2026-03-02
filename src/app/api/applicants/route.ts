import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')

    const where: any = {}
    if (jobId) where.jobId = jobId
    if (status) where.status = status

    const applicants = await prisma.applicant.findMany({
      where,
      include: { job: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(applicants)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobId, firstName, lastName, email, phone, coverLetter, resumeUrl } = body

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.status !== 'OPEN') return NextResponse.json({ error: 'This position is no longer accepting applications' }, { status: 400 })

    const existing = await prisma.applicant.findFirst({ where: { jobId, email } })
    if (existing) {
      return NextResponse.json({ error: 'You have already applied for this position' }, { status: 400 })
    }

    const applicant = await prisma.applicant.create({
      data: { jobId, firstName, lastName, email, phone: phone || null, coverLetter: coverLetter || null, resumeUrl: resumeUrl || null },
      include: { job: true },
    })

    // Confirmation email
    sendEmail({
      to: email,
      subject: `Application Received — ${applicant.job.title} at Helvino Technologies`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;">Application Received</h1>
          </div>
          <div style="background:white;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
            <p>Dear <strong>${firstName} ${lastName}</strong>,</p>
            <p>Thank you for applying for <strong>${applicant.job.title}</strong> at Helvino Technologies Limited.</p>
            <p>Your application has been received and is under review. We will contact you within 5–7 business days.</p>
            <p>Best regards,<br><strong>Helvino HR Team</strong><br>0703445756 | hr@helvino.org</p>
          </div>
        </div>
      `,
    }).catch(console.error)

    return NextResponse.json(applicant, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
