'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp, Trophy, Users, AlertTriangle,
  CheckSquare, FileText, UserPlus, DollarSign,
  ArrowRight, Building2, Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  NEEDS_QUOTATION: 'bg-amber-100 text-amber-700 border-amber-200',
  QUOTATION_SENT: 'bg-orange-100 text-orange-700 border-orange-200',
  NEGOTIATION: 'bg-purple-100 text-purple-700 border-purple-200',
  WON: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-red-100 text-red-700 border-red-200',
  FUTURE_PROSPECT: 'bg-slate-100 text-slate-600 border-slate-200',
}

const STATUS_BAR_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-indigo-500',
  NEEDS_QUOTATION: 'bg-amber-500',
  QUOTATION_SENT: 'bg-orange-500',
  NEGOTIATION: 'bg-purple-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-500',
  FUTURE_PROSPECT: 'bg-slate-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
}

const CLIENT_CATEGORY_COLORS: Record<string, string> = {
  SME: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
  STARTUP: 'bg-green-100 text-green-700',
  GOVERNMENT: 'bg-amber-100 text-amber-700',
  NGO: 'bg-teal-100 text-teal-700',
  INDIVIDUAL: 'bg-slate-100 text-slate-600',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  )
}

export default function SalesDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/dashboard')
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to load sales dashboard')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const totalLeads = data?.stats?.totalLeads ?? 0
  const wonDeals = data?.stats?.wonDeals ?? 0
  const activeClients = data?.stats?.activeClients ?? 0
  const expiringSubscriptions = data?.stats?.expiringSubscriptions ?? 0

  const todaysTasks = data?.quick?.todaysTasks ?? 0
  const overdueTasks = data?.quick?.overdueTasks ?? 0
  const pendingQuotations = data?.quick?.pendingQuotations ?? 0
  const newLeads = data?.quick?.newLeads ?? 0
  const totalRevenue = data?.quick?.totalRevenue ?? 0

  const recentLeads: any[] = data?.recentLeads ?? []
  const statusBreakdown: { status: string; count: number }[] = data?.statusBreakdown ?? []
  const leadSources: { source: string; count: number }[] = data?.leadSources ?? []
  const recentClients: any[] = data?.recentClients ?? []
  const target = data?.target ?? null
  const teamPerformance: Array<{
    id: string; name: string
    clientsThisMonth: number; revenueThisMonth: number
    clientTarget: number; revenueTarget: number
  }> = data?.teamPerformance ?? []

  const maxStatusCount = statusBreakdown.reduce((m, s) => Math.max(m, s.count), 1)
  const maxSourceCount = leadSources.reduce((m, s) => Math.max(m, s.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Sales Dashboard</h1>
          <p className="text-slate-500 text-sm">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sales/leads"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <UserPlus className="w-4 h-4" />
            Manage Leads
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{totalLeads}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Total Leads</div>
            <Link href="/dashboard/sales/leads" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{wonDeals}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Won Deals</div>
            <p className="text-slate-400 text-xs mt-1">Converted leads</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{activeClients}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Active Clients</div>
            <Link href="/dashboard/sales/clients" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{expiringSubscriptions}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Expiring Subscriptions</div>
            <p className="text-slate-400 text-xs mt-1">Within 30 days</p>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/dashboard/sales/tasks"
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-rose-600" />
              </div>
              {overdueTasks > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{overdueTasks} overdue</span>
              )}
            </div>
            <div className={`text-2xl font-black ${overdueTasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>{todaysTasks}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">Today's Tasks</div>
          </Link>

          <Link href="/dashboard/sales/quotations"
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{pendingQuotations}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">Pending Quotations</div>
          </Link>

          <Link href="/dashboard/sales/leads"
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">{newLeads}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">New Leads</div>
          </Link>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-black text-green-700 leading-tight">{formatCurrency(totalRevenue)}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">Total Revenue</div>
          </div>
        </div>
      )}

      {/* Monthly Target Progress — only for SALES_AGENT and SALES_MANAGER */}
      {!loading && target && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-lg">
              Monthly Target — {session?.user?.role === 'SALES_MANAGER'
                ? `Team (${target.teamSize} members)`
                : 'Personal'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Clients target */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-semibold">Clients This Month</span>
                <span className="text-white font-black text-lg">
                  {target.clientsThisMonth} / {target.clientTarget}
                </span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    target.clientsThisMonth >= target.clientTarget ? 'bg-green-400' : 'bg-amber-300'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((target.clientsThisMonth / target.clientTarget) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-blue-200 text-xs">
                  {target.clientsThisMonth >= target.clientTarget
                    ? 'Target achieved!'
                    : `${target.clientTarget - target.clientsThisMonth} more to go`}
                </span>
                <span className="text-blue-200 text-xs font-semibold">
                  {Math.min(100, Math.round((target.clientsThisMonth / target.clientTarget) * 100))}%
                </span>
              </div>
            </div>
            {/* Revenue target */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-semibold">Revenue This Month</span>
                <span className="text-white font-black text-base leading-tight">
                  {formatCurrency(target.revenueThisMonth)}
                </span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    target.revenueThisMonth >= target.revenueTarget ? 'bg-green-400' : 'bg-amber-300'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((target.revenueThisMonth / target.revenueTarget) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-blue-200 text-xs">
                  Target: {formatCurrency(target.revenueTarget)}
                </span>
                <span className="text-blue-200 text-xs font-semibold">
                  {Math.min(100, Math.round((target.revenueThisMonth / target.revenueTarget) * 100))}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance — SALES_MANAGER only */}
      {!loading && session?.user?.role === 'SALES_MANAGER' && teamPerformance.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Team Performance This Month</h3>
            <span className="ml-auto text-xs text-slate-400 font-medium">Agent target: 5 clients · KSh 250,000</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Agent', 'Clients This Month', 'Client Progress', 'Revenue This Month', 'Revenue Progress'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamPerformance.map((agent) => {
                  const clientPct = Math.min(100, Math.round((agent.clientsThisMonth / agent.clientTarget) * 100))
                  const revPct = Math.min(100, Math.round((agent.revenueThisMonth / agent.revenueTarget) * 100))
                  return (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                            {agent.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-black text-base ${agent.clientsThisMonth >= agent.clientTarget ? 'text-green-600' : 'text-slate-900'}`}>
                          {agent.clientsThisMonth}
                        </span>
                        <span className="text-slate-400 text-xs"> / {agent.clientTarget}</span>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${clientPct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${clientPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-8 text-right">{clientPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold text-sm ${agent.revenueThisMonth >= agent.revenueTarget ? 'text-green-600' : 'text-slate-900'}`}>
                          {formatCurrency(agent.revenueThisMonth)}
                        </span>
                        <div className="text-xs text-slate-400">of {formatCurrency(agent.revenueTarget)}</div>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${revPct >= 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                              style={{ width: `${revPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-8 text-right">{revPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && session?.user?.role === 'SALES_MANAGER' && teamPerformance.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-500 text-sm font-medium">No agents assigned to your team yet.</p>
          <p className="text-slate-400 text-xs mt-1">Assign sales agents to yourself via Employee management.</p>
        </div>
      )}

      {/* Two-column layout: Leads Table + Status Breakdown */}
      {loading ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />)}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-xl mb-3" />)}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Leads Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Leads</h3>
              <Link href="/dashboard/sales/leads"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No leads yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Lead #', 'Contact', 'Company', 'Status', 'Priority', 'Assigned To', 'Created'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link href={`/dashboard/sales/leads/${lead.id}`}
                            className="font-mono text-xs text-blue-600 hover:text-blue-700 font-semibold">
                            #{lead.leadNumber || lead.id?.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 text-xs">{lead.contactPerson}</div>
                          <div className="text-slate-400 text-xs">{lead.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{lead.companyName || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {lead.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[lead.priority] || 'bg-slate-100 text-slate-600'}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                          {formatDate(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Lead Pipeline</h3>
            {statusBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">{status.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status] || 'bg-slate-400'}`}
                        style={{ width: `${Math.round((count / maxStatusCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Sources + Recent Clients */}
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(5)].map((_, i) => <div key={i} className="h-7 bg-slate-100 rounded-xl mb-2" />)}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl mb-2" />)}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Lead Sources */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Lead Sources</h3>
            {leadSources.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No source data</p>
            ) : (
              <div className="space-y-2.5">
                {leadSources.map(({ source, count }) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0 capitalize">
                      {source.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(10, Math.round((count / maxSourceCount) * 100))}%` }}
                      >
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Clients</h3>
              <Link href="/dashboard/sales/clients"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentClients.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No clients yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentClients.slice(0, 5).map((client: any) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4.5 h-4.5 text-purple-600" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{client.companyName}</div>
                      <div className="text-slate-400 text-xs truncate">{client.contactPerson} · {client.phone || client.email || '—'}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${CLIENT_CATEGORY_COLORS[client.category] || 'bg-slate-100 text-slate-600'}`}>
                      {client.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
