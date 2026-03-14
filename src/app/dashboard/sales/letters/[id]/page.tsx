'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Download, Printer, Edit, Trash2, CheckCircle,
  Save, X, FileText, Calendar, Building2, ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'
import Letterhead from '@/components/Letterhead'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  FINAL: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
}

const SIGNER_TITLES = [
  'Managing Director', 'Chief Executive Officer', 'Director', 'General Manager',
  'Finance Manager', 'HR Manager', 'Sales Manager', 'Technical Director',
]

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LetterDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role
  const isAdmin = ADMIN_ROLES.includes(role)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [letter, setLetter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(searchParams.get('edit') === '1')
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/sales/letters/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setLetter(data)
          setEditForm({
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
            toName: data.toName || '',
            toOrganization: data.toOrganization || '',
            toAddress: data.toAddress || '',
            toEmail: data.toEmail || '',
            subject: data.subject || '',
            body: data.body || '',
            signedBy: data.signedBy || '',
            signerTitle: data.signerTitle || '',
            status: data.status || 'DRAFT',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function downloadPdf() {
    if (!docRef.current) return
    setDownloadingPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(docRef.current, {
        scale: 2, useCORS: true, logging: false,
        allowTaint: true, backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`${letter.letterNumber}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    }
    setDownloadingPdf(false)
  }

  async function handleSave() {
    if (!editForm.toName || !editForm.subject || !editForm.body) {
      toast.error('Recipient, subject, and body are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sales/letters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setLetter(updated)
      setEditing(false)
      toast.success('Letter updated')
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function handleFinalize() {
    setSaving(true)
    try {
      const res = await fetch(`/api/sales/letters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINAL' }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setLetter(updated)
      toast.success('Letter finalized')
    } catch {
      toast.error('Failed to finalize')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this letter permanently?')) return
    try {
      const res = await fetch(`/api/sales/letters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Letter deleted')
      router.push('/dashboard/sales/letters')
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (!isAdmin) {
    return (
      <div className="py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-semibold">Access restricted to administrators</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="text-center py-20 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
        <p>Letter not found</p>
        <Link href="/dashboard/sales/letters" className="text-blue-600 hover:underline text-sm mt-2 block">
          Back to Letters
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Action bar ── */}
      <div className="print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/sales/letters"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Letters
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">{letter.letterNumber}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[letter.status] || 'bg-slate-100 text-slate-600'}`}>
                  {letter.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">{letter.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {letter.status === 'DRAFT' && (
              <button onClick={handleFinalize} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                <CheckCircle className="w-4 h-4" />
                Finalize
              </button>
            )}
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl text-sm font-semibold transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            <button onClick={downloadPdf} disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">
              <Printer className="w-4 h-4" />
              Print
            </button>
            {isSuperAdmin && (
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Edit panel */}
        {editing && editForm && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Edit Letter</h3>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm((f: any) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <input type="text" value={editForm.subject} onChange={e => setEditForm((f: any) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">To (Name)</label>
                <input type="text" value={editForm.toName} onChange={e => setEditForm((f: any) => ({ ...f, toName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organization</label>
                <input type="text" value={editForm.toOrganization} onChange={e => setEditForm((f: any) => ({ ...f, toOrganization: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={editForm.toAddress} onChange={e => setEditForm((f: any) => ({ ...f, toAddress: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" value={editForm.toEmail} onChange={e => setEditForm((f: any) => ({ ...f, toEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Signed By</label>
                <input type="text" value={editForm.signedBy} onChange={e => setEditForm((f: any) => ({ ...f, signedBy: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                <input type="text" value={editForm.signerTitle} onChange={e => setEditForm((f: any) => ({ ...f, signerTitle: e.target.value }))}
                  list="titles-list"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <datalist id="titles-list">
                  {SIGNER_TITLES.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Letter Body</label>
                <textarea value={editForm.body} onChange={e => setEditForm((f: any) => ({ ...f, body: e.target.value }))} rows={12}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="DRAFT">Draft</option>
                  <option value="FINAL">Final</option>
                  <option value="SENT">Sent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => setEditing(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                <Save className="w-4 h-4 inline mr-1.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── LETTERHEAD DOCUMENT ── */}
      <div ref={docRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:rounded-none print:border-0 overflow-hidden">
        <Letterhead signerName={letter.signedBy || ''} signerTitle={letter.signerTitle || ''}>
          {/* Letter Date & Address block */}
          <div style={{ paddingTop: '20px', paddingBottom: '8px' }}>
            {/* Date */}
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569', marginBottom: '20px' }}>
              {formatDate(letter.date)}
            </div>

            {/* To: block */}
            <div style={{ marginBottom: '20px', fontSize: '12px', lineHeight: '1.7', color: '#1e293b' }}>
              <div style={{ fontWeight: '700' }}>{letter.toName}</div>
              {letter.toOrganization && <div>{letter.toOrganization}</div>}
              {letter.toAddress && <div>{letter.toAddress}</div>}
              {letter.toEmail && <div>{letter.toEmail}</div>}
            </div>

            {/* RE: Subject */}
            <div style={{ marginBottom: '20px', fontSize: '12px' }}>
              <span style={{ fontWeight: '900', textDecoration: 'underline', textTransform: 'uppercase', color: '#1e293b' }}>
                RE: {letter.subject}
              </span>
            </div>

            {/* Body */}
            <div style={{
              fontSize: '12px',
              lineHeight: '1.85',
              color: '#334155',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Arial, Helvetica, sans-serif',
              paddingBottom: '20px',
            }}>
              {letter.body}
            </div>
          </div>
        </Letterhead>
      </div>
    </div>
  )
}
