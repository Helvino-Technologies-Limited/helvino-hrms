'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Megaphone, Trash2, AlertTriangle, Info, Bell, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_CONFIG: Record<string, any> = {
  LOW: { cls: 'bg-slate-100 text-slate-600 border-slate-200', bar: 'bg-slate-400' },
  NORMAL: { cls: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' },
  HIGH: { cls: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-500' },
  URGENT: { cls: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500' },
}

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const isHR = ['SUPER_ADMIN','HR_MANAGER'].includes(session?.user?.role || '')

  async function loadData() {
    setLoading(true)
    const res = await fetch('/api/announcements?limit=50')
    const data = await res.json()
    setAnnouncements(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Announcement deleted')
    loadData()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm">{announcements.length} active announcements</p>
        </div>
        {isHR && (
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md">
            <Plus className="w-4 h-4" />New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann: any) => {
            const config = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL
            return (
              <div key={ann.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md group relative overflow-hidden ${config.cls}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} />
                <div className="flex items-start justify-between gap-3 ml-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${config.cls}`}>{ann.priority}</span>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium border border-slate-200">{ann.type}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {ann.author?.firstName?.[0]}
                        </div>
                        {ann.author?.firstName} {ann.author?.lastName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(ann.publishedAt)}</span>
                      {ann.expiresAt && (
                        <><span>·</span><span className="text-orange-500">Expires {formatDate(ann.expiresAt)}</span></>
                      )}
                    </div>
                  </div>
                  {isHR && (
                    <button onClick={() => handleDelete(ann.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <AnnouncementFormModal
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success('Announcement posted!') }}
        />
      )}
    </div>
  )
}

function AnnouncementFormModal({ onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', content: '', type: 'GENERAL', priority: 'NORMAL', expiresAt: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">New Announcement</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title *</label>
            <input required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Announcement title..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Content *</label>
            <textarea required rows={5} value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Write your announcement here..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['GENERAL','DEPARTMENT','POLICY','EVENT'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['LOW','NORMAL','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Expiry Date (optional)</label>
            <input type="date" value={form.expiresAt} onChange={e => setForm(p=>({...p,expiresAt:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...</> : '📢 Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
