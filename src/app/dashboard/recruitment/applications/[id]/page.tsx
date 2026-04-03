'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Linkedin, Globe, Star, Briefcase,
  GraduationCap, Calendar, DollarSign, MapPin, Clock,
  FileText, MessageSquare, CheckCircle, XCircle, AlertCircle,
  ChevronRight, User, Layers, CalendarCheck, UserX, Send,
  Printer, Building2, Loader2, RefreshCw, Sparkles, X,
  PenLine, ClipboardList, Award, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'

// ── constants ────────────────────────────────────────────────────────────────

const PIPELINE: { key: string; label: string }[] = [
  { key: 'NEW',                 label: 'Applied' },
  { key: 'UNDER_REVIEW',        label: 'Under Review' },
  { key: 'SHORTLISTED',         label: 'Shortlisted' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { key: 'INTERVIEWED',         label: 'Interviewed' },
  { key: 'OFFERED',             label: 'Offered' },
  { key: 'HIRED',               label: 'Hired' },
]

const STATUS_COLOR: Record<string, string> = {
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

const EMAIL_TYPES = [
  { key: 'INTERVIEW_INVITE',   label: 'Interview Invitation',      icon: CalendarCheck, color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  { key: 'ONBOARDING_REQUEST', label: 'Request Onboarding Docs',   icon: FileText,      color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { key: 'REJECTION',          label: 'Send Rejection',            icon: UserX,         color: 'text-red-500',   bg: 'bg-red-50 border-red-200' },
]

// ── section card helper ───────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <Icon className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 font-medium min-w-[130px]">{label}</span>
      <span className="text-xs text-slate-800 font-semibold text-right">{value}</span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [applicant, setApplicant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusSaving, setStatusSaving] = useState(false)

  // Email modal state
  const [showEmail, setShowEmail] = useState(false)
  const [emailType, setEmailType] = useState<string>('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const [rejectionStage, setRejectionStage] = useState<'BEFORE' | 'AFTER'>('BEFORE')
  const [interviewDetails, setInterviewDetails] = useState({
    date: '', time: '', format: 'Physical', location: '', meetingLink: '', interviewerName: '', deadline: '',
  })
  const [offerLetterContent, setOfferLetterContent] = useState('')
  const [offerLetterGenerating, setOfferLetterGenerating] = useState(false)
  const abortRef = { current: null as AbortController | null }
  const offerAbortRef = { current: null as AbortController | null }

  // Note
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/recruitment/applications/${id}`)
      if (!res.ok) { toast.error('Applicant not found'); router.push('/dashboard/recruitment/applications'); return }
      setApplicant(await res.json())
    } catch { toast.error('Failed to load applicant') }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function updateStatus(status: string) {
    setStatusSaving(true)
    const res = await fetch(`/api/recruitment/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { setApplicant(await res.json()); toast.success('Status updated') }
    else toast.error('Failed to update status')
    setStatusSaving(false)
  }

  async function saveNote() {
    if (!noteText.trim()) return
    setNoteSaving(true)
    const res = await fetch('/api/recruitment/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId: id, content: noteText }),
    })
    if (res.ok) { setNoteText(''); load(); toast.success('Note saved') }
    else toast.error('Failed to save note')
    setNoteSaving(false)
  }

  function openEmail(type: string) {
    setEmailType(type); setEmailBody(''); setAiContext(''); setShowEmail(true)
    setOfferLetterContent(applicant?.offerLetterContent ?? '')
  }

  async function generateAI() {
    abortRef.current?.abort()
    const ctrl = new AbortController(); abortRef.current = ctrl
    setAiGenerating(true); setEmailBody('')
    try {
      const res = await fetch('/api/ai/email-compose', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType === 'REJECTION' ? (rejectionStage === 'BEFORE' ? 'REJECTION_BEFORE_INTERVIEW' : 'REJECTION_AFTER_INTERVIEW') : emailType,
          applicant: { firstName: applicant.firstName, lastName: applicant.lastName, jobTitle: applicant.job?.title },
          context: aiContext,
          interviewDetails: emailType === 'INTERVIEW_INVITE' ? interviewDetails : undefined,
        }),
      })
      if (!res.body) return
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        text += decoder.decode(value, { stream: true }); setEmailBody(text)
      }
    } catch (e: any) { if (e.name !== 'AbortError') toast.error('AI generation failed') }
    setAiGenerating(false)
  }

  async function generateOfferLetter() {
    offerAbortRef.current?.abort()
    const ctrl = new AbortController(); offerAbortRef.current = ctrl
    setOfferLetterGenerating(true); setOfferLetterContent('')
    try {
      const res = await fetch('/api/ai/offer-letter', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant }),
      })
      if (!res.body) return
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        text += decoder.decode(value, { stream: true }); setOfferLetterContent(text)
      }
    } catch (e: any) { if (e.name !== 'AbortError') toast.error('Generation failed') }
    setOfferLetterGenerating(false)
  }

  async function sendEmail() {
    if (!emailBody.trim()) return
    setEmailSending(true)
    const res = await fetch('/api/recruitment/applications/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId: id, type: emailType, body: emailBody,
        interviewDetails: emailType === 'INTERVIEW_INVITE' ? interviewDetails : undefined,
        deadline: emailType === 'ONBOARDING_REQUEST' ? interviewDetails.deadline : undefined,
        offerLetterContent: emailType === 'ONBOARDING_REQUEST' ? offerLetterContent : undefined,
        rejectionStage: emailType === 'REJECTION' ? rejectionStage : undefined,
      }),
    })
    if (res.ok) {
      toast.success('Email sent'); setShowEmail(false); load()
    } else {
      const d = await res.json(); toast.error(d.error || 'Failed to send email')
    }
    setEmailSending(false)
  }

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!applicant) return null

  const a = applicant
  const initials = `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase()
  const color = avatarColor(`${a.firstName}${a.lastName}`)
  const pipelineIdx = PIPELINE.findIndex(p => p.key === a.status)
  const isRejected = a.status === 'REJECTED'

  // ── pipeline step component ─────────────────────────────────────────────────
  const PipelineBar = () => (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {PIPELINE.map((step, i) => {
        const isActive = step.key === a.status
        const isDone = !isRejected && pipelineIdx > i
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 min-w-[80px] cursor-pointer group`}
              onClick={() => !statusSaving && updateStatus(step.key)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isActive ? 'bg-blue-600 border-blue-600 text-white scale-110' :
                isDone ? 'bg-green-500 border-green-500 text-white' :
                'bg-white border-slate-300 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-500'
              }`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs text-center leading-tight font-medium transition-colors ${
                isActive ? 'text-blue-700 font-bold' : isDone ? 'text-green-600' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={`h-0.5 w-6 flex-shrink-0 mx-1 rounded-full ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
      {/* Rejected step */}
      <div className="flex items-center ml-2 pl-2 border-l border-slate-200">
        <div
          className={`flex flex-col items-center gap-1 min-w-[80px] cursor-pointer group`}
          onClick={() => !statusSaving && updateStatus('REJECTED')}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
            isRejected ? 'bg-red-500 border-red-500 text-white scale-110' :
            'bg-white border-slate-300 text-slate-400 group-hover:border-red-400 group-hover:text-red-500'
          }`}>
            <XCircle className="w-4 h-4" />
          </div>
          <span className={`text-xs text-center leading-tight font-medium ${isRejected ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
            Rejected
          </span>
        </div>
      </div>
    </div>
  )

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/recruitment/applications"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm text-slate-800 font-semibold">{a.firstName} {a.lastName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white font-black text-xl flex-shrink-0`}>
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900">{a.firstName} {a.lastName}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[a.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              {a.score != null && (
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {a.score}/100
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
              {a.email && (
                <a href={`mailto:${a.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />{a.email}
                </a>
              )}
              {a.phone && (
                <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Phone className="w-3.5 h-3.5" />{a.phone}
                </a>
              )}
              {a.linkedIn && (
                <a href={a.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />LinkedIn
                </a>
              )}
              {a.portfolio && (
                <a href={a.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Globe className="w-3.5 h-3.5" />Portfolio
                </a>
              )}
            </div>
            {a.job && (
              <div className="flex items-center gap-2 flex-wrap">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Applied for</span>
                <Link href={`/dashboard/recruitment/jobs/${a.job.id}`}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  {a.job.title}
                </Link>
                <span className="text-xs text-slate-400">· {formatDate(a.createdAt)}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {EMAIL_TYPES.map(et => (
              <button key={et.key}
                onClick={() => openEmail(et.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${et.bg} ${et.color}`}>
                <et.icon className="w-3.5 h-3.5" />
                {et.label}
              </button>
            ))}
            <Link href={`/dashboard/recruitment/applications/${id}/offer-letter`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors">
              <Printer className="w-3.5 h-3.5" />Offer Letter
            </Link>
          </div>
        </div>

        {/* Pipeline bar */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pipeline — click a stage to move candidate</p>
          <PipelineBar />
        </div>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — profile details */}
        <div className="lg:col-span-1 space-y-5">

          {/* Professional info */}
          <Section title="Professional Info" icon={Briefcase}>
            <InfoRow label="Current Company" value={a.currentCompany} />
            <InfoRow label="Experience" value={a.experienceYears != null ? `${a.experienceYears} year${a.experienceYears !== 1 ? 's' : ''}` : null} />
            <InfoRow label="Education" value={a.educationLevel} />
            <InfoRow label="Expected Salary" value={a.expectedSalary ? `KES ${formatCurrency(a.expectedSalary)}` : null} />
            <InfoRow label="Available From" value={a.availableFrom ? formatDate(a.availableFrom) : null} />
            <InfoRow label="Source" value={a.source} />
            {a.salesManager && (
              <InfoRow label="Referred By" value={`${a.salesManager.firstName} ${a.salesManager.lastName}`} />
            )}
          </Section>

          {/* Skills */}
          {Array.isArray(a.skills) && a.skills.length > 0 && (
            <Section title="Skills" icon={Award}>
              <div className="flex flex-wrap gap-1.5">
                {a.skills.map((s: string) => (
                  <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Email activity */}
          <Section title="Email Activity" icon={Mail}>
            {!a.interviewInviteSentAt && !a.onboardingRequestSentAt && !a.rejectionEmailSentAt ? (
              <p className="text-xs text-slate-400 italic">No emails sent yet</p>
            ) : (
              <div className="space-y-2">
                {a.interviewInviteSentAt && (
                  <div className="flex items-start gap-2">
                    <CalendarCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Interview Invite Sent</p>
                      <p className="text-xs text-slate-400">{formatDate(a.interviewInviteSentAt)}</p>
                    </div>
                  </div>
                )}
                {a.onboardingRequestSentAt && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Onboarding Request Sent</p>
                      <p className="text-xs text-slate-400">{formatDate(a.onboardingRequestSentAt)}</p>
                    </div>
                  </div>
                )}
                {a.rejectionEmailSentAt && (
                  <div className="flex items-start gap-2">
                    <UserX className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Rejection Email Sent</p>
                      <p className="text-xs text-slate-400">{formatDate(a.rejectionEmailSentAt)}</p>
                    </div>
                  </div>
                )}
                {a.offerLetterSignedAt && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Offer Letter Signed</p>
                      <p className="text-xs text-slate-400">{formatDate(a.offerLetterSignedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Right col — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Cover letter */}
          {a.coverLetter && (
            <Section title="Cover Letter" icon={FileText}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{a.coverLetter}</p>
            </Section>
          )}

          {/* Resume */}
          {a.resumeUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Resume / CV</p>
                  <p className="text-xs text-slate-400">Uploaded document</p>
                </div>
              </div>
              <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                View Resume
              </a>
            </div>
          )}

          {/* Interviews */}
          <Section title={`Interviews (${a.interviews?.length ?? 0})`} icon={CalendarCheck}>
            {!a.interviews?.length ? (
              <p className="text-xs text-slate-400 italic">No interviews scheduled yet</p>
            ) : (
              <div className="space-y-3">
                {a.interviews.map((iv: any) => (
                  <div key={iv.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{iv.type ?? 'Interview'}</p>
                        <p className="text-xs text-slate-500">
                          {iv.interviewer ? `${iv.interviewer.firstName} ${iv.interviewer.lastName}` : 'Interviewer TBD'}
                          {iv.scheduledAt && ` · ${formatDate(iv.scheduledAt)}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                        iv.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                        iv.status === 'CANCELLED' ? 'bg-red-100 text-red-600 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>{iv.status ?? 'SCHEDULED'}</span>
                    </div>
                    {iv.evaluation && (
                      <div className="bg-slate-50 rounded-lg p-3 mt-2 text-xs space-y-1">
                        {iv.evaluation.score != null && (
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-slate-700">Score: {iv.evaluation.score}/10</span>
                          </div>
                        )}
                        {iv.evaluation.recommendation && (
                          <p className="text-slate-600"><span className="font-semibold">Recommendation:</span> {iv.evaluation.recommendation}</p>
                        )}
                        {iv.evaluation.notes && (
                          <p className="text-slate-500">{iv.evaluation.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Offer details */}
          {a.offer && (
            <Section title="Job Offer" icon={Award}>
              <div className="space-y-1">
                <InfoRow label="Offered Salary" value={a.offer.salary ? `KES ${formatCurrency(a.offer.salary)}` : null} />
                <InfoRow label="Start Date" value={a.offer.startDate ? formatDate(a.offer.startDate) : null} />
                <InfoRow label="Offer Status" value={a.offer.status} />
                <InfoRow label="Created By" value={a.offer.createdBy ? `${a.offer.createdBy.firstName} ${a.offer.createdBy.lastName}` : null} />
                {a.offerLetterSignedAt && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Signed on {formatDate(a.offerLetterSignedAt)}</span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Onboarding docs */}
          {a.onboardingDocuments && (
            <Section title="Onboarding Documents" icon={ClipboardList}>
              <div className="space-y-2">
                {Object.entries(a.onboardingDocuments as Record<string, any>).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                    {typeof val === 'string' && val.startsWith('http') ? (
                      <a href={val} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium">View</a>
                    ) : (
                      <span className="text-xs text-slate-500">{String(val)}</span>
                    )}
                  </div>
                ))}
                {a.onboardingApproved && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Approved {a.onboardingApprovedAt ? `on ${formatDate(a.onboardingApprovedAt)}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Internal notes */}
          <Section title="Internal Notes" icon={MessageSquare}>
            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add an internal note..."
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={saveNote}
                disabled={noteSaving || !noteText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors">
                {noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Notes list */}
            {!a.notesList?.length ? (
              <p className="text-xs text-slate-400 italic">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {a.notesList.map((note: any) => (
                  <div key={note.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Staff'}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Raw notes field (legacy) */}
          {a.notes && (
            <Section title="Additional Notes" icon={AlertCircle}>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{a.notes}</p>
            </Section>
          )}
        </div>
      </div>

      {/* ── Email Modal ──────────────────────────────────────────────────────── */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {EMAIL_TYPES.find(t => t.key === emailType)?.label}
                </h2>
                <p className="text-xs text-slate-500">
                  To: <strong>{a.firstName} {a.lastName}</strong> · {a.email}
                  {a.job && <span> · {a.job.title}</span>}
                </p>
              </div>
              <button onClick={() => setShowEmail(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Rejection stage */}
              {emailType === 'REJECTION' && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-xs font-semibold text-red-700 mb-2">Rejection Stage</p>
                  <div className="flex gap-2">
                    {[{ key: 'BEFORE', label: 'Before Interview' }, { key: 'AFTER', label: 'After Interview' }].map(o => (
                      <label key={o.key} className={`flex-1 p-3 rounded-xl border-2 cursor-pointer ${rejectionStage === o.key ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
                        <input type="radio" name="rs" value={o.key} checked={rejectionStage === o.key as any}
                          onChange={() => setRejectionStage(o.key as any)} className="sr-only" />
                        <p className="text-sm font-semibold text-slate-800">{o.label}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview details */}
              {emailType === 'INTERVIEW_INVITE' && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Interview Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Date', field: 'date', type: 'date' },
                      { label: 'Time (EAT)', field: 'time', type: 'time' },
                      { label: 'Interviewer Name', field: 'interviewerName', type: 'text', placeholder: 'e.g. John Doe' },
                    ].map(f => (
                      <div key={f.field}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                        <input type={f.type} placeholder={(f as any).placeholder ?? ''}
                          value={(interviewDetails as any)[f.field]}
                          onChange={e => setInterviewDetails(p => ({ ...p, [f.field]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Format</label>
                      <select value={interviewDetails.format}
                        onChange={e => setInterviewDetails(p => ({ ...p, format: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {['Physical', 'Virtual / Video Call', 'Phone', 'Technical Assessment'].map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {interviewDetails.format?.includes('Virtual') ? 'Meeting Link' : 'Location'}
                      </label>
                      <input type="text"
                        value={interviewDetails.format?.includes('Virtual') ? interviewDetails.meetingLink : interviewDetails.location}
                        onChange={e => setInterviewDetails(p => interviewDetails.format?.includes('Virtual')
                          ? { ...p, meetingLink: e.target.value } : { ...p, location: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding deadline + offer letter */}
              {emailType === 'ONBOARDING_REQUEST' && (
                <>
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                    <label className="block text-xs font-semibold text-green-700 mb-1">Document Submission Deadline (optional)</label>
                    <input type="date" value={interviewDetails.deadline}
                      onChange={e => setInterviewDetails(p => ({ ...p, deadline: e.target.value }))}
                      className="px-3 py-2 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 max-w-xs" />
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Employment Offer Letter</p>
                    </div>
                    <div className="flex gap-2">
                      {offerLetterGenerating
                        ? <button onClick={() => { offerAbortRef.current?.abort(); setOfferLetterGenerating(false) }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold">
                            <X className="w-4 h-4" /> Stop
                          </button>
                        : <button onClick={generateOfferLetter}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />{offerLetterContent ? 'Regenerate' : 'Generate Offer Letter'}
                          </button>
                      }
                    </div>
                    {(offerLetterContent || offerLetterGenerating) && (
                      <div className="relative">
                        <textarea value={offerLetterContent} onChange={e => setOfferLetterContent(e.target.value)}
                          rows={10} className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl resize-none bg-white" />
                        {offerLetterGenerating && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />Writing...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* AI Generator */}
              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide">AI Email Generator</p>
                </div>
                <textarea value={aiContext} onChange={e => setAiContext(e.target.value)} rows={2}
                  placeholder="Add context for better results (optional)"
                  className="w-full px-3 py-2 text-sm border border-violet-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                <div className="flex gap-2">
                  {aiGenerating
                    ? <button onClick={() => { abortRef.current?.abort(); setAiGenerating(false) }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold">
                        <X className="w-4 h-4" /> Stop
                      </button>
                    : <button onClick={generateAI}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold">
                        <Sparkles className="w-4 h-4" />{emailBody ? 'Regenerate' : 'Generate with AI'}
                      </button>
                  }
                  {emailBody && !aiGenerating && (
                    <button onClick={generateAI}
                      className="px-3 py-2 border border-violet-200 text-violet-600 hover:bg-violet-100 bg-white rounded-xl text-sm font-semibold">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Email body */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Body <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10}
                    placeholder={aiGenerating ? '' : 'Click "Generate with AI" or write the email body here...'}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed" />
                  {aiGenerating && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Writing...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <button onClick={() => setShowEmail(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">
                Cancel
              </button>
              <button onClick={sendEmail} disabled={emailSending || !emailBody.trim() || aiGenerating}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
