'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Mail, FileText, RefreshCw, Trash2,
  Edit, Eye, Clock, CheckCircle, Send, ShieldAlert,
  Building2, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  FINAL: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LettersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const role = (session?.user as any)?.role
  const isAdmin = ADMIN_ROLES.includes(role)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const loadLetters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/letters')
      if (!res.ok) throw new Error()
      setLetters(await res.json())
    } catch {
      toast.error('Failed to load letters')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (role && !isAdmin) {
      router.replace('/dashboard')
    } else if (role) {
      loadLetters()
    }
  }, [role, isAdmin, loadLetters, router])

  const filtered = letters.filter(l =>
    !search ||
    l.subject.toLowerCase().includes(search.toLowerCase()) ||
    l.toName.toLowerCase().includes(search.toLowerCase()) ||
    l.letterNumber.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Delete this letter permanently?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/letters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Letter deleted')
      loadLetters()
    } catch {
      toast.error('Failed to delete')
    }
    setDeletingId(null)
  }

  if (!isAdmin) {
    return (
      <div className="py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-semibold">Access restricted to administrators</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Official Letters</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create and manage official company correspondence</p>
        </div>
        <Link href="/dashboard/sales/letters/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors shadow-md">
          <Plus className="w-4 h-4" />
          New Letter
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: letters.length, icon: <FileText className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Drafts', value: letters.filter(l => l.status === 'DRAFT').length, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Finalized', value: letters.filter(l => l.status === 'FINAL' || l.status === 'SENT').length, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by subject, recipient, or number..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
        </div>
      </div>

      {/* Letters list */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading letters...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Mail className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold text-lg">{search ? 'No letters match your search' : 'No letters yet'}</p>
          {!search && (
            <Link href="/dashboard/sales/letters/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
              <Plus className="w-4 h-4" /> Write First Letter
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map(letter => (
              <div key={letter.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 font-semibold">{letter.letterNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[letter.status] || 'bg-slate-100 text-slate-600'}`}>
                        {letter.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-0.5 truncate">{letter.subject}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {letter.toName}{letter.toOrganization ? ` — ${letter.toOrganization}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(letter.date)}
                      </span>
                    </div>
                    {letter.signedBy && (
                      <div className="text-xs text-slate-400 mt-0.5">Signed by: {letter.signedBy}{letter.signerTitle ? ` · ${letter.signerTitle}` : ''}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/dashboard/sales/letters/${letter.id}`}
                    className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link href={`/dashboard/sales/letters/${letter.id}?edit=1`}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </Link>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(letter.id)} disabled={deletingId === letter.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
