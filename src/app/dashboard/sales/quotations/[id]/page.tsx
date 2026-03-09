'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Printer, Send, Eye, CheckCircle, XCircle,
  Edit, Trash2, Building2, Mail, Calendar, Clock, FileText, AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </button>
            )}

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

      {/* Quotation Document */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:rounded-none print:border-0 print:m-0 overflow-hidden">
        {/* Document Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-8 py-7 print:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Company info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="font-black text-xl leading-tight">Helvino Technologies</div>
                  <div className="text-blue-300 font-semibold text-sm">Limited</div>
                </div>
              </div>
              <div className="text-slate-400 text-xs space-y-0.5">
                <div>Nairobi, Kenya</div>
                <div>info@helvino.org · helvino.org</div>
                <div>P.O Box 12345 - 00100 Nairobi</div>
              </div>
            </div>

            {/* Quotation number / date */}
            <div className="sm:text-right">
              <div className="text-3xl font-black tracking-tight text-blue-400">QUOTATION</div>
              <div className="text-lg font-bold mt-1">{quotation.quotationNumber}</div>
              <div className="text-slate-400 text-sm mt-2">
                <div className="flex sm:justify-end items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Date: {formatDate(quotation.createdAt)}
                </div>
                {quotation.validUntil && (
                  <div className="flex sm:justify-end items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    Valid Until: {formatDate(quotation.validUntil)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client info */}
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Prepared For</div>
              <div className="font-bold text-slate-900 text-lg">{quotation.clientName}</div>
              {quotation.clientEmail && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {quotation.clientEmail}
                </div>
              )}
              {quotation.client && (
                <div className="text-sm text-slate-500 mt-0.5">{quotation.client.companyName}</div>
              )}
            </div>
            <div className="space-y-2">
              {quotation.deliveryTimeline && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Delivery Timeline</div>
                  <div className="text-sm font-semibold text-slate-700">{quotation.deliveryTimeline}</div>
                </div>
              )}
              {quotation.validUntil && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Valid Until</div>
                  <div className="text-sm font-semibold text-slate-700">{formatDate(quotation.validUntil)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="px-8 py-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Services</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-4 py-3 font-semibold rounded-tl-xl w-8">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Service</th>
                  <th className="text-left px-4 py-3 font-semibold">Description</th>
                  <th className="text-center px-4 py-3 font-semibold w-16">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-3 font-semibold rounded-tr-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.items?.length > 0 ? (
                  quotation.items.map((item: any, i: number) => (
                    <tr key={item.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{item.serviceName || item.name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs">
                        {item.description || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-700 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No line items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>VAT ({taxRate}%)</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-2">
                <span className="font-black text-slate-900">Total Amount</span>
                <span className="font-black text-xl text-slate-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Scope */}
        {quotation.projectScope && (
          <div className="px-8 py-5 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Project Scope</div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
              {quotation.projectScope}
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        {quotation.termsAndConditions && (
          <div className="px-8 py-5 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Terms &amp; Conditions</div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
              {quotation.termsAndConditions}
            </div>
          </div>
        )}

        {/* Notes */}
        {quotation.notes && (
          <div className="px-8 py-5 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Additional Notes</div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded-xl p-4">
              {quotation.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              {quotation.validUntil ? (
                <span className="font-medium">This quotation is valid until <span className="text-slate-800 font-bold">{formatDate(quotation.validUntil)}</span></span>
              ) : (
                <span>Thank you for considering Helvino Technologies Limited.</span>
              )}
            </div>
            <div className="text-center text-xs text-slate-400">
              <div className="border-t border-slate-300 pt-2 w-40">Authorized Signature</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-center text-slate-400">
            Helvino Technologies Limited · Nairobi, Kenya · info@helvino.org · helvino.org
          </div>
        </div>
      </div>
    </>
  )
}
