'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound, Shield, Search, RefreshCw, Lock, Unlock,
  CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp,
  Copy, Eye, EyeOff, IdCard, Calendar, User,
} from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  nationalId: string | null
  dateOfBirth: string | null
  secretCodeHash: string | null
  loginAttempts: number
  accountLockedUntil: string | null
  employmentStatus: string
  department: { name: string } | null
  authLogs: Array<{ status: string; createdAt: string; ipAddress: string | null }>
}

interface AuthLog {
  id: string
  nationalId: string
  status: string
  reason: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function AuthCredentialsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({})
  const [showCode, setShowCode] = useState<Record<string, boolean>>({})
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuthLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hr/auth-credentials')
      const data = await res.json()
      setEmployees(data.employees || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeCode} ${e.nationalId || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  async function generateCode(employeeId: string) {
    setGeneratingFor(employeeId)
    try {
      const res = await fetch(`/api/hr/auth-credentials/${employeeId}`, { method: 'POST' })
      const data = await res.json()
      if (data.secretCode) {
        setGeneratedCodes(prev => ({ ...prev, [employeeId]: data.secretCode }))
        setShowCode(prev => ({ ...prev, [employeeId]: true }))
        await fetchEmployees()
      } else {
        alert(data.error || 'Failed to generate code')
      }
    } finally {
      setGeneratingFor(null)
    }
  }

  async function toggleLock(employeeId: string, action: 'lock' | 'unlock') {
    setActionLoading(employeeId)
    try {
      await fetch(`/api/hr/auth-credentials/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await fetchEmployees()
    } finally {
      setActionLoading(null)
    }
  }

  async function loadLogs(employeeId: string) {
    if (expandedLogs === employeeId) { setExpandedLogs(null); return }
    setExpandedLogs(employeeId)
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/hr/auth-credentials/${employeeId}/logs`)
      const data = await res.json()
      setLogs(data.logs || [])
    } finally {
      setLogsLoading(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
  }

  const isLocked = (emp: Employee) =>
    (emp.accountLockedUntil && new Date(emp.accountLockedUntil) > new Date()) ||
    emp.loginAttempts >= 5

  const hasCredentials = (emp: Employee) => !!emp.secretCodeHash
  const missingInfo = (emp: Employee) => !emp.nationalId || !emp.dateOfBirth

  const stats = {
    total: employees.length,
    credentialed: employees.filter(hasCredentials).length,
    locked: employees.filter(isLocked).length,
    missing: employees.filter(missingInfo).length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" />
            Employee Auth Credentials
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage identity-based login credentials for all staff
          </p>
        </div>
        <button onClick={fetchEmployees} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, icon: User, color: 'blue' },
          { label: 'Credentials Set', value: stats.credentialed, icon: CheckCircle, color: 'green' },
          { label: 'Locked Accounts', value: stats.locked, icon: Lock, color: 'red' },
          { label: 'Missing Info', value: stats.missing, icon: AlertCircle, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-${s.color}-100`}>
              <s.icon className={`w-4 h-4 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, employee code, or National ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading employees...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">National ID / DOB</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Credentials</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Login</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(emp => (
                  <>
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-slate-500">{emp.employeeCode} · {emp.jobTitle}</div>
                        {emp.department && <div className="text-xs text-slate-400">{emp.department.name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {emp.nationalId ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <IdCard className="w-3.5 h-3.5 text-slate-400" />
                            {emp.nationalId}
                          </div>
                        ) : (
                          <span className="text-amber-600 text-xs font-medium">No National ID</span>
                        )}
                        {emp.dateOfBirth ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(emp.dateOfBirth).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-amber-600 text-xs">No DOB set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasCredentials(emp) ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Code Set
                            </span>
                            {generatedCodes[emp.id] && (
                              <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                                <code className={`text-xs font-mono text-blue-800 ${showCode[emp.id] ? '' : 'blur-sm select-none'}`}>
                                  {generatedCodes[emp.id]}
                                </code>
                                <button onClick={() => setShowCode(p => ({ ...p, [emp.id]: !p[emp.id] }))}
                                  className="text-blue-500 hover:text-blue-700">
                                  {showCode[emp.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button onClick={() => copyCode(generatedCodes[emp.id])}
                                  className="text-blue-500 hover:text-blue-700">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Not Set
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLocked(emp) ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Active
                            </span>
                            {emp.loginAttempts > 0 && (
                              <div className="text-xs text-amber-600 mt-0.5">{emp.loginAttempts} failed attempts</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {emp.authLogs[0] ? (
                          <div>
                            <span className={emp.authLogs[0].status === 'success' ? 'text-green-600' : 'text-red-600'}>
                              {emp.authLogs[0].status}
                            </span>
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(emp.authLogs[0].createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => generateCode(emp.id)}
                            disabled={!!generatingFor || missingInfo(emp)}
                            title={missingInfo(emp) ? 'Employee needs National ID and DOB first' : 'Generate secret code'}
                            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            {generatingFor === emp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <KeyRound className="w-3 h-3" />
                            )}
                            {hasCredentials(emp) ? 'Reset' : 'Generate'}
                          </button>

                          {isLocked(emp) ? (
                            <button
                              onClick={() => toggleLock(emp.id, 'unlock')}
                              disabled={actionLoading === emp.id}
                              className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Unlock className="w-3 h-3" />
                              Unlock
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleLock(emp.id, 'lock')}
                              disabled={actionLoading === emp.id}
                              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Lock className="w-3 h-3" />
                              Lock
                            </button>
                          )}

                          <button
                            onClick={() => loadLogs(emp.id)}
                            className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            {expandedLogs === emp.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLogs === emp.id && (
                      <tr key={`${emp.id}-logs`}>
                        <td colSpan={6} className="bg-slate-50 px-4 py-3">
                          {logsLoading ? (
                            <p className="text-sm text-slate-500">Loading logs...</p>
                          ) : logs.length === 0 ? (
                            <p className="text-sm text-slate-500">No login attempts recorded.</p>
                          ) : (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {logs.map(log => (
                                <div key={log.id} className="flex items-center gap-3 text-xs py-1 border-b border-slate-100 last:border-0">
                                  <span className={`font-medium ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.status.toUpperCase()}
                                  </span>
                                  <span className="text-slate-600">{new Date(log.createdAt).toLocaleString()}</span>
                                  {log.ipAddress && <span className="text-slate-400">IP: {log.ipAddress}</span>}
                                  {log.reason && <span className="text-slate-400 truncate">{log.reason}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">No employees found.</div>
          )}
        </div>
      )}
    </div>
  )
}
