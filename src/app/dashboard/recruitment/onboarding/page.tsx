'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Clock, FileText, Eye, X, Download, Loader2, ShieldCheck, AlertCircle, Users, PenLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const DOC_LABELS: Record<string, string> = {
  national_id_front: 'National ID / Passport (Front)',
  national_id_back: 'National ID / Passport (Back)',
  certificates: 'Academic & Professional Certificates',
  passport_photo: 'Passport Photo',
  kra_pin: 'KRA PIN Certificate',
  nssf_nhif: 'NSSF / NHIF Card',
  bank_details: 'Bank Details / M-Pesa Statement',
  good_conduct: 'Certificate of Good Conduct',
}

export default function OnboardingReviewPage() {
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [approving, setApproving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/recruitment/applications?status=SHORTLISTED,INTERVIEW_SCHEDULED,INTERVIEWED,OFFERED,HIRED')
      const data = await res.json()
      // Only show those who have submitted documents or have a token
      const relevant = data.filter((a: any) => a.onboardingToken || a.onboardingDocuments?.length > 0)
      setApplicants(relevant)
    } catch {
      toast.error('Failed to load')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(applicantId: string) {
    setApproving(true)
    try {
      const res = await fetch('/api/recruitment/applications/approve-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Onboarding approved! Welcome email sent.')
      setSelected(null)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve')
    }
    setApproving(false)
  }

  function downloadDoc(doc: any) {
    const a = document.createElement('a')
    a.href = doc.dataUri
    a.download = doc.fileName
    a.click()
  }

  const pending = applicants.filter(a => {
    const docs = a.onboardingDocuments || []
    return docs.length > 0 && !a.onboardingApproved
  })
  const approved = applicants.filter(a => a.onboardingApproved)
  const waiting = applicants.filter(a => {
    const docs = a.onboardingDocuments || []
    return docs.length === 0 && a.onboardingToken
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Onboarding Documents</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review and approve candidate onboarding submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-2xl font-black text-amber-600">{pending.length}</div>
          <div className="text-xs font-semibold text-amber-700 mt-1">Pending Review</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="text-2xl font-black text-slate-500">{waiting.length}</div>
          <div className="text-xs font-semibold text-slate-600 mt-1">Awaiting Upload</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="text-2xl font-black text-green-600">{approved.length}</div>
          <div className="text-xs font-semibold text-green-700 mt-1">Approved</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No onboarding submissions yet</p>
          <p className="text-slate-400 text-sm mt-1">Send onboarding document requests to shortlisted candidates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending review */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Review ({pending.length})
              </h3>
              {pending.map(app => <ApplicantCard key={app.id} app={app} onView={() => setSelected(app)} />)}
            </div>
          )}

          {/* Waiting for upload */}
          {waiting.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Awaiting Candidate Upload ({waiting.length})
              </h3>
              {waiting.map(app => <ApplicantCard key={app.id} app={app} onView={() => setSelected(app)} />)}
            </div>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approved ({approved.length})
              </h3>
              {approved.map(app => <ApplicantCard key={app.id} app={app} onView={() => setSelected(app)} />)}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.firstName} {selected.lastName}</h2>
                <p className="text-sm text-slate-500">{selected.job?.title} · {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {selected.onboardingApproved && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Onboarding Approved</p>
                    {selected.onboardingApprovedAt && (
                      <p className="text-green-600 text-xs mt-0.5">Approved on {formatDate(selected.onboardingApprovedAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Offer Letter status */}
              {selected.offerLetterContent && (
                <div className={`rounded-xl p-4 border flex items-start gap-3 ${
                  selected.offerLetterSignedAt
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <PenLine className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected.offerLetterSignedAt ? 'text-green-600' : 'text-amber-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${selected.offerLetterSignedAt ? 'text-green-800' : 'text-amber-800'}`}>
                      Employment Offer Letter — {selected.offerLetterSignedAt ? 'Signed' : 'Awaiting Signature'}
                    </p>
                    {selected.offerLetterSignedAt ? (
                      <p className="text-xs mt-0.5 text-green-600">
                        Signed as <strong>{selected.offerLetterSignature}</strong> on {new Date(selected.offerLetterSignedAt).toLocaleString('en-KE')}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5 text-amber-600">The candidate has not yet signed the offer letter.</p>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">View offer letter content</summary>
                      <div className="mt-2 bg-white rounded-lg border border-slate-200 p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                        {selected.offerLetterContent}
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {(!selected.onboardingDocuments || selected.onboardingDocuments.length === 0) ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No documents uploaded yet</p>
                  <p className="text-slate-400 text-xs mt-1">The candidate hasn&apos;t submitted documents via their upload link</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {selected.onboardingDocuments.length} document{selected.onboardingDocuments.length !== 1 ? 's' : ''} submitted
                  </p>
                  {selected.onboardingDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.mimeType === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <FileText className={`w-4 h-4 ${doc.mimeType === 'application/pdf' ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {DOC_LABELS[doc.fieldName] || doc.fieldName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{doc.fileName} · {(doc.sizeBytes / 1024).toFixed(0)}KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!selected.onboardingApproved && selected.onboardingDocuments?.length > 0 && (
              <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                <button onClick={() => setSelected(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">
                  Close
                </button>
                <button onClick={() => handleApprove(selected.id)} disabled={approving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Approve Onboarding
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{previewDoc.fileName}</p>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 ml-3">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 p-4">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe src={previewDoc.dataUri} className="w-full h-[70vh] rounded" title={previewDoc.fileName} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDoc.dataUri} alt={previewDoc.fileName} className="max-w-full max-h-[70vh] object-contain rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicantCard({ app, onView }: { app: any; onView: () => void }) {
  const docs = app.onboardingDocuments || []
  const isApproved = app.onboardingApproved
  const hasDocs = docs.length > 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
          isApproved ? 'bg-green-600' : hasDocs ? 'bg-amber-500' : 'bg-slate-400'
        }`}>
          {app.firstName?.[0]}{app.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{app.firstName} {app.lastName}</p>
          <p className="text-xs text-slate-400 truncate">{app.job?.title} · {app.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {isApproved ? (
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Approved</span>
        ) : hasDocs ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>
        ) : (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Awaiting</span>
        )}
        <button onClick={onView}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
