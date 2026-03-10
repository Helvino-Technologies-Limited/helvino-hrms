'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Briefcase, MapPin, Clock, DollarSign, Users, Calendar,
  Copy, ExternalLink, Share2, ChevronLeft, CheckCircle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Job {
  id: string
  slug: string
  title: string
  department: { id: string; name: string } | string
  type: string
  location: string
  salaryMin?: number
  salaryMax?: number
  description: string
  responsibilities?: string
  requirements?: string
  skills: string[]
  benefits?: string
  deadline?: string
  positions: number
  postedAt: string
  status: string
}

const EDUCATION_LEVELS = [
  'High School',
  'Diploma',
  "Bachelor's",
  "Master's",
  'PhD',
  'Other',
]

interface FormData {
  fullName: string
  email: string
  phone: string
  linkedinUrl: string
  portfolioUrl: string
  currentCompany: string
  experienceYears: string
  educationLevel: string
  expectedSalary: string
  availableFrom: string
  skills: string
  coverLetter: string
}

const defaultForm: FormData = {
  fullName: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  portfolioUrl: '',
  currentCompany: '',
  experienceYears: '',
  educationLevel: '',
  expectedSalary: '',
  availableFrom: '',
  skills: '',
  coverLetter: '',
}

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch('/api/careers/jobs')
      .then(r => r.json())
      .then(d => {
        const jobs: Job[] = Array.isArray(d) ? d : d.jobs || []
        const found = jobs.find(j => j.slug === slug)
        if (found) {
          setJob(found)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function formatSalary(min?: number, max?: number) {
    if (!min && !max) return null
    const fmt = (v: number) => `KES ${v.toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)} / month`
    if (min) return `From ${fmt(min)} / month`
    if (max) return `Up to ${fmt(max)} / month`
    return null
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function isDeadlineSoon(deadline?: string) {
    if (!deadline) return false
    const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days < 7
  }

  function getJobUrl() {
    return `${window.location.origin}/careers/${slug}`
  }

  function copyLink() {
    navigator.clipboard.writeText(getJobUrl()).then(() => toast.success('Link copied!'))
  }

  function shareLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getJobUrl())}`, '_blank')
  }

  function shareWhatsApp() {
    const text = `Check out this job at Helvino: ${job?.title} — ${getJobUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareTwitter() {
    const text = `Exciting job opportunity at Helvino Technologies: ${job?.title}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getJobUrl())}`, '_blank')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!job) return
    setSubmitting(true)
    setFormError('')

    try {
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          firstName: form.fullName.trim().split(' ')[0] || form.fullName.trim(),
          lastName: form.fullName.trim().split(' ').slice(1).join(' ') || '.',
          email: form.email,
          phone: form.phone || undefined,
          linkedIn: form.linkedinUrl || undefined,
          portfolio: form.portfolioUrl || undefined,
          currentCompany: form.currentCompany || undefined,
          experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
          educationLevel: form.educationLevel || undefined,
          expectedSalary: form.expectedSalary ? parseFloat(form.expectedSalary) : undefined,
          availableFrom: form.availableFrom || undefined,
          skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          coverLetter: form.coverLetter,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409 || data.error?.toLowerCase().includes('already')) {
          setFormError('You have already applied for this position with this email address.')
        } else {
          setFormError(data.error || 'Something went wrong. Please try again.')
        }
        return
      }

      setSubmitted(true)
      toast.success('Application submitted successfully!')
    } catch {
      setFormError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm">
          <div className="h-1 bg-blue-600" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/careers" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" />Back to Careers
            </Link>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Job Not Found</h1>
          <p className="text-slate-500 mb-8">This position may have been filled or the link may be incorrect.</p>
          <Link href="/careers" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors inline-block">
            View All Openings
          </Link>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax)
  const deadlineSoon = isDeadlineSoon(job.deadline)
  const skills = Array.isArray(job.skills) ? job.skills : []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="h-1 bg-blue-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/careers" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Careers
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm hidden sm:block">Helvino Technologies</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{job.title}</h1>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Briefcase className="w-3.5 h-3.5" />{typeof job.department === "object" ? job.department?.name : job.department}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />{job.type}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5" />{job.location}
            </span>
            {salary && (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                <DollarSign className="w-3.5 h-3.5" />{salary}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            {job.postedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Posted {formatDate(job.postedAt)}</span>
              </div>
            )}
            {job.deadline && (
              <div className={`flex items-center gap-1.5 font-medium ${deadlineSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                <Clock className="w-4 h-4" />
                <span>{deadlineSoon && '⚠ '}Application deadline: {formatDate(job.deadline)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{job.positions} open position{job.positions !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 font-medium mr-1">Share:</span>
            <button onClick={copyLink}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
              <Copy className="w-3.5 h-3.5" />Copy Link
            </button>
            <button onClick={shareLinkedIn}
              className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
              <ExternalLink className="w-3.5 h-3.5" />LinkedIn
            </button>
            <button onClick={shareWhatsApp}
              className="inline-flex items-center gap-1.5 border border-green-200 text-green-600 hover:bg-green-50 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
              <Share2 className="w-3.5 h-3.5" />WhatsApp
            </button>
            <button onClick={shareTwitter}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
              <ExternalLink className="w-3.5 h-3.5" />X / Twitter
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Job Details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About this Role</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Responsibilities</h2>
                <div className="space-y-2">
                  {job.responsibilities.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{line.replace(/^[-•*]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Requirements</h2>
                <div className="space-y-2">
                  {job.requirements.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{line.replace(/^[-•*]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-lg font-medium border border-blue-100">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Benefits</h2>
                <div className="space-y-2">
                  {job.benefits.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{line.replace(/^[-•*]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Application Form */}
          <div className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-5">
                <h2 className="text-lg font-bold text-white">Apply for this position</h2>
                <p className="text-blue-100 text-sm mt-0.5">{job.title} · Helvino Technologies</p>
              </div>

              {submitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
                  <p className="text-slate-600 text-sm mb-1">Thank you for your interest in the <strong>{job.title}</strong> role.</p>
                  <p className="text-slate-500 text-sm">We&apos;ll review your application and get back to you within 5–7 business days.</p>
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <Link href="/careers" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      ← Browse more openings
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {formError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                    <input
                      name="fullName" required value={form.fullName} onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                    <input
                      type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange}
                      placeholder="07XXXXXXXX"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">LinkedIn Profile URL</label>
                    <input
                      name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Portfolio / GitHub URL</label>
                    <input
                      name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Current Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Company</label>
                    <input
                      name="currentCompany" value={form.currentCompany} onChange={handleChange}
                      placeholder="Where do you currently work?"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Experience + Education */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Years of Experience</label>
                      <input
                        type="number" name="experienceYears" min="0" max="50"
                        value={form.experienceYears} onChange={handleChange}
                        placeholder="e.g. 3"
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Education Level</label>
                      <select
                        name="educationLevel" value={form.educationLevel} onChange={handleChange}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Select...</option>
                        {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Expected Salary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Salary (KES)</label>
                    <input
                      type="number" name="expectedSalary" min="0"
                      value={form.expectedSalary} onChange={handleChange}
                      placeholder="e.g. 80000"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Available From */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Available From</label>
                    <input
                      type="date" name="availableFrom" value={form.availableFrom} onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Skills (comma-separated)</label>
                    <input
                      name="skills" value={form.skills} onChange={handleChange}
                      placeholder="e.g. React, Node.js, TypeScript"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cover Letter *</label>
                    <textarea
                      name="coverLetter" required rows={5}
                      value={form.coverLetter} onChange={handleChange}
                      placeholder="Tell us why you're a great fit for this role..."
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    By applying you agree to our privacy policy. Your information will only be used for recruitment purposes.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">Helvino Technologies Limited</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/careers" className="hover:text-blue-600 transition-colors">All Jobs</Link>
            <span className="text-slate-300">|</span>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Employee Portal</Link>
            <span className="text-slate-300">|</span>
            <span>© {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
