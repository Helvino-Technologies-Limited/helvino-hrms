'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Printer, Sparkles, Loader2, X, RefreshCw, Save, CheckCircle,
} from 'lucide-react'

// ─── Document checklist (matches onboarding portal) ──────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function formatLetterDate(date: Date) {
  return date.toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferLetterPdfPage() {
  const { id } = useParams<{ id: string }>()

  const [applicant, setApplicant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [letterBody, setLetterBody] = useState('')
  const [deadline, setDeadline] = useState(getDefaultDeadline())
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch(`/api/recruitment/applications/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setApplicant(data)
        if (data.offerLetterContent) setLetterBody(data.offerLetterContent)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load applicant data.'); setLoading(false) })
  }, [id])

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

  const today = new Date()
  const deadlineDate = deadline ? new Date(deadline + 'T00:00:00') : null
  const refNumber = `HL/HR/OL/${today.getFullYear()}/${(applicant.id as string).slice(-6).toUpperCase()}`
  const onboardingLink = applicant.onboardingToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding/${applicant.onboardingToken}`
    : null

  return (
    <>
      {/* ── Print styles ────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .letter-wrap { padding: 0 !important; background: white !important; min-height: auto !important; }
          .letter-card { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
        }
        @page { margin: 1.5cm; size: A4 portrait; }
      `}</style>

      {/* ── Toolbar (hidden on print) ──────────────────────────────────────── */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 max-w-5xl mx-auto">
          {/* Back */}
          <Link
            href="/dashboard/recruitment/applications"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Applications
          </Link>
          <span className="text-slate-300 text-xs hidden sm:block">·</span>
          <span className="text-sm font-bold text-slate-800 hidden sm:block">
            Offer Letter — {applicant.firstName} {applicant.lastName}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Deadline picker */}
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
                {letterBody ? 'Regenerate AI' : 'Generate with AI'}
              </button>
            )}

            {letterBody && !generating && (
              <button
                onClick={generateBody}
                title="Regenerate"
                className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Save */}
            {letterBody && (
              <button
                onClick={saveBody}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
              </button>
            )}

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Letter body editor (hidden on print) ──────────────────────────── */}
      <div className="no-print bg-amber-50 border-b border-amber-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <label className="block text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
            Letter Body
            <span className="normal-case font-normal ml-2 text-amber-600">— edit below, then click "Print / Save as PDF"</span>
          </label>
          <div className="relative">
            <textarea
              value={letterBody}
              onChange={e => { setLetterBody(e.target.value); setSaved(false) }}
              rows={12}
              placeholder={
                generating
                  ? ''
                  : 'Click "Generate with AI" above to auto-draft the offer letter body, or type it manually here…'
              }
              className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed font-sans bg-white"
            />
            {generating && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Writing…
              </div>
            )}
          </div>
          {!letterBody && !generating && (
            <p className="text-xs text-amber-600 mt-2 italic">
              💡 Generate the letter with AI or type it manually. Click "Save" to attach it to this applicant's record.
            </p>
          )}
          {!onboardingLink && (
            <p className="text-xs text-slate-500 mt-2 bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
              ⚠ No onboarding portal link yet — send the "Request Onboarding Docs" email first to generate a secure link for this candidate.
            </p>
          )}
        </div>
      </div>

      {/* ── Printable Letter ──────────────────────────────────────────────── */}
      <div className="letter-wrap bg-slate-100 min-h-screen py-8 px-4">
        <div className="letter-card max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">

          {/* Letterhead */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-10 py-8 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-black tracking-tight">HELVINO TECHNOLOGIES LTD</div>
                <div className="text-blue-300 text-sm mt-1">P.O Box 12345-40600, Siaya, Kenya</div>
                <div className="text-blue-300 text-sm">helvinotechltd@gmail.com · Tel: 0110421320</div>
                <div className="text-blue-400 text-xs mt-1">IT Infrastructure · Software Development · Cybersecurity · CCTV</div>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0">
                H
              </div>
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
                Employment Offer Letter
              </p>
              <p className="text-sm text-slate-500 mt-0.5">{applicant.job?.title}</p>
            </div>

            {/* Salutation */}
            <p className="text-sm text-slate-800 mb-4 font-medium">
              Dear {applicant.firstName} {applicant.lastName},
            </p>

            {/* Body */}
            <div className="text-slate-700 text-sm leading-7 whitespace-pre-line min-h-[180px]">
              {letterBody || (
                <span className="no-print italic text-slate-400">
                  [Letter body will appear here — click "Generate with AI" in the toolbar above]
                </span>
              )}
            </div>

            {/* Separator */}
            <div className="my-8 border-t border-slate-200" />

            {/* Document Requirements */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <p className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-1">
                Required Onboarding Documents
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Please submit the following documents through the secure portal link below. Items marked
                <strong className="text-slate-700"> *required</strong> must be submitted before your start date.
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
                    ⚠ Portal link will appear here once the onboarding email has been sent.
                  </p>
                </div>
              )}
            </div>

            {/* Closing paragraph */}
            <div className="mt-7">
              <p className="text-sm text-slate-700 leading-7">
                We look forward to welcoming you to the Helvino Technologies family. Should you have any questions
                or require assistance, please do not hesitate to contact our HR department at{' '}
                <strong>helvinotechltd@gmail.com</strong> or call <strong>0110421320</strong>.
              </p>
            </div>

            {/* Signature block */}
            <div className="mt-10 mb-6 grid grid-cols-2 gap-12">
              <div>
                <p className="text-xs text-slate-400 mb-6">For and on behalf of:</p>
                <div className="border-b border-slate-400 w-44 mb-1" />
                <p className="text-xs text-slate-500">Authorised Signatory</p>
                <div className="border-b border-slate-400 w-44 mt-4 mb-1" />
                <p className="text-xs text-slate-500">Name &amp; Title</p>
                <div className="border-b border-slate-400 w-44 mt-4 mb-1" />
                <p className="text-xs text-slate-500">Date</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-6">Accepted by candidate:</p>
                {applicant.offerLetterSignature ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{applicant.offerLetterSignature}</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Signed digitally on{' '}
                      {new Date(applicant.offerLetterSignedAt).toLocaleString('en-KE')}
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

          {/* Footer */}
          <div className="bg-slate-900 px-10 py-4 text-center">
            <p className="text-slate-400 text-xs">
              Helvino Technologies Ltd · P.O Box 12345-40600, Siaya, Kenya ·
              helvinotechltd@gmail.com · 0110421320 ·
              Ref: {refNumber}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
