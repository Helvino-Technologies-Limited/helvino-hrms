'use client'
import { useEffect, useState } from 'react'
import { LifeBuoy, Plus, Send, X, AlertCircle, Loader2, MessageSquare } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  WAITING_CLIENT: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

const CATEGORIES = [
  'Technical Support',
  'Software Bug',
  'Maintenance Request',
  'Billing Issue',
  'Service Request',
  'General Inquiry',
]

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ subject: '', description: '', category: '', priority: 'MEDIUM' })

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    setLoading(true)
    const r = await fetch('/api/client/tickets').catch(() => null)
    if (r?.ok) {
      const d = await r.json()
      if (Array.isArray(d)) setTickets(d)
    }
    setLoading(false)
  }

  async function openTicket(ticket: any) {
    setSelectedTicket(ticket)
    const r = await fetch(`/api/client/tickets/${ticket.id}/messages`)
    if (r.ok) setTicketDetail(await r.json())
  }

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/client/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create ticket')
    } else {
      setTickets(prev => [data, ...prev])
      setShowForm(false)
      setForm({ subject: '', description: '', category: '', priority: 'MEDIUM' })
    }
    setSubmitting(false)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    const res = await fetch(`/api/client/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage }),
    })
    if (res.ok) {
      const msg = await res.json()
      setTicketDetail((prev: any) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setNewMessage('')
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Get help from our support team</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Ticket Detail View */}
      {selectedTicket && ticketDetail ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100">
            <button onClick={() => { setSelectedTicket(null); setTicketDetail(null) }}
              className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">{ticketDetail.ticketNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[ticketDetail.status] || 'bg-slate-100 text-slate-600'}`}>
                  {ticketDetail.status.replace('_', ' ')}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticketDetail.priority]}`}>
                  {ticketDetail.priority}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mt-0.5">{ticketDetail.subject}</h3>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {ticketDetail.messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.isClient ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.isClient ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <p className={`text-xs font-semibold mb-1 ${msg.isClient ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.isClient ? 'You' : msg.senderName}
                  </p>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.isClient ? 'text-blue-300' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply form */}
          {!['RESOLVED', 'CLOSED'].includes(ticketDetail.status) && (
            <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-100 flex gap-3">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                placeholder="Type your reply..."
                required
              />
              <button type="submit" disabled={sending || !newMessage.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          {/* New Ticket Form */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">New Support Ticket</h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                    <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                      placeholder="Brief description of the issue" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" required>
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                      rows={4} placeholder="Describe the issue in detail..." required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tickets List */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700">No support tickets</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">Need help? Submit a support ticket.</p>
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">
                <Plus className="w-4 h-4" /> New Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <button key={ticket.id} onClick={() => openTicket(ticket)}
                  className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 mt-1">{ticket.subject}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{ticket.category}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(ticket.updatedAt).toLocaleDateString()} · {ticket._count?.messages || 0} message{ticket._count?.messages !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
