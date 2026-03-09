'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Edit, Trash2, Building2, LayoutGrid, List,
  RefreshCw, ClipboardList, Calendar, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

type ViewMode = 'kanban' | 'list'

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  DONE: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
}

const STATUS_COLUMN_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 border-blue-200',
  DONE: 'bg-green-50 border-green-200',
  CANCELLED: 'bg-red-50 border-red-200',
}

const STATUS_HEADER_COLORS: Record<string, string> = {
  TODO: 'bg-slate-200 text-slate-700',
  IN_PROGRESS: 'bg-blue-200 text-blue-800',
  DONE: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-200 text-red-800',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border-red-200',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function DeadlineDisplay({ deadline }: { deadline?: string }) {
  if (!deadline) return <span className="text-slate-400 text-xs">No deadline</span>
  const d = new Date(deadline)
  const now = new Date()
  const isOverdue = d < now
  const isToday = d.toDateString() === now.toDateString()
  const label = d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  if (isOverdue) return <span className="text-red-600 text-xs font-medium">{label} · Overdue</span>
  if (isToday) return <span className="text-amber-600 text-xs font-medium">{label} · Today</span>
  return <span className="text-slate-500 text-xs">{label}</span>
}

const EMPTY_FORM = {
  title: '',
  description: '',
  clientId: '',
  assignedToId: '',
  priority: 'MEDIUM',
  status: 'TODO',
  deadline: '',
  notes: '',
}

function StatusDropdown({ taskId, currentStatus, onUpdated }: { taskId: string; currentStatus: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function changeStatus(status: string) {
    setOpen(false)
    try {
      const res = await fetch(`/api/sales/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success('Status updated')
      onUpdated()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border cursor-pointer ${STATUS_COLORS[currentStatus]}`}>
        {currentStatus.replace('_', ' ')}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden min-w-36">
          {STATUSES.map(s => (
            <button key={s} onClick={() => changeStatus(s)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${s === currentStatus ? 'opacity-50 cursor-default' : ''}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sales-tasks-view') as ViewMode) ?? 'kanban'
    }
    return 'kanban'
  })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function setViewMode(v: ViewMode) {
    setView(v)
    localStorage.setItem('sales-tasks-view', v)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [taskRes, clientRes, empRes] = await Promise.all([
        fetch('/api/sales/tasks'),
        fetch('/api/sales/clients'),
        fetch('/api/employees'),
      ])
      const [taskData, clientData, empData] = await Promise.all([taskRes.json(), clientRes.json(), empRes.json()])
      setTasks(Array.isArray(taskData) ? taskData : (taskData.tasks ?? []))
      setClients(Array.isArray(clientData) ? clientData : (clientData.clients ?? []))
      setEmployees(Array.isArray(empData) ? empData : (empData.employees ?? []))
    } catch (e) {
      console.error(e)
      toast.error('Failed to load tasks')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const now = new Date()
  const todayCount = tasks.filter(t => t.deadline && new Date(t.deadline).toDateString() === now.toDateString()).length
  const overdueCount = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'DONE' && t.status !== 'CANCELLED').length

  const filtered = tasks.filter(t => {
    const clientName = t.client?.name ?? ''
    return !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase())
  })

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(task: any) {
    setEditing(task)
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      clientId: task.clientId ?? task.client?.id ?? '',
      assignedToId: task.assignedToId ?? task.assignedTo?.id ?? '',
      priority: task.priority ?? 'MEDIUM',
      status: task.status ?? 'TODO',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      notes: task.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      const res = editing
        ? await fetch(`/api/sales/tasks/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/sales/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Task updated' : 'Task created')
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Task deleted')
      loadData()
    } catch {
      toast.error('Failed to delete')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tasks</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-600 font-medium">{todayCount} today</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-red-600 font-medium">{overdueCount} overdue</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <button onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Kanban view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List view">
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search tasks or clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">No tasks found</p>
          <p className="text-slate-400 text-sm mt-1">{search ? 'Try a different search term' : 'Add your first task to get started'}</p>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map(status => {
            const cols = filtered.filter(t => t.status === status)
            return (
              <div key={status} className={`rounded-2xl border p-3 ${STATUS_COLUMN_COLORS[status]}`}>
                <div className={`rounded-xl px-3 py-2 mb-3 flex items-center justify-between ${STATUS_HEADER_COLORS[status]}`}>
                  <span className="font-bold text-sm">{status.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold opacity-70">{cols.length}</span>
                </div>
                <div className="space-y-2">
                  {cols.map(task => (
                    <div key={task.id} className="bg-white rounded-xl p-3 shadow-sm border border-white hover:border-slate-200 transition-all group relative">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm leading-snug flex-1">{task.title}</p>
                        <button onClick={() => openEdit(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 shrink-0">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {task.client?.name && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{task.client.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM}`}>
                          {task.priority}
                        </span>
                        <DeadlineDisplay deadline={task.deadline} />
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {getInitials(task.assignedTo.name ?? (task.assignedTo.firstName + ' ' + task.assignedTo.lastName))}
                          </div>
                          <span className="text-xs text-slate-500">
                            {task.assignedTo.name ?? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                          </span>
                        </div>
                      )}
                      <div className="mt-2">
                        <StatusDropdown taskId={task.id} currentStatus={task.status} onUpdated={loadData} />
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">No tasks here</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Title', 'Client', 'Assigned To', 'Priority', 'Deadline', 'Status', 'Actions'].map(col => (
                    <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">
                      {task.client?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {getInitials(task.assignedTo.name ?? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`)}
                          </div>
                          <span className="text-slate-600 text-xs">{task.assignedTo.name ?? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`}</span>
                        </div>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><DeadlineDisplay deadline={task.deadline} /></td>
                    <td className="px-4 py-3">
                      <StatusDropdown taskId={task.id} currentStatus={task.status} onUpdated={loadData} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(task.id)}
                          disabled={deletingId === task.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Task' : 'Add Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="Task title..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Client</label>
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No client</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned To</label>
                  <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Unassigned</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name ?? `${emp.firstName} ${emp.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Deadline</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
