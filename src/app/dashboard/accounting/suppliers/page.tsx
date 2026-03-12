'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Truck, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const BILL_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-orange-100 text-orange-700',
}

export default function SuppliersPage() {
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'suppliers' | 'bills'>('suppliers')

  const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', email: '', phone: '', address: '', category: '', notes: '' })
  const [billForm, setBillForm] = useState({
    supplierId: '', description: '', amount: 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [sRes, bRes] = await Promise.all([
        fetch('/api/accounting/suppliers'),
        fetch('/api/accounting/bills'),
      ])
      const [s, b] = await Promise.all([sRes.json(), bRes.json()])
      setSuppliers(Array.isArray(s) ? s : [])
      setBills(Array.isArray(b) ? b : [])
    } catch {
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Supplier added')
      setShowSupplierModal(false)
      setSupplierForm({ name: '', contactName: '', email: '', phone: '', address: '', category: '', notes: '' })
      loadData()
    } catch {
      toast.error('Failed to add supplier')
    }
    setSaving(false)
  }

  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/accounting/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billForm),
      })
      if (!res.ok) throw new Error()
      toast.success('Bill recorded')
      setShowBillModal(false)
      setBillForm({ supplierId: '', description: '', amount: 0, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: '' })
      loadData()
    } catch {
      toast.error('Failed to record bill')
    }
    setSaving(false)
  }

  const totalOwed = bills.filter(b => ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status))
    .reduce((sum, b) => sum + (b.amount - b.amountPaid), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Suppliers & Bills</h1>
          <p className="text-slate-500 text-sm">Manage vendors and outstanding bills</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBillModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> Record Bill
          </button>
          <button onClick={() => setShowSupplierModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Suppliers</div>
          <div className="text-3xl font-black text-slate-900">{suppliers.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Bills</div>
          <div className="text-3xl font-black text-slate-900">{bills.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Owed</div>
          <div className="text-2xl font-black text-red-600">{formatCurrency(totalOwed)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['suppliers', 'bills'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl mb-2" />)}
        </div>
      ) : activeTab === 'suppliers' ? (
        <div className="space-y-3">
          {suppliers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-2 text-slate-200" />
              <p>No suppliers yet. Add your first supplier.</p>
            </div>
          ) : (
            suppliers.map((sup: any) => (
              <div key={sup.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSupplier(expandedSupplier === sup.id ? null : sup.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      <div className="text-slate-400 text-xs">{sup.contactName || sup.email || sup.phone || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{sup._count?.bills || 0} bills</span>
                    {expandedSupplier === sup.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {expandedSupplier === sup.id && sup.bills?.length > 0 && (
                  <div className="border-t border-slate-100 px-5 pb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase mt-3 mb-2">Recent Bills</div>
                    <div className="space-y-2">
                      {sup.bills.map((bill: any) => (
                        <div key={bill.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{bill.billNumber}</div>
                            <div className="text-xs text-slate-500">{bill.description} · Due {formatDate(bill.dueDate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(bill.amount)}</div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BILL_STATUS_COLORS[bill.status] || 'bg-slate-100 text-slate-600'}`}>
                              {bill.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Bills Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Bill #', 'Supplier', 'Description', 'Amount', 'Paid', 'Due Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">No bills recorded</td>
                  </tr>
                ) : (
                  bills.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-600">{bill.billNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{bill.supplier?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{bill.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 text-xs">{formatCurrency(bill.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-green-700 font-semibold">{formatCurrency(bill.amountPaid)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(bill.dueDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BILL_STATUS_COLORS[bill.status] || 'bg-slate-100 text-slate-600'}`}>
                          {bill.status}
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

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Supplier</h2>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name *</label>
                <input required value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Supplier name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input value={supplierForm.contactName} onChange={e => setSupplierForm(f => ({ ...f, contactName: e.target.value }))}
                    placeholder="Contact name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input value={supplierForm.phone} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+254..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="supplier@company.com" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <input value={supplierForm.category} onChange={e => setSupplierForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Technology, Printing" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Bill</h2>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddBill} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier *</label>
                <select required value={billForm.supplierId} onChange={e => setBillForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select supplier</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                <input required value={billForm.description} onChange={e => setBillForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Bill description" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount *</label>
                  <input required type="number" min="0" step="0.01" value={billForm.amount}
                    onChange={e => setBillForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input required type="date" value={billForm.dueDate} onChange={e => setBillForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBillModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
