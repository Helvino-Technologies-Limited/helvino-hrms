'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Edit, Trash2, Calendar, AlertTriangle,
  CheckCircle, XCircle, PauseCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  EXPIRED: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  SUSPENDED: 'bg-amber-100 text-amber-700 border-amber-200',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-3 h-3" />,
  EXPIRED: <XCircle className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
  SUSPENDED: <PauseCircle className="w-3 h-3" />,
}

const BILLING_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

function daysUntilExpiry(expiryDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate)
  exp.setHours(0, 0, 0, 0)
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDateNice(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function DaysCell({ expiryDate }: { expiryDate: string }) {
  const days = daysUntilExpiry(expiryDate)
  if (days < 0) return <span className="font-semibold text-red-600 text-xs uppercase tracking-wide">EXPIRED</span>
  if (days <= 7) return <span className="font-semibold text-red-600 text-sm">{days}d</span>
  if (days <= 30) return <span className="font-semibold text-amber-600 text-sm">{days}d</span>
  return <span className="font-semibold text-green-600 text-sm">{days}d</span>
}

const EMPTY_FORM = {
  clientId: '',
  serviceName: '',
  description: '',
  startDate: '',
  expiryDate: '',
  billingCycle: 'MONTHLY',
  renewalPrice: '',
  autoRenew: false,
  notes: '',
}

export default function SubscriptionsPage() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBilling, setFilterBilling] = useState('')
  const [showExpiring, setShowExpiring] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, clientRes] = await Promise.all([
        fetch('/api/sales/subscriptions'),
        fetch('/api/sales/clients'),
      ])
      const [subData, clientData] = await Promise.all([subRes.json(), clientRes.json()])
      setSubscriptions(Array.isArray(subData) ? subData : (subData.subscriptions ?? []))
      setClients(Array.isArray(clientData) ? clientData : (clientData.clients ?? []))
    } catch (e) {
      console.error(e)
      toast.error('Failed to load subscriptions')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = subscriptions
    .filter(s => {
      const clientName = s.client?.name ?? s.clientName ?? ''
      const matchSearch = !search ||
        clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.serviceName?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || s.status === filterStatus
      const matchBilling = !filterBilling || s.billingCycle === filterBilling
      const matchExpiring = !showExpiring || daysUntilExpiry(s.expiryDate) <= 30
      return matchSearch && matchStatus && matchBilling && matchExpiring
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length
  const expiringSoonCount = subscriptions.filter(s => {
    const d = daysUntilExpiry(s.expiryDate)
    return d >= 0 && d <= 7 && s.status === 'ACTIVE'
  }).length

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(sub: any) {
    setEditing(sub)
    setForm({
      clientId: sub.clientId ?? sub.client?.id ?? '',
      serviceName: sub.serviceName ?? '',
      description: sub.description ?? '',
      startDate: sub.startDate ? sub.startDate.slice(0, 10) : '',
      expiryDate: sub.expiryDate ? sub.expiryDate.slice(0, 10) : '',
      billingCycle: sub.billingCycle ?? 'MONTHLY',
      renewalPrice: sub.renewalPrice ?? '',
      autoRenew: sub.autoRenew ?? false,
      notes: sub.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId || !form.serviceName || !form.startDate || !form.expiryDate || !form.renewalPrice) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, renewalPrice: parseFloat(String(form.renewalPrice)) }
      const res = editing
        ? await fetch(`/api/sales/subscriptions/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/sales/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Subscription updated' : 'Subscription created')
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subscription?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/subscriptions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Subscription deleted')
      loadData()
    } catch {
      toast.error('Failed to delete')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Subscriptions</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-green-600 font-medium">{activeCount} active</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-amber-600 font-medium">{expiringSoonCount} expiring soon</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-red-600 font-medium">{expiredCount} expired</span>
          </div>
        </div>
        <button onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm">
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Alert Banner */}
      {expiringSoonCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 font-semibold text-sm">
            {expiringSoonCount} subscription{expiringSoonCount > 1 ? 's' : ''} expiring this week!
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search client or service..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterBilling} onChange={e => setFilterBilling(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Billing Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={showExpiring} onChange={e => setShowExpiring(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Expiring in 30 days
          </label>
        </div>
        {/* Status Pills */}
        <div className="flex gap-2 flex-wrap">
          {['', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filterStatus === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading subscriptions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold">No subscriptions found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || filterStatus || filterBilling || showExpiring ? 'Try adjusting your filters' : 'Add your first subscription to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Client', 'Service', 'Billing Cycle', 'Start Date', 'Expiry Date', 'Days Until Expiry', 'Renewal Price', 'Status', 'Actions'].map(col => (
                    <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">
                      {sub.client?.name ?? sub.clientName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-sm">{sub.serviceName}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{BILLING_LABELS[sub.billingCycle] ?? sub.billingCycle}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{formatDateNice(sub.startDate)}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{formatDateNice(sub.expiryDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><DaysCell expiryDate={sub.expiryDate} /></td>
                    <td className="px-4 py-3 text-slate-700 text-sm font-medium whitespace-nowrap">
                      KES {Number(sub.renewalPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[sub.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {STATUS_ICONS[sub.status]}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(sub)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)}
                          disabled={deletingId === sub.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select client...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.serviceName} onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))} required
                  placeholder="e.g. Microsoft 365 Business"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Renewal Price (KES) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.renewalPrice} onChange={e => setForm(f => ({ ...f, renewalPrice: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="font-semibold">Auto Renew</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
