'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Landmark, Plus, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  CURRENT: 'bg-blue-100 text-blue-700',
  SAVINGS: 'bg-green-100 text-green-700',
  MPESA: 'bg-emerald-100 text-emerald-700',
}

export default function BankAccountsPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [accountForm, setAccountForm] = useState({
    accountName: '', bankName: '', accountNumber: '',
    accountType: 'CURRENT', currency: 'KES', balance: 0,
  })
  const [txForm, setTxForm] = useState({
    bankAccountId: '', type: 'CREDIT', amount: 0,
    description: '', reference: '', date: new Date().toISOString().split('T')[0],
  })

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/accounting/bank-accounts')
      const d = await res.json()
      setAccounts(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load bank accounts')
    }
    setLoading(false)
  }

  async function loadTransactions(accountId: string) {
    try {
      const res = await fetch(`/api/accounting/bank-transactions?bankAccountId=${accountId}`)
      const d = await res.json()
      setTransactions(Array.isArray(d) ? d : [])
    } catch {
      toast.error('Failed to load transactions')
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (selectedAccount) loadTransactions(selectedAccount)
  }, [selectedAccount])

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Bank account added')
      setShowAccountModal(false)
      setAccountForm({ accountName: '', bankName: '', accountNumber: '', accountType: 'CURRENT', currency: 'KES', balance: 0 })
      loadData()
    } catch {
      toast.error('Failed to add bank account')
    }
    setSaving(false)
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/bank-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txForm, bankAccountId: txForm.bankAccountId || selectedAccount }),
      })
      if (!res.ok) throw new Error()
      toast.success('Transaction recorded')
      setShowTransactionModal(false)
      setTxForm({ bankAccountId: '', type: 'CREDIT', amount: 0, description: '', reference: '', date: new Date().toISOString().split('T')[0] })
      loadData()
      if (selectedAccount) loadTransactions(selectedAccount)
    } catch {
      toast.error('Failed to record transaction')
    }
    setSaving(false)
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  const selectedAccountData = accounts.find(a => a.id === selectedAccount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bank Accounts</h1>
          <p className="text-slate-500 text-sm">Manage bank accounts and transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransactionModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Record Transaction
          </button>
          <button onClick={() => setShowAccountModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="text-blue-200 text-sm font-semibold uppercase mb-1">Total Bank Balance</div>
        <div className="text-4xl font-black">{formatCurrency(totalBalance)}</div>
        <div className="text-blue-200 text-sm mt-1">Across {accounts.length} accounts</div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
              <Landmark className="w-12 h-12 mx-auto mb-2 text-slate-200" />
              <p>No bank accounts yet. Add your first account.</p>
            </div>
          ) : (
            accounts.map((account: any) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id === selectedAccount ? null : account.id)}
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left w-full transition-all hover:shadow-md ${selectedAccount === account.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[account.accountType] || 'bg-slate-100 text-slate-600'}`}>
                    {account.accountType}
                  </span>
                  <span className="text-xs text-slate-400">{account.currency}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{account.accountName}</div>
                <div className="text-slate-400 text-xs">{account.bankName}</div>
                <div className="text-slate-400 text-xs">{account.accountNumber}</div>
                <div className="text-2xl font-black mt-3 text-slate-900">{formatCurrency(account.balance)}</div>
                <div className="text-xs text-slate-400 mt-0.5">{account._count?.transactions || 0} transactions</div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Transactions for selected account */}
      {selectedAccount && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Transactions - {selectedAccountData?.accountName}</h3>
            <button onClick={() => setSelectedAccount(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Date', 'Description', 'Type', 'Amount', 'Balance', 'Reference'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No transactions yet</td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1 text-xs font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold text-xs ${tx.type === 'CREDIT' ? 'text-green-700' : 'text-red-600'}`}>
                          {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-xs text-slate-700">
                        {tx.balance ? formatCurrency(tx.balance) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{tx.reference || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Bank Account</h2>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Account Name *</label>
                <input required value={accountForm.accountName} onChange={e => setAccountForm(f => ({ ...f, accountName: e.target.value }))}
                  placeholder="e.g. Main Business Account" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input required value={accountForm.bankName} onChange={e => setAccountForm(f => ({ ...f, bankName: e.target.value }))}
                    placeholder="KCB, Equity, etc." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Type</label>
                  <select value={accountForm.accountType} onChange={e => setAccountForm(f => ({ ...f, accountType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="CURRENT">Current</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="MPESA">M-Pesa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number *</label>
                  <input required value={accountForm.accountNumber} onChange={e => setAccountForm(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="Account number" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Opening Balance</label>
                  <input type="number" min="0" step="0.01" value={accountForm.balance}
                    onChange={e => setAccountForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Transaction</h2>
              <button onClick={() => setShowTransactionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Account *</label>
                <select required value={txForm.bankAccountId || selectedAccount || ''} onChange={e => setTxForm(f => ({ ...f, bankAccountId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select account</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.accountName} - {a.bankName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="CREDIT">Credit (In)</option>
                    <option value="DEBIT">Debit (Out)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                  <input required type="number" min="0.01" step="0.01" value={txForm.amount}
                    onChange={e => setTxForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                <input required value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Transaction description" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reference</label>
                  <input value={txForm.reference} onChange={e => setTxForm(f => ({ ...f, reference: e.target.value }))}
                    placeholder="Transaction ref." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTransactionModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
