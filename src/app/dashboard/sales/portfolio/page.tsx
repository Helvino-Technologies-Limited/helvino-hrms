'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Search, Edit, Trash2, Globe, Wifi, Camera, Server,
  Cloud, Monitor, X, RefreshCw, Briefcase, ChevronRight,
  Quote, Calendar, CheckCircle, ExternalLink, Copy, Share2,
  FileText, Download, Phone, Mail, Globe2, CreditCard,
  Sparkles, Layers, ShoppingBag, BookOpen, Stethoscope,
  Droplets, Users, Building2, Package, ArrowRight, Star,
  Zap, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Software Systems', 'Websites', 'CCTV Installations', 'Network Infrastructure', 'SaaS Solutions',
] as const

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

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  'Education': <BookOpen className="w-5 h-5" />,
  'Healthcare': <Stethoscope className="w-5 h-5" />,
  'Retail & Commerce': <ShoppingBag className="w-5 h-5" />,
  'Water & Utilities': <Droplets className="w-5 h-5" />,
  'Finance & Investment': <CreditCard className="w-5 h-5" />,
}

const PRODUCT_GRADIENTS: Record<string, string> = {
  'Education': 'from-sky-500 to-blue-700',
  'Healthcare': 'from-rose-500 to-red-700',
  'Retail & Commerce': 'from-amber-500 to-orange-600',
  'Water & Utilities': 'from-cyan-500 to-teal-700',
  'Finance & Investment': 'from-emerald-500 to-green-700',
  default: 'from-violet-500 to-purple-700',
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'SALES_MANAGER']

const COMPANY = {
  name: 'Helvino Technologies Ltd',
  email: 'helvinotechltd@gmail.com',
  phone: '0110421320',
  paybill: '522533',
  account: '8071524',
  website: 'helvino.org',
  tagline: 'Transforming Businesses with Smart Technology Solutions',
}

const EMPTY_FORM = {
  clientName: '', industry: '', serviceType: 'Software Systems', description: '',
  projectImages: '', completedAt: '', testimonial: '', caseStudy: '',
  published: false, demoUrl: '', isProduct: false, productStatus: 'AVAILABLE',
  pricing: '', features: '',
}

