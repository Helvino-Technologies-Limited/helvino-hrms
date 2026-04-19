import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicantStatus, InterviewStatus, OfferStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Build 6 monthly buckets for trend chart
    const monthBuckets: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      monthBuckets.push({
        label: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        start,
        end,
      })
    }

    const [
      jobStatusCounts,
      totalApplications,
      applicationsByStatus,
      topJobsRaw,
      applicationsBySource,
      recentApplications,
      hiredApplicants,
      interviewsScheduled,
      interviewsTotal,
      interviewsCompleted,
      offersPending,
      offersAccepted,
      offersDeclined,
      hiredThisMonth,
      applicationsThisMonth,
      applicationsLastMonth,
      departmentBreakdown,
      ...monthlyApplicationCounts
    ] = await Promise.all([
      // Jobs by status
      prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),

      // Total applications ever
      prisma.applicant.count(),

      // Applications per status
      prisma.applicant.groupBy({ by: ['status'], _count: { _all: true } }),

      // Top 10 jobs by application count
      prisma.job.findMany({
        select: { title: true, department: true, _count: { select: { applicants: true } } },
        orderBy: { applicants: { _count: 'desc' } },
        take: 10,
      }),

      // Applications by source
      prisma.applicant.groupBy({ by: ['source'], _count: { _all: true } }),

      // Applications in last 30 days
      prisma.applicant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // All hired applicants (for time-to-hire)
      prisma.applicant.findMany({
        where: { status: ApplicantStatus.HIRED },
        select: { createdAt: true, updatedAt: true },
      }),

      // Interviews scheduled (upcoming)
      prisma.interview.count({ where: { status: InterviewStatus.SCHEDULED } }),

      // Total interviews ever
      prisma.interview.count(),

      // Interviews completed
      prisma.interview.count({ where: { status: InterviewStatus.COMPLETED } }),

      // Offers pending
      prisma.jobOffer.count({ where: { status: OfferStatus.PENDING } }),

      // Offers accepted
      prisma.jobOffer.count({ where: { status: OfferStatus.ACCEPTED } }),

      // Offers declined
      prisma.jobOffer.count({ where: { status: OfferStatus.REJECTED } }),

      // Hired this month
      prisma.applicant.count({
        where: { status: ApplicantStatus.HIRED, updatedAt: { gte: monthStart, lt: monthEnd } },
      }),

      // Applications this month
      prisma.applicant.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),

      // Applications last month (for comparison)
      prisma.applicant.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),

      // Applicants by job department
      prisma.job.findMany({
        where: { NOT: { departmentId: null } },
        select: { departmentId: true, department: { select: { name: true } }, _count: { select: { applicants: true } } },
      }),

      // Monthly application counts for trend
      ...monthBuckets.map((b) =>
        prisma.applicant.count({ where: { createdAt: { gte: b.start, lt: b.end } } })
      ),
    ])

    // Build maps
    const totalJobs: Record<string, number> = { OPEN: 0, CLOSED: 0, DRAFT: 0, ARCHIVED: 0 }
    for (const row of jobStatusCounts) totalJobs[row.status] = row._count._all

    const appsByStatus: Record<string, number> = {}
    for (const row of applicationsByStatus) appsByStatus[row.status] = row._count._all

    const appsBySource: Record<string, number> = {}
    for (const row of applicationsBySource) {
      appsBySource[row.source ?? 'UNKNOWN'] = row._count._all
    }

    // Average time to hire (days) — use median for robustness
    let avgTimeToHire: number | null = null
    if (hiredApplicants.length > 0) {
      const days = hiredApplicants
        .map((a) => Math.round((a.updatedAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
        .filter((d) => d >= 0)
        .sort((a, b) => a - b)
      if (days.length > 0) {
        const mid = Math.floor(days.length / 2)
        avgTimeToHire = days.length % 2 === 0 ? Math.round((days[mid - 1] + days[mid]) / 2) : days[mid]
      }
    }

    // Hiring funnel — cumulative (each stage includes everyone who reached it or beyond)
    const hiredCount = appsByStatus[ApplicantStatus.HIRED] ?? 0
    const offeredCount = (appsByStatus[ApplicantStatus.OFFERED] ?? 0) + hiredCount
    const interviewedCount =
      (appsByStatus[ApplicantStatus.INTERVIEW_SCHEDULED] ?? 0) +
      (appsByStatus[ApplicantStatus.INTERVIEWED] ?? 0) +
      offeredCount
    const shortlistedCount = (appsByStatus[ApplicantStatus.SHORTLISTED] ?? 0) + interviewedCount
    const underReviewCount = (appsByStatus[ApplicantStatus.UNDER_REVIEW] ?? 0) + shortlistedCount
    const funnel = {
      applied: totalApplications,
      underReview: underReviewCount,
      shortlisted: shortlistedCount,
      interviewed: interviewedCount,
      offered: offeredCount,
      hired: hiredCount,
    }

    // Department breakdown
    const deptMap: Record<string, number> = {}
    for (const job of departmentBreakdown) {
      const deptName = job.department?.name
      if (deptName) {
        deptMap[deptName] = (deptMap[deptName] ?? 0) + job._count.applicants
      }
    }

    // Offer acceptance rate
    const totalOffers = offersAccepted + offersDeclined + offersPending
    const offerAcceptanceRate = totalOffers > 0 ? Math.round((offersAccepted / totalOffers) * 100) : null

    // Rejection count
    const rejectedCount = appsByStatus[ApplicantStatus.REJECTED] ?? 0

    // Month-over-month growth
    const momGrowth = applicationsLastMonth > 0
      ? Math.round(((applicationsThisMonth - applicationsLastMonth) / applicationsLastMonth) * 100)
      : null

    // Monthly trend
    const monthlyTrend = monthBuckets.map((b, i) => ({
      month: b.label,
      applications: monthlyApplicationCounts[i] as number,
    }))

    return NextResponse.json({
      // KPI fields (named to match the analytics page)
      hired: hiredCount,
      hiredThisMonth,
      activeJobs: totalJobs['OPEN'] ?? 0,
      avgTimeToHire,
      scheduledInterviews: interviewsScheduled,
      totalApplications,
      recentApplications,
      applicationsThisMonth,
      applicationsLastMonth,
      momGrowth,
      rejectedCount,

      // Interviews
      interviewsTotal,
      interviewsCompleted,

      // Offers
      offersPending,
      offersAccepted,
      offersDeclined,
      offerAcceptanceRate,

      // Job stats
      totalJobs,

      // Funnel
      funnel,

      // Charts
      applicationsByStatus: Object.entries(appsByStatus).map(([status, count]) => ({ status, count })),
      topJobs: topJobsRaw.map((j) => ({ title: j.title, department: j.department, count: j._count.applicants })),
      applicationSources: Object.entries(appsBySource).map(([source, count]) => ({ source, count })),
      departmentBreakdown: Object.entries(deptMap).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count),
      monthlyTrend,
    })
  } catch (error) {
    console.error('GET /api/recruitment/analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
