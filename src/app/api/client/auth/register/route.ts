import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { companyName, contactPerson, email, phone, industry, city, country, password } = await req.json()

    if (!companyName || !contactPerson || !email || !phone || !password) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Generate client number
    const count = await prisma.client.count()
    const clientNumber = `CLT-${String(count + 1).padStart(4, '0')}`

    // Create client record and user in transaction
    await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientNumber,
          companyName,
          contactPerson,
          email,
          phone,
          industry,
          city,
          country: country || 'Kenya',
          category: 'CORPORATE',
          portalEnabled: false, // pending review
          isActive: true,
        },
      })

      await tx.user.create({
        data: {
          email,
          name: contactPerson,
          password: hashed,
          role: 'CLIENT',
          isActive: false, // inactive until admin approves
          clientId: client.id,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
