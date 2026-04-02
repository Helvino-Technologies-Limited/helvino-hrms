'use client'
import { useEffect, useState } from 'react'
import { Receipt, ChevronDown, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-400',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [payModal, setPayModal] = useState<any>(null)

  useEffect(() => {
    fetch('/api/client/invoices')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setInvoices(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalUnpaid = invoices
    .filter(i => ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(i.status))
    .reduce((sum, i) => sum + (i.balanceDue || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-500 text-sm mt-0.5">View and pay your invoices</p>
      </div>

      {totalUnpaid > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Outstanding Balance: KES {Number(totalUnpaid).toLocaleString()}</p>
            <p className="text-xs text-red-600">Please settle your outstanding invoices to avoid service disruption.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No invoices yet</h3>
          <p className="text-slate-400 text-sm mt-1">Invoices from our team will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{inv.invoiceNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Issued: {new Date(inv.issueDate).toLocaleDateString()}</span>
                      <span className={inv.status === 'OVERDUE' ? 'text-red-500 font-medium' : ''}>
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-slate-900">
                      KES {Number(inv.totalAmount).toLocaleString()}
                    </p>
                    {inv.amountPaid > 0 && (
                      <p className="text-xs text-green-600">Paid: KES {Number(inv.amountPaid).toLocaleString()}</p>
                    )}
                    {inv.balanceDue > 0 && (
                      <p className="text-xs text-red-600 font-medium">Balance: KES {Number(inv.balanceDue).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  {['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(inv.status) && (
                    <button
                      onClick={() => setPayModal(inv)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                  >
                    {expanded === inv.id ? 'Hide' : 'View'} details
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === inv.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Items */}
              {expanded === inv.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Invoice Items</h4>
                  <div className="space-y-2">
                    {inv.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">KES {Number(item.totalPrice).toLocaleString()}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity} × {Number(item.unitPrice).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 mt-4 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span><span>KES {Number(inv.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>VAT ({inv.taxRate}%)</span><span>KES {Number(inv.taxAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-200">
                      <span>Total</span><span>KES {Number(inv.totalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Payment history */}
                  {inv.payments?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payments Received</h5>
                      {inv.payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-slate-700">{p.method.replace('_', ' ')}</span>
                            {p.reference && <span className="text-slate-400 text-xs">Ref: {p.reference}</span>}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-700">KES {Number(p.amount).toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Instructions Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Payment Instructions</h2>
            <p className="text-slate-500 text-sm mb-4">
              Invoice <span className="font-mono font-semibold">{payModal.invoiceNumber}</span> — KES {Number(payModal.balanceDue || payModal.totalAmount).toLocaleString()}
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm font-bold text-green-800 mb-1">M-Pesa Paybill</p>
                <p className="text-sm text-green-700">Paybill No: <span className="font-mono font-bold">522522</span></p>
                <p className="text-sm text-green-700">Account No: <span className="font-mono font-bold">{payModal.invoiceNumber}</span></p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-bold text-blue-800 mb-1">Bank Transfer</p>
                <p className="text-sm text-blue-700">Bank: <span className="font-semibold">Equity Bank</span></p>
                <p className="text-sm text-blue-700">Account: <span className="font-mono font-semibold">1234567890</span></p>
                <p className="text-sm text-blue-700">Name: <span className="font-semibold">Helvino Technologies Ltd</span></p>
                <p className="text-sm text-blue-700">Ref: <span className="font-mono font-semibold">{payModal.invoiceNumber}</span></p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">After payment, send proof to <span className="font-semibold">customer@helvino.org</span> or WhatsApp <span className="font-semibold">+254 703 445 756</span> with your invoice number.</p>
              </div>
            </div>
            <button onClick={() => setPayModal(null)}
              className="w-full mt-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
