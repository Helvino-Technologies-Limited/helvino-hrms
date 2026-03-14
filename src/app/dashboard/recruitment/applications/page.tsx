'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Search, Users, ChevronDown, ExternalLink, Star,
  Filter, Check, X, Layers, Eye,
  Mail, Send, Sparkles, Loader2, RefreshCw,
  CalendarCheck, FileText, UserX, ChevronRight, PenLine,
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

// ─── Email action types ───────────────────────────────────────────────────────
const EMAIL_TYPES = [
  {
    key: 'INTERVIEW_INVITE',
    label: 'Interview Invitation',
    icon: CalendarCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    aiType: 'INTERVIEW_INVITE',
    description: 'Invite the candidate for an interview',
  },
  {
    key: 'ONBOARDING_REQUEST',
    label: 'Request Onboarding Docs',
    icon: FileText,
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100 border-green-200',
    aiType: 'ONBOARDING_REQUEST',
    description: 'Ask candidate to submit onboarding documents',
  },
  {
    key: 'REJECTION',
    label: 'Send Rejection',
    icon: UserX,
    color: 'text-red-500',
    bg: 'bg-red-50 hover:bg-red-100 border-red-200',
    aiType: null, // chosen dynamically
    description: 'Notify candidate they were not selected',
  },
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

  // Email modal
  const [emailTarget, setEmailTarget] = useState<any>(null)
  const [emailType, setEmailType] = useState<string | null>(null)
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const [interviewDetails, setInterviewDetails] = useState({
    date: '', time: '', format: 'Physical', location: '', meetingLink: '',
    interviewerName: '', deadline: '',
  })
  const [rejectionStage, setRejectionStage] = useState<'BEFORE' | 'AFTER'>('BEFORE')
  const [offerLetterContent, setOfferLetterContent] = useState('')
  const [offerLetterGenerating, setOfferLetterGenerating] = useState(false)
  const offerAbortRef = useRef<AbortController | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  // ─── Email helpers ────────────────────────────────────────────────────────────
  function openEmail(app: any, type: string) {
    setEmailTarget(app)
    setEmailType(type)
    setEmailBody('')
    setAiContext('')
    setOfferLetterContent('')
    setInterviewDetails({ date: '', time: '', format: 'Physical', location: '', meetingLink: '', interviewerName: '', deadline: '' })
    setRejectionStage(app.interviews?.length > 0 ? 'AFTER' : 'BEFORE')
  }

  function closeEmail() {
    abortRef.current?.abort()
    offerAbortRef.current?.abort()
    setEmailTarget(null)
    setEmailType(null)
    setEmailBody('')
    setOfferLetterContent('')
    setAiGenerating(false)
    setOfferLetterGenerating(false)
  }

  async function generateOfferLetter() {
    if (!emailTarget) return
    setOfferLetterGenerating(true)
    setOfferLetterContent('')
    offerAbortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: offerAbortRef.current.signal,
        body: JSON.stringify({
          type: 'OFFER_LETTER',
          candidateName: `${emailTarget.firstName} ${emailTarget.lastName}`,
          jobTitle: emailTarget.job?.title || 'the position',
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Failed to generate offer letter')
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOfferLetterContent(prev => prev + decoder.decode(value))
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setOfferLetterContent('[Error: ' + (e.message || 'Failed to generate offer letter') + ']')
    }
    setOfferLetterGenerating(false)
  }

  async function generateAI() {
    if (!emailTarget || !emailType) return
    setAiGenerating(true)
    setEmailBody('')
    abortRef.current = new AbortController()

    const aiType = emailType === 'REJECTION'
      ? (rejectionStage === 'AFTER' ? 'REJECTION_AFTER_INTERVIEW' : 'REJECTION_BEFORE_INTERVIEW')
      : emailType

    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: aiType,
          candidateName: `${emailTarget.firstName} ${emailTarget.lastName}`,
          jobTitle: emailTarget.job?.title || 'the position',
          context: aiContext || undefined,
        }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        if (res.status === 503) throw new Error('AI not configured. Please add your ANTHROPIC_API_KEY.')
        throw new Error(await res.text())
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setEmailBody(full)
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Failed to generate email')
    } finally {
      setAiGenerating(false)
    }
  }

  async function sendEmailNow() {
    if (!emailTarget || !emailType || !emailBody.trim()) {
      toast.error('Please write an email body first')
      return
    }
    setEmailSending(true)
    try {
      const res = await fetch('/api/recruitment/applications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: emailTarget.id,
          type: emailType,
          emailBody,
          interviewDetails: emailType === 'INTERVIEW_INVITE' || emailType === 'ONBOARDING_REQUEST' ? interviewDetails : undefined,
          offerLetterContent: emailType === 'ONBOARDING_REQUEST' ? offerLetterContent : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      toast.success(`Email sent to ${data.sentTo}`)
      if (emailType === 'REJECTION') {
        setApplications(prev => prev.map(a => a.id === emailTarget.id ? { ...a, status: 'REJECTED' } : a))
      }
      // Refresh to get updated sentAt timestamps
      loadData()
      closeEmail()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email')
    }
    setEmailSending(false)
  }

  const emailTypeDef = EMAIL_TYPES.find(t => t.key === emailType)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{applications.length} total applicants</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/recruitment/onboarding"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <FileText className="w-4 h-4" />
            Onboarding Docs
          </Link>
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-center">
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
          <div className="relative">
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-36">
              <option value="">All Positions</option>
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {(search || jobFilter || statusFilter !== 'ALL') && (
            <button onClick={() => { setSearch(''); setJobFilter(''); setStatusFilter('ALL') }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" />Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {ALL_STATUSES.map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                statusFilter === s.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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
                  {['Candidate','Position','Applied','Experience','Status','Score','Source','Emails','Actions'].map(h => (
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

                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(app.createdAt)}</td>

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

                      {/* Emails sent indicators */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {app.interviewInviteSentAt && (
                            <span title={`Interview invite sent ${formatDate(app.interviewInviteSentAt)}`}
                              className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                              <CalendarCheck className="w-3 h-3" />
                            </span>
                          )}
                          {app.onboardingRequestSentAt && (
                            <span title={`Onboarding request sent ${formatDate(app.onboardingRequestSentAt)}`}
                              className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <FileText className="w-3 h-3" />
                            </span>
                          )}
                          {app.rejectionEmailSentAt && (
                            <span title={`Rejection sent ${formatDate(app.rejectionEmailSentAt)}`}
                              className="w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                              <UserX className="w-3 h-3" />
                            </span>
                          )}
                          {!app.interviewInviteSentAt && !app.onboardingRequestSentAt && !app.rejectionEmailSentAt && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* Email button */}
                          <div className="relative group">
                            <button
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Send email">
                              <Mail className="w-4 h-4" />
                            </button>
                            {/* Email dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1.5">
                              {EMAIL_TYPES.map(et => (
                                <button key={et.key}
                                  onClick={() => openEmail(app, et.key)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors">
                                  <et.icon className={`w-4 h-4 ${et.color} flex-shrink-0`} />
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{et.label}</p>
                                    <p className="text-xs text-slate-400">{et.description}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

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

      {/* ─── Email Compose Modal ──────────────────────────────────────────────── */}
      {emailTarget && emailType && emailTypeDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${emailTypeDef.bg}`}>
                  <emailTypeDef.icon className={`w-4 h-4 ${emailTypeDef.color}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{emailTypeDef.label}</h2>
                  <p className="text-xs text-slate-500">
                    To: <strong>{emailTarget.firstName} {emailTarget.lastName}</strong> &lt;{emailTarget.email}&gt;
                    {emailTarget.job && <span> · {emailTarget.job.title}</span>}
                  </p>
                </div>
              </div>
              <button onClick={closeEmail} className="text-slate-400 hover:text-slate-600 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Rejection stage selector */}
              {emailType === 'REJECTION' && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Rejection Stage</p>
                  <div className="flex gap-2">
                    {[
                      { key: 'BEFORE', label: 'Before Interview', sub: 'Application not shortlisted' },
                      { key: 'AFTER', label: 'After Interview', sub: 'Interviewed but not selected' },
                    ].map(opt => (
                      <label key={opt.key}
                        className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${rejectionStage === opt.key ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <input type="radio" name="rejStage" value={opt.key}
                          checked={rejectionStage === opt.key as 'BEFORE' | 'AFTER'}
                          onChange={() => setRejectionStage(opt.key as 'BEFORE' | 'AFTER')}
                          className="sr-only" />
                        <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview details for interview invite */}
              {emailType === 'INTERVIEW_INVITE' && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Interview Details <span className="font-normal text-blue-500">(optional — shown in email)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                      <input type="date" value={interviewDetails.date}
                        onChange={e => setInterviewDetails(p => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Time (EAT)</label>
                      <input type="time" value={interviewDetails.time}
                        onChange={e => setInterviewDetails(p => ({ ...p, time: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Format</label>
                      <select value={interviewDetails.format}
                        onChange={e => setInterviewDetails(p => ({ ...p, format: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {['Physical', 'Virtual / Video Call', 'Phone', 'Technical Assessment'].map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Interviewer Name</label>
                      <input type="text" value={interviewDetails.interviewerName} placeholder="e.g. John Doe"
                        onChange={e => setInterviewDetails(p => ({ ...p, interviewerName: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {interviewDetails.format?.includes('Virtual') ? 'Meeting Link' : 'Location'}
                      </label>
                      {interviewDetails.format?.includes('Virtual') ? (
                        <input type="url" value={interviewDetails.meetingLink} placeholder="https://meet.google.com/..."
                          onChange={e => setInterviewDetails(p => ({ ...p, meetingLink: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      ) : (
                        <input type="text" value={interviewDetails.location} placeholder="e.g. Helvino Technologies, Siaya"
                          onChange={e => setInterviewDetails(p => ({ ...p, location: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deadline for onboarding */}
              {emailType === 'ONBOARDING_REQUEST' && (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <label className="block text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">Document Submission Deadline <span className="font-normal text-green-500">(optional)</span></label>
                  <input type="date" value={interviewDetails.deadline}
                    onChange={e => setInterviewDetails(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 max-w-xs" />
                </div>
              )}

              {/* Offer Letter — only for ONBOARDING_REQUEST */}
              {emailType === 'ONBOARDING_REQUEST' && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Employment Offer Letter</p>
                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Claude</span>
                    </div>
                    <span className="text-xs text-amber-600">(optional — candidate will sign digitally)</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Generate an AI-written employment offer letter. The candidate will read and sign it digitally through the upload portal before submitting their documents.
                  </p>
                  <div className="flex gap-2">
                    {offerLetterGenerating ? (
                      <button onClick={() => { offerAbortRef.current?.abort(); setOfferLetterGenerating(false) }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                        <X className="w-4 h-4" /> Stop
                      </button>
                    ) : (
                      <button onClick={generateOfferLetter}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors">
                        <Sparkles className="w-4 h-4" />
                        {offerLetterContent ? 'Regenerate' : 'Generate Offer Letter'}
                      </button>
                    )}
                    {offerLetterContent && !offerLetterGenerating && (
                      <button onClick={generateOfferLetter}
                        className="flex items-center gap-2 px-3 py-2 border border-amber-200 text-amber-600 hover:bg-amber-100 bg-white rounded-xl text-sm font-semibold transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {(offerLetterContent || offerLetterGenerating) && (
                    <div className="relative">
                      <textarea
                        value={offerLetterContent}
                        onChange={e => setOfferLetterContent(e.target.value)}
                        rows={12}
                        placeholder={offerLetterGenerating ? '' : 'Offer letter content will appear here...'}
                        className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed bg-white"
                      />
                      {offerLetterGenerating && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Writing...
                        </div>
                      )}
                    </div>
                  )}
                  {!offerLetterContent && !offerLetterGenerating && (
                    <p className="text-xs text-amber-600 italic">No offer letter — leave blank to skip this step for the candidate.</p>
                  )}
                </div>
              )}

              {/* AI Generator */}
              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide">AI Email Generator</p>
                  <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">Claude</span>
                </div>
                <div>
                  <textarea
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    rows={2}
                    placeholder="Add context for better results (optional) — e.g. 'The candidate performed excellently in the technical round' or 'We received many strong applications'"
                    className="w-full px-3 py-2 text-sm border border-violet-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  {aiGenerating ? (
                    <button onClick={() => { abortRef.current?.abort(); setAiGenerating(false) }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      <X className="w-4 h-4" /> Stop
                    </button>
                  ) : (
                    <button onClick={generateAI}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">
                      <Sparkles className="w-4 h-4" />
                      {emailBody ? 'Regenerate' : 'Generate with AI'}
                    </button>
                  )}
                  {emailBody && !aiGenerating && (
                    <button onClick={generateAI}
                      className="flex items-center gap-2 px-3 py-2 border border-violet-200 text-violet-600 hover:bg-violet-50 bg-white rounded-xl text-sm font-semibold transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Email body */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Body <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-2">The greeting and sign-off are added automatically</span>
                </label>
                <div className="relative">
                  <textarea
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    rows={10}
                    placeholder={aiGenerating ? '' : 'Click "Generate with AI" or write the email body here...'}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed font-sans"
                  />
                  {aiGenerating && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Writing...
                    </div>
                  )}
                </div>
              </div>

              {/* Preview hint */}
              {emailBody && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700 mb-1">Email Preview</p>
                  <p><strong>From:</strong> Helvino Technologies Ltd &lt;helvinotechltd@gmail.com&gt;</p>
                  <p><strong>To:</strong> {emailTarget.email}</p>
                  <p><strong>Subject:</strong> {
                    emailType === 'INTERVIEW_INVITE' ? `Interview Invitation — ${emailTarget.job?.title} | Helvino Technologies Ltd` :
                    emailType === 'ONBOARDING_REQUEST' ? `Onboarding Documents — ${emailTarget.job?.title} | Helvino Technologies Ltd` :
                    `Re: Your Application for ${emailTarget.job?.title} | Helvino Technologies Ltd`
                  }</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <button onClick={closeEmail}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">
                Cancel
              </button>
              <button onClick={sendEmailNow} disabled={emailSending || !emailBody.trim() || aiGenerating}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                        talentPoolCategory === cat.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
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
