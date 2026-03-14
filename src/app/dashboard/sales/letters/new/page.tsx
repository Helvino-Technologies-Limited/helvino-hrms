'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Send, Save, ShieldAlert } from 'lucide-react'
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
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Letter Content</h3>
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

          {/* Tip */}
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
