'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Briefcase, MapPin, Clock, DollarSign, Users, Search,
  Copy, ExternalLink, Share2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Job {
  id: string
  slug: string
  title: string
  department: string
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

function CareersContent() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '')

  useEffect(() => {
    fetch('/api/careers/jobs')
      .then(r => r.json())
      .then(d => setJobs(Array.isArray(d) ? d : d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const departments = Array.from(new Set(jobs.map(j => j.department))).sort()
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase())
    const matchDept = !deptFilter || j.department === deptFilter
    const matchType = !typeFilter || j.type === typeFilter
    return matchSearch && matchDept && matchType
  })

  function isDeadlineSoon(deadline?: string) {
    if (!deadline) return false
    const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days < 7
  }

  function formatDeadline(deadline: string) {
    return new Date(deadline).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formatSalary(min?: number, max?: number) {
    if (!min && !max) return null
    const fmt = (v: number) => `KES ${v.toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    if (max) return `Up to ${fmt(max)}`
    return null
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/careers/${slug}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
  }

  function shareWhatsApp(slug: string, title: string) {
    const url = `${window.location.origin}/careers/${slug}`
    const text = `Check out this job at Helvino: ${title} — ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareLinkedIn(slug: string) {
    const url = `${window.location.origin}/careers/${slug}`
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="h-1 bg-blue-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm leading-none">Helvino Technologies</div>
                <div className="text-xs text-slate-500">Careers Portal</div>
              </div>
            </div>
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium hidden sm:block">
              Employee Login →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            We&apos;re hiring!
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">Join Our Team</h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-8 leading-relaxed">
            Explore exciting career opportunities at Helvino Technologies Limited
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs by title, department, keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-3">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(deptFilter || typeFilter || search) && (
            <button
              onClick={() => { setDeptFilter(''); setTypeFilter(''); setSearch('') }}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear filters
            </button>
          )}
          <div className="ml-auto text-sm text-slate-500 font-medium">
            <span className="text-blue-600 font-bold">{filtered.length}</span> open position{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No open positions at this time</h3>
            <p className="text-slate-500">Check back soon! New opportunities are added regularly.</p>
            {(search || deptFilter || typeFilter) && (
              <button
                onClick={() => { setSearch(''); setDeptFilter(''); setTypeFilter('') }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Clear filters to see all jobs
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(job => {
              const salary = formatSalary(job.salaryMin, job.salaryMax)
              const deadlineSoon = isDeadlineSoon(job.deadline)
              const skills = Array.isArray(job.skills) ? job.skills : []

              return (
                <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col">
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title */}
                    <h2 className="text-lg font-bold text-slate-900 mb-3 leading-snug">{job.title}</h2>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <Briefcase className="w-3 h-3" />{job.department}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />{job.type}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{job.location}</span>
                    </div>

                    {/* Salary */}
                    {salary && (
                      <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium mb-3">
                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{salary}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{job.description}</p>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {skills.slice(0, 4).map(skill => (
                          <span key={skill} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium">{skill}</span>
                        ))}
                        {skills.length > 4 && (
                          <span className="text-slate-400 text-xs px-1 py-0.5">+{skills.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{job.positions} position{job.positions !== 1 ? 's' : ''}</span>
                      </div>
                      {job.deadline && (
                        <span className={`font-medium ${deadlineSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                          {deadlineSoon && '⚠ '}Closes {formatDeadline(job.deadline)}
                        </span>
                      )}
                    </div>

                    {/* Apply button */}
                    <Link href={`/careers/${job.slug}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors mb-3 block">
                      Apply Now
                    </Link>

                    {/* Share row */}
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-xs text-slate-400">Share:</span>
                      <button
                        onClick={() => copyLink(job.slug)}
                        title="Copy link"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => shareWhatsApp(job.slug, job.title)}
                        title="Share on WhatsApp"
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => shareLinkedIn(job.slug)}
                        title="Share on LinkedIn"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Employee Portal</Link>
            <span className="text-slate-300">|</span>
            <span>© {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function CareersPage() {
  return (
    <Suspense fallback={null}>
      <CareersContent />
    </Suspense>
  )
}
