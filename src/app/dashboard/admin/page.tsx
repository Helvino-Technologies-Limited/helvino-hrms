'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users, ShieldCheck, Plus, Eye, EyeOff, Edit2, Power, PowerOff,
  Key, Search, RefreshCw, Activity, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, User, AlertTriangle, KeyRound, Copy, IdCard,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  HR_MANAGER: 'bg-purple-100 text-purple-700 border-purple-200',
  DEPARTMENT_HEAD: 'bg-blue-100 text-blue-700 border-blue-200',
  FINANCE_OFFICER: 'bg-green-100 text-green-700 border-green-200',
  SALES_MANAGER: 'bg-orange-100 text-orange-700 border-orange-200',
  SALES_AGENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  EMPLOYEE: 'bg-slate-100 text-slate-600 border-slate-200',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  CREATE_USER: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  UPDATE_USER: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  GENERATE_PAYROLL: 'bg-purple-100 text-purple-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-red-100 text-red-700',
}

const ROLES = ['SUPER_ADMIN','HR_MANAGER','DEPARTMENT_HEAD','FINANCE_OFFICER','SALES_MANAGER','SALES_AGENT','EMPLOYEE']
const IDENTITY_ROLES = ['HR_MANAGER','DEPARTMENT_HEAD','FINANCE_OFFICER','SALES_MANAGER','SALES_AGENT','EMPLOYEE']

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<'users'|'logs'>('users')

  // Redirect non-admins
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN') router.replace('/dashboard')
  }, [session, router])

  if (!session || session.user.role !== 'SUPER_ADMIN') return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" /> Admin Control Panel
          </h1>
          <p className="text-slate-500 text-sm">Manage user accounts, access, and system activity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'users' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users className="w-4 h-4" /> User Accounts
        </button>
        <button onClick={() => setTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'logs' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
          <Activity className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {tab === 'users' ? <UsersPanel /> : <AuditLogsPanel />}
    </div>
  )
}

/* ─── USERS PANEL ─────────────────────────────────────────────── */
function UsersPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewPwdId, setViewPwdId] = useState<string|null>(null)
  const [regenResult, setRegenResult] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/admin/users').then(r => r.json())
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) ||
      u.employee?.firstName?.toLowerCase().includes(q) || u.employee?.lastName?.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus = !filterStatus || (filterStatus === 'ACTIVE' ? u.isActive : !u.isActive)
    return matchSearch && matchRole && matchStatus
  })

  async function toggleActive(user: any) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    if (res.ok) {
      toast.success(user.isActive ? `${user.name || user.email} deactivated` : `${user.name || user.email} activated`)
      load()
    } else {
      toast.error('Failed to update account status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditing(null); setShowCreate(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md hover:shadow-blue-200 transition-all">
            <Plus className="w-4 h-4" /> New User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['User','Company Email','Role','Linked Employee','Auth','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors group ${!u.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {u.employee?.profilePhoto
                            ? <img src={u.employee.profilePhoto} alt="" className="w-full h-full object-cover" />
                            : (u.name || u.email).slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{u.name || '—'}</div>
                          <div className="text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-KE')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-700 text-sm font-mono">{u.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.employee ? (
                        <div>
                          <div className="text-sm font-medium text-slate-800">{u.employee.firstName} {u.employee.lastName}</div>
                          <div className="text-xs text-slate-400">{u.employee.employeeCode} · {u.employee.jobTitle}</div>
                        </div>
                      ) : <span className="text-slate-400 text-xs italic">Standalone account</span>}
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                          <Key className="w-3 h-3" /> Email/Password
                        </span>
                      ) : u.employee ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            <IdCard className="w-3 h-3" /> Identity
                          </span>
                          {regenResult[u.id] && (
                            <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                              <code className={`text-xs font-mono text-green-800 ${viewPwdId === u.id ? '' : 'blur-sm'}`}>
                                {regenResult[u.id]}
                              </code>
                              <button onClick={() => setViewPwdId(viewPwdId === u.id ? null : u.id)}
                                className="text-green-600"><Eye className="w-3 h-3" /></button>
                              <button onClick={() => navigator.clipboard.writeText(regenResult[u.id])}
                                className="text-green-600"><Copy className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(u); setShowCreate(true) }} title="Edit role"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.role !== 'SUPER_ADMIN' && u.employee && (
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ regenerateCode: true }),
                              })
                              const data = await res.json()
                              if (data.secretCode) {
                                setRegenResult(prev => ({ ...prev, [u.id]: data.secretCode }))
                                setViewPwdId(u.id)
                                toast.success('New secret code generated')
                              }
                            }}
                            title="Regenerate secret code"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                          {u.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
          { label: 'Active', value: users.filter(u => u.isActive).length, icon: CheckCircle, color: 'green' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length, icon: XCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <UserModal user={editing} onClose={() => { setShowCreate(false); setEditing(null) }}
          onSave={() => { setShowCreate(false); setEditing(null); load(); toast.success(editing ? 'User updated!' : 'User created!') }} />
      )}
    </div>
  )
}

