'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, X, Edit2, Trash2, CheckCircle, Clock, AlertCircle, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-500',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
  URGENT: 'bg-rose-100 text-rose-700',
}
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']

const emptyForm = {
  assignedToId: '', title: '', description: '', deadline: '',
  priority: 'MEDIUM', notes: '',
}

export default function SalesTeamTasksPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isManager = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(role)

  const [tasks, setTasks] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function loadData() {
    setLoading(true)
    try {
      const [taskRes, agentRes] = await Promise.all([
        fetch('/api/sales/team-tasks'),
        isManager ? fetch('/api/employees?userRole=SALES_AGENT') : Promise.resolve(null),
      ])
      const taskData = await taskRes.json()
      setTasks(Array.isArray(taskData) ? taskData : [])
      if (agentRes) {
        const agentData = await agentRes.json()
        setAgents(Array.isArray(agentData) ? agentData : [])
      }
    } catch {
      toast.error('Failed to load tasks')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  function openEdit(task: any) {
    setEditTarget(task)
    setForm({
      assignedToId: task.assignedToId,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      priority: task.priority,
      notes: task.notes || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editTarget ? `/api/sales/team-tasks/${editTarget.id}` : '/api/sales/team-tasks'
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (editTarget) {
        setTasks(prev => prev.map(t => t.id === editTarget.id ? data : t))
        toast.success('Task updated')
      } else {
        setTasks(prev => [data, ...prev])
        toast.success('Task created')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/sales/team-tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`/api/sales/team-tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const filtered = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks
  const grouped = STATUS_ORDER.reduce((acc: Record<string, any[]>, s) => {
    acc[s] = filtered.filter(t => t.status === s)
    return acc
  }, {})

  const isOverdue = (t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE' && t.status !== 'CANCELLED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Team Tasks</h1>
          <p className="text-slate-500 text-sm">
            {isManager ? 'Assign and track tasks for your team' : 'Tasks assigned to you by your manager'}
          </p>
        </div>
        {isManager && (
          <button onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUS_ORDER].map(s => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}>
            {s || 'All'} {s && `(${tasks.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-100 text-center text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold">No tasks found</p>
          {isManager && <p className="text-sm mt-1">Create a task to assign to your team</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map(status => {
            const group = grouped[status]
            if (group.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {status.replace('_', ' ')} ({group.length})
                </h2>
                <div className="space-y-3">
                  {group.map(task => (
                    <div key={task.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-colors ${
                      isOverdue(task) ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
                    }`}>
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900">{task.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                              {task.status.replace('_',' ')}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                            {isOverdue(task) && (
                              <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                          </div>
                          {task.description && <p className="text-slate-500 text-sm mt-1">{task.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-slate-500">
                              Assigned to: <span className="font-semibold text-slate-700">
                                {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                              </span>
                            </span>
                            {isManager && (
                              <span className="text-xs text-slate-400">
                                By: {task.manager?.firstName} {task.manager?.lastName}
                              </span>
                            )}
                            {task.deadline && (
                              <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" /> Due {formatDate(task.deadline)}
                              </span>
                            )}
                          </div>
                          {task.notes && <p className="text-slate-400 text-xs mt-1 italic">{task.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Quick status update */}
                          {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                            <button onClick={() => updateStatus(task.id, 'DONE')}
                              title="Mark done" className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isManager && (
                            <>
                              <button onClick={() => openEdit(task)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Agent status dropdown */}
                      {!isManager && task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <select
                            value={task.status}
                            onChange={e => updateStatus(task.id, e.target.value)}
                            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editTarget ? 'Edit Task' : 'New Team Task'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign To *</label>
                <select required value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select team member...</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName} — {a.jobTitle || 'Sales Agent'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Task Title *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Follow up with 5 new leads this week" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Additional context..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => set('priority', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <input value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
