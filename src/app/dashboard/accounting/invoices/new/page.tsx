'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewInvoicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 16,
    discountAmount: 0,
    notes: '',
    terms: 'Payment due within 30 days.',
    quotationId: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 },
  ])

  useEffect(() => {
    fetch('/api/sales/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    fetch('/api/sales/quotations?status=APPROVED').then(r => r.json()).then(d => setQuotations(Array.isArray(d) ? d : []))
  }, [])

  function handleClientChange(clientId: string) {
    const client = clients.find((c: any) => c.id === clientId)
    setForm(f => ({
      ...f,
      clientId,
      clientName: client ? client.companyName : '',
      clientEmail: client ? (client.email || '') : '',
    }))
  }

  function handleQuotationChange(quotationId: string) {
    if (!quotationId) {
      setForm(f => ({ ...f, quotationId: '' }))
      return
    }
    const q = quotations.find((q: any) => q.id === quotationId)
    if (q) {
      setForm(f => ({
        ...f,
        quotationId,
        clientId: q.clientId || '',
        clientName: q.clientName,
        clientEmail: q.clientEmail || '',
        taxRate: q.taxRate || 16,
        discountAmount: q.discountAmount || 0,
      }))
      if (q.items?.length > 0) {
        setItems(q.items.map((item: any) => ({
          description: item.name + (item.description ? ` - ${item.description}` : ''),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })))
      }
    }
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice
      }
      return updated
    })
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = subtotal * (form.taxRate / 100)
  const totalAmount = subtotal + taxAmount - form.discountAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName) { toast.error('Client name is required'); return }
    if (items.some(i => !i.description)) { toast.error('All items need a description'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items }),
      })
      if (!res.ok) throw new Error()
      const inv = await res.json()
      toast.success('Invoice created successfully')
      router.push(`/dashboard/accounting/invoices/${inv.id}`)
    } catch {
      toast.error('Failed to create invoice')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/accounting/invoices"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Create Invoice</h1>
          <p className="text-slate-500 text-sm">Generate a new client invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & From Quotation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-900">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">From Quotation</label>
              <select
                value={form.quotationId}
                onChange={e => handleQuotationChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select quotation (optional)</option>
                {quotations.map((q: any) => (
                  <option key={q.id} value={q.id}>{q.quotationNumber} - {q.clientName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client</label>
              <select
                value={form.clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select client or enter manually</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name *</label>
              <input
                required
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder="Company or individual name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Email</label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                placeholder="billing@client.com"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-900">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date *</label>
              <input
                required
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Discount (KES)</label>
              <input
                type="number"
                min="0"
                value={form.discountAmount}
                onChange={e => setForm(f => ({ ...f, discountAmount: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Line Items</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase px-1">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    required
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Service or item description"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-1">
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(item.totalPrice)}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeItem(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">VAT ({form.taxRate}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                {form.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(form.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-blue-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-900">Notes & Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes for the client..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Terms</label>
              <textarea
                value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                placeholder="Payment terms and conditions..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/accounting/invoices"
            className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
