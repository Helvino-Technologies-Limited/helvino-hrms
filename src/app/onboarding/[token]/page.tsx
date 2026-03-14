'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Upload, CheckCircle, FileText, AlertCircle, Loader2, X, File } from 'lucide-react'

const REQUIRED_DOCS = [
  { key: 'national_id_front', label: 'National ID / Passport (Front)', required: true },
  { key: 'national_id_back', label: 'National ID / Passport (Back)', required: true },
  { key: 'certificates', label: 'Academic & Professional Certificates', required: true },
  { key: 'passport_photo', label: 'Recent Passport-size Photograph', required: true },
  { key: 'kra_pin', label: 'KRA PIN Certificate', required: true },
  { key: 'nssf_nhif', label: 'NSSF / NHIF Card', required: false },
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
        // Mark already uploaded docs
        if (data.onboardingDocuments) {
          setUploadedKeys(data.onboardingDocuments.map((d: any) => d.fieldName))
        }
        setLoading(false)
      })
      .catch(() => { setError('Failed to load. Please try again.'); setLoading(false) })
  }, [token])

  function handleFileSelect(key: string, file: File | null) {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      alert(`Only JPEG, PNG, WebP, and PDF files are allowed.`)
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File must be under ${MAX_MB}MB.`)
      return
    }
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
    if (Object.keys(files).length === 0) {
      alert('Please select at least one file to upload.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      for (const [key, file] of Object.entries(files)) {
        formData.append(key, file)
      }
      const res = await fetch(`/api/onboarding/${token}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const newKeys = Object.keys(files)
      setUploadedKeys(prev => [...new Set([...prev, ...newKeys])])
      setFiles({})
      setSubmitted(true)
    } catch (e: any) {
      alert(e.message || 'Upload failed. Please try again.')
    }
    setUploading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

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

  if (info?.onboardingApproved) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Documents Approved!</h2>
        <p className="text-slate-500 text-sm">Your onboarding documents have been reviewed and approved by Helvino Technologies. You will receive your employment details shortly.</p>
      </div>
    </div>
  )

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
            <div className="text-blue-300 text-xs">Onboarding Document Portal · Siaya, Kenya</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h1 className="text-xl font-black text-slate-900 mb-1">Welcome, {info.firstName}!</h1>
          <p className="text-slate-500 text-sm">
            Congratulations on your selection for <strong>{info.job?.title}</strong>. Please upload the required onboarding documents below to complete your registration.
          </p>

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
              style={{ width: `${(uploadedKeys.length / REQUIRED_DOCS.filter(d => d.required).length) * 100}%` }}
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

        <p className="text-center text-xs text-slate-400 pb-4">
          Need help? Contact HR at helvinotechltd@gmail.com or call 0110421320
        </p>
      </div>
    </div>
  )
}
