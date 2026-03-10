'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Copy, Linkedin, Phone, Globe, FileText,
  Plus, X, Calendar, MapPin, Video, Star, Send, User,
  Check, ExternalLink, Mail, Clock, Briefcase, DollarSign,
  MessageSquare, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'NEW',                 label: 'Applied',             color: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  { key: 'UNDER_REVIEW',        label: 'Under Review',        color: 'bg-purple-500',  light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  { key: 'SHORTLISTED',         label: 'Shortlisted',         color: 'bg-indigo-500',  light: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'bg-yellow-500',  light: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  { key: 'INTERVIEWED',         label: 'Interviewed',         color: 'bg-orange-500',  light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  { key: 'OFFERED',             label: 'Offered',             color: 'bg-green-500',   light: 'bg-green-50 border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  { key: 'HIRED',               label: 'Hired',               color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  { key: 'REJECTED',            label: 'Rejected',            color: 'bg-red-500',     light: 'bg-red-50 border-red-200',      text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
]

const STATUS_BADGE: Record<string, string> = Object.fromEntries(
  PIPELINE_STAGES.map(s => [s.key, s.badge])
)

const AVATAR_COLORS = [
  'bg-blue-600','bg-purple-600','bg-indigo-600','bg-rose-600',
  'bg-teal-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [job, setJob] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null)
  const [showAddApplicant, setShowAddApplicant] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'info' | 'notes' | 'interviews' | 'offer'>('info')
  const [copied, setCopied] = useState(false)

  async function loadJob() {
    try {
      const [jr, er] = await Promise.all([
        fetch(`/api/recruitment/jobs/${id}`),
        fetch('/api/employees'),
      ])
      const [j, e] = await Promise.all([jr.json(), er.json()])
      setJob(j)
      setEmployees(Array.isArray(e) ? e : [])
    } catch {
      toast.error('Failed to load job')
    }
    setLoading(false)
  }

  useEffect(() => { loadJob() }, [id])

  // Refresh a single applicant after mutation
  async function refreshApplicant(applicantId: string) {
    try {
      const res = await fetch(`/api/recruitment/applications/${applicantId}`)
      const data = await res.json()
      setSelectedApplicant(data)
      setJob((prev: any) => ({
        ...prev,
        applicants: prev.applicants.map((a: any) => a.id === applicantId ? { ...a, ...data } : a),
      }))
    } catch {
      // silent
    }
  }

  async function updateApplicantStatus(applicantId: string, status: string) {
    const res = await fetch(`/api/recruitment/applications/${applicantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Failed to update status'); return }
    toast.success('Status updated')
    await loadJob()
    if (selectedApplicant?.id === applicantId) {
      setSelectedApplicant((prev: any) => ({ ...prev, status }))
    }
  }

  async function updateScore(applicantId: string, score: number) {
    const res = await fetch(`/api/recruitment/applications/${applicantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
    if (!res.ok) { toast.error('Failed to update score'); return }
    toast.success('Score saved')
    if (selectedApplicant?.id === applicantId) {
      setSelectedApplicant((prev: any) => ({ ...prev, score }))
    }
  }

  function copyLink() {
    if (!job) return
    const link = `${window.location.origin}/careers/${job.slug}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-24 text-slate-500">
        <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p className="font-medium">Job not found</p>
        <Link href="/dashboard/recruitment/jobs" className="text-blue-600 text-sm mt-2 inline-block">Back to jobs</Link>
      </div>
    )
  }

  const jobLink = typeof window !== 'undefined' ? `${window.location.origin}/careers/${job.slug}` : ''
  const byStage = Object.fromEntries(PIPELINE_STAGES.map(s => [s.key, [] as any[]]))
  ;(job.applicants || []).forEach((a: any) => {
    if (byStage[a.status]) byStage[a.status].push(a)
  })

  const jobStatusColor: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700 border-green-200',
    CLOSED: 'bg-red-100 text-red-700 border-red-200',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    ARCHIVED: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/dashboard/recruitment/jobs"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Jobs
      </Link>

      {/* Job Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">{job.title}</h1>
                <p className="text-slate-500 text-sm">{job.department?.name || 'No department'}</p>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${jobStatusColor[job.status] || 'bg-slate-100 text-slate-600'}`}>
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Type</p>
            <p className="text-sm font-semibold text-slate-800">{job.type || '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Location</p>
            <p className="text-sm font-semibold text-slate-800">{job.location || '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Positions</p>
            <p className="text-sm font-semibold text-slate-800">{job.positions}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Deadline</p>
            <p className="text-sm font-semibold text-slate-800">{job.deadline ? formatDate(job.deadline) : '—'}</p>
          </div>
        </div>

        {(job.salaryMin || job.salaryMax) && (
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">
              {job.salaryMin ? formatCurrency(job.salaryMin) : '—'} – {job.salaryMax ? formatCurrency(job.salaryMax) : '—'}
            </span>
          </div>
        )}

        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill: string) => (
              <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Share Section */}
      {job.slug && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Share Job Posting</h2>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 truncate font-mono">
              {jobLink}
            </div>
            <button onClick={copyLink}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors flex-shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2">
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobLink)}`}
              target="_blank" rel="noreferrer"
              className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Linkedin className="w-3.5 h-3.5" />LinkedIn
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`We're hiring! ${job.title} — Apply here: ${jobLink}`)}`}
              target="_blank" rel="noreferrer"
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Phone className="w-3.5 h-3.5" />WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Applicant Pipeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">{job.applicants?.length || 0} total applicants</p>
          </div>
          <button onClick={() => setShowAddApplicant(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Add Applicant
          </button>
        </div>

        {/* Horizontal Pipeline */}
        <div className="overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {PIPELINE_STAGES.map((stage, idx) => {
              const cards = byStage[stage.key] || []
              return (
                <div key={stage.key} className={`w-56 flex-shrink-0 ${idx < PIPELINE_STAGES.length - 1 ? 'border-r border-slate-100' : ''}`}>
                  {/* Column header */}
                  <div className={`px-3 py-2.5 flex items-center justify-between border-b border-slate-100 ${stage.light}`}>
                    <span className={`text-xs font-bold ${stage.text}`}>{stage.label}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${stage.badge}`}>{cards.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[520px] overflow-y-auto">
                    {cards.length === 0 && (
                      <div className="text-center py-8 text-slate-300 text-xs">Empty</div>
                    )}
                    {cards.map((app: any) => {
                      const initials = `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase()
                      const color = avatarColor(`${app.firstName}${app.lastName}`)
                      return (
                        <button key={app.id}
                          onClick={() => { setSelectedApplicant(null); setTimeout(() => setSelectedApplicant(app), 50); setDrawerTab('info') }}
                          className="w-full text-left bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md rounded-xl p-3 transition-all group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{app.firstName} {app.lastName}</p>
                              <p className="text-xs text-slate-400 truncate">{app.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            {app.experienceYears != null && (
                              <span className="text-xs text-slate-500">{app.experienceYears}yr exp</span>
                            )}
                            {app.source && (
                              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                                {app.source}
                              </span>
                            )}
                          </div>
                          {app.score != null && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-semibold text-amber-600">{app.score}/100</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Applicant Modal */}
      {showAddApplicant && (
        <AddApplicantModal
          jobId={id}
          onClose={() => setShowAddApplicant(false)}
          onSave={() => { setShowAddApplicant(false); loadJob(); toast.success('Applicant added!') }}
        />
      )}

      {/* Applicant Detail Drawer */}
      {selectedApplicant && (
        <ApplicantDetailDrawer
          applicant={selectedApplicant}
          employees={employees}
          drawerTab={drawerTab}
          setDrawerTab={setDrawerTab}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={(status: string) => updateApplicantStatus(selectedApplicant.id, status)}
          onScoreChange={(score: number) => updateScore(selectedApplicant.id, score)}
          onRefresh={() => refreshApplicant(selectedApplicant.id)}
          onScheduleInterview={() => setShowSchedule(true)}
          onMakeOffer={() => setShowOffer(true)}
        />
      )}

      {/* Schedule Interview Modal */}
      {showSchedule && selectedApplicant && (
        <ScheduleInterviewModal
          applicant={selectedApplicant}
          employees={employees}
          onClose={() => setShowSchedule(false)}
          onSave={async (data: any) => {
            const res = await fetch('/api/recruitment/interviews', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, applicantId: selectedApplicant.id }),
            })
            if (!res.ok) { toast.error('Failed to schedule interview'); return }
            toast.success('Interview scheduled!')
            setShowSchedule(false)
            await refreshApplicant(selectedApplicant.id)
            await loadJob()
          }}
        />
      )}

      {/* Make Offer Modal */}
      {showOffer && selectedApplicant && (
        <MakeOfferModal
          applicant={selectedApplicant}
          onClose={() => setShowOffer(false)}
          onSave={async (data: any) => {
            const res = await fetch('/api/recruitment/offers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, applicantId: selectedApplicant.id }),
            })
            if (!res.ok) { toast.error('Failed to make offer'); return }
            toast.success('Offer sent!')
            setShowOffer(false)
            await refreshApplicant(selectedApplicant.id)
            await loadJob()
          }}
        />
      )}
    </div>
  )
}

// ─── Applicant Detail Drawer ──────────────────────────────────────────────────

function ApplicantDetailDrawer({
  applicant, employees, drawerTab, setDrawerTab,
  onClose, onStatusChange, onScoreChange, onRefresh,
  onScheduleInterview, onMakeOffer,
}: any) {
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [localScore, setLocalScore] = useState<string>(String(applicant.score ?? ''))
  const [scoreEditing, setScoreEditing] = useState(false)

  // Sync score when applicant changes
  useEffect(() => {
    setLocalScore(String(applicant.score ?? ''))
  }, [applicant.id, applicant.score])

  async function submitNote() {
    if (!noteText.trim()) return
    setAddingNote(true)
    const res = await fetch('/api/recruitment/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: applicant.id, content: noteText.trim() }),
    })
    if (!res.ok) { toast.error('Failed to add note'); setAddingNote(false); return }
    toast.success('Note added')
    setNoteText('')
    setAddingNote(false)
    onRefresh()
  }

  const initials = `${applicant.firstName?.[0] || ''}${applicant.lastName?.[0] || ''}`.toUpperCase()
  const color = avatarColor(`${applicant.firstName}${applicant.lastName}`)

  const TABS = [
    { key: 'info',       label: 'Info' },
    { key: 'notes',      label: `Notes${applicant.notesList?.length ? ` (${applicant.notesList.length})` : ''}` },
    { key: 'interviews', label: `Interviews${applicant.interviews?.length ? ` (${applicant.interviews.length})` : ''}` },
    { key: 'offer',      label: 'Offer' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{applicant.firstName} {applicant.lastName}</p>
            <p className="text-xs text-slate-500 truncate">{applicant.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 bg-white">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${drawerTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* INFO TAB */}
          {drawerTab === 'info' && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pipeline Stage</label>
                <select value={applicant.status} onChange={e => onStatusChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {PIPELINE_STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Score */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Score (0–100)</label>
                <div className="flex gap-2">
                  <input
                    type="number" min={0} max={100}
                    value={localScore}
                    onChange={e => { setLocalScore(e.target.value); setScoreEditing(true) }}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 85"
                  />
                  {scoreEditing && (
                    <button onClick={() => { onScoreChange(Number(localScore)); setScoreEditing(false) }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {applicant.score != null && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${applicant.score}%` }} />
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-amber-600">{applicant.score}</span>
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact</h3>
                <div className="space-y-2">
                  {applicant.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{applicant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:underline truncate">{applicant.email}</a>
                  </div>
                  {applicant.linkedIn && (
                    <div className="flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <a href={applicant.linkedIn} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline truncate text-sm flex items-center gap-1">
                        LinkedIn Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {applicant.portfolio && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={applicant.portfolio} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline truncate text-sm flex items-center gap-1">
                        Portfolio <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {applicant.resumeUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={applicant.resumeUrl} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline truncate text-sm flex items-center gap-1">
                        Resume/CV <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  {applicant.experienceYears != null && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Experience</p>
                      <p className="text-sm font-semibold text-slate-800">{applicant.experienceYears} yr{applicant.experienceYears !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {applicant.expectedSalary != null && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Expected Salary</p>
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(applicant.expectedSalary)}</p>
                    </div>
                  )}
                  {applicant.availableFrom && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Available From</p>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(applicant.availableFrom)}</p>
                    </div>
                  )}
                  {applicant.currentCompany && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Current Company</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{applicant.currentCompany}</p>
                    </div>
                  )}
                  {applicant.educationLevel && (
                    <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-slate-400">Education</p>
                      <p className="text-sm font-semibold text-slate-800">{applicant.educationLevel}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Source */}
              {applicant.source && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Source:</span>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{applicant.source}</span>
                </div>
              )}

              {/* Applied at */}
              <p className="text-xs text-slate-400">Applied {formatDateTime(applicant.createdAt)}</p>
            </div>
          )}

          {/* NOTES TAB */}
          {drawerTab === 'notes' && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500">Add Note</label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Write a note about this candidate..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button onClick={submitNote} disabled={addingNote || !noteText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {addingNote ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Add Note
                </button>
              </div>

              {/* Notes list */}
              {!applicant.notesList?.length ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.notesList.map((note: any) => (
                    <div key={note.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed mb-2">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'System'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(note.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INTERVIEWS TAB */}
          {drawerTab === 'interviews' && (
            <div className="space-y-4">
              <button onClick={onScheduleInterview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <Calendar className="w-4 h-4" />Schedule Interview
              </button>

              {!applicant.interviews?.length ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs">No interviews scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicant.interviews.map((iv: any) => {
                    const ivStatusColor: Record<string, string> = {
                      SCHEDULED: 'bg-blue-100 text-blue-700',
                      COMPLETED: 'bg-green-100 text-green-700',
                      CANCELLED: 'bg-red-100 text-red-700',
                      NO_SHOW: 'bg-amber-100 text-amber-700',
                    }
                    return (
                      <div key={iv.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{iv.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ivStatusColor[iv.status] || 'bg-slate-100 text-slate-600'}`}>
                            {iv.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(iv.scheduledAt)}
                        </div>
                        {iv.location && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {iv.location}
                          </div>
                        )}
                        {iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                            <Video className="w-3.5 h-3.5" />Meeting link
                          </a>
                        )}
                        {iv.interviewer && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {iv.interviewer.firstName} {iv.interviewer.lastName}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* OFFER TAB */}
          {drawerTab === 'offer' && (
            <div className="space-y-4">
              {applicant.offer ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-green-800">Offer Extended</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        applicant.offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        applicant.offer.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {applicant.offer.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-400">Offered Salary</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(applicant.offer.salary)}</p>
                      </div>
                      {applicant.offer.startDate && (
                        <div>
                          <p className="text-xs text-slate-400">Start Date</p>
                          <p className="text-sm font-semibold text-slate-900">{formatDate(applicant.offer.startDate)}</p>
                        </div>
                      )}
                      {applicant.offer.probationPeriod != null && (
                        <div>
                          <p className="text-xs text-slate-400">Probation</p>
                          <p className="text-sm font-semibold text-slate-900">{applicant.offer.probationPeriod} month{applicant.offer.probationPeriod !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                    {applicant.offer.terms && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Terms</p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{applicant.offer.terms}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-500 mb-4">No offer made yet</p>
                  <button onClick={onMakeOffer}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Make Offer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Applicant Modal ──────────────────────────────────────────────────────

function AddApplicantModal({ jobId, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    resumeUrl: '', linkedIn: '', portfolio: '',
    expectedSalary: '', availableFrom: '',
    experienceYears: '', currentCompany: '', educationLevel: '',
    source: 'DIRECT', status: 'NEW', skills: '',
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/recruitment/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        jobId,
        expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : null,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
        availableFrom: form.availableFrom || null,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to add applicant'); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900">Add Applicant</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[['firstName','First Name *',true],['lastName','Last Name *',true]].map(([field,label,req]) => (
              <div key={field as string}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                <input required={!!req} value={(form as any)[field as string]} onChange={f(field as string)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={f('email')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
              <input value={form.phone} onChange={f('phone')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Experience (years)</label>
              <input type="number" min={0} value={form.experienceYears} onChange={f('experienceYears')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Expected Salary (KES)</label>
              <input type="number" value={form.expectedSalary} onChange={f('expectedSalary')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Available From</label>
              <input type="date" value={form.availableFrom} onChange={f('availableFrom')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Source</label>
              <select value={form.source} onChange={f('source')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['DIRECT','REFERRAL','LINKEDIN','WEBSITE','JOB_BOARD','OTHER'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Initial Status</label>
              <select value={form.status} onChange={f('status')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">LinkedIn URL</label>
              <input type="url" value={form.linkedIn} onChange={f('linkedIn')} placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Resume URL</label>
              <input type="url" value={form.resumeUrl} onChange={f('resumeUrl')} placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Skills (comma-separated)</label>
              <input value={form.skills} onChange={f('skills')} placeholder="React, TypeScript, Node.js"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Applicant
          </button>
        </div>
      </div>
    </div>
  )
}

function UserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )
}

// ─── Schedule Interview Modal ─────────────────────────────────────────────────

function ScheduleInterviewModal({ applicant, employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'PHONE',
    scheduledAt: '',
    location: '',
    meetingLink: '',
    interviewerId: '',
    notes: '',
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.scheduledAt) { toast.error('Please select a date and time'); return }
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Schedule Interview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            {applicant.firstName} {applicant.lastName}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Interview Type</label>
            <select value={form.type} onChange={f('type')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="PHONE">Phone</option>
              <option value="VIRTUAL">Virtual / Video</option>
              <option value="PHYSICAL">In-Person</option>
              <option value="TECHNICAL">Technical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date &amp; Time *</label>
            <input required type="datetime-local" value={form.scheduledAt} onChange={f('scheduledAt')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location / Room</label>
            <input value={form.location} onChange={f('location')} placeholder="e.g. Conference Room A"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {(form.type === 'VIRTUAL' || form.type === 'PHONE') && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Meeting Link</label>
              <input type="url" value={form.meetingLink} onChange={f('meetingLink')} placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Interviewer</label>
            <select value={form.interviewerId} onChange={f('interviewerId')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select interviewer...</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={f('notes')} placeholder="Any preparation notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Make Offer Modal ─────────────────────────────────────────────────────────

function MakeOfferModal({ applicant, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    salary: '',
    startDate: '',
    probationPeriod: '3',
    terms: '',
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.salary) { toast.error('Please enter the offered salary'); return }
    setLoading(true)
    await onSave({
      salary: Number(form.salary),
      startDate: form.startDate || null,
      probationPeriod: form.probationPeriod ? Number(form.probationPeriod) : null,
      terms: form.terms || null,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Make Offer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            {applicant.firstName} {applicant.lastName}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Offered Salary (KES) *</label>
            <input required type="number" min={0} value={form.salary} onChange={f('salary')} placeholder="e.g. 120000"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {applicant.expectedSalary && (
              <p className="text-xs text-slate-400 mt-1">Candidate expects: {formatCurrency(applicant.expectedSalary)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date</label>
            <input type="date" value={form.startDate} onChange={f('startDate')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Probation Period (months)</label>
            <input type="number" min={0} max={24} value={form.probationPeriod} onChange={f('probationPeriod')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Terms &amp; Conditions</label>
            <textarea rows={3} value={form.terms} onChange={f('terms')} placeholder="Any specific terms or conditions..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Send Offer
          </button>
        </div>
      </div>
    </div>
  )
}
