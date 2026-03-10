'use client'
import { useEffect, useState } from 'react'
import {
  Users, Search, Mail, Phone, Briefcase, Star, ExternalLink,
  User, Linkedin, Globe, Calendar, DollarSign, ChevronDown
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  SHORTLISTED: 'bg-purple-100 text-purple-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEWED: 'bg-yellow-100 text-yellow-700',
  OFFERED: 'bg-green-100 text-green-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-600',
}

const POOL_COLORS: Record<string, string> = {
  FUTURE_PROSPECT: 'bg-blue-600 text-white',
  SENIOR_TALENT: 'bg-purple-600 text-white',
  INTERN_CANDIDATES: 'bg-orange-500 text-white',
}

const POOL_LABELS: Record<string, string> = {
  FUTURE_PROSPECT: 'Future Prospect',
  SENIOR_TALENT: 'Senior Talent',
  INTERN_CANDIDATES: 'Intern Candidate',
}

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-500',
  'bg-pink-600', 'bg-indigo-600', 'bg-teal-600', 'bg-red-600',
]

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Future Prospects', value: 'FUTURE_PROSPECT' },
  { label: 'Senior Talent', value: 'SENIOR_TALENT' },
  { label: 'Intern Candidates', value: 'INTERN_CANDIDATES' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Rejected', value: 'REJECTED' },
]

