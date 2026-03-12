'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export default function FinancialReportsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function loadReports() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const res = await fetch(`/api/accounting/reports?${params}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to load reports')
    }
    setLoading(false)
  }

  useEffect(() => { loadReports() }, [])

  const pl = data?.profitLoss ?? {}
  const expenseByCategory: any[] = data?.expenseByCategory ?? []
  const revenueByMonth: any[] = data?.revenueByMonth ?? []
  const paymentMethods: any[] = data?.paymentMethods ?? []
  const invoiceStatus: any[] = data?.invoiceStatusBreakdown ?? []

  const maxExpense = expenseByCategory.reduce((m: number, e: any) => Math.max(m, e.amount), 1)
  const maxRevenue = revenueByMonth.reduce((m: number, r: any) => Math.max(m, r.amount), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 text-sm">Profit & Loss, Revenue, and Expense Analysis</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold text-slate-500">From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold text-slate-500">To:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={loadReports}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
            Apply
          </button>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(loadReports, 0) }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-6 h-32 animate-pulse border border-slate-100 shadow-sm" />)}
        </div>
      ) : (
        <>
          {/* P&L Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" /> Profit & Loss Statement
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-green-700 uppercase mb-1">Total Revenue</div>
                <div className="text-2xl font-black text-green-700">{formatCurrency(pl.totalRevenue ?? 0)}</div>
                <div className="text-xs text-green-600 mt-1">From paid invoices</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-red-700 uppercase mb-1">Total Expenses</div>
                <div className="text-2xl font-black text-red-700">{formatCurrency(pl.totalExpenses ?? 0)}</div>
                <div className="text-xs text-red-600 mt-1">Approved expenses</div>
              </div>
              <div className={`rounded-xl p-4 ${(pl.netProfit ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className={`text-xs font-semibold uppercase mb-1 ${(pl.netProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Net Profit</div>
                <div className={`text-2xl font-black ${(pl.netProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(Math.abs(pl.netProfit ?? 0))}</div>
                <div className={`text-xs mt-1 ${(pl.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(pl.netProfit ?? 0) >= 0 ? 'Profit' : 'Loss'}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-700 uppercase mb-1">Outstanding Invoices</div>
                <div className="text-2xl font-black text-blue-700">{formatCurrency(pl.outstandingInvoices ?? 0)}</div>
                <div className="text-xs text-blue-600 mt-1">Pending collection</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-orange-700 uppercase mb-1">Bills Owed</div>
                <div className="text-2xl font-black text-orange-700">{formatCurrency(pl.totalBillsOwed ?? 0)}</div>
                <div className="text-xs text-orange-600 mt-1">To suppliers</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-700 uppercase mb-1">Total Invoices</div>
                <div className="text-2xl font-black text-slate-700">{pl.totalInvoices ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">{pl.paidInvoices ?? 0} paid</div>
              </div>
            </div>
          </div>

          {/* Revenue by Month & Invoice Status */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Revenue by Month */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" /> Revenue by Month
              </h2>
              {revenueByMonth.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No payment data</p>
              ) : (
                <div className="space-y-2.5">
                  {revenueByMonth.map((r: any) => (
                    <div key={r.month} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 w-20 flex-shrink-0">{r.month}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-green-500 rounded-lg flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${Math.max(5, Math.round((r.amount / maxRevenue) * 100))}%` }}>
                          <span className="text-white text-xs font-bold text-right">{formatCurrency(r.amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Invoice Status
              </h2>
              <div className="space-y-3">
                {invoiceStatus.filter(s => s.count > 0).map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-700">{s.status.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{s.count} invoices</div>
                      <div className="text-xs text-slate-500">{formatCurrency(s.amount)}</div>
                    </div>
                  </div>
                ))}
                {invoiceStatus.every(s => s.count === 0) && (
                  <p className="text-slate-400 text-sm text-center py-8">No invoice data</p>
                )}
              </div>
            </div>
          </div>

          {/* Expense by Category & Payment Methods */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Expense by Category */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" /> Expenses by Category
              </h2>
              {expenseByCategory.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No expense data</p>
              ) : (
                <div className="space-y-2.5">
                  {expenseByCategory.sort((a, b) => b.amount - a.amount).map((e: any) => (
                    <div key={e.category} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0 truncate">{e.category}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-lg flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${Math.max(5, Math.round((e.amount / maxExpense) * 100))}%` }}>
                          <span className="text-white text-xs font-bold">{formatCurrency(e.amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-4">Payment Methods</h2>
              {paymentMethods.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No payment data</p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.sort((a, b) => b.amount - a.amount).map((p: any) => {
                    const total = paymentMethods.reduce((s: number, pm: any) => s + pm.amount, 0)
                    const pct = total > 0 ? Math.round((p.amount / total) * 100) : 0
                    return (
                      <div key={p.method} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm font-semibold text-slate-700">{p.method.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">{formatCurrency(p.amount)}</div>
                          <div className="text-xs text-slate-500">{pct}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
