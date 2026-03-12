'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ScrollText, Plus, X, CheckCircle, Clock, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const POLICY_TYPE_COLORS: Record<string, string> = {
  HR: 'bg-blue-100 text-blue-700',
  SECURITY: 'bg-red-100 text-red-700',
  CONFIDENTIALITY: 'bg-purple-100 text-purple-700',
  CONDUCT: 'bg-orange-100 text-orange-700',
  IT: 'bg-cyan-100 text-cyan-700',
  FINANCIAL: 'bg-green-100 text-green-700',
  GENERAL: 'bg-slate-100 text-slate-600',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
}

const POLICY_TYPES = ['HR', 'SECURITY', 'CONFIDENTIALITY', 'CONDUCT', 'IT', 'FINANCIAL', 'GENERAL']
const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

export default function PoliciesPage() {
  const { data: session } = useSession()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ title: '', description: '', policyType: 'GENERAL', status: 'DRAFT' })
  const [saving, setSaving] = useState(false)

  const role = session?.user?.role || ''
  const isAdmin = ADMIN_ROLES.includes(role)

  async function loadPolicies() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && isAdmin) params.set('status', statusFilter)
      const res = await fetch(`/api/policies?${params}`)
      const d = await res.json()
      setPolicies(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load policies')
    }
    setLoading(false)
  }

  useEffect(() => { loadPolicies() }, [statusFilter, session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Policy created')
      setShowModal(false)
      setForm({ title: '', description: '', policyType: 'GENERAL', status: 'DRAFT' })
      loadPolicies()
    } catch {
      toast.error('Failed to create policy')
    }
    setSaving(false)
  }

  const activePolicies = policies.filter(p => p.status === 'ACTIVE').length
  const pendingCount = policies.filter(p => {
    const latestVersion = p.versions?.[0]
    if (!latestVersion) return true
    return !latestVersion.acceptances?.[0]?.accepted
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Company Policies</h1>
          <p className="text-slate-500 text-sm">
            {isAdmin ? 'Manage and publish company policies' : 'View and accept company policies'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <Link href="/dashboard/policies/compliance"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
              Compliance Report
            </Link>
          )}
          {isAdmin && (
            <button onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
              <Plus className="w-4 h-4" /> New Policy
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Policies</div>
          <div className="text-3xl font-black text-slate-900">{policies.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Active</div>
          <div className="text-3xl font-black text-green-700">{activePolicies}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">{isAdmin ? 'Drafts' : 'Pending Acceptance'}</div>
          <div className={`text-3xl font-black ${pendingCount > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{isAdmin ? policies.filter(p => p.status === 'DRAFT').length : pendingCount}</div>
        </div>
      </div>

      {/* Status Filter (admin only) */}
      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          {['', 'DRAFT', 'ACTIVE', 'ARCHIVED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* Policies List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-24 animate-pulse" />)}
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
          <ScrollText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
          <p>No policies found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy: any) => {
            const latestVersion = policy.versions?.[0]
            const acceptance = latestVersion?.acceptances?.[0]
            const isAccepted = acceptance?.accepted
            const versionCount = policy._count?.versions || 0
            return (
              <Link key={policy.id} href={`/dashboard/policies/${policy.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${POLICY_TYPE_COLORS[policy.policyType] || 'bg-slate-100 text-slate-600'}`}>
                        {policy.policyType}
                      </span>
                      {isAdmin && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[policy.status] || 'bg-slate-100 text-slate-600'}`}>
                          {policy.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{policy.title}</h3>
                    {policy.description && (
                      <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">{policy.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {latestVersion && (
                        <span className="text-xs text-slate-400">Version {latestVersion.versionNumber} · Effective {formatDate(latestVersion.effectiveDate)}</span>
                      )}
                      <span className="text-xs text-slate-400">{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isAdmin && latestVersion && (
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isAccepted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isAccepted ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Accepted</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5" /> Pending</>
                        )}
                      </div>
                    )}
                    <Eye className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Policy Modal (admin only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Policy</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Policy Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Code of Conduct" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select value={form.policyType} onChange={e => setForm(f => ({ ...f, policyType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this policy" rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
