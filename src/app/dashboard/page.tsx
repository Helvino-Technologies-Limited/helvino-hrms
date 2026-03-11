'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Users, Clock, Calendar, DollarSign, TrendingUp, Briefcase,
  AlertCircle, CheckCircle, ArrowRight, BarChart3, Star, Award
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const LEAVE_STATUS = {
  PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  APPROVED: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-400' },
  REJECTED: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400' },
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const role = session?.user?.role || 'EMPLOYEE'
  const employee = session?.user?.employee
  const isHR = ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'].includes(role)

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, announcementsRes, leavesRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/announcements?limit=4'),
          fetch('/api/leaves?status=PENDING'),
        ])
        const [a, ann, l] = await Promise.all([analyticsRes.json(), announcementsRes.json(), leavesRes.json()])
        setAnalytics(a)
        setAnnouncements(Array.isArray(ann) ? ann : [])
        setPendingLeaves(Array.isArray(l) ? l.slice(0, 5) : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const kpis = [
    {
      label: 'Total Employees', value: analytics?.totalEmployees || 0,
      sub: `${analytics?.activeEmployees || 0} active`,
      icon: Users, color: 'from-blue-500 to-blue-600', href: '/dashboard/employees'
    },
    {
      label: 'Present Today', value: analytics?.attendanceToday || 0,
      sub: 'clocked in today',
      icon: Clock, color: 'from-emerald-500 to-emerald-600', href: '/dashboard/attendance'
    },
    {
      label: 'Pending Leaves', value: analytics?.pendingLeaves || 0,
      sub: 'awaiting approval',
      icon: Calendar, color: 'from-amber-500 to-orange-500', href: '/dashboard/leaves'
    },
    {
      label: 'Open Positions', value: analytics?.openJobs || 0,
      sub: `${analytics?.applicantsThisMonth || 0} applicants this month`,
      icon: Briefcase, color: 'from-purple-500 to-purple-600', href: '/dashboard/recruitment'
    },
  ]

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">
              {greeting()}, {employee?.firstName || session?.user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-blue-200 mt-1">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {employee && (
              <p className="text-blue-300 text-sm mt-2">
                {employee.jobTitle} · {employee.department?.name || 'Helvino Technologies'}
              </p>
            )}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-blue-200 text-sm">Company</div>
              <div className="text-white font-bold">Helvino Technologies Ltd</div>
              <div className="text-blue-300 text-sm">helvinocrm.org · 0703445756</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Link key={kpi.label} href={kpi.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-br ${kpi.color} w-11 h-11 rounded-xl flex items-center justify-center shadow-md`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-3xl font-black text-slate-900">{kpi.value}</div>
            <div className="text-slate-600 text-sm font-semibold mt-0.5">{kpi.label}</div>
            <div className="text-slate-400 text-xs mt-1">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Department distribution */}
        {analytics?.departmentDistribution?.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Headcount by Department</h3>
              <Link href="/dashboard/analytics" className="text-blue-600 text-xs font-semibold hover:underline">View Analytics →</Link>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.departmentDistribution} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Employment types */}
        {analytics?.employmentTypeBreakdown?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5">Employment Types</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics.employmentTypeBreakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {analytics.employmentTypeBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v, n) => [v, (n as string).replace('_', ' ')]} />
                <Legend formatter={(v) => v.replace('_', ' ')} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly growth */}
      {analytics?.monthlyGrowth?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Headcount Growth (12 Months)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analytics.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} name="Employees" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending leaves */}
        {isHR && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Pending Leave Requests</h3>
              <Link href="/dashboard/leaves" className="text-blue-600 text-xs font-semibold hover:underline">Manage all →</Link>
            </div>
            {pendingLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="w-10 h-10 text-green-300 mb-2" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((leave: any) => (
                  <div key={leave.id}
                    className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {leave.leaveType} · {leave.days} day(s)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{formatDate(leave.startDate)}</div>
                      <span className="inline-block bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5">PENDING</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Latest Announcements</h3>
            <Link href="/dashboard/announcements" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <AlertCircle className="w-10 h-10 text-slate-200 mb-2" />
              <p className="font-medium">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann: any) => (
                <div key={ann.id} className={`p-3 rounded-xl border transition-colors ${
                  ann.priority === 'URGENT' ? 'bg-red-50 border-red-200' :
                  ann.priority === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{ann.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5 line-clamp-2">{ann.content}</div>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      ann.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                      ann.priority === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>{ann.priority}</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-2">
                    {ann.author?.firstName} {ann.author?.lastName} · {formatDate(ann.publishedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payroll summary */}
      {['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(role) && analytics?.payrollSummary?.netSalary && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-emerald-200 text-sm font-medium">Current Month Payroll</div>
                <div className="text-3xl font-black">{formatCurrency(analytics.payrollSummary.netSalary)}</div>
                <div className="text-emerald-200 text-sm">
                  Net Pay · Gross: {formatCurrency(analytics.payrollSummary.grossSalary || 0)} · Tax: {formatCurrency(analytics.payrollSummary.paye || 0)}
                </div>
              </div>
            </div>
            <Link href="/dashboard/payroll" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
              View Payroll <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