/* ─── USER MODAL ───────────────────────────────────────────────── */
function UserModal({ user, onClose, onSave }: any) {
  const isEdit = !!user
  const [role, setRole] = useState(user?.role || 'EMPLOYEE')
  const [employeeId, setEmployeeId] = useState(user?.employeeId || '')
  const [employees, setEmployees] = useState<any[]>([])
  const [empSearch, setEmpSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [empLoading, setEmpLoading] = useState(false)
  const [error, setError] = useState('')
  const [secretCode, setSecretCode] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      setEmpLoading(true)
      fetch('/api/admin/employees-without-account')
        .then(r => r.json())
        .then(data => setEmployees(Array.isArray(data) ? data : []))
        .finally(() => setEmpLoading(false))
    }
  }, [isEdit])

  const selectedEmployee = employees.find(e => e.id === employeeId)
  const filteredEmps = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeCode} ${e.nationalId || ''}`
      .toLowerCase().includes(empSearch.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { role } : { employeeId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.secretCode) {
        setSecretCode(data.secretCode)
        setShowCode(true)
        setDone(true)
      } else {
        onSave()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done && secretCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Account Created</h2>
            <p className="text-slate-500 text-sm mt-1">
              Share the secret code below with the employee securely.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Login Credentials</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">National ID</span>
                <span className="font-mono font-medium text-slate-800">
                  {selectedEmployee?.nationalId || employees.find(e => e.id === employeeId)?.nationalId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date of Birth</span>
                <span className="font-mono font-medium text-slate-800">
                  {(() => {
                    const emp = selectedEmployee || employees.find(e => e.id === employeeId)
                    return emp?.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : '—'
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Secret Code</span>
                <div className="flex items-center gap-2">
                  <code className={`font-mono font-bold text-blue-800 text-base tracking-widest ${showCode ? '' : 'blur-sm'}`}>
                    {secretCode}
                  </code>
                  <button onClick={() => setShowCode(p => !p)} className="text-blue-500">
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(secretCode)} className="text-blue-500">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            This secret code will not be shown again. Copy and deliver it securely to the employee.
          </p>

          <button onClick={onSave}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <IdCard className="w-5 h-5 text-blue-600" />
              {isEdit ? 'Edit User Account' : 'Create User Account'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEdit ? `Editing ${user.name || user.email}` : 'Select an employee and assign a role'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Select Employee <span className="text-red-500">*</span>
              </label>
              {empLoading ? (
                <p className="text-sm text-slate-400">Loading employees...</p>
              ) : (
                <>
                  <input
                    type="text"
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="Search by name, code, or National ID..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-50">
                    {filteredEmps.length === 0 ? (
                      <p className="text-sm text-slate-400 p-3 text-center">
                        {employees.length === 0 ? 'All employees already have accounts' : 'No match found'}
                      </p>
                    ) : filteredEmps.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setEmployeeId(emp.id)}
                        className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start justify-between gap-2 ${employeeId === emp.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-400">{emp.employeeCode} · {emp.jobTitle}</div>
                        </div>
                        <div className="text-right text-xs text-slate-400 flex-shrink-0">
                          {emp.nationalId ? (
                            <span className="text-green-600 font-medium">✓ ID set</span>
                          ) : (
                            <span className="text-amber-600">No ID</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>National ID</span>
                    <span className="font-mono">{selectedEmployee.nationalId || <span className="text-red-500">Not set — required</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date of Birth</span>
                    <span className="font-mono">{selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : <span className="text-red-500">Not set — required</span>}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">System Role <span className="text-red-500">*</span></label>
            <select value={role} onChange={e => setRole(e.target.value)} required
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {IDENTITY_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
              <KeyRound className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                A unique secret code (<strong>HVN-XXXXX</strong>) will be automatically generated and displayed after creation.
                The employee will log in using their <strong>National ID</strong>, <strong>Date of Birth</strong>, and this code.
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || (!isEdit && !employeeId)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                : isEdit ? 'Save Changes' : 'Create Account & Generate Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── AUDIT LOGS PANEL ─────────────────────────────────────────── */
function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [expanded, setExpanded] = useState<string|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      if (filterEntity) params.set('entity', filterEntity)
      if (filterAction) params.set('action', filterAction)
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await res.json()
      if (!res.ok) { console.error('Audit logs error:', data); setLoading(false); return }
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    }
    setLoading(false)
  }, [page, search, filterEntity, filterAction])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, filterEntity, filterAction])

  const entities = ['Employee','User','Payroll','Leave','Attendance','Applicant','Job','Lead','Client','Quotation']
  const actions = ['CREATE','UPDATE','DELETE','CREATE_USER','UPDATE_USER','GENERATE_PAYROLL','APPROVE','REJECT']

  function formatJson(val: any) {
    if (!val) return null
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(obj, null, 2)
    } catch { return String(val) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action, entity..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
            <option value="">All Entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
          <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium ml-auto">{total.toLocaleString()} total records</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Activity className="w-12 h-12 text-slate-200 mb-4" />
            <p className="font-semibold">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Time','Action','Entity','Performed By','Details'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-slate-700 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-slate-800">{log.entity}</div>
                        {log.entityId && <div className="text-xs text-slate-400 font-mono">{log.entityId.slice(0, 12)}…</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.employee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                              {log.employee.profilePhoto
                                ? <img src={log.employee.profilePhoto} alt="" className="w-full h-full object-cover" />
                                : log.employee.firstName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{log.employee.firstName} {log.employee.lastName}</div>
                              <div className="text-xs text-slate-400">{log.employee.employeeCode}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic flex items-center gap-1"><AlertTriangle className="w-3 h-3" />System</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                          {expanded === log.id ? '▲ Hide' : '▼ Show'} changes
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-exp`} className="bg-slate-50">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            {log.oldValues && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Before</p>
                                <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 overflow-auto max-h-40 text-slate-600">{formatJson(log.oldValues)}</pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">After</p>
                                <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 overflow-auto max-h-40 text-slate-600">{formatJson(log.newValues)}</pre>
                              </div>
                            )}
                            {!log.oldValues && !log.newValues && (
                              <p className="text-xs text-slate-400 italic col-span-2">No detail data recorded for this action.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-100">
          <span className="text-sm text-slate-500">
            Page {page} of {pages} · {total} records
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
