import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { signature } = await req.json()

  if (!signature?.trim()) {
    return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
  }

  const applicant = await prisma.applicant.findUnique({
    where: { onboardingToken: token },
    select: {
      id: true,
      onboardingTokenExpiry: true,
      offerLetterContent: true,
      offerLetterSignedAt: true,
    },
  })

  if (!applicant) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }
  if (applicant.onboardingTokenExpiry && applicant.onboardingTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }
  if (!applicant.offerLetterContent) {
    return NextResponse.json({ error: 'No offer letter found for this application' }, { status: 404 })
  }
  if (applicant.offerLetterSignedAt) {
    return NextResponse.json({ ok: true, alreadySigned: true })
  }

  await prisma.applicant.update({
    where: { id: applicant.id },
    data: {
      offerLetterSignature: signature.trim(),
      offerLetterSignedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
