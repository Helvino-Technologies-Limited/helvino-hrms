'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, TrendingDown, FileText, AlertTriangle,
  Landmark, ArrowRight, CreditCard, Receipt, BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  )
}

export default function AccountingDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/accounting/dashboard')
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to load finance dashboard')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const stats = data?.stats ?? {}
  const recentInvoices: any[] = data?.recentInvoices ?? []
  const recentExpenses: any[] = data?.recentExpenses ?? []

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Finance Dashboard</h1>
          <p className="text-slate-500 text-sm">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/accounting/invoices/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <FileText className="w-4 h-4" />
            New Invoice
          </Link>
          <Link href="/dashboard/accounting/reports"
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm border border-slate-200 transition-colors">
            <TrendingUp className="w-4 h-4" />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue ?? 0)}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Total Revenue</div>
            <p className="text-slate-400 text-xs mt-1">From paid invoices</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalExpenses ?? 0)}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Total Expenses</div>
            <p className="text-slate-400 text-xs mt-1">Approved & reimbursed</p>
          </div>
          <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${(stats.netProfit ?? 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 ${(stats.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div className={`text-2xl font-black ${(stats.netProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(stats.netProfit ?? 0))}
            </div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Net Profit</div>
            <p className="text-slate-400 text-xs mt-1">{(stats.netProfit ?? 0) >= 0 ? 'Profit' : 'Loss'}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.outstandingInvoices ?? 0)}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Outstanding</div>
            <Link href="/dashboard/accounting/invoices" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
              View invoices <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-700">{stats.overdueInvoicesCount ?? 0}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Overdue Invoices</div>
            <p className="text-slate-400 text-xs mt-1">Require attention</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Landmark className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.bankBalance ?? 0)}</div>
            <div className="text-slate-700 text-sm font-semibold mt-0.5">Bank Balance</div>
            <Link href="/dashboard/accounting/bank" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1 mt-1">
              View accounts <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/accounting/invoices', icon: FileText, label: 'Invoices', color: 'blue' },
          { href: '/dashboard/accounting/payments', icon: CreditCard, label: 'Payments', color: 'green' },
          { href: '/dashboard/accounting/expenses', icon: Receipt, label: 'Expenses', color: 'orange' },
          { href: '/dashboard/accounting/chart-of-accounts', icon: BookOpen, label: 'Chart of Accounts', color: 'purple' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${item.color}-100`}>
              <item.icon className={`w-4 h-4 text-${item.color}-600`} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{item.label}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Two-column: Recent Invoices + Recent Expenses */}
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />)}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-5" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />)}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Invoices</h3>
              <Link href="/dashboard/accounting/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentInvoices.map((inv: any) => (
                  <Link key={inv.id} href={`/dashboard/accounting/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{inv.invoiceNumber}</div>
                      <div className="text-slate-400 text-xs">{inv.client?.companyName || inv.clientName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">{formatCurrency(inv.totalAmount)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${INVOICE_STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Expenses</h3>
              <Link href="/dashboard/accounting/expenses"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No expenses yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentExpenses.map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{exp.title}</div>
                      <div className="text-slate-400 text-xs">
                        {exp.category} · {exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : 'General'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">{formatCurrency(exp.amount)}</div>
                      <div className="text-slate-400 text-xs">{formatDate(exp.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
