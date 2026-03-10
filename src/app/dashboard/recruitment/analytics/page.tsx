'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Users, Briefcase, CheckCircle2, Clock, Calendar } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#eab308', '#f97316', '#22c55e', '#10b981', '#ef4444']

const FUNNEL_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'underReview', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
]

const FUNNEL_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#eab308', '#f97316', '#22c55e',
]

interface AnalyticsData {
  totalApplications: number
  hired: number
  activeJobs: number
  avgTimeToHire: number
  scheduledInterviews: number
  applicationsByStatus: { status: string; count: number }[]
  topJobs: { title: string; count: number }[]
  applicationSources: { source: string; count: number }[]
  funnel: {
    applied: number
    underReview: number
    shortlisted: number
    interviewed: number
    offered: number
    hired: number
  }
}

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
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch('/api/recruitment/analytics')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // fail silently, will show empty state
      }
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

  const statusChartData = (data?.applicationsByStatus || []).map(s => ({
    name: s.status.replace(/_/g, ' '),
    value: s.count,
  }))

  const topJobsData = (data?.topJobs || []).map(j => ({
    name: j.title,
    count: j.count,
  }))

  const sourcesData = (data?.applicationSources || [])
    .filter(s => s.source)
    .map(s => ({
      name: s.source || 'Unknown',
      value: s.count,
    }))

  const funnel = data?.funnel || {
    applied: 0, underReview: 0, shortlisted: 0,
    interviewed: 0, offered: 0, hired: 0,
  }

  const funnelMax = funnel.applied || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Recruitment Analytics</h1>
        <p className="text-slate-500 text-sm">Hiring pipeline insights and performance metrics</p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Total Applications',
            value: data?.totalApplications ?? 0,
            icon: <Users className="w-5 h-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
          },
          {
            label: 'Hired',
            value: data?.hired ?? 0,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
          },
          {
            label: 'Active Jobs',
            value: data?.activeJobs ?? 0,
            icon: <Briefcase className="w-5 h-5" />,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
          },
          {
            label: 'Avg Time to Hire',
            value: data?.avgTimeToHire != null ? `${data.avgTimeToHire}d` : '—',
            icon: <Clock className="w-5 h-5" />,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
          },
          {
            label: 'Interviews Scheduled',
            value: data?.scheduledInterviews ?? 0,
            icon: <Calendar className="w-5 h-5" />,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
          },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl p-4 shadow-sm border ${kpi.border}`}>
            <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5 leading-tight">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Applications by Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Applications by Status</h2>
          {statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusChartData} margin={{ top: 0, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Jobs by Applications */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Top Jobs by Applications</h2>
          {topJobsData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topJobsData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={120}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topJobsData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sources chart */}
      {sourcesData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">Application Sources</h2>
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sourcesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {sourcesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sourcesData.map((s, i) => {
                const total = sourcesData.reduce((sum, x) => sum + x.value, 0)
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                return (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-700 font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">{s.value}</span>
                      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hiring Funnel */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-base font-bold text-slate-900 mb-1">Hiring Funnel</h2>
        <p className="text-slate-500 text-xs mb-5">Conversion rates through each stage of the pipeline</p>
        <div className="space-y-2.5">
          {FUNNEL_STAGES.map((stage, idx) => {
            const count = funnel[stage.key as keyof typeof funnel] ?? 0
            const prev = idx === 0 ? funnelMax : (funnel[FUNNEL_STAGES[idx - 1].key as keyof typeof funnel] ?? 0)
            const pct = funnelMax > 0 ? Math.round((count / funnelMax) * 100) : 0
            const conv = idx === 0 ? 100 : (prev > 0 ? Math.round((count / prev) * 100) : 0)
            const barColor = FUNNEL_COLORS[idx]

            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: barColor }}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {idx > 0 && `${conv}% from prev`}
                    </span>
                    <span className="text-sm font-black text-slate-800 w-8 text-right">{count}</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Funnel summary */}
        {funnel.applied > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Shortlist Rate</p>
              <p className="text-lg font-black text-purple-600">
                {Math.round((funnel.shortlisted / funnelMax) * 100)}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Interview Rate</p>
              <p className="text-lg font-black text-yellow-600">
                {Math.round((funnel.interviewed / funnelMax) * 100)}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Hire Rate</p>
              <p className="text-lg font-black text-green-600">
                {Math.round((funnel.hired / funnelMax) * 100)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
