'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { BookOpen, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-700',
  LIABILITY: 'bg-red-100 text-red-700',
  EQUITY: 'bg-purple-100 text-purple-700',
  REVENUE: 'bg-green-100 text-green-700',
  EXPENSE: 'bg-orange-100 text-orange-700',
}

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']

export default function ChartOfAccountsPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', parentId: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function loadAccounts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/accounting/accounts?${params}`)
      const d = await res.json()
      setAccounts(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load accounts')
    }
    setLoading(false)
  }

  useEffect(() => { loadAccounts() }, [typeFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Account created')
      setShowModal(false)
      setForm({ code: '', name: '', type: 'ASSET', parentId: '', description: '' })
      loadAccounts()
    } catch {
      toast.error('Failed to create account')
    }
    setSaving(false)
  }

  // Group accounts by type
  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = accounts.filter(a => a.type === type && !a.parentId)
    return acc
  }, {} as Record<string, any[]>)

  const totalsByType = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = accounts.filter(a => a.type === type).reduce((sum, a) => sum + a.balance, 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Chart of Accounts</h1>
          <p className="text-slate-500 text-sm">Manage your general ledger accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${!typeFilter ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          All
        </button>
        {ACCOUNT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type === typeFilter ? '' : type)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${typeFilter === type ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {type}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ACCOUNT_TYPES.map(type => (
          <div key={type} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[type]}`}>{type}</span>
            <div className="text-xl font-black text-slate-900 mt-2">{formatCurrency(totalsByType[type] ?? 0)}</div>
            <div className="text-slate-400 text-xs mt-0.5">{accounts.filter(a => a.type === type).length} accounts</div>
          </div>
        ))}
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Code', 'Account Name', 'Type', 'Description', 'Balance', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      <p>No accounts found. Add your first account.</p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((account: any) => (
                    <tr key={account.id} className={`hover:bg-slate-50 transition-colors ${account.parentId ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-600">{account.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-semibold text-slate-900 text-sm ${account.parentId ? 'pl-4' : ''}`}>
                          {account.parentId && <span className="text-slate-300 mr-1">└</span>}
                          {account.name}
                        </div>
                        {account.parent && (
                          <div className="text-slate-400 text-xs">Parent: {account.parent.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[account.type]}`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{account.description || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold text-sm ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {account.isActive ? 'Active' : 'Inactive'}
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

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. 1001"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    required
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cash in Hand"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Parent Account</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None (Top-level)</option>
                  {accounts.filter(a => !a.parentId && a.type === form.type).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
