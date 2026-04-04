'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Shield, Search, RefreshCw, CheckCircle2, AlertCircle,
  Loader2, User, Building2, ChevronDown, Filter,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Employee = {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  jobTitle: string
  profilePhoto: string | null
  employmentStatus: string
  department: { name: string } | null
  user: { id: string; role: string; isActive: boolean } | null
}

// ─── Role definitions ──────────────────────────────────────────────────────────

const ALL_ROLES = [
  { value: 'SUPER_ADMIN',      label: 'Super Admin',      color: 'bg-purple-100 text-purple-800 border-purple-200',   dot: 'bg-purple-500' },
  { value: 'HR_MANAGER',       label: 'HR Manager',       color: 'bg-blue-100 text-blue-800 border-blue-200',         dot: 'bg-blue-500' },
  { value: 'DEPARTMENT_HEAD',  label: 'Department Head',  color: 'bg-indigo-100 text-indigo-800 border-indigo-200',   dot: 'bg-indigo-500' },
  { value: 'FINANCE_OFFICER',  label: 'Finance Officer',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200',dot: 'bg-emerald-500' },
  { value: 'HEAD_OF_SALES',    label: 'Head of Sales',    color: 'bg-rose-100 text-rose-800 border-rose-200',         dot: 'bg-rose-500' },
  { value: 'SALES_MANAGER',    label: 'Sales Manager',    color: 'bg-amber-100 text-amber-800 border-amber-200',      dot: 'bg-amber-500' },
  { value: 'SALES_AGENT',      label: 'Sales Agent',      color: 'bg-orange-100 text-orange-800 border-orange-200',   dot: 'bg-orange-500' },
  { value: 'EMPLOYEE',         label: 'Employee',         color: 'bg-slate-100 text-slate-700 border-slate-200',      dot: 'bg-slate-400' },
]

function getRoleMeta(value: string) {
  return ALL_ROLES.find(r => r.value === value) ?? {
    value, label: value, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400',
  }
}

function RoleBadge({ role }: { role: string }) {
  const meta = getRoleMeta(role)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

// ─── Role Selector dropdown ─────────────────────────────────────────────────────

function RoleSelector({
  current,
  employeeId,
  isSelf,
  canAssignSuperAdmin,
  onChanged,
}: {
  current: string
  employeeId: string
  isSelf: boolean
  canAssignSuperAdmin: boolean
  onChanged: (employeeId: string, newRole: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function select(role: string) {
    if (role === current) { setOpen(false); return }
    setOpen(false)
    setSaving(true)
    try {
      const res = await fetch('/api/hr/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChanged(employeeId, role)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      alert(e.message || 'Failed to update role')
    }
    setSaving(false)
  }

  const availableRoles = canAssignSuperAdmin
    ? ALL_ROLES
    : ALL_ROLES.filter(r => r.value !== 'SUPER_ADMIN')

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isSelf && setOpen(o => !o)}
        disabled={saving || isSelf}
        title={isSelf ? 'You cannot change your own role' : 'Change role'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors
          ${isSelf
            ? 'cursor-not-allowed opacity-60 bg-slate-50 border-slate-200 text-slate-500'
            : saved
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
          }`}
      >
        {saving
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : saved
            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            : null
        }
        <RoleBadge role={current} />
        {!isSelf && !saving && !saved && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 min-w-[200px]">
          <p className="px-3 pb-1.5 pt-0.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Role</p>
          {availableRoles.map(r => (
            <button
              key={r.value}
              onClick={() => select(r.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left
                ${r.value === current ? 'font-bold' : 'font-medium text-slate-700'}`}
            >
              <span className={`w-2 h-2 rounded-full ${r.dot} flex-shrink-0`} />
              {r.label}
              {r.value === current && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RoleManagementPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const canAssignSuperAdmin = isSuperAdmin

  const fetchEmployees = useCallback(async (q = search, rf = roleFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (rf) params.set('role', rf)
      const res = await fetch(`/api/hr/roles?${params}`)
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch {
      // silent
    }
    setLoading(false)
  }, [search, roleFilter])

  useEffect(() => { fetchEmployees() }, [])

  function handleSearch(val: string) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchEmployees(val, roleFilter), 300)
  }

  function handleRoleFilter(val: string) {
    setRoleFilter(val)
    fetchEmployees(search, val)
  }

  function handleRoleChanged(employeeId: string, newRole: string) {
    setEmployees(prev => prev.map(e =>
      e.id === employeeId && e.user
        ? { ...e, user: { ...e.user, role: newRole } }
        : e
    ))
  }

  // Role counts for summary
  const roleCounts = ALL_ROLES.map(r => ({
    ...r,
    count: employees.filter(e => e.user?.role === r.value).length,
  })).filter(r => r.count > 0)

  const noAccount = employees.filter(e => !e.user).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900">Role Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Change employee roles — takes effect immediately on their next request
              </p>
            </div>
            <button
              onClick={() => fetchEmployees()}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Role summary pills */}
          {!loading && roleCounts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleRoleFilter('')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                  !roleFilter
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                All ({employees.length})
              </button>
              {roleCounts.map(r => (
                <button
                  key={r.value}
                  onClick={() => handleRoleFilter(roleFilter === r.value ? '' : r.value)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    roleFilter === r.value
                      ? r.color + ' shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                  {r.label} ({r.count})
                </button>
              ))}
              {noAccount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                  <AlertCircle className="w-3 h-3" /> No account ({noAccount})
                </span>
              )}
            </div>
          )}

          {/* Search */}
          <div className="mt-3 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, code, or title…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <p>
            Role changes are applied to the database instantly.
            The affected employee&apos;s access level updates on their very next page navigation — no logout required.
          </p>
        </div>
      </div>

      {/* List */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No employees found</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {employees.map(emp => {
              const isSelf = session?.user?.employeeId === emp.id
              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-2xl border px-5 py-3.5 flex flex-wrap items-center gap-4 transition-colors
                    ${isSelf ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    {emp.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={emp.profilePhoto}
                        alt={emp.firstName}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-500">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {emp.firstName} {emp.lastName}
                        </span>
                        {isSelf && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{emp.employeeCode}</span>
                        {emp.jobTitle && <><span>·</span><span>{emp.jobTitle}</span></>}
                        {emp.department && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />{emp.department.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* No user account warning */}
                  {!emp.user ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5" />
                      No user account — create credentials first
                    </span>
                  ) : (
                    <RoleSelector
                      current={emp.user.role}
                      employeeId={emp.id}
                      isSelf={isSelf}
                      canAssignSuperAdmin={canAssignSuperAdmin}
                      onChanged={handleRoleChanged}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
