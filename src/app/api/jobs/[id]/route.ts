import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...body,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        salaryMin: body.salaryMin ? parseFloat(body.salaryMin) : undefined,
        salaryMax: body.salaryMax ? parseFloat(body.salaryMax) : undefined,
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.job.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Job deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
