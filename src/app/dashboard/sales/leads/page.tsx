'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Plus, Search, Eye, Edit, Trash2, X,
  ChevronDown, UserPlus, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

const ALL_STATUSES = [
  'NEW', 'CONTACTED', 'NEEDS_QUOTATION', 'QUOTATION_SENT',
  'NEGOTIATION', 'WON', 'LOST', 'FUTURE_PROSPECT',
]

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  NEEDS_QUOTATION: 'bg-amber-100 text-amber-700 border-amber-200',
  QUOTATION_SENT: 'bg-orange-100 text-orange-700 border-orange-200',
  NEGOTIATION: 'bg-purple-100 text-purple-700 border-purple-200',
  WON: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-red-100 text-red-700 border-red-200',
  FUTURE_PROSPECT: 'bg-slate-100 text-slate-600 border-slate-200',
}

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-red-500',
}

const PRIORITY_TEXT: Record<string, string> = {
  LOW: 'text-slate-600',
  MEDIUM: 'text-amber-700',
  HIGH: 'text-red-700',
}

const SOURCES = ['WEBSITE', 'REFERRAL', 'EMPLOYEE', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL', 'WALK_IN', 'OTHER']

const SERVICES_LIST = [
  'Web Design',
  'Software Development',
  'CCTV Installation',
  'WiFi/Network Installation',
  'Cybersecurity',
  'IT Consultancy',
]

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'FINANCE_OFFICER', 'HEAD_OF_SALES']

export default function LeadsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const canSeeOwner = role ? ADMIN_ROLES.includes(role) : false

  const [leads, setLeads] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')

  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [lr, er] = await Promise.all([
        fetch('/api/sales/leads'),
        fetch('/api/employees'),
      ])
      const [l, e] = await Promise.all([lr.json(), er.json()])
      setLeads(Array.isArray(l) ? l : [])
      setEmployees(Array.isArray(e) ? e : [])
    } catch {
      toast.error('Failed to load leads')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function deleteLead(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    const res = await fetch(`/api/sales/leads/${deletingId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete lead'); setDeletingId(null); return }
    toast.success('Lead deleted')
    setDeletingId(null)
    loadData()
  }

  const allSources = Array.from(new Set(leads.map(l => l.source).filter(Boolean)))

  const filtered = leads.filter(lead => {
    const q = search.toLowerCase()
    if (q && ![lead.contactPerson, lead.companyName, lead.email].some(f => f?.toLowerCase().includes(q))) return false
    if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false
    if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false
    if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) return false
    return true
  })

  const newCount = leads.filter(l => l.status === 'NEW').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm">
            {leads.length} total · <span className="text-blue-600 font-semibold">{newCount} new</span>
          </p>
        </div>
        <button
          onClick={() => { setEditingLead(null); setShowModal(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', ...ALL_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-500">{leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}</p>
            {leads.length === 0 && (
              <button
                onClick={() => { setEditingLead(null); setShowModal(true) }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors">
                Add Your First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Lead #', 'Contact / Company', 'Phone', 'Services', 'Source', 'Priority', 'Status', 'Assigned To', ...(canSeeOwner ? ['Owner'] : []), 'Exp. Value', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead: any) => {
                  const services: string[] = Array.isArray(lead.services) ? lead.services : []
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link href={`/dashboard/sales/leads/${lead.id}`}
                          className="font-mono text-xs text-blue-600 hover:text-blue-700 font-bold">
                          #{lead.leadNumber || lead.id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {lead.contactPerson?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{lead.contactPerson}</div>
                            <div className="text-slate-400 text-xs">{lead.companyName || lead.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">{lead.phone || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {services.slice(0, 2).map((s: string) => (
                            <span key={s} className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">{s}</span>
                          ))}
                          {services.length > 2 && (
                            <span className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded-md font-semibold">+{services.length - 2}</span>
                          )}
                          {services.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        {lead.source?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[lead.priority] || 'bg-slate-300'}`} />
                          <span className={`text-xs font-semibold ${PRIORITY_TEXT[lead.priority] || 'text-slate-600'}`}>{lead.priority || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {lead.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                      </td>
                      {canSeeOwner && (
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          {lead.createdBy ? `${lead.createdBy.firstName} ${lead.createdBy.lastName}` : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-green-700">
                        {lead.expectedValue ? formatCurrency(lead.expectedValue) : '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/sales/leads/${lead.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => { setEditingLead(lead); setShowModal(true) }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Lead Modal */}
      {showModal && (
        <LeadFormModal
          lead={editingLead}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            loadData()
            toast.success(editingLead ? 'Lead updated!' : 'Lead added!')
          }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Lead?</h3>
            <p className="text-slate-500 text-sm mb-5">This action cannot be undone. The lead and all associated data will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadFormModal({ lead, employees, onClose, onSave }: {
  lead: any
  employees: any[]
  onClose: () => void
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    contactPerson: lead?.contactPerson || '',
    companyName: lead?.companyName || '',
    phone: lead?.phone || '',
    whatsapp: lead?.whatsapp || '',
    email: lead?.email || '',
    location: lead?.location || '',
    industry: lead?.industry || '',
    source: lead?.source || 'WEBSITE',
    services: Array.isArray(lead?.services) ? lead.services : [],
    priority: lead?.priority || 'MEDIUM',
    status: lead?.status || 'NEW',
    assignedToId: lead?.assignedToId || '',
    expectedValue: lead?.expectedValue || '',
    expectedCloseDate: lead?.expectedCloseDate
      ? new Date(lead.expectedCloseDate).toISOString().split('T')[0]
      : '',
    notes: lead?.notes || '',
  })

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleService(service: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s: string) => s !== service)
        : [...prev.services, service],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contactPerson.trim()) { setError('Contact Person is required'); return }
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      expectedValue: form.expectedValue ? Number(form.expectedValue) : null,
      expectedCloseDate: form.expectedCloseDate || null,
      assignedToId: form.assignedToId || null,
    }
    const url = lead ? `/api/sales/leads/${lead.id}` : '/api/sales/leads'
    const res = await fetch(url, {
      method: lead ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[90vh] p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Person <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.contactPerson}
                  onChange={e => set('contactPerson', e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Name</label>
                <input
                  value={form.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  placeholder="Company or organisation"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Contact Channels */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Channels</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">WhatsApp</label>
                <input
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@company.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Location & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="City / Town"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Industry</label>
              <input
                value={form.industry}
                onChange={e => set('industry', e.target.value)}
                placeholder="e.g. Healthcare, Retail"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lead Source</label>
            <select
              value={form.source}
              onChange={e => set('source', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Services Interested In</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICES_LIST.map(service => (
                <label key={service} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  form.services.includes(service)
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={form.services.includes(service)}
                    onChange={() => toggleService(service)}
                    className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-700">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pipeline Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pipeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned To</label>
                <select
                  value={form.assignedToId}
                  onChange={e => set('assignedToId', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Value (KES)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.expectedValue}
                onChange={e => set('expectedValue', e.target.value)}
                placeholder="e.g. 150000"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Close Date</label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={e => set('expectedCloseDate', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional context or remarks..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              lead ? 'Update Lead' : 'Add Lead'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
