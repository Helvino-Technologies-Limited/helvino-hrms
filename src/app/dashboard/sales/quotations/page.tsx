'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Eye, Edit, Trash2, FileText, X, ChevronDown, Send
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  VIEWED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-200',
}

const STATUSES = ['All', 'DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED']

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isExpired(q: any) {
  if (!q.validUntil) return false
  if (q.status === 'APPROVED' || q.status === 'REJECTED' || q.status === 'EXPIRED') return false
  return new Date(q.validUntil) < new Date()
}

function getDisplayStatus(q: any) {
  return isExpired(q) ? 'EXPIRED' : q.status
}

export default function QuotationsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || ''
  const searchParams = useSearchParams()

  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<any>(null)
  const [prefillLead, setPrefillLead] = useState<{ leadId: string; clientName: string } | null>(null)

  // Auto-open new quotation modal when coming from lead page
  useEffect(() => {
    const leadId = searchParams.get('newForLead')
    const leadName = searchParams.get('leadName')
    if (leadId) {
      setPrefillLead({ leadId, clientName: leadName || '' })
      setEditingQuotation(null)
      setShowModal(true)
    }
  }, [searchParams])

  const loadQuotations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await fetch(`/api/sales/quotations?${params}`)
      const data = await res.json()
      setQuotations(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load quotations') }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    const t = setTimeout(loadQuotations, 300)
    return () => clearTimeout(t)
  }, [loadQuotations])

  async function handleDelete(id: string) {
    if (!confirm('Delete this quotation? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/sales/quotations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Quotation deleted')
      loadQuotations()
    } catch { toast.error('Failed to delete quotation') }
  }

  const total = quotations.length
  const drafts = quotations.filter(q => q.status === 'DRAFT').length
  const approved = quotations.filter(q => q.status === 'APPROVED').length

  const filtered = quotations.filter(q => {
    const matchSearch = !search ||
      q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(search.toLowerCase())
    const displayStatus = getDisplayStatus(q)
    const matchStatus = statusFilter === 'All' || displayStatus === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quotations</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-slate-500 text-sm">{total} total</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-sm text-slate-500">{drafts} draft</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-sm text-green-600 font-medium">{approved} approved</span>
          </div>
        </div>
        <button
          onClick={() => { setEditingQuotation(null); setShowModal(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation # or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500">Loading quotations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-semibold">No quotations found</p>
            <p className="text-sm mt-1">Create your first quotation to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Quotation #', 'Client', 'Services', 'Subtotal', 'Tax', 'Total', 'Status', 'Valid Until', 'Created By', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((q: any) => {
                  const displayStatus = getDisplayStatus(q)
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-800">{q.quotationNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">{q.clientName}</div>
                        {q.clientEmail && <div className="text-xs text-slate-400">{q.clientEmail}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">{q.items?.length ?? 0} item{q.items?.length !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">{fmt(q.subtotal)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">{fmt(q.taxAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-900">{fmt(q.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[displayStatus] || STATUS_COLORS.DRAFT}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {q.validUntil ? (
                          <span className={`text-sm ${isExpired(q) ? 'text-orange-600 font-medium' : 'text-slate-600'}`}>
                            {new Date(q.validUntil).toLocaleDateString('en-KE')}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/sales/quotations/${q.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {q.status === 'DRAFT' && (
                            <button
                              onClick={() => { setEditingQuotation(q); setShowModal(true) }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {(q.status === 'DRAFT' || role === 'SUPER_ADMIN') && (
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {showModal && (
        <QuotationModal
          quotation={editingQuotation}
          prefillLead={prefillLead}
          onClose={() => { setShowModal(false); setPrefillLead(null) }}
          onSave={() => {
            setShowModal(false)
            setPrefillLead(null)
            loadQuotations()
            toast.success(editingQuotation ? 'Quotation updated!' : 'Quotation created!')
          }}
        />
      )}
    </div>
  )
}

function QuotationModal({ quotation, prefillLead, onClose, onSave }: { quotation: any; prefillLead?: { leadId: string; clientName: string } | null; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const [form, setForm] = useState({
    clientName: quotation?.clientName || prefillLead?.clientName || '',
    clientEmail: quotation?.clientEmail || '',
    leadId: quotation?.leadId || prefillLead?.leadId || '',
    clientId: quotation?.clientId || '',
    validUntil: quotation?.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
    deliveryTimeline: quotation?.deliveryTimeline || '',
    projectScope: quotation?.projectScope || '',
    discountAmount: quotation?.discountAmount ?? 0,
    taxRate: quotation?.taxRate ?? 16,
    notes: quotation?.notes || '',
    terms: quotation?.terms || '',
  })

  const [items, setItems] = useState<any[]>(
    quotation?.items?.length
      ? quotation.items.map((it: any) => ({
          serviceId: it.serviceId || '',
          name: it.name || '',
          description: it.description || '',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
        }))
      : [{ serviceId: '', name: '', description: '', quantity: 1, unitPrice: 0 }]
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/sales/leads').then(r => r.json()).catch(() => []),
      fetch('/api/sales/clients').then(r => r.json()).catch(() => []),
      fetch('/api/sales/services').then(r => r.json()).catch(() => []),
    ]).then(([l, c, s]) => {
      setLeads(Array.isArray(l) ? l : [])
      setClients(Array.isArray(c) ? c : [])
      setServices(Array.isArray(s) ? s : [])
      setLoading(false)
    })
  }, [])

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  function updateItem(i: number, k: string, v: any) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      if (k === 'serviceId' && v) {
        const svc = services.find((s: any) => s.id === v)
        if (svc) {
          updated.name = svc.name
          updated.unitPrice = svc.basePrice || 0
        }
      }
      return updated
    }))
  }

  function addItem() {
    setItems(prev => [...prev, { serviceId: '', name: '', description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice)), 0)
  const discount = Number(form.discountAmount) || 0
  const taxRate = Number(form.taxRate) || 0
  const taxAmount = ((subtotal - discount) * taxRate) / 100
  const total = subtotal - discount + taxAmount

  async function handleSubmit(sendAfter = false) {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        discountAmount: Number(form.discountAmount),
        taxRate: Number(form.taxRate),
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.quantity) * Number(it.unitPrice),
        })),
        status: sendAfter ? 'SENT' : 'DRAFT',
      }
      const url = quotation ? `/api/sales/quotations/${quotation.id}` : '/api/sales/quotations'
      const method = quotation ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900'
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{quotation ? 'Edit Quotation' : 'New Quotation'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{quotation ? `Editing ${quotation.quotationNumber}` : 'Create a new quotation for a client'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500">Loading...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Left: Client Info */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Client Information</h3>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">{error}</div>
                )}

                <div>
                  <label className={labelCls}>Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)}
                    required className={inputCls} placeholder="e.g. Acme Corporation" />
                </div>

                <div>
                  <label className={labelCls}>Client Email</label>
                  <input type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)}
                    className={inputCls} placeholder="client@example.com" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Link to Lead</label>
                    <select value={form.leadId} onChange={e => set('leadId', e.target.value)} className={inputCls}>
                      <option value="">None</option>
                      {leads.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.contactPerson}{l.companyName ? ` — ${l.companyName}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Link to Client</label>
                    <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inputCls}>
                      <option value="">None</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Valid Until</label>
                    <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Delivery Timeline</label>
                    <input type="text" value={form.deliveryTimeline} onChange={e => set('deliveryTimeline', e.target.value)}
                      className={inputCls} placeholder="e.g. 4-6 weeks" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Project Scope</label>
                  <textarea value={form.projectScope} onChange={e => set('projectScope', e.target.value)}
                    rows={3} className={inputCls} placeholder="Describe the project scope..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Discount Amount (KES)</label>
                    <input type="number" min="0" value={form.discountAmount} onChange={e => set('discountAmount', e.target.value)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tax Rate (%)</label>
                    <input type="number" min="0" max="100" value={form.taxRate} onChange={e => set('taxRate', e.target.value)}
                      className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={2} className={inputCls} placeholder="Internal notes..." />
                </div>

                <div>
                  <label className={labelCls}>Terms & Conditions</label>
                  <textarea value={form.terms} onChange={e => set('terms', e.target.value)}
                    rows={3} className={inputCls} placeholder="Payment terms, delivery conditions..." />
                </div>
              </div>

              {/* Right: Line Items */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Line Items</h3>

                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Item {i + 1}</span>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Service (from catalog)</label>
                        <select value={item.serviceId} onChange={e => updateItem(i, 'serviceId', e.target.value)}
                          className={inputCls}>
                          <option value="">Select or type below...</option>
                          {services.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
                        <input type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                          className={inputCls} placeholder="Service or product name" />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <input type="text" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                          className={inputCls} placeholder="Brief description" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={labelCls}>Qty</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Unit Price</label>
                          <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Total</label>
                          <div className="px-3 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold">
                            {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('en-KE')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addItem}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>

                {/* Totals */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{fmt(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span>-{fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax ({taxRate}%)</span>
                    <span>{fmt(taxAmount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0 justify-end">
          <button onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm">
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving || !form.clientName}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving || !form.clientName}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Quotation
          </button>
        </div>
      </div>
    </div>
  )
}
