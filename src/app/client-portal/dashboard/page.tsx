'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Package, FolderOpen, FileText, Receipt, RotateCcw, LifeBuoy,
  TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, Bell
} from 'lucide-react'

export default function ClientDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = data?.stats || {}
  const client = data?.client

  const statCards = [
    { label: 'Active Services', value: stats.activeServices ?? 0, icon: Package, color: 'blue', href: '/client-portal/projects' },
    { label: 'Active Projects', value: stats.activeProjects ?? 0, icon: FolderOpen, color: 'indigo', href: '/client-portal/projects' },
    { label: 'Pending Quotations', value: stats.pendingQuotations ?? 0, icon: FileText, color: 'amber', href: '/client-portal/quotations' },
    { label: 'Unpaid Invoices', value: stats.unpaidInvoices ?? 0, icon: Receipt, color: 'red', href: '/client-portal/invoices' },
    { label: 'Renewals Due Soon', value: stats.expiringSoon ?? 0, icon: RotateCcw, color: 'orange', href: '/client-portal/subscriptions' },
    { label: 'Open Tickets', value: stats.openTickets ?? 0, icon: LifeBuoy, color: 'purple', href: '/client-portal/tickets' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  const iconColorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold">{client?.companyName || session?.user?.name}</h1>
            <p className="text-blue-200 mt-1 text-sm">Here&apos;s an overview of your account with Helvino Technologies.</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link key={card.label} href={card.href}
            className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all group ${card.value > 0 ? `border-${card.color}-200` : 'border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.value > 0 ? `text-${card.color}-600` : 'text-slate-700'}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorMap[card.color]}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/client-portal/services"
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center">
            <Package className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Request Service</span>
          </Link>
          <Link href="/client-portal/tickets"
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center">
            <LifeBuoy className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Open Ticket</span>
          </Link>
          <Link href="/client-portal/invoices"
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-center">
            <Receipt className="w-6 h-6 text-red-600" />
            <span className="text-xs font-semibold text-red-700">Pay Invoice</span>
          </Link>
          <Link href="/client-portal/documents"
            className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-center">
            <FileText className="w-6 h-6 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700">Documents</span>
          </Link>
        </div>
      </div>

      {/* Recent Notifications */}
      {data?.recentNotifications?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Notifications</h2>
          <div className="space-y-3">
            {data.recentNotifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {(stats.unpaidInvoices > 0 || stats.expiringSoon > 0) && (
        <div className="space-y-3">
          {stats.unpaidInvoices > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  You have {stats.unpaidInvoices} unpaid invoice{stats.unpaidInvoices > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600">Please settle your outstanding balance to avoid service interruption.</p>
              </div>
              <Link href="/client-portal/invoices" className="text-xs font-bold text-red-700 hover:underline whitespace-nowrap">
                View →
              </Link>
            </div>
          )}
          {stats.expiringSoon > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  {stats.expiringSoon} subscription{stats.expiringSoon > 1 ? 's' : ''} expiring soon
                </p>
                <p className="text-xs text-amber-600">Renew now to avoid service disruption.</p>
              </div>
              <Link href="/client-portal/subscriptions" className="text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
                Renew →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
