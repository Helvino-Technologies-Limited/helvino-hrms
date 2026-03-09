'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Edit, Trash2, Package, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Web Design',
  'Software Development',
  'CCTV Installation',
  'Network & WiFi',
  'Cybersecurity',
  'IT Consultancy',
  'IT Support',
  'Hosting & Maintenance',
  'Other',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Web Design': 'bg-blue-100 text-blue-700',
  'Software Development': 'bg-purple-100 text-purple-700',
  'CCTV Installation': 'bg-red-100 text-red-700',
  'Network & WiFi': 'bg-green-100 text-green-700',
  'Cybersecurity': 'bg-orange-100 text-orange-700',
  'IT Consultancy': 'bg-indigo-100 text-indigo-700',
  'IT Support': 'bg-teal-100 text-teal-700',
  'Hosting & Maintenance': 'bg-cyan-100 text-cyan-700',
  'Other': 'bg-slate-100 text-slate-600',
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`
}

export default function ServicesPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || ''
  const canManage = ['SUPER_ADMIN', 'SALES_MANAGER'].includes(role)

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/services')
      const data = await res.json()
      setServices(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load services') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this service from the catalog?')) return
    try {
      const res = await fetch(`/api/sales/services/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Service deleted')
      load()
    } catch (e: any) { toast.error(e.message || 'Failed to delete') }
  }

  const categories = ['All', ...CATEGORIES]
  const filtered = services.filter(s => categoryFilter === 'All' || s.category === categoryFilter)
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Service Catalog</h1>
          <p className="text-slate-500 text-sm mt-0.5">{services.filter(s => s.isActive).length} active services · {services.length} total</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setEditingService(null); setShowModal(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services grouped by category */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading services...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-200 mb-3" />
          <p className="text-lg font-semibold">No services found</p>
          <p className="text-sm mt-1">Add services to your catalog to use them in quotations</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600'}`}>{cat}</span>
                <span className="text-xs text-slate-400">{items.length} service{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(svc => {
                  const packages = svc.packages ? (typeof svc.packages === 'string' ? JSON.parse(svc.packages) : svc.packages) : []
                  const isExpanded = expandedId === svc.id
                  return (
                    <div key={svc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${svc.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm leading-tight">{svc.name}</h3>
                              {!svc.isActive && (
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>
                              )}
                            </div>
                            {svc.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => { setEditingService(svc); setShowModal(true) }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(svc.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {svc.basePrice != null && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Base price</span>
                            <span className="font-bold text-slate-900 text-sm">{fmt(svc.basePrice)}</span>
                          </div>
                        )}

                        {packages.length > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : svc.id)}
                            className="mt-3 w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-700 font-semibold py-1"
                          >
                            <span>{packages.length} package{packages.length !== 1 ? 's' : ''}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {isExpanded && packages.length > 0 && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {packages.map((pkg: any, i: number) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{pkg.name}</p>
                                {pkg.description && <p className="text-xs text-slate-400 mt-0.5">{pkg.description}</p>}
                              </div>
                              <span className="text-xs font-bold text-green-700 whitespace-nowrap">{fmt(pkg.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ServiceModal
          service={editingService}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); toast.success(editingService ? 'Service updated!' : 'Service added!') }}
        />
      )}
    </div>
  )
}

function ServiceModal({ service, onClose, onSave }: { service: any; onClose: () => void; onSave: () => void }) {
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<{ name: string; price: number; description: string }[]>(
    service?.packages
      ? (typeof service.packages === 'string' ? JSON.parse(service.packages) : service.packages)
      : []
  )
  const [form, setForm] = useState({
    name: service?.name || '',
    category: service?.category || CATEGORIES[0],
    description: service?.description || '',
    basePrice: service?.basePrice ?? '',
    isActive: service?.isActive ?? true,
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function addPackage() { setPackages(p => [...p, { name: '', price: 0, description: '' }]) }
  function removePackage(i: number) { setPackages(p => p.filter((_, j) => j !== i)) }
  function updatePackage(i: number, k: string, v: any) {
    setPackages(p => p.map((pkg, j) => j === i ? { ...pkg, [k]: v } : pkg))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Service name is required'); return }
    if (!form.category) { toast.error('Category is required'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        basePrice: form.basePrice !== '' ? Number(form.basePrice) : null,
        packages: packages.length ? packages : undefined,
      }
      const url = service ? `/api/sales/services/${service.id}` : '/api/sales/services'
      const method = service ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSave()
    } catch (e: any) { toast.error(e.message || 'Failed to save') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{service ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Service Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Website Design & Development" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Base Price (KES)</label>
              <input type="number" value={form.basePrice} onChange={e => set('basePrice', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0" min="0" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of this service..." />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded" />
            <label htmlFor="isActive" className="text-sm text-slate-700">Active (visible in quotation builder)</label>
          </div>

          {/* Packages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Packages / Tiers</label>
              <button onClick={addPackage}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Package
              </button>
            </div>
            {packages.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No packages — clients will use the base price</p>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={pkg.name} onChange={e => updatePackage(i, 'name', e.target.value)}
                        placeholder="Package name (e.g. Basic)"
                        className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" value={pkg.price} onChange={e => updatePackage(i, 'price', Number(e.target.value))}
                        placeholder="Price"
                        className="w-28 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={() => removePackage(i)} className="text-red-400 hover:text-red-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input value={pkg.description} onChange={e => updatePackage(i, 'description', e.target.value)}
                      placeholder="What's included..."
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {service ? 'Update Service' : 'Add Service'}
          </button>
        </div>
      </div>
    </div>
  )
}
