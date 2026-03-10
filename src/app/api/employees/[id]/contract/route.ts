import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, contractEmailHtml } from '@/lib/email'
import { generateContractHtml } from '@/lib/contract'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const contract = await prisma.employmentContract.findUnique({
      where: { employeeId: id },
      select: { token: true, sentAt: true, signedAt: true, signedByName: true, createdAt: true },
    })
    return NextResponse.json(contract || null)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: { select: { name: true } } },
      // personalEmail needed to target personal inbox for contract
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const contractHtml = generateContractHtml({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      departmentName: employee.department?.name || 'General',
      employmentType: employee.employmentType,
      dateHired: employee.dateHired,
      basicSalary: employee.basicSalary,
      probationEndDate: employee.probationEndDate,
    })

    // Upsert contract (regenerate if exists)
    const contract = await prisma.employmentContract.upsert({
      where: { employeeId: id },
      update: { contractHtml, sentAt: new Date() },
      create: { employeeId: id, contractHtml, sentAt: new Date() },
    })

    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.token}`
    const contractRecipient = employee.personalEmail || employee.email
    await sendEmail({
      to: contractRecipient,
      subject: 'Your Employment Contract — Please Sign',
      html: contractEmailHtml(`${employee.firstName} ${employee.lastName}`, signingUrl),
    })

    return NextResponse.json({ message: 'Contract sent successfully', token: contract.token })
  } catch (error) {
    console.error('Contract send error:', error)
    return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 })
  }
}
