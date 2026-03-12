'use client'
import { useEffect, useState } from 'react'
import { Files, Plus, Download, AlertCircle, Loader2, X, FileText, Upload } from 'lucide-react'

const CATEGORIES = ['Contract', 'Requirements', 'Design', 'Manual', 'Report', 'Other']

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', fileUrl: '', fileType: '', fileSize: '', category: '' })

  useEffect(() => {
    fetch('/api/client/documents')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDocs(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/client/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, fileSize: form.fileSize ? parseInt(form.fileSize) : undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to upload document')
    } else {
      setDocs(prev => [data, ...prev])
      setShowForm(false)
      setForm({ name: '', description: '', fileUrl: '', fileType: '', fileSize: '', category: '' })
    }
    setSubmitting(false)
  }

  const companyDocs = docs.filter(d => d.uploadedBy === 'company')
  const clientDocs = docs.filter(d => d.uploadedBy === 'client')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm mt-0.5">Share and access files with our team</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" /> Share Document
        </button>
      </div>

      {/* Upload Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Share Document</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                Provide the URL of your document (Google Drive, Dropbox, or any shareable link).
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Document Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  placeholder="e.g. System Requirements.pdf" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Document URL *</label>
                <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  placeholder="https://drive.google.com/..." required type="url" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">File Type</label>
                  <input value={form.fileType} onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    placeholder="e.g. PDF, DOCX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  placeholder="Brief description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Files className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No documents yet</h3>
          <p className="text-slate-400 text-sm mt-1">Share project files and documents with our team.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {companyDocs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">From Helvino Team</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {companyDocs.map(doc => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700">{doc.name}</p>
                      {doc.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.description}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {doc.category && <span>{doc.category}</span>}
                        {doc.fileType && <span>{doc.fileType}</span>}
                        {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {clientDocs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Uploaded by You</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {clientDocs.map(doc => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700">{doc.name}</p>
                      {doc.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.description}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {doc.category && <span>{doc.category}</span>}
                        {doc.fileType && <span>{doc.fileType}</span>}
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
