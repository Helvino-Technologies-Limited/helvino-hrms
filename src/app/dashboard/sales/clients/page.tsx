'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Eye, Edit, Trash2, Users, Phone, Mail,
  Globe, MapPin, Briefcase, X, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_COLORS: Record<string, string> = {
  CORPORATE: 'bg-blue-100 text-blue-700 border-blue-200',
  SME: 'bg-green-100 text-green-700 border-green-200',
  INDIVIDUAL: 'bg-purple-100 text-purple-700 border-purple-200',
}

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Recurring: 'bg-blue-100 text-blue-700 border-blue-200',
  'High Value': 'bg-green-100 text-green-700 border-green-200',
  Prospect: 'bg-slate-100 text-slate-600 border-slate-200',
}

const ALL_TAGS = ['VIP', 'Recurring', 'High Value', 'Prospect']
const CATEGORIES = ['CORPORATE', 'SME', 'INDIVIDUAL']

export default function ClientsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || ''

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter !== '') params.set('isActive', statusFilter === 'Active' ? 'true' : 'false')
      const res = await fetch(`/api/sales/clients?${params}`)
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load clients') }
    setLoading(false)
  }, [search, categoryFilter, statusFilter])

  useEffect(() => {
    const t = setTimeout(loadClients, 300)
    return () => clearTimeout(t)
  }, [loadClients])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/sales/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Client deleted')
      loadClients()
    } catch { toast.error('Failed to delete client') }
  }

  const activeCount = clients.filter(c => c.isActive).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{activeCount} active client{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowModal(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, contact, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 bg-white rounded-2xl border border-slate-100">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading clients...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold">No clients found</p>
          <p className="text-sm mt-1">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any) => (
            <ClientCard
              key={client.id}
              client={client}
              role={role}
              onEdit={() => { setEditingClient(client); setShowModal(true) }}
              onDelete={() => handleDelete(client.id, client.companyName)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editingClient}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            loadClients()
            toast.success(editingClient ? 'Client updated!' : 'Client added!')
          }}
        />
      )}
    </div>
  )
}

function ClientCard({ client, role, onEdit, onDelete }: { client: any; role: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 truncate">{client.companyName}</h3>
            {!client.isActive && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-medium">Inactive</span>
            )}
          </div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[client.category] || CATEGORY_COLORS.CORPORATE}`}>
            {client.category}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
            <Edit className="w-3.5 h-3.5" />
          </button>
          {role === 'SUPER_ADMIN' && (
            <button onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {client.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {client.tags.map((tag: string) => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${TAG_COLORS[tag] || TAG_COLORS.Prospect}`}>
              {tag === 'VIP' && <Star className="w-3 h-3 inline mr-0.5" />}
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{client.contactPerson}</span>
          {client.phone && <span className="text-slate-400 truncate">· {client.phone}</span>}
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {(client.city || client.country) && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{[client.city, client.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Briefcase className="w-3.5 h-3.5 text-slate-300" />
          <span>{client._count?.services ?? 0} service{client._count?.services !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="w-3.5 h-3.5 text-slate-300" />
          <span>{client._count?.subscriptions ?? 0} subscription{client._count?.subscriptions !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* View Profile */}
      <Link
        href={`/dashboard/sales/clients/${client.id}`}
        className="w-full text-center py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Eye className="w-3.5 h-3.5" />
        View Profile
      </Link>
    </div>
  )
}

function ClientModal({ client, onClose, onSave }: { client: any; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(client?.tags || [])

  const [form, setForm] = useState({
    companyName: client?.companyName || '',
    contactPerson: client?.contactPerson || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || '',
    email: client?.email || '',
    address: client?.address || '',
    city: client?.city || '',
    country: client?.country || 'Kenya',
    industry: client?.industry || '',
    website: client?.website || '',
    category: client?.category || 'CORPORATE',
    assignedToId: client?.assignedToId || '',
    notes: client?.notes || '',
  })

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, tags: selectedTags }
      const url = client ? `/api/sales/clients/${client.id}` : '/api/sales/clients'
      const method = client ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900'
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{client ? 'Edit Client' : 'Add New Client'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{client ? `Editing ${client.companyName}` : 'Fill in the client details below'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Company Name <span className="text-red-500">*</span></label>
                <input type="text" required value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  className={inputCls} placeholder="e.g. Acme Corporation" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Contact Person <span className="text-red-500">*</span></label>
                <input type="text" required value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
                  className={inputCls} placeholder="Primary contact name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className={inputCls} placeholder="+254 7XX XXX XXX" />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  className={inputCls} placeholder="+254 7XX XXX XXX" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={inputCls} placeholder="contact@company.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                  className={inputCls} placeholder="Street / Building" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                  className={inputCls} placeholder="Nairobi" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input type="text" value={form.country} onChange={e => set('country', e.target.value)}
                  className={inputCls} placeholder="Kenya" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Industry</label>
                <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)}
                  className={inputCls} placeholder="e.g. Technology, Finance" />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)}
                  className={inputCls} placeholder="https://example.com" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedTags.includes(tag) ? TAG_COLORS[tag] || 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 border-slate-200 group-hover:border-slate-300'}`}>
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Assigned To</label>
              <select value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.jobTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} className={inputCls} placeholder="Any additional notes..." />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
