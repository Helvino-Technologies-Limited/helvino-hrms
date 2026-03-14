import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const applicant = await prisma.applicant.findUnique({
    where: { onboardingToken: token },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      onboardingTokenExpiry: true,
      onboardingDocuments: true,
      onboardingApproved: true,
      offerLetterContent: true,
      offerLetterSignature: true,
      offerLetterSignedAt: true,
      job: { select: { title: true } },
    },
  })

  if (!applicant) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  if (applicant.onboardingTokenExpiry && new Date() > applicant.onboardingTokenExpiry) {
    return NextResponse.json({ error: 'This upload link has expired. Please contact HR.' }, { status: 410 })
  }

  return NextResponse.json(applicant)
}
