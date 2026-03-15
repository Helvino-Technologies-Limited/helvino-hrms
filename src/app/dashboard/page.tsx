'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Users, Clock, Calendar, DollarSign, TrendingUp, Briefcase,
  AlertCircle, CheckCircle, ArrowRight, BarChart3, Star, Award,
  FileText, Target, UserCheck, Banknote, ClipboardList, PhoneCall,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DashboardPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<any>(null)
  const [salesData, setSalesData] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
  const [myLeaves, setMyLeaves] = useState<any[]>([])
  const [myAttendance, setMyAttendance] = useState<any[]>([])
  const [myPayroll, setMyPayroll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const role = session?.user?.role || 'EMPLOYEE'
  const employee = session?.user?.employee as any
  const firstName = employee?.firstName || session?.user?.name?.split(' ')[0] || 'there'

  const isAdminHR = ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'].includes(role)
  const isFinance = role === 'FINANCE_OFFICER'
  const isSales = ['SALES_MANAGER', 'SALES_AGENT'].includes(role)
  const isEmployee = role === 'EMPLOYEE'

  useEffect(() => {
    async function loadData() {
      try {
        const fetches: Promise<any>[] = [fetch('/api/announcements?limit=4').then(r => r.json())]

        if (isAdminHR || isFinance) {
          fetches.push(fetch('/api/analytics').then(r => r.json()))
          fetches.push(fetch('/api/leaves?status=PENDING').then(r => r.json()))
        }
        if (isSales || isAdminHR) {
          fetches.push(fetch('/api/sales/dashboard').then(r => r.json()))
        }
        if (isEmployee) {
          const now = new Date()
          const m = now.getMonth() + 1
          const y = now.getFullYear()
          fetches.push(fetch('/api/leaves').then(r => r.json()))
          fetches.push(fetch(`/api/attendance?month=${m}&year=${y}`).then(r => r.json()))
          fetches.push(fetch(`/api/payroll?month=${m}&year=${y}`).then(r => r.json()))
        }

        const results = await Promise.all(fetches)
        setAnnouncements(Array.isArray(results[0]) ? results[0] : [])

        if (isAdminHR || isFinance) {
          setAnalytics(results[1] || null)
          setPendingLeaves(Array.isArray(results[2]) ? results[2].slice(0, 5) : [])
          if ((isAdminHR) && results[3]) setSalesData(results[3])
        }
        if (isSales && results[1]) setSalesData(results[1])
        if (isEmployee) {
          setMyLeaves(Array.isArray(results[1]) ? results[1].slice(0, 5) : [])
          setMyAttendance(Array.isArray(results[2]) ? results[2] : [])
          setMyPayroll(Array.isArray(results[3]) ? results[3] : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (session) loadData()
  }, [session, isAdminHR, isFinance, isSales, isEmployee])

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

  const todayAttendance = myAttendance.find((a: any) => {
    const d = new Date(a.date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  const thisMonthPayslip = myPayroll[0] || null
  const pendingMyLeaves = myLeaves.filter((l: any) => l.status === 'PENDING')
  const approvedMyLeaves = myLeaves.filter((l: any) => l.status === 'APPROVED')

  return (
    <div className="space-y-6 max-w-screen-xl">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">{greeting()}, {firstName} 👋</h1>
            <p className="text-blue-200 mt-1">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-blue-300 text-sm mt-1">
              {role === 'SUPER_ADMIN' ? 'System Administrator' :
               role === 'HR_MANAGER' ? 'HR Manager' :
               role === 'DEPARTMENT_HEAD' ? 'Department Head' :
               role === 'FINANCE_OFFICER' ? 'Finance Officer' :
               role === 'SALES_MANAGER' ? 'Sales Manager' :
               role === 'SALES_AGENT' ? 'Sales Agent' :
               'Employee'} · Helvino Technologies Ltd
            </p>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-white font-bold">Helvino Technologies Ltd</div>
            <div className="text-blue-300 text-sm">helvinocrm.org · 0703445756</div>
          </div>
        </div>
      </div>

      {/* ── ADMIN / HR / DEPARTMENT HEAD / FINANCE VIEW ── */}
      {(isAdminHR || isFinance) && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: analytics?.totalEmployees || 0, sub: `${analytics?.activeEmployees || 0} active`, icon: Users, color: 'from-blue-500 to-blue-600', href: '/dashboard/employees' },
              { label: 'Present Today', value: analytics?.attendanceToday || 0, sub: 'clocked in today', icon: Clock, color: 'from-emerald-500 to-emerald-600', href: '/dashboard/attendance' },
              { label: 'Pending Leaves', value: analytics?.pendingLeaves || 0, sub: 'awaiting approval', icon: Calendar, color: 'from-amber-500 to-orange-500', href: '/dashboard/leaves' },
              { label: 'Open Positions', value: analytics?.openJobs || 0, sub: `${analytics?.totalApplicants || analytics?.applicantsThisMonth || 0} total applicants`, icon: Briefcase, color: 'from-purple-500 to-purple-600', href: '/dashboard/recruitment/jobs' },
            ].map(kpi => (
              <Link key={kpi.label} href={kpi.href}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
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

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {analytics?.departmentDistribution?.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900">Headcount by Department</h3>
                  <Link href="/dashboard/employees" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.departmentDistribution} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Employees" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {analytics?.employmentTypeBreakdown?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-5">Employment Types</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analytics.employmentTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="45%" outerRadius={80} innerRadius={40}>
                      {analytics.employmentTypeBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(v, n) => [v, (n as string).replace('_', ' ')]} />
                    <Legend formatter={(v) => v.replace('_', ' ')} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

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

          {/* Payroll banner — admin & finance only */}
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

          {/* Bottom row: pending leaves + announcements */}
          <div className="grid lg:grid-cols-2 gap-6">
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
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{leave.employee?.firstName} {leave.employee?.lastName}</div>
                          <div className="text-slate-500 text-xs">{leave.leaveType} · {leave.days} day(s)</div>
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
            <AnnouncementsCard announcements={announcements} />
          </div>
        </>
      )}

      {/* ── SALES MANAGER / SALES AGENT VIEW ── */}
      {isSales && (
        <>
          {/* Monthly Target Tracker */}
          {(() => {
            const target = salesData?.clientMonthlyTarget || 5
            const achieved = salesData?.clientsThisMonth || 0
            const remaining = salesData?.clientsRemainingThisMonth ?? Math.max(0, target - achieved)
            const pct = Math.min(100, Math.round((achieved / target) * 100))
            const done = achieved >= target
            return (
              <div className={`rounded-2xl p-6 shadow-sm border ${done ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-500' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${done ? 'text-green-200' : 'text-slate-500'}`}>
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Client Acquisition Target
                    </div>
                    <div className={`text-2xl font-black ${done ? 'text-white' : 'text-slate-900'}`}>
                      {done ? '🎯 Target Achieved!' : remaining === 1 ? '1 client away from your target!' : `${remaining} more clients needed`}
                    </div>
                    <div className={`text-sm mt-1 ${done ? 'text-green-200' : 'text-slate-500'}`}>
                      {achieved} of {target} clients added this month
                    </div>
                  </div>
                  <Link href="/dashboard/sales/clients"
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${done ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                    <UserCheck className="w-4 h-4" /> Add Client
                  </Link>
                </div>
                <div className={`w-full rounded-full h-3 ${done ? 'bg-green-500/40' : 'bg-slate-100'}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${done ? 'bg-white' : pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className={`text-xs mt-1.5 font-semibold ${done ? 'text-green-200' : 'text-slate-400'}`}>{pct}% of monthly target</div>
              </div>
            )
          })()}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'My Leads', value: salesData?.totalLeads || 0, sub: `${salesData?.leadsThisMonth || 0} added this month`, icon: Target, color: 'from-blue-500 to-blue-600', href: '/dashboard/sales/leads' },
              { label: 'My Quotations', value: salesData?.totalQuotations || 0, sub: `${salesData?.quotationsThisMonth || 0} this month`, icon: FileText, color: 'from-purple-500 to-purple-600', href: '/dashboard/sales/quotations' },
              { label: 'My Clients', value: salesData?.totalClients || 0, sub: `${salesData?.clientsThisMonth || 0} added this month`, icon: UserCheck, color: 'from-emerald-500 to-emerald-600', href: '/dashboard/sales/clients' },
              { label: 'My Tasks', value: salesData?.totalTasks || 0, sub: `${salesData?.overdueTasks || 0} overdue`, icon: ClipboardList, color: 'from-amber-500 to-orange-500', href: '/dashboard/sales/tasks' },
            ].map(kpi => (
              <Link key={kpi.label} href={kpi.href}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
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

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/sales/leads" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Target className="w-4 h-4" /> Add Lead
              </Link>
              <Link href="/dashboard/sales/quotations" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <FileText className="w-4 h-4" /> New Quotation
              </Link>
              <Link href="/dashboard/sales/clients" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <UserCheck className="w-4 h-4" /> Add Client
              </Link>
              <Link href="/dashboard/sales/tasks" className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <ClipboardList className="w-4 h-4" /> Add Task
              </Link>
              <Link href="/dashboard/sales/services" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <PhoneCall className="w-4 h-4" /> Service Catalog
              </Link>
            </div>
          </div>

          {/* Monthly leads activity chart */}
          {(salesData?.monthlyLeads || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-5">Lead Activity — Last 6 Months</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={salesData.monthlyLeads} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent leads */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Recent Leads</h3>
                <Link href="/dashboard/sales/leads" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
              </div>
              {(salesData?.recentLeads || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400"><Target className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No leads yet. <Link href="/dashboard/sales/leads" className="text-blue-500 font-semibold">Add your first lead →</Link></p></div>
              ) : (
                <div className="space-y-3">
                  {(salesData.recentLeads || []).slice(0, 5).map((lead: any) => (
                    <Link key={lead.id} href={`/dashboard/sales/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{lead.name}</div>
                        <div className="text-slate-500 text-xs">{lead.company || lead.email}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        lead.status === 'WON' ? 'bg-green-100 text-green-700' :
                        lead.status === 'LOST' ? 'bg-red-100 text-red-700' :
                        lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{lead.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <AnnouncementsCard announcements={announcements} />
          </div>
        </>
      )}

      {/* ── EMPLOYEE VIEW ── */}
      {isEmployee && (
        <>
          {/* Status + quick actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's attendance */}
            <div className={`rounded-2xl p-5 shadow-sm border transition-all ${todayAttendance ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayAttendance ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${todayAttendance ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                  {todayAttendance ? 'CLOCKED IN' : 'NOT CLOCKED IN'}
                </div>
              </div>
              <div className="text-slate-700 font-bold text-sm">Today's Attendance</div>
              <div className="text-slate-500 text-xs mt-1">
                {todayAttendance ? `In: ${new Date(todayAttendance.clockIn).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : 'You haven\'t clocked in yet'}
              </div>
            </div>

            {/* This month attendance */}
            <Link href="/dashboard/attendance"
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
              </div>
              <div className="text-3xl font-black text-slate-900">{myAttendance.length}</div>
              <div className="text-slate-600 text-sm font-semibold mt-0.5">Days This Month</div>
              <div className="text-slate-400 text-xs mt-1">attendance records</div>
            </Link>

            {/* My pending leaves */}
            <Link href="/dashboard/leaves"
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
              </div>
              <div className="text-3xl font-black text-slate-900">{pendingMyLeaves.length}</div>
              <div className="text-slate-600 text-sm font-semibold mt-0.5">Pending Leaves</div>
              <div className="text-slate-400 text-xs mt-1">{approvedMyLeaves.length} approved</div>
            </Link>

            {/* My payslip */}
            <Link href="/dashboard/payroll"
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
              </div>
              {thisMonthPayslip ? (
                <>
                  <div className="text-2xl font-black text-slate-900">{formatCurrency(thisMonthPayslip.netPay || 0)}</div>
                  <div className="text-slate-600 text-sm font-semibold mt-0.5">This Month's Net</div>
                  <div className="text-slate-400 text-xs mt-1">gross: {formatCurrency(thisMonthPayslip.grossPay || 0)}</div>
                </>
              ) : (
                <>
                  <div className="text-slate-400 text-sm font-semibold mt-2">No payslip yet</div>
                  <div className="text-slate-400 text-xs mt-1">this month</div>
                </>
              )}
            </Link>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { label: 'Apply Leave', href: '/dashboard/leaves', icon: Calendar, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
              { label: 'My Payslips', href: '/dashboard/payroll', icon: Banknote, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
              { label: 'Attendance', href: '/dashboard/attendance', icon: Clock, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
              { label: 'My Profile', href: '/dashboard/profile', icon: UserCheck, color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
            ].map(action => (
              <Link key={action.label} href={action.href}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border font-semibold text-sm transition-colors ${action.color}`}>
                <action.icon className="w-5 h-5" />
                {action.label}
              </Link>
            ))}
          </div>

          {/* My recent leave requests + announcements */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">My Leave Requests</h3>
                <Link href="/dashboard/leaves" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
              </div>
              {myLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <CheckCircle className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="font-medium">No leave requests</p>
                  <Link href="/dashboard/leaves" className="text-blue-600 text-sm mt-2 hover:underline">Apply for leave →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLeaves.map((leave: any) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{leave.leaveType}</div>
                        <div className="text-slate-500 text-xs">{formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.days} day(s)</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{leave.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AnnouncementsCard announcements={announcements} />
          </div>
        </>
      )}

      {/* Announcements always visible if not already shown above */}
      {!isAdminHR && !isFinance && !isSales && !isEmployee && (
        <AnnouncementsCard announcements={announcements} />
      )}
    </div>
  )
}

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  return (
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
            <div key={ann.id} className={`p-3 rounded-xl border ${
              ann.priority === 'URGENT' ? 'bg-red-50 border-red-200' :
              ann.priority === 'HIGH' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{ann.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5 line-clamp-2">{ann.content}</div>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  ann.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                  ann.priority === 'HIGH' ? 'bg-orange-200 text-orange-800' : 'bg-slate-200 text-slate-700'
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
  )
}
