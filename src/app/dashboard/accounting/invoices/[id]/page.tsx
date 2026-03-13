'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, CheckCircle, X, CreditCard, Printer,
  AlertCircle, ChevronRight, FileText, Clock, Download, Mail, MessageCircle,
} from 'lucide-react'
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
  const [payForm, setPayForm] = useState({
    amount: 0, method: 'BANK_TRANSFER', reference: '', notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

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
      toast.success(`Invoice ${status.replace(/_/g, ' ').toLowerCase()}`)
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

  async function downloadPdf() {
    if (!docRef.current) return
    setDownloadingPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(docRef.current, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`${invoice.invoiceNumber}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    }
    setDownloadingPdf(false)
  }

  async function sendEmail() {
    setSendingEmail(true)
    try {
      const res = await fetch(`/api/accounting/invoices/${params.id}/send`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Invoice emailed to client')
      loadInvoice()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email')
    }
    setSendingEmail(false)
  }

  function shareWhatsApp() {
    if (!invoice) return
    const msg = [
      `*Invoice ${invoice.invoiceNumber}*`,
      `Client: ${invoice.clientName}`,
      `Amount: KES ${Number(invoice.totalAmount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      invoice.balanceDue > 0 ? `Balance Due: KES ${Number(invoice.balanceDue).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : 'Status: PAID IN FULL',
      `Due Date: ${formatDate(invoice.dueDate)}`,
      '',
      '*Payment Instructions (M-Pesa Paybill):*',
      'Business: Helvino Technologies',
      'Paybill No: 522533',
      'Account No: 8071524',
      'Phone: 0110421320',
      '',
      `Reference: ${invoice.invoiceNumber}`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
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
        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
        <p>Invoice not found</p>
        <Link href="/dashboard/accounting/invoices" className="text-blue-600 hover:underline text-sm mt-2 block">
          Back to invoices
        </Link>
      </div>
    )
  }

  const nextStep: { label: string; hint: string; color: string; action?: () => void } | null = (() => {
    if (invoice.status === 'DRAFT') return {
      label: 'Send to client',
      hint: 'Mark this invoice as sent once you have shared it with the client.',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      action: () => updateStatus('SENT'),
    }
    if (invoice.status === 'SENT') return {
      label: 'Record a payment',
      hint: 'Awaiting payment — record a full or partial payment when received.',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      action: () => setShowPayModal(true),
    }
    if (invoice.status === 'PARTIALLY_PAID') return {
      label: 'Record remaining payment',
      hint: `Balance due: ${formatCurrency(invoice.balanceDue)} — record the remaining amount.`,
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      action: () => setShowPayModal(true),
    }
    if (invoice.status === 'OVERDUE') return {
      label: 'Follow up & record payment',
      hint: 'This invoice is overdue. Chase the client and record payment when received.',
      color: 'bg-red-50 border-red-200 text-red-800',
      action: () => setShowPayModal(true),
    }
    return null
  })()

  return (
    <div className="space-y-4 max-w-4xl">
      {/* ── Action bar (hidden on print) ── */}
      <div className="print-hide">
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
            {/* PDF / Email / WhatsApp */}
            <button onClick={downloadPdf} disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" /> {downloadingPdf ? 'Generating...' : 'PDF'}
            </button>
            {invoice.clientEmail && (
              <button onClick={sendEmail} disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                <Mail className="w-4 h-4" /> {sendingEmail ? 'Sending...' : 'Email'}
              </button>
            )}
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
            {!['CANCELLED', 'PAID'].includes(invoice.status) && (
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

        {/* ── Next Step Banner ── */}
        {nextStep && (
          <button
            onClick={nextStep.action}
            className={`w-full flex items-center justify-between gap-3 mt-3 px-4 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80 ${nextStep.color}`}>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <span className="font-bold">Next step: </span>
                {nextStep.hint}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 font-bold">
              {nextStep.label} <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {invoice.status === 'PAID' && (
          <div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl border bg-green-50 border-green-200 text-green-800 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>This invoice is fully paid. You may print the receipt below.</span>
          </div>
        )}

        {invoice.status === 'CANCELLED' && (
          <div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This invoice has been cancelled.</span>
          </div>
        )}
      </div>

      {/* ── Invoice Document ── */}
      <div ref={docRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6 print-doc">
        {/* Company + Invoice header */}
        <div className="flex justify-between flex-wrap gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="text-2xl font-black text-blue-700 mb-1">Helvino Technologies Limited</div>
            <div className="text-xs text-slate-400 space-y-0.5">
              <div>Nairobi, Kenya</div>
              <div>info@helvino.org · helvinocrm.org</div>
              <div>Tel: 0110421320</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-300 tracking-widest">INVOICE</div>
            <div className="text-sm text-slate-500 space-y-0.5 mt-2">
              <div><span className="font-semibold text-slate-700">Invoice #:</span> {invoice.invoiceNumber}</div>
              <div><span className="font-semibold text-slate-700">Issue Date:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="font-semibold text-slate-700">Due Date:</span> {formatDate(invoice.dueDate)}</div>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
          <div className="font-bold text-slate-900 text-lg">{invoice.clientName}</div>
          {invoice.clientEmail && <div className="text-slate-500 text-sm">{invoice.clientEmail}</div>}
          {invoice.quotation && (
            <div className="text-xs text-slate-400 mt-1">Ref: {invoice.quotation.quotationNumber}</div>
          )}
          {invoice.subscription && (
            <div className="text-xs text-slate-400 mt-1">Subscription: {invoice.subscription.serviceName}</div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left px-4 py-3 font-semibold rounded-tl-xl">Description</th>
                <th className="text-right px-4 py-3 font-semibold w-16">Qty</th>
                <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                <th className="text-right px-4 py-3 font-semibold rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoice.items.map((item: any, i: number) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
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
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-semibold text-green-700">{formatCurrency(invoice.amountPaid)}</span>
              </div>
            )}
            {invoice.balanceDue > 0 && (
              <div className="flex justify-between bg-orange-50 rounded-xl px-3 py-2">
                <span className="font-bold text-orange-800">Balance Due</span>
                <span className="text-lg font-black text-orange-600">{formatCurrency(invoice.balanceDue)}</span>
              </div>
            )}
            {invoice.balanceDue === 0 && (
              <div className="flex justify-between bg-green-50 rounded-xl px-3 py-2">
                <span className="font-bold text-green-800">PAID IN FULL</span>
                <span className="text-green-700 font-black">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">Payment Instructions (M-Pesa Paybill)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase mb-0.5">Business</div>
              <div className="font-bold text-slate-900 text-sm">Helvino Technologies</div>
            </div>
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase mb-0.5">Paybill No</div>
              <div className="font-black text-slate-900 text-xl tracking-widest">522533</div>
            </div>
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase mb-0.5">Account No</div>
              <div className="font-black text-slate-900 text-xl tracking-widest">8071524</div>
            </div>
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase mb-0.5">Phone</div>
              <div className="font-bold text-slate-900 text-sm">0110421320</div>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-3">Use invoice number <strong>{invoice.invoiceNumber}</strong> as your payment reference. Contact us on <strong>0110421320</strong> after payment.</p>
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

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
          Helvino Technologies Limited · Nairobi, Kenya · info@helvino.org · helvinocrm.org · 0110421320
        </div>
      </div>

      {/* ── Payment History (hidden on print) ── */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-hide">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Payment History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {invoice.payments.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{pay.paymentNumber}</div>
                  <div className="text-slate-400 text-xs">{formatDate(pay.paymentDate)} · {pay.method.replace(/_/g, ' ')}</div>
                  {pay.reference && <div className="text-slate-400 text-xs">Ref: {pay.reference}</div>}
                </div>
                <div className="font-black text-green-700">{formatCurrency(pay.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Record Payment Modal (hidden on print) ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print-hide">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{invoice.invoiceNumber} · {invoice.clientName}</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={recordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                <input
                  required type="number" min="0.01" step="0.01" max={invoice.balanceDue}
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">Balance due: {formatCurrency(invoice.balanceDue)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select value={payForm.method}
                    onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={payForm.paymentDate}
                    onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input value={payForm.reference}
                  onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="e.g. M-Pesa transaction ID, cheque no."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <input value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
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
