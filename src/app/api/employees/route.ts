import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateEmployeeCode } from '@/lib/utils'
import { sendEmail, welcomeEmailHtml, contractEmailHtml } from '@/lib/email'
import { generateContractHtml } from '@/lib/contract'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const tab = searchParams.get('tab') // 'active' | 'past'

    const SEPARATED = ['TERMINATED', 'RESIGNED']

    const where: any = {}
    if (department) where.departmentId = department

    if (tab === 'past') {
      // Past employees: only TERMINATED / RESIGNED
      where.employmentStatus = { in: SEPARATED }
    } else if (tab === 'active') {
      // Active roster: exclude separated employees; respect optional status sub-filter
      where.employmentStatus = status
        ? status
        : { notIn: SEPARATED }
    } else {
      // Legacy / no-tab callers — honour explicit status param if present
      if (status) where.employmentStatus = status
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ]
    }

    const userRole = searchParams.get('userRole')
    if (userRole) {
      const roles = userRole.split(',').map(r => r.trim()).filter(Boolean)
      where.user = roles.length === 1 ? { role: roles[0] as any } : { role: { in: roles as any[] } }
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        user: { select: { role: true } },
        manager: { select: { firstName: true, lastName: true, profilePhoto: true, jobTitle: true } },
        _count: { select: { directReports: true, leaves: true, attendances: true } },
        ...(tab === 'past' ? { terminationLetter: true } : {}),
      },
      orderBy: tab === 'past'
        ? { updatedAt: 'desc' }
        : { createdAt: 'desc' },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const count = await prisma.employee.count()
    const employeeCode = generateEmployeeCode(count)

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        personalEmail: body.personalEmail || null,
        phone: body.phone,
        nationalId: body.nationalId || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        address: body.address || null,
        city: body.city || null,
        departmentId: body.departmentId || null,
        jobTitle: body.jobTitle,
        employmentType: body.employmentType || 'FULL_TIME',
        employmentStatus: body.employmentStatus || 'ACTIVE',
        dateHired: new Date(body.dateHired),
        probationEndDate: body.probationEndDate ? new Date(body.probationEndDate) : null,
        basicSalary: body.basicSalary ? parseFloat(body.basicSalary) : null,
        managerId: body.managerId || null,
        bankName: body.bankName || null,
        bankBranch: body.bankBranch || null,
        bankCode: body.bankCode || null,
        bankAccount: body.bankAccount || null,
        mpesaPhone: body.mpesaPhone || null,
        kraPin: body.kraPin || null,
        shaNumber: body.shaNumber || null,
        nssfNumber: body.nssfNumber || null,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
        idFrontUrl: body.idFrontUrl || null,
        idBackUrl: body.idBackUrl || null,
        passportPhotoUrl: body.passportPhotoUrl || null,
        kraPinUrl: body.kraPinUrl || null,
        nhifCardUrl: body.nhifCardUrl || null,
        nssfCardUrl: body.nssfCardUrl || null,
      },
      include: { department: { select: { name: true } } },
    })

    // Create user account with temp password
    const tempPassword = `Htl${Math.random().toString(36).slice(-6)}!`
    const hashed = await bcrypt.hash(tempPassword, 10)

    await prisma.user.create({
      data: {
        email: body.email,
        name: `${body.firstName} ${body.lastName}`,
        password: hashed,
        role: body.role || 'EMPLOYEE',
        employeeId: employee.id,
      },
    })

    // Initialize leave balances for current year
    const year = new Date().getFullYear()
    const leaveAllocations: Record<string, number> = {
      ANNUAL: 21, SICK: 14, MATERNITY: 90, PATERNITY: 14,
      COMPASSIONATE: 5, UNPAID: 30, STUDY: 10,
    }
    await prisma.leaveBalance.createMany({
      data: Object.entries(leaveAllocations).map(([lt, allocated]) => ({
        employeeId: employee.id,
        leaveType: lt as any,
        year,
        allocated,
        used: 0,
        pending: 0,
        remaining: allocated,
      })),
    })

    // Send welcome email (non-blocking)
    sendEmail({
      to: body.email,
      subject: 'Welcome to Helvino Technologies Limited — Your Account Details',
      html: welcomeEmailHtml(`${body.firstName} ${body.lastName}`, body.email, tempPassword),
    }).catch(console.error)

    // Generate and send employment contract
    const contractHtml = generateContractHtml({
      employeeCode,
      firstName: body.firstName,
      lastName: body.lastName,
      jobTitle: body.jobTitle,
      departmentName: (employee as any).department?.name || body.departmentId || 'General',
      employmentType: body.employmentType || 'FULL_TIME',
      dateHired: body.dateHired,
      basicSalary: body.basicSalary ? parseFloat(body.basicSalary) : null,
      probationEndDate: body.probationEndDate || null,
    })
    const contract = await prisma.employmentContract.create({
      data: {
        employeeId: employee.id,
        contractHtml,
        sentAt: new Date(),
      },
    })
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${contract.token}`
    const contractRecipient = body.personalEmail || body.email
    sendEmail({
      to: contractRecipient,
      subject: 'Your Employment Contract — Please Sign',
      html: contractEmailHtml(`${body.firstName} ${body.lastName}`, signingUrl),
    }).catch(console.error)

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Employee',
        entityId: employee.id,
        newValues: { employeeCode, name: `${body.firstName} ${body.lastName}`, email: body.email },
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists in the system' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
