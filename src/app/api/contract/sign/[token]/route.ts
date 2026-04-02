import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, contractSignedEmailHtml } from '@/lib/email'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const contract = await prisma.employmentContract.findUnique({
      where: { token },
      include: {
        employee: { select: { firstName: true, lastName: true, jobTitle: true, employeeCode: true } },
      },
    })
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    return NextResponse.json({
      contractHtml: contract.contractHtml,
      employee: contract.employee,
      signedAt: contract.signedAt,
      signedByName: contract.signedByName,
      sentAt: contract.sentAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load contract' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { signedByName } = await req.json()

    if (!signedByName?.trim()) {
      return NextResponse.json({ error: 'Please enter your full name to sign' }, { status: 400 })
    }

    const contract = await prisma.employmentContract.findUnique({
      where: { token },
      include: { employee: { select: { firstName: true, lastName: true, email: true } } },
    })
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    if (contract.signedAt) return NextResponse.json({ error: 'Contract already signed' }, { status: 409 })

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const signedAt = new Date()

    await prisma.employmentContract.update({
      where: { token },
      data: { signedAt, signedByName: signedByName.trim(), signedByIp: ip },
    })

    // Notify HR
    const signedAtStr = signedAt.toLocaleString('en-KE', {
      dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Nairobi',
    })
    const employeeName = `${contract.employee.firstName} ${contract.employee.lastName}`
    sendEmail({
      to: process.env.SMTP_FROM || 'info@helvino.org',
      subject: `Contract Signed — ${employeeName}`,
      html: contractSignedEmailHtml(employeeName, signedByName.trim(), signedAtStr),
    }).catch(console.error)

    return NextResponse.json({ message: 'Contract signed successfully', signedAt })
  } catch (error) {
    console.error('Contract sign error:', error)
    return NextResponse.json({ error: 'Failed to sign contract' }, { status: 500 })
  }
}
