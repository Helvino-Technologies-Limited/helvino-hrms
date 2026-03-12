'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X, CheckCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']
const POLICY_TYPES = ['HR', 'SECURITY', 'CONFIDENTIALITY', 'CONDUCT', 'IT', 'FINANCIAL', 'GENERAL']

export default function PolicyDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [versionForm, setVersionForm] = useState({
    versionNumber: '1.0', content: '', effectiveDate: new Date().toISOString().split('T')[0], fileUrl: '',
  })
  const [editForm, setEditForm] = useState({ title: '', description: '', policyType: 'GENERAL', status: 'DRAFT' })

  const role = session?.user?.role || ''
  const isAdmin = ADMIN_ROLES.includes(role)

  async function loadPolicy() {
    setLoading(true)
    try {
      const res = await fetch(`/api/policies/${params.id}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setPolicy(d)
      setEditForm({ title: d.title, description: d.description || '', policyType: d.policyType, status: d.status })
    } catch {
      toast.error('Failed to load policy')
    }
    setLoading(false)
  }

  useEffect(() => { if (params.id) loadPolicy() }, [params.id])

  const latestVersion = policy?.versions?.find((v: any) => v.isLatest) || policy?.versions?.[0]
  const myAcceptance = latestVersion?.acceptances?.[0]
  const isAccepted = myAcceptance?.accepted

  async function handleAccept() {
    if (!latestVersion) { toast.error('No version to accept'); return }
    setAccepting(true)
    try {
      const res = await fetch(`/api/policies/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyVersionId: latestVersion.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Policy accepted')
      loadPolicy()
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept policy')
    }
    setAccepting(false)
  }

  async function handleAddVersion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/policies/${params.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Version added')
      setShowVersionModal(false)
      setVersionForm({ versionNumber: '1.0', content: '', effectiveDate: new Date().toISOString().split('T')[0], fileUrl: '' })
      loadPolicy()
    } catch {
      toast.error('Failed to add version')
    }
    setSaving(false)
  }

  async function handleEditPolicy(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/policies/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Policy updated')
      setShowEditModal(false)
      loadPolicy()
    } catch {
      toast.error('Failed to update policy')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this policy?')) return
    try {
      const res = await fetch(`/api/policies/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Policy deleted')
      router.push('/dashboard/policies')
    } catch {
      toast.error('Failed to delete policy')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse h-48" />
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Policy not found</p>
        <Link href="/dashboard/policies" className="text-blue-600 text-sm hover:underline mt-2 block">Back to policies</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/policies"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900">{policy.title}</h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{policy.policyType}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${policy.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : policy.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
              {policy.status}
            </span>
          </div>
          {policy.description && <p className="text-slate-500 text-sm mt-0.5">{policy.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowVersionModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Version
            </button>
            <button onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
              Edit
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-semibold text-xs hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Current Version Content */}
      {latestVersion ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div>
              <div className="font-bold text-slate-900">Version {latestVersion.versionNumber}</div>
              <div className="text-xs text-slate-400">Effective {formatDate(latestVersion.effectiveDate)}</div>
            </div>
            <div className="flex items-center gap-3">
              {isAccepted ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> You accepted this policy
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Pending your acceptance
                </div>
              )}
            </div>
          </div>

          {/* Policy Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {latestVersion.content || <span className="text-slate-400 italic">No content added yet.</span>}
            </div>
          </div>

          {/* Accept Button */}
          {!isAdmin && !isAccepted && (
            <div className="px-6 pb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-orange-800 font-semibold mb-1">Action Required</p>
                <p className="text-sm text-orange-700 mb-3">
                  Please read the above policy carefully and click "Accept" to acknowledge that you have read and understood it.
                </p>
                <button onClick={handleAccept} disabled={accepting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                  {accepting ? 'Accepting...' : 'I Accept This Policy'}
                </button>
              </div>
            </div>
          )}

          {!isAdmin && isAccepted && (
            <div className="px-6 pb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">Policy Accepted</p>
                  <p className="text-xs text-green-600">Accepted on {myAcceptance?.acceptedAt ? formatDate(myAcceptance.acceptedAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
          <p>No versions yet.</p>
          {isAdmin && (
            <button onClick={() => setShowVersionModal(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Add first version
            </button>
          )}
        </div>
      )}

      {/* Version History */}
      {policy.versions?.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Version History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {policy.versions.map((v: any) => (
              <Link key={v.id} href={`/dashboard/policies/${params.id}/versions/${v.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Version {v.versionNumber}</div>
                  <div className="text-slate-400 text-xs">Effective {formatDate(v.effectiveDate)} · Added {formatDate(v.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {v.isLatest && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Latest</span>}
                  <span className="text-xs text-slate-400">{v._count?.acceptances || 0} acceptances</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Policy Version</h2>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddVersion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Version Number *</label>
                  <input required value={versionForm.versionNumber} onChange={e => setVersionForm(f => ({ ...f, versionNumber: e.target.value }))}
                    placeholder="e.g. 1.0, 1.1, 2.0" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Effective Date *</label>
                  <input required type="date" value={versionForm.effectiveDate} onChange={e => setVersionForm(f => ({ ...f, effectiveDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Policy Content *</label>
                <textarea required value={versionForm.content} onChange={e => setVersionForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write the full policy content here..." rows={12}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">File URL (optional)</label>
                <input value={versionForm.fileUrl} onChange={e => setVersionForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://... (link to PDF version)" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVersionModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Publishing...' : 'Publish Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Policy</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditPolicy} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                <input required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select value={editForm.policyType} onChange={e => setEditForm(f => ({ ...f, policyType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
