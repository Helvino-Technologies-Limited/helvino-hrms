'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Clock, DollarSign, ChevronLeft, Send, AlertCircle, CheckCircle, Briefcase } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/jobs?status=OPEN').then(r => r.json()).then(d => {
      setJobs(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-slate-900">Helvino Technologies</span>
              <span className="text-slate-400 text-sm ml-2">Careers</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">← Back to Website</Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">Employee Portal</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Join Helvino Technologies</h1>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto">Build the future of IT in Kenya. We're looking for talented people to join our growing team.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {['Competitive Salary','Health Benefits','Learning & Growth','Remote Flexibility','Great Team'].map(b => (
              <span key={b} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-sm px-3 py-1.5 rounded-full font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />{b}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium text-lg">No open positions right now</p>
            <p className="text-slate-400 text-sm mt-1">Send your CV to <a href="mailto:careers@helvino.org" className="text-blue-600 hover:underline">careers@helvino.org</a></p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {jobs.map((job: any) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">OPEN</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">{job.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.department && <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{job.department.name}</span>}
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4">{job.description}</p>
                {job.salaryMin && (
                  <p className="text-sm font-semibold text-green-600 flex items-center gap-1 mb-3">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(job.salaryMin)} – {formatCurrency(job.salaryMax || 0)} / month
                  </p>
                )}
                {job.deadline && <p className="text-xs text-slate-400 mb-4">Deadline: {formatDate(job.deadline)}</p>}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setSelectedJob(job)}
                    className="flex-1 border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    View Details
                  </button>
                  <button onClick={() => { setSelectedJob(job); setShowForm(true) }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && !showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedJob.department && <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-semibold">{selectedJob.department.name}</span>}
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-semibold">{selectedJob.type}</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-semibold">{selectedJob.location}</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">About this Role</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>
              {selectedJob.requirements && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Requirements</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}
              {selectedJob.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Responsibilities</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedJob.responsibilities}</p>
                </div>
              )}
              {selectedJob.salaryMin && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 font-semibold">Salary Range: {formatCurrency(selectedJob.salaryMin)} – {formatCurrency(selectedJob.salaryMax || 0)} / month</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <button onClick={() => setSelectedJob(null)} className="flex-1 border border-slate-200 bg-white text-slate-700 py-2.5 rounded-xl font-semibold text-sm">Close</button>
              <button onClick={() => setShowForm(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && selectedJob && (
        <ApplyModal
          job={selectedJob}
          onClose={() => { setShowForm(false); setSelectedJob(null); setSubmitted(false) }}
          onSuccess={() => setSubmitted(true)}
          submitted={submitted}
        />
      )}
    </div>
  )
}

function ApplyModal({ job, onClose, onSuccess, submitted }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', coverLetter: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/applicants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, jobId: job.id }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSuccess()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Apply — {job.title}</h2>
            <p className="text-slate-500 text-xs">Helvino Technologies Limited</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Application Submitted!</h3>
            <p className="text-slate-600 mb-1">Thank you for applying for <strong>{job.title}</strong></p>
            <p className="text-slate-500 text-sm">We'll review your application and reach out within 5–7 business days.</p>
            <p className="text-slate-400 text-sm mt-3">Check your email for a confirmation message.</p>
            <button onClick={onClose} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {[['firstName','First Name'],['lastName','Last Name']].map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{l} *</label>
                  <input required value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={l} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address *</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="07XXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cover Letter</label>
              <textarea rows={5} value={form.coverLetter} onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Tell us why you're a great fit for this role..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Submit Application</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
