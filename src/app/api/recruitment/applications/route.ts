import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const talentPool = searchParams.get('talentPool')

    const empId = (session.user as any).employeeId as string | undefined
    const where: Record<string, unknown> = {}

    // SALES_MANAGER only sees applicants from their own recruitment link
    if (session.user.role === 'SALES_MANAGER' && empId) {
      where.salesManagerId = empId
    }

    if (jobId) {
      where.jobId = jobId
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean)
      where.status = statuses.length > 1 ? { in: statuses as ApplicantStatus[] } : (statuses[0] as ApplicantStatus)
    }

    if (talentPool !== null) {
      where.talentPool = talentPool === 'true'
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        job: {
          select: { id: true, title: true, slug: true },
        },
        salesManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        interviews: {
          include: {
            evaluation: true,
          },
        },
        offer: true,
        notesList: {
          include: {
            author: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(applicants)
  } catch (error) {
    console.error('GET /api/recruitment/applications error:', error)
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      coverLetter,
      linkedIn,
      portfolio,
      expectedSalary,
      availableFrom,
      experienceYears,
      currentCompany,
      educationLevel,
      skills,
      source,
      talentPool,
      status,
      score,
      notes,
      interviewDate,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      )
    }

    const applicant = await prisma.applicant.create({
      data: {
        jobId: jobId || null,
        firstName,
        lastName,
        email,
        phone: phone || null,
        resumeUrl: resumeUrl || null,
        coverLetter: coverLetter || null,
        linkedIn: linkedIn || null,
        portfolio: portfolio || null,
        expectedSalary: expectedSalary != null ? Number(expectedSalary) : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        experienceYears: experienceYears != null ? Number(experienceYears) : null,
        currentCompany: currentCompany || null,
        educationLevel: educationLevel || null,
        skills: Array.isArray(skills) ? skills : [],
        source: source || null,
        talentPool: talentPool ?? false,
        status: (status as ApplicantStatus) ?? ApplicantStatus.NEW,
        score: score != null ? Number(score) : null,
        notes: notes || null,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
      },
      include: {
        job: {
          select: { id: true, title: true, slug: true },
        },
        interviews: {
          include: {
            evaluation: true,
          },
        },
        offer: true,
        notesList: {
          include: {
            author: true,
          },
        },
      },
    })

    return NextResponse.json(applicant, { status: 201 })
  } catch (error) {
    console.error('POST /api/recruitment/applications error:', error)
    return NextResponse.json({ error: 'Failed to create applicant' }, { status: 500 })
  }
}
