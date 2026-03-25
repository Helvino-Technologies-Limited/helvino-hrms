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
      select: {
        token: true,
        sentAt: true,
        signedAt: true,
        signedByName: true,
        signedByIp: true,
        createdAt: true,
        updatedAt: true,
        contractHtml: true,
      },
    })
    return NextResponse.json(contract || null)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

// POST — generate contract and optionally send email
// body: { send?: boolean }  (default send = true)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const body = await req.json().catch(() => ({}))
    const shouldSend: boolean = body.send !== false   // default true
    const agentClientTarget  = body.agentClientTarget  ? Number(body.agentClientTarget)  : undefined
    const agentRevenueTarget = body.agentRevenueTarget ? Number(body.agentRevenueTarget) : undefined
    const managerClientTarget  = body.managerClientTarget  ? Number(body.managerClientTarget)  : undefined
    const managerRevenueTarget = body.managerRevenueTarget ? Number(body.managerRevenueTarget) : undefined
    const signerName  = body.signerName  || null
    const signerTitle = body.signerTitle || null

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        user: { select: { role: true } },
      },
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
      userRole: employee.user?.role ?? null,
      agentClientTarget,
      agentRevenueTarget,
      managerClientTarget,
      managerRevenueTarget,
      signerName,
      signerTitle,
    })

    const contract = await prisma.employmentContract.upsert({
      where: { employeeId: id },
      update: { contractHtml, sentAt: shouldSend ? new Date() : undefined },
      create: { employeeId: id, contractHtml, sentAt: shouldSend ? new Date() : null },
    })

    if (shouldSend) {
      const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.token}`
      const recipient = employee.personalEmail || employee.email
      await sendEmail({
        to: recipient,
        subject: 'Your Employment Contract — Please Review & Sign',
        html: contractEmailHtml(`${employee.firstName} ${employee.lastName}`, signingUrl),
      })
    }

    return NextResponse.json({
      message: shouldSend ? 'Contract generated and sent successfully' : 'Contract generated successfully',
      token: contract.token,
      contractHtml,
    })
  } catch (error) {
    console.error('Contract generate/send error:', error)
    return NextResponse.json({ error: 'Failed to process contract' }, { status: 500 })
  }
}

// PATCH — resend existing contract email without regenerating
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const contract = await prisma.employmentContract.findUnique({ where: { employeeId: id } })
    if (!contract) return NextResponse.json({ error: 'No contract found. Generate one first.' }, { status: 404 })

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, email: true, personalEmail: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    await prisma.employmentContract.update({
      where: { employeeId: id },
      data: { sentAt: new Date() },
    })

    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.token}`
    const recipient = employee.personalEmail || employee.email
    await sendEmail({
      to: recipient,
      subject: 'Your Employment Contract — Action Required (Reminder)',
      html: contractEmailHtml(`${employee.firstName} ${employee.lastName}`, signingUrl),
    })

    return NextResponse.json({ message: 'Contract resent successfully' })
  } catch (error) {
    console.error('Contract resend error:', error)
    return NextResponse.json({ error: 'Failed to resend contract' }, { status: 500 })
  }
}
