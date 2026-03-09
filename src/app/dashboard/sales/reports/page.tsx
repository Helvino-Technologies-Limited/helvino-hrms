'use client'
import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  TrendingUp, TrendingDown, Users, DollarSign, BarChart3,
  Download, Printer, Calendar, RefreshCw, Award
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type DateRange = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom'

function getDateBounds(range: DateRange, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (range === 'this_month') return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) }
  if (range === 'last_month') return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
  if (range === 'this_quarter') {
    const q = Math.floor(m / 3)
    return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0, 23, 59, 59) }
  }
  if (range === 'this_year') return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) }
  if (range === 'custom' && customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(customEnd + 'T23:59:59') }
  }
  return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) }
}

function getPreviousBounds(range: DateRange, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (range === 'this_month') return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
  if (range === 'last_month') return { start: new Date(y, m - 2, 1), end: new Date(y, m - 1, 0, 23, 59, 59) }
  if (range === 'this_quarter') {
    const q = Math.floor(m / 3)
    return { start: new Date(y, (q - 1) * 3, 1), end: new Date(y, q * 3, 0, 23, 59, 59) }
  }
  if (range === 'this_year') return { start: new Date(y - 1, 0, 1), end: new Date(y - 1, 11, 31, 23, 59, 59) }
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr)
  return d >= start && d <= end
}

