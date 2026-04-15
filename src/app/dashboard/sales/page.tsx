'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp, Trophy, Users, AlertTriangle, CheckSquare, FileText,
  UserPlus, DollarSign, ArrowRight, Building2, Target, TrendingDown,
  Zap, BarChart3, Calendar, ClipboardList, Award, Star,
  ChevronRight, Activity, Link2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

// ─── colour maps ──────────────────────────────────────────────────────────────
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
const STATUS_BAR: Record<string, string> = {
  NEW: 'bg-blue-500', CONTACTED: 'bg-indigo-500', NEEDS_QUOTATION: 'bg-amber-500',
  QUOTATION_SENT: 'bg-orange-500', NEGOTIATION: 'bg-purple-500',
  WON: 'bg-green-500', LOST: 'bg-red-500', FUTURE_PROSPECT: 'bg-slate-400',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-700',
}
const CLIENT_CATEGORY_COLORS: Record<string, string> = {
  SME: 'bg-blue-100 text-blue-700', ENTERPRISE: 'bg-purple-100 text-purple-700',
  STARTUP: 'bg-green-100 text-green-700', GOVERNMENT: 'bg-amber-100 text-amber-700',
  NGO: 'bg-teal-100 text-teal-700', INDIVIDUAL: 'bg-slate-100 text-slate-600',
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function pct(v: number, t: number) { return t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0 }

function ProgressBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const p = pct(value, max)
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${p}%` }} />
    </div>
  )
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

// ─── Agent performance card ───────────────────────────────────────────────────
function AgentCard({ agent }: { agent: { id: string; name: string; leadsThisMonth: number; clientsThisMonth: number; revenueThisMonth: number; leadTarget: number; clientTarget: number; revenueTarget: number } }) {
  const lp = pct(agent.leadsThisMonth, agent.leadTarget)
  const cp = pct(agent.clientsThisMonth, agent.clientTarget)
  const rp = pct(agent.revenueThisMonth, agent.revenueTarget)
  const overall = Math.round((lp + cp + rp) / 3)
  const status = overall >= 80 ? 'On Track' : overall >= 40 ? 'In Progress' : 'Needs Attention'
  const statusColor = overall >= 80 ? 'bg-green-100 text-green-700' : overall >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-teal-500']
  const avatarColor = avatarColors[agent.name.charCodeAt(0) % avatarColors.length]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Agent header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${avatarColor}`}>
            {initials}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">{agent.name}</div>
            <div className="text-slate-400 text-xs">Sales Agent</div>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{status}</span>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {/* Leads */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Leads
            </span>
            <span className="text-xs font-bold text-slate-800">{agent.leadsThisMonth} / {agent.leadTarget}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${lp >= 100 ? 'bg-green-500' : lp >= 60 ? 'bg-indigo-500' : 'bg-amber-400'}`} style={{ width: `${lp}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-slate-400">{lp >= 100 ? '✅ Target met' : `${agent.leadTarget - agent.leadsThisMonth} remaining`}</span>
            <span className="text-xs font-bold text-slate-500">{lp}%</span>
          </div>
        </div>

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Clients
            </span>
            <span className="text-xs font-bold text-slate-800">{agent.clientsThisMonth} / {agent.clientTarget}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${cp >= 100 ? 'bg-green-500' : cp >= 60 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${cp}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-slate-400">{cp >= 100 ? '✅ Target met' : `${agent.clientTarget - agent.clientsThisMonth} remaining`}</span>
            <span className="text-xs font-bold text-slate-500">{cp}%</span>
          </div>
        </div>

        {/* Revenue */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Revenue
            </span>
            <span className="text-xs font-bold text-slate-800">{formatCurrency(agent.revenueThisMonth)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${rp >= 100 ? 'bg-green-500' : rp >= 60 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${rp}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-slate-400">{rp >= 100 ? '✅ Target met' : `${formatCurrency(agent.revenueTarget - agent.revenueThisMonth)} remaining`}</span>
            <span className="text-xs font-bold text-slate-500">{rp}%</span>
          </div>
        </div>
      </div>

      {/* Overall score */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Overall score</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= Math.round(overall / 20) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-700">{overall}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full bg-blue-100 rounded-t-sm relative overflow-hidden" style={{ height: `${Math.max(4, Math.round((d.count / max) * 56))}px` }}>
            <div className={`absolute inset-0 ${i === data.length - 1 ? 'bg-blue-600' : 'bg-blue-400'} rounded-t-sm`} />
          </div>
          <span className="text-slate-400 text-[9px] font-medium leading-none truncate w-full text-center">{d.month.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function ManagerDashboard({ data, loading }: { data: any; loading: boolean }) {
  const { data: session } = useSession()
  const userName = (session?.user as any)?.name || 'Manager'
  const firstName = userName.split(' ')[0]

  const stats = data?.stats ?? {}
  const quick = data?.quick ?? {}
  const teamPerformance: any[] = data?.teamPerformance ?? []
  const recentLeads: any[] = data?.recentLeads ?? []
  const recentClients: any[] = data?.recentClients ?? []
  const statusBreakdown: { status: string; count: number }[] = data?.statusBreakdown ?? []
  const monthlyLeads: { month: string; count: number }[] = data?.monthlyLeads ?? []
  const leadSources: { source: string; count: number }[] = data?.leadSources ?? []

  const maxStatus = statusBreakdown.reduce((m, s) => Math.max(m, s.count), 1)
  const maxSource = leadSources.reduce((m, s) => Math.max(m, s.count), 1)

  const applicantStats = data?.applicantStats ?? null
  const activeAgentsCount: number = data?.activeAgentsCount ?? teamPerformance.length

  // Manager's own personal target (their individual KPI)
  const managerTarget = data?.managerTarget ?? { leadTarget: 20, clientTarget: 10, revenueTarget: 500000, leadsThisMonth: 0, clientsThisMonth: 0, revenueThisMonth: 0, leadsRemaining: 20, clientsRemaining: 10, revenueRemaining: 500000 }
  const lp = pct(managerTarget.leadsThisMonth, managerTarget.leadTarget)
  const cp = pct(managerTarget.clientsThisMonth, managerTarget.clientTarget)
  const rp = pct(managerTarget.revenueThisMonth, managerTarget.revenueTarget)
  // Team combined totals (sum of all agents + manager)
  const teamLeadsThisMonth: number = quick.leadsThisMonth ?? 0
  const teamClientsThisMonth: number = quick.clientsThisMonth ?? 0
  const teamRevenueThisMonth: number = quick.revenueThisMonth ?? 0

  const topAgent = teamPerformance.length > 0
    ? teamPerformance.reduce((best, a) => {
        const score = pct(a.leadsThisMonth, a.leadTarget) + pct(a.clientsThisMonth, a.clientTarget) + pct(a.revenueThisMonth, a.revenueTarget)
        const bestScore = pct(best.leadsThisMonth, best.leadTarget) + pct(best.clientsThisMonth, best.clientTarget) + pct(best.revenueThisMonth, best.revenueTarget)
        return score > bestScore ? a : best
      }, teamPerformance[0])
    : null

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Sales Manager · {now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/sales/leads/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-colors">
            <UserPlus className="w-4 h-4" /> Add Lead
          </Link>
          <Link href="/dashboard/sales/team" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
            <Users className="w-4 h-4" /> My Team
          </Link>
          <Link href="/dashboard/sales/clients" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
            <Building2 className="w-4 h-4" /> Clients
          </Link>
        </div>
      </div>

      {/* ── My Monthly Target — hero card ── */}
      {loading ? (
        <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-lg">
          {/* Dark gradient header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="text-white font-black text-base">My Monthly Target — {monthName}</div>
                <div className="text-blue-300 text-xs font-medium">
                  Personal KPI · {managerTarget.leadTarget} leads · {managerTarget.clientTarget} clients
                </div>
              </div>
            </div>
            {lp >= 100 && cp >= 100 && rp >= 100 && (
              <div className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30">
                🎉 TARGET MET!
              </div>
            )}
          </div>

          {/* Progress section */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Leads */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                    <span className="text-blue-100 text-sm font-semibold">Leads This Month</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black text-2xl">{managerTarget.leadsThisMonth}</span>
                    <span className="text-blue-300 font-semibold text-lg"> / {managerTarget.leadTarget}</span>
                  </div>
                </div>
                <div className="h-3 bg-white/15 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${lp >= 100 ? 'bg-green-400' : lp >= 60 ? 'bg-amber-300' : 'bg-red-400'}`}
                    style={{ width: `${lp}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs">
                    {lp >= 100 ? '✅ Target achieved!' : `${managerTarget.leadsRemaining} more needed`}
                  </span>
                  <span className="text-white text-sm font-black">{lp}%</span>
                </div>
              </div>

              {/* Clients */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-200" />
                    <span className="text-blue-100 text-sm font-semibold">New Clients This Month</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black text-2xl">{managerTarget.clientsThisMonth}</span>
                    <span className="text-blue-300 font-semibold text-lg"> / {managerTarget.clientTarget}</span>
                  </div>
                </div>
                <div className="h-3 bg-white/15 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${cp >= 100 ? 'bg-green-400' : cp >= 60 ? 'bg-amber-300' : 'bg-red-400'}`}
                    style={{ width: `${cp}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs">
                    {cp >= 100 ? '✅ Target achieved!' : `${managerTarget.clientsRemaining} more needed`}
                  </span>
                  <span className="text-white text-sm font-black">{cp}%</span>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-200" />
                    <span className="text-blue-100 text-sm font-semibold">Revenue This Month</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-lg leading-tight">{formatCurrency(managerTarget.revenueThisMonth)}</div>
                    <div className="text-blue-300 text-xs">of {formatCurrency(managerTarget.revenueTarget)}</div>
                  </div>
                </div>
                <div className="h-3 bg-white/15 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${rp >= 100 ? 'bg-green-400' : rp >= 60 ? 'bg-amber-300' : 'bg-red-400'}`}
                    style={{ width: `${rp}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs">
                    {rp >= 100 ? '✅ Target achieved!' : `${formatCurrency(managerTarget.revenueRemaining)} remaining`}
                  </span>
                  <span className="text-white text-sm font-black">{rp}%</span>
                </div>
              </div>
            </div>

            {/* Team summary bar */}
            <div className="mt-4 bg-white/10 backdrop-blur rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <span className="text-blue-200 text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Team combined this month:
              </span>
              <div className="flex items-center gap-4">
                <span className="text-white text-xs font-bold">
                  <span className="text-blue-300">Leads: </span>{teamLeadsThisMonth}
                </span>
                <span className="text-white text-xs font-bold">
                  <span className="text-blue-300">Clients: </span>{teamClientsThisMonth}
                </span>
                <span className="text-white text-xs font-bold">
                  <span className="text-blue-300">Revenue: </span>{formatCurrency(teamRevenueThisMonth)}
                </span>
                <span className="text-blue-200 text-xs">{activeAgentsCount} agent{activeAgentsCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Team overview stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+{quick.leadsThisMonth ?? 0} this mo.</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{stats.totalLeads ?? 0}</div>
            <div className="text-slate-600 text-sm font-semibold">Team Leads</div>
            <div className="text-xs text-slate-400 mt-0.5">{stats.activeLeads ?? 0} active · {stats.wonDeals ?? 0} won · {stats.lostLeads ?? 0} lost</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">+{quick.clientsThisMonth ?? 0} this mo.</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{stats.activeClients ?? 0}</div>
            <div className="text-slate-600 text-sm font-semibold">Active Clients</div>
            <Link href="/dashboard/sales/clients" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1 mt-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">All time</span>
            </div>
            <div className="text-xl font-black text-slate-900 leading-tight">{formatCurrency(stats.totalRevenue ?? 0)}</div>
            <div className="text-slate-600 text-sm font-semibold">Total Revenue</div>
            <div className="text-xs text-slate-400 mt-0.5">{stats.approvedQuotations ?? 0} approved quotations</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">≤30 days</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{stats.expiringSubscriptions ?? 0}</div>
            <div className="text-slate-600 text-sm font-semibold">Expiring Subscriptions</div>
            <div className="text-xs text-slate-400 mt-0.5">Needs renewal</div>
          </div>
        </div>
      )}

      {/* ── Team headcount + Recruitment snapshot ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Active agents */}
          <Link href="/dashboard/sales/team"
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="text-3xl font-black text-slate-900">{activeAgentsCount}</div>
            <div className="text-slate-600 text-sm font-semibold">Active Agents</div>
            <div className="text-xs text-slate-400 mt-0.5">On your team</div>
          </Link>

          {/* Total applicants */}
          <Link href="/dashboard/sales/team#applicants"
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              {applicantStats && applicantStats.newThisWeek > 0 && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">+{applicantStats.newThisWeek} this wk</span>
              )}
            </div>
            <div className="text-3xl font-black text-slate-900">{applicantStats?.total ?? 0}</div>
            <div className="text-slate-600 text-sm font-semibold">My Applicants</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {applicantStats?.byStatus?.SHORTLISTED ?? 0} shortlisted · {applicantStats?.byStatus?.HIRED ?? 0} hired
            </div>
          </Link>

          {/* Recruitment link CTA */}
          <Link href="/dashboard/sales/recruitment"
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="text-lg font-black text-white">Recruit</div>
            <div className="text-blue-100 text-sm font-semibold">Team Recruitment</div>
            <div className="text-blue-200 text-xs mt-0.5">Share your link · review applicants</div>
          </Link>
        </div>
      )}

      {/* ── Quick action pills ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/dashboard/sales/tasks"
            className={`rounded-2xl p-4 border flex items-center gap-3 transition-all hover:shadow-md ${quick.overdueTasks > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${quick.overdueTasks > 0 ? 'bg-red-100' : 'bg-rose-100'}`}>
              <CheckSquare className={`w-4 h-4 ${quick.overdueTasks > 0 ? 'text-red-600' : 'text-rose-600'}`} />
            </div>
            <div>
              <div className={`text-2xl font-black leading-none ${quick.overdueTasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>{quick.todaysTasks ?? 0}</div>
              <div className="text-slate-500 text-xs font-semibold mt-0.5">Today's Tasks</div>
              {quick.overdueTasks > 0 && <div className="text-red-500 text-xs font-bold">{quick.overdueTasks} overdue</div>}
            </div>
          </Link>

          <Link href="/dashboard/sales/quotations"
            className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 leading-none">{quick.pendingQuotations ?? 0}</div>
              <div className="text-slate-500 text-xs font-semibold mt-0.5">Pending Quotes</div>
              <div className="text-slate-400 text-xs">+{quick.quotationsThisMonth ?? 0} this mo.</div>
            </div>
          </Link>

          <Link href="/dashboard/sales/leads"
            className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-700 leading-none">{quick.newLeads ?? 0}</div>
              <div className="text-slate-500 text-xs font-semibold mt-0.5">New Leads</div>
              <div className="text-slate-400 text-xs">+{quick.leadsThisMonth ?? 0} this mo.</div>
            </div>
          </Link>

          <Link href="/dashboard/sales/team"
            className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-700 leading-none">{activeAgentsCount}</div>
              <div className="text-slate-500 text-xs font-semibold mt-0.5">Active Agents</div>
              <div className="text-slate-400 text-xs">View my team</div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Per-agent performance cards ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-black text-slate-900">Agent Performance This Month</h2>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {teamPerformance.length > 0
              ? `Target per agent: ${teamPerformance[0].clientTarget} clients · ${formatCurrency(teamPerformance[0].revenueTarget)}`
              : 'Target per agent'}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : teamPerformance.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-semibold">No agents in your team yet</p>
            <p className="text-slate-400 text-sm mt-1">Assign Sales Agents to yourself via Employee Management</p>
            <Link href="/dashboard/employees" className="inline-flex items-center gap-1 mt-3 text-blue-600 text-sm font-semibold hover:underline">
              Manage Employees <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Top performer callout */}
            {topAgent && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-800">
                  Top performer this month: <strong>{topAgent.name}</strong> — {topAgent.clientsThisMonth} clients · {formatCurrency(topAgent.revenueThisMonth)}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamPerformance.map(agent => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </>
        )}
      </div>

      {/* ── Middle row: Pipeline + Monthly trend + Top sources ── */}
      {loading ? (
        <div className="grid lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-slate-100"><div className="h-4 bg-slate-200 rounded w-32 mb-4" />{[...Array(5)].map((_, j) => <div key={j} className="h-6 bg-slate-100 rounded mb-2" />)}</div>)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Lead pipeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Team Lead Pipeline</h3>
            </div>
            {statusBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_BAR[status] || 'bg-slate-400'}`} style={{ width: `${Math.round((count / maxStatus) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly leads trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Monthly Lead Trend</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Last 6 months · team leads</p>
            {monthlyLeads.length > 0 ? (
              <>
                <MiniBarChart data={monthlyLeads} />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Total: {monthlyLeads.reduce((s, d) => s + d.count, 0)} leads</span>
                  <span>Avg: {Math.round(monthlyLeads.reduce((s, d) => s + d.count, 0) / monthlyLeads.length)}/mo</span>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            )}
          </div>

          {/* Lead sources */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Lead Sources</h3>
            </div>
            {leadSources.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {leadSources.map(({ source, count }) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0 capitalize truncate">
                      {source.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.max(12, Math.round((count / maxSource) * 100))}%` }}>
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recent activity: leads + clients ── */}
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {[0,1].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-slate-100"><div className="h-4 bg-slate-200 rounded w-32 mb-4" />{[...Array(5)].map((_,j) => <div key={j} className="h-10 bg-slate-100 rounded-xl mb-2" />)}</div>)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recent team leads */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">Recent Team Leads</h3>
              </div>
              <Link href="/dashboard/sales/leads" className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center py-10 text-slate-400"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-200" /><p className="text-sm">No leads yet</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentLeads.map((lead: any) => (
                  <Link key={lead.id} href={`/dashboard/sales/leads/${lead.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">{lead.contactPerson}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[lead.status] || ''}`}>
                          {lead.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{lead.companyName || '—'} · {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(lead.createdAt)}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent team clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900">Recent Team Clients</h3>
              </div>
              <Link href="/dashboard/sales/clients" className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentClients.length === 0 ? (
              <div className="text-center py-10 text-slate-400"><Building2 className="w-8 h-8 mx-auto mb-2 text-slate-200" /><p className="text-sm">No clients yet</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentClients.map((client: any) => (
                  <div key={client.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{client.companyName}</div>
                      <div className="text-xs text-slate-400 truncate">{client.contactPerson}</div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT / DEFAULT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function AgentDashboard({ data, loading }: { data: any; loading: boolean }) {
  const stats = data?.stats ?? {}
  const quick = data?.quick ?? {}
  const target = data?.target ?? null
  const recentLeads: any[] = data?.recentLeads ?? []
  const recentClients: any[] = data?.recentClients ?? []
  const statusBreakdown: { status: string; count: number }[] = data?.statusBreakdown ?? []
  const leadSources: { source: string; count: number }[] = data?.leadSources ?? []

  const maxStatus = statusBreakdown.reduce((m, s) => Math.max(m, s.count), 1)
  const maxSource = leadSources.reduce((m, s) => Math.max(m, s.count), 1)
  const alp = target ? pct(target.leadsThisMonth, target.leadTarget) : 0
  const cp = target ? pct(target.clientsThisMonth, target.clientTarget) : 0
  const rp = target ? pct(target.revenueThisMonth, target.revenueTarget) : 0

  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Sales Dashboard</h1>
          <p className="text-slate-500 text-sm">{today}</p>
        </div>
        <Link href="/dashboard/sales/leads" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <UserPlus className="w-4 h-4" /> Manage Leads
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <div className="text-3xl font-black text-slate-900">{stats.totalLeads ?? 0}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">My Leads</div>
            <Link href="/dashboard/sales/leads" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3"><Trophy className="w-5 h-5 text-green-600" /></div>
            <div className="text-3xl font-black text-slate-900">{stats.wonDeals ?? 0}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Won Deals</div>
            <p className="text-slate-400 text-xs mt-1">Converted leads</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3"><Users className="w-5 h-5 text-purple-600" /></div>
            <div className="text-3xl font-black text-slate-900">{stats.activeClients ?? 0}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">My Clients</div>
            <Link href="/dashboard/sales/clients" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div className="text-3xl font-black text-slate-900">{stats.expiringSubscriptions ?? 0}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Expiring Subs</div>
            <p className="text-slate-400 text-xs mt-1">Within 30 days</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/dashboard/sales/tasks" className={`rounded-2xl p-4 border flex flex-col hover:shadow-md transition-all ${quick.overdueTasks > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center"><CheckSquare className="w-4 h-4 text-rose-600" /></div>
              {quick.overdueTasks > 0 && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{quick.overdueTasks} overdue</span>}
            </div>
            <div className={`text-2xl font-black ${quick.overdueTasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>{quick.todaysTasks ?? 0}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">Today's Tasks</div>
          </Link>
          <Link href="/dashboard/sales/quotations" className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col hover:shadow-md transition-all">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2"><FileText className="w-4 h-4 text-amber-600" /></div>
            <div className="text-2xl font-black text-amber-700">{quick.pendingQuotations ?? 0}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">Pending Quotes</div>
          </Link>
          <Link href="/dashboard/sales/leads" className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col hover:shadow-md transition-all">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2"><UserPlus className="w-4 h-4 text-blue-600" /></div>
            <div className="text-2xl font-black text-blue-700">{quick.newLeads ?? 0}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">New Leads</div>
          </Link>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2"><DollarSign className="w-4 h-4 text-green-600" /></div>
            <div className="text-lg font-black text-green-700 leading-tight">{formatCurrency(stats.totalRevenue ?? 0)}</div>
            <div className="text-slate-600 text-xs font-semibold mt-0.5">My Revenue</div>
          </div>
        </div>
      )}

      {/* Personal monthly target */}
      {!loading && target && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-lg">My Monthly Target</h3>
            {alp >= 100 && cp >= 100 && rp >= 100 && (
              <span className="ml-1 text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full border border-green-500/30 font-bold">🎉 ALL MET!</span>
            )}
            <span className="ml-auto text-xs text-blue-300 font-medium">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Leads */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Leads</span>
                <span className="text-white font-black text-lg">{target.leadsThisMonth} / {target.leadTarget}</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${alp >= 100 ? 'bg-green-400' : alp >= 60 ? 'bg-indigo-300' : 'bg-amber-300'}`} style={{ width: `${alp}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-blue-200">
                <span>{alp >= 100 ? '✅ Done!' : `${target.leadTarget - target.leadsThisMonth} to go`}</span>
                <span className="font-bold">{alp}%</span>
              </div>
            </div>
            {/* Clients */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-semibold flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Clients</span>
                <span className="text-white font-black text-lg">{target.clientsThisMonth} / {target.clientTarget}</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cp >= 100 ? 'bg-green-400' : cp >= 60 ? 'bg-blue-300' : 'bg-amber-300'}`} style={{ width: `${cp}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-blue-200">
                <span>{cp >= 100 ? '✅ Done!' : `${target.clientTarget - target.clientsThisMonth} to go`}</span>
                <span className="font-bold">{cp}%</span>
              </div>
            </div>
            {/* Revenue */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-semibold flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Revenue</span>
                <span className="text-white font-black text-base">{formatCurrency(target.revenueThisMonth)}</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${rp >= 100 ? 'bg-green-400' : rp >= 60 ? 'bg-emerald-300' : 'bg-amber-300'}`} style={{ width: `${rp}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-blue-200">
                <span>Target: {formatCurrency(target.revenueTarget)}</span>
                <span className="font-bold">{rp}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads table + pipeline */}
      {loading ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 animate-pulse border border-slate-100"><div className="h-5 bg-slate-200 rounded w-40 mb-5" />{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />)}</div>
          <div className="bg-white rounded-2xl p-6 animate-pulse border border-slate-100"><div className="h-5 bg-slate-200 rounded w-40 mb-5" />{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-xl mb-3" />)}</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Leads</h3>
              <Link href="/dashboard/sales/leads" className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p className="text-sm font-medium">No leads yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>{['Lead #', 'Contact', 'Company', 'Status', 'Priority', 'Assigned', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><Link href={`/dashboard/sales/leads/${lead.id}`} className="font-mono text-xs text-blue-600 font-semibold">#{lead.leadNumber || lead.id?.slice(-6).toUpperCase()}</Link></td>
                        <td className="px-4 py-3 whitespace-nowrap"><div className="font-semibold text-slate-900 text-xs">{lead.contactPerson}</div><div className="text-slate-400 text-xs">{lead.email}</div></td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{lead.companyName || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[lead.status] || ''}`}>{lead.status?.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[lead.priority] || ''}`}>{lead.priority}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Lead Pipeline</h3>
            {statusBreakdown.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No data</p> : (
              <div className="space-y-3">
                {statusBreakdown.map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-slate-600">{status.replace(/_/g, ' ')}</span><span className="text-xs font-bold text-slate-900">{count}</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${STATUS_BAR[status] || 'bg-slate-400'}`} style={{ width: `${Math.round((count / maxStatus) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources + recent clients */}
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">{[0,1].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-slate-100"><div className="h-5 bg-slate-200 rounded w-40 mb-5" />{[...Array(5)].map((_,j) => <div key={j} className="h-10 bg-slate-100 rounded-xl mb-2" />)}</div>)}</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Lead Sources</h3>
            {leadSources.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No data</p> : (
              <div className="space-y-2.5">
                {leadSources.map(({ source, count }) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0 capitalize">{source.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.max(10, Math.round((count / maxSource) * 100))}%` }}>
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Clients</h3>
              <Link href="/dashboard/sales/clients" className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {recentClients.length === 0 ? (
              <div className="text-center py-8 text-slate-400"><Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p className="text-sm font-medium">No clients yet</p></div>
            ) : (
              <div className="space-y-2.5">
                {recentClients.slice(0, 5).map((client: any) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-purple-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{client.companyName}</div>
                      <div className="text-slate-400 text-xs truncate">{client.contactPerson} · {client.phone || client.email || '—'}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${CLIENT_CATEGORY_COLORS[client.category] || 'bg-slate-100 text-slate-600'}`}>{client.category}</span>
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

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — picks the right dashboard based on role
// ═══════════════════════════════════════════════════════════════════════════════
export default function SalesDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/sales/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const role = data?.role ?? (session?.user as any)?.role ?? ''
  const isManager = role === 'SALES_MANAGER'

  return isManager
    ? <ManagerDashboard data={data} loading={loading} />
    : <AgentDashboard data={data} loading={loading} />
}
