'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Eye, MessageCircle, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, RefreshCw, UserCheck, Briefcase,
  DollarSign, Calendar, Filter,
} from 'lucide-react'

type Offer = {
  id: string
  applicantId: string
  salary: number
  startDate: string | null
  probationPeriod: number | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  sentAt: string | null
  respondedAt: string | null
  notes: string | null
  applicant: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    job: { id: string; title: string } | null
    onboardingToken?: string
    offerLetterContent?: string | null
  }
  createdBy: { firstName: string; lastName: string } | null
  createdAt: string
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  ACCEPTED:  { label: 'Accepted',  color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-slate-100 text-slate-600 border-slate-200',   icon: AlertCircle },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildWhatsAppMessage(offer: Offer) {
  const name = `${offer.applicant.firstName} ${offer.applicant.lastName}`
  const position = offer.applicant.job?.title || 'the position'
  const salary = fmt(offer.salary)
  const startDate = offer.startDate ? fmtDate(offer.startDate) : 'To be communicated'
  const probation = offer.probationPeriod ? `${offer.probationPeriod} months` : '3 months'
  const portalBase = typeof window !== 'undefined' ? window.location.origin : 'https://helvinocrm.org'
  const portalLink = offer.applicant.onboardingToken
    ? `${portalBase}/onboarding/${offer.applicant.onboardingToken}`
    : null

  let msg = `*Job Offer — Helvino Technologies Ltd*\n\n`
  msg += `Dear ${name},\n\n`
  msg += `We are pleased to formally extend you an employment offer at Helvino Technologies Ltd.\n\n`
  msg += `*Offer Details:*\n`
  msg += `• Position: ${position}\n`
  msg += `• Gross Salary: ${salary}/month\n`
  msg += `• Start Date: ${startDate}\n`
  msg += `• Probation Period: ${probation}\n\n`
  if (portalLink) {
    msg += `*Document Submission Portal:*\n${portalLink}\n\n`
  }
  msg += `Please review your formal offer letter and submit the required onboarding documents by the stipulated deadline.\n\n`
  msg += `For any queries: helvinotechltd@gmail.com | 0110421320\n\n`
  msg += `_Helvino Technologies Ltd — IT Infrastructure · Software Development · Cybersecurity · CCTV_`
  return msg
}

export default function OfferLettersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  function load() {
    setLoading(true)
    fetch('/api/recruitment/offers')
      .then(r => r.json())
      .then(data => { setOffers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = offers.filter(o => {
    const name = `${o.applicant.firstName} ${o.applicant.lastName}`.toLowerCase()
    const pos = o.applicant.job?.title?.toLowerCase() || ''
    const matchSearch = !search || name.includes(search.toLowerCase()) || pos.includes(search.toLowerCase()) || o.applicant.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'PENDING').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    rejected: offers.filter(o => o.status === 'REJECTED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Offer Letters</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and share employment offer letters with candidates</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Offers', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Accepted', value: stats.accepted, icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidate, position…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-500">No offer letters found</p>
            <p className="text-sm mt-1">Offer letters are generated from the Applications page.</p>
            <Link
              href="/dashboard/recruitment/applications"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Applications
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Position</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Salary</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Start Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Sent</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(offer => {
                  const cfg = STATUS_CONFIG[offer.status]
                  const StatusIcon = cfg.icon
                  const waMsg = buildWhatsAppMessage(offer)
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {offer.applicant.firstName} {offer.applicant.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{offer.applicant.email}</div>
                      </td>

                      {/* Position */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {offer.applicant.job?.title || '—'}
                        </div>
                      </td>

                      {/* Salary */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {fmt(offer.salary)}
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {fmtDate(offer.startDate)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Sent */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {fmtDate(offer.sentAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/recruitment/applications/${offer.applicantId}/offer-letter`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Letter
                          </Link>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {filtered.length} offer letter{filtered.length !== 1 ? 's' : ''} shown.
          To generate a new offer letter, open an application and click "Offer Letter".
        </p>
      )}
    </div>
  )
}
