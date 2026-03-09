'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Edit, Trash2, Globe, Wifi, Camera, Server,
  Cloud, Monitor, X, RefreshCw, Briefcase, ChevronRight,
  Quote, Calendar, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const SERVICE_TYPES = [
  'Software Systems',
  'Websites',
  'CCTV Installations',
  'Network Infrastructure',
  'SaaS Solutions',
] as const

type ServiceType = typeof SERVICE_TYPES[number]

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Software Systems': <Monitor className="w-8 h-8" />,
  'Websites': <Globe className="w-8 h-8" />,
  'CCTV Installations': <Camera className="w-8 h-8" />,
  'Network Infrastructure': <Wifi className="w-8 h-8" />,
  'SaaS Solutions': <Cloud className="w-8 h-8" />,
}

const SERVICE_GRADIENTS: Record<string, string> = {
  'Software Systems': 'from-violet-500 to-purple-700',
  'Websites': 'from-blue-500 to-cyan-600',
  'CCTV Installations': 'from-slate-600 to-slate-800',
  'Network Infrastructure': 'from-emerald-500 to-teal-700',
  'SaaS Solutions': 'from-orange-500 to-rose-600',
}

const SERVICE_TAG_COLORS: Record<string, string> = {
  'Software Systems': 'bg-violet-100 text-violet-700',
  'Websites': 'bg-blue-100 text-blue-700',
  'CCTV Installations': 'bg-slate-100 text-slate-700',
  'Network Infrastructure': 'bg-emerald-100 text-emerald-700',
  'SaaS Solutions': 'bg-orange-100 text-orange-700',
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'SALES_MANAGER']

const EMPTY_FORM = {
  clientName: '',
  industry: '',
  serviceType: 'Software Systems',
  description: '',
  projectImages: '',
  completedAt: '',
  testimonial: '',
  caseStudy: '',
  published: false,
}