function TrendBadge({ value, previous }: { value: number; previous: number }) {
  if (previous === 0 && value === 0) return null
  const pct = previous === 0 ? 100 : Math.round(((value - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <div className={`flex items-center gap-1 text-xs font-bold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {up ? '+' : ''}{pct}%
    </div>
  )
}

function HBarChart({ data, colorClass = 'bg-blue-500' }: { data: { label: string; value: number }[]; colorClass?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-28 text-xs font-medium text-slate-600 text-right truncate flex-shrink-0">{item.label}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className={`${colorClass} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            >
              {item.value > 0 && <span className="text-white text-xs font-bold">{item.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map(item => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs font-bold text-slate-600">{item.value > 0 ? formatCurrency(item.value).replace('KES', '').trim() : ''}</div>
          <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden" style={{ height: '100px' }}>
            <div
              className="bg-gradient-to-t from-blue-600 to-blue-400 w-full rounded-t-lg transition-all duration-500"
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 font-medium truncate w-full text-center">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function SalesReportsPage() {
  const { data: session } = useSession()
  const [dashData, setDashData] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [dateRange, setDateRange] = useState<DateRange>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [dashRes, leadsRes, quotesRes, subsRes] = await Promise.all([
          fetch('/api/sales/dashboard'),
          fetch('/api/sales/leads?limit=1000'),
          fetch('/api/sales/quotations?limit=1000'),
          fetch('/api/sales/subscriptions?limit=1000'),
        ])
        const [dash, leadsData, quotesData, subsData] = await Promise.all([
          dashRes.ok ? dashRes.json() : {},
          leadsRes.ok ? leadsRes.json() : [],
          quotesRes.ok ? quotesRes.json() : [],
          subsRes.ok ? subsRes.json() : [],
        ])
        setDashData(dash)
        setLeads(Array.isArray(leadsData) ? leadsData : leadsData.leads || [])
        setQuotations(Array.isArray(quotesData) ? quotesData : quotesData.quotations || [])
        setSubscriptions(Array.isArray(subsData) ? subsData : subsData.subscriptions || [])
      } catch (err) {
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const { start, end } = useMemo(() => getDateBounds(dateRange, customStart, customEnd), [dateRange, customStart, customEnd])
  const { start: prevStart, end: prevEnd } = useMemo(() => getPreviousBounds(dateRange, customStart, customEnd), [dateRange, customStart, customEnd])

  const filteredLeads = useMemo(() => leads.filter(l => inRange(l.createdAt, start, end)), [leads, start, end])
  const prevLeads = useMemo(() => leads.filter(l => inRange(l.createdAt, prevStart, prevEnd)), [leads, prevStart, prevEnd])

  const filteredQuotations = useMemo(() => quotations.filter(q => inRange(q.createdAt, start, end)), [quotations, start, end])

  const wonLeads = useMemo(() => filteredLeads.filter(l => l.status === 'WON'), [filteredLeads])
  const prevWonLeads = useMemo(() => prevLeads.filter(l => l.status === 'WON'), [prevLeads])

  const conversionRate = filteredLeads.length > 0 ? Math.round((wonLeads.length / filteredLeads.length) * 100) : 0
  const prevConversionRate = prevLeads.length > 0 ? Math.round((prevWonLeads.length / prevLeads.length) * 100) : 0

  const approvedQtValue = useMemo(
    () => filteredQuotations.filter(q => q.status === 'APPROVED').reduce((sum, q) => sum + (q.totalAmount || 0), 0),
    [filteredQuotations]
  )
  const prevApprovedQtValue = useMemo(
    () => quotations.filter(q => q.status === 'APPROVED' && inRange(q.createdAt, prevStart, prevEnd))
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0),
    [quotations, prevStart, prevEnd]
  )

  const activeSubscriptions = useMemo(
    () => subscriptions.filter(s => s.status === 'ACTIVE').length,
    [subscriptions]
  )

  // Leads by status
  const leadsByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1 })
    return Object.entries(counts).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredLeads])

  // Leads by source
  const leadsBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredLeads.forEach(l => { const src = l.source || 'UNKNOWN'; counts[src] = (counts[src] || 0) + 1 })
    return Object.entries(counts).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredLeads])

  // Monthly revenue (last 6 months from approved quotations)
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; value: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('en-KE', { month: 'short' })
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const value = quotations
        .filter(q => q.status === 'APPROVED' && inRange(q.createdAt, mStart, mEnd))
        .reduce((sum, q) => sum + (q.totalAmount || 0), 0)
      months.push({ label, value })
    }
    return months
  }, [quotations])

  // Top clients by deal value (from won leads with expected value)
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; deals: number; value: number }> = {}
    wonLeads.forEach(l => {
      const name = l.companyName || l.contactPerson || 'Unknown'
      if (!map[name]) map[name] = { name, deals: 0, value: 0 }
      map[name].deals++
      map[name].value += l.expectedValue || 0
    })
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [wonLeads])

  // Services breakdown from quotation items
  const servicesBreakdown = useMemo(() => {
    const map: Record<string, { service: string; quoted: number; won: number }> = {}
    filteredQuotations.forEach(q => {
      const items = q.items || []
      items.forEach((item: any) => {
        const svc = item.serviceName || item.name || 'Unknown'
        if (!map[svc]) map[svc] = { service: svc, quoted: 0, won: 0 }
        map[svc].quoted++
        if (q.status === 'APPROVED') map[svc].won++
      })
    })
    return Object.values(map).sort((a, b) => b.quoted - a.quoted).slice(0, 10)
  }, [filteredQuotations])

  // Recent won deals
  const recentWonDeals = useMemo(() =>
    wonLeads
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10),
    [wonLeads]
  )

  function exportCSV() {
    const rows = [
      ['Lead #', 'Contact', 'Company', 'Status', 'Value (KES)', 'Source', 'Assigned To', 'Created'],
      ...filteredLeads.map(l => [
        l.leadNumber,
        l.contactPerson,
        l.companyName || '',
        l.status,
        l.expectedValue || '',
        l.source || '',
        l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '',
        formatDate(l.createdAt),
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Sales Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance insights — Helvino Technologies Limited</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date range selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            Period:
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  dateRange === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Leads',
            value: filteredLeads.length,
            prevValue: prevLeads.length,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            format: (v: number) => v.toString(),
            sub: `${wonLeads.length} won`,
          },
          {
            label: 'Conversion Rate',
            value: conversionRate,
            prevValue: prevConversionRate,
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            format: (v: number) => `${v}%`,
            sub: `${wonLeads.length} / ${filteredLeads.length} leads`,
          },
          {
            label: 'Quotation Value',
            value: approvedQtValue,
            prevValue: prevApprovedQtValue,
            icon: DollarSign,
            color: 'from-purple-500 to-purple-600',
            format: (v: number) => formatCurrency(v),
            sub: 'Approved quotations',
          },
          {
            label: 'Active Subscriptions',
            value: activeSubscriptions,
            prevValue: activeSubscriptions,
            icon: Award,
            color: 'from-amber-500 to-orange-500',
            format: (v: number) => v.toString(),
            sub: 'Recurring revenue',
          },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`bg-gradient-to-br ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <kpi.icon className="text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="flex items-end gap-2 mb-0.5">
              <div className="text-2xl font-black text-slate-900">{kpi.format(kpi.value)}</div>
              <div className="mb-1">
                <TrendBadge value={kpi.value} previous={kpi.prevValue} />
              </div>
            </div>
            <div className="text-slate-700 text-sm font-semibold">{kpi.label}</div>
            <div className="text-slate-400 text-xs mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Leads by Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900">Leads by Status</h3>
          </div>
          {leadsByStatus.length > 0 ? (
            <HBarChart data={leadsByStatus} colorClass="bg-blue-500" />
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No leads in period</div>
          )}
        </div>

        {/* Leads by Source */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900">Leads by Source</h3>
          </div>
          {leadsBySource.length > 0 ? (
            <HBarChart data={leadsBySource} colorClass="bg-purple-500" />
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No data</div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">Approved quotations — last 6 months</p>
          <VBarChart data={monthlyRevenue} />
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Clients */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Top Clients by Deal Value</h3>
            <p className="text-xs text-slate-400 mt-0.5">Won leads — {RANGE_OPTIONS.find(o => o.value === dateRange)?.label}</p>
          </div>
          {topClients.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No won deals in this period</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Client', 'Deals Won', 'Total Value'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topClients.map((client, i) => (
                  <tr key={client.name} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="font-medium text-slate-900 truncate">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{client.deals}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{client.value > 0 ? formatCurrency(client.value) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Services Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Services Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">From quotations in period</p>
          </div>
          {servicesBreakdown.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No quotation items in this period</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Service', 'Times Quoted', 'Times Won'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servicesBreakdown.map(svc => (
                  <tr key={svc.service} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900 max-w-[180px] truncate">{svc.service}</td>
                    <td className="px-5 py-3 text-slate-600">{svc.quoted}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">{svc.won}</span>
                        {svc.quoted > 0 && (
                          <span className="text-xs text-slate-400">({Math.round((svc.won / svc.quoted) * 100)}%)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Won Deals */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Recent Won Deals</h3>
          <p className="text-xs text-slate-400 mt-0.5">{RANGE_OPTIONS.find(o => o.value === dateRange)?.label}</p>
        </div>
        {recentWonDeals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No won deals in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Lead #', 'Client', 'Company', 'Expected Value', 'Closed', 'Assigned To'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentWonDeals.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-blue-600">{lead.leadNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{lead.contactPerson}</td>
                    <td className="px-5 py-3 text-slate-500">{lead.companyName || '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{lead.expectedValue ? formatCurrency(lead.expectedValue) : '—'}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(lead.updatedAt)}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block text-center text-xs text-slate-400 border-t border-slate-200 pt-4 mt-4">
        Helvino Technologies Limited — Sales Report — Generated {new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}
