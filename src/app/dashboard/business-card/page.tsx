'use client'
import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Download, Printer, MessageCircle, Mail, Phone, Globe,
  RefreshCw, Check, ChevronLeft, ChevronRight, Palette
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─── Theme definitions ────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'navy',
    name: 'Navy Blue',
    dark: '#0f2d52',
    mid: '#1d4ed8',
    light: '#bfdbfe',
    accent: '#60a5fa',
    dot: '#2563eb',
  },
  {
    id: 'forest',
    name: 'Forest',
    dark: '#052e16',
    mid: '#16a34a',
    light: '#bbf7d0',
    accent: '#4ade80',
    dot: '#15803d',
  },
  {
    id: 'slate',
    name: 'Midnight',
    dark: '#020617',
    mid: '#334155',
    light: '#cbd5e1',
    accent: '#94a3b8',
    dot: '#475569',
  },
  {
    id: 'purple',
    name: 'Royal',
    dark: '#1e1b4b',
    mid: '#6d28d9',
    light: '#ddd6fe',
    accent: '#a78bfa',
    dot: '#7c3aed',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    dark: '#450a0a',
    mid: '#dc2626',
    light: '#fecaca',
    accent: '#f87171',
    dot: '#b91c1c',
  },
]

// ─── Role label mapping ───────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Managing Director',
  HR_MANAGER: 'HR Manager',
  SALES_MANAGER: 'Sales Manager',
  SALES_AGENT: 'Sales Executive',
  FINANCE_OFFICER: 'Finance Officer',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Staff Member',
}

// ─── Card dimensions (85mm × 54mm at 96dpi → 323 × 205px, doubled → 646 × 408) ─
const CARD_W = 600
const CARD_H = 375

