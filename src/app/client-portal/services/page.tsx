'use client'
import { useEffect, useState } from 'react'
import { Plus, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2, X } from 'lucide-react'

const SERVICE_TYPES = [
  'Software Development',
  'Website Development',
  'CCTV Installation',
  'Wi-Fi / Network Installation',
  'Cybersecurity Services',
  'IT Consultancy',
  'System Maintenance',
  'Domain & Hosting',
  'Other',
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  REVIEWING: 'bg-blue-100 text-blue-700',
  QUOTED: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-cyan-100 text-cyan-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    serviceType: '',
    description: '',
    businessNeeds: '',
    budget: '',
    timeline: '',
  })

  useEffect(() => {
    fetch('/api/client/services')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRequests(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/client/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to submit request')
    } else {
      setRequests(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', serviceType: '', description: '', businessNeeds: '', budget: '', timeline: '' })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">Request new services from Helvino Technologies</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Service Request</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Request Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  placeholder="e.g. School Management System" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Type *</label>
                <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" required>
                  <option value="">Select a service</option>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                  rows={3} placeholder="Describe what you need..." required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Needs</label>
                <textarea value={form.businessNeeds} onChange={e => setForm(f => ({ ...f, businessNeeds: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                  rows={2} placeholder="What problem does this solve?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Budget (KES, optional)</label>
                  <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    placeholder="e.g. 150000" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Timeline</label>
                  <input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    placeholder="e.g. 3 months" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No service requests yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Submit a request to get started with a new project.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{req.requestNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || 'bg-slate-100 text-slate-600'}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-1">{req.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{req.serviceType}</p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{req.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    {req.budget && <span>Budget: KES {Number(req.budget).toLocaleString()}</span>}
                    {req.timeline && <span>Timeline: {req.timeline}</span>}
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.adminNotes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                      <span className="font-semibold">Team note: </span>{req.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
