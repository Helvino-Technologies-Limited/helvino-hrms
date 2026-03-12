'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CreditCard, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const METHOD_COLORS: Record<string, string> = {
  BANK_TRANSFER: 'bg-blue-100 text-blue-700',
  MPESA: 'bg-green-100 text-green-700',
  CASH: 'bg-slate-100 text-slate-700',
  CARD: 'bg-purple-100 text-purple-700',
  ONLINE: 'bg-orange-100 text-orange-700',
}

const PAYMENT_METHODS = ['BANK_TRANSFER', 'MPESA', 'CASH', 'CARD', 'ONLINE']

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    invoiceId: '', clientId: '', amount: 0, method: 'BANK_TRANSFER',
    reference: '', notes: '', paymentDate: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [pRes, iRes, cRes] = await Promise.all([
        fetch('/api/accounting/payments'),
        fetch('/api/accounting/invoices?status=SENT'),
        fetch('/api/sales/clients'),
      ])
      const [p, i, c] = await Promise.all([pRes.json(), iRes.json(), cRes.json()])
      setPayments(Array.isArray(p) ? p : [])
      setInvoices(Array.isArray(i) ? i : [])
      setClients(Array.isArray(c) ? c : [])
    } catch {
      toast.error('Failed to load payments')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invoiceId: form.invoiceId || null, clientId: form.clientId || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Payment recorded')
      setShowModal(false)
      setForm({ invoiceId: '', clientId: '', amount: 0, method: 'BANK_TRANSFER', reference: '', notes: '', paymentDate: new Date().toISOString().split('T')[0] })
      loadData()
    } catch {
      toast.error('Failed to record payment')
    }
    setSaving(false)
  }

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payments</h1>
          <p className="text-slate-500 text-sm">Track all received payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Payments Received</div>
        <div className="text-3xl font-black text-green-700">{formatCurrency(totalPayments)}</div>
        <div className="text-slate-400 text-sm mt-1">{payments.length} transactions</div>
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
                  {['Payment #', 'Invoice', 'Client', 'Amount', 'Method', 'Reference', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p>No payments recorded yet</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-600">{pay.paymentNumber}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold">
                        {pay.invoice?.invoiceNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{pay.client?.companyName || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-black text-green-700">{formatCurrency(pay.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${METHOD_COLORS[pay.method] || 'bg-slate-100 text-slate-600'}`}>
                          {pay.method.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{pay.reference || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(pay.paymentDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Invoice (optional)</label>
                <select
                  value={form.invoiceId}
                  onChange={e => {
                    const inv = invoices.find((i: any) => i.id === e.target.value)
                    setForm(f => ({
                      ...f,
                      invoiceId: e.target.value,
                      clientId: inv?.clientId || f.clientId,
                      amount: inv?.balanceDue || f.amount,
                    }))
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select invoice</option>
                  {invoices.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.invoiceNumber} - {i.clientName} ({formatCurrency(i.balanceDue)} due)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Client</label>
                <select
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select client</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={form.method}
                    onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reference</label>
                <input
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="Transaction reference"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