// ─── Card Front ───────────────────────────────────────────────────────────────
function CardFront({
  theme, name, jobTitle, department, phone, email, photo, initials,
}: {
  theme: typeof THEMES[0]; name: string; jobTitle: string; department: string
  phone: string; email: string; photo: string | null; initials: string
}) {
  const leftW = 200

  return (
    <div
      style={{
        width: `${CARD_W}px`, height: `${CARD_H}px`,
        display: 'flex', fontFamily: 'Arial, Helvetica, sans-serif',
        borderRadius: '14px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        position: 'relative',
      }}
    >
      {/* ── Left dark panel ── */}
      <div style={{
        width: `${leftW}px`, flexShrink: 0,
        background: `linear-gradient(170deg, ${theme.dark} 0%, ${theme.mid} 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.07)`,
          top: '-50px', left: '-50px',
        }} />
        <div style={{
          position: 'absolute', width: '120px', height: '120px', borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.07)`,
          bottom: '-30px', right: '-30px',
        }} />

        {/* Logo + Company name */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://helvino.org/images/logo.png"
            alt="Helvino"
            crossOrigin="anonymous"
            style={{
              height: '42px', width: 'auto', objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              display: 'block', margin: '0 auto 10px',
            }}
          />
          <div style={{ color: '#fff', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', lineHeight: '1.3' }}>
            Helvino Technologies
          </div>
          <div style={{ color: theme.accent, fontSize: '9px', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
            LIMITED
          </div>
        </div>

        {/* Accent divider */}
        <div style={{ width: '40px', height: '2px', background: theme.accent, borderRadius: '1px', margin: '4px 0' }} />

        {/* QR code using free service */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=https://helvino.org&bgcolor=00000000&color=FFFFFF`}
            alt="QR"
            crossOrigin="anonymous"
            style={{ width: '60px', height: '60px', opacity: 0.75, display: 'block', margin: '0 auto 6px' }}
          />
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '8px', letterSpacing: '0.5px' }}>
            helvino.org
          </div>
        </div>
      </div>

      {/* ── Right white panel ── */}
      <div style={{
        flex: 1, background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '28px 28px 24px',
        position: 'relative',
      }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: '3px',
          background: `linear-gradient(to bottom, ${theme.mid}, ${theme.accent})`,
          borderRadius: '0 2px 2px 0',
        }} />

        {/* Top-right dots decoration */}
        <div style={{ position: 'absolute', top: '16px', right: '20px', display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: i === 0 ? theme.dot : i === 1 ? theme.accent : theme.light,
            }} />
          ))}
        </div>

        {/* Photo + Name section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          {/* Profile photo / initials */}
          <div style={{
            width: '62px', height: '62px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: `0 4px 14px ${theme.light}`,
            border: `2px solid ${theme.light}`,
          }}>
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={photo} alt={name} crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>{initials}</span>
            )}
          </div>

          {/* Name & title */}
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', lineHeight: '1.15', letterSpacing: '-0.3px' }}>
              {name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.mid, marginTop: '3px', letterSpacing: '0.3px' }}>
              {jobTitle}
            </div>
            {department && (
              <div style={{
                display: 'inline-block', marginTop: '5px',
                padding: '2px 8px', borderRadius: '20px',
                background: theme.light,
                fontSize: '8.5px', fontWeight: '700', color: theme.dark,
                letterSpacing: '0.5px',
              }}>
                {department.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${theme.light}, transparent)`, marginBottom: '14px' }} />

        {/* Contact details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '5px',
                background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontSize: '10px' }}>📞</span>
              </div>
              <span style={{ fontSize: '11px', color: '#334155', fontWeight: '500' }}>{phone}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontSize: '10px' }}>✉</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#334155', fontWeight: '500' }}>{email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontSize: '10px' }}>🌐</span>
            </div>
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: '500' }}>helvino.org</span>
          </div>
        </div>

        {/* Bottom-right: M-Pesa badge */}
        <div style={{
          position: 'absolute', bottom: '14px', right: '18px',
          fontSize: '7.5px', color: '#94a3b8',
          textAlign: 'right', lineHeight: '1.5',
        }}>
          <div style={{ fontWeight: '700', color: '#64748b' }}>M-Pesa Paybill</div>
          <div>522533 · A/c 8071524</div>
        </div>
      </div>
    </div>
  )
}

// ─── Card Back ────────────────────────────────────────────────────────────────
function CardBack({ theme }: { theme: typeof THEMES[0] }) {
  return (
    <div style={{
      width: `${CARD_W}px`, height: `${CARD_H}px`,
      background: `linear-gradient(145deg, ${theme.dark} 0%, ${theme.mid} 60%, ${theme.dark} 100%)`,
      fontFamily: 'Arial, Helvetica, sans-serif',
      borderRadius: '14px', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Large decorative circles */}
      {[
        { size: 300, top: '-100px', left: '-80px', opacity: 0.05 },
        { size: 200, bottom: '-60px', right: '-60px', opacity: 0.07 },
        { size: 120, top: '30px', right: '60px', opacity: 0.06 },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${c.size}px`, height: `${c.size}px`,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.15)',
          top: (c as any).top, bottom: (c as any).bottom,
          left: (c as any).left, right: (c as any).right,
          opacity: c.opacity,
        }} />
      ))}

      {/* Center content */}
      <div style={{ textAlign: 'center', zIndex: 1, padding: '20px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://helvino.org/images/logo.png"
          alt="Helvino"
          crossOrigin="anonymous"
          style={{
            height: '64px', width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            display: 'block', margin: '0 auto 14px',
          }}
        />
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '1px', lineHeight: '1.2' }}>
          HELVINO TECHNOLOGIES
        </div>
        <div style={{ color: theme.accent, fontSize: '11px', fontWeight: '600', letterSpacing: '3px', marginTop: '4px' }}>
          LIMITED
        </div>

        {/* Tagline */}
        <div style={{
          color: 'rgba(255,255,255,0.6)', fontSize: '10px',
          marginTop: '12px', letterSpacing: '0.5px', fontStyle: 'italic',
        }}>
          Transforming Businesses with Smart Technology Solutions
        </div>

        {/* Divider */}
        <div style={{ width: '60px', height: '2px', background: theme.accent, borderRadius: '1px', margin: '14px auto' }} />

        {/* Contact strip */}
        <div style={{
          display: 'flex', gap: '20px', justifyContent: 'center',
          fontSize: '10px', color: 'rgba(255,255,255,0.75)',
        }}>
          <span>📞 0110421320</span>
          <span>✉ helvinotechltd@gmail.com</span>
          <span>🌐 helvino.org</span>
        </div>

        {/* Address */}
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: '10px', letterSpacing: '0.5px' }}>
          Nairobi, Kenya · Paybill: 522533 · A/c: 8071524
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BusinessCardPage() {
  const { data: session } = useSession()
  const [theme, setTheme] = useState(THEMES[0])
  const [face, setFace] = useState<'front' | 'back'>('front')
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const employee = (session?.user as any)?.employee
  const role = (session?.user as any)?.role
  const userEmail = session?.user?.email || ''
  const userName = (session?.user as any)?.name || ''

  const firstName = employee?.firstName || userName.split(' ')[0] || ''
  const lastName = employee?.lastName || userName.split(' ').slice(1).join(' ') || ''
  const fullName = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0]
  const jobTitle = employee?.jobTitle || ROLE_LABELS[role] || 'Staff Member'
  const department = employee?.department?.name || ''
  const phone = employee?.phone || ''
  const email = employee?.email || userEmail
  const photo = employee?.profilePhoto || null
  const employeeCode = employee?.employeeCode || ''
  const initials = `${firstName.charAt(0) || '?'}${lastName.charAt(0) || ''}`.toUpperCase()

  async function downloadAsPNG() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: false,
        backgroundColor: null, logging: false,
      })
      const link = document.createElement('a')
      link.download = `${fullName.replace(/\s+/g, '_')}_Business_Card_${face}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Business card downloaded as image!')
    } catch {
      toast.error('Failed to download image')
    }
    setDownloading(false)
  }

  async function downloadAsPDF() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      // Business card size: 85mm × 54mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85, 54)
      pdf.save(`${fullName.replace(/\s+/g, '_')}_Business_Card.pdf`)
      toast.success('Business card downloaded as PDF!')
    } catch {
      toast.error('Failed to download PDF')
    }
    setDownloading(false)
  }

  function shareWhatsApp() {
    const msg = [
      `*${fullName}*`,
      jobTitle,
      department ? `${department} — Helvino Technologies Ltd` : 'Helvino Technologies Ltd',
      '',
      phone ? `📞 ${phone}` : '',
      `✉ ${email}`,
      `🌐 helvino.org`,
      '',
      'M-Pesa Paybill: 522533 | A/c: 8071524',
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function shareEmail() {
    const subject = encodeURIComponent(`${fullName} — Helvino Technologies Ltd`)
    const body = encodeURIComponent([
      `Contact Details for ${fullName}`,
      '',
      `Name: ${fullName}`,
      `Title: ${jobTitle}`,
      department ? `Department: ${department}` : '',
      `Company: Helvino Technologies Ltd`,
      '',
      phone ? `Phone: ${phone}` : '',
      `Email: ${email}`,
      `Website: helvino.org`,
      '',
      'Payment: Paybill 522533, A/c 8071524',
    ].filter(Boolean).join('\n'))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Business Card</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Your professional card on Helvino Technologies branding — download, print, or share instantly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Card Preview ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Face toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {(['front', 'back'] as const).map(f => (
              <button key={f} onClick={() => setFace(f)}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${face === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f} Side
              </button>
            ))}
          </div>

          {/* Card container — scrollable on small screens */}
          <div className="overflow-x-auto pb-2">
            <div ref={cardRef} className="inline-block">
              {face === 'front' ? (
                <CardFront
                  theme={theme} name={fullName} jobTitle={jobTitle}
                  department={department} phone={phone} email={email}
                  photo={photo} initials={initials}
                />
              ) : (
                <CardBack theme={theme} />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={downloadAsPDF} disabled={downloading}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors disabled:opacity-60">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button onClick={downloadAsPNG} disabled={downloading}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-60">
              <Download className="w-4 h-4" />
              Image (PNG)
            </button>
            <button onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-colors">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button onClick={shareEmail}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors">
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          <button onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <Printer className="w-4 h-4" />
            Print Business Card
          </button>
        </div>

        {/* ── Side panel ── */}
        <div className="space-y-4">
          {/* Color themes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Card Theme</h3>
            </div>
            <div className="flex flex-col gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${theme.id === t.id ? 'ring-2 ring-blue-500 bg-slate-50' : 'hover:bg-slate-50 border border-slate-100'}`}>
                  <div style={{
                    width: '32px', height: '20px', borderRadius: '5px',
                    background: `linear-gradient(135deg, ${t.dark}, ${t.mid})`,
                    flexShrink: 0,
                  }} />
                  <span className="text-slate-700">{t.name}</span>
                  {theme.id === t.id && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Card info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Your Card Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold text-slate-800 text-right max-w-32 truncate">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Title</span>
                <span className="font-semibold text-slate-800 text-right max-w-32 truncate">{jobTitle}</span>
              </div>
              {department && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dept</span>
                  <span className="font-semibold text-slate-800 text-right max-w-32 truncate">{department}</span>
                </div>
              )}
              {phone && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-800">{phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-slate-800 text-right max-w-36 truncate text-xs">{email}</span>
              </div>
              {employeeCode && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">{employeeCode}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Update your details (phone, photo) from your <a href="/dashboard/profile" className="text-blue-600 hover:underline">Profile page</a>.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 mb-2">💡 Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1.5 leading-relaxed list-disc list-inside">
              <li>Download as <strong>PDF</strong> for best print quality</li>
              <li>Download as <strong>PNG</strong> to share on WhatsApp status or social media</li>
              <li>Use <strong>WhatsApp</strong> to instantly send your contact details</li>
              <li>Print on <strong>300gsm</strong> coated card for professional look</li>
              <li>Standard size: <strong>85mm × 54mm</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print styles — only the card prints */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-card, .print-card * { visibility: visible !important; }
          .print-card { position: fixed !important; left: 0 !important; top: 0 !important; }
        }
      ` }} />
    </div>
  )
}