function avatarColor(name: string) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function CandidatesPage() {
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [profileApplicant, setProfileApplicant] = useState<any>(null)
  const [poolDropdown, setPoolDropdown] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const res = await fetch('/api/recruitment/applications')
    const data = await res.json()
    setApplicants(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setPoolDropdown(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  async function assignPool(id: string, pool: string | null) {
    const res = await fetch(`/api/recruitment/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ talentPool: pool !== null, ...(pool ? { poolTag: pool } : {}) }),
    })
    if (!res.ok) { toast.error('Failed to update talent pool'); return }
    toast.success(pool ? `Added to ${POOL_LABELS[pool] || pool}` : 'Removed from talent pool')
    loadData()
    setPoolDropdown(null)
  }

  const filtered = applicants.filter(a => {
    const poolTabs = ['FUTURE_PROSPECT', 'SENIOR_TALENT', 'INTERN_CANDIDATES']
    const statusTabs = ['HIRED', 'REJECTED']

    if (tab !== 'all') {
      if (poolTabs.includes(tab)) {
        if (a.poolTag !== tab) return false
      } else if (statusTabs.includes(tab)) {
        if (a.status !== tab) return false
      }
    }

    if (search) {
      const q = search.toLowerCase()
      const skills = Array.isArray(a.skills) ? a.skills.join(' ').toLowerCase() : ''
      return (
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        skills.includes(q) ||
        a.job?.title?.toLowerCase().includes(q)
      )
    }

    return true
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Talent Pool</h1>
          <p className="text-slate-500 text-sm">{applicants.length} total candidates in database</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, skills, or position..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 flex-wrap">
        {FILTER_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No candidates found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app: any) => (
            <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col gap-4">
              {/* Top row: avatar + name + pool tag */}
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl ${avatarColor(app.firstName)} flex items-center justify-center text-white font-black text-base flex-shrink-0`}>
                  {app.firstName?.[0]}{app.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{app.firstName} {app.lastName}</h3>
                    {app.poolTag && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${POOL_COLORS[app.poolTag] || 'bg-slate-100 text-slate-600'}`}>
                        {POOL_LABELS[app.poolTag] || app.poolTag}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{app.email}</p>
                  {app.phone && (
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{app.phone}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}>
                  {app.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Position */}
              {app.job && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 text-xs font-medium truncate">{app.job.title}</span>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(app.skills) && app.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {app.skills.slice(0, 4).map((skill: string) => (
                    <span key={skill} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg font-medium">{skill}</span>
                  ))}
                  {app.skills.length > 4 && (
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-lg">+{app.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {app.experienceYears != null && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />{app.experienceYears}y exp
                  </span>
                )}
                {app.expectedSalary && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />{formatCurrency(app.expectedSalary)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => setProfileApplicant(app)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  View Profile
                </button>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setPoolDropdown(poolDropdown === app.id ? null : app.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Add to Pool
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {poolDropdown === app.id && (
                    <div className="absolute right-0 bottom-full mb-1 bg-white rounded-xl shadow-lg border border-slate-200 z-30 min-w-[160px] py-1">
                      {(['FUTURE_PROSPECT', 'SENIOR_TALENT', 'INTERN_CANDIDATES'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => assignPool(app.id, p)}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {POOL_LABELS[p]}
                        </button>
                      ))}
                      {app.talentPool && (
                        <button
                          onClick={() => assignPool(app.id, null)}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                        >
                          Remove from Pool
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {app.email && (
                  <a
                    href={`mailto:${app.email}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                    title="Send email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {profileApplicant && (
        <ApplicantProfileModal
          applicant={profileApplicant}
          onClose={() => setProfileApplicant(null)}
        />
      )}
    </div>
  )
}

function ApplicantProfileModal({ applicant: initial, onClose }: any) {
  const [applicant, setApplicant] = useState(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchFull() {
      setLoading(true)
      const res = await fetch(`/api/recruitment/applications/${initial.id}`)
      if (res.ok) {
        const data = await res.json()
        setApplicant(data)
      }
      setLoading(false)
    }
    fetchFull()
  }, [initial.id])

  const scoreColor = (v: number) => v >= 8 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${avatarColor(applicant.firstName)} flex items-center justify-center text-white font-black text-base flex-shrink-0`}>
              {applicant.firstName?.[0]}{applicant.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{applicant.firstName} {applicant.lastName}</h2>
              <p className="text-slate-500 text-sm">{applicant.job?.title || 'No position'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[applicant.status] || 'bg-slate-100 text-slate-600'}`}>
                {applicant.status?.replace('_', ' ')}
              </span>
              {applicant.poolTag && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${POOL_COLORS[applicant.poolTag] || 'bg-slate-100 text-slate-600'}`}>
                  {POOL_LABELS[applicant.poolTag] || applicant.poolTag}
                </span>
              )}
              {applicant.score != null && (
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Score: {applicant.score}/10
                </span>
              )}
            </div>

            {/* Personal Info */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={applicant.email} />
                <InfoItem icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={applicant.phone || '—'} />
                <InfoItem icon={<Star className="w-3.5 h-3.5" />} label="Experience" value={applicant.experienceYears != null ? `${applicant.experienceYears} years` : '—'} />
                <InfoItem icon={<Briefcase className="w-3.5 h-3.5" />} label="Current Company" value={applicant.currentCompany || '—'} />
                <InfoItem icon={<DollarSign className="w-3.5 h-3.5" />} label="Expected Salary" value={applicant.expectedSalary ? formatCurrency(applicant.expectedSalary) : '—'} />
                <InfoItem icon={<Calendar className="w-3.5 h-3.5" />} label="Available From" value={applicant.availableFrom ? formatDate(applicant.availableFrom) : '—'} />
                {applicant.educationLevel && (
                  <InfoItem icon={<User className="w-3.5 h-3.5" />} label="Education" value={applicant.educationLevel} />
                )}
                {applicant.source && (
                  <InfoItem icon={<Globe className="w-3.5 h-3.5" />} label="Source" value={applicant.source} />
                )}
              </div>
            </section>

            {/* Links */}
            {(applicant.linkedIn || applicant.portfolio || applicant.resumeUrl) && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Links</h3>
                <div className="flex flex-wrap gap-2">
                  {applicant.linkedIn && (
                    <a href={applicant.linkedIn} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {applicant.portfolio && (
                    <a href={applicant.portfolio} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
                      <Globe className="w-3.5 h-3.5" />Portfolio <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {applicant.resumeUrl && (
                    <a href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />Resume
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Skills */}
            {Array.isArray(applicant.skills) && applicant.skills.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {applicant.skills.map((skill: string) => (
                    <span key={skill} className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium">{skill}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Applications History */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Application Details</h3>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Position Applied</span>
                  <span className="font-semibold text-slate-800">{applicant.job?.title || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Applied On</span>
                  <span className="font-semibold text-slate-800">{formatDate(applicant.createdAt)}</span>
                </div>
                {applicant.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Application Notes</p>
                    <p className="text-sm text-slate-700">{applicant.notes}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Interview History */}
            {Array.isArray(applicant.interviews) && applicant.interviews.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Interview History</h3>
                <div className="space-y-3">
                  {applicant.interviews.map((iv: any) => (
                    <div key={iv.id} className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800">{iv.type} Interview</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[iv.status] || 'bg-slate-100 text-slate-600'}`}>
                          {iv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(iv.scheduledAt)}</p>
                      {iv.evaluation && (
                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                          {[
                            { label: 'Technical', val: iv.evaluation.technicalSkills },
                            { label: 'Communication', val: iv.evaluation.communication },
                            { label: 'Problem Solving', val: iv.evaluation.problemSolving },
                            { label: 'Cultural Fit', val: iv.evaluation.culturalFit },
                          ].map(({ label, val }) => val != null && (
                            <div key={label} className="flex justify-between text-xs">
                              <span className="text-slate-500">{label}</span>
                              <span className={`font-bold ${scoreColor(val)}`}>{val}/10</span>
                            </div>
                          ))}
                          {iv.evaluation.overallScore != null && (
                            <div className="col-span-2 flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1">
                              <span className="text-slate-700">Overall Score</span>
                              <span className={scoreColor(iv.evaluation.overallScore)}>{iv.evaluation.overallScore}/10</span>
                            </div>
                          )}
                          {iv.evaluation.recommendation && (
                            <div className="col-span-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                iv.evaluation.recommendation === 'HIRE' ? 'bg-green-100 text-green-700' :
                                iv.evaluation.recommendation === 'REJECT' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{iv.evaluation.recommendation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Offer Details */}
            {applicant.offer && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Offer Details</h3>
                <div className="bg-green-50 rounded-2xl p-4 space-y-2 border border-green-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Offered Salary</span>
                    <span className="font-bold text-green-700">{formatCurrency(applicant.offer.salary)}</span>
                  </div>
                  {applicant.offer.startDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Start Date</span>
                      <span className="font-semibold text-slate-800">{formatDate(applicant.offer.startDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-semibold ${applicant.offer.status === 'ACCEPTED' ? 'text-green-700' : applicant.offer.status === 'REJECTED' ? 'text-red-700' : 'text-yellow-700'}`}>
                      {applicant.offer.status}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Notes */}
            {Array.isArray(applicant.notesList) && applicant.notesList.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Notes ({applicant.notesList.length})</h3>
                <div className="space-y-2">
                  {applicant.notesList.map((note: any) => (
                    <div key={note.id} className="bg-slate-50 rounded-xl p-3.5">
                      <p className="text-sm text-slate-700">{note.content}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown'} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Close</button>
          {applicant.email && (
            <a
              href={`mailto:${applicant.email}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-center"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
  )
}

function scoreColor(v: number) {
  return v >= 8 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-600'
}
