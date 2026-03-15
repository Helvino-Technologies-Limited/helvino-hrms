import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function requireAdmin(session: any) {
  return session?.user?.role === 'SUPER_ADMIN'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !requireAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        rawPassword: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            profilePhoto: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !requireAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { employeeId, role } = await req.json()
    if (!employeeId || !role) {
      return NextResponse.json({ error: 'Employee and role are required' }, { status: 400 })
    }
    if (role === 'SUPER_ADMIN' || role === 'CLIENT') {
      return NextResponse.json({ error: 'Invalid role for identity-based account' }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    if (!employee.nationalId || !employee.dateOfBirth) {
      return NextResponse.json(
        { error: 'Employee must have National ID and Date of Birth set before creating an account.' },
        { status: 400 }
      )
    }

    // Generate secret code and hash it
    const { generateSecretCode } = await import('@/lib/secret-code')
    const plainCode = generateSecretCode()
    const secretHash = await bcrypt.hash(plainCode, 12)

    // Store secret code on the employee
    await prisma.employee.update({
      where: { id: employeeId },
      data: { secretCodeHash: secretHash, loginAttempts: 0, accountLockedUntil: null },
    })

    // Create or update User linked to this employee
    const email = employee.email || `${employee.employeeCode}@helvino.internal`
    const tempPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10)
    const fullName = `${employee.firstName} ${employee.lastName}`

    let user
    if (employee.user) {
      user = await prisma.user.update({
        where: { id: employee.user.id },
        data: { role, isActive: true, name: fullName, rawPassword: null },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: fullName,
          email,
          password: tempPassword,
          rawPassword: null,
          role,
          isActive: true,
          employeeId,
        },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        newValues: { employeeId, role, name: fullName },
      },
    })

    return NextResponse.json({ ...user, secretCode: plainCode }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A user account already exists for this email' }, { status: 400 })
    }
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
