'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import {
  Users, Briefcase, CheckCircle2, Clock, Calendar, TrendingUp,
  FileText, ArrowUpRight, ArrowDownRight, Target, Award,
} from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#eab308', '#f97316', '#22c55e', '#10b981', '#ef4444']
const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#eab308', '#f97316', '#22c55e']

const FUNNEL_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'underReview', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-blue-600 font-bold">{payload[0]?.value}</p>
      </div>
    )
  }
  return null
}

function PieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{payload[0]?.name}</p>
        <p className="font-bold" style={{ color: payload[0]?.payload?.fill }}>{payload[0]?.value}</p>
      </div>
    )
  }
  return null
}

export default function RecruitmentAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch('/api/recruitment/analytics')
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const funnel = data?.funnel ?? { applied: 0, underReview: 0, shortlisted: 0, interviewed: 0, offered: 0, hired: 0 }
  const funnelMax = funnel.applied || 1

  const statusChartData = (data?.applicationsByStatus ?? []).map((s: any) => ({
    name: s.status.replace(/_/g, ' '),
    value: s.count,
  }))

  const topJobsData = (data?.topJobs ?? []).map((j: any) => ({ name: j.title, count: j.count }))

  const sourcesData = (data?.applicationSources ?? [])
    .filter((s: any) => s.source && s.source !== 'UNKNOWN')
    .map((s: any) => ({ name: s.source, value: s.count }))

  const deptData = (data?.departmentBreakdown ?? []).slice(0, 8).map((d: any) => ({
    name: d.dept, count: d.count,
  }))

  const monthlyTrend = data?.monthlyTrend ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Recruitment Analytics</h1>
        <p className="text-slate-500 text-sm">Comprehensive hiring pipeline insights and performance metrics</p>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            {data?.momGrowth != null && (
              <span className={`flex items-center gap-1 text-xs font-bold ${data.momGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {data.momGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(data.momGrowth)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-blue-600">{data?.totalApplications ?? 0}</p>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Total Applications</p>
          <p className="text-slate-400 text-xs mt-1">{data?.applicationsThisMonth ?? 0} this month</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600">{data?.hired ?? 0}</p>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Total Hired</p>
          <p className="text-slate-400 text-xs mt-1">{data?.hiredThisMonth ?? 0} this month</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600">{data?.activeJobs ?? 0}</p>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Active Jobs</p>
          <p className="text-slate-400 text-xs mt-1">{(data?.totalJobs?.CLOSED ?? 0)} closed</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-600">
            {data?.avgTimeToHire != null ? `${data.avgTimeToHire}d` : '—'}
          </p>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Avg Time to Hire</p>
          <p className="text-slate-400 text-xs mt-1">median across all hires</p>
        </div>
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interviews</span>
          </div>
          <p className="text-xl font-black text-indigo-600">{data?.scheduledInterviews ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">scheduled · {data?.interviewsCompleted ?? 0} completed</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offers</span>
          </div>
          <p className="text-xl font-black text-amber-600">{data?.offersPending ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">pending · {data?.offersAccepted ?? 0} accepted</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offer Acceptance</span>
          </div>
          <p className="text-xl font-black text-teal-600">
            {data?.offerAcceptanceRate != null ? `${data.offerAcceptanceRate}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">of total offers made</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rejected</span>
          </div>
          <p className="text-xl font-black text-red-500">{data?.rejectedCount ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">applicants rejected</p>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Application status breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Applications by Status</h2>
          {statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusChartData} margin={{ top: 0, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top jobs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Top Jobs by Applications</h2>
          {topJobsData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topJobsData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={120}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topJobsData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-1">Application Trend (Last 6 Months)</h2>
          <p className="text-slate-400 text-xs mb-4">Monthly volume of new applications</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }} name="Applications" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sources + Dept row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sources */}
        {sourcesData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-4">Application Sources</h2>
            <div className="grid grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sourcesData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={75} innerRadius={40} paddingAngle={3}>
                    {sourcesData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {sourcesData.map((s: any, i: number) => {
                  const total = sourcesData.reduce((sum: number, x: any) => sum + x.value, 0)
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                  return (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-slate-600 font-medium truncate max-w-24">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{s.value}</span>
                        <span className="text-xs text-slate-400 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Department breakdown */}
        {deptData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-900 mb-4">Applications by Department</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={110}
                  tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#8b5cf6" name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Hiring Funnel */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-base font-bold text-slate-900 mb-1">Hiring Funnel</h2>
        <p className="text-slate-500 text-xs mb-5">Cumulative applicants through each stage of the pipeline</p>
        <div className="space-y-2.5">
          {FUNNEL_STAGES.map((stage, idx) => {
            const count = funnel[stage.key as keyof typeof funnel] ?? 0
            const pct = funnelMax > 0 ? Math.round((count / funnelMax) * 100) : 0
            const prev = idx === 0 ? funnelMax : (funnel[FUNNEL_STAGES[idx - 1].key as keyof typeof funnel] ?? 1)
            const conv = idx === 0 ? 100 : (prev > 0 ? Math.round((count / prev) * 100) : 0)
            const barColor = FUNNEL_COLORS[idx]
            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: barColor }}>{idx + 1}</div>
                    <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {idx > 0 && (
                      <span className="text-xs text-slate-400 font-medium">{conv}% from prev</span>
                    )}
                    <span className="text-sm font-black text-slate-800 w-8 text-right">{count}</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary metrics */}
        {funnel.applied > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Shortlist Rate', value: `${Math.round((funnel.shortlisted / funnelMax) * 100)}%`, color: 'text-purple-600' },
              { label: 'Interview Rate', value: `${Math.round((funnel.interviewed / funnelMax) * 100)}%`, color: 'text-yellow-600' },
              { label: 'Offer Rate', value: `${Math.round((funnel.offered / funnelMax) * 100)}%`, color: 'text-orange-600' },
              { label: 'Hire Rate', value: `${Math.round((funnel.hired / funnelMax) * 100)}%`, color: 'text-green-600' },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">{m.label}</p>
                <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offers summary */}
      {(data?.offersPending ?? 0) + (data?.offersAccepted ?? 0) + (data?.offersDeclined ?? 0) > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Offer Summary</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending', value: data?.offersPending ?? 0, color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { label: 'Accepted', value: data?.offersAccepted ?? 0, color: 'text-green-600 bg-green-50 border-green-100' },
              { label: 'Declined', value: data?.offersDeclined ?? 0, color: 'text-red-500 bg-red-50 border-red-100' },
            ].map(o => (
              <div key={o.label} className={`rounded-xl p-4 border text-center ${o.color}`}>
                <p className="text-2xl font-black">{o.value}</p>
                <p className="text-xs font-semibold mt-1 opacity-80">{o.label}</p>
              </div>
            ))}
          </div>
          {data?.offerAcceptanceRate != null && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Offer Acceptance Rate</span>
              <span className={`text-lg font-black ${data.offerAcceptanceRate >= 70 ? 'text-green-600' : data.offerAcceptanceRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                {data.offerAcceptanceRate}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
