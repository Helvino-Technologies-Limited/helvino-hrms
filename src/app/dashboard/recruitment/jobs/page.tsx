'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Briefcase, Users, Edit, Trash2, Eye,
  Share2, MapPin, Clock, DollarSign, X, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-red-100 text-red-700 border-red-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
}

const ALL_STATUSES = ['All', 'OPEN', 'CLOSED', 'DRAFT', 'ARCHIVED']

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Director', 'Executive']
const EDUCATION_REQS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certification", "Any"]

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [jr, dr] = await Promise.all([
        fetch('/api/recruitment/jobs'),
        fetch('/api/departments'),
      ])
      const [j, d] = await Promise.all([jr.json(), dr.json()])
      setJobs(Array.isArray(j) ? j : (j?.jobs ?? []))
      setDepartments(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load jobs')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function deleteJob(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/recruitment/jobs/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete job'); return }
    toast.success('Job deleted')
    loadData()
  }

  function copyShareLink(job: any) {
    const link = `${window.location.origin}/careers/${job.slug ?? job.id}`
    navigator.clipboard.writeText(link)
      .then(() => toast.success('Share link copied!'))
      .catch(() => toast.error('Could not copy link'))
  }

  const filtered = jobs.filter(job => {
    const matchSearch = search === '' ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || job.status === statusFilter
    return matchSearch && matchStatus
  })

  const openCount = jobs.filter(j => j.status === 'OPEN').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Job Postings</h1>
          <p className="text-slate-500 text-sm">
            {openCount} open · {jobs.length} total
          </p>
        </div>
        <button
          onClick={() => { setEditingJob(null); setShowModal(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, departments, locations..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
          <Briefcase className="w-14 h-14 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-semibold text-lg">No jobs found</p>
          <p className="text-slate-400 text-sm mt-1">
            {search || statusFilter !== 'All' ? 'Try adjusting your filters' : 'Post your first job to get started'}
          </p>
          {!search && statusFilter === 'All' && (
            <button
              onClick={() => { setEditingJob(null); setShowModal(true) }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Post Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((job: any) => {
            const isDeadlinePast = job.deadline && new Date(job.deadline) < new Date()
            const skills: string[] = Array.isArray(job.skills) ? job.skills : (job.skills ? String(job.skills).split(',').map((s: string) => s.trim()).filter(Boolean) : [])
            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{job.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {job.department?.name && (
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-lg font-medium">
                            {job.department.name}
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg font-medium">
                          {job.type || 'Full-time'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons - show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Link
                      href={`/dashboard/recruitment/jobs/${job.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View job"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => { setEditingJob(job); setShowModal(true) }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit job"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyShareLink(job)}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteJob(job.id, job.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Location & positions */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  )}
                  {job.positions && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {job.positions} position{job.positions !== 1 ? 's' : ''}
                    </span>
                  )}
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salaryMin ? formatCurrency(job.salaryMin) : '—'}
                      {job.salaryMax ? ` – ${formatCurrency(job.salaryMax)}` : ''}
                    </span>
                  )}
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {skills.slice(0, 3).map((skill: string) => (
                      <span key={skill} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 3 && (
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">
                        +{skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Status + applicants */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${JOB_STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {job.status}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {job._count?.applicants ?? job.applicantCount ?? 0} applicants
                    </span>
                  </div>
                  {job.deadline && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${isDeadlinePast ? 'text-red-500' : 'text-slate-400'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isDeadlinePast ? 'Expired ' : 'Closes '}
                      {formatDate(job.deadline)}
                    </span>
                  )}
                </div>

                {/* View Applicants */}
                <Link
                  href={`/dashboard/recruitment/applications?jobId=${job.id}`}
                  className="mt-3 w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors"
                >
                  View Applicants →
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <CreateEditJobModal
          job={editingJob}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

function CreateEditJobModal({ job, departments, onClose, onSave }: {
  job: any
  departments: any[]
  onClose: () => void
  onSave: () => void
}) {
  const isEdit = !!job
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdJob, setCreatedJob] = useState<any>(null)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(() => {
    if (!job?.skills) return []
    if (Array.isArray(job.skills)) return job.skills
    return String(job.skills).split(',').map((s: string) => s.trim()).filter(Boolean)
  })

  const [form, setForm] = useState({
    title: job?.title ?? '',
    description: job?.description ?? '',
    responsibilities: job?.responsibilities ?? '',
    requirements: job?.requirements ?? '',
    departmentId: job?.departmentId ?? '',
    type: job?.type ?? 'Full-time',
    location: job?.location ?? 'Siaya, Kenya',
    positions: job?.positions ?? 1,
    salaryMin: job?.salaryMin ?? '',
    salaryMax: job?.salaryMax ?? '',
    experienceLevel: job?.experienceLevel ?? '',
    educationReq: job?.educationReq ?? '',
    benefits: job?.benefits ?? '',
    status: job?.status ?? 'OPEN',
    deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
  })

  function addSkill() {
    const s = skillInput.trim()
    if (!s) return
    // support comma-separated
    const parts = s.split(',').map(p => p.trim()).filter(Boolean)
    const newSkills = [...new Set([...skills, ...parts])]
    setSkills(newSkills)
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Job title is required'); return }
    if (!form.description.trim()) { setError('Job description is required'); return }
    setLoading(true)
    setError('')

    const payload = { ...form, skills }

    const url = isEdit ? `/api/recruitment/jobs/${job.id}` : '/api/recruitment/jobs'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    toast.success(isEdit ? 'Job updated!' : 'Job posted!')
    if (!isEdit) {
      setCreatedJob(data)
    } else {
      onSave()
    }
    setLoading(false)
  }

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const shareLink = createdJob ? `${typeof window !== 'undefined' ? window.location.origin : ''}/careers/${createdJob.slug ?? createdJob.id}` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Edit Job Posting' : 'Post New Job'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {createdJob ? (
          // Success state with share link
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-5 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Job Posted!</h3>
              <p className="text-slate-500 text-sm">"{createdJob.title}" is now live on the careers portal.</p>
            </div>
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-2">Share Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 truncate">
                  {shareLink}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink)
                      .then(() => toast.success('Link copied!'))
                      .catch(() => toast.error('Could not copy'))
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">
                Close
              </button>
              <Link
                href={`/dashboard/recruitment/jobs/${createdJob.id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm text-center transition-colors"
              >
                View Job
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
                  <span className="flex-1">{error}</span>
                  <button type="button" onClick={() => setError('')}><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Describe the role and its impact..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                {/* Responsibilities */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Responsibilities</label>
                  <textarea
                    rows={3}
                    value={form.responsibilities}
                    onChange={e => set('responsibilities', e.target.value)}
                    placeholder="Key responsibilities (one per line)..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                {/* Requirements */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Requirements</label>
                  <textarea
                    rows={3}
                    value={form.requirements}
                    onChange={e => set('requirements', e.target.value)}
                    placeholder="Qualifications and requirements (one per line)..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={e => set('departmentId', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select department...</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Employment Type</label>
                  <select
                    value={form.type}
                    onChange={e => set('type', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
                  <input
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="e.g. Siaya, Kenya"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Positions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">No. of Positions</label>
                  <input
                    type="number"
                    min={1}
                    value={form.positions}
                    onChange={e => set('positions', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Salary Min */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Min Salary (KES)</label>
                  <input
                    type="number"
                    value={form.salaryMin}
                    onChange={e => set('salaryMin', e.target.value)}
                    placeholder="e.g. 80000"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Salary Max */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Max Salary (KES)</label>
                  <input
                    type="number"
                    value={form.salaryMax}
                    onChange={e => set('salaryMax', e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Experience Level</label>
                  <select
                    value={form.experienceLevel}
                    onChange={e => set('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Any level</option>
                    {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* Education Requirement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Education Requirement</label>
                  <select
                    value={form.educationReq}
                    onChange={e => set('educationReq', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Not specified</option>
                    {EDUCATION_REQS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Skills */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Skills</label>
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press Enter or comma..."
                      className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.map(skill => (
                        <span
                          key={skill}
                          className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-indigo-400 hover:text-indigo-700 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Benefits</label>
                  <textarea
                    rows={2}
                    value={form.benefits}
                    onChange={e => set('benefits', e.target.value)}
                    placeholder="e.g. Health insurance, remote work, SACCO..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {['OPEN', 'CLOSED', 'DRAFT', 'ARCHIVED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Application Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => set('deadline', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : isEdit ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
