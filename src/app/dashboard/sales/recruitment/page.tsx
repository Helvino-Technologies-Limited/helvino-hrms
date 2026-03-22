'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Link2, Copy, RefreshCw, Users, Eye, CheckCircle, Clock, XCircle, UserCheck, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

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

const ALL_STATUSES = ['NEW','UNDER_REVIEW','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','OFFERED','HIRED','REJECTED']

export default function SalesRecruitmentPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [link, setLink] = useState<any>(null)
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function loadAll() {
    setLoading(true)
    try {
      const [linkRes, appRes] = await Promise.all([
        fetch('/api/sales/recruitment-link'),
        fetch(`/api/sales/applicants${statusFilter ? `?status=${statusFilter}` : ''}${search ? `${statusFilter ? '&' : '?'}search=${encodeURIComponent(search)}` : ''}`),
      ])
      const [linkData, appData] = await Promise.all([linkRes.json(), appRes.json()])
      if (!linkRes.ok) toast.error('Could not load recruitment link')
      else setLink(linkData)
      setApplicants(Array.isArray(appData) ? appData : [])
    } catch {
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [statusFilter, search])

  async function copyLink() {
    if (!link) return
    const url = `${baseUrl}/apply/sales/${link.token}`
    await navigator.clipboard.writeText(url)
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLink(data)
      toast.success('New link generated')
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLink(data)
      toast.success(data.isActive ? 'Link activated' : 'Link deactivated')
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus(id)
    try {
      const res = await fetch(`/api/sales/applicants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      setApplicants(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
    setUpdatingStatus(null)
  }

  async function updateScore(id: string, score: number) {
    try {
      await fetch(`/api/sales/applicants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      setApplicants(prev => prev.map(a => a.id === id ? { ...a, score } : a))
    } catch { /* silent */ }
  }

  const isAdmin = ['SUPER_ADMIN', 'HR_MANAGER'].includes(role)
  const recruitLink = link ? `${baseUrl}/apply/sales/${link.token}` : ''

  const stats = {
    total: applicants.length,
    new: applicants.filter(a => a.status === 'NEW').length,
    shortlisted: applicants.filter(a => a.status === 'SHORTLISTED').length,
    hired: applicants.filter(a => a.status === 'HIRED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Sales Team Recruitment</h1>
        <p className="text-slate-500 text-sm">Manage your recruitment link and review applicants</p>
      </div>

      {/* Recruitment Link Card */}
      {!isAdmin && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-200" />
              <span className="font-bold">Your Recruitment Link</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleLink} disabled={saving}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60">
                {link?.isActive
                  ? <><ToggleRight className="w-4 h-4 text-green-300" /><span className="text-green-200 text-xs font-semibold">Active</span></>
                  : <><ToggleLeft className="w-4 h-4 text-red-300" /><span className="text-red-200 text-xs font-semibold">Inactive</span></>
                }
              </button>
            </div>
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
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <button onClick={regenerateToken} disabled={saving}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> New Link
            </button>
          </div>
          <p className="text-blue-200 text-xs mt-3">Share this link with candidates. Applicants who use this link appear only in your recruitement board.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Applicants', value: stats.total, color: 'blue' },
          { label: 'New', value: stats.new, color: 'indigo' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'purple' },
          { label: 'Hired', value: stats.hired, color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-3xl font-black text-slate-900">{value}</div>
            <div className="text-sm font-semibold text-slate-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search applicants..."
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Applicants {applicants.length > 0 && `(${applicants.length})`}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-medium">No applicants yet</p>
            <p className="text-xs mt-1">Share your recruitment link to start receiving applications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {applicants.map(applicant => (
              <div key={applicant.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                      {applicant.firstName[0]}{applicant.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{applicant.firstName} {applicant.lastName}</div>
                      <div className="text-slate-400 text-xs truncate">{applicant.email} {applicant.phone ? `· ${applicant.phone}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Score */}
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => updateScore(applicant.id, s)}
                          className={`w-5 h-5 rounded-full text-xs transition-colors ${
                            (applicant.score || 0) >= s ? 'text-amber-500' : 'text-slate-200'
                          }`}>
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[applicant.status] || 'bg-slate-100 text-slate-600'}`}>
                      {applicant.status?.replace(/_/g,' ')}
                    </span>
                    {isAdmin && applicant.salesManager && (
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        {applicant.salesManager.firstName} {applicant.salesManager.lastName}
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">{formatDate(applicant.createdAt)}</span>
                    <button onClick={() => setExpanded(expanded === applicant.id ? null : applicant.id)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                      {expanded === applicant.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded === applicant.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Details</h4>
                      {[
                        { label: 'Current Company', value: applicant.currentCompany },
                        { label: 'Experience', value: applicant.experienceYears ? `${applicant.experienceYears} years` : null },
                        { label: 'Education', value: applicant.educationLevel },
                        { label: 'Expected Salary', value: applicant.expectedSalary ? `KES ${applicant.expectedSalary.toLocaleString()}` : null },
                        { label: 'LinkedIn', value: applicant.linkedIn },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="flex gap-2 text-sm">
                          <span className="text-slate-500 w-32 flex-shrink-0">{label}:</span>
                          <span className="text-slate-900 font-medium">{value}</span>
                        </div>
                      ) : null)}
                      {applicant.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {applicant.skills.map((s: string) => (
                            <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {applicant.coverLetter && (
                        <>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cover Letter</h4>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{applicant.coverLetter}</p>
                        </>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map(s => (
                          <button key={s} onClick={() => updateStatus(applicant.id, s)}
                            disabled={updatingStatus === applicant.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                              applicant.status === s
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                            }`}>
                            {s.replace(/_/g,' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
