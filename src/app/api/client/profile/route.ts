import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    select: {
      id: true, clientNumber: true, companyName: true, contactPerson: true,
      phone: true, whatsapp: true, email: true, address: true, city: true,
      country: true, industry: true, website: true, category: true, portalEnabled: true,
    },
  })

  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyName, contactPerson, phone, whatsapp, address, city, country, industry, website, currentPassword, newPassword } = await req.json()

  // Update client record
  await prisma.client.update({
    where: { id: session.user.clientId },
    data: {
      ...(companyName && { companyName }),
      ...(contactPerson && { contactPerson }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(country !== undefined && { country }),
      ...(industry !== undefined && { industry }),
      ...(website !== undefined && { website }),
    },
  })

  // Password change
  if (newPassword && currentPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
  }

  return NextResponse.json({ success: true })
}
