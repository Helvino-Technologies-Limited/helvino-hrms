'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Users, UserPlus, Building2, DollarSign, TrendingUp, Star,
  Clock, CheckCircle, XCircle, Eye, RefreshCw, Copy,
  Link2, ToggleRight, ToggleLeft, ArrowRight, Briefcase,
  Phone, Mail, CalendarDays, Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  SHORTLISTED: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700',
  INTERVIEWED: 'bg-cyan-100 text-cyan-700',
  OFFERED: 'bg-orange-100 text-orange-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_ORDER = ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED']

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500']

function pct(v: number, t: number) { return t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0 }

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export default function SalesTeamPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [data, setData] = useState<any>(null)
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'agents' | 'applicants'>('agents')
  const [statusFilter, setStatusFilter] = useState('')
  const [saving, setSaving] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function load() {
    setLoading(true)
    try {
      const [teamRes, linkRes] = await Promise.all([
        fetch('/api/sales/team'),
        fetch('/api/sales/recruitment-link'),
      ])
      const [teamData, linkData] = await Promise.all([teamRes.json(), linkRes.json()])
      if (teamRes.ok) setData(teamData)
      if (linkRes.ok) setLink(linkData)
    } catch {
      toast.error('Failed to load team data')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(`${baseUrl}/apply/sales/${link.token}`)
    toast.success('Recruitment link copied!')
  }

  async function regenerateToken() {
    setSaving(true)
    try {
      const res = await fetch('/api/sales/recruitment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setLink(d)
      toast.success('New recruitment link generated')
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function toggleLink() {
    setSaving(true)
    try {
      const res = await fetch('/api/sales/recruitment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setLink(d)
      toast.success(d.isActive ? 'Link activated' : 'Link deactivated')
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const team: any[] = data?.team ?? []
  const applicants: any[] = data?.applicants ?? []
  const applicantStats = data?.applicantStats ?? { total: 0, newThisWeek: 0, byStatus: {} }

  const filteredApplicants = statusFilter
    ? applicants.filter(a => a.status === statusFilter)
    : applicants

  const activeAgents = team.filter(a => a.employmentStatus === 'ACTIVE')
  const recruitLink = link ? `${baseUrl}/apply/sales/${link.token}` : ''

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">Active sales agents and recruitment pipeline under you</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sales/recruitment"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
            <UserPlus className="w-4 h-4" /> Manage Applicants
          </Link>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{loading ? '—' : activeAgents.length}</div>
          <div className="text-slate-600 text-sm font-semibold">Active Agents</div>
          <div className="text-xs text-slate-400 mt-0.5">{team.length} total on team</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
            <UserPlus className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{loading ? '—' : applicantStats.total}</div>
          <div className="text-slate-600 text-sm font-semibold">Total Applicants</div>
          <div className="text-xs text-indigo-600 font-medium mt-0.5">+{applicantStats.newThisWeek} this week</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{loading ? '—' : (applicantStats.byStatus['SHORTLISTED'] ?? 0)}</div>
          <div className="text-slate-600 text-sm font-semibold">Shortlisted</div>
          <div className="text-xs text-slate-400 mt-0.5">{applicantStats.byStatus['INTERVIEW_SCHEDULED'] ?? 0} interview scheduled</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{loading ? '—' : (applicantStats.byStatus['HIRED'] ?? 0)}</div>
          <div className="text-slate-600 text-sm font-semibold">Hired</div>
          <div className="text-xs text-slate-400 mt-0.5">{applicantStats.byStatus['OFFERED'] ?? 0} offer pending</div>
        </div>
      </div>

      {/* Recruitment link card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-200" />
            <span className="font-bold">Your Recruitment Link</span>
          </div>
          <button onClick={toggleLink} disabled={saving}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60">
            {link?.isActive
              ? <><ToggleRight className="w-4 h-4 text-green-300" /><span className="text-green-200 text-xs font-semibold">Active</span></>
              : <><ToggleLeft className="w-4 h-4 text-red-300" /><span className="text-red-200 text-xs font-semibold">Inactive</span></>
            }
          </button>
        </div>
        {link ? (
          <div className="bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-3">
            <span className="text-blue-100 text-sm font-mono flex-1 truncate">{recruitLink}</span>
            <button onClick={copyLink} className="flex-shrink-0 bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl px-4 py-2.5 text-blue-200 text-sm mb-3">Loading link...</div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={copyLink} disabled={!link}
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            <Copy className="w-4 h-4" /> Copy & Share
          </button>
          <button onClick={regenerateToken} disabled={saving}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> New Link
          </button>
        </div>
        <p className="text-blue-200 text-xs mt-3">Share on LinkedIn, WhatsApp, or anywhere. Applicants go straight into your pipeline.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('agents')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'agents' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Active Agents ({activeAgents.length})</span>
        </button>
        <button onClick={() => setTab('applicants')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'applicants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Applicants ({applicantStats.total})</span>
        </button>
      </div>

      {/* Agents tab */}
      {tab === 'agents' && (
        <div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : team.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-600 font-semibold">No agents assigned to you yet</p>
              <p className="text-slate-400 text-sm mt-1">Ask HR to assign Sales Agents to your profile via Employee Management</p>
              <Link href="/dashboard/employees" className="inline-flex items-center gap-1 mt-3 text-blue-600 text-sm font-semibold hover:underline">
                Go to Employees <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((agent, idx) => {
                const cp = pct(agent.clientsThisMonth, 5)
                const rp = pct(agent.revenueThisMonth, 250000)
                const overall = Math.round((cp + rp) / 2)
                const statusLabel = overall >= 80 ? 'On Track' : overall >= 40 ? 'In Progress' : 'Needs Attention'
                const statusColor = overall >= 80 ? 'bg-green-100 text-green-700' : overall >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                const isActive = agent.employmentStatus === 'ACTIVE'

                return (
                  <div key={agent.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${avatarColor}`}>
                          {initials(agent.firstName, agent.lastName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{agent.firstName} {agent.lastName}</div>
                          <div className="text-slate-400 text-xs">{agent.jobTitle || 'Sales Agent'}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isActive ? 'Active' : agent.employmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 mb-4">
                      {agent.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {agent.phone}
                        </div>
                      )}
                      {agent.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="w-3 h-3" /> <span className="truncate">{agent.email}</span>
                        </div>
                      )}
                      {agent.dateHired && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays className="w-3 h-3" /> Joined {formatDate(agent.dateHired)}
                        </div>
                      )}
                    </div>

                    {/* Monthly performance */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{monthName}</div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Clients</span>
                          <span className="text-xs font-bold text-slate-800">{agent.clientsThisMonth} / 5</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cp >= 100 ? 'bg-green-500' : cp >= 60 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${cp}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Revenue</span>
                          <span className="text-xs font-bold text-slate-800">{formatCurrency(agent.revenueThisMonth)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rp >= 100 ? 'bg-green-500' : rp >= 60 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${rp}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{agent.totalLeads} leads · {agent.totalClients} clients (all time)</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Applicants tab */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {/* Status pipeline summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> Recruitment Pipeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATUS_ORDER.filter(s => !['INTERVIEW_SCHEDULED','INTERVIEWED','OFFERED'].includes(s)).map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`rounded-xl p-3 text-left border-2 transition-all ${statusFilter === s ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="text-2xl font-black text-slate-900">{applicantStats.byStatus[s] ?? 0}</div>
                  <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full w-fit ${STATUS_COLORS[s] || 'bg-slate-100 text-slate-600'}`}>
                    {s.replace(/_/g,' ')}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['UNDER_REVIEW','INTERVIEW_SCHEDULED','INTERVIEWED','OFFERED'].map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]?.replace('text-','bg-').split(' ')[0] || 'bg-slate-400'}`} />
                  {s.replace(/_/g,' ')} ({applicantStats.byStatus[s] ?? 0})
                </button>
              ))}
              {statusFilter && (
                <button onClick={() => setStatusFilter('')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  Clear filter ×
                </button>
              )}
            </div>
          </div>

          {/* Applicants list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {statusFilter ? `${statusFilter.replace(/_/g,' ')} Applicants` : 'All Applicants'}
                {filteredApplicants.length > 0 && <span className="text-slate-400 font-normal ml-1">({filteredApplicants.length})</span>}
              </h3>
              <Link href="/dashboard/sales/recruitment" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                Full view <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <UserPlus className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No applicants{statusFilter ? ` with status ${statusFilter.replace(/_/g,' ')}` : ' yet'}</p>
                {!statusFilter && <p className="text-xs mt-1">Share your recruitment link to receive applications</p>}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredApplicants.map((a: any) => (
                  <div key={a.id} className="px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                      {initials(a.firstName, a.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{a.firstName} {a.lastName}</div>
                      <div className="text-slate-400 text-xs truncate">
                        {a.email}
                        {a.currentCompany ? ` · ${a.currentCompany}` : ''}
                        {a.experienceYears ? ` · ${a.experienceYears}yr exp` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.score > 0 && (
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${(a.score ?? 0) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                          ))}
                        </div>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                        {a.status?.replace(/_/g,' ')}
                      </span>
                      <span className="text-slate-400 text-xs">{formatDate(a.createdAt)}</span>
                    </div>
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
