import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {
      status: JobStatus.OPEN,
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (type) {
      where.type = type
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        requirements: true,
        responsibilities: true,
        type: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        positions: true,
        skills: true,
        experienceLevel: true,
        educationReq: true,
        benefits: true,
        deadline: true,
        postedAt: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { postedAt: 'desc' },
    })

    const flat = jobs.map(j => ({
      ...j,
      department: j.department?.name ?? '',
    }))
    return NextResponse.json(flat)
  } catch (error) {
    console.error('GET /api/careers/jobs error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
