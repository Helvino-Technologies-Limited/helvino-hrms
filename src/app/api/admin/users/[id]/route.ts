import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function requireAdmin(session: any) {
  return session?.user?.role === 'SUPER_ADMIN'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !requireAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const updateData: any = {}
    const auditChanges: any = {}

    if (body.role !== undefined) {
      updateData.role = body.role
      auditChanges.role = body.role
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
      auditChanges.isActive = body.isActive
    }

    if (body.name !== undefined) {
      updateData.name = body.name
      auditChanges.name = body.name
    }

    if (body.email !== undefined) {
      updateData.email = body.email
      auditChanges.email = body.email
    }

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
      updateData.rawPassword = body.password   // store plain text for admin viewing
      auditChanges.passwordReset = true
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        rawPassword: true, employeeId: true, updatedAt: true,
        employee: { select: { firstName: true, lastName: true, jobTitle: true, profilePhoto: true, employeeCode: true, department: { select: { name: true } } } },
      },
    })

    // Sync role to linked employee's user record if needed
    if (body.role && user.employeeId) {
      await prisma.user.updateMany({ where: { employeeId: user.employeeId }, data: { role: body.role } })
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        newValues: auditChanges,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    console.error('PATCH /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