function formatDateNice(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PlaceholderCard({ serviceType, industry }: { serviceType: string; industry?: string }) {
  const gradient = industry && PRODUCT_GRADIENTS[industry]
    ? PRODUCT_GRADIENTS[industry]
    : SERVICE_GRADIENTS[serviceType] ?? 'from-slate-500 to-slate-700'
  const icon = industry && INDUSTRY_ICONS[industry]
    ? INDUSTRY_ICONS[industry]
    : <Monitor className="w-8 h-8" />
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white/80`}>
      {icon}
    </div>
  )
}

// ─── Flier Component ──────────────────────────────────────────────────────────

function ProductFlier({ product }: { product: any }) {
  const gradient = product.industry && PRODUCT_GRADIENTS[product.industry]
    ? PRODUCT_GRADIENTS[product.industry]
    : SERVICE_GRADIENTS[product.serviceType] ?? 'from-violet-500 to-purple-700'

  return (
    <div
      id="product-flier"
      style={{
        width: '420px',
        minHeight: '594px',
        background: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        borderRadius: '16px',
      }}
    >
      {/* Header Band */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #0ea5e9 100%)',
        padding: '20px 24px 16px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#93c5fd', fontSize: '10px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Helvino Technologies Ltd
            </div>
            <div style={{ color: '#fff', fontSize: '11px', opacity: 0.8 }}>Smart Technology Solutions</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '20px', fontWeight: '900' }}>H</span>
          </div>
        </div>
      </div>

      {/* Product Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Category badge */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(59, 130, 246, 0.25)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          color: '#93c5fd',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '9px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          {product.industry || product.serviceType}
        </div>

        <div style={{ color: '#fff', fontSize: '22px', fontWeight: '800', lineHeight: '1.2', marginBottom: '10px' }}>
          {product.clientName}
        </div>

        {product.productStatus === 'COMING_SOON' && (
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '9px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Coming Soon
          </div>
        )}

        <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.6' }}>
          {product.description}
        </div>
      </div>

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <div style={{ padding: '20px 24px', background: '#f8fafc' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            KEY FEATURES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {product.features.slice(0, 8).map((f: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '1px',
                }}>
                  <span style={{ color: '#fff', fontSize: '8px', fontWeight: '900' }}>✓</span>
                </div>
                <span style={{ fontSize: '10px', color: '#374151', lineHeight: '1.4' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo URL */}
      {product.demoUrl && (
        <div style={{
          margin: '0 24px 16px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: '14px' }}>🔗</span>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#1d4ed8', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Demo</div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>{product.demoUrl}</div>
          </div>
        </div>
      )}

      {/* Pricing */}
      {product.pricing && (
        <div style={{
          margin: '0 24px 16px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>💰</span>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#15803d', letterSpacing: '1px', textTransform: 'uppercase' }}>Pricing</div>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>{product.pricing}</div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '0 24px' }} />

      {/* Company Contact Footer */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
        padding: '16px 24px',
        marginTop: '16px',
      }}>
        <div style={{ color: '#93c5fd', fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
          Contact Us Today
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>📞</span>
            <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{COMPANY.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>✉️</span>
            <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{COMPANY.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>🌐</span>
            <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{COMPANY.website}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>📲</span>
            <span style={{ color: '#e2e8f0', fontSize: '9px' }}>Paybill: {COMPANY.paybill} Acc: {COMPANY.account}</span>
          </div>
        </div>
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: '#64748b',
          fontSize: '8px',
          textAlign: 'center',
        }}>
          {COMPANY.tagline} • {COMPANY.website}
        </div>
      </div>
    </div>
  )
}

// ─── Quick Quotation Modal ────────────────────────────────────────────────────

function QuickQuotationModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', quantity: 1, unitPrice: '', notes: '',
    validUntil: '', deliveryTimeline: '', projectScope: product.description || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName || !form.unitPrice) {
      toast.error('Client name and price are required')
      return
    }
    setSaving(true)
    try {
      const qty = Math.max(1, form.quantity)
      const price = parseFloat(form.unitPrice) || 0
      const res = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail || null,
          deliveryTimeline: form.deliveryTimeline || null,
          projectScope: form.projectScope || null,
          notes: form.notes || null,
          validUntil: form.validUntil || null,
          taxRate: 16,
          items: [{
            name: product.clientName,
            description: product.description,
            quantity: qty,
            unitPrice: price,
            totalPrice: qty * price,
          }],
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(`Quotation ${data.quotationNumber} created successfully!`)
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create quotation')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generate Quotation</h2>
            <p className="text-slate-500 text-sm">{product.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required
                placeholder="Enter client or company name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Email</label>
              <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                placeholder="client@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Price (KES) <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="any" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} required
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Timeline</label>
              <input type="text" value={form.deliveryTimeline} onChange={e => setForm(f => ({ ...f, deliveryTimeline: e.target.value }))}
                placeholder="e.g. 4 weeks"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project Scope</label>
              <textarea value={form.projectScope} onChange={e => setForm(f => ({ ...f, projectScope: e.target.value }))} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          {form.unitPrice && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">KES {(parseFloat(form.unitPrice) * form.quantity || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">VAT (16%):</span>
                <span className="font-semibold">KES {((parseFloat(form.unitPrice) * form.quantity || 0) * 0.16).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-blue-200">
                <span className="text-slate-800">Total:</span>
                <span className="text-blue-700">KES {((parseFloat(form.unitPrice) * form.quantity || 0) * 1.16).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Flier Modal ──────────────────────────────────────────────────────────────

function FlierModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false)

  async function downloadAsPDF() {
    setDownloading(true)
    try {
      const el = document.getElementById('product-flier')
      if (!el) throw new Error('Flier not found')
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${product.clientName.replace(/\s+/g, '_')}_Flier.pdf`)
      toast.success('Flier downloaded as PDF!')
    } catch (e) {
      toast.error('Failed to download PDF')
    }
    setDownloading(false)
  }

  async function downloadAsImage() {
    setDownloading(true)
    try {
      const el = document.getElementById('product-flier')
      if (!el) throw new Error('Flier not found')
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `${product.clientName.replace(/\s+/g, '_')}_Flier.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Flier downloaded as image!')
    } catch (e) {
      toast.error('Failed to download image')
    }
    setDownloading(false)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Product Flier</h2>
            <p className="text-slate-400 text-sm">{product.clientName} — Download & Share</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flier Preview */}
        <div className="p-6 flex justify-center overflow-x-auto">
          <ProductFlier product={product} />
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-700 space-y-3">
          <p className="text-slate-400 text-xs text-center">Download and share via WhatsApp, Email, or Print</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={downloadAsPDF} disabled={downloading}
              className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
              <Download className="w-5 h-5" />
              <span className="text-xs">PDF</span>
            </button>
            <button onClick={downloadAsImage} disabled={downloading}
              className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
              <Download className="w-5 h-5" />
              <span className="text-xs">Image</span>
            </button>
            <button onClick={handlePrint}
              className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-semibold text-sm transition-colors">
              <FileText className="w-5 h-5" />
              <span className="text-xs">Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'products' | 'portfolio'>('products')
  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [quotationProduct, setQuotationProduct] = useState<any>(null)
  const [flierProduct, setFlierProduct] = useState<any>(null)
  const [seeding, setSeeding] = useState(false)

  const role = (session?.user as any)?.role
  const isAdmin = ADMIN_ROLES.includes(role)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/portfolio')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error('Failed to load data')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const products = items.filter(i => i.isProduct)
  const portfolioItems = items.filter(i => !i.isProduct)

  const filteredProducts = products.filter(p =>
    (!search || p.clientName.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterService || p.serviceType === filterService)
  )
  const filteredPortfolio = portfolioItems.filter(p =>
    (!search || p.clientName.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterService || p.serviceType === filterService)
  )

  async function handleSeedProducts() {
    if (!confirm('Seed Helvino default products? Existing products will not be duplicated.')) return
    setSeeding(true)
    try {
      const res = await fetch('/api/sales/portfolio/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Seeding failed')
    }
    setSeeding(false)
  }

  function openAdd(isProduct = false) {
    setEditing(null)
    setForm({ ...EMPTY_FORM, isProduct })
    setShowModal(true)
  }

  function openEdit(item: any) {
    setEditing(item)
    setForm({
      clientName: item.clientName ?? '',
      industry: item.industry ?? '',
      serviceType: item.serviceType ?? 'Software Systems',
      description: item.description ?? '',
      projectImages: Array.isArray(item.projectImages) ? item.projectImages.join('\n') : '',
      completedAt: item.completedAt ? item.completedAt.slice(0, 10) : '',
      testimonial: item.testimonial ?? '',
      caseStudy: item.caseStudy ?? '',
      published: item.isPublished ?? false,
      demoUrl: item.demoUrl ?? '',
      isProduct: item.isProduct ?? false,
      productStatus: item.productStatus ?? 'AVAILABLE',
      pricing: item.pricing ?? '',
      features: Array.isArray(item.features) ? item.features.join('\n') : '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName || !form.serviceType) {
      toast.error('Name and service type are required')
      return
    }
    setSaving(true)
    try {
      const images = form.projectImages.split('\n').map(s => s.trim()).filter(Boolean)
      const features = form.features.split('\n').map(s => s.trim()).filter(Boolean)
      const payload = {
        ...form, projectImages: images, features,
        isPublished: form.published,
        demoUrl: form.demoUrl || null,
      }
      const url = editing ? `/api/sales/portfolio/${editing.id}` : '/api/sales/portfolio'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Updated successfully' : 'Added successfully')
      setShowModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Removed')
      setDetailItem(null)
      loadData()
    } catch {
      toast.error('Failed to delete')
    }
    setDeletingId(null)
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success('Demo link copied!')).catch(() => toast.error('Failed to copy'))
  }

  const currentList = tab === 'products' ? filteredProducts : filteredPortfolio

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Products & Portfolio</h1>
          <p className="text-slate-500 text-sm mt-0.5">Showcase products and past work to drive sales</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && products.length === 0 && (
            <button onClick={handleSeedProducts} disabled={seeding}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors disabled:opacity-60">
              <Sparkles className="w-4 h-4" />
              {seeding ? 'Seeding...' : 'Seed Helvino Products'}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => openAdd(tab === 'products')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors shadow-md">
              <Plus className="w-4 h-4" />
              {tab === 'products' ? 'Add Product' : 'Add Project'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Products', value: products.length, icon: <Package className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
          { label: 'Available', value: products.filter(p => p.productStatus === 'AVAILABLE').length, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { label: 'Coming Soon', value: products.filter(p => p.productStatus === 'COMING_SOON').length, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Past Projects', value: portfolioItems.length, icon: <Briefcase className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button onClick={() => setTab('products')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><Package className="w-4 h-4" />Products ({products.length})</span>
          </button>
          <button onClick={() => setTab('portfolio')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'portfolio' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Past Work ({portfolioItems.length})</span>
          </button>
        </div>
        {/* Search / Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterService} onChange={e => setFilterService(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-44">
            <option value="">All Service Types</option>
            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-20 text-center">
          {tab === 'products' ? <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" /> : <Briefcase className="w-14 h-14 text-slate-200 mx-auto mb-4" />}
          <p className="text-slate-500 font-semibold text-lg">
            {tab === 'products' ? 'No products yet' : 'No portfolio projects yet'}
          </p>
          {isAdmin && tab === 'products' && products.length === 0 && (
            <div className="mt-4 flex gap-3 justify-center">
              <button onClick={handleSeedProducts} disabled={seeding}
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
                <Sparkles className="w-4 h-4 inline mr-2" />
                {seeding ? 'Seeding...' : 'Seed Helvino Products'}
              </button>
              <button onClick={() => openAdd(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
                <Plus className="w-4 h-4 inline mr-2" />Add Product
              </button>
            </div>
          )}
        </div>
      ) : tab === 'products' ? (
        // ── Products Grid ──
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map(product => {
            const gradient = product.industry && PRODUCT_GRADIENTS[product.industry]
              ? PRODUCT_GRADIENTS[product.industry]
              : SERVICE_GRADIENTS[product.serviceType] ?? 'from-slate-500 to-slate-700'
            const icon = product.industry && INDUSTRY_ICONS[product.industry]
              ? INDUSTRY_ICONS[product.industry]
              : <Monitor className="w-8 h-8" />
            const available = product.productStatus === 'AVAILABLE'

            return (
              <div key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col">

                {/* Card Header Gradient */}
                <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                  <div className="text-white/30 absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 opacity-20">{icon}</div>
                  </div>
                  <div className="text-white text-center z-10 px-4">
                    <div className="text-white/90">{icon}</div>
                    <div className="text-xs font-semibold text-white/80 mt-1">{product.industry || product.serviceType}</div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg ${available ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {available ? 'AVAILABLE' : 'COMING SOON'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{product.clientName}</h3>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-3">{product.description}</p>
                  )}

                  {/* Features preview */}
                  {product.features && product.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {product.features.slice(0, 3).map((f: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{f}</span>
                      ))}
                      {product.features.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">+{product.features.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Demo URL */}
                  {product.demoUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-3 bg-blue-50 rounded-lg px-2.5 py-1.5">
                      <Globe2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">{product.demoUrl}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
                    {/* Primary actions */}
                    <div className="grid grid-cols-2 gap-2">
                      {product.demoUrl && (
                        <a href={product.demoUrl.startsWith('http') ? product.demoUrl : `https://${product.demoUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Demo
                        </a>
                      )}
                      {product.demoUrl && (
                        <button onClick={e => { e.stopPropagation(); copyLink(product.demoUrl.startsWith('http') ? product.demoUrl : `https://${product.demoUrl}`) }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                          Copy Link
                        </button>
                      )}
                    </div>
                    {/* Secondary actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={e => { e.stopPropagation(); setQuotationProduct(product) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                        Quotation
                      </button>
                      <button onClick={e => { e.stopPropagation(); setFlierProduct(product) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Flier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // ── Portfolio Grid (past work) ──
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPortfolio.map(project => {
            const images = Array.isArray(project.projectImages) ? project.projectImages : []
            return (
              <div key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                onClick={() => setDetailItem(project)}>
                <div className="relative h-48 overflow-hidden">
                  {images[0] ? (
                    <img src={images[0]} alt={project.clientName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full">
                      <PlaceholderCard serviceType={project.serviceType} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow ${project.isPublished ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      {project.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{project.clientName}</h3>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(project.id)} disabled={deletingId === project.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {project.industry && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{project.industry}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SERVICE_TAG_COLORS[project.serviceType] ?? 'bg-slate-100 text-slate-600'}`}>{project.serviceType}</span>
                  </div>
                  {project.description && <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-3">{project.description}</p>}
                  {project.completedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Completed {formatDateNice(project.completedAt)}</span>
                    </div>
                  )}
                  {project.testimonial && (
                    <div className="bg-slate-50 rounded-xl p-3 border-l-2 border-blue-300">
                      <p className="text-slate-600 text-xs italic line-clamp-2">"{project.testimonial}"</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail Modal (Portfolio items) ── */}
      {detailItem && !detailItem.isProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const imgs = Array.isArray(detailItem.projectImages) ? detailItem.projectImages : []
              return imgs.length > 0 ? (
                <div className={`grid gap-1 ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {imgs.slice(0, 4).map((img: string, i: number) => (
                    <div key={i} className={`${imgs.length === 1 ? 'h-64' : 'h-40'} overflow-hidden ${i === 0 && imgs.length === 3 ? 'col-span-2' : ''}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48"><PlaceholderCard serviceType={detailItem.serviceType} /></div>
              )
            })()}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${detailItem.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {detailItem.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${SERVICE_TAG_COLORS[detailItem.serviceType] ?? 'bg-slate-100 text-slate-600'}`}>
                      {detailItem.serviceType}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{detailItem.clientName}</h2>
                  {detailItem.industry && <p className="text-slate-500 text-sm">{detailItem.industry}</p>}
                </div>
                <button onClick={() => setDetailItem(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              {detailItem.completedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Completed {formatDateNice(detailItem.completedAt)}</span>
                </div>
              )}
              {detailItem.description && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">About this Project</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{detailItem.description}</p>
                </div>
              )}
              {detailItem.caseStudy && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />Case Study
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed whitespace-pre-line">{detailItem.caseStudy}</p>
                </div>
              )}
              {detailItem.testimonial && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
                  <Quote className="w-6 h-6 text-slate-200 absolute top-3 right-3" />
                  <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Client Testimonial</h3>
                  <p className="text-slate-600 text-sm italic">"{detailItem.testimonial}"</p>
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => { setDetailItem(null); openEdit(detailItem) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                    <Edit className="w-4 h-4" />Edit
                  </button>
                  <button onClick={() => handleDelete(detailItem.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? 'Edit' : 'Add'} {form.isProduct ? 'Product' : 'Portfolio Project'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Toggle */}
              {!editing && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button type="button" onClick={() => setForm(f => ({ ...f, isProduct: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!form.isProduct ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                    Portfolio Project
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isProduct: true }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.isProduct ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                    Product
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {form.isProduct ? 'Product Name' : 'Client Name'} <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required
                  placeholder={form.isProduct ? 'e.g. School Management System' : 'Client or company name'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Industry</label>
                  <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    placeholder="e.g. Healthcare, Education"
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

              {form.isProduct && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                      <select value={form.productStatus} onChange={e => setForm(f => ({ ...f, productStatus: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="AVAILABLE">Available</option>
                        <option value="COMING_SOON">Coming Soon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Pricing</label>
                      <input type="text" value={form.pricing} onChange={e => setForm(f => ({ ...f, pricing: e.target.value }))}
                        placeholder="e.g. From KES 50,000"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Demo URL</label>
                    <input type="text" value={form.demoUrl} onChange={e => setForm(f => ({ ...f, demoUrl: e.target.value }))}
                      placeholder="https://demo.example.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Key Features</label>
                    <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} rows={4}
                      placeholder="One feature per line&#10;Student Registration&#10;Fees Management&#10;Reports"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <p className="text-xs text-slate-400 mt-1">Enter one feature per line</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Describe the project, scope, and outcomes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {!form.isProduct && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Images</label>
                    <textarea value={form.projectImages} onChange={e => setForm(f => ({ ...f, projectImages: e.target.value }))} rows={2}
                      placeholder="One image URL per line"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Completed At</label>
                      <input type="date" value={form.completedAt} onChange={e => setForm(f => ({ ...f, completedAt: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Testimonial</label>
                    <textarea value={form.testimonial} onChange={e => setForm(f => ({ ...f, testimonial: e.target.value }))} rows={2}
                      placeholder="Client testimonial..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Case Study</label>
                    <textarea value={form.caseStudy} onChange={e => setForm(f => ({ ...f, caseStudy: e.target.value }))} rows={3}
                      placeholder="Challenges, solutions, results..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </>
              )}

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="font-semibold">Publish (visible to all)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quotation Modal ── */}
      {quotationProduct && (
        <QuickQuotationModal product={quotationProduct} onClose={() => setQuotationProduct(null)} />
      )}

      {/* ── Flier Modal ── */}
      {flierProduct && (
        <FlierModal product={flierProduct} onClose={() => setFlierProduct(null)} />
      )}
    </div>
  )
}
