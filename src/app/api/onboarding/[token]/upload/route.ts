import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB per file
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const applicant = await prisma.applicant.findUnique({
    where: { onboardingToken: token },
  })

  if (!applicant) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  }
  if (applicant.onboardingTokenExpiry && new Date() > applicant.onboardingTokenExpiry) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }
  if (applicant.onboardingApproved) {
    return NextResponse.json({ error: 'Documents already approved' }, { status: 409 })
  }

  try {
    const formData = await req.formData()
    const existing = (applicant.onboardingDocuments as any[]) || []
    const newDocs: any[] = []

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (!ALLOWED_TYPES.includes(value.type)) {
          return NextResponse.json({ error: `File type ${value.type} not allowed` }, { status: 400 })
        }
        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File ${value.name} exceeds 5MB limit` }, { status: 400 })
        }

        const bytes = await value.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const dataUri = `data:${value.type};base64,${base64}`

        newDocs.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          fieldName: key,
          fileName: value.name,
          mimeType: value.type,
          sizeBytes: value.size,
          dataUri,
          uploadedAt: new Date().toISOString(),
        })
      }
    }

    // Merge: replace documents with same fieldName, keep others
    const fieldNames = newDocs.map(d => d.fieldName)
    const kept = existing.filter((d: any) => !fieldNames.includes(d.fieldName))
    const merged = [...kept, ...newDocs]

    await prisma.applicant.update({
      where: { id: applicant.id },
      data: { onboardingDocuments: merged },
    })

    return NextResponse.json({ ok: true, uploaded: newDocs.length, total: merged.length })
  } catch (err: any) {
    console.error('upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
