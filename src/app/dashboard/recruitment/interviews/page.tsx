'use client'
import { useEffect, useState } from 'react'
import {
  Calendar, Clock, Video, Phone, MapPin, User, CheckCircle2,
  XCircle, Plus, ExternalLink, AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  PHONE: 'bg-slate-100 text-slate-700',
  VIRTUAL: 'bg-blue-100 text-blue-700',
  PHYSICAL: 'bg-green-100 text-green-700',
  TECHNICAL: 'bg-purple-100 text-purple-700',
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PHONE: <Phone className="w-3.5 h-3.5" />,
  VIRTUAL: <Video className="w-3.5 h-3.5" />,
  PHYSICAL: <MapPin className="w-3.5 h-3.5" />,
  TECHNICAL: <User className="w-3.5 h-3.5" />,
}

const FILTER_TABS = ['All', 'Scheduled', 'Completed', 'Cancelled', 'No Show']
const TAB_STATUS: Record<string, string> = {
  Scheduled: 'SCHEDULED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  'No Show': 'NO_SHOW',
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return d >= startOfWeek && d <= endOfWeek
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [tab, setTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [evaluationInterview, setEvaluationInterview] = useState<any>(null)

  async function loadData() {
    setLoading(true)
    const [ir, ar, er] = await Promise.all([
      fetch('/api/recruitment/interviews'),
      fetch('/api/recruitment/applications?status=SHORTLISTED,INTERVIEWED'),
      fetch('/api/employees'),
    ])
    const [i, a, e] = await Promise.all([ir.json(), ar.json(), er.json()])
    setInterviews(Array.isArray(i) ? i : [])
    setApplications(Array.isArray(a) ? a : [])
    setEmployees(Array.isArray(e) ? e : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function cancelInterview(id: string) {
    if (!confirm('Cancel this interview?')) return
    const res = await fetch(`/api/recruitment/interviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    if (!res.ok) { toast.error('Failed to cancel interview'); return }
    toast.success('Interview cancelled')
    loadData()
  }

  const filtered = interviews.filter(i => {
    if (tab === 'All') return true
    return i.status === TAB_STATUS[tab]
  })

  const scheduled = interviews.filter(i => i.status === 'SCHEDULED')
  const completed = interviews.filter(i => i.status === 'COMPLETED')
  const todayCount = interviews.filter(i => isToday(i.scheduledAt)).length
  const weekCount = interviews.filter(i => isThisWeek(i.scheduledAt)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Interviews</h1>
          <p className="text-slate-500 text-sm">
            {scheduled.length} scheduled · {completed.length} completed · {interviews.length} total
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', value: scheduled.length, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Completed', value: completed.length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Today', value: todayCount, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'This Week', value: weekCount, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 w-fit flex-wrap">
        {FILTER_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Interviews list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No interviews found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Candidate', 'Position', 'Type', 'Date & Time', 'Location / Link', 'Interviewer', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((iv: any) => (
                  <tr key={iv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {iv.applicant?.firstName?.[0]}{iv.applicant?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 whitespace-nowrap">
                            {iv.applicant?.firstName} {iv.applicant?.lastName}
                          </div>
                          <div className="text-slate-400 text-xs">{iv.applicant?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-700 font-medium text-xs whitespace-nowrap">
                        {iv.applicant?.job?.title || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[iv.type] || 'bg-slate-100 text-slate-700'}`}>
                        {TYPE_ICONS[iv.type]}
                        {iv.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(iv.scheduledAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(iv.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {iv.type === 'VIRTUAL' && iv.meetingLink ? (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Meeting
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">{iv.location || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {iv.interviewer ? (
                        <span className="text-slate-700 text-xs font-medium whitespace-nowrap">
                          {iv.interviewer.firstName} {iv.interviewer.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[iv.status] || 'bg-slate-100 text-slate-600'}`}>
                        {iv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {iv.status === 'SCHEDULED' && (
                          <>
                            <button
                              onClick={() => setEvaluationInterview(iv)}
                              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </button>
                            <button
                              onClick={() => cancelInterview(iv.id)}
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                        {iv.status === 'COMPLETED' && (
                          <button
                            onClick={() => setEvaluationInterview(iv)}
                            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            View Eval
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          applications={applications}
          employees={employees}
          onClose={() => setShowScheduleModal(false)}
          onSave={() => { setShowScheduleModal(false); loadData(); toast.success('Interview scheduled!') }}
        />
      )}

      {evaluationInterview && (
        <EvaluationModal
          interview={evaluationInterview}
          onClose={() => setEvaluationInterview(null)}
          onSave={() => { setEvaluationInterview(null); loadData(); toast.success('Evaluation saved!') }}
        />
      )}
    </div>
  )
}

function ScheduleInterviewModal({ applications, employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    applicantId: '',
    type: 'VIRTUAL',
    scheduledAt: '',
    scheduledTime: '',
    location: '',
    meetingLink: '',
    interviewerId: '',
    notes: '',
  })

  const filteredApps = applications.filter((a: any) => {
    const q = search.toLowerCase()
    return (
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.job?.title?.toLowerCase().includes(q)
    )
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.applicantId || !form.type || !form.scheduledAt || !form.scheduledTime) {
      setError('Candidate, type, date, and time are required')
      return
    }
    setLoading(true)
    setError('')
    const scheduledAt = new Date(`${form.scheduledAt}T${form.scheduledTime}`)
    const res = await fetch('/api/recruitment/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId: form.applicantId,
        type: form.type,
        scheduledAt: scheduledAt.toISOString(),
        location: form.location || null,
        meetingLink: form.meetingLink || null,
        interviewerId: form.interviewerId || null,
        notes: form.notes || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to schedule'); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Schedule Interview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Search & Select Candidate *</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or position..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-2"
            />
            {search && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {filteredApps.length === 0 ? (
                  <p className="text-slate-400 text-sm p-3">No candidates found</p>
                ) : filteredApps.map((a: any) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { setForm(p => ({ ...p, applicantId: a.id })); setSearch(`${a.firstName} ${a.lastName}`) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${form.applicantId === a.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                  >
                    <span className="font-medium">{a.firstName} {a.lastName}</span>
                    <span className="text-slate-400 text-xs">{a.job?.title}</span>
                  </button>
                ))}
              </div>
            )}
            {form.applicantId && !filteredApps.some((a: any) => a.id === form.applicantId) && (
              <p className="text-green-600 text-xs font-medium mt-1">Candidate selected</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Interview Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['PHONE', 'VIRTUAL', 'PHYSICAL', 'TECHNICAL'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Interviewer</label>
              <select
                value={form.interviewerId}
                onChange={e => setForm(p => ({ ...p, interviewerId: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select interviewer...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date *</label>
              <input
                type="date"
                required
                value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Time *</label>
              <input
                type="time"
                required
                value={form.scheduledTime}
                onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {form.type === 'VIRTUAL' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Meeting Link</label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Conference Room A, Nairobi Office"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes for the interviewer..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Scheduling...</> : 'Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EvaluationModal({ interview, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const existing = interview.evaluation
  const [scores, setScores] = useState({
    technicalSkills: existing?.technicalSkills ?? 5,
    communication: existing?.communication ?? 5,
    problemSolving: existing?.problemSolving ?? 5,
    culturalFit: existing?.culturalFit ?? 5,
  })
  const [recommendation, setRecommendation] = useState(existing?.recommendation ?? 'CONSIDER')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const overallScore = Math.round(
    (scores.technicalSkills + scores.communication + scores.problemSolving + scores.culturalFit) / 4 * 10
  ) / 10

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/recruitment/interviews/${interview.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'COMPLETED',
        evaluation: {
          technicalSkills: scores.technicalSkills,
          communication: scores.communication,
          problemSolving: scores.problemSolving,
          culturalFit: scores.culturalFit,
          overallScore,
          recommendation,
          notes,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save evaluation'); setLoading(false); return }
    onSave()
  }

  const scoreColor = (v: number) => v >= 8 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interview Evaluation</h2>
            <p className="text-slate-500 text-sm">
              {interview.applicant?.firstName} {interview.applicant?.lastName} — {interview.applicant?.job?.title}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

          {/* Overall Score Display */}
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Overall Score</p>
            <p className={`text-4xl font-black ${scoreColor(overallScore)}`}>{overallScore}<span className="text-lg text-slate-400">/10</span></p>
          </div>

          {/* Score Inputs */}
          <div className="space-y-4">
            {([
              { key: 'technicalSkills', label: 'Technical Skills' },
              { key: 'communication', label: 'Communication' },
              { key: 'problemSolving', label: 'Problem Solving' },
              { key: 'culturalFit', label: 'Cultural Fit' },
            ] as { key: keyof typeof scores; label: string }[]).map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">{label}</label>
                  <span className={`text-sm font-black ${scoreColor(scores[key])}`}>{scores[key]}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={scores[key]}
                  onChange={e => setScores(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Recommendation</label>
            <select
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="HIRE">Hire — Strong candidate</option>
              <option value="CONSIDER">Consider — Potential fit</option>
              <option value="REJECT">Reject — Not suitable</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Evaluation Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detailed notes about the candidate's performance..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Close</button>
          {interview.status !== 'COMPLETED' || true ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Evaluation'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
