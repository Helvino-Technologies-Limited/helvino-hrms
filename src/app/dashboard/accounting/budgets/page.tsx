'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PiggyBank, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

const BUDGET_CATEGORIES = [
  'Salaries', 'Marketing', 'Technology', 'Office', 'Travel',
  'Training', 'Operations', 'Infrastructure', 'Legal', 'Other'
]

const PERIODS = ['MONTHLY', 'QUARTERLY', 'YEARLY']

export default function BudgetsPage() {
  const { data: session } = useSession()
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [form, setForm] = useState({
    name: '', department: '', category: 'Salaries',
    amount: 0, period: 'MONTHLY', year: new Date().getFullYear(), month: 1, notes: ''
  })
  const [saving, setSaving] = useState(false)

  async function loadBudgets() {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounting/budgets?year=${yearFilter}`)
      const d = await res.json()
      setBudgets(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load budgets')
    }
    setLoading(false)
  }

  useEffect(() => { loadBudgets() }, [yearFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, month: form.period === 'MONTHLY' ? form.month : null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Budget created')
      setShowModal(false)
      setForm({ name: '', department: '', category: 'Salaries', amount: 0, period: 'MONTHLY', year: new Date().getFullYear(), month: 1, notes: '' })
      loadBudgets()
    } catch {
      toast.error('Failed to create budget')
    }
    setSaving(false)
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallUtilization = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Budgets</h1>
          <p className="text-slate-500 text-sm">Track budget allocations and spending</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={yearFilter}
            onChange={e => setYearFilter(parseInt(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Budgeted</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalBudgeted)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Spent</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Remaining</div>
          <div className={`text-2xl font-black ${totalRemaining >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(totalRemaining)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Utilization</div>
          <div className={`text-2xl font-black ${overallUtilization > 90 ? 'text-red-600' : overallUtilization > 75 ? 'text-yellow-600' : 'text-green-700'}`}>
            {overallUtilization}%
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-32 animate-pulse" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
          <PiggyBank className="w-12 h-12 mx-auto mb-2 text-slate-200" />
          <p>No budgets for {yearFilter}. Create your first budget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget: any) => {
            const utilization = budget.amount > 0 ? Math.min(100, Math.round((budget.spent / budget.amount) * 100)) : 0
            const isOverBudget = budget.spent > budget.amount
            return (
              <div key={budget.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{budget.name}</div>
                    <div className="text-xs text-slate-400">{budget.category} · {budget.period}{budget.month ? ` · ${months[budget.month - 1]}` : ''}{budget.department ? ` · ${budget.department}` : ''}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverBudget ? 'bg-red-100 text-red-700' : utilization > 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {utilization}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">Spent: <span className="font-bold text-slate-900">{formatCurrency(budget.spent)}</span></span>
                  <span className="text-slate-500">Budget: <span className="font-bold text-slate-900">{formatCurrency(budget.amount)}</span></span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${utilization}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-400">
                    {isOverBudget ? <span className="text-red-600 font-semibold">Over by {formatCurrency(budget.spent - budget.amount)}</span> : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Budget</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Q1 Marketing Budget" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                  <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="Optional" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (KES) *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Period</label>
                  <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {form.period === 'MONTHLY' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Month</label>
                    <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
