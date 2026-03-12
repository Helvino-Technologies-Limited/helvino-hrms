'use client'
import { useEffect, useState } from 'react'
import { LifeBuoy, Send, X, Loader2, MessageSquare, ChevronDown, AlertCircle } from 'lucide-react'

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

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED']

export default function DashboardTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    setLoading(true)
    const r = await fetch('/api/dashboard/tickets').catch(() => null)
    if (r?.ok) {
      const d = await r.json()
      if (Array.isArray(d)) setTickets(d)
    }
    setLoading(false)
  }

  async function openTicket(ticket: any) {
    setSelectedTicket(ticket)
    setTicketDetail(null)
    setError('')
    const r = await fetch(`/api/dashboard/tickets/${ticket.id}`)
    if (r.ok) setTicketDetail(await r.json())
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    setError('')
    const res = await fetch(`/api/dashboard/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage }),
    })
    if (res.ok) {
      const msg = await res.json()
      setTicketDetail((prev: any) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setNewMessage('')
      // Update status in list to WAITING_CLIENT
      setTickets(prev => prev.map(t => t.id === selectedTicket.id
        ? { ...t, status: 'WAITING_CLIENT', updatedAt: new Date().toISOString() }
        : t
      ))
    } else {
      setError('Failed to send message')
    }
    setSending(false)
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedTicket || !ticketDetail) return
    setUpdatingStatus(true)
    const res = await fetch(`/api/dashboard/tickets/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setTicketDetail((prev: any) => prev ? { ...prev, status: newStatus } : prev)
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
      setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : prev)
    }
    setUpdatingStatus(false)
  }

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage and respond to client support requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          All <span className="ml-1 opacity-70">({tickets.length})</span>
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {s.replace('_', ' ')} <span className="ml-1 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        {/* Ticket list */}
        <div className={`${selectedTicket ? 'hidden lg:block lg:w-80 flex-shrink-0' : 'flex-1'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700">No tickets</h3>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'ALL' ? 'No support tickets have been raised yet.' : `No ${filter.replace('_', ' ').toLowerCase()} tickets.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(ticket => (
                <button key={ticket.id} onClick={() => openTicket(ticket)}
                  className={`w-full bg-white rounded-2xl border shadow-sm p-5 text-left hover:shadow-md transition-all ${selectedTicket?.id === ticket.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}>
                  <div className="flex items-start justify-between gap-3">
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
                      <h3 className="font-bold text-slate-900 mt-1 truncate">{ticket.subject}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{ticket.client?.companyName || ticket.client?.contactPerson}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {ticket.category} · {new Date(ticket.updatedAt).toLocaleDateString()} · {ticket._count?.messages || 0} msg
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket detail */}
        {selectedTicket && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-100">
              <button onClick={() => { setSelectedTicket(null); setTicketDetail(null) }}
                className="text-slate-400 hover:text-slate-600 mt-0.5 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">
                    {ticketDetail?.ticketNumber || selectedTicket.ticketNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticketDetail?.priority || selectedTicket.priority]}`}>
                    {ticketDetail?.priority || selectedTicket.priority}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mt-0.5">
                  {ticketDetail?.subject || selectedTicket.subject}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ticketDetail?.category || selectedTicket.category} ·{' '}
                  {ticketDetail?.client?.companyName || ticketDetail?.client?.contactPerson || selectedTicket.client?.companyName}
                </p>
              </div>
              {/* Status changer */}
              <div className="flex-shrink-0 relative">
                <div className="flex items-center gap-1">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[ticketDetail?.status || selectedTicket.status] || 'bg-slate-100 text-slate-600'}`}>
                    {(ticketDetail?.status || selectedTicket.status).replace('_', ' ')}
                  </span>
                  <div className="relative group">
                    <button
                      disabled={updatingStatus}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                      title="Change status"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[160px] hidden group-hover:block">
                      {STATUSES.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl font-medium text-slate-700"
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {!ticketDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[420px]">
                {ticketDetail.messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">No messages yet.</p>
                ) : (
                  ticketDetail.messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.isClient ? 'bg-slate-100 text-slate-900' : 'bg-blue-600 text-white'}`}>
                        <p className={`text-xs font-semibold mb-1 ${msg.isClient ? 'text-slate-500' : 'text-blue-200'}`}>
                          {msg.isClient ? msg.senderName : `${msg.senderName} (Support)`}
                        </p>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.isClient ? 'text-slate-400' : 'text-blue-300'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reply */}
            {ticketDetail && !['RESOLVED', 'CLOSED'].includes(ticketDetail.status) && (
              <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-100 space-y-2">
                {error && (
                  <div className="flex gap-2 items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    placeholder="Type your reply to the client..."
                    required
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="text-sm font-semibold">Reply</span>
                  </button>
                </div>
              </form>
            )}
            {ticketDetail && ['RESOLVED', 'CLOSED'].includes(ticketDetail.status) && (
              <div className="p-5 border-t border-slate-100 text-center text-sm text-slate-400">
                This ticket is {ticketDetail.status.toLowerCase()}. Change the status to reopen it.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