function formatDateNice(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function PlaceholderCard({ serviceType }: { serviceType: string }) {
  const gradient = SERVICE_GRADIENTS[serviceType] ?? 'from-slate-500 to-slate-700'
  const icon = SERVICE_ICONS[serviceType] ?? <Briefcase className="w-8 h-8" />
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white/70`}>
      {icon}
    </div>
  )
}

export default function PortfolioPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('')
  const [filterPublished, setFilterPublished] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [detailProject, setDetailProject] = useState<any>(null)

  const role = (session?.user as any)?.role
  const isAdmin = ADMIN_ROLES.includes(role)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/portfolio')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : (data.projects ?? []))
    } catch (e) {
      console.error(e)
      toast.error('Failed to load portfolio')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      (p.clientName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchService = !filterService || p.serviceType === filterService
    const matchPublished =
      !filterPublished ||
      (filterPublished === 'published' && p.published) ||
      (filterPublished === 'draft' && !p.published)
    return matchSearch && matchService && matchPublished
  })

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(p: any) {
    setEditing(p)
    setForm({
      clientName: p.clientName ?? '',
      industry: p.industry ?? '',
      serviceType: p.serviceType ?? 'Software Systems',
      description: p.description ?? '',
      projectImages: Array.isArray(p.projectImages) ? p.projectImages.join('\n') : (p.projectImages ?? ''),
      completedAt: p.completedAt ? p.completedAt.slice(0, 10) : '',
      testimonial: p.testimonial ?? '',
      caseStudy: p.caseStudy ?? '',
      published: p.published ?? false,
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName || !form.serviceType) {
      toast.error('Client name and service type are required')
      return
    }
    setSaving(true)
    try {
      const images = form.projectImages
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
      const payload = { ...form, projectImages: images }
      const res = editing
        ? await fetch(`/api/sales/portfolio/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/sales/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Project updated' : 'Project added to portfolio')
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this project from the portfolio?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Project removed')
      loadData()
    } catch {
      toast.error('Failed to delete')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Portfolio</h1>
          <p className="text-slate-500 text-sm mt-0.5">Showcase our work</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm">
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by client or description..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterService} onChange={e => setFilterService(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-44">
            <option value="">All Service Types</option>
            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPublished} onChange={e => setFilterPublished(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Briefcase className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold text-lg">No projects yet</p>
          <p className="text-slate-400 text-sm mt-1">
            {search || filterService || filterPublished
              ? 'No projects match your filters'
              : 'Add your first portfolio project to showcase your work'}
          </p>
          {isAdmin && !search && !filterService && !filterPublished && (
            <button onClick={openAdd}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md">
              Add First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => {
            const images = Array.isArray(project.projectImages) ? project.projectImages : []
            const firstImage = images[0]
            return (
              <div key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                onClick={() => setDetailProject(project)}>
                {/* Image / Placeholder */}
                <div className="relative h-48 overflow-hidden">
                  {firstImage ? (
                    <img src={firstImage} alt={project.clientName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full">
                      <PlaceholderCard serviceType={project.serviceType} />
                    </div>
                  )}
                  {/* Published badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow ${project.published ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      {project.published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{project.clientName}</h3>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(project)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {project.industry && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {project.industry}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SERVICE_TAG_COLORS[project.serviceType] ?? 'bg-slate-100 text-slate-600'}`}>
                      {project.serviceType}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-3">{project.description}</p>
                  )}

                  {project.completedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Completed {formatDateNice(project.completedAt)}</span>
                    </div>
                  )}

                  {project.testimonial && (
                    <div className="bg-slate-50 rounded-xl p-3 border-l-2 border-blue-300">
                      <p className="text-slate-600 text-xs italic line-clamp-2">"{project.testimonial}"</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3 text-blue-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDetailProject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Images */}
            {(() => {
              const imgs = Array.isArray(detailProject.projectImages) ? detailProject.projectImages : []
              return imgs.length > 0 ? (
                <div className={`grid gap-1 ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {imgs.slice(0, 4).map((img: string, i: number) => (
                    <div key={i} className={`${imgs.length === 1 ? 'h-64' : 'h-40'} overflow-hidden ${i === 0 && imgs.length === 3 ? 'col-span-2' : ''}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48">
                  <PlaceholderCard serviceType={detailProject.serviceType} />
                </div>
              )
            })()}

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${detailProject.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {detailProject.published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${SERVICE_TAG_COLORS[detailProject.serviceType] ?? 'bg-slate-100 text-slate-600'}`}>
                      {detailProject.serviceType}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{detailProject.clientName}</h2>
                  {detailProject.industry && (
                    <p className="text-slate-500 text-sm mt-0.5">{detailProject.industry}</p>
                  )}
                </div>
                <button onClick={() => setDetailProject(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detailProject.completedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Completed {formatDateNice(detailProject.completedAt)}</span>
                </div>
              )}

              {detailProject.description && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">About this Project</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{detailProject.description}</p>
                </div>
              )}

              {detailProject.caseStudy && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Case Study
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed whitespace-pre-line">{detailProject.caseStudy}</p>
                </div>
              )}

              {detailProject.testimonial && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
                  <Quote className="w-6 h-6 text-slate-200 absolute top-3 right-3" />
                  <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Client Testimonial</h3>
                  <p className="text-slate-600 text-sm italic leading-relaxed">"{detailProject.testimonial}"</p>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => { setDetailProject(null); openEdit(detailProject) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => { setDetailProject(null); handleDelete(detailProject.id) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Project' : 'Add Portfolio Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required
                  placeholder="Client or company name"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Industry</label>
                  <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    placeholder="e.g. Healthcare, Retail..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Service Type <span className="text-red-500">*</span></label>
                  <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Describe the project, scope, and outcomes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Images</label>
                <textarea value={form.projectImages} onChange={e => setForm(f => ({ ...f, projectImages: e.target.value }))} rows={3}
                  placeholder="One image URL per line&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs" />
                <p className="text-xs text-slate-400 mt-1">Enter one image URL per line</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Completed At</label>
                <input type="date" value={form.completedAt} onChange={e => setForm(f => ({ ...f, completedAt: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Testimonial</label>
                <textarea value={form.testimonial} onChange={e => setForm(f => ({ ...f, testimonial: e.target.value }))} rows={2}
                  placeholder="Client testimonial or quote..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Case Study</label>
                <textarea value={form.caseStudy} onChange={e => setForm(f => ({ ...f, caseStudy: e.target.value }))} rows={3}
                  placeholder="Detailed case study, challenges overcome, results achieved..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="font-semibold">Publish (visible to all)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Add to Portfolio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
