'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, X, CreditCard, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

const PAYMENT_METHODS = ['BANK_TRANSFER', 'MPESA', 'CASH', 'CARD', 'ONLINE']

export default function InvoiceDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: 0, method: 'BANK_TRANSFER', reference: '', notes: '', paymentDate: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  async function loadInvoice() {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounting/invoices/${params.id}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setInvoice(d)
      setPayForm(f => ({ ...f, amount: d.balanceDue }))
    } catch {
      toast.error('Failed to load invoice')
    }
    setLoading(false)
  }

  useEffect(() => { if (params.id) loadInvoice() }, [params.id])

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/accounting/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Invoice marked as ${status.replace(/_/g, ' ')}`)
      loadInvoice()
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: params.id,
          clientId: invoice.clientId,
          ...payForm,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Payment recorded')
      setShowPayModal(false)
      loadInvoice()
    } catch {
      toast.error('Failed to record payment')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse h-96" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Invoice not found</p>
        <Link href="/dashboard/accounting/invoices" className="text-blue-600 hover:underline text-sm mt-2 block">
          Back to invoices
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/accounting/invoices"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{invoice.invoiceNumber}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-sm">Created {formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === 'DRAFT' && (
            <button onClick={() => updateStatus('SENT')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
              <Send className="w-4 h-4" /> Mark as Sent
            </button>
          )}
          {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
            <button onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}
          {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
            <button onClick={() => updateStatus('CANCELLED')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl font-semibold text-sm transition-colors border border-slate-200">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6 print:shadow-none">
        {/* Header Info */}
        <div className="flex justify-between flex-wrap gap-6">
          <div>
            <div className="text-2xl font-black text-blue-600 mb-1">INVOICE</div>
            <div className="text-sm text-slate-500 space-y-0.5">
              <div><span className="font-semibold text-slate-700">Invoice #:</span> {invoice.invoiceNumber}</div>
              <div><span className="font-semibold text-slate-700">Issue Date:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="font-semibold text-slate-700">Due Date:</span> {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900 text-lg">Bill To</div>
            <div className="text-slate-700 font-semibold">{invoice.clientName}</div>
            {invoice.clientEmail && <div className="text-slate-500 text-sm">{invoice.clientEmail}</div>}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 rounded-xl">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-700">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAT ({invoice.taxRate}%)</span>
              <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="font-semibold text-red-600">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-semibold text-green-700">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between bg-orange-50 rounded-xl px-3 py-2">
              <span className="font-bold text-orange-800">Balance Due</span>
              <span className="text-lg font-black text-orange-600">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
            {invoice.notes && (
              <div>
                <div className="text-sm font-bold text-slate-700 mb-1">Notes</div>
                <p className="text-slate-500 text-sm">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <div className="text-sm font-bold text-slate-700 mb-1">Payment Terms</div>
                <p className="text-slate-500 text-sm">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Payment History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {invoice.payments.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{pay.paymentNumber}</div>
                  <div className="text-slate-400 text-xs">{formatDate(pay.paymentDate)} · {pay.method.replace(/_/g, ' ')}</div>
                </div>
                <div className="font-black text-green-700">{formatCurrency(pay.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={recordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={invoice.balanceDue}
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">Balance due: {formatCurrency(invoice.balanceDue)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payForm.method}
                  onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input
                  value={payForm.reference}
                  onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="e.g. M-PESA transaction ID"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
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
