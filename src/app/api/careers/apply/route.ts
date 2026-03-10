import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus, JobStatus } from '@prisma/client'
import { sendEmail, emailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      coverLetter,
      linkedIn,
      portfolio,
      expectedSalary,
      experienceYears,
      currentCompany,
      educationLevel,
      skills,
    } = body

    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'jobId, firstName, lastName, and email are required' },
        { status: 400 }
      )
    }

    // Validate job exists and is OPEN
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, status: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== JobStatus.OPEN) {
      return NextResponse.json(
        { error: 'This position is no longer accepting applications' },
        { status: 400 }
      )
    }

    const applicant = await prisma.applicant.create({
      data: {
        jobId,
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        coverLetter: coverLetter ?? null,
        linkedIn: linkedIn ?? null,
        portfolio: portfolio ?? null,
        expectedSalary: expectedSalary != null ? Number(expectedSalary) : null,
        experienceYears: experienceYears != null ? Number(experienceYears) : null,
        currentCompany: currentCompany ?? null,
        educationLevel: educationLevel ?? null,
        skills: Array.isArray(skills) ? skills : [],
        source: 'CAREERS_PORTAL',
        status: ApplicantStatus.NEW,
      },
    })

    // Send confirmation email — best-effort, never fail the request
    try {
      const html = emailTemplate(
        'Application Received',
        `
        <p>Dear <strong>${firstName} ${lastName}</strong>,</p>
        <p>Thank you for applying for the <strong>${job.title}</strong> position at Helvino Technologies Limited.</p>
        <p>We have received your application and will review it shortly. If your profile matches our requirements, our team will be in touch with you regarding the next steps.</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Position:</strong> ${job.title}</p>
          <p style="margin:4px 0;"><strong>Reference:</strong> ${applicant.id}</p>
        </div>
        <p>Thank you for your interest in joining our team.</p>
        `
      )

      await sendEmail({
        to: email,
        subject: `Application Received – ${job.title}`,
        html,
      })
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError)
    }

    return NextResponse.json(applicant, { status: 201 })
  } catch (error) {
    console.error('POST /api/careers/apply error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
