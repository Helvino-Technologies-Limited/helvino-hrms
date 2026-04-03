'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Shield, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, Clock, Filter, X, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

const ENTITIES = [
  'LEAD', 'LEAD_ACTIVITY', 'CLIENT', 'QUOTATION', 'SALES_TASK',
  'TEAM_TASK', 'MEETING', 'SUBSCRIPTION', 'SERVICE', 'LETTER',
  'PORTFOLIO', 'SALES_TARGET',
]

const ACTIONS = [
  'CREATED', 'UPDATED', 'DELETED', 'DEACTIVATED',
  'STATUS_CHANGED', 'SENT', 'LOGGED_ACTIVITY',
]

const ACTION_COLORS: Record<string, string> = {
  CREATED:        'bg-green-100 text-green-700 border-green-200',
  UPDATED:        'bg-blue-100 text-blue-700 border-blue-200',
  DELETED:        'bg-red-100 text-red-700 border-red-200',
  DEACTIVATED:    'bg-orange-100 text-orange-700 border-orange-200',
  STATUS_CHANGED: 'bg-purple-100 text-purple-700 border-purple-200',
  SENT:           'bg-indigo-100 text-indigo-700 border-indigo-200',
  LOGGED_ACTIVITY:'bg-amber-100 text-amber-700 border-amber-200',
}

const ENTITY_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  LEAD_ACTIVITY: 'Lead Activity',
  CLIENT: 'Client',
  QUOTATION: 'Quotation',
  SALES_TASK: 'Sales Task',
  TEAM_TASK: 'Team Task',
  MEETING: 'Meeting',
  SUBSCRIPTION: 'Subscription',
  SERVICE: 'Service Catalog',
  LETTER: 'Official Letter',
  PORTFOLIO: 'Portfolio',
  SALES_TARGET: 'Sales Target',
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  })
}

function JsonDiff({ label, data, color }: { label: string; data: any; color: string }) {
  if (!data) return null
  const entries = Object.entries(data).filter(([k]) => k !== '_label')
  if (entries.length === 0) return null
  return (
    <div className={`rounded-lg border p-2 ${color}`}>
      <div className="text-xs font-semibold mb-1 opacity-70 uppercase tracking-wide">{label}</div>
      <div className="space-y-0.5">
        {entries.map(([key, val]) => (
          <div key={key} className="text-xs font-mono flex gap-2 flex-wrap">
            <span className="opacity-60 font-semibold">{key}:</span>
            <span className="break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogRow({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false)
  const actor = log.employee
    ? `${log.employee.firstName} ${log.employee.lastName}`
    : '—'
  const jobTitle = log.employee?.jobTitle ?? ''
  const label = (log.newValues as any)?._label ?? log.entityId ?? '—'
  const hasDiff = log.oldValues || log.newValues

  return (
    <>
      <tr
        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${expanded ? 'bg-blue-50/30' : ''}`}
        onClick={() => hasDiff && setExpanded(e => !e)}
      >
        {/* Time */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {formatDateTime(log.createdAt)}
          </div>
        </td>

        {/* Actor */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {actor[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">{actor}</div>
              {jobTitle && <div className="text-xs text-slate-400">{jobTitle}</div>}
            </div>
          </div>
        </td>

        {/* Action */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {log.action.replace(/_/g, ' ')}
          </span>
        </td>

        {/* Entity */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            {ENTITY_LABELS[log.entity] ?? log.entity}
          </span>
        </td>

        {/* Label */}
        <td className="px-4 py-3 max-w-xs">
          <span className="text-xs text-slate-700 truncate block">{label}</span>
        </td>

        {/* Expand */}
        <td className="px-4 py-3 whitespace-nowrap">
          {hasDiff ? (
            <button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && hasDiff && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td colSpan={6} className="px-6 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <JsonDiff label="Before" data={log.oldValues} color="border-red-200 bg-red-50 text-red-800" />
              <JsonDiff label="After" data={log.newValues} color="border-green-200 bg-green-50 text-green-800" />
            </div>
            {log.ipAddress && (
              <div className="mt-2 text-xs text-slate-400">
                IP: {log.ipAddress} · UA: {log.userAgent?.slice(0, 80)}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AuditLogPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined

  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (entity) params.set('entity', entity)
      if (action) params.set('action', action)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('page', String(page))
      params.set('limit', String(LIMIT))

      const res = await fetch(`/api/sales/audit-log?${params}`)
      if (!res.ok) { toast.error('Failed to load audit logs'); return }
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      toast.error('Failed to load audit logs')
    }
    setLoading(false)
  }, [entity, action, from, to, page])

  useEffect(() => { load() }, [load])

  function clearFilters() {
    setEntity('')
    setAction('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const hasFilters = entity || action || from || to

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">CRM Audit Log</h1>
            <p className="text-slate-500 text-sm">
              {total.toLocaleString()} events recorded
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Filter</span>
          </div>

          <select
            value={entity}
            onChange={e => { setEntity(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Modules</option>
            {ENTITIES.map(e => <option key={e} value={e}>{ENTITY_LABELS[e]}</option>)}
          </select>

          <select
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">From</label>
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">To</label>
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 border border-slate-200 rounded-xl hover:border-red-200 transition-colors">
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Action pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['', ...ACTIONS].map(a => (
            <button
              key={a}
              onClick={() => { setAction(a); setPage(1) }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                action === a
                  ? 'bg-slate-800 text-white border-slate-800'
                  : `${a ? ACTION_COLORS[a] : 'bg-white text-slate-600 border-slate-200'} hover:border-slate-400`
              }`}>
              {a ? a.replace(/_/g, ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-500">No audit events found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Module', 'Record', 'Details'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">
              Page {page} of {pages} · {total.toLocaleString()} total events
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pages - 4, page - 2)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      p === page
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {p}
                  </button>
                )
              })}
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
