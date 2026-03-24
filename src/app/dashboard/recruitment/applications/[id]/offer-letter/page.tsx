'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Printer, Sparkles, Loader2, X, RefreshCw, Save, CheckCircle,
  MessageCircle, DollarSign, Calendar, Clock, Edit2, Check, AlertCircle, Download,
  UserSearch,
} from 'lucide-react'

// ─── Onboarding document checklist ──────────────────────────────────────────

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

// ─── Terms & Conditions (based on Helvino services) ─────────────────────────

const TERMS: { title: string; body: string }[] = [
  {
    title: '1. Position and Duties',
    body: 'The Employee shall perform all duties reasonably required for the stated position and any additional responsibilities assigned by management. As Helvino Technologies Ltd provides Software Development, Network & Wi-Fi Installation, Web Design, CCTV & Surveillance, Cybersecurity, and IT Support & Consultancy services, the Employee may be required to support any of these service lines as directed.',
  },
  {
    title: '2. Commencement and Probation Period',
    body: 'The Employee\'s employment shall commence on the agreed start date. A probationary period of three (3) months shall apply from the commencement date, unless otherwise stated in this letter. During this period, either party may terminate employment with two (2) weeks\' written notice. Satisfactory completion of probation shall be confirmed in writing by HR.',
  },
  {
    title: '3. Compensation and Payment',
    body: 'The Employee shall be paid the gross monthly salary stated in this offer, subject to statutory deductions (PAYE, NSSF, SHA/SHIF). Payment shall be made on or before the last working day of each month via bank transfer or M-Pesa as per submitted bank details. Salaries are reviewed annually at management\'s discretion based on performance and company growth.',
  },
  {
    title: '4. Working Hours',
    body: 'Standard working hours are Monday to Friday, 8:00 AM to 5:00 PM (with a one-hour lunch break), totalling forty (40) hours per week. The Employee may be required to work outside these hours including weekends during project delivery or emergency IT support situations. Overtime compensation shall be as per the Kenya Employment Act, 2007.',
  },
  {
    title: '5. Leave Entitlement',
    body: 'The Employee is entitled to twenty-one (21) days of paid annual leave per year upon completion of twelve (12) months of continuous service, as provided under the Kenya Employment Act, 2007. Sick leave, maternity/paternity leave, and compassionate leave shall be granted in accordance with Kenyan law and company policy. Leave must be applied for and approved by the immediate supervisor and HR.',
  },
  {
    title: '6. Confidentiality and Non-Disclosure',
    body: 'The Employee agrees to maintain strict confidentiality of all information relating to Helvino Technologies Ltd\'s clients, projects, software systems, network configurations, security infrastructure, business strategies, pricing, and proprietary processes. This obligation survives the termination of employment. Breach of confidentiality may result in disciplinary action and/or legal proceedings.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All software, applications, websites, systems, designs, documentation, scripts, network configurations, security frameworks, and other work products created by the Employee in the course of employment shall be the sole and exclusive property of Helvino Technologies Ltd. The Employee assigns all intellectual property rights in such work to the Company without additional compensation.',
  },
  {
    title: '8. Code of Conduct and Professional Ethics',
    body: 'The Employee shall conduct themselves with the highest degree of professionalism, integrity, and respect at all times. This includes ethical handling of client data and systems (particularly in cybersecurity and CCTV/surveillance engagements), responsible use of company equipment, adherence to data protection laws, and compliance with the Company\'s HR policies and procedures manual.',
  },
  {
    title: '9. Company Equipment and Data Policy',
    body: 'Any equipment, tools, software licences, or access credentials issued to the Employee remain the property of Helvino Technologies Ltd and must be returned immediately upon separation. The Employee shall not install unauthorised software, access restricted systems, or copy company or client data to personal devices. Violations may constitute grounds for immediate dismissal.',
  },
  {
    title: '10. Social Security and Statutory Obligations',
    body: 'The Company shall deduct and remit on behalf of the Employee all statutory contributions including NSSF (National Social Security Fund) and SHA/SHIF (Social Health Authority/Social Health Insurance Fund) as required under Kenyan law. Both employee and employer contributions shall be made as prescribed. The Employee must provide valid NSSF and SHA membership numbers upon commencement.',
  },
  {
    title: '11. Termination of Employment',
    body: 'After successful completion of probation, either party may terminate employment by providing one (1) calendar month\'s written notice, or payment in lieu thereof. The Company reserves the right to terminate employment without notice in cases of gross misconduct, fraud, dishonesty, willful insubordination, breach of confidentiality, or any act that damages the Company\'s reputation or operations. All terminations shall comply with the Kenya Employment Act, 2007.',
  },
  {
    title: '12. Dispute Resolution',
    body: 'Any dispute arising from this employment relationship shall first be resolved through internal HR mediation. If unresolved, the matter shall be referred to the Employment and Labour Relations Court of Kenya as provided under the Employment Act, 2007 and the Labour Relations Act, 2007. This contract is governed by the laws of the Republic of Kenya.',
  },
  {
    title: '13. Conditional Offer',
    body: 'This offer is conditional upon the successful verification of academic certificates, professional qualifications, reference checks, and submission of all required onboarding documents. Provision of false information or failure to submit required documents by the stated deadline shall render this offer null and void.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDefaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function formatLetterDate(date: Date) {
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtSalary(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferLetterPage() {
  const { id } = useParams<{ id: string }>()

  const [applicant, setApplicant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [letterBody, setLetterBody] = useState('')
  const [deadline, setDeadline] = useState(getDefaultDeadline())
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const letterRef = useRef<HTMLDivElement>(null)

  // Signatory employee search
  const [signatoryName, setSignatoryName] = useState('')
  const [signatoryTitle, setSignatoryTitle] = useState('')
  const [signatoryQuery, setSignatoryQuery] = useState('')
  const [signatoryResults, setSignatoryResults] = useState<any[]>([])
  const [signatorySearching, setSignatorySearching] = useState(false)
  const [signatoryOpen, setSignatoryOpen] = useState(false)
  const signatoryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Offer details form
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerSalary, setOfferSalary] = useState('')
  const [offerStartDate, setOfferStartDate] = useState('')
  const [offerProbation, setOfferProbation] = useState('3')
  const [offerNotes, setOfferNotes] = useState('')
  const [savingOffer, setSavingOffer] = useState(false)
  const [offerSaved, setOfferSaved] = useState(false)

  function searchSignatory(q: string) {
    setSignatoryQuery(q)
    setSignatoryOpen(true)
    if (signatoryDebounce.current) clearTimeout(signatoryDebounce.current)
    if (!q.trim()) { setSignatoryResults([]); return }
    signatoryDebounce.current = setTimeout(async () => {
      setSignatorySearching(true)
      try {
        const res = await fetch(`/api/employees?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSignatoryResults(Array.isArray(data) ? data.slice(0, 8) : [])
      } catch { setSignatoryResults([]) }
      setSignatorySearching(false)
    }, 300)
  }

  function selectSignatory(emp: any) {
    setSignatoryName(`${emp.firstName} ${emp.lastName}`)
    setSignatoryTitle(emp.jobTitle || '')
    setSignatoryQuery(`${emp.firstName} ${emp.lastName}`)
    setSignatoryResults([])
    setSignatoryOpen(false)
  }

  function loadApplicant() {
    setLoading(true)
    fetch(`/api/recruitment/applications/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setApplicant(data)
        if (data.offerLetterContent) setLetterBody(data.offerLetterContent)
        if (data.offer) {
          setOfferSalary(String(data.offer.salary || ''))
          setOfferStartDate(data.offer.startDate ? data.offer.startDate.split('T')[0] : '')
          setOfferProbation(String(data.offer.probationPeriod || 3))
          setOfferNotes(data.offer.notes || '')
        }
        setLoading(false)
      })
      .catch(() => { setError('Failed to load applicant data.'); setLoading(false) })
  }

  useEffect(() => { loadApplicant() }, [id])

  async function generateBody() {
    if (!applicant) return
    setGenerating(true)
    setLetterBody('')
    setSaved(false)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          type: 'OFFER_LETTER',
          candidateName: `${applicant.firstName} ${applicant.lastName}`,
          jobTitle: applicant.job?.title || 'the position',
          context: applicant.offer
            ? `Gross monthly salary: ${fmtSalary(applicant.offer.salary)}. Start date: ${applicant.offer.startDate ? formatLetterDate(new Date(applicant.offer.startDate)) : 'to be communicated'}. Probation period: ${applicant.offer.probationPeriod || 3} months.`
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
      if (e.name !== 'AbortError') {
        setLetterBody('[Error: ' + (e.message || 'Failed to generate offer letter') + ']')
      }
    }
    setGenerating(false)
  }

  async function saveBody() {
    if (!applicant || !letterBody.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/recruitment/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerLetterContent: letterBody }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  async function saveOffer() {
    if (!offerSalary) return
    setSavingOffer(true)
    try {
      const hasOffer = !!applicant?.offer
      const method = hasOffer ? 'PATCH' : 'POST'
      const url = hasOffer ? `/api/recruitment/offers/${applicant.offer.id}` : '/api/recruitment/offers'
      const body: any = {
        salary: Number(offerSalary),
        startDate: offerStartDate || null,
        probationPeriod: Number(offerProbation) || 3,
        notes: offerNotes || null,
      }
      if (!hasOffer) body.applicantId = id
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setOfferSaved(true)
      setTimeout(() => setOfferSaved(false), 3000)
      setShowOfferForm(false)
      loadApplicant()
    } catch {}
    setSavingOffer(false)
  }

  async function downloadPdf() {
    if (!letterRef.current || !applicant) return
    setDownloadingPdf(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const el = letterRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const totalImgH = (canvas.height * pageW) / canvas.width

      // Smart page-break: avoid cutting through paragraphs and list items
      const mmPerPx = pageW / el.offsetWidth
      const elTop = el.getBoundingClientRect().top
      const noBreakEls = el.querySelectorAll('p, li, .space-y-5 > div, .space-y-2 > div, .bg-blue-50, .bg-slate-50, .grid')
      const bounds: { top: number; bottom: number }[] = []
      noBreakEls.forEach(child => {
        const r = child.getBoundingClientRect()
        bounds.push({
          top: (r.top - elTop) * mmPerPx,
          bottom: (r.bottom - elTop) * mmPerPx,
        })
      })

      // Build page cut points
      const cutPoints: number[] = [0]
      while (true) {
        const lastCut = cutPoints[cutPoints.length - 1]
        if (lastCut + pageH >= totalImgH) break
        const idealCut = lastCut + pageH
        const split = bounds.filter(b => b.top < idealCut && b.bottom > idealCut)
        let cut = idealCut
        if (split.length > 0) {
          const safeTop = Math.min(...split.map(b => b.top))
          // Only move cut back if it's meaningful (> 5mm gap)
          if (safeTop > lastCut + 5) cut = safeTop
        }
        cutPoints.push(cut)
      }

      cutPoints.forEach((yOffset, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, totalImgH)
      })

      const fname = `Offer_Letter_${applicant.firstName}_${applicant.lastName}_${today.getFullYear()}.pdf`
      pdf.save(fname)
    } catch (e: any) {
      alert('PDF generation failed: ' + (e.message || 'Unknown error'))
    }
    setDownloadingPdf(false)
  }

  function buildWhatsAppMessage() {
    if (!applicant) return ''
    const name = `${applicant.firstName} ${applicant.lastName}`
    const position = applicant.job?.title || 'the position'
    const salary = applicant.offer ? fmtSalary(applicant.offer.salary) : 'As discussed'
    const startDate = applicant.offer?.startDate
      ? formatLetterDate(new Date(applicant.offer.startDate))
      : 'To be communicated'
    const probation = applicant.offer?.probationPeriod || 3
    const portalLink = applicant.onboardingToken
      ? `${window.location.origin}/onboarding/${applicant.onboardingToken}`
      : null
    const deadlineDate = deadline
      ? formatLetterDate(new Date(deadline + 'T00:00:00'))
      : null

    let msg = `*Job Offer — Helvino Technologies Ltd*\n\n`
    msg += `Dear ${name},\n\n`
    msg += `We are pleased to formally extend you an employment offer for the position of *${position}* at Helvino Technologies Ltd.\n\n`
    msg += `*Offer Summary:*\n`
    msg += `• Position: ${position}\n`
    msg += `• Gross Salary: ${salary}/month\n`
    msg += `• Start Date: ${startDate}\n`
    msg += `• Probation Period: ${probation} months\n`
    if (deadlineDate) msg += `• Response Deadline: ${deadlineDate}\n`
    msg += `\n`
    if (portalLink) {
      msg += `*Onboarding Documents Portal:*\n${portalLink}\n\n`
    }
    msg += `Please review your formal offer letter and submit all required documents by the deadline.\n\n`
    msg += `Contact us: helvinotechltd@gmail.com | 0110421320\n\n`
    msg += `_Helvino Technologies Ltd — IT Infrastructure · Software Development · Cybersecurity · CCTV · Network Solutions_`
    return msg
  }

  const today = new Date()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="text-center">
        <p className="text-red-600 font-semibold mb-3">{error}</p>
        <Link href="/dashboard/recruitment/applications" className="text-blue-600 underline text-sm">
          ← Back to Applications
        </Link>
      </div>
    </div>
  )
  const deadlineDate = deadline ? new Date(deadline + 'T00:00:00') : null
  const refNumber = `HL/HR/OL/${today.getFullYear()}/${(applicant.id as string).slice(-6).toUpperCase()}`
  const onboardingLink = applicant.onboardingToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding/${applicant.onboardingToken}`
    : null
  const waMsg = buildWhatsAppMessage()
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`

  return (
    <>
      {/* ── Print styles ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .letter-wrap { padding: 0 !important; background: white !important; min-height: auto !important; }
          .letter-card { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
          .tc-section { page-break-before: always; }
          p, li { break-inside: avoid; page-break-inside: avoid; }
          .space-y-5 > div, .space-y-2 > div { break-inside: avoid; page-break-inside: avoid; }
          .bg-blue-50, .bg-slate-50, .grid { break-inside: avoid; page-break-inside: avoid; }
        }
        @page { margin: 1.5cm; size: A4 portrait; }
      `}</style>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 max-w-5xl mx-auto">
          <Link
            href="/dashboard/recruitment/offer-letters"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Offer Letters
          </Link>
          <span className="text-slate-300 text-xs hidden sm:block">·</span>
          <span className="text-sm font-bold text-slate-800 hidden sm:block">
            {applicant.firstName} {applicant.lastName} — {applicant.job?.title || 'N/A'}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Deadline */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">Deadline:</span>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="text-sm text-slate-700 bg-transparent focus:outline-none"
              />
            </div>

            {/* AI Generate */}
            {generating ? (
              <button
                onClick={() => { abortRef.current?.abort(); setGenerating(false) }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <X className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button
                onClick={generateBody}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {letterBody ? 'Regenerate' : 'Generate with AI'}
              </button>
            )}

            {letterBody && !generating && (
              <button onClick={generateBody} title="Regenerate"
                className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Save body */}
            {letterBody && (
              <button
                onClick={saveBody}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  saved ? 'bg-green-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
              </button>
            )}

            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            {/* Download PDF */}
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingPdf ? 'Generating…' : 'Download PDF'}
            </button>

            {/* Print fallback */}
            <button
              onClick={() => window.print()}
              title="Print"
              className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Offer Details Panel (no-print) ────────────────────────────────── */}
      <div className="no-print bg-blue-50 border-b border-blue-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {applicant.offer ? (
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-blue-800">{fmtSalary(applicant.offer.salary)}</span>
                <span className="text-slate-400 text-xs">/ month</span>
              </div>
              {applicant.offer.startDate && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Start: <strong>{formatLetterDate(new Date(applicant.offer.startDate))}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Probation: <strong>{applicant.offer.probationPeriod || 3} months</strong></span>
              </div>
              <button
                onClick={() => setShowOfferForm(f => !f)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold ml-auto"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Offer Details
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-700 font-medium">No offer record yet — add salary and start date to complete the offer letter.</span>
              <button
                onClick={() => setShowOfferForm(true)}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Create Offer
              </button>
            </div>
          )}

          {/* Offer form */}
          {showOfferForm && (
            <div className="mt-4 bg-white border border-blue-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Gross Salary (KES) *</label>
                <input
                  type="number"
                  value={offerSalary}
                  onChange={e => setOfferSalary(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={offerStartDate}
                  onChange={e => setOfferStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Probation (months)</label>
                <input
                  type="number"
                  min={1} max={12}
                  value={offerProbation}
                  onChange={e => setOfferProbation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                <input
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <button
                  onClick={saveOffer}
                  disabled={savingOffer || !offerSalary}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    offerSaved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50`}
                >
                  {savingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : offerSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {savingOffer ? 'Saving…' : offerSaved ? 'Saved!' : 'Save Offer'}
                </button>
                <button onClick={() => setShowOfferForm(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Letter Body Editor (no-print) ─────────────────────────────────── */}
      <div className="no-print bg-amber-50 border-b border-amber-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <label className="block text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
            Opening Letter Body
            <span className="normal-case font-normal ml-2 text-amber-600">— edit or generate with AI, then Print / Save as PDF</span>
          </label>
          <div className="relative">
            <textarea
              value={letterBody}
              onChange={e => { setLetterBody(e.target.value); setSaved(false) }}
              rows={10}
              placeholder={generating ? '' : 'Click "Generate with AI" to draft the opening body, or type manually…'}
              className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed font-sans bg-white"
            />
            {generating && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Writing…
              </div>
            )}
          </div>
          <p className="text-xs text-amber-600 mt-2 italic">
            The Terms &amp; Conditions section is automatically included in the printed letter below.
          </p>
          {!onboardingLink && (
            <p className="text-xs text-slate-500 mt-2 bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
              No onboarding portal link yet — send "Request Onboarding Docs" email first to generate a secure link.
            </p>
          )}
        </div>
      </div>

      {/* ── Signatory Picker (no-print) ───────────────────────────────────── */}
      <div className="no-print bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <UserSearch className="w-3.5 h-3.5" />
            Authorised Signatory
            <span className="normal-case font-normal ml-1 text-slate-400">— search employee to auto-fill name &amp; designation</span>
          </label>
          <div className="flex flex-wrap gap-3 items-start">
            {/* Employee search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={signatoryQuery}
                onChange={e => searchSignatory(e.target.value)}
                onFocus={() => signatoryQuery && setSignatoryOpen(true)}
                onBlur={() => setTimeout(() => setSignatoryOpen(false), 150)}
                placeholder="Search employee name…"
                autoComplete="off"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              {signatoryOpen && (signatorySearching || signatoryResults.length > 0) && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {signatorySearching ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                    </div>
                  ) : signatoryResults.map(emp => (
                    <button key={emp.id} type="button" onMouseDown={() => selectSignatory(emp)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0">
                      <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                      {emp.jobTitle && <span className="text-slate-400 text-xs ml-2">— {emp.jobTitle}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Manual override fields */}
            <input
              type="text"
              value={signatoryName}
              onChange={e => setSignatoryName(e.target.value)}
              placeholder="Full name"
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-44"
            />
            <input
              type="text"
              value={signatoryTitle}
              onChange={e => setSignatoryTitle(e.target.value)}
              placeholder="Designation / Title"
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-48"
            />
          </div>
        </div>
      </div>

      {/* ── Printable Letter ──────────────────────────────────────────────── */}
      <div className="letter-wrap bg-slate-100 min-h-screen py-8 px-4">
        <div ref={letterRef} className="letter-card max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">

          {/* Letterhead */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-10 py-8 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-black tracking-tight">HELVINO TECHNOLOGIES LTD</div>
                <div className="text-blue-300 text-sm mt-1">P.O Box 12345-40600, Siaya, Kenya</div>
                <div className="text-blue-300 text-sm">helvinotechltd@gmail.com · Tel: 0110421320</div>
                <div className="text-blue-400 text-xs mt-1">
                  Software Development · Network & Wi-Fi · Web Design · CCTV & Surveillance · Cybersecurity · IT Support
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://helvino.org/images/logo.png"
                alt="Helvino Technologies Ltd"
                crossOrigin="anonymous"
                className="w-20 h-20 object-contain flex-shrink-0"
              />
            </div>
          </div>

          {/* Letter content */}
          <div className="px-10 pt-8 pb-4">

            {/* Meta */}
            <div className="flex items-start justify-between gap-4 text-sm">
              <div className="text-slate-700">
                <p className="font-bold text-slate-900">{applicant.firstName} {applicant.lastName}</p>
                <p>{applicant.email}</p>
                {applicant.phone && <p>{applicant.phone}</p>}
              </div>
              <div className="text-right text-slate-600 flex-shrink-0">
                <p><span className="font-semibold">Date:</span> {formatLetterDate(today)}</p>
                <p><span className="font-semibold">Ref:</span> {refNumber}</p>
                <p><span className="font-semibold">Position:</span> {applicant.job?.title || '—'}</p>
              </div>
            </div>

            {/* Subject */}
            <div className="mt-6 mb-5 text-center border-b border-t border-slate-300 py-3">
              <p className="font-black text-base text-slate-900 uppercase tracking-wide">
                Letter of Employment Offer
              </p>
              <p className="text-sm text-slate-500 mt-0.5">{applicant.job?.title}</p>
            </div>

            {/* Salutation */}
            <p className="text-sm text-slate-800 mb-4 font-medium">
              Dear {applicant.firstName} {applicant.lastName},
            </p>

            {/* Body */}
            <div className="text-slate-700 text-sm leading-7 whitespace-pre-line min-h-[160px]">
              {letterBody || (
                <span className="no-print italic text-slate-400">
                  [Opening letter body will appear here — click "Generate with AI" in the toolbar above]
                </span>
              )}
            </div>

            {/* Offer Summary Box */}
            {applicant.offer && (
              <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-5">
                <p className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3">Offer Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Position</span>
                    <span className="font-semibold text-slate-800">{applicant.job?.title || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Gross Monthly Salary</span>
                    <span className="font-bold text-blue-800 text-base">{fmtSalary(applicant.offer.salary)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Start Date</span>
                    <span className="font-semibold text-slate-800">
                      {applicant.offer.startDate ? formatLetterDate(new Date(applicant.offer.startDate)) : 'To be communicated'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Probation Period</span>
                    <span className="font-semibold text-slate-800">{applicant.offer.probationPeriod || 3} months</span>
                  </div>
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="my-8 border-t border-slate-200" />

            {/* Onboarding Documents */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <p className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-1">
                Required Onboarding Documents
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Please submit the following documents through the secure portal link provided.
                Items marked <strong className="text-slate-700">*required</strong> must be received before your start date.
              </p>

              <div className="space-y-2 mb-5">
                {ONBOARDING_DOCS.map((doc, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="font-bold text-blue-600 w-5 text-right flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <span>
                      {doc.label}
                      {doc.required
                        ? <span className="text-red-600 font-bold"> *</span>
                        : <span className="text-slate-400 text-xs ml-1">(if available)</span>
                      }
                    </span>
                  </div>
                ))}
              </div>

              {deadlineDate && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  <span className="text-red-700 text-sm">
                    <strong>Submission Deadline:</strong> All documents must be received by{' '}
                    <strong>{formatLetterDate(deadlineDate)}</strong>.
                  </span>
                </div>
              )}

              {onboardingLink ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">
                    Secure Document Submission Portal
                  </p>
                  <p className="text-sm font-mono text-blue-700 break-all">{onboardingLink}</p>
                  <p className="text-xs text-blue-500 mt-1.5">
                    This link is personal and confidential. Please do not share it with others.
                  </p>
                </div>
              ) : (
                <div className="no-print bg-slate-100 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 italic">
                    Portal link will appear here once the onboarding email has been sent.
                  </p>
                </div>
              )}
            </div>

            {/* Closing */}
            <div className="mt-7">
              <p className="text-sm text-slate-700 leading-7">
                We look forward to welcoming you to the Helvino Technologies family. Should you have any questions,
                please contact our HR department at <strong>helvinotechltd@gmail.com</strong> or call <strong>0110421320</strong>.
              </p>
            </div>

            {/* Signatory */}
            <div className="mt-10 mb-6 grid grid-cols-2 gap-12">
              <div>
                <p className="text-xs text-slate-400 mb-6">For and on behalf of:</p>
                <div className="border-b border-slate-400 w-44 mb-1" />
                <p className="text-xs text-slate-500">Authorised Signatory</p>
                <div className="mt-4 mb-1">
                  {signatoryName
                    ? <p className="text-sm font-semibold text-slate-800">{signatoryName}</p>
                    : <div className="border-b border-slate-400 w-44" />
                  }
                </div>
                <p className="text-xs text-slate-500">{signatoryTitle || 'Name & Title'}</p>
                <div className="border-b border-slate-400 w-44 mt-4 mb-1" />
                <p className="text-xs text-slate-500">Date</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-6">Accepted by candidate:</p>
                {applicant.offerLetterSignature ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{applicant.offerLetterSignature}</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Signed digitally on {new Date(applicant.offerLetterSignedAt).toLocaleString('en-KE')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="border-b border-slate-400 w-44 mt-8 mb-1" />
                    <p className="text-xs text-slate-500">Candidate Signature</p>
                    <div className="border-b border-slate-400 w-44 mt-4 mb-1" />
                    <p className="text-xs text-slate-500">Date</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Terms & Conditions Section ──────────────────────────────────── */}
          <div className="tc-section px-10 pt-6 pb-6 border-t-4 border-slate-800">
            <div className="text-center mb-6">
              <p className="font-black text-base text-slate-900 uppercase tracking-wide">
                Terms and Conditions of Employment
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Helvino Technologies Ltd · {today.getFullYear()} · Ref: {refNumber}
              </p>
            </div>

            <div className="space-y-5">
              {TERMS.map(t => (
                <div key={t.title}>
                  <p className="font-bold text-slate-800 text-sm mb-1">{t.title}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Acknowledgement of Terms
              </p>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                By signing below, the candidate confirms that they have read, understood, and accepted all the terms
                and conditions set out in this letter of offer, and agree to be bound by the Company&apos;s HR policies,
                code of conduct, and all applicable Kenyan employment laws.
              </p>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <div className="border-b border-slate-400 w-44 mb-1" />
                  <p className="text-xs text-slate-500">Candidate Signature</p>
                  <div className="border-b border-slate-400 w-44 mt-5 mb-1" />
                  <p className="text-xs text-slate-500">Full Name (Print)</p>
                  <div className="border-b border-slate-400 w-44 mt-5 mb-1" />
                  <p className="text-xs text-slate-500">Date</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-44 mb-1" />
                  <p className="text-xs text-slate-500">
                    {signatoryName ? `${signatoryName} — ` : ''}{signatoryTitle || 'HR Manager'} Signature
                  </p>
                  <div className="border-b border-slate-400 w-44 mt-5 mb-1" />
                  <p className="text-xs text-slate-500">Name &amp; Title</p>
                  <div className="border-b border-slate-400 w-44 mt-5 mb-1" />
                  <p className="text-xs text-slate-500">Company Stamp &amp; Date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900 px-10 py-4 text-center">
            <p className="text-slate-400 text-xs">
              Helvino Technologies Ltd · P.O Box 12345-40600, Siaya, Kenya ·
              helvinotechltd@gmail.com · 0110421320 · helvino.org ·
              Ref: {refNumber}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
