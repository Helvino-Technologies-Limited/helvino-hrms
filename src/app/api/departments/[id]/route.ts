import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const department = await prisma.department.update({
      where: { id },
      data: { name: body.name, description: body.description || null, headId: body.headId || null },
      include: { head: true, _count: { select: { employees: true } } },
    })
    return NextResponse.json(department)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Name already taken' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const count = await prisma.employee.count({ where: { departmentId: id } })
    if (count > 0) return NextResponse.json({ error: 'Cannot delete department with active employees. Reassign them first.' }, { status: 400 })
    await prisma.department.delete({ where: { id } })
    return NextResponse.json({ message: 'Department deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
