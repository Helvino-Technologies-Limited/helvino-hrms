'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Eye, MessageCircle, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, RefreshCw, UserCheck, Briefcase,
  DollarSign, Calendar, Filter, Plus, X, Sparkles, Send, Download,
  UserSearch, Check, Mail,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Offer = {
  id: string
  applicantId: string
  salary: number
  startDate: string | null
  probationPeriod: number | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  sentAt: string | null
  respondedAt: string | null
  notes: string | null
  applicant: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    job: { id: string; title: string } | null
    onboardingToken?: string
    offerLetterContent?: string | null
  }
  createdBy: { firstName: string; lastName: string } | null
  createdAt: string
}

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string | null
  department?: { name: string } | null
}

// ─── Static data ─────────────────────────────────────────────────────────────

const ONBOARDING_DOCS = [
  { label: 'National Identity Card / Passport (Front & Back)', required: true },
  { label: 'Academic and Professional Certificates / Transcripts', required: true },
  { label: 'Recent Passport-Size Photograph', required: true },
  { label: 'KRA PIN Certificate', required: true },
  { label: 'NSSF Card', required: false },
  { label: 'SHA (Social Health Authority) Card', required: false },
  { label: 'Bank Account Details or M-Pesa Statement', required: true },
  { label: 'Certificate of Good Conduct', required: false },
]

