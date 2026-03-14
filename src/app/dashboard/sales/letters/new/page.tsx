'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Send, Save, ShieldAlert, Sparkles, X, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

const SIGNER_TITLES = [
  'Managing Director', 'Chief Executive Officer', 'Director', 'General Manager',
  'Finance Manager', 'HR Manager', 'Sales Manager', 'Technical Director',
]

const DEFAULT_BODY = `Dear Sir/Madam,

RE: [Insert subject here]

We write to you regarding the above subject matter.

[Write your letter body here. You may include background information, your request or purpose, and any relevant details.]

We look forward to your prompt response. Should you require any clarification, please do not hesitate to contact us at helvinotechltd@gmail.com or call 0110421320.

Thank you for your time and cooperation.

Yours faithfully,`

export default function NewLetterPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const userName = `${(session?.user as any)?.firstName || ''} ${(session?.user as any)?.lastName || ''}`.trim()

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    toName: '', toOrganization: '', toAddress: '', toEmail: '',
    subject: '', body: DEFAULT_BODY,
    signedBy: userName || '', signerTitle: '',
    status: 'DRAFT',
  })
  const [saving, setSaving] = useState(false)

  // AI state
  const [showAI, setShowAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  if (role && !ADMIN_ROLES.includes(role)) {
    return (
      <div className="py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-semibold">Access restricted to administrators</p>
      </div>
    )
  }

  async function handleSave(status: string) {
    if (!form.toName || !form.subject || !form.body) {
      toast.error('Recipient name, subject and body are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/sales/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status }),
      })
      if (!res.ok) throw new Error(await res.text())
      const letter = await res.json()
      toast.success(`Letter ${status === 'FINAL' ? 'finalized' : 'saved as draft'}`)
      router.push(`/dashboard/sales/letters/${letter.id}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save letter')
    }
    setSaving(false)
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what the letter should be about')
      return
    }
    setAiGenerating(true)
    setAiPreview('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/write-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          subject: form.subject,
          toName: form.toName,
          toOrganization: form.toOrganization,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        if (res.status === 503) throw new Error('AI service not configured. Please add your ANTHROPIC_API_KEY to .env.local')
        throw new Error(text || 'Failed to generate letter')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setAiPreview(full)
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message || 'Failed to generate letter')
      }
    } finally {
      setAiGenerating(false)
    }
  }

  function handleUseGenerated() {
    if (aiPreview) {
      setForm(f => ({ ...f, body: aiPreview }))
      setShowAI(false)
      setAiPreview('')
      setAiPrompt('')
      toast.success('Letter body updated with AI content')
    }
  }

  function handleStopGeneration() {
    abortRef.current?.abort()
    setAiGenerating(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sales/letters"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">New Official Letter</h1>
            <p className="text-sm text-slate-500">Compose on Helvino Technologies letterhead</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAI(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <Sparkles className="w-4 h-4" />
            AI Write
          </button>
          <button onClick={() => handleSave('DRAFT')} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('FINAL')} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            <Send className="w-4 h-4" />
            {saving ? 'Saving...' : 'Finalize Letter'}
          </button>
        </div>
      </div>

      {/* AI Writing Assistant Panel */}
      {showAI && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-violet-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-violet-900 text-sm">AI Letter Writing Assistant</h3>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Powered by Claude</span>
            </div>
            <button onClick={() => { setShowAI(false); setAiPreview(''); handleStopGeneration() }}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-violet-800 mb-1.5">
                Describe what you want the letter to say
              </label>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Write a letter requesting a meeting to discuss a potential software development partnership. We want to introduce our services and explore collaboration opportunities..."
                className="w-full px-3 py-2.5 text-sm border border-violet-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
              <p className="text-xs text-violet-600 mt-1">
                The AI will use the subject and recipient details you&apos;ve filled in above to tailor the letter.
              </p>
            </div>

            <div className="flex gap-2">
              {aiGenerating ? (
                <button onClick={handleStopGeneration}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">
                  <X className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button onClick={handleAIGenerate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors">
                  <Sparkles className="w-4 h-4" />
                  Generate Letter
                </button>
              )}
              {aiPreview && !aiGenerating && (
                <button onClick={handleAIGenerate}
                  className="flex items-center gap-2 px-4 py-2.5 border border-violet-200 text-violet-700 bg-white hover:bg-violet-50 rounded-xl font-semibold text-sm transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              )}
            </div>

            {/* Preview */}
            {(aiGenerating || aiPreview) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-violet-800">
                    {aiGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Writing your letter...
                      </span>
                    ) : 'Generated Letter Preview'}
                  </label>
                </div>
                <div className="bg-white rounded-xl border border-violet-100 p-4 min-h-32 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {aiPreview || ' '}
                    {aiGenerating && <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 rounded-sm" />}
                  </pre>
                </div>
                {aiPreview && !aiGenerating && (
                  <button onClick={handleUseGenerated}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors">
                    Use This Letter Body
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recipient */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Recipient Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">To (Name/Title) <span className="text-red-500">*</span></label>
                  <input type="text" value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))} required
                    placeholder="e.g. The Manager, The Director"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Organization</label>
                  <input type="text" value={form.toOrganization} onChange={e => setForm(f => ({ ...f, toOrganization: e.target.value }))}
                    placeholder="Company or institution name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <input type="text" value={form.toAddress} onChange={e => setForm(f => ({ ...f, toAddress: e.target.value }))}
                    placeholder="e.g. P.O. Box 123, Nairobi"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.toEmail} onChange={e => setForm(f => ({ ...f, toEmail: e.target.value }))}
                    placeholder="recipient@email.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Letter content */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Letter Content</h3>
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 border border-violet-200 rounded-lg text-xs font-semibold transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                AI Assist
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
                  placeholder="e.g. Request for Partnership, Service Enquiry..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Letter Body <span className="text-red-500">*</span></label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required
                  rows={16}
                  className="w-full px-3 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono leading-relaxed"
                  placeholder="Write your letter here..." />
                <p className="text-xs text-slate-400 mt-1">The letter will be rendered on the official Helvino letterhead with signature and stamp area below.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-5">
          {/* Date */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Letter Date</h3>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Signature details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Signatory Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Signed By</label>
                <input type="text" value={form.signedBy} onChange={e => setForm(f => ({ ...f, signedBy: e.target.value }))}
                  placeholder="Full name of signatory"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Designation</label>
                <select value={form.signerTitle} onChange={e => setForm(f => ({ ...f, signerTitle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select or type below...</option>
                  {SIGNER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="text" value={form.signerTitle} onChange={e => setForm(f => ({ ...f, signerTitle: e.target.value }))}
                  placeholder="Or type custom designation"
                  className="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* AI tip */}
          <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
            <h4 className="text-xs font-bold text-violet-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Writing Assistant
            </h4>
            <p className="text-xs text-violet-700 leading-relaxed">
              Struggling with what to write? Click <strong>AI Write</strong> above and describe your letter&apos;s purpose. Claude will draft the full letter body for you instantly.
            </p>
          </div>

          {/* Letterhead tip */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Letterhead Preview</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              After saving, you can view the letter on the official Helvino Technologies letterhead with the company logo, signature area, and stamp circle. Download as PDF to print or share.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
