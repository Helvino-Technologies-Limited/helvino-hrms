import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await prisma.clientDocument.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, fileUrl, fileType, fileSize, category } = await req.json()
  if (!name || !fileUrl) {
    return NextResponse.json({ error: 'Name and file URL are required' }, { status: 400 })
  }

  const doc = await prisma.clientDocument.create({
    data: {
      clientId: session.user.clientId,
      name,
      description,
      fileUrl,
      fileType,
      fileSize,
      category,
      uploadedBy: 'client',
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