const TERMS: { title: string; body: string }[] = [
  { title: '1. Position and Duties', body: 'The Employee shall perform all duties reasonably required for the stated position and any additional responsibilities assigned by management.' },
  { title: '2. Commencement and Probation Period', body: 'A probationary period of three (3) months shall apply from the commencement date unless otherwise stated. During this period, either party may terminate employment with two (2) weeks\' written notice.' },
  { title: '3. Compensation and Payment', body: 'The Employee shall be paid the gross monthly salary stated in this offer, subject to statutory deductions (PAYE, NSSF, SHA/SHIF). Payment shall be made on or before the last working day of each month.' },
  { title: '4. Working Hours', body: 'Standard working hours are Monday to Friday, 8:00 AM to 5:00 PM totalling forty (40) hours per week.' },
  { title: '5. Leave Entitlement', body: 'The Employee is entitled to twenty-one (21) days of paid annual leave per year upon completion of twelve (12) months of continuous service.' },
  { title: '6. Confidentiality and Non-Disclosure', body: 'The Employee agrees to maintain strict confidentiality of all information relating to Helvino Technologies Ltd\'s clients, projects, systems, and proprietary processes. This obligation survives the termination of employment.' },
  { title: '7. Intellectual Property', body: 'All work products created by the Employee in the course of employment shall be the sole and exclusive property of Helvino Technologies Ltd.' },
  { title: '8. Termination', body: 'After probation, either party may terminate employment by providing one (1) calendar month\'s written notice or payment in lieu thereof.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  ACCEPTED:  { label: 'Accepted',  color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-slate-100 text-slate-600 border-slate-200',   icon: AlertCircle },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatLetterDate(d: Date) {
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}
function getDefaultDeadline() {
  const d = new Date(); d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function buildWhatsAppMessage(offer: Offer) {
  const name = `${offer.applicant.firstName} ${offer.applicant.lastName}`
  const position = offer.applicant.job?.title || 'the position'
  const salary = fmt(offer.salary)
  const startDate = offer.startDate ? fmtDate(offer.startDate) : 'To be communicated'
  const probation = offer.probationPeriod ? `${offer.probationPeriod} months` : '3 months'
  const portalBase = typeof window !== 'undefined' ? window.location.origin : 'https://helvinocrm.org'
  const portalLink = offer.applicant.onboardingToken
    ? `${portalBase}/onboarding/${offer.applicant.onboardingToken}`
    : null
  let msg = `*Job Offer — Helvino Technologies Ltd*\n\nDear ${name},\n\nWe are pleased to formally extend you an employment offer at Helvino Technologies Ltd.\n\n*Offer Details:*\n• Position: ${position}\n• Gross Salary: ${salary}/month\n• Start Date: ${startDate}\n• Probation Period: ${probation}\n\n`
  if (portalLink) msg += `*Document Submission Portal:*\n${portalLink}\n\n`
  msg += `For any queries: helvinotechltd@gmail.com | 0110421320\n\n_Helvino Technologies Ltd — IT Infrastructure · Software Development · Cybersecurity · CCTV_`
  return msg
}

// ─── Create Offer Letter Modal ────────────────────────────────────────────────

function CreateOfferModal({ onClose }: { onClose: () => void }) {
  // Employee search
  const [empQuery, setEmpQuery] = useState('')
  const [empResults, setEmpResults] = useState<Employee[]>([])
  const [empSearching, setEmpSearching] = useState(false)
  const [empOpen, setEmpOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const empDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Offer fields
  const [position, setPosition] = useState('')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [probation, setProbation] = useState('3')
  const [deadline, setDeadline] = useState(getDefaultDeadline())
  const [letterBody, setLetterBody] = useState('')

  // Signatory
  const [sigQuery, setSigQuery] = useState('')
  const [sigResults, setSigResults] = useState<Employee[]>([])
  const [sigSearching, setSigSearching] = useState(false)
  const [sigOpen, setSigOpen] = useState(false)
  const [signatoryName, setSignatoryName] = useState('')
  const [signatoryTitle, setSignatoryTitle] = useState('')
  const sigDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Actions
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const letterRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const today = new Date()
  const refNumber = `HL/HR/OL/${today.getFullYear()}/${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const deadlineDate = deadline ? new Date(deadline + 'T00:00:00') : null

  // Employee search
  function searchEmployee(q: string) {
    setEmpQuery(q)
    setEmpOpen(true)
    if (empDebounce.current) clearTimeout(empDebounce.current)
    if (!q.trim()) { setEmpResults([]); return }
    empDebounce.current = setTimeout(async () => {
      setEmpSearching(true)
      try {
        const res = await fetch(`/api/employees?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        setEmpResults(Array.isArray(data) ? data.slice(0, 8) : [])
      } catch { setEmpResults([]) }
      setEmpSearching(false)
    }, 300)
  }

  function selectEmployee(emp: Employee) {
    setSelectedEmp(emp)
    setEmpQuery(`${emp.firstName} ${emp.lastName}`)
    setPosition(emp.jobTitle || '')
    setEmpResults([])
    setEmpOpen(false)
  }

  // Signatory search
  function searchSignatory(q: string) {
    setSigQuery(q)
    setSigOpen(true)
    if (sigDebounce.current) clearTimeout(sigDebounce.current)
    if (!q.trim()) { setSigResults([]); return }
    sigDebounce.current = setTimeout(async () => {
      setSigSearching(true)
      try {
        const res = await fetch(`/api/employees?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSigResults(Array.isArray(data) ? data.slice(0, 6) : [])
      } catch { setSigResults([]) }
      setSigSearching(false)
    }, 300)
  }

  function selectSignatory(emp: Employee) {
    setSignatoryName(`${emp.firstName} ${emp.lastName}`)
    setSignatoryTitle(emp.jobTitle || '')
    setSigQuery(`${emp.firstName} ${emp.lastName}`)
    setSigResults([])
    setSigOpen(false)
  }

  // AI generate
  async function generateBody() {
    if (!selectedEmp) return
    setGenerating(true)
    setLetterBody('')
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          type: 'OFFER_LETTER',
          candidateName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
          jobTitle: position || selectedEmp.jobTitle || 'the position',
          context: salary
            ? `Gross monthly salary: ${fmt(Number(salary))}. Start date: ${startDate ? formatLetterDate(new Date(startDate)) : 'to be communicated'}. Probation period: ${probation || 3} months.`
            : '',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setLetterBody(prev => prev + decoder.decode(value))
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setLetterBody('[Error generating — type manually]')
    }
    setGenerating(false)
  }

  // Send email
  async function sendEmail() {
    if (!selectedEmp || !letterBody.trim() || !salary || !position) return
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/recruitment/offers/send-to-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
          employeeEmail: selectedEmp.email,
          position,
          salary: Number(salary),
          startDate: startDate || null,
          probation: Number(probation) || 3,
          letterBody,
          signatoryName,
          signatoryTitle,
          deadline: deadline || null,
          refNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
    } catch (e: any) {
      setSendError(e.message || 'Failed to send email')
    }
    setSending(false)
  }

  // Download PDF
  async function downloadPdf() {
    if (!letterRef.current || !selectedEmp) return
    setDownloadingPdf(true)
    try {
      setActiveTab('preview')
      await new Promise(r => setTimeout(r, 400))
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const el = letterRef.current
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let remaining = imgH, yPos = 0
      pdf.addImage(imgData, 'JPEG', 0, yPos, pageW, imgH)
      remaining -= pageH
      while (remaining > 0) {
        yPos -= pageH; pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, yPos, pageW, imgH)
        remaining -= pageH
      }
      pdf.save(`Offer_Letter_${selectedEmp.firstName}_${selectedEmp.lastName}_${today.getFullYear()}.pdf`)
    } catch (e: any) {
      alert('PDF generation failed: ' + (e.message || 'Unknown error'))
    }
    setDownloadingPdf(false)
  }

  const canSend = !!(selectedEmp && letterBody.trim() && salary && position)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Offer Letter</h2>
              <p className="text-xs text-slate-400">Create, preview, send &amp; download</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {(['form', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'form' ? 'Details & Content' : 'Preview Letter'}
            </button>
          ))}
        </div>

        {/* ── Form tab ── */}
        {activeTab === 'form' && (
          <div className="p-6 space-y-6">

            {/* Employee search */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <UserSearch className="inline w-3.5 h-3.5 mr-1" />Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={empQuery}
                  onChange={e => searchEmployee(e.target.value)}
                  onFocus={() => empQuery && setEmpOpen(true)}
                  onBlur={() => setTimeout(() => setEmpOpen(false), 150)}
                  placeholder="Search employee by name, email or job title…"
                  autoComplete="off"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {empOpen && (empSearching || empResults.length > 0) && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {empSearching ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                      </div>
                    ) : empResults.map(emp => (
                      <button key={emp.id} type="button" onMouseDown={() => selectEmployee(emp)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                        <span className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</span>
                        <span className="text-slate-400 text-xs ml-2">{emp.email}</span>
                        {emp.jobTitle && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{emp.jobTitle}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedEmp && (
                <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-blue-800">{selectedEmp.firstName} {selectedEmp.lastName}</span>
                  <span className="text-blue-500 text-xs">·</span>
                  <span className="text-blue-600 text-xs">{selectedEmp.email}</span>
                  {selectedEmp.department && <span className="text-blue-400 text-xs">· {selectedEmp.department.name}</span>}
                </div>
              )}
            </div>

            {/* Offer details */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <Briefcase className="inline w-3.5 h-3.5 mr-1" />Offer Details
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Position / Designation *</label>
                  <input
                    type="text"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    placeholder="e.g. Software Developer"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Gross Salary (KES) *</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Probation (months)</label>
                  <input
                    type="number"
                    min={1} max={12}
                    value={probation}
                    onChange={e => setProbation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Response Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Letter body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Letter Body *
                </label>
                <div className="flex gap-2">
                  {generating ? (
                    <button onClick={() => { abortRef.current?.abort(); setGenerating(false) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold">
                      <X className="w-3.5 h-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={generateBody}
                      disabled={!selectedEmp || !position}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {letterBody ? 'Regenerate AI' : 'Generate with AI'}
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={letterBody}
                  onChange={e => setLetterBody(e.target.value)}
                  rows={9}
                  placeholder={generating ? '' : 'Select an employee and click "Generate with AI", or type the letter body manually…'}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed"
                />
                {generating && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Writing…
                  </div>
                )}
              </div>
            </div>

            {/* Signatory */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <UserSearch className="inline w-3.5 h-3.5 mr-1" />Authorised Signatory
              </label>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={sigQuery}
                    onChange={e => searchSignatory(e.target.value)}
                    onFocus={() => sigQuery && setSigOpen(true)}
                    onBlur={() => setTimeout(() => setSigOpen(false), 150)}
                    placeholder="Search HR/Admin employee…"
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {sigOpen && (sigSearching || sigResults.length > 0) && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {sigSearching ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                        </div>
                      ) : sigResults.map(emp => (
                        <button key={emp.id} type="button" onMouseDown={() => selectSignatory(emp)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                          <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                          {emp.jobTitle && <span className="text-slate-400 text-xs ml-2">— {emp.jobTitle}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={e => setSignatoryName(e.target.value)}
                  placeholder="Full name"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
                />
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={e => setSignatoryTitle(e.target.value)}
                  placeholder="Designation"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
                />
              </div>
            </div>

            {/* Feedback */}
            {sendError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {sendError}
              </div>
            )}
            {sent && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                <Check className="w-4 h-4 flex-shrink-0" />
                Offer letter sent to <strong>{selectedEmp?.email}</strong>
              </div>
            )}
          </div>
        )}

        {/* ── Preview tab ── */}
        {activeTab === 'preview' && (
          <div className="p-4 bg-slate-100 min-h-[500px] overflow-y-auto">
            {!selectedEmp ? (
              <div className="text-center text-slate-400 py-20">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-sm">Select an employee on the Details tab first.</p>
              </div>
            ) : (
              <div ref={letterRef} className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
                {/* Letterhead */}
                <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-7 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-black tracking-tight">HELVINO TECHNOLOGIES LTD</div>
                      <div className="text-blue-300 text-xs mt-1">P.O Box 12345-40600, Siaya, Kenya</div>
                      <div className="text-blue-300 text-xs">helvinotechltd@gmail.com · Tel: 0110421320</div>
                      <div className="text-blue-400 text-[10px] mt-1">
                        Software Development · Network &amp; Wi-Fi · Web Design · CCTV &amp; Surveillance · Cybersecurity · IT Support
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://helvino.org/images/logo.png" alt="Helvino" crossOrigin="anonymous" className="w-16 h-16 object-contain flex-shrink-0" />
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pt-7 pb-4">
                  {/* Meta */}
                  <div className="flex justify-between gap-4 text-sm mb-5">
                    <div>
                      <p className="font-bold text-slate-900">{selectedEmp.firstName} {selectedEmp.lastName}</p>
                      <p className="text-slate-500 text-xs">{selectedEmp.email}</p>
                    </div>
                    <div className="text-right text-slate-500 text-xs flex-shrink-0">
                      <p><span className="font-semibold">Date:</span> {formatLetterDate(today)}</p>
                      <p><span className="font-semibold">Ref:</span> {refNumber}</p>
                      <p><span className="font-semibold">Position:</span> {position || '—'}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="text-center border-t border-b border-slate-300 py-3 mb-5">
                    <p className="font-black text-sm text-slate-900 uppercase tracking-wide">Letter of Employment Offer</p>
                    <p className="text-xs text-slate-400 mt-0.5">{position}</p>
                  </div>

                  <p className="text-sm text-slate-800 mb-4 font-medium">Dear {selectedEmp.firstName} {selectedEmp.lastName},</p>

                  <div className="text-slate-700 text-sm leading-7 whitespace-pre-line min-h-[80px]">
                    {letterBody || <span className="italic text-slate-300">[Letter body will appear here]</span>}
                  </div>

                  {/* Offer box */}
                  {salary && (
                    <div className="mt-5 bg-blue-50 rounded-xl border border-blue-200 p-4">
                      <p className="font-bold text-blue-900 text-xs uppercase tracking-wide mb-3">Offer Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400 text-xs block">Position</span><span className="font-semibold">{position || '—'}</span></div>
                        <div><span className="text-slate-400 text-xs block">Gross Monthly Salary</span><span className="font-bold text-blue-800">{fmt(Number(salary))}</span></div>
                        <div><span className="text-slate-400 text-xs block">Start Date</span><span className="font-semibold">{startDate ? formatLetterDate(new Date(startDate)) : 'To be communicated'}</span></div>
                        <div><span className="text-slate-400 text-xs block">Probation</span><span className="font-semibold">{probation || 3} months</span></div>
                      </div>
                    </div>
                  )}

                  <div className="my-6 border-t border-slate-200" />

                  {/* Onboarding docs */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs">
                    <p className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-3">Required Onboarding Documents</p>
                    <div className="space-y-1.5 mb-4">
                      {ONBOARDING_DOCS.map((doc, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-600">
                          <span className="font-bold text-blue-600 w-4 text-right flex-shrink-0">{i + 1}.</span>
                          <span>{doc.label}{doc.required ? <span className="text-red-600 font-bold"> *</span> : <span className="text-slate-400"> (if available)</span>}</span>
                        </div>
                      ))}
                    </div>
                    {deadlineDate && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs">
                        <strong>Submission Deadline:</strong> All documents must be received by <strong>{formatLetterDate(deadlineDate)}</strong>.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-sm text-slate-700 leading-7">
                    We look forward to welcoming you. For any questions contact <strong>helvinotechltd@gmail.com</strong> or <strong>0110421320</strong>.
                  </div>

                  {/* Signatory */}
                  <div className="mt-8 mb-4 grid grid-cols-2 gap-10">
                    <div>
                      <p className="text-xs text-slate-400 mb-5">For and on behalf of:</p>
                      <div className="border-b border-slate-400 w-40 mb-1" />
                      <p className="text-xs text-slate-500">Authorised Signatory</p>
                      <div className="mt-3 mb-1">{signatoryName ? <p className="text-sm font-semibold text-slate-800">{signatoryName}</p> : <div className="border-b border-slate-400 w-40" />}</div>
                      <p className="text-xs text-slate-500">{signatoryTitle || 'Name & Title'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-5">Accepted by:</p>
                      <div className="border-b border-slate-400 w-40 mt-6 mb-1" />
                      <p className="text-xs text-slate-500">Employee Signature</p>
                      <div className="border-b border-slate-400 w-40 mt-4 mb-1" />
                      <p className="text-xs text-slate-500">Date</p>
                    </div>
                  </div>
                </div>

                {/* T&C */}
                <div className="px-8 py-5 border-t-4 border-slate-800">
                  <p className="font-black text-xs uppercase tracking-wide text-center mb-4">Terms and Conditions of Employment</p>
                  <div className="space-y-3">
                    {TERMS.map(t => (
                      <div key={t.title}>
                        <p className="font-bold text-slate-800 text-xs mb-0.5">{t.title}</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{t.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900 px-8 py-3 text-center">
                  <p className="text-slate-400 text-[10px]">
                    Helvino Technologies Ltd · P.O Box 12345-40600, Siaya, Kenya · helvinotechltd@gmail.com · 0110421320 · helvino.org · Ref: {refNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Close
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
            >
              <Eye className="w-4 h-4" />
              {activeTab === 'form' ? 'Preview' : 'Edit'}
            </button>
            <button
              onClick={downloadPdf}
              disabled={!selectedEmp || downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingPdf ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={sendEmail}
              disabled={!canSend || sending || sent}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                sent ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
              }`}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : sent ? 'Sent!' : 'Send to Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OfferLettersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showCreate, setShowCreate] = useState(false)

  function load() {
    setLoading(true)
    fetch('/api/recruitment/offers')
      .then(r => r.json())
      .then(data => { setOffers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = offers.filter(o => {
    const name = `${o.applicant.firstName} ${o.applicant.lastName}`.toLowerCase()
    const pos = o.applicant.job?.title?.toLowerCase() || ''
    const matchSearch = !search || name.includes(search.toLowerCase()) || pos.includes(search.toLowerCase()) || o.applicant.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'PENDING').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    rejected: offers.filter(o => o.status === 'REJECTED').length,
  }

  return (
    <div className="space-y-6">
      {showCreate && <CreateOfferModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Offer Letters</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, send and manage employment offer letters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Offer Letter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Offers', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Accepted', value: stats.accepted, icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidate, position…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-500">No offer letters found</p>
            <p className="text-sm mt-1 mb-4">Click "New Offer Letter" to create one directly, or generate from an application.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Offer Letter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Position</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Salary</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Start Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Sent</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(offer => {
                  const cfg = STATUS_CONFIG[offer.status]
                  const StatusIcon = cfg.icon
                  const waMsg = buildWhatsAppMessage(offer)
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{offer.applicant.firstName} {offer.applicant.lastName}</div>
                        <div className="text-xs text-slate-400">{offer.applicant.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {offer.applicant.job?.title || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {fmt(offer.salary)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {fmtDate(offer.startDate)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(offer.sentAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/recruitment/applications/${offer.applicantId}/offer-letter`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Letter
                          </Link>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
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

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {filtered.length} offer letter{filtered.length !== 1 ? 's' : ''} shown.
        </p>
      )}
    </div>
  )
}
