'use client'
import { useEffect, useState } from 'react'
import { Plus, Briefcase, Users, Eye, Edit, Trash2, ChevronDown } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-red-100 text-red-700 border-red-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
}
const APPLICANT_STATUS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  SHORTLISTED: 'bg-purple-100 text-purple-700',
  INTERVIEWED: 'bg-yellow-100 text-yellow-700',
  OFFERED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [tab, setTab] = useState<'jobs'|'applicants'>('jobs')
  const [loading, setLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [selectedJobId, setSelectedJobId] = useState('')

  async function loadData() {
    setLoading(true)
    const [jr, ar, dr] = await Promise.all([
      fetch('/api/jobs'),
      fetch(`/api/applicants${selectedJobId ? `?jobId=${selectedJobId}` : ''}`),
      fetch('/api/departments'),
    ])
    const [j, a, d] = await Promise.all([jr.json(), ar.json(), dr.json()])
    setJobs(Array.isArray(j) ? j : [])
    setApplicants(Array.isArray(a) ? a : [])
    setDepartments(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [selectedJobId])

  async function deleteJob(id: string) {
    if (!confirm('Delete this job posting?')) return
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Job deleted')
    loadData()
  }

  async function updateApplicantStatus(id: string, status: string) {
    const res = await fetch(`/api/applicants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Update failed'); return }
    toast.success(`Applicant status updated to ${status}`)
    loadData()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Recruitment & ATS</h1>
          <p className="text-slate-500 text-sm">{jobs.filter(j=>j.status==='OPEN').length} open positions · {applicants.length} applicants</p>
        </div>
        <button onClick={() => { setEditingJob(null); setShowJobForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md">
          <Plus className="w-4 h-4" />Post Job
        </button>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 w-fit">
        {(['jobs','applicants'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} {t === 'jobs' ? `(${jobs.length})` : `(${applicants.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === 'jobs' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-16 text-center border border-slate-100">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-500 font-medium">No job postings yet</p>
            </div>
          ) : jobs.map((job: any) => (
            <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingJob(job); setShowJobForm(true) }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteJob(job.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{job.title}</h3>
              <p className="text-slate-500 text-sm mb-3 line-clamp-2">{job.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-medium">{job.department?.name || 'No dept'}</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-medium">{job.type}</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-medium">{job.location}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />{job._count?.applicants || 0} applicants
                  </span>
                </div>
                {job.salaryMin && (
                  <span className="text-xs font-semibold text-green-600">
                    {formatCurrency(job.salaryMin)}–{formatCurrency(job.salaryMax || 0)}
                  </span>
                )}
              </div>
              {job.deadline && (
                <p className="text-xs text-slate-400 mt-2">Deadline: {formatDate(job.deadline)}</p>
              )}
              <button onClick={() => { setSelectedJobId(job.id); setTab('applicants') }}
                className="mt-3 w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors">
                View Applicants →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-600">Filter by Job:</label>
              <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs">
                <option value="">All Jobs</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {applicants.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No applicants found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Applicant','Position','Contact','Applied','Status','Update Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {app.firstName?.[0]}{app.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{app.firstName} {app.lastName}</div>
                              <div className="text-slate-400 text-xs">{app.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-900 text-xs">{app.job?.title}</div>
                          <div className="text-slate-400 text-xs">{app.job?.department?.name}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{app.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(app.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${APPLICANT_STATUS[app.status]}`}>{app.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select value={app.status}
                            onChange={e => updateApplicantStatus(app.id, e.target.value)}
                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {['NEW','SHORTLISTED','INTERVIEWED','OFFERED','REJECTED'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showJobForm && (
        <JobFormModal
          job={editingJob}
          departments={departments}
          onClose={() => setShowJobForm(false)}
          onSave={() => { setShowJobForm(false); loadData(); toast.success(editingJob ? 'Job updated!' : 'Job posted!') }}
        />
      )}
    </div>
  )
}

function JobFormModal({ job, departments, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: job?.title || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    responsibilities: job?.responsibilities || '',
    departmentId: job?.departmentId || '',
    type: job?.type || 'Full-time',
    location: job?.location || 'Nairobi, Kenya',
    salaryMin: job?.salaryMin || '',
    salaryMax: job?.salaryMax || '',
    status: job?.status || 'OPEN',
    deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const url = job ? `/api/jobs/${job.id}` : '/api/jobs'
    const res = await fetch(url, {
      method: job ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{job ? 'Edit Job' : 'Post New Job'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title *</label>
              <input required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Description *</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the role..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Requirements</label>
              <textarea rows={3} value={form.requirements} onChange={e => setForm(p=>({...p,requirements:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Qualifications and requirements (one per line)..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department</label>
              <select value={form.departmentId} onChange={e => setForm(p=>({...p,departmentId:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select department...</option>
                {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Employment Type</label>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['Full-time','Part-time','Contract','Internship'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Min Salary (KES)</label>
              <input type="number" value={form.salaryMin} onChange={e => setForm(p=>({...p,salaryMin:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 80000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Max Salary (KES)</label>
              <input type="number" value={form.salaryMax} onChange={e => setForm(p=>({...p,salaryMax:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 150000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['OPEN','CLOSED','DRAFT'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Application Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p=>({...p,deadline:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : (job ? 'Update Job' : '📢 Post Job')}
          </button>
        </div>
      </div>
    </div>
  )
}
