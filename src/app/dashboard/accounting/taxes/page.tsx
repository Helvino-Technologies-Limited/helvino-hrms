'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Percent, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const TAX_TYPES = ['VAT', 'PAYE', 'NSSF', 'NHIF', 'WHT', 'Corporate Tax', 'Other']
const TAX_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
}

export default function TaxManagementPage() {
  const { data: session } = useSession()
  const [taxes, setTaxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({
    type: 'VAT', period: '', amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PENDING', reference: '', notes: '', paidDate: '',
  })
  const [saving, setSaving] = useState(false)

  async function loadTaxes() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/accounting/taxes?${params}`)
      const d = await res.json()
      setTaxes(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load tax records')
    }
    setLoading(false)
  }

  useEffect(() => { loadTaxes() }, [statusFilter, typeFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paidDate: form.paidDate || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Tax record added')
      setShowModal(false)
      setForm({ type: 'VAT', period: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'PENDING', reference: '', notes: '', paidDate: '' })
      loadTaxes()
    } catch {
      toast.error('Failed to add tax record')
    }
    setSaving(false)
  }

  const totalDue = taxes.filter(t => ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(t.status)).reduce((sum, t) => sum + t.amount, 0)
  const totalPaid = taxes.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0)
  const overdueCount = taxes.filter(t => t.status === 'OVERDUE').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tax Management</h1>
          <p className="text-slate-500 text-sm">Track VAT, PAYE, NSSF, NHIF and other tax obligations</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" /> Add Tax Record
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Due</div>
          <div className="text-2xl font-black text-orange-600">{formatCurrency(totalDue)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Paid</div>
          <div className="text-2xl font-black text-green-700">{formatCurrency(totalPaid)}</div>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Overdue</div>
          <div className={`text-2xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueCount}</div>
          {overdueCount > 0 && <div className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertTriangle className="w-3 h-3" /> Requires attention</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 flex-wrap">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {TAX_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500">Type:</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl mb-2" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Type', 'Period', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Reference'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {taxes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Percent className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p>No tax records found</p>
                    </td>
                  </tr>
                ) : (
                  taxes.map((tax: any) => (
                    <tr key={tax.id} className={`hover:bg-slate-50 transition-colors ${tax.status === 'OVERDUE' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-xs">{tax.type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{tax.period}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 text-xs">{formatCurrency(tax.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs ${tax.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          {formatDate(tax.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {tax.paidDate ? formatDate(tax.paidDate) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {tax.status === 'PAID' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : tax.status === 'OVERDUE' ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : null}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[tax.status] || 'bg-slate-100 text-slate-600'}`}>
                            {tax.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{tax.reference || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Tax Record Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Tax Record</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tax Type *</label>
                  <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Period *</label>
                  <input required value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    placeholder="e.g. Jan 2026, Q1 2026" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (KES) *</label>
                <input required type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input required type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TAX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {form.status === 'PAID' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Paid Date</label>
                  <input type="date" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reference</label>
                <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="KRA reference, receipt number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
