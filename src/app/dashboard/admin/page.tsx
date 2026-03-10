'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users, ShieldCheck, Plus, Eye, EyeOff, Edit2, Power, PowerOff,
  Key, Search, Filter, RefreshCw, Activity, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, User, AlertTriangle,
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
                  {['User','Company Email','Role','Linked Employee','Password','Status','Actions'].map(h => (
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
                      {u.rawPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                            {viewPwdId === u.id ? u.rawPassword : '••••••••'}
                          </span>
                          <button onClick={() => setViewPwdId(viewPwdId === u.id ? null : u.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded">
                            {viewPwdId === u.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">User-defined</span>
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
                        <button onClick={() => { setEditing(u); setShowCreate(true) }} title="Edit"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
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
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'EMPLOYEE',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      const res = await fetch(user ? `/api/admin/users/${user.id}` : '/api/admin/users', {
        method: user ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{user ? 'Edit User' : 'Create User Account'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{user ? `Editing ${user.email}` : 'Create a standalone system login'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Company Email (Login) <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
              placeholder="name@helvino.org"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {user ? 'New Password (leave blank to keep current)' : 'Password'} {!user && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)} required={!user}
                placeholder={user ? 'Enter new password to change...' : 'Set login password'}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">System Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : user ? '💾 Save Changes' : '✅ Create User'}
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
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (filterEntity) params.set('entity', filterEntity)
    if (filterAction) params.set('action', filterAction)
    const data = await fetch(`/api/admin/audit-logs?${params}`).then(r => r.json())
    setLogs(data.logs || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
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
