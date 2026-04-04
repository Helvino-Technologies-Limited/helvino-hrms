'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Shield, Search, RefreshCw, CheckCircle2, AlertCircle,
  Loader2, User, Building2, ChevronDown, Crown, Users,
  Briefcase, UserCog,
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

// ─── Role hierarchy ────────────────────────────────────────────────────────────

const ALL_ROLES = [
  { value: 'SUPER_ADMIN',     label: 'Super Admin',     color: 'bg-purple-100 text-purple-800 border-purple-200',    dot: 'bg-purple-500',  tier: 'superadmin' },
  { value: 'HR_MANAGER',      label: 'HR Manager',      color: 'bg-blue-100 text-blue-800 border-blue-200',          dot: 'bg-blue-500',    tier: 'admin' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head', color: 'bg-indigo-100 text-indigo-800 border-indigo-200',    dot: 'bg-indigo-500',  tier: 'admin' },
  { value: 'FINANCE_OFFICER', label: 'Finance Officer', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', tier: 'admin' },
  { value: 'HEAD_OF_SALES',   label: 'Head of Sales',   color: 'bg-rose-100 text-rose-800 border-rose-200',          dot: 'bg-rose-500',    tier: 'admin' },
  { value: 'SALES_MANAGER',   label: 'Sales Manager',   color: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500',   tier: 'staff' },
  { value: 'SALES_AGENT',     label: 'Sales Agent',     color: 'bg-orange-100 text-orange-800 border-orange-200',    dot: 'bg-orange-500',  tier: 'staff' },
  { value: 'EMPLOYEE',        label: 'Employee',        color: 'bg-slate-100 text-slate-700 border-slate-200',       dot: 'bg-slate-400',   tier: 'staff' },
]

const TIER_ORDER = ['superadmin', 'admin', 'staff']

const TIER_META: Record<string, { label: string; sub: string; icon: any; headerClass: string; cardClass: string; borderClass: string }> = {
  superadmin: {
    label: 'Super Administrator',
    sub: 'Full system access · Oversees all admins and users',
    icon: Crown,
    headerClass: 'text-purple-700',
    cardClass: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200',
    borderClass: 'border-purple-300',
  },
  admin: {
    label: 'Administrators',
    sub: 'Elevated access · Manage people, finance, or sales operations',
    icon: UserCog,
    headerClass: 'text-blue-700',
    cardClass: 'bg-white border-slate-200 hover:border-blue-200',
    borderClass: 'border-slate-200',
  },
  staff: {
    label: 'Staff & Employees',
    sub: 'Standard access · Scoped to their role and team',
    icon: Users,
    headerClass: 'text-slate-600',
    cardClass: 'bg-white border-slate-200 hover:border-slate-300',
    borderClass: 'border-slate-200',
  },
}

function getRoleMeta(value: string) {
  return ALL_ROLES.find(r => r.value === value) ?? {
    value, label: value, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', tier: 'staff',
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
  isSuperAdminTarget,
  canAssignSuperAdmin,
  onChanged,
}: {
  current: string
  employeeId: string
  isSelf: boolean
  isSuperAdminTarget: boolean
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

  const isLocked = isSelf || isSuperAdminTarget

  const availableRoles = canAssignSuperAdmin
    ? ALL_ROLES
    : ALL_ROLES.filter(r => r.value !== 'SUPER_ADMIN')

  // Group available roles by tier for the dropdown
  const grouped = TIER_ORDER.map(tier => ({
    tier,
    meta: TIER_META[tier],
    roles: availableRoles.filter(r => r.tier === tier),
  })).filter(g => g.roles.length > 0)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLocked && setOpen(o => !o)}
        disabled={saving || isLocked}
        title={
          isSelf ? 'You cannot change your own role'
          : isSuperAdminTarget ? 'Super Admin role is protected'
          : 'Change role'
        }
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors
          ${isLocked
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
        {!isLocked && !saving && !saved && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 min-w-[220px]">
          {grouped.map((group, gi) => (
            <div key={group.tier}>
              {gi > 0 && <div className="my-1.5 border-t border-slate-100" />}
              <p className="px-3 pt-1 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <group.meta.icon className="w-3 h-3" />
                {group.meta.label}
              </p>
              {group.roles.map(r => (
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
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Employee Card ─────────────────────────────────────────────────────────────

function EmployeeCard({
  emp,
  isSelf,
  canAssignSuperAdmin,
  onChanged,
  tier,
}: {
  emp: Employee
  isSelf: boolean
  canAssignSuperAdmin: boolean
  onChanged: (id: string, role: string) => void
  tier: string
}) {
  const meta = TIER_META[tier]
  const isSuperAdminTarget = emp.user?.role === 'SUPER_ADMIN'

  return (
    <div className={`rounded-2xl border px-5 py-4 flex flex-wrap items-center gap-4 transition-colors
      ${isSelf ? 'border-blue-300 bg-blue-50/60' : meta.cardClass}`}>

      {/* Avatar */}
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <div className="relative flex-shrink-0">
          {emp.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={emp.profilePhoto} alt={emp.firstName} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
              ${tier === 'superadmin'
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                : tier === 'admin'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
          )}
          {tier === 'superadmin' && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
              <Crown className="w-3 h-3 text-yellow-900" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${tier === 'superadmin' ? 'text-purple-900' : 'text-slate-800'}`}>
              {emp.firstName} {emp.lastName}
            </span>
            {isSelf && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md">You</span>
            )}
            {tier === 'superadmin' && (
              <span className="text-xs font-bold text-purple-600 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> System Owner
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
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

      {/* Role selector */}
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
          isSuperAdminTarget={isSuperAdminTarget && !canAssignSuperAdmin}
          canAssignSuperAdmin={canAssignSuperAdmin}
          onChanged={onChanged}
        />
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

  // Group employees by hierarchy tier
  const grouped = TIER_ORDER.map(tier => {
    const tierRoleValues = ALL_ROLES.filter(r => r.tier === tier).map(r => r.value)
    return {
      tier,
      meta: TIER_META[tier],
      employees: employees.filter(e => tierRoleValues.includes(e.user?.role ?? '')),
      noAccount: tier === 'staff' ? employees.filter(e => !e.user) : [],
    }
  }).filter(g => g.employees.length > 0 || g.noAccount.length > 0)

  // Summary counts per role
  const roleCounts = ALL_ROLES.map(r => ({
    ...r,
    count: employees.filter(e => e.user?.role === r.value).length,
  })).filter(r => r.count > 0)
  const noAccount = employees.filter(e => !e.user).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Role Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Hierarchy view · changes take effect immediately on the employee&apos;s next request
              </p>
            </div>
            <button
              onClick={() => fetchEmployees()}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Role filter pills */}
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
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <p>
            Role changes are applied to the database instantly.
            The affected employee&apos;s access level updates on their very next page navigation — no logout required.
          </p>
        </div>
      </div>

      {/* Hierarchy sections */}
      <div className="max-w-5xl mx-auto px-6 py-5 space-y-8">
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
          grouped.map((group, gi) => (
            <div key={group.tier}>
              {/* Connector line between sections */}
              {gi > 0 && (
                <div className="flex items-center gap-3 mb-4 -mt-2">
                  <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                  <span className="text-xs text-slate-400 font-medium px-2">reports to above</span>
                  <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                </div>
              )}

              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${group.tier === 'superadmin' ? 'bg-purple-100'
                  : group.tier === 'admin' ? 'bg-blue-100'
                  : 'bg-slate-100'}`}>
                  <group.meta.icon className={`w-4 h-4 ${group.meta.headerClass}`} />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${group.meta.headerClass}`}>{group.meta.label}</h2>
                  <p className="text-xs text-slate-400">{group.meta.sub}</p>
                </div>
                <div className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full
                  ${group.tier === 'superadmin' ? 'bg-purple-100 text-purple-700'
                  : group.tier === 'admin' ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'}`}>
                  {group.employees.length + (group.tier === 'staff' ? group.noAccount.length : 0)} {group.tier === 'superadmin' ? 'person' : 'people'}
                </div>
              </div>

              {/* Employee cards */}
              <div className={`space-y-2 ${group.tier === 'superadmin' ? 'pl-0' : group.tier === 'admin' ? 'pl-4' : 'pl-8'}`}>
                {group.employees.map(emp => (
                  <EmployeeCard
                    key={emp.id}
                    emp={emp}
                    isSelf={session?.user?.employeeId === emp.id}
                    canAssignSuperAdmin={canAssignSuperAdmin}
                    onChanged={handleRoleChanged}
                    tier={group.tier}
                  />
                ))}
                {/* No-account employees (shown in staff tier) */}
                {group.noAccount.map(emp => (
                  <EmployeeCard
                    key={emp.id}
                    emp={emp}
                    isSelf={false}
                    canAssignSuperAdmin={canAssignSuperAdmin}
                    onChanged={handleRoleChanged}
                    tier={group.tier}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
