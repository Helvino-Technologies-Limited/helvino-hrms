'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Upload, CheckCircle, FileText, AlertCircle, Loader2, X, File, PenLine, Shield } from 'lucide-react'

const REQUIRED_DOCS = [
  { key: 'national_id_front', label: 'National ID / Passport (Front)', required: true },
  { key: 'national_id_back', label: 'National ID / Passport (Back)', required: true },
  { key: 'certificates', label: 'Academic & Professional Certificates', required: true },
  { key: 'passport_photo', label: 'Recent Passport-size Photograph', required: true },
  { key: 'kra_pin', label: 'KRA PIN Certificate', required: true },
  { key: 'nssf_nhif', label: 'NSSF / SHA (Social Health Authority) Card', required: false },
  { key: 'bank_details', label: 'Bank Account Details / M-Pesa Statement', required: true },
  { key: 'good_conduct', label: 'Certificate of Good Conduct', required: false },
]

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_MB = 5

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Step: 'offer' | 'documents'
  const [step, setStep] = useState<'offer' | 'documents'>('offer')

  // Offer letter signing
  const [signature, setSignature] = useState('')
  const [agreedToOffer, setAgreedToOffer] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')

  // Documents
  const [files, setFiles] = useState<Record<string, File>>({})
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([])
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch(`/api/onboarding/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setInfo(data)
        if (data.onboardingDocuments) {
          setUploadedKeys(data.onboardingDocuments.map((d: any) => d.fieldName))
        }
        // Skip offer step if no offer letter OR if already signed
        if (!data.offerLetterContent || data.offerLetterSignedAt) {
          setStep('documents')
        }
        setLoading(false)
      })
      .catch(() => { setError('Failed to load. Please try again.'); setLoading(false) })
  }, [token])

  async function handleSign() {
    if (!signature.trim()) { setSignError('Please type your full name as signature.'); return }
    if (!agreedToOffer) { setSignError('Please confirm that you have read and accept the offer.'); return }
    setSignError('')
    setSigning(true)
    try {
      const res = await fetch(`/api/onboarding/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signature.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign')
      setInfo((prev: any) => ({ ...prev, offerLetterSignedAt: new Date().toISOString(), offerLetterSignature: signature.trim() }))
      setStep('documents')
    } catch (e: any) {
      setSignError(e.message || 'Failed to submit signature. Please try again.')
    }
    setSigning(false)
  }

  function handleFileSelect(key: string, file: File | null) {
    if (!file) return
    if (!ALLOWED.includes(file.type)) { alert('Only JPEG, PNG, WebP, and PDF files are allowed.'); return }
    if (file.size > MAX_MB * 1024 * 1024) { alert(`File must be under ${MAX_MB}MB.`); return }
    setFiles(prev => ({ ...prev, [key]: file }))
  }

  function removeFile(key: string) {
    setFiles(prev => { const n = { ...prev }; delete n[key]; return n })
    if (fileRefs.current[key]) fileRefs.current[key]!.value = ''
  }

  async function handleSubmit() {
    const requiredMissing = REQUIRED_DOCS
      .filter(d => d.required && !uploadedKeys.includes(d.key) && !files[d.key])
      .map(d => d.label)
    if (requiredMissing.length > 0) {
      alert(`Please upload the following required documents:\n\n• ${requiredMissing.join('\n• ')}`)
      return
    }
    if (Object.keys(files).length === 0) { alert('Please select at least one file to upload.'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      for (const [key, file] of Object.entries(files)) formData.append(key, file)
      const res = await fetch(`/api/onboarding/${token}/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUploadedKeys(prev => [...new Set([...prev, ...Object.keys(files)])])
      setFiles({})
      setSubmitted(true)
    } catch (e: any) {
      alert(e.message || 'Upload failed. Please try again.')
    }
    setUploading(false)
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Link Unavailable</h2>
        <p className="text-slate-500 text-sm">{error}</p>
        <p className="text-slate-400 text-xs mt-4">Contact HR: helvinotechltd@gmail.com · 0110421320</p>
      </div>
    </div>
  )

  // ─── Approved ──────────────────────────────────────────────────────────────
  if (info?.onboardingApproved) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Documents Approved!</h2>
        <p className="text-slate-500 text-sm">Your onboarding documents have been reviewed and approved by Helvino Technologies. You will receive your employment details shortly.</p>
      </div>
    </div>
  )

  const hasOfferLetter = !!info?.offerLetterContent
  const offerSigned = !!info?.offerLetterSignedAt

  const allRequiredUploaded = REQUIRED_DOCS
    .filter(d => d.required)
    .every(d => uploadedKeys.includes(d.key) || !!files[d.key])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0">H</div>
          <div>
            <div className="font-black text-base">Helvino Technologies Ltd</div>
            <div className="text-blue-300 text-xs">Onboarding Portal · Siaya, Kenya</div>
          </div>
        </div>
      </div>

      {/* Steps indicator — only show if there's an offer letter */}
      {hasOfferLetter && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${step === 'offer' || offerSigned ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <PenLine className="w-4 h-4" />
              <span>1. Sign Offer Letter</span>
              {offerSigned && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className="flex-1 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${step === 'documents' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Upload className="w-4 h-4" />
              <span>2. Upload Documents</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ─── STEP 1: Offer Letter ─── */}
        {step === 'offer' && hasOfferLetter && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h1 className="text-xl font-black text-slate-900 mb-1">Employment Offer Letter</h1>
              <p className="text-slate-500 text-sm">
                Please read your employment offer letter carefully. You must sign it digitally before proceeding to upload your documents.
              </p>
            </div>

            {/* Letter content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 text-white">
                <div className="text-center">
                  <div className="font-black text-lg">HELVINO TECHNOLOGIES LTD</div>
                  <div className="text-blue-300 text-xs">P.O Box 12345-40600, Siaya, Kenya</div>
                  <div className="text-blue-300 text-xs">helvinotechltd@gmail.com · 0110421320</div>
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm font-bold uppercase tracking-wider text-blue-200">Employment Offer Letter</div>
                  <div className="text-xs text-blue-300 mt-0.5">{info.job?.title}</div>
                </div>
              </div>
              <div className="px-8 py-6">
                <p className="text-slate-700 text-sm mb-4">
                  <strong>Dear {info.firstName} {info.lastName},</strong>
                </p>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {info.offerLetterContent}
                </div>
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">For and on behalf of:</p>
                      <p className="font-bold text-slate-800 text-sm">Helvino Technologies Ltd</p>
                      <div className="mt-4 border-b border-slate-300 w-32" />
                      <p className="text-xs text-slate-400 mt-1">Authorised Signatory</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Candidate acceptance:</p>
                      {offerSigned ? (
                        <div>
                          <p className="font-bold text-green-700 text-sm">{info.offerLetterSignature}</p>
                          <div className="mt-1 border-b border-green-400 w-32" />
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Signed on {new Date(info.offerLetterSignedAt).toLocaleString('en-KE')}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mt-4 border-b border-slate-300 w-32" />
                          <p className="text-xs text-slate-400 mt-1">Candidate Signature</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature form */}
            {!offerSigned ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <PenLine className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-slate-800">Sign This Offer Letter</h2>
                </div>
                <p className="text-sm text-slate-500">Type your full legal name below to serve as your digital signature.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name (Digital Signature) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder="e.g. John Kamau Mwangi"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <p className="text-xs text-slate-400 mt-1">This typed name will serve as your legal digital signature.</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToOffer}
                    onChange={e => setAgreedToOffer(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-600">
                    I, <strong>{signature || '___________'}</strong>, confirm that I have read and understood this employment offer letter and agree to its terms and conditions as presented by Helvino Technologies Ltd.
                  </span>
                </label>

                {signError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{signError}</p>
                  </div>
                )}

                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {signing ? 'Signing...' : 'Sign & Accept Offer Letter'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 rounded-2xl p-5 border border-green-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-semibold text-sm">Offer Letter Signed</p>
                  <p className="text-green-600 text-xs mt-0.5">You signed as <strong>{info.offerLetterSignature}</strong>. Proceed to upload your documents.</p>
                  <button
                    onClick={() => setStep('documents')}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    Continue to Documents →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── STEP 2: Document Upload ─── */}
        {step === 'documents' && (
          <>
            {/* Welcome card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h1 className="text-xl font-black text-slate-900 mb-1">Welcome, {info.firstName}!</h1>
              <p className="text-slate-500 text-sm">
                Congratulations on your selection for <strong>{info.job?.title}</strong>.
                {hasOfferLetter && offerSigned
                  ? ' Your offer letter has been signed. Please upload your required onboarding documents below.'
                  : ' Please upload the required onboarding documents below to complete your registration.'
                }
              </p>
              {hasOfferLetter && offerSigned && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Offer letter signed as <strong>{info.offerLetterSignature}</strong>
                </div>
              )}
              {submitted && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Documents submitted successfully!</p>
                    <p className="text-green-600 text-xs mt-0.5">HR will review your documents and get back to you. You may upload additional documents if needed.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Documents list */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Required Documents</h2>
                <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, or PNG · Max 5MB per file</p>
              </div>
              <div className="divide-y divide-slate-100">
                {REQUIRED_DOCS.map(doc => {
                  const isUploaded = uploadedKeys.includes(doc.key)
                  const selectedFile = files[doc.key]
                  return (
                    <div key={doc.key} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isUploaded ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${doc.required ? 'border-red-400' : 'border-slate-300'}`} />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${isUploaded ? 'text-green-700' : 'text-slate-800'}`}>
                              {doc.label}
                              {doc.required && !isUploaded && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            {isUploaded && !selectedFile && (
                              <p className="text-xs text-green-600 mt-0.5">✓ Uploaded</p>
                            )}
                            {selectedFile && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <File className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs text-blue-600 truncate max-w-[200px]">{selectedFile.name}</span>
                                <span className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(0)}KB)</span>
                                <button onClick={() => removeFile(doc.key)} className="text-slate-400 hover:text-red-500">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            ref={el => { fileRefs.current[doc.key] = el }}
                            onChange={e => handleFileSelect(doc.key, e.target.files?.[0] || null)}
                            className="hidden"
                            id={`file-${doc.key}`}
                          />
                          <label htmlFor={`file-${doc.key}`}
                            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isUploaded
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                            }`}>
                            <Upload className="w-3.5 h-3.5" />
                            {isUploaded ? 'Replace' : 'Choose'}
                          </label>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Upload Progress</span>
                <span className="text-slate-500">
                  {uploadedKeys.length} of {REQUIRED_DOCS.filter(d => d.required).length} required uploaded
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(uploadedKeys.filter(k => REQUIRED_DOCS.find(d => d.key === k && d.required)).length / REQUIRED_DOCS.filter(d => d.required).length) * 100}%` }}
                />
              </div>
            </div>

            {/* Submit */}
            {Object.keys(files).length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {Object.keys(files).length} file{Object.keys(files).length > 1 ? 's' : ''} ready to upload
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {allRequiredUploaded ? 'All required documents provided' : 'Some required documents are still missing'}
                    </p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex-shrink-0">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Submit Documents'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">
          Need help? Contact HR at helvinotechltd@gmail.com or call 0110421320
        </p>
      </div>
    </div>
  )
}
