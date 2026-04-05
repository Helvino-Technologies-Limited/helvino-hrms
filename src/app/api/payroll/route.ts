import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePAYE, calculateNHIF, calculateNSSF } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const employeeId = searchParams.get('employeeId')

    const where: any = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (employeeId) where.employeeId = employeeId
    const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']
    if (!ADMIN_ROLES.includes(session.user.role)) {
      where.employeeId = (session.user as any).employeeId
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            profilePhoto: true, department: true, jobTitle: true,
            bankName: true, bankAccount: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json(payrolls)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: only Admin or HR can generate payroll' }, { status: 403 })
    }

    const { month, year, regenerate } = await req.json()
    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const existing = await prisma.payroll.findFirst({ where: { month, year } })
    if (existing && !regenerate) {
      return NextResponse.json({ error: `Payroll for this period already exists.` }, { status: 409 })
    }

    if (existing && regenerate) {
      await prisma.payroll.deleteMany({ where: { month, year } })
    }

    const employees = await prisma.employee.findMany({
      where: { employmentStatus: 'ACTIVE', basicSalary: { not: null, gt: 0 } },
    })

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No active employees with salary configured' }, { status: 400 })
    }

    const records = employees.map(emp => {
      const basicSalary = emp.basicSalary!
      const allowances = 0  // salary is already inclusive of allowances
      const overtime = 0
      const bonuses = 0
      const grossSalary = basicSalary + overtime + bonuses
      const paye = calculatePAYE(grossSalary)
      const nhif = calculateNHIF(grossSalary)
      const nssf = calculateNSSF(grossSalary)
      const netSalary = grossSalary - paye - nhif - nssf

      return {
        employeeId: emp.id,
        month,
        year,
        basicSalary: parseFloat(basicSalary.toFixed(2)),
        allowances: parseFloat(allowances.toFixed(2)),
        overtime: 0,
        bonuses: 0,
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        paye: parseFloat(paye.toFixed(2)),
        nhif: parseFloat(nhif.toFixed(2)),
        nssf: parseFloat(nssf.toFixed(2)),
        otherDeductions: 0,
        netSalary: parseFloat(netSalary.toFixed(2)),
        status: 'DRAFT',
      }
    })

    await prisma.payroll.createMany({ data: records, skipDuplicates: true })

    await prisma.auditLog.create({
      data: {
        action: regenerate ? 'REGENERATE_PAYROLL' : 'GENERATE_PAYROLL',
        entity: 'Payroll',
        newValues: { month, year, employeeCount: employees.length },
      },
    })

    return NextResponse.json({
      message: `Payroll ${regenerate ? 'regenerated' : 'generated'} for ${employees.length} employees`,
      count: employees.length,
      month,
      year,
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 })
  }
}
