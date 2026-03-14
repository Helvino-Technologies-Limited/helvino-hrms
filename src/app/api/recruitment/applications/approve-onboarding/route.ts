import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, onboardingApprovedEmailHtml } from '@/lib/email'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { applicantId } = await req.json()
  if (!applicantId) return NextResponse.json({ error: 'applicantId required' }, { status: 400 })

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { job: { select: { title: true } } },
  })
  if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      onboardingApproved: true,
      onboardingApprovedAt: new Date(),
      status: 'HIRED',
    },
  })

  // Send congratulatory email
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const html = onboardingApprovedEmailHtml({
      candidateName: `${applicant.firstName} ${applicant.lastName}`,
      jobTitle: applicant.job?.title || 'the position',
      portalUrl: appUrl,
    })
    await sendEmail({
      to: applicant.email,
      subject: `Welcome to Helvino Technologies — Documents Approved`,
      html,
    })
  } catch (e) {
    console.error('approval email error:', e)
  }

  return NextResponse.json({ ok: true })
}
