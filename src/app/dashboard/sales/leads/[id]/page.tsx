'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Phone, Mail, MessageCircle, Calendar, FileText,
  Edit, Plus, X, User, Building2, MapPin, Briefcase, DollarSign,
  TrendingUp, CheckCircle, Clock, Tag, ChevronDown, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime, getInitials } from '@/lib/utils'

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'NEEDS_QUOTATION', label: 'Needs Quote' },
  { key: 'QUOTATION_SENT', label: 'Quote Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
  { key: 'WON', label: 'Won' },
  { key: 'LOST', label: 'Lost' },
]

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  NEEDS_QUOTATION: 'bg-amber-100 text-amber-700',
  QUOTATION_SENT: 'bg-purple-100 text-purple-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
}

const ACTIVITY_COLORS: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-700',
  EMAIL: 'bg-green-100 text-green-700',
  WHATSAPP: 'bg-emerald-100 text-emerald-700',
  MEETING: 'bg-purple-100 text-purple-700',
  NOTE: 'bg-slate-100 text-slate-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

const SERVICE_TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
]

function ActivityIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4'
  if (type === 'CALL') return <Phone className={cls} />
  if (type === 'EMAIL') return <Mail className={cls} />
  if (type === 'WHATSAPP') return <MessageCircle className={cls} />
  if (type === 'MEETING') return <Calendar className={cls} />
  return <FileText className={cls} />
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [lead, setLead] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)

  const [activityForm, setActivityForm] = useState({
    type: 'CALL',
    subject: '',
    notes: '',
    activityDate: new Date().toISOString().slice(0, 16),
  })

  const [convertForm, setConvertForm] = useState({
    companyName: '',
    contactPerson: '',
    category: 'CORPORATE',
  })

  async function fetchLead() {
    const res = await fetch(`/api/sales/leads/${id}`)
    const data = await res.json()
    if (data && !data.error) {
      setLead(data)
      setConvertForm(f => ({
        ...f,
        companyName: data.companyName || data.contactPerson || '',
        contactPerson: data.contactPerson || '',
      }))
    }
  }

  async function fetchActivities() {
    const res = await fetch(`/api/sales/leads/${id}/activities`)
    const data = await res.json()
    if (Array.isArray(data)) setActivities(data)
  }

  useEffect(() => {
    Promise.all([fetchLead(), fetchActivities()]).then(() => setLoading(false))
  }, [id])

  async function updateStatus(newStatus: string) {
    setUpdatingStatus(true)
    setStatusDropdownOpen(false)
    try {
      const res = await fetch(`/api/sales/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setLead(updated)
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function saveActivity() {
    if (!activityForm.subject.trim()) {
      toast.error('Subject is required')
      return
    }
    setSavingActivity(true)
    try {
      const res = await fetch(`/api/sales/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Activity logged')
      setShowActivityForm(false)
      setActivityForm({ type: 'CALL', subject: '', notes: '', activityDate: new Date().toISOString().slice(0, 16) })
      await fetchActivities()
    } catch {
      toast.error('Failed to save activity')
    } finally {
      setSavingActivity(false)
    }
  }

  async function convertToClient() {
    if (!convertForm.companyName.trim() || !convertForm.contactPerson.trim()) {
      toast.error('Company name and contact person are required')
      return
    }
    setConverting(true)
    try {
      const clientRes = await fetch('/api/sales/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: convertForm.companyName,
          contactPerson: convertForm.contactPerson,
          category: convertForm.category,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
          industry: lead.industry,
          notes: lead.notes,
        }),
      })
      if (!clientRes.ok) throw new Error('Failed to create client')
      const client = await clientRes.json()

      await fetch(`/api/sales/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convertedToClientId: client.id }),
      })

      toast.success('Lead converted to client!')
      setShowConvertModal(false)
      router.push(`/dashboard/sales/clients/${client.id}`)
    } catch {
      toast.error('Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lead || lead.error) {
    return (
      <div className="text-center py-16 text-slate-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p>Lead not found</p>
      </div>
    )
  }

  const stageKeys = PIPELINE_STAGES.map(s => s.key)
  const currentStageIndex = stageKeys.indexOf(lead.status)
  const showConvertButton = lead.status === 'WON' && !lead.convertedToClientId

  const services: string[] = Array.isArray(lead.servicesInterested)
    ? lead.servicesInterested
    : lead.servicesInterested
    ? [lead.servicesInterested]
    : []

  return (
    <div className="max-w-7xl space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sales/leads"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Leads
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">{lead.leadNumber}</h1>
              {/* Status badge + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(o => !o)}
                  disabled={updatingStatus}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'} hover:opacity-80`}
                >
                  {updatingStatus ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  {lead.status?.replace(/_/g, ' ')}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1 overflow-hidden">
                    {PIPELINE_STAGES.map(stage => (
                      <button
                        key={stage.key}
                        onClick={() => updateStatus(stage.key)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 font-medium transition-colors ${lead.status === stage.key ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500">{lead.contactPerson} · {lead.companyName || '—'}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/sales/leads/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Lead
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Lead Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-900">{lead.contactPerson}</h2>
              {lead.companyName && <p className="text-slate-500 font-medium mt-0.5">{lead.companyName}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {[
                { icon: Phone, label: 'Phone', value: lead.phone },
                { icon: MessageCircle, label: 'WhatsApp', value: lead.whatsapp },
                { icon: Mail, label: 'Email', value: lead.email },
                { icon: MapPin, label: 'Location', value: lead.location || lead.city },
                { icon: Building2, label: 'Industry', value: lead.industry },
                { icon: TrendingUp, label: 'Lead Source', value: lead.source?.replace(/_/g, ' ') },
                { icon: Tag, label: 'Priority', value: lead.priority, badge: PRIORITY_COLORS[lead.priority] },
                { icon: DollarSign, label: 'Expected Value', value: lead.expectedValue ? formatCurrency(lead.expectedValue) : null },
                { icon: Calendar, label: 'Expected Close', value: lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : null },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</div>
                    {item.badge ? (
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${item.badge}`}>{item.value}</span>
                    ) : (
                      <div className="text-sm font-semibold text-slate-900 truncate">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {services.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Services Interested In</div>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc: string, i: number) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold ${SERVICE_TAG_COLORS[i % SERVICE_TAG_COLORS.length]}`}>
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</div>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Activity Timeline</h3>
              <button
                onClick={() => setShowActivityForm(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>

            {/* Inline Add Activity Form */}
            {showActivityForm && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                      <select
                        value={activityForm.type}
                        onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="CALL">Call</option>
                        <option value="EMAIL">Email</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="MEETING">Meeting</option>
                        <option value="NOTE">Note</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Activity Date</label>
                      <input
                        type="datetime-local"
                        value={activityForm.activityDate}
                        onChange={e => setActivityForm(f => ({ ...f, activityDate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
                    <input
                      type="text"
                      placeholder="e.g. Discussed pricing proposal"
                      value={activityForm.subject}
                      onChange={e => setActivityForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Additional notes..."
                      value={activityForm.notes}
                      onChange={e => setActivityForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveActivity}
                      disabled={savingActivity}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {savingActivity ? 'Saving...' : 'Save Activity'}
                    </button>
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-50">
              {activities.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">No activities logged yet</p>
                </div>
              ) : (
                activities.map((activity: any) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[activity.type] || 'bg-slate-100 text-slate-600'}`}>
                        <ActivityIcon type={activity.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900">{activity.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ACTIVITY_COLORS[activity.type] || 'bg-slate-100 text-slate-600'}`}>
                                {activity.type}
                              </span>
                            </div>
                            {activity.notes && (
                              <p className="text-sm text-slate-600 mt-1">{activity.notes}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                              {activity.performedBy && (
                                <span>{activity.performedBy.firstName} {activity.performedBy.lastName}</span>
                              )}
                              {activity.performedBy && <span>·</span>}
                              <span>{formatDateTime(activity.activityDate || activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Linked Quotations */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Quotations</h3>
              <Link
                href={`/dashboard/sales/quotations?newForLead=${id}&leadName=${encodeURIComponent((lead.companyName || lead.contactPerson) ?? '')}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Quotation
              </Link>
            </div>
            {!lead.quotations?.length ? (
              <div className="text-center py-10 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No quotations yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['QT#', 'Client', 'Total (KES)', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lead.quotations.map((qt: any) => (
                    <tr key={qt.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/sales/quotations/${qt.id}`} className="font-semibold text-blue-600 hover:underline">
                          {qt.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{qt.clientName}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{formatCurrency(qt.totalAmount || 0)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          qt.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          qt.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          qt.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                          qt.status === 'VIEWED' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{qt.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(qt.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-5">
          {/* Assignment Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Assignment</h3>
            {lead.assignedTo ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {getInitials(lead.assignedTo.firstName, lead.assignedTo.lastName)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</div>
                  <div className="text-xs text-slate-400">Assigned Sales Rep</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                <User className="w-4 h-4" />
                Unassigned
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
              {lead.createdBy && (
                <div className="flex justify-between">
                  <span>Created by</span>
                  <span className="font-semibold text-slate-700">{lead.createdBy.firstName} {lead.createdBy.lastName}</span>
                </div>
              )}
              {lead.createdAt && (
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-semibold text-slate-700">{formatDate(lead.createdAt)}</span>
                </div>
              )}
              {lead.updatedAt && (
                <div className="flex justify-between">
                  <span>Last updated</span>
                  <span className="font-semibold text-slate-700">{formatDate(lead.updatedAt)}</span>
                </div>
              )}
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 rounded-xl text-sm font-semibold transition-colors">
              <RefreshCw className="w-4 h-4" />
              Reassign
            </button>
          </div>

          {/* Pipeline Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Lead Pipeline</h3>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage, index) => {
                const isCurrent = stage.key === lead.status
                const isPast = currentStageIndex > index && lead.status !== 'LOST'
                const isLost = stage.key === 'LOST'
                const isWon = stage.key === 'WON'

                return (
                  <button
                    key={stage.key}
                    onClick={() => updateStatus(stage.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      isCurrent
                        ? isLost
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : isWon
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : isPast
                        ? 'bg-slate-50 text-slate-400 border border-slate-100'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCurrent
                        ? isLost ? 'bg-red-500 text-white' : isWon ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        : isPast
                        ? 'bg-slate-300 text-white'
                        : 'border-2 border-slate-200 text-slate-400'
                    }`}>
                      {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : index + 1}
                    </div>
                    {stage.label}
                    {isCurrent && <span className="ml-auto text-xs opacity-70">Current</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Convert to Client Button */}
          {showConvertButton && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="w-full py-3 bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-2xl text-sm font-black shadow-lg shadow-green-200 transition-all"
            >
              Convert to Client
            </button>
          )}

          {lead.convertedToClientId && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-green-800">Converted to Client</div>
              <Link href={`/dashboard/sales/clients/${lead.convertedToClientId}`} className="text-xs text-green-600 hover:underline mt-1 block">
                View Client →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Convert to Client Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Convert to Client</h2>
              <button onClick={() => setShowConvertModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">A new client record will be created from this lead. Confirm the details below.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={convertForm.companyName}
                  onChange={e => setConvertForm(f => ({ ...f, companyName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person *</label>
                <input
                  type="text"
                  value={convertForm.contactPerson}
                  onChange={e => setConvertForm(f => ({ ...f, contactPerson: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={convertForm.category}
                  onChange={e => setConvertForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CORPORATE">Corporate</option>
                  <option value="SME">SME</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="NGO">NGO</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={convertToClient}
                  disabled={converting}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {converting ? 'Converting...' : 'Convert to Client'}
                </button>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close status dropdown when clicking outside */}
      {statusDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
      )}
    </div>
  )
}
