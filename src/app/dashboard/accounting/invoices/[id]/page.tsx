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
import Letterhead from '@/components/Letterhead'

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

      {/* ── Invoice Document (inside letterhead) ── */}
      <div ref={docRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 print-doc overflow-hidden">
        <Letterhead
          signerName={(session?.user as any)?.firstName ? `${(session?.user as any)?.firstName ?? ''} ${(session?.user as any)?.lastName ?? ''}`.trim() : ''}
          signerTitle={(session?.user as any)?.role?.replace(/_/g, ' ') ?? ''}
        >
          {/* Invoice title & meta */}
          <div style={{ paddingTop: '16px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', color: '#0f766e' }}>INVOICE</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{invoice.invoiceNumber}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', lineHeight: '1.8' }}>
              <div><strong>Issue Date:</strong> {formatDate(invoice.issueDate)}</div>
              <div><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: invoice.status === 'PAID' ? '#dcfce7' : '#fef3c7', color: invoice.status === 'PAID' ? '#15803d' : '#92400e' }}>
                  {invoice.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ marginBottom: '16px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Bill To</div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{invoice.clientName}</div>
            {invoice.clientEmail && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{invoice.clientEmail}</div>}
            {invoice.quotation && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Ref: {invoice.quotation.quotationNumber}</div>}
            {invoice.subscription && <div style={{ fontSize: '10px', color: '#94a3b8' }}>Subscription: {invoice.subscription.serviceName}</div>}
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600', width: '40px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, i: number) => (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 10px', color: '#334155' }}>{item.description}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748b' }}>{item.quantity}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <div style={{ minWidth: '220px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                  <span>Subtotal</span><span style={{ fontWeight: '600' }}>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                  <span>VAT ({invoice.taxRate}%)</span><span style={{ fontWeight: '600' }}>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '4px' }}>
                    <span>Discount</span><span style={{ fontWeight: '600' }}>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1e293b', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '12px' }}>Total</span>
                  <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '15px' }}>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', marginTop: '4px' }}>
                    <span>Amount Paid</span><span style={{ fontWeight: '600' }}>{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                )}
                {invoice.balanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fff7ed', borderRadius: '6px', padding: '6px 8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: '800', color: '#9a3412' }}>Balance Due</span>
                    <span style={{ fontWeight: '900', color: '#ea580c', fontSize: '13px' }}>{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                )}
                {invoice.balanceDue === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', borderRadius: '6px', padding: '6px 8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: '800', color: '#14532d' }}>PAID IN FULL</span>
                    <span style={{ fontWeight: '900', color: '#16a34a' }}>✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#15803d', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Payment Instructions — M-Pesa Paybill
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '11px' }}>
              <div>
                <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Business</div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>Helvino Technologies</div>
              </div>
              <div>
                <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Paybill No</div>
                <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '14px', letterSpacing: '2px' }}>522533</div>
              </div>
              <div>
                <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Account No</div>
                <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '14px', letterSpacing: '2px' }}>8071524</div>
              </div>
              <div>
                <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Phone</div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>0110421320</div>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: '#15803d', marginTop: '6px' }}>
              Use <strong>{invoice.invoiceNumber}</strong> as your payment reference. Contact <strong>0110421320</strong> after payment.
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '8px' }}>
              {invoice.notes && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Terms</div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>{invoice.terms}</div>
                </div>
              )}
            </div>
          )}
        </Letterhead>
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
