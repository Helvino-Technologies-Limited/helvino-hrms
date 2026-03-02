'use client'
import { useEffect, useState } from 'react'
import { Plus, Building2, Users, Edit, Trash2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)

  async function loadData() {
    const [dr, er] = await Promise.all([fetch('/api/departments'), fetch('/api/employees')])
    const [d, e] = await Promise.all([dr.json(), er.json()])
    setDepartments(Array.isArray(d) ? d : [])
    setEmployees(Array.isArray(e) ? e : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Department deleted')
    loadData()
  }

  const DEPT_COLORS = ['bg-blue-500','bg-emerald-500','bg-purple-500','bg-orange-500','bg-rose-500','bg-cyan-500','bg-indigo-500','bg-teal-500']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm">{departments.length} departments · {employees.length} total employees</p>
        </div>
        <button onClick={() => { setEditingDept(null); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md">
          <Plus className="w-4 h-4" />Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept: any, i: number) => (
            <div key={dept.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`${DEPT_COLORS[i % DEPT_COLORS.length]} w-12 h-12 rounded-xl flex items-center justify-center shadow-md`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => { setEditingDept(dept); setShowForm(true) }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dept.id, dept.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{dept.name}</h3>
              {dept.description && <p className="text-slate-500 text-xs mb-3 line-clamp-2">{dept.description}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold">{dept._count?.employees || 0}</span>
                  <span className="text-xs text-slate-400">employees</span>
                </div>
                {dept.head && (
                  <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                    Head: <span className="font-semibold text-slate-700">{dept.head.firstName} {dept.head.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DeptFormModal
          dept={editingDept}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success(editingDept ? 'Department updated!' : 'Department created!') }}
        />
      )}
    </div>
  )
}

function DeptFormModal({ dept, employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: dept?.name || '', description: dept?.description || '', headId: dept?.headId || '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const url = dept ? `/api/departments/${dept.id}` : '/api/departments'
    const res = await fetch(url, { method: dept ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{dept ? 'Edit' : 'New'} Department</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Software Development" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of this department..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department Head</label>
            <select value={form.headId} onChange={e => setForm(p => ({ ...p, headId: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No head assigned</option>
              {employees.filter((e: any) => e.employmentStatus === 'ACTIVE').map((e: any) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.jobTitle}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm">
              {loading ? 'Saving...' : (dept ? 'Update' : 'Create Department')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
