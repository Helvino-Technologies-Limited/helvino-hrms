'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Edit, Phone, Mail, Globe, MapPin, Building2,
  Briefcase, Users, RotateCcw, FileText, Tag, Calendar,
  CheckCircle, Clock, XCircle, AlertCircle, X, Star
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

const SERVICE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const SERVICE_STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  IN_PROGRESS: RotateCcw,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
}

const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  SUSPENDED: 'bg-slate-100 text-slate-600 border-slate-200',
}

const QUOTATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  VIEWED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-200',
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || ''

  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])

  async function loadClient() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/clients/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setClient(data)
    } catch { toast.error('Failed to load client') }
    setLoading(false)
  }

  useEffect(() => {
    loadClient()
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : [])).catch(() => {})
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500">Loading client...</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <AlertCircle className="w-12 h-12 text-slate-200" />
        <p className="text-lg font-semibold">Client not found</p>
        <Link href="/dashboard/sales/clients" className="text-blue-600 hover:underline text-sm font-medium">
          Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sales/clients"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{client.companyName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[client.category] || CATEGORY_COLORS.CORPORATE}`}>
                {client.category}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
              {client.clientNumber && (
                <span className="text-slate-400 text-xs font-mono">{client.clientNumber}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-blue-300 hover:text-blue-600 font-semibold text-sm transition-all shadow-sm"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Client Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Client Information</h2>

            <div className="space-y-3">
              {client.contactPerson && (
                <InfoRow icon={Users} label="Contact Person" value={client.contactPerson} />
              )}
              {client.phone && (
                <InfoRow icon={Phone} label="Phone" value={client.phone} href={`tel:${client.phone}`} />
              )}
              {client.whatsapp && (
                <InfoRow icon={Phone} label="WhatsApp" value={client.whatsapp} href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`} />
              )}
              {client.email && (
                <InfoRow icon={Mail} label="Email" value={client.email} href={`mailto:${client.email}`} />
              )}
              {client.website && (
                <InfoRow icon={Globe} label="Website" value={client.website} href={client.website} />
              )}
              {(client.city || client.country) && (
                <InfoRow icon={MapPin} label="Location" value={[client.city, client.country].filter(Boolean).join(', ')} />
              )}
              {client.address && (
                <InfoRow icon={Building2} label="Address" value={client.address} />
              )}
              {client.industry && (
                <InfoRow icon={Briefcase} label="Industry" value={client.industry} />
              )}
            </div>

            {client.tags?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag: string) => (
                    <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TAG_COLORS[tag] || TAG_COLORS.Prospect}`}>
                      {tag === 'VIP' && <Star className="w-3 h-3 inline mr-0.5" />}
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {client.notes && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1.5">Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {client.assignedTo && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Account Manager</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {client.assignedTo.firstName?.[0]}{client.assignedTo.lastName?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {client.assignedTo.firstName} {client.assignedTo.lastName}
                  </div>
                  {client.assignedTo.jobTitle && (
                    <div className="text-slate-400 text-xs">{client.assignedTo.jobTitle}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Creation info */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-xs text-slate-400 space-y-1">
            {client.createdBy && (
              <div>Created by <span className="font-medium text-slate-600">{client.createdBy.firstName} {client.createdBy.lastName}</span></div>
            )}
            {client.createdAt && (
              <div>Added on <span className="font-medium text-slate-600">{new Date(client.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
            )}
          </div>
        </div>

        {/* Right: Services, Subscriptions, Quotations */}
        <div className="lg:col-span-3 space-y-4">
          {/* Services */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Services</h2>
              <Link
                href={`/dashboard/sales/services?clientId=${id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Manage →
              </Link>
            </div>

            {!client.services?.length ? (
              <div className="text-center py-8 text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No services yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.services.map((svc: any) => {
                  const StatusIcon = SERVICE_STATUS_ICONS[svc.status] || Clock
                  return (
                    <div key={svc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${SERVICE_STATUS_COLORS[svc.status]?.replace('text-', 'text-').replace('border-', '')}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{svc.serviceName}</div>
                          {svc.assignedTeam && <div className="text-xs text-slate-400 truncate">{svc.assignedTeam}</div>}
                          {svc.startDate && (
                            <div className="text-xs text-slate-400">
                              Started {new Date(svc.startDate).toLocaleDateString('en-KE')}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${SERVICE_STATUS_COLORS[svc.status] || SERVICE_STATUS_COLORS.PENDING}`}>
                        {svc.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Subscriptions</h2>
              <Link
                href={`/dashboard/sales/subscriptions?clientId=${id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Manage →
              </Link>
            </div>

            {!client.subscriptions?.length ? (
              <div className="text-center py-8 text-slate-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No subscriptions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.subscriptions.map((sub: any) => {
                  const isExpiringSoon = sub.expiryDate && new Date(sub.expiryDate) < new Date(Date.now() + 30 * 86400000)
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-800 truncate">{sub.serviceName}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500">{sub.billingCycle}</span>
                          <span className="text-xs font-medium text-slate-700">{fmt(sub.renewalPrice)}/yr</span>
                        </div>
                        {sub.expiryDate && (
                          <div className={`text-xs mt-0.5 flex items-center gap-1 ${isExpiringSoon && sub.status === 'ACTIVE' ? 'text-orange-600 font-medium' : 'text-slate-400'}`}>
                            <Calendar className="w-3 h-3" />
                            Expires {new Date(sub.expiryDate).toLocaleDateString('en-KE')}
                            {isExpiringSoon && sub.status === 'ACTIVE' && ' · Expiring soon'}
                          </div>
                        )}
                      </div>
                      <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${SUBSCRIPTION_STATUS_COLORS[sub.status] || SUBSCRIPTION_STATUS_COLORS.ACTIVE}`}>
                        {sub.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Quotations */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Recent Quotations</h2>
              <Link
                href={`/dashboard/sales/quotations?clientId=${id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all →
              </Link>
            </div>

            {!client.quotations?.length ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No quotations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.quotations.slice(0, 5).map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/dashboard/sales/quotations/${q.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 font-mono group-hover:text-blue-700">{q.quotationNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(q.createdAt).toLocaleDateString('en-KE')}
                        {q.validUntil && ` · Valid until ${new Date(q.validUntil).toLocaleDateString('en-KE')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-900">{fmt(q.totalAmount)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${QUOTATION_STATUS_COLORS[q.status] || QUOTATION_STATUS_COLORS.DRAFT}`}>
                        {q.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <ClientEditModal
          client={client}
          employees={employees}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
            loadClient()
            toast.success('Client updated!')
          }}
        />
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        <div className={`text-sm text-slate-700 font-medium mt-0.5 ${href ? 'text-blue-600 hover:underline' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{content}</a>
  }
  return <div>{content}</div>
}

function ClientEditModal({ client, employees, onClose, onSave }: { client: any; employees: any[]; onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(client?.tags || [])

  const ALL_TAGS = ['VIP', 'Recurring', 'High Value', 'Prospect']
  const CATEGORIES = ['CORPORATE', 'SME', 'INDIVIDUAL']

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
    isActive: client?.isActive ?? true,
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: selectedTags }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Client</h2>
            <p className="text-slate-500 text-xs mt-0.5">Editing {client.companyName}</p>
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
                <input type="text" required value={form.companyName} onChange={e => set('companyName', e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Contact Person <span className="text-red-500">*</span></label>
                <input type="text" required value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input type="text" value={form.country} onChange={e => set('country', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Industry</label>
                <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.isActive ? 'true' : 'false'} onChange={e => set('isActive', e.target.value === 'true')} className={inputCls}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedTags.includes(tag) ? TAG_COLORS[tag] || 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 border-slate-200'}`}>
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
                rows={3} className={inputCls} />
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
              Update Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
