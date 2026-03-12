'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FileText, Plus, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
}

const STATUSES = ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']

export default function InvoicesPage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  async function loadInvoices() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/accounting/invoices?${params}`)
      const d = await res.json()
      setInvoices(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load invoices')
    }
    setLoading(false)
  }

  useEffect(() => { loadInvoices() }, [statusFilter])

  const filtered = invoices.filter(inv =>
    !search ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Invoices</h1>
          <p className="text-slate-500 text-sm">Manage client invoices and billing</p>
        </div>
        <Link href="/dashboard/accounting/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Invoiced</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Collected</div>
          <div className="text-2xl font-black text-green-700">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Outstanding</div>
          <div className="text-2xl font-black text-orange-600">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice or client..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
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
                  {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p>No invoices found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/dashboard/accounting/invoices/${inv.id}`}
                          className="font-mono text-xs text-blue-600 hover:text-blue-700 font-bold">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 text-xs">{inv.clientName}</div>
                        {inv.clientEmail && <div className="text-slate-400 text-xs">{inv.clientEmail}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs ${new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 text-xs">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-green-700 font-semibold">{formatCurrency(inv.amountPaid)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-orange-600 font-semibold">{formatCurrency(inv.balanceDue)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
