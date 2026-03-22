'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Video, MapPin, Plus, Calendar, Clock, Edit2, Trash2, CheckCircle, X, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const emptyForm = {
  title: '', agenda: '', meetingDate: '', startTime: '', endTime: '',
  type: 'ONLINE', meetingLink: '', location: '', status: 'SCHEDULED',
}

export default function SalesTeamMeetingsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isManager = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER'].includes(role)

  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function loadMeetings() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/meetings')
      const data = await res.json()
      setMeetings(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load meetings')
    }
    setLoading(false)
  }

  useEffect(() => { loadMeetings() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  function openEdit(meeting: any) {
    setEditTarget(meeting)
    setForm({
      title: meeting.title,
      agenda: meeting.agenda || '',
      meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().split('T')[0] : '',
      startTime: meeting.startTime || '',
      endTime: meeting.endTime || '',
      type: meeting.type || 'ONLINE',
      meetingLink: meeting.meetingLink || '',
      location: meeting.location || '',
      status: meeting.status || 'SCHEDULED',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editTarget ? `/api/sales/meetings/${editTarget.id}` : '/api/sales/meetings'
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (editTarget) {
        setMeetings(prev => prev.map(m => m.id === editTarget.id ? data : m))
        toast.success('Meeting updated')
      } else {
        setMeetings(prev => [data, ...prev])
        toast.success('Meeting scheduled')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function deleteMeeting(id: string) {
    if (!confirm('Delete this meeting?')) return
    try {
      const res = await fetch(`/api/sales/meetings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setMeetings(prev => prev.filter(m => m.id !== id))
      toast.success('Meeting deleted')
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  async function markComplete(meeting: any) {
    try {
      const res = await fetch(`/api/sales/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('Failed')
      setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, status: 'COMPLETED' } : m))
      toast.success('Marked as completed')
    } catch {
      toast.error('Failed to update meeting')
    }
  }

  const upcoming = meetings.filter(m => m.status === 'SCHEDULED')
  const past = meetings.filter(m => m.status !== 'SCHEDULED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Team Meetings</h1>
          <p className="text-slate-500 text-sm">Schedule and track team meetings</p>
        </div>
        {isManager && (
          <button onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-md transition-colors">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-100 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold">No meetings yet</p>
          {isManager && <p className="text-sm mt-1">Schedule your first team meeting above</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} isManager={isManager}
                    onEdit={() => openEdit(meeting)}
                    onDelete={() => deleteMeeting(meeting.id)}
                    onComplete={() => markComplete(meeting)} />
                ))}
              </div>
            </div>
          )}
          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Past Meetings ({past.length})</h2>
              <div className="space-y-3">
                {past.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} isManager={isManager}
                    onEdit={() => openEdit(meeting)}
                    onDelete={() => deleteMeeting(meeting.id)}
                    onComplete={undefined} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editTarget ? 'Edit Meeting' : 'Schedule Meeting'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Weekly team sync" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                  <input required type="date" value={form.meetingDate} onChange={e => set('meetingDate', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ONLINE">Online</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time *</label>
                  <input required type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {form.type === 'ONLINE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Meeting Link</label>
                  <input type="url" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/..." />
                </div>
              )}
              {form.type === 'IN_PERSON' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Office / Address" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Agenda / Notes</label>
                <textarea rows={3} value={form.agenda} onChange={e => set('agenda', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Meeting agenda and discussion points..." />
              </div>
              {editTarget && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MeetingCard({ meeting, isManager, onEdit, onDelete, onComplete }: any) {
  const date = new Date(meeting.meetingDate)
  const formattedDate = date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            meeting.type === 'ONLINE' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {meeting.type === 'ONLINE'
              ? <Video className="w-5 h-5 text-blue-600" />
              : <MapPin className="w-5 h-5 text-green-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900">{meeting.title}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formattedDate}
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {meeting.startTime}{meeting.endTime ? ` – ${meeting.endTime}` : ''}
              </span>
              {meeting.type === 'ONLINE' && meeting.meetingLink && (
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Join
                </a>
              )}
              {meeting.type === 'IN_PERSON' && meeting.location && (
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {meeting.location}
                </span>
              )}
            </div>
            {meeting.agenda && <p className="text-slate-500 text-sm mt-2 leading-relaxed">{meeting.agenda}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[meeting.status] || 'bg-slate-100 text-slate-600'}`}>
            {meeting.status}
          </span>
          {isManager && (
            <div className="flex gap-1">
              {onComplete && (
                <button onClick={onComplete} title="Mark complete"
                  className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button onClick={onEdit} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
