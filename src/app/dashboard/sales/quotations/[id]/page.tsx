'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Printer, Send, Eye, CheckCircle, XCircle,
  Edit, Trash2, Building2, Mail, Calendar, Clock, FileText, AlertCircle,
  Receipt, ChevronRight, Download, MessageCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Letterhead from '@/components/Letterhead'
import { generateQuotationHtml } from '@/lib/quotation-pdf'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [converting, setConverting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/sales/quotations/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setQuotation(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function updateStatus(newStatus: string, extra?: Record<string, any>) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sales/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setQuotation(updated)
      toast.success(`Quotation marked as ${newStatus.toLowerCase()}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  async function convertToInvoice() {
    setConverting(true)
    try {
      const subtotal = quotation.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) ?? 0
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const res = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: quotation.clientId ?? null,
          clientName: quotation.clientName,
          clientEmail: quotation.clientEmail ?? null,
          quotationId: quotation.id,
          dueDate: dueDate.toISOString(),
          taxRate: quotation.taxRate ?? 16,
          discountAmount: quotation.discountAmount ?? 0,
          notes: quotation.notes ?? null,
          terms: quotation.terms ?? null,
          status: 'DRAFT',
          items: (quotation.items ?? []).map((item: any) => ({
            description: item.name ?? item.serviceName ?? 'Service',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      const invoice = await res.json()
      toast.success('Invoice created from quotation')
      router.push(`/dashboard/accounting/invoices/${invoice.id}`)
    } catch {
      toast.error('Failed to convert to invoice')
    }
    setConverting(false)
  }

  async function deleteQuotation() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sales/quotations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Quotation deleted')
      router.push('/dashboard/sales/quotations')
    } catch {
      toast.error('Failed to delete quotation')
    } finally {
      setActionLoading(false)
    }
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const signerName = session?.user
        ? `${(session.user as any).firstName ?? ''} ${(session.user as any).lastName ?? ''}`.trim()
        : ''
      const signerTitle = ((session?.user as any)?.role ?? '').replace(/_/g, ' ')

      const html = generateQuotationHtml({
        ...quotation,
        signerName,
        signerTitle,
      })

      // Render in an off-screen container
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;background:#fff;z-index:-1;'
      container.innerHTML = html
      document.body.appendChild(container)

      // Wait for logo image to load
      const img = container.querySelector('img') as HTMLImageElement | null
      if (img && !img.complete) {
        await new Promise<void>(resolve => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          setTimeout(resolve, 2000)
        })
      } else {
        await new Promise(r => setTimeout(r, 200))
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: container.offsetWidth,
        height: container.scrollHeight,
        windowWidth: container.offsetWidth,
      })
      document.body.removeChild(container)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      const totalImgH = (canvas.height * pageW) / canvas.width

      // Smart page-break: avoid cutting through rows and paragraphs
      const mmPerPx = pageW / container.offsetWidth
      const noBreakEls = container.querySelectorAll('tr, p, .section, .payment-box, .sig-area, .footer')
      const bounds: { top: number; bottom: number }[] = []
      noBreakEls.forEach(el => {
        const r = (el as HTMLElement).getBoundingClientRect()
        bounds.push({ top: r.top * mmPerPx, bottom: r.bottom * mmPerPx })
      })

      const cutPoints: number[] = [0]
      while (true) {
        const lastCut = cutPoints[cutPoints.length - 1]
        if (lastCut + pageH >= totalImgH) break
        const idealCut = lastCut + pageH
        const split = bounds.filter(b => b.top < idealCut && b.bottom > idealCut)
        let cut = idealCut
        if (split.length > 0) {
          const safeTop = Math.min(...split.map(b => b.top))
          if (safeTop > lastCut + 5) cut = safeTop
        }
        cutPoints.push(cut)
      }

      cutPoints.forEach((yOffset, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, totalImgH)
      })

      pdf.save(`${quotation.quotationNumber}.pdf`)
      toast.success('PDF downloaded')
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate PDF')
    }
    setDownloadingPdf(false)
  }

  async function sendEmail() {
    setSendingEmail(true)
    try {
      const res = await fetch(`/api/sales/quotations/${id}/send`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Quotation emailed to client')
      // Refresh quotation status
      const updated = await fetch(`/api/sales/quotations/${id}`).then(r => r.json())
      if (!updated.error) setQuotation(updated)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email')
    }
    setSendingEmail(false)
  }

  function shareWhatsApp() {
    if (!quotation) return
    const subtotal = quotation.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) || 0
    const discount = quotation.discountAmount || 0
    const taxRate = quotation.taxRate ?? 16
    const total = (subtotal - discount) * (1 + taxRate / 100)

    const msg = [
      `*Quotation ${quotation.quotationNumber}*`,
      `Client: ${quotation.clientName}`,
      `Total: KES ${total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      quotation.validUntil ? `Valid Until: ${formatDate(quotation.validUntil)}` : '',
      quotation.deliveryTimeline ? `Delivery: ${quotation.deliveryTimeline}` : '',
      '',
      '*To proceed, make payment via M-Pesa Paybill:*',
      'Business: Helvino Technologies',
      'Paybill No: 522533',
      'Account No: 8071524',
      'Phone: 0110421320',
      '',
      `Reference: ${quotation.quotationNumber}`,
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!quotation || quotation.error) {
    return (
      <div className="text-center py-16 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p>Quotation not found</p>
      </div>
    )
  }

  const subtotal = quotation.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || quotation.subtotal || 0
  const discount = quotation.discount || 0
  const taxRate = quotation.taxRate ?? 16
  const taxableAmount = subtotal - discount
  const tax = taxableAmount * (taxRate / 100)
  const total = taxableAmount + tax

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; margin: 0; }
          tr, .section, .payment-box { break-inside: avoid; page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
        @page { margin: 1cm; size: A4 portrait; }
      `}</style>

      {/* Action bar — hidden on print */}
      <div className="print:hidden space-y-4 mb-6">
        {/* Top navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/sales/quotations"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quotations
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">{quotation.quotationNumber}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[quotation.status] || 'bg-slate-100 text-slate-600'}`}>
                  {quotation.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">{quotation.clientName} · {formatDate(quotation.createdAt)}</p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {quotation.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => updateStatus('SENT')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send to Client
                </button>
                <Link
                  href={`/dashboard/sales/quotations/${id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}

            {quotation.status === 'SENT' && (
              <button
                onClick={() => updateStatus('VIEWED')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Eye className="w-4 h-4" />
                Mark Viewed
              </button>
            )}

            {quotation.status === 'VIEWED' && (
              <>
                <button
                  onClick={() => updateStatus('APPROVED')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Approved
                </button>
                <button
                  onClick={() => updateStatus('REJECTED')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Mark Rejected
                </button>
              </>
            )}

            {quotation.status === 'APPROVED' && (
              <button
                onClick={convertToInvoice}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                <Receipt className="w-4 h-4" />
                {converting ? 'Creating...' : 'Convert to Invoice'}
              </button>
            )}

            {/* PDF / Email / WhatsApp — always visible */}
            <button onClick={downloadPdf} disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" /> {downloadingPdf ? 'Generating...' : 'PDF'}
            </button>
            {quotation.clientEmail && (
              <button onClick={sendEmail} disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                <Mail className="w-4 h-4" /> {sendingEmail ? 'Sending...' : 'Email'}
              </button>
            )}
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>

            {quotation.status !== 'DRAFT' && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            )}
          </div>
        </div>

        {/* Next-step banner */}
        {quotation.status === 'DRAFT' && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span><strong>Next step:</strong> Review the quotation, then click <em>Send to Client</em> to share it.</span>
            </div>
          </div>
        )}
        {quotation.status === 'SENT' && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span><strong>Next step:</strong> Awaiting client response — mark as <em>Viewed</em> once the client opens it.</span>
            </div>
          </div>
        )}
        {quotation.status === 'VIEWED' && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-purple-50 border-purple-200 text-purple-800 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span><strong>Next step:</strong> Client has viewed the quotation — mark it as <em>Approved</em> or <em>Rejected</em> based on feedback.</span>
            </div>
          </div>
        )}
        {quotation.status === 'APPROVED' && (
          <button
            onClick={convertToInvoice}
            disabled={converting}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 flex-shrink-0" />
              <span><strong>Next step:</strong> Quotation approved — convert it to an invoice to bill the client.</span>
            </div>
            <div className="flex items-center gap-1 font-bold flex-shrink-0">
              {converting ? 'Creating...' : 'Convert to Invoice'} <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Rejection reason banner */}
        {quotation.status === 'REJECTED' && quotation.rejectionReason && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800 text-sm">Rejected</div>
              <p className="text-sm text-red-600 mt-0.5">{quotation.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Quotation</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={deleteQuotation}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:border-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotation Document (inside letterhead) ── */}
      <div ref={docRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:rounded-none print:border-0 print:m-0 overflow-hidden">
        <Letterhead
          signerName={(session?.user as any)?.firstName ? `${(session?.user as any)?.firstName ?? ''} ${(session?.user as any)?.lastName ?? ''}`.trim() : ''}
          signerTitle={(session?.user as any)?.role?.replace(/_/g, ' ') ?? ''}
        >
          {/* Quotation title & meta */}
          <div style={{ paddingTop: '16px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', color: '#1d4ed8' }}>QUOTATION</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{quotation.quotationNumber}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', lineHeight: '1.8' }}>
              <div><strong>Date:</strong> {formatDate(quotation.createdAt)}</div>
              {quotation.validUntil && <div><strong>Valid Until:</strong> {formatDate(quotation.validUntil)}</div>}
              <div style={{ marginTop: '4px' }}>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: '#dbeafe', color: '#1d4ed8' }}>
                  {quotation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Client info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Prepared For</div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{quotation.clientName}</div>
              {quotation.clientEmail && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{quotation.clientEmail}</div>}
              {quotation.client?.companyName && <div style={{ fontSize: '11px', color: '#64748b' }}>{quotation.client.companyName}</div>}
            </div>
            <div>
              {quotation.deliveryTimeline && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Delivery Timeline</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b' }}>{quotation.deliveryTimeline}</div>
                </div>
              )}
              {quotation.validUntil && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Valid Until</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b' }}>{formatDate(quotation.validUntil)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Services Table */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Services</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: '600', width: '28px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: '600' }}>Service</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: '600', width: '40px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.length > 0 ? (
                  quotation.items.map((item: any, i: number) => (
                    <tr key={item.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px', fontWeight: '600', color: '#1e293b' }}>{item.serviceName || item.name}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b', maxWidth: '200px' }}>{item.description || '—'}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>{item.quantity}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No line items</td></tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <div style={{ minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  <span>Subtotal</span><span style={{ fontWeight: '600' }}>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#dc2626', marginBottom: '4px' }}>
                    <span>Discount</span><span style={{ fontWeight: '600' }}>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  <span>VAT ({taxRate}%)</span><span style={{ fontWeight: '600' }}>{formatCurrency(tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1e293b', paddingTop: '6px' }}>
                  <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '12px' }}>Total Amount</span>
                  <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '15px' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Scope */}
          {quotation.projectScope && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#f8fafc', borderLeft: '3px solid #1d4ed8', borderRadius: '4px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Project Scope</div>
              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{quotation.projectScope}</div>
            </div>
          )}

          {/* Terms */}
          {quotation.termsAndConditions && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '4px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Terms &amp; Conditions</div>
              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{quotation.termsAndConditions}</div>
            </div>
          )}

          {/* Notes */}
          {quotation.notes && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#1d4ed8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Additional Notes</div>
              <div style={{ fontSize: '11px', color: '#1e40af', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{quotation.notes}</div>
            </div>
          )}

          {/* Payment Instructions */}
          <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', marginBottom: '8px' }}>
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
              Use <strong>{quotation.quotationNumber}</strong> as your payment reference. Contact <strong>0110421320</strong> after payment.
            </div>
          </div>

          {/* Validity note */}
          {quotation.validUntil && (
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '8px', marginBottom: '4px' }}>
              This quotation is valid until <strong>{formatDate(quotation.validUntil)}</strong>. Thank you for choosing Helvino Technologies Ltd.
            </div>
          )}
        </Letterhead>
      </div>
    </>
  )
}
