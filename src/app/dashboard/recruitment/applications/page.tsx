'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Users, ChevronDown, ExternalLink, Star,
  Filter, Check, X, Layers, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  { key: 'ALL',                 label: 'All' },
  { key: 'NEW',                 label: 'Applied' },
  { key: 'UNDER_REVIEW',        label: 'Under Review' },
  { key: 'SHORTLISTED',         label: 'Shortlisted' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { key: 'INTERVIEWED',         label: 'Interviewed' },
  { key: 'OFFERED',             label: 'Offered' },
  { key: 'HIRED',               label: 'Hired' },
  { key: 'REJECTED',            label: 'Rejected' },
]

const STATUS_BADGE: Record<string, string> = {
  NEW:                 'bg-blue-100 text-blue-700 border-blue-200',
  UNDER_REVIEW:        'bg-purple-100 text-purple-700 border-purple-200',
  SHORTLISTED:         'bg-indigo-100 text-indigo-700 border-indigo-200',
  INTERVIEW_SCHEDULED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  INTERVIEWED:         'bg-orange-100 text-orange-700 border-orange-200',
  OFFERED:             'bg-green-100 text-green-700 border-green-200',
  HIRED:               'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED:            'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<string, string> = {
  NEW:                 'Applied',
  UNDER_REVIEW:        'Under Review',
  SHORTLISTED:         'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWED:         'Interviewed',
  OFFERED:             'Offered',
  HIRED:               'Hired',
  REJECTED:            'Rejected',
}

const AVATAR_COLORS = [
  'bg-blue-600','bg-purple-600','bg-indigo-600','bg-rose-600',
  'bg-teal-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const TALENT_POOL_CATEGORIES = [
  { value: 'FUTURE_PROSPECT',  label: 'Future Prospect' },
  { value: 'SENIOR_TALENT',    label: 'Senior Talent' },
  { value: 'INTERN_CANDIDATES',label: 'Intern Candidates' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Talent pool modal
  const [talentPoolTarget, setTalentPoolTarget] = useState<any>(null)
  const [talentPoolCategory, setTalentPoolCategory] = useState('FUTURE_PROSPECT')
  const [talentPoolLoading, setTalentPoolLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [ar, jr] = await Promise.all([
        fetch('/api/recruitment/applications'),
        fetch('/api/recruitment/jobs'),
      ])
      const [a, j] = await Promise.all([ar.json(), jr.json()])
      setApplications(Array.isArray(a) ? a : [])
      setJobs(Array.isArray(j) ? j : [])
    } catch {
      toast.error('Failed to load applications')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // ─── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return applications.filter(app => {
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false
      if (jobFilter && app.job?.id !== jobFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const full = `${app.firstName} ${app.lastName} ${app.email}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      return true
    })
  }, [applications, statusFilter, jobFilter, search])

  // ─── Status distribution ────────────────────────────────────────────────────
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {}
    applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return counts
  }, [applications])

  // ─── Inline status update ───────────────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/recruitment/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Update failed'); return }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  // ─── Bulk update ────────────────────────────────────────────────────────────
  async function handleBulkUpdate() {
    if (!bulkStatus || selected.size === 0) return
    setBulkLoading(true)
    try {
      await Promise.all(
        Array.from(selected).map(id =>
          fetch(`/api/recruitment/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      )
      toast.success(`${selected.size} applicant${selected.size > 1 ? 's' : ''} updated to ${STATUS_LABEL[bulkStatus] || bulkStatus}`)
      setSelected(new Set())
      setBulkStatus('')
      loadData()
    } catch {
      toast.error('Bulk update failed')
    }
    setBulkLoading(false)
  }

  // ─── Talent pool ─────────────────────────────────────────────────────────────
  async function addToTalentPool() {
    if (!talentPoolTarget) return
    setTalentPoolLoading(true)
    const res = await fetch(`/api/recruitment/applications/${talentPoolTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ talentPool: talentPoolCategory }),
    })
    if (!res.ok) { toast.error('Failed to add to talent pool'); setTalentPoolLoading(false); return }
    toast.success('Added to talent pool!')
    setTalentPoolTarget(null)
    setTalentPoolLoading(false)
    loadData()
  }

  // ─── Selection helpers ───────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(a => a.id)))
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{applications.length} total applicants</p>
        </div>
        {/* Status distribution badges */}
        <div className="flex flex-wrap gap-1.5">
          {['NEW','SHORTLISTED','INTERVIEW_SCHEDULED','OFFERED','HIRED'].map(s => (
            distribution[s] ? (
              <span key={s}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer transition-opacity ${STATUS_BADGE[s]} ${statusFilter === s ? 'opacity-100 ring-2 ring-offset-1 ring-current' : 'opacity-80 hover:opacity-100'}`}
                onClick={() => setStatusFilter(prev => prev === s ? 'ALL' : s)}>
                {STATUS_LABEL[s]} · {distribution[s]}
              </span>
            ) : null
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Job filter */}
          <div className="relative">
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-36">
              <option value="">All Positions</option>
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Clear filters */}
          {(search || jobFilter || statusFilter !== 'ALL') && (
            <button onClick={() => { setSearch(''); setJobFilter(''); setStatusFilter('ALL') }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" />Clear
            </button>
          )}

          <span className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {ALL_STATUSES.map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                statusFilter === s.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}>
              {s.label}
              {s.key !== 'ALL' && distribution[s.key] ? ` (${distribution[s.key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{selected.size}</span>
            </div>
            <span className="text-sm font-semibold text-blue-800">
              {selected.size} applicant{selected.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Change status to...</option>
              {ALL_STATUSES.filter(s => s.key !== 'ALL').map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <button onClick={handleBulkUpdate} disabled={!bulkStatus || bulkLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors">
              {bulkLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Apply
            </button>
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl font-medium">
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">No applications found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                  </th>
                  {['Candidate','Position','Applied','Experience','Status','Score','Source','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app: any) => {
                  const initials = `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase()
                  const color = avatarColor(`${app.firstName}${app.lastName}`)
                  const isSelected = selected.has(app.id)

                  return (
                    <tr key={app.id}
                      className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 w-10">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(app.id)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                      </td>

                      {/* Candidate */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[140px]">{app.firstName} {app.lastName}</p>
                            <p className="text-slate-400 text-xs truncate max-w-[140px]">{app.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        {app.job ? (
                          <Link href={`/dashboard/recruitment/jobs/${app.job.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 max-w-[160px] truncate">
                            {app.job.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Applied */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(app.createdAt)}</td>

                      {/* Experience */}
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {app.experienceYears != null ? `${app.experienceYears} yr${app.experienceYears !== 1 ? 's' : ''}` : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer ${STATUS_BADGE[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {ALL_STATUSES.filter(s => s.key !== 'ALL').map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5">
                        {app.score != null ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                            <span className="text-xs font-bold text-amber-600">{app.score}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        {app.source ? (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{app.source}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {app.job && (
                            <Link href={`/dashboard/recruitment/jobs/${app.job.id}`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View in pipeline">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => { setTalentPoolTarget(app); setTalentPoolCategory('FUTURE_PROSPECT') }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Add to talent pool">
                            <Layers className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Talent Pool Modal */}
      {talentPoolTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Add to Talent Pool</h2>
              <button onClick={() => setTalentPoolTarget(null)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${avatarColor(`${talentPoolTarget.firstName}${talentPoolTarget.lastName}`)} flex items-center justify-center text-white text-xs font-bold`}>
                  {talentPoolTarget.firstName?.[0]}{talentPoolTarget.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{talentPoolTarget.firstName} {talentPoolTarget.lastName}</p>
                  <p className="text-xs text-slate-400">{talentPoolTarget.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Pool Category</label>
                <div className="space-y-2">
                  {TALENT_POOL_CATEGORIES.map(cat => (
                    <label key={cat.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        talentPoolCategory === cat.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <input type="radio" name="poolCat" value={cat.value} checked={talentPoolCategory === cat.value}
                        onChange={() => setTalentPoolCategory(cat.value)}
                        className="accent-blue-600" />
                      <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setTalentPoolTarget(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">
                Cancel
              </button>
              <button onClick={addToTalentPool} disabled={talentPoolLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                {talentPoolLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Layers className="w-4 h-4" />}
                Add to Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
