'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export default function PolicyVersionPage() {
  const { data: session } = useSession()
  const params = useParams()
  const [versions, setVersions] = useState<any[]>([])
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [pRes, vRes] = await Promise.all([
        fetch(`/api/policies/${params.id}`),
        fetch(`/api/policies/${params.id}/versions`),
      ])
      const [p, v] = await Promise.all([pRes.json(), vRes.json()])
      setPolicy(p)
      setVersions(Array.isArray(v) ? v : [])
    } catch {
      toast.error('Failed to load version')
    }
    setLoading(false)
  }

  useEffect(() => { if (params.id) loadData() }, [params.id, params.versionId])

  const version = versions.find(v => v.id === params.versionId)
  const myAcceptance = version?.acceptances?.[0]
  const isAccepted = myAcceptance?.accepted
  const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']
  const isAdmin = ADMIN_ROLES.includes(session?.user?.role || '')

  async function handleAccept() {
    if (!version) return
    setAccepting(true)
    try {
      const res = await fetch(`/api/policies/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyVersionId: version.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Version accepted')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept')
    }
    setAccepting(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse h-64" />
      </div>
    )
  }

  if (!version) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Version not found</p>
        <Link href={`/dashboard/policies/${params.id}`} className="text-blue-600 text-sm hover:underline mt-2 block">Back to policy</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/policies/${params.id}`}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="text-sm text-slate-500 font-medium">{policy?.title}</div>
          <h1 className="text-xl font-black text-slate-900">Version {version.versionNumber}</h1>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div>
            <div className="text-sm font-semibold text-slate-700">Version {version.versionNumber}</div>
            <div className="text-xs text-slate-400">Effective from {formatDate(version.effectiveDate)} · Published {formatDate(version.createdAt)}</div>
          </div>
          <div className="flex items-center gap-3">
            {version.fileUrl && (
              <a href={version.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-3.5 h-3.5" /> View PDF
              </a>
            )}
            {isAccepted ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> Accepted
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Pending
              </div>
            )}
            {version.isLatest && (
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Latest</span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {version.content || <span className="text-slate-400 italic">No content.</span>}
          </div>
        </div>

        {/* Accept Section */}
        {!isAdmin && (
          <div className="px-6 pb-6">
            {isAccepted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">You accepted this version</p>
                  <p className="text-xs text-green-600">on {myAcceptance?.acceptedAt ? formatDate(myAcceptance.acceptedAt) : 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-orange-800 mb-1">Action Required</p>
                <p className="text-sm text-orange-700 mb-3">Please read this version and click Accept.</p>
                <button onClick={handleAccept} disabled={accepting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                  {accepting ? 'Accepting...' : 'I Accept This Version'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acceptances (admin only) */}
      {isAdmin && version._count?.acceptances > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 mb-2">Acceptance Summary</h3>
          <p className="text-sm text-slate-600">{version._count.acceptances} employee(s) have accepted this version.</p>
          <Link href="/dashboard/policies/compliance"
            className="text-blue-600 text-sm font-semibold hover:underline mt-2 block">
            View full compliance report →
          </Link>
        </div>
      )}
    </div>
  )
}
