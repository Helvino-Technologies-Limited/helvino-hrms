'use client'
import { useEffect, useState, useRef } from 'react'
import { CheckCircle, FileText, AlertCircle, Loader2 } from 'lucide-react'

export default function ContractSignPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contractHtml, setContractHtml] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [alreadySigned, setAlreadySigned] = useState<string | null>(null)
  const [signedByName, setSignedByName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [signedAt, setSignedAt] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeUrl, setIframeUrl] = useState('')

  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return
    fetch(`/api/contract/sign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setContractHtml(data.contractHtml)
        setEmployee(data.employee)
        if (data.signedAt) setAlreadySigned(data.signedAt)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load contract. Please try again.'); setLoading(false) })
  }, [token])

  useEffect(() => {
    if (!contractHtml) return
    const blob = new Blob([contractHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setIframeUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [contractHtml])

  async function handleSign() {
    if (!signedByName.trim()) return
    setSigning(true)
    try {
      const res = await fetch(`/api/contract/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedByName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSigning(false); return }
      setSignedAt(new Date(data.signedAt).toLocaleString('en-KE', {
        dateStyle: 'long', timeStyle: 'short',
      }))
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }} className="px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Helvino Technologies Limited</h1>
            <p className="text-blue-200 text-xs">Employment Contract Portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500">Loading your contract...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Not Found</h2>
            <p className="text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && success && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contract Signed!</h2>
            <p className="text-slate-500 mb-4">
              Your employment contract has been signed digitally and recorded.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 inline-block text-left text-sm">
              <p><span className="font-semibold text-slate-700">Signed by:</span> {signedByName}</p>
              <p><span className="font-semibold text-slate-700">Date & Time:</span> {signedAt} (EAT)</p>
            </div>
            <p className="text-slate-400 text-xs mt-6">
              HR has been notified. Welcome to Helvino Technologies Limited!
            </p>
          </div>
        )}

        {!loading && !error && !success && alreadySigned && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10 text-center">
            <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Already Signed</h2>
            <p className="text-slate-500">
              This contract was signed on{' '}
              <strong>{new Date(alreadySigned).toLocaleString('en-KE', { dateStyle: 'long', timeStyle: 'short' })}</strong>.
            </p>
            <p className="text-slate-400 text-xs mt-4">Each contract can only be signed once.</p>
          </div>
        )}

        {!loading && !error && !success && !alreadySigned && contractHtml && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Employment Contract</h2>
                  {employee && (
                    <p className="text-slate-500 text-sm">
                      {employee.firstName} {employee.lastName} — {employee.jobTitle}
                    </p>
                  )}
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                  Awaiting Signature
                </span>
              </div>
              {iframeUrl && (
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  className="w-full border-0"
                  style={{ height: '560px' }}
                  title="Employment Contract"
                />
              )}
            </div>

            {/* Signing form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <h3 className="font-bold text-slate-900 text-lg">Digital Signature</h3>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  I have read, understood, and agree to all the terms and conditions set out in this
                  Employment Agreement with Helvino Technologies Limited. I acknowledge this digital
                  signature is legally binding under the Kenya Information and Communications Act.
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Full Name <span className="text-slate-400 font-normal">(as your digital signature)</span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={signedByName}
                  onChange={e => setSignedByName(e.target.value)}
                  placeholder={employee ? `${employee.firstName} ${employee.lastName}` : 'Enter your full name'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={!agreed || !signedByName.trim() || signing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {signing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Signing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />Sign Contract</>
                )}
              </button>
              <p className="text-center text-xs text-slate-400">
                By signing, you confirm that the name above represents your digital signature.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
