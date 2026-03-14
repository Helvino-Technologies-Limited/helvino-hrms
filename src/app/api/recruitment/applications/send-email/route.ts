import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  interviewInviteEmailHtml,
  onboardingRequestEmailHtml,
  rejectionEmailHtml,
} from '@/lib/email'
import crypto from 'crypto'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { applicantId, type, emailBody, interviewDetails, offerLetterContent } = body

    if (!applicantId || !type || !emailBody) {
      return NextResponse.json({ error: 'applicantId, type, emailBody required' }, { status: 400 })
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { job: { select: { title: true } } },
    })
    if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

    const candidateName = `${applicant.firstName} ${applicant.lastName}`
    const jobTitle = applicant.job?.title || 'the position'
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    let subject = ''
    let html = ''
    const updateData: Record<string, unknown> = {}

    if (type === 'INTERVIEW_INVITE') {
      subject = `Interview Invitation — ${jobTitle} | Helvino Technologies Ltd`
      html = interviewInviteEmailHtml({
        candidateName,
        jobTitle,
        bodyText: emailBody,
        interviewDate: interviewDetails?.date,
        interviewTime: interviewDetails?.time,
        interviewType: interviewDetails?.format,
        location: interviewDetails?.location,
        meetingLink: interviewDetails?.meetingLink,
        interviewerName: interviewDetails?.interviewerName,
      })
      updateData.interviewInviteSentAt = new Date()

    } else if (type === 'ONBOARDING_REQUEST') {
      // Generate a unique secure token for this candidate's upload link
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      const tokenUpdateData: Record<string, unknown> = {
        onboardingToken: token,
        onboardingTokenExpiry: expiry,
      }
      if (offerLetterContent?.trim()) {
        tokenUpdateData.offerLetterContent = offerLetterContent.trim()
      }
      await prisma.applicant.update({
        where: { id: applicantId },
        data: tokenUpdateData,
      })
      const uploadLink = `${appUrl}/onboarding/${token}`
      subject = `Onboarding Documents — ${jobTitle} | Helvino Technologies Ltd`
      html = onboardingRequestEmailHtml({
        candidateName,
        jobTitle,
        bodyText: emailBody,
        uploadLink,
        deadline: interviewDetails?.deadline,
        hasOfferLetter: !!(offerLetterContent?.trim()),
      })
      updateData.onboardingRequestSentAt = new Date()

    } else if (type === 'REJECTION') {
      subject = `Re: Your Application for ${jobTitle} | Helvino Technologies Ltd`
      html = rejectionEmailHtml({ candidateName, jobTitle, bodyText: emailBody })
      updateData.rejectionEmailSentAt = new Date()
      updateData.status = 'REJECTED'
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    await sendEmail({ to: applicant.email, subject, html })
    await prisma.applicant.update({ where: { id: applicantId }, data: updateData })

    return NextResponse.json({ ok: true, sentTo: applicant.email })
  } catch (err: any) {
    console.error('send-email error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
  }
}
