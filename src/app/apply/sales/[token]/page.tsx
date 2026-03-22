'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { User, Mail, Phone, Briefcase, GraduationCap, CheckCircle, AlertTriangle, Building2 } from 'lucide-react'

export default function SalesAgentApplyPage() {
  const { token } = useParams() as { token: string }
  const [linkInfo, setLinkInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    currentCompany: '', experienceYears: '', educationLevel: '',
    expectedSalary: '', linkedIn: '', coverLetter: '', skills: '',
  })

  useEffect(() => {
    fetch(`/api/apply/sales/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setLinkInfo(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load application form'); setLoading(false) })
  }, [token])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/apply/sales/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          experienceYears: form.experienceYears || null,
          expectedSalary: form.expectedSalary || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !linkInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Not Available</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h1>
          <p className="text-slate-500 mb-4">
            Thank you for applying to join the sales team. Your application has been received and will be reviewed shortly.
          </p>
          <p className="text-slate-400 text-sm">You may close this window.</p>
        </div>
      </div>
    )
  }

  const manager = linkInfo?.manager

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white text-center shadow-lg">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black mb-1">Apply as Sales Agent</h1>
          {manager && (
            <p className="text-blue-200 text-sm">
              Referred by {manager.firstName} {manager.lastName}
              {manager.jobTitle ? ` — ${manager.jobTitle}` : ''}
            </p>
          )}
          <p className="text-blue-100 text-xs mt-2">Helvino Technologies Limited</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5 text-lg">Personal Information</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                <input required value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+254 7XX XXX XXX" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current / Last Company</label>
                <input value={form.currentCompany} onChange={e => set('currentCompany', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Years of Experience</label>
                <input type="number" min="0" value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Education Level</label>
                <select value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select...</option>
                  {['High School', 'Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Salary (KES/month)</label>
                <input type="number" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 50000" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">LinkedIn Profile URL</label>
              <input type="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Key Skills <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input value={form.skills} onChange={e => set('skills', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sales, CRM, Negotiation, B2B" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Why do you want to join our sales team? *</label>
              <textarea required rows={4} value={form.coverLetter} onChange={e => set('coverLetter', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself, your sales experience, and why you're a great fit..." />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © Helvino Technologies Limited. Your information is kept confidential.
        </p>
      </div>
    </div>
  )
}
