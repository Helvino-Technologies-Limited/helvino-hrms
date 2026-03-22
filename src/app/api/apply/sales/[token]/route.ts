import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — verify token, return manager info for the form
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const link = await prisma.salesManagerRecruitmentLink.findUnique({
      where: { token },
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            jobTitle: true,
            profilePhoto: true,
          },
        },
      },
    })

    if (!link) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    if (!link.isActive) return NextResponse.json({ error: 'This recruitment link is no longer active' }, { status: 410 })

    return NextResponse.json({ valid: true, manager: link.manager, managerId: link.managerId })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to verify link' }, { status: 500 })
  }
}

// POST — submit application
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const link = await prisma.salesManagerRecruitmentLink.findUnique({
      where: { token },
    })

    if (!link) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    if (!link.isActive) return NextResponse.json({ error: 'This recruitment link is no longer active' }, { status: 410 })

    const body = await req.json()

    // Find or create the "Sales Agent" job for this manager
    let job = await prisma.job.findFirst({
      where: {
        hiringManagerId: link.managerId,
        title: { contains: 'Sales Agent', mode: 'insensitive' },
        status: 'OPEN',
      },
    })

    if (!job) {
      // Auto-create a standing open job for this manager
      const count = await prisma.job.count()
      job = await prisma.job.create({
        data: {
          title: 'Sales Agent',
          slug: `sales-agent-${link.managerId.slice(-8)}-${count}`,
          description: 'Sales Agent position',
          type: 'Full-time',
          hiringManagerId: link.managerId,
          status: 'OPEN',
        },
      })
    }

    // Check for duplicate email on this manager's applications
    const duplicate = await prisma.applicant.findFirst({
      where: { email: body.email, salesManagerId: link.managerId },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'You have already applied through this link' }, { status: 409 })
    }

    const applicant = await prisma.applicant.create({
      data: {
        jobId: job.id,
        salesManagerId: link.managerId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        coverLetter: body.coverLetter || null,
        linkedIn: body.linkedIn || null,
        expectedSalary: body.expectedSalary ? parseFloat(body.expectedSalary) : null,
        experienceYears: body.experienceYears ? parseInt(body.experienceYears) : null,
        currentCompany: body.currentCompany || null,
        educationLevel: body.educationLevel || null,
        skills: body.skills || [],
        source: 'MANAGER_REFERRAL',
        status: 'NEW',
      },
    })

    return NextResponse.json({ success: true, id: applicant.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
