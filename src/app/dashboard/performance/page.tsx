'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Star, Target, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PerformancePage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const isHR = ['SUPER_ADMIN','HR_MANAGER','DEPARTMENT_HEAD'].includes(session?.user?.role || '')

  async function loadData() {
    setLoading(true)
    const [rr, er] = await Promise.all([
      fetch('/api/performance'),
      isHR ? fetch('/api/employees') : Promise.resolve({ json: () => [] }),
    ])
    const [r, e] = await Promise.all([rr.json(), er.json()])
    setReviews(Array.isArray(r) ? r : [])
    setEmployees(Array.isArray(e) ? e : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Performance Management</h1>
          <p className="text-slate-500 text-sm">{reviews.length} reviews · Avg rating: {avgRating}/5</p>
        </div>
        {isHR && (
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md">
            <Plus className="w-4 h-4" />New Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: Star, color: 'from-yellow-400 to-orange-500' },
          { label: 'Avg Rating', value: `${avgRating}/5`, icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
          { label: 'Employees Reviewed', value: new Set(reviews.map(r=>r.employeeId)).size, icon: Target, color: 'from-emerald-500 to-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`bg-gradient-to-br ${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="text-white" style={{width:'18px',height:'18px'}} />
            </div>
            <div className="text-2xl font-black text-slate-900">{s.value}</div>
            <div className="text-slate-500 text-sm font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Star className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No performance reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{r.employee?.firstName} {r.employee?.lastName}</div>
                    <div className="text-slate-500 text-xs">{r.employee?.jobTitle} · {r.employee?.department?.name}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} />
                    ))}
                    <span className="ml-1 font-black text-slate-900">{r.rating}/5</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-1">{r.period}</div>
                </div>
              </div>
              {r.comments && (
                <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3 mb-2">{r.comments}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                {r.strengths && (
                  <div className="flex-1 min-w-48">
                    <div className="text-xs font-bold text-green-700 mb-1">✅ Strengths</div>
                    <p className="text-slate-600 text-xs bg-green-50 rounded-lg p-2">{r.strengths}</p>
                  </div>
                )}
                {r.improvements && (
                  <div className="flex-1 min-w-48">
                    <div className="text-xs font-bold text-amber-700 mb-1">🎯 Areas for Improvement</div>
                    <p className="text-slate-600 text-xs bg-amber-50 rounded-lg p-2">{r.improvements}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-slate-400 text-xs">
                  Reviewed by: <span className="font-semibold text-slate-600">{r.reviewer?.firstName} {r.reviewer?.lastName}</span>
                </div>
                <div className="text-slate-400 text-xs">{formatDate(r.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ReviewFormModal
          employees={employees}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success('Review submitted!') }}
        />
      )}
    </div>
  )
}

function ReviewFormModal({ employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employeeId: '', period: '', rating: '3',
    comments: '', strengths: '', improvements: '', goals: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">New Performance Review</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Employee *</label>
            <select required value={form.employeeId} onChange={e => setForm(p=>({...p,employeeId:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select employee...</option>
              {employees.filter((e:any)=>e.employmentStatus==='ACTIVE').map((e:any) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.jobTitle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Review Period *</label>
            <input required value={form.period} onChange={e => setForm(p=>({...p,period:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Q1 2025, Annual 2024" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Rating *</label>
            <div className="flex items-center gap-3">
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setForm(p=>({...p,rating:String(n)}))}
                  className={`w-10 h-10 rounded-xl font-bold text-lg transition-all ${parseInt(form.rating) >= n ? 'bg-yellow-400 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-yellow-100'}`}>
                  {n}
                </button>
              ))}
              <span className="text-slate-500 text-sm font-semibold ml-2">{form.rating}/5 — {['','Poor','Fair','Good','Very Good','Excellent'][parseInt(form.rating)]}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Overall Comments</label>
            <textarea rows={3} value={form.comments} onChange={e => setForm(p=>({...p,comments:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Overall performance summary..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Strengths</label>
            <textarea rows={2} value={form.strengths} onChange={e => setForm(p=>({...p,strengths:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Key strengths observed..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Areas for Improvement</label>
            <textarea rows={2} value={form.improvements} onChange={e => setForm(p=>({...p,improvements:e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Development areas..." />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : '⭐ Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
