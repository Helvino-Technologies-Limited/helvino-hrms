'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send, Loader2, AlertCircle, ChevronDown, LifeBuoy, CheckCheck, Clock, RefreshCw } from 'lucide-react'

/* ─── constants ─────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN:           { label: 'Open',           dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS:    { label: 'In Progress',    dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
  WAITING_CLIENT: { label: 'Waiting Client', dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700' },
  RESOLVED:       { label: 'Resolved',       dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  CLOSED:         { label: 'Closed',         dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-500' },
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'text-slate-400',
  MEDIUM: 'text-blue-500',
  HIGH:   'text-orange-500',
  URGENT: 'text-red-500',
}

const PRIORITY_DOTS: Record<string, string> = {
  LOW:    'bg-slate-300',
  MEDIUM: 'bg-blue-400',
  HIGH:   'bg-orange-400',
  URGENT: 'bg-red-500',
}

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED']
const FILTERS  = ['ALL', ...STATUSES]

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
]

function avatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ─── component ─────────────────────────────────────────── */
export default function DashboardTicketsPage() {
  const [tickets,        setTickets]        = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState('ALL')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketDetail,   setTicketDetail]   = useState<any>(null)
  const [newMessage,     setNewMessage]     = useState('')
  const [sending,        setSending]        = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [error,          setError]          = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusMenuRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { loadTickets() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticketDetail?.messages])

  // Close status menu on outside click
  useEffect(() => {
    if (!showStatusMenu) return
    function handler(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node))
        setShowStatusMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showStatusMenu])

  async function loadTickets() {
    setLoading(true)
    const r = await fetch('/api/dashboard/tickets').catch(() => null)
    if (r?.ok) { const d = await r.json(); if (Array.isArray(d)) setTickets(d) }
    setLoading(false)
  }

  async function openTicket(ticket: any) {
    setSelectedTicket(ticket)
    setTicketDetail(null)
    setError('')
    const r = await fetch(`/api/dashboard/tickets/${ticket.id}`)
    if (r.ok) setTicketDetail(await r.json())
  }

  function closeChat() {
    setSelectedTicket(null)
    setTicketDetail(null)
    setShowStatusMenu(false)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true); setError('')
    const res = await fetch(`/api/dashboard/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage }),
    })
    if (res.ok) {
      const msg = await res.json()
      setTicketDetail((p: any) => p ? { ...p, status: 'WAITING_CLIENT', messages: [...p.messages, msg] } : p)
      setTickets(p => p.map(t => t.id === selectedTicket.id
        ? { ...t, status: 'WAITING_CLIENT', updatedAt: new Date().toISOString() } : t))
      setNewMessage('')
    } else { setError('Failed to send. Please try again.') }
    setSending(false)
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedTicket || !ticketDetail) return
    setUpdatingStatus(true); setShowStatusMenu(false)
    const res = await fetch(`/api/dashboard/tickets/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setTicketDetail((p: any) => p ? { ...p, status: newStatus } : p)
      setTickets(p => p.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
    }
    setUpdatingStatus(false)
  }

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter)
  const counts   = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? tickets.length : tickets.filter(t => t.status === f).length
    return acc
  }, {} as Record<string, number>)

  const currentStatus = ticketDetail?.status || selectedTicket?.status || 'OPEN'
  const clientName    = ticketDetail?.client?.companyName || ticketDetail?.client?.contactPerson
    || selectedTicket?.client?.companyName || selectedTicket?.client?.contactPerson || '?'
  const isClosedOrResolved = ['RESOLVED', 'CLOSED'].includes(ticketDetail?.status ?? '')

  /* ─── render ─── */
  return (
    /* Outer wrapper — on mobile we stack vertically; on lg+ side-by-side */
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* ═══ LIST PANEL ═══════════════════════════════════════════════ */}
      <div className={`
        flex flex-col bg-white
        ${selectedTicket ? 'hidden lg:flex lg:w-[340px] xl:w-[380px] lg:flex-shrink-0 lg:border-r lg:border-slate-200' : 'flex-1'}
      `}>
        {/* List header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-slate-900">Support Tickets</h1>
            <button onClick={loadTickets}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filter pills — horizontally scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map(f => {
              const active = filter === f
              const dot = f !== 'ALL' ? STATUS_META[f]?.dot : ''
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {dot && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : dot}`} />}
                  {f === 'ALL' ? 'All' : STATUS_META[f].label}
                  <span className={`ml-0.5 ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                    {counts[f] || 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ticket list body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading tickets…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <LifeBuoy className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-600">No tickets here</p>
              <p className="text-sm text-slate-400">
                {filter === 'ALL' ? 'No support tickets yet.' : `No ${STATUS_META[filter]?.label.toLowerCase()} tickets.`}
              </p>
            </div>
          ) : (
            <ul>
              {filtered.map(ticket => {
                const name    = ticket.client?.companyName || ticket.client?.contactPerson || '?'
                const grad    = avatarGradient(name)
                const meta    = STATUS_META[ticket.status]
                const isNew   = ticket.status === 'OPEN'
                const isActive = selectedTicket?.id === ticket.id
                return (
                  <li key={ticket.id}>
                    <button onClick={() => openTicket(ticket)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        isActive ? 'bg-blue-50' : 'hover:bg-slate-50 active:bg-slate-100'
                      }`}>
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white text-base shadow-sm`}>
                          {initials(name)}
                        </div>
                        {/* Status dot */}
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${meta?.dot || 'bg-slate-300'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-sm truncate ${isNew ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {name}
                          </p>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {timeAgo(ticket.updatedAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate mt-0.5 ${isNew ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{ticket.category}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{ticket._count?.messages || 0} msg</span>
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isNew && !isActive && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </button>
                    <div className="h-px bg-slate-100 ml-[4.25rem]" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ═══ CHAT PANEL ═══════════════════════════════════════════════ */}
      {selectedTicket ? (
        <div className="
          fixed inset-0 z-40 flex flex-col bg-[#f0f2f5]
          lg:static lg:z-auto lg:flex-1 lg:flex lg:flex-col
        ">
          {/* Chat header — Messenger-style */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
            {/* Back (mobile only) */}
            <button onClick={closeChat}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors text-blue-600 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(clientName)} flex items-center justify-center font-bold text-white text-sm shadow-sm`}>
                {initials(clientName)}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_META[currentStatus]?.dot || 'bg-slate-300'}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate leading-tight">{clientName}</p>
              <p className="text-xs text-slate-500 truncate">
                {(ticketDetail?.ticketNumber || selectedTicket.ticketNumber)} · {ticketDetail?.category || selectedTicket.category}
              </p>
            </div>

            {/* Priority pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100`}>
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[ticketDetail?.priority || selectedTicket.priority]}`} />
              <span className={`text-xs font-bold ${PRIORITY_COLORS[ticketDetail?.priority || selectedTicket.priority]}`}>
                {ticketDetail?.priority || selectedTicket.priority}
              </span>
            </div>

            {/* Status dropdown */}
            <div className="relative flex-shrink-0" ref={statusMenuRef}>
              <button onClick={() => setShowStatusMenu(v => !v)} disabled={updatingStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${STATUS_META[currentStatus]?.badge || 'bg-slate-100 text-slate-600'}`}>
                {updatingStatus
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><span>{STATUS_META[currentStatus]?.label || currentStatus}</span><ChevronDown className="w-3 h-3 opacity-60" /></>
                }
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[170px] py-1">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 ${
                        s === currentStatus ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                      }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_META[s].dot}`} />
                      {STATUS_META[s].label}
                      {s === currentStatus && <CheckCheck className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close on desktop */}
            <button onClick={closeChat}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              ✕
            </button>
          </div>

          {/* Ticket subject banner */}
          <div className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border-b border-slate-200/60 flex-shrink-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {ticketDetail?.subject || selectedTicket.subject}
            </p>
          </div>

          {/* Messages area */}
          {!ticketDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading conversation…</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {ticketDetail.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-slate-400 text-sm">No messages yet. Send the first reply.</p>
                </div>
              ) : (
                ticketDetail.messages.map((msg: any, i: number) => {
                  const isStaff    = !msg.isClient
                  const prevMsg    = ticketDetail.messages[i - 1]
                  const showAvatar = !prevMsg || prevMsg.isClient !== msg.isClient
                  const grad       = isStaff ? 'from-blue-600 to-blue-700' : avatarGradient(msg.senderName)

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isStaff ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                      {/* Avatar */}
                      {showAvatar ? (
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5 shadow-sm`}>
                          {initials(msg.senderName)}
                        </div>
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )}

                      {/* Bubble */}
                      <div className={`max-w-[72%] sm:max-w-[60%] ${isStaff ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && (
                          <p className={`text-xs text-slate-500 mb-1 px-1 ${isStaff ? 'text-right' : 'text-left'}`}>
                            {isStaff ? `${msg.senderName} (Support)` : msg.senderName}
                          </p>
                        )}
                        <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isStaff
                            ? 'bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-md'
                            : 'bg-white text-slate-800 rounded-t-2xl rounded-br-2xl rounded-bl-md border border-slate-100'
                        }`}>
                          {msg.message}
                        </div>
                        <p className={`text-[10px] text-slate-400 mt-1 px-1 ${isStaff ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input / closed state */}
          {ticketDetail && (
            isClosedOrResolved ? (
              <div className="px-4 py-4 bg-white border-t border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-2 justify-center text-sm text-slate-400">
                  <CheckCheck className="w-4 h-4 text-green-500" />
                  <span>
                    Ticket is <strong className="text-slate-600">{ticketDetail.status.toLowerCase()}</strong>.
                    Change status to reopen.
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage}
                className="px-3 py-3 bg-white border-t border-slate-200 flex-shrink-0">
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-xs mb-2 px-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {/* Staff avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-full px-4 pr-2 py-1.5">
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                      placeholder="Reply to client…"
                      required
                    />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        newMessage.trim() && !sending
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95'
                          : 'bg-slate-300 text-slate-500'
                      }`}>
                      {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </form>
            )
          )}
        </div>
      ) : (
        /* Desktop empty state when no ticket selected */
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] gap-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center">
            <LifeBuoy className="w-10 h-10 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-lg">Select a ticket</p>
            <p className="text-slate-400 text-sm mt-1">Choose a support ticket to view the conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}
