'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Receipt, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  REIMBURSED: 'bg-blue-100 text-blue-700',
}

const EXPENSE_CATEGORIES = [
  'Travel', 'Accommodation', 'Meals', 'Office Supplies', 'Software',
  'Equipment', 'Marketing', 'Training', 'Utilities', 'Rent', 'Salaries',
  'Insurance', 'Maintenance', 'Communication', 'Other'
]

const EXPENSE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED']

export default function ExpensesPage() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState({
    title: '', category: 'Office Supplies', amount: 0,
    date: new Date().toISOString().split('T')[0], description: '',
    status: 'PENDING', employeeId: '',
  })
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const [eRes, empRes] = await Promise.all([
        fetch(`/api/accounting/expenses?${params}`),
        fetch('/api/employees'),
      ])
      const [e, emp] = await Promise.all([eRes.json(), empRes.json()])
      setExpenses(Array.isArray(e) ? e : [])
      setEmployees(Array.isArray(emp) ? emp : [])
    } catch {
      toast.error('Failed to load expenses')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [statusFilter, categoryFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employeeId: form.employeeId || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Expense added')
      setShowModal(false)
      setForm({ title: '', category: 'Office Supplies', amount: 0, date: new Date().toISOString().split('T')[0], description: '', status: 'PENDING', employeeId: '' })
      loadData()
    } catch {
      toast.error('Failed to add expense')
    }
    setSaving(false)
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const approvedAmount = expenses.filter(e => ['APPROVED', 'REIMBURSED'].includes(e.status)).reduce((sum, e) => sum + e.amount, 0)
  const pendingAmount = expenses.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm">Track and manage company expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Expenses</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Approved</div>
          <div className="text-2xl font-black text-green-700">{formatCurrency(approvedAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Pending</div>
          <div className="text-2xl font-black text-yellow-600">{formatCurrency(pendingAmount)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 self-center">Status:</span>
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {EXPENSE_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl mb-2" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Title', 'Category', 'Employee', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p>No expenses found</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 text-xs">{exp.title}</div>
                        {exp.description && <div className="text-slate-400 text-xs truncate max-w-xs">{exp.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{exp.category}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 text-xs">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[exp.status] || 'bg-slate-100 text-slate-600'}`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Expense title"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">General / No employee</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
