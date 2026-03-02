'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Calendar, Check, X, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, any> = {
  PENDING: { cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  APPROVED: { cls: 'bg-green-100 text-green-700 border-green-200', icon: Check },
  REJECTED: { cls: 'bg-red-100 text-red-700 border-red-200', icon: X },
  CANCELLED: { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: X },
}

export default function LeavesPage() {
  const { data: session } = useSession()
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isHR = ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'].includes(session?.user?.role || '')

  async function loadData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    const [lr, er] = await Promise.all([
      fetch(`/api/leaves?${params}`),
      isHR ? fetch('/api/employees') : Promise.resolve({ json: () => [] }),
    ])
    const [lData, eData] = await Promise.all([lr.json(), er.json()])
    setLeaves(Array.isArray(lData) ? lData : [])
    setEmployees(Array.isArray(eData) ? eData : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [filterStatus])

  async function handleAction(id: string, status: string) {
    setActionLoading(id)
    const res = await fetch(`/api/leaves/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setActionLoading(null); return }
    toast.success(`Leave ${status.toLowerCase()} successfully`)
    loadData()
    setActionLoading(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leave Management</h1>
          <p className="text-slate-500 text-sm">{leaves.filter(l => l.status === 'PENDING').length} pending · {leaves.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md">
          <Plus className="w-4 h-4" />Request Leave
        </button>
      </div>

      {/* Filter pills */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex gap-2 flex-wrap">
          {['','PENDING','APPROVED','REJECTED','CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s || 'All Requests'}
              {s === 'PENDING' && leaves.filter(l => l.status === 'PENDING').length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                  {leaves.filter(l => l.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No leave requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee','Leave Type','Duration','Period','Reason','Status', isHR ? 'Actions' : ''].filter(Boolean).map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave: any) => {
                  const config = STATUS_CONFIG[leave.status]
                  const Icon = config?.icon
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{leave.employee?.firstName} {leave.employee?.lastName}</div>
                            <div className="text-slate-400 text-xs">{leave.employee?.department?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900 text-sm">{leave.leaveType}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900">{leave.days}</span>
                        <span className="text-slate-500 text-xs ml-1">day(s)</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-sm">
                        <div>{formatDate(leave.startDate)}</div>
                        <div className="text-slate-400 text-xs">to {formatDate(leave.endDate)}</div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <span className="text-slate-500 text-xs line-clamp-2">{leave.reason || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config?.cls}`}>
                          {Icon && <Icon className="w-3 h-3" />}
                          {leave.status}
                        </span>
                      </td>
                      {isHR && (
                        <td className="px-5 py-4">
                          {leave.status === 'PENDING' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleAction(leave.id, 'APPROVED')}
                                disabled={actionLoading === leave.id}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                                <Check className="w-3 h-3" />Approve
                              </button>
                              <button onClick={() => handleAction(leave.id, 'REJECTED')}
                                disabled={actionLoading === leave.id}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                                <X className="w-3 h-3" />Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <LeaveFormModal
          employees={employees}
          session={session}
          isHR={isHR}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success('Leave request submitted!') }}
        />
      )}
    </div>
  )
}

function LeaveFormModal({ employees, session, isHR, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employeeId: isHR ? '' : ((session?.user as any)?.employeeId || ''),
    leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Request Leave</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}

          {isHR && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Employee *</label>
              <select required value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select employee...</option>
                {employees.filter((e: any) => e.employmentStatus === 'ACTIVE').map((e: any) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.jobTitle}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Leave Type *</label>
            <select required value={form.leaveType} onChange={e => setForm(p => ({ ...p, leaveType: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['ANNUAL','SICK','MATERNITY','PATERNITY','COMPASSIONATE','UNPAID','STUDY'].map(lt => (
                <option key={lt} value={lt}>{lt}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date *</label>
              <input type="date" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">End Date *</label>
              <input type="date" required value={form.endDate} min={form.startDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason (optional)</label>
            <textarea rows={3} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief reason for this leave..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : '📋 Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
