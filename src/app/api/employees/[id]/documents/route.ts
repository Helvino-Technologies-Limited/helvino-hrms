import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_FIELDS = ['idFrontUrl', 'idBackUrl', 'passportPhotoUrl', 'kraPinUrl', 'nhifCardUrl', 'nssfCardUrl', 'profilePhoto']

// Increase body size limit for document uploads
export const maxDuration = 30

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { field, value } = await req.json()

    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Invalid document field' }, { status: 400 })
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { [field]: value || null },
      select: { id: true },
    })

    return NextResponse.json({ success: true, id: employee.id })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
