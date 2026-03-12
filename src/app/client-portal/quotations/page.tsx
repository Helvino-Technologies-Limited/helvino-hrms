'use client'
import { useEffect, useState } from 'react'
import { FileText, CheckCircle, XCircle, MessageSquare, AlertCircle, Loader2, X, ChevronDown } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch('/api/client/quotations')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setQuotations(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Mark viewed quotations
    quotations.forEach(q => {
      if (q.status === 'SENT') {
        fetch(`/api/client/quotations/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view' }),
        }).catch(() => {})
      }
    })
  }, [quotations])

  async function handleAction() {
    if (!actionModal) return
    setActing(true)
    const res = await fetch(`/api/client/quotations/${actionModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionModal.action, reason }),
    })
    if (res.ok) {
      const updated = await res.json()
      setQuotations(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated } : q))
      setActionModal(null)
      setReason('')
    }
    setActing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review and respond to quotations from our team</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No quotations yet</h3>
          <p className="text-slate-400 text-sm mt-1">Quotations from our team will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map(q => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{q.quotationNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[q.status] || 'bg-slate-100 text-slate-600'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1 line-clamp-1">{q.projectScope || 'Service quotation'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Date: {new Date(q.createdAt).toLocaleDateString()}</span>
                      {q.validUntil && <span>Valid until: {new Date(q.validUntil).toLocaleDateString()}</span>}
                      {q.deliveryTimeline && <span>Delivery: {q.deliveryTimeline}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-slate-900">
                      KES {Number(q.totalAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">incl. {q.taxRate}% VAT</p>
                  </div>
                </div>

                {/* Action buttons for pending quotations */}
                {(q.status === 'SENT' || q.status === 'VIEWED') && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setActionModal({ id: q.id, action: 'approve' })}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => setActionModal({ id: q.id, action: 'reject' })}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                    >
                      View details <ChevronDown className={`w-4 h-4 transition-transform ${expanded === q.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
                {q.status !== 'SENT' && q.status !== 'VIEWED' && (
                  <button
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-3"
                  >
                    {expanded === q.id ? 'Hide' : 'View'} details <ChevronDown className={`w-4 h-4 transition-transform ${expanded === q.id ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Items breakdown */}
              {expanded === q.id && q.items?.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Service Breakdown</h4>
                  <div className="space-y-2">
                    {q.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-slate-900">KES {Number(item.totalPrice).toLocaleString()}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity} × {Number(item.unitPrice).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 mt-4 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span><span>KES {Number(q.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>VAT ({q.taxRate}%)</span><span>KES {Number(q.taxAmount).toLocaleString()}</span>
                    </div>
                    {q.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span><span>- KES {Number(q.discountAmount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-200">
                      <span>Total</span><span>KES {Number(q.totalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                  {q.terms && (
                    <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                      <p className="font-semibold mb-1">Terms & Conditions</p>
                      <p>{q.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              {actionModal.action === 'approve'
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : <XCircle className="w-6 h-6 text-red-600" />
              }
              <h2 className="text-lg font-bold text-slate-900">
                {actionModal.action === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
              </h2>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              {actionModal.action === 'approve'
                ? 'By approving this quotation, you confirm that you agree to the terms and pricing. Our team will begin project setup.'
                : 'Please provide a reason for rejecting this quotation.'}
            </p>
            {actionModal.action === 'reject' && (
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
                rows={3}
                placeholder="Reason for rejection..."
              />
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleAction} disabled={acting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 ${
                  actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}>
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
