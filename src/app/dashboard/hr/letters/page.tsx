'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Download, Eye, Send, RefreshCw,
  CheckCircle2, Clock, AlertCircle, XCircle, Loader2,
  FileX, User, Building2, Mail, Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeSnippet = {
  id: string
  firstName: string
  lastName: string
  employeeCode: string
  jobTitle: string | null
  department: { name: string } | null
}

type Contract = {
  token: string
  sentAt: string | null
  signedAt: string | null
  signedByName: string | null
  createdAt: string
  updatedAt: string
  contractHtml: string | null
  employee: EmployeeSnippet
}

type Termination = {
  id: string
  reason: string
  reasonDetails: string | null
  lastWorkingDay: string
  noticeDays: number
  payInLieu: boolean
  issuedBy: string
  issuedByTitle: string
  letterHtml: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  employee: EmployeeSnippet
}

const TERMINATION_REASON_LABELS: Record<string, string> = {
  REDUNDANCY: 'Redundancy',
  GROSS_MISCONDUCT: 'Gross Misconduct',
  PERFORMANCE: 'Poor Performance',
  RESIGNATION: 'Resignation Accepted',
  CONTRACT_EXPIRY: 'Contract Expiry',
  PROBATION_FAILURE: 'Probation Failure',
  MUTUAL_AGREEMENT: 'Mutual Agreement',
  OTHER: 'Other',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ html, title, onClose, onDownload, downloading }: {
  html: string
  title: string
  onClose: () => void
  onDownload: () => void
  downloading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-base">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <iframe
            srcDoc={html}
            className="w-full rounded-xl border border-slate-200"
            style={{ height: '70vh' }}
            title={title}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HrLettersPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [terminations, setTerminations] = useState<Termination[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'contracts' | 'terminations'>('all')
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function fetchLetters(q = search, t = typeFilter) {
    setLoading(true)
    try {
      const res = await fetch(`/api/hr/letters?search=${encodeURIComponent(q)}&type=${t}`)
      const data = await res.json()
      setContracts(data.contracts || [])
      setTerminations(data.terminations || [])
    } catch {
      showToast('Failed to load letters', false)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLetters() }, [])

  function handleSearch(val: string) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchLetters(val, typeFilter), 350)
  }

  function handleTypeFilter(t: typeof typeFilter) {
    setTypeFilter(t)
    fetchLetters(search, t)
  }

  async function downloadPdf(html: string, name: string, id: string) {
    setDownloadingId(id)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;background:#fff;'
      container.innerHTML = html
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 300))

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const totalImgH = (canvas.height * pageW) / canvas.width

      // Smart page-break
      const mmPerPx = pageW / container.offsetWidth
      const elTop = 0
      const noBreakEls = container.querySelectorAll('p, li, table, .section')
      const bounds: { top: number; bottom: number }[] = []
      noBreakEls.forEach(child => {
        const r = (child as HTMLElement).getBoundingClientRect()
        bounds.push({ top: r.top * mmPerPx, bottom: r.bottom * mmPerPx })
      })

      const cutPoints: number[] = [0]
      while (true) {
        const lastCut = cutPoints[cutPoints.length - 1]
        if (lastCut + pageH >= totalImgH) break
        const idealCut = lastCut + pageH
        const split = bounds.filter(b => b.top < idealCut && b.bottom > idealCut)
        let cut = idealCut
        if (split.length > 0) {
          const safeTop = Math.min(...split.map(b => b.top))
          if (safeTop > lastCut + 5) cut = safeTop
        }
        cutPoints.push(cut)
      }

      cutPoints.forEach((yOffset, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, totalImgH)
      })

      pdf.save(`${name}.pdf`)
    } catch (e: any) {
      showToast('PDF generation failed', false)
    }
    setDownloadingId(null)
    setPreviewHtml(null)
  }

  async function resendContract(employeeId: string, name: string) {
    setSendingId(employeeId + '-contract')
    try {
      const res = await fetch(`/api/employees/${employeeId}/contract`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Contract resent to ${name}`)
      fetchLetters()
    } catch (e: any) {
      showToast(e.message || 'Failed to resend', false)
    }
    setSendingId(null)
  }

  async function resendTermination(employeeId: string, name: string) {
    setSendingId(employeeId + '-term')
    try {
      const res = await fetch(`/api/employees/${employeeId}/termination`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Termination letter resent to ${name}`)
      fetchLetters()
    } catch (e: any) {
      showToast(e.message || 'Failed to resend', false)
    }
    setSendingId(null)
  }

  const showContracts = typeFilter !== 'terminations'
  const showTerminations = typeFilter !== 'contracts'
  const totalCount = (showContracts ? contracts.length : 0) + (showTerminations ? terminations.length : 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl transition-all ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <PreviewModal
          html={previewHtml}
          title={previewTitle}
          onClose={() => setPreviewHtml(null)}
          onDownload={() => downloadPdf(previewHtml, previewTitle.replace(/\s+/g, '_'), 'preview')}
          downloading={downloadingId === 'preview'}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900">HR Letters</h1>
              <p className="text-sm text-slate-500 mt-0.5">Employment contracts and termination letters</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>{totalCount} {totalCount === 1 ? 'letter' : 'letters'}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search employee…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(['all', 'contracts', 'terminations'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeFilter(t)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors capitalize ${
                    typeFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'contracts' ? 'Contracts' : 'Terminations'}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchLetters()}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* ── Employment Contracts ─── */}
            {showContracts && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Employment Contracts</h2>
                  <span className="text-xs text-slate-400 font-normal">({contracts.length})</span>
                </div>

                {contracts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
                    <FileX className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No employment contracts found</p>
                    <p className="text-sm mt-1">Generate contracts from each employee&apos;s profile page.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {contracts.map(c => {
                      const emp = c.employee
                      const fullName = `${emp.firstName} ${emp.lastName}`
                      const status = c.signedAt ? 'signed' : c.sentAt ? 'sent' : 'generated'
                      return (
                        <div key={c.token} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-4">
                          {/* Employee info */}
                          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/employees/${emp.id}?tab=contract`}
                                className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm"
                              >
                                {fullName}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>{emp.employeeCode}</span>
                                {emp.jobTitle && <><span>·</span><span>{emp.jobTitle}</span></>}
                                {emp.department && <><span>·</span><span>{emp.department.name}</span></>}
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {status === 'signed' ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                              </span>
                            ) : status === 'sent' ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                                <Clock className="w-3.5 h-3.5" /> Awaiting Signature
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                <FileText className="w-3.5 h-3.5" /> Generated
                              </span>
                            )}
                          </div>

                          {/* Dates */}
                          <div className="text-xs text-slate-500 min-w-[160px]">
                            {c.sentAt && <div>Sent: <span className="font-medium text-slate-700">{fmtDate(c.sentAt)}</span></div>}
                            {c.signedAt && <div>Signed: <span className="font-medium text-green-700">{fmtDate(c.signedAt)}</span></div>}
                            {!c.sentAt && <div>Created: <span className="font-medium text-slate-700">{fmtDate(c.createdAt)}</span></div>}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-auto">
                            {c.contractHtml && (
                              <>
                                <button
                                  onClick={() => { setPreviewHtml(c.contractHtml!); setPreviewTitle(`Contract — ${fullName}`) }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                                <button
                                  onClick={() => downloadPdf(c.contractHtml!, `Contract_${fullName}_${emp.employeeCode}`, emp.id + '-contract')}
                                  disabled={downloadingId === emp.id + '-contract'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-60"
                                >
                                  {downloadingId === emp.id + '-contract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                  PDF
                                </button>
                              </>
                            )}
                            {status !== 'signed' && (
                              <button
                                onClick={() => resendContract(emp.id, fullName)}
                                disabled={sendingId === emp.id + '-contract'}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-60"
                              >
                                {sendingId === emp.id + '-contract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Resend
                              </button>
                            )}
                            <Link
                              href={`/dashboard/employees/${emp.id}?tab=contract`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                              Manage
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ── Termination Letters ─── */}
            {showTerminations && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Termination Letters</h2>
                  <span className="text-xs text-slate-400 font-normal">({terminations.length})</span>
                </div>

                {terminations.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
                    <FileX className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No termination letters found</p>
                    <p className="text-sm mt-1">Issue termination letters from an employee&apos;s profile page.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {terminations.map(t => {
                      const emp = t.employee
                      const fullName = `${emp.firstName} ${emp.lastName}`
                      return (
                        <div key={t.id} className="bg-white rounded-2xl border border-red-100 px-5 py-4 flex flex-wrap items-center gap-4">
                          {/* Employee info */}
                          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/employees/${emp.id}?tab=contract`}
                                className="font-semibold text-slate-800 hover:text-red-600 transition-colors text-sm"
                              >
                                {fullName}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>{emp.employeeCode}</span>
                                {emp.jobTitle && <><span>·</span><span>{emp.jobTitle}</span></>}
                                {emp.department && <><span>·</span><span>{emp.department.name}</span></>}
                              </div>
                            </div>
                          </div>

                          {/* Reason + last day */}
                          <div className="text-xs min-w-[180px]">
                            <div>
                              <span className="inline-flex px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-semibold border border-red-200">
                                {TERMINATION_REASON_LABELS[t.reason] || t.reason}
                              </span>
                            </div>
                            <div className="mt-1 text-slate-500">
                              Last day: <span className="font-semibold text-slate-800">{fmtDate(t.lastWorkingDay)}</span>
                            </div>
                          </div>

                          {/* Sent status */}
                          <div className="flex items-center gap-2">
                            {t.sentAt ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                                <Mail className="w-3.5 h-3.5" /> Sent {fmtDate(t.sentAt)}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                <FileText className="w-3.5 h-3.5" /> Not Sent
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-auto">
                            {t.letterHtml && (
                              <>
                                <button
                                  onClick={() => { setPreviewHtml(t.letterHtml!); setPreviewTitle(`Termination — ${fullName}`) }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                                <button
                                  onClick={() => downloadPdf(t.letterHtml!, `Termination_${fullName}_${emp.employeeCode}`, emp.id + '-term')}
                                  disabled={downloadingId === emp.id + '-term'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-60"
                                >
                                  {downloadingId === emp.id + '-term' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                  PDF
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => resendTermination(emp.id, fullName)}
                              disabled={sendingId === emp.id + '-term'}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
                            >
                              {sendingId === emp.id + '-term' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              Resend
                            </button>
                            <Link
                              href={`/dashboard/employees/${emp.id}?tab=contract`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                              Manage
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {totalCount === 0 && !loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
                <FileX className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-semibold text-base">No letters found</p>
                <p className="text-sm mt-1">Letters are generated from individual employee profile pages.</p>
                <Link
                  href="/dashboard/employees"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Go to Employees
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
