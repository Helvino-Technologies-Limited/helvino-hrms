'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase, Users, Video, FileText, BarChart3, Target,
  Globe, Database, TrendingUp, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

const APPLICANT_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  UNDER_REVIEW: 'bg-purple-500',
  SHORTLISTED: 'bg-indigo-500',
  INTERVIEW_SCHEDULED: 'bg-yellow-500',
  INTERVIEWED: 'bg-orange-500',
  OFFERED: 'bg-green-500',
  HIRED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
}

const APPLICANT_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function RecruitmentDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [todayInterviews, setTodayInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [ar, ir] = await Promise.all([
        fetch('/api/recruitment/analytics'),
        fetch('/api/recruitment/interviews?status=SCHEDULED&date=today'),
      ])
      const [a, i] = await Promise.all([ar.json(), ir.json()])
      setAnalytics(a)
      setTodayInterviews(Array.isArray(i) ? i : (i?.interviews ?? []))
    } catch {
      toast.error('Failed to load recruitment data')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openJobs = analytics?.totalJobs?.OPEN ?? 0
  const totalApplications = analytics?.totalApplications ?? 0
  const offersPending = analytics?.offersPending ?? 0
  const applicationsByStatus: { status: string; count: number }[] = analytics?.applicationsByStatus ?? []
  const topJobs: { title: string; count: number; id?: string }[] = analytics?.topJobsByApplications ?? []

  const totalApps = applicationsByStatus.reduce((s, x) => s + x.count, 0) || 1

  const quickNavItems = [
    { label: 'Jobs', href: '/dashboard/recruitment/jobs', icon: Briefcase, color: 'bg-blue-100', iconColor: 'text-blue-600', desc: 'Manage job postings' },
    { label: 'Applications', href: '/dashboard/recruitment/applications', icon: Users, color: 'bg-purple-100', iconColor: 'text-purple-600', desc: 'Review applicants' },
    { label: 'Interviews', href: '/dashboard/recruitment/interviews', icon: Video, color: 'bg-yellow-100', iconColor: 'text-yellow-600', desc: 'Schedule & track' },
    { label: 'Talent Pool', href: '/dashboard/recruitment/candidates', icon: Database, color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'Candidate database' },
    { label: 'Analytics', href: '/dashboard/recruitment/analytics', icon: BarChart3, color: 'bg-green-100', iconColor: 'text-green-600', desc: 'Hiring insights' },
    { label: 'Careers Portal', href: '/careers', icon: Globe, color: 'bg-rose-100', iconColor: 'text-rose-600', desc: 'Public job board', external: true },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Recruitment & ATS</h1>
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading...' : `${openJobs} open position${openJobs !== 1 ? 's' : ''} · Applicant tracking system`}
          </p>
        </div>
        <Link
          href="/dashboard/recruitment/jobs"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors"
        >
          <Briefcase className="w-4 h-4" />
          Manage Jobs
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Stat Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{openJobs}</div>
              <div className="text-slate-700 text-sm font-semibold mt-0.5">Open Jobs</div>
              <Link href="/dashboard/recruitment/jobs" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
                View jobs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalApplications}</div>
              <div className="text-slate-700 text-sm font-semibold mt-0.5">Total Applications</div>
              <Link href="/dashboard/recruitment/applications" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
                <Video className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{todayInterviews.length}</div>
              <div className="text-slate-700 text-sm font-semibold mt-0.5">Interviews Today</div>
              <Link href="/dashboard/recruitment/interviews" className="text-yellow-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
                View schedule <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{offersPending}</div>
              <div className="text-slate-700 text-sm font-semibold mt-0.5">Offers Pending</div>
              <Link href="/dashboard/recruitment/applications" className="text-green-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
                Review offers <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickNavItems.map(({ label, href, icon: Icon, color, iconColor, desc, external }) => (
              <Link
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col items-center text-center gap-2"
              >
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{label}</div>
                  <div className="text-slate-400 text-xs leading-tight mt-0.5">{desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Two Columns */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Application Pipeline */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900">Application Pipeline</h3>
              </div>
              {applicationsByStatus.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-medium">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationsByStatus.map(({ status, count }) => {
                    const pct = Math.round((count / totalApps) * 100)
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">
                            {APPLICANT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{count}</span>
                            <span className="text-xs text-slate-400">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${APPLICANT_STATUS_COLORS[status] ?? 'bg-slate-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Jobs */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900">Top Jobs by Applications</h3>
              </div>
              {topJobs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-medium">No job data yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topJobs.slice(0, 5).map((job, idx) => (
                    <div key={job.id ?? job.title} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${
                        idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{job.title}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {job.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
