import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus, InterviewStatus, JobStatus, OfferStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      jobStatusCounts,
      totalApplications,
      applicationsByStatus,
      topJobsRaw,
      applicationsBySource,
      recentApplications,
      hiredApplicants,
      interviewsScheduled,
      offersPending,
      offersAccepted,
    ] = await Promise.all([
      // Count jobs by each status
      prisma.job.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Total applications
      prisma.applicant.count(),

      // Applications per status
      prisma.applicant.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Top 10 jobs by application count
      prisma.job.findMany({
        select: {
          title: true,
          _count: {
            select: { applicants: true },
          },
        },
        orderBy: {
          applicants: { _count: 'desc' },
        },
        take: 10,
      }),

      // Applications by source
      prisma.applicant.groupBy({
        by: ['source'],
        _count: { _all: true },
      }),

      // Applications in last 30 days
      prisma.applicant.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Hired applicants for time-to-hire calculation
      prisma.applicant.findMany({
        where: { status: ApplicantStatus.HIRED },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Interviews scheduled
      prisma.interview.count({
        where: { status: InterviewStatus.SCHEDULED },
      }),

      // Offers pending
      prisma.jobOffer.count({
        where: { status: OfferStatus.PENDING },
      }),

      // Offers accepted
      prisma.jobOffer.count({
        where: { status: OfferStatus.ACCEPTED },
      }),
    ])

    // Build totalJobs map
    const totalJobs: Record<string, number> = {
      OPEN: 0,
      CLOSED: 0,
      DRAFT: 0,
      ARCHIVED: 0,
    }
    for (const row of jobStatusCounts) {
      totalJobs[row.status] = row._count._all
    }

    // Build applicationsByStatus map
    const appsByStatus: Record<string, number> = {}
    for (const row of applicationsByStatus) {
      appsByStatus[row.status] = row._count._all
    }

    // Format top jobs
    const applicationsByJob = topJobsRaw.map((job) => ({
      jobTitle: job.title,
      count: job._count.applicants,
    }))

    // Build applicationsBySource map
    const appsBySource: Record<string, number> = {}
    for (const row of applicationsBySource) {
      const key = row.source ?? 'UNKNOWN'
      appsBySource[key] = row._count._all
    }

    // Calculate average time to hire (days)
    let timeToHire: number | null = null
    if (hiredApplicants.length > 0) {
      const totalMs = hiredApplicants.reduce((sum, a) => {
        return sum + (a.updatedAt.getTime() - a.createdAt.getTime())
      }, 0)
      const avgMs = totalMs / hiredApplicants.length
      timeToHire = Math.round(avgMs / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      totalJobs,
      totalApplications,
      applicationsByStatus: appsByStatus,
      applicationsByJob,
      applicationsBySource: appsBySource,
      recentApplications,
      timeToHire,
      interviewsScheduled,
      offersPending,
      offersAccepted,
    })
  } catch (error) {
    console.error('GET /api/recruitment/analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
