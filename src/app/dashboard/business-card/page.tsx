'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Download, Printer, MessageCircle, Mail, Check, Palette,
  Loader2, Share2
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─── Theme definitions ────────────────────────────────────────────────────────
const THEMES = [
  { id: 'navy',    name: 'Navy Blue', dark: '#0f2d52', mid: '#1d4ed8', light: '#bfdbfe', accent: '#60a5fa', dot: '#2563eb' },
  { id: 'forest',  name: 'Forest',    dark: '#052e16', mid: '#16a34a', light: '#bbf7d0', accent: '#4ade80', dot: '#15803d' },
  { id: 'slate',   name: 'Midnight',  dark: '#020617', mid: '#334155', light: '#cbd5e1', accent: '#94a3b8', dot: '#475569' },
  { id: 'purple',  name: 'Royal',     dark: '#1e1b4b', mid: '#6d28d9', light: '#ddd6fe', accent: '#a78bfa', dot: '#7c3aed' },
  { id: 'crimson', name: 'Crimson',   dark: '#450a0a', mid: '#dc2626', light: '#fecaca', accent: '#f87171', dot: '#b91c1c' },
]

// ─── Role label mapping ───────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Managing Director',
  HR_MANAGER: 'HR Manager',
  SALES_MANAGER: 'Sales Manager',
  SALES_AGENT: 'Staff',
  FINANCE_OFFICER: 'Finance Officer',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Staff Member',
}

const COMPANY_PHONE = '0110421320'
const CARD_W = 640
const CARD_H = 380

// ─── Card Front ───────────────────────────────────────────────────────────────
function CardFront({
  theme, name, jobTitle, department, phone, email, photo, initials,
}: {
  theme: typeof THEMES[0]; name: string; jobTitle: string; department: string
  phone: string; email: string; photo: string | null; initials: string
}) {
  const leftW = 210

  return (
    <div style={{
      width: `${CARD_W}px`, height: `${CARD_H}px`,
      display: 'flex', fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
      position: 'relative',
    }}>
      {/* ── Left dark panel ── */}
      <div style={{
        width: `${leftW}px`, flexShrink: 0,
        background: `linear-gradient(160deg, ${theme.dark} 0%, ${theme.mid} 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 16px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: '-80px', left: '-60px' }} />
        <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', bottom: '-40px', right: '-40px' }} />
        {/* Diagonal accent */}
        <div style={{ position: 'absolute', width: '2px', height: '280px', background: `linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)`, transform: 'rotate(20deg)', top: '-20px', left: '70px' }} />

        {/* Logo + Company name */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://helvino.org/images/logo.png"
            alt="Helvino"
            crossOrigin="anonymous"
            style={{ height: '38px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block', margin: '0 auto 8px' }}
          />
          <div style={{ color: '#fff', fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px' }}>HELVINO TECHNOLOGIES</div>
          <div style={{ color: theme.accent, fontSize: '8.5px', fontWeight: '600', letterSpacing: '2px', marginTop: '2px' }}>LIMITED</div>
        </div>

        {/* Accent line */}
        <div style={{ width: '36px', height: '2px', background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`, margin: '2px 0' }} />

        {/* Profile photo / initials */}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
          <div style={{
            width: '74px', height: '74px', borderRadius: '50%',
            background: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${theme.accent}`,
            boxShadow: `0 0 0 4px rgba(255,255,255,0.08)`,
          }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: '900', fontSize: '22px', letterSpacing: '1px' }}>{initials}</span>
            )}
          </div>
        </div>

        {/* QR code */}
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=https://helvino.org&bgcolor=00000000&color=FFFFFF`}
            alt="QR"
            crossOrigin="anonymous"
            style={{ width: '54px', height: '54px', opacity: 0.65, display: 'block', margin: '0 auto 4px' }}
          />
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '7.5px', letterSpacing: '0.5px' }}>helvino.org</div>
        </div>
      </div>

      {/* ── Right white panel ── */}
      <div style={{
        flex: 1, background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '24px 26px 20px',
        position: 'relative',
      }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: '18%', bottom: '18%', width: '3px',
          background: `linear-gradient(to bottom, ${theme.mid}, ${theme.accent})`,
          borderRadius: '0 2px 2px 0',
        }} />

        {/* Top-right corner dots */}
        <div style={{ position: 'absolute', top: '14px', right: '18px', display: 'grid', gridTemplateColumns: 'repeat(3, 5px)', gap: '3px' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: i < 3 ? theme.dot : i < 6 ? theme.accent : theme.light, opacity: 0.6 }} />
          ))}
        </div>

        {/* Name + Title */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '21px', fontWeight: '900', color: '#0f172a', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
            {name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: theme.mid, color: '#fff',
              fontSize: '9px', fontWeight: '800', letterSpacing: '0.8px',
              padding: '3px 10px', borderRadius: '20px',
            }}>
              {jobTitle.toUpperCase()}
            </div>
            {department && (
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: theme.light, color: theme.dark,
                fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.4px',
                padding: '3px 9px', borderRadius: '20px',
              }}>
                {department.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${theme.light}, transparent)`, marginBottom: '14px' }} />

        {/* Contact details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '11px' }}>📱</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', lineHeight: '1' }}>MOBILE</div>
                <div style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: '700', lineHeight: '1.3' }}>{phone}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '11px' }}>📞</span>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', lineHeight: '1' }}>OFFICE</div>
              <div style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: '700', lineHeight: '1.3' }}>{COMPANY_PHONE}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '11px' }}>✉</span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>{email}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `linear-gradient(135deg, ${theme.dark}, ${theme.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '11px' }}>🌐</span>
            </div>
            <div style={{ fontSize: '11px', color: '#334155', fontWeight: '500' }}>helvino.org</div>
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px',
          background: `linear-gradient(90deg, ${theme.light}55, ${theme.light}22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 18px',
          borderTop: `1px solid ${theme.light}`,
        }}>
          <div style={{ fontSize: '7.5px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.3px' }}>
            M-Pesa Paybill: <span style={{ color: '#64748b' }}>522533</span> &nbsp;·&nbsp; A/c: <span style={{ color: '#64748b' }}>8071524</span>
          </div>
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
      fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Decorative circles */}
      {[
        { size: 320, top: '-110px', left: '-90px' },
        { size: 220, bottom: '-70px', right: '-70px' },
        { size: 130, top: '20px', right: '50px' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: `${c.size}px`, height: `${c.size}px`, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.1)',
          top: (c as any).top, bottom: (c as any).bottom, left: (c as any).left, right: (c as any).right,
        }} />
      ))}
      {/* Diagonal accent stripe */}
      <div style={{ position: 'absolute', width: '3px', height: '500px', background: `linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)`, transform: 'rotate(25deg)', left: '45%' }} />

      {/* Center content */}
      <div style={{ textAlign: 'center', zIndex: 1, padding: '20px 40px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://helvino.org/images/logo.png"
          alt="Helvino"
          crossOrigin="anonymous"
          style={{ height: '60px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block', margin: '0 auto 12px' }}
        />
        <div style={{ color: '#fff', fontSize: '19px', fontWeight: '900', letterSpacing: '2px', lineHeight: '1.2' }}>
          HELVINO TECHNOLOGIES
        </div>
        <div style={{ color: theme.accent, fontSize: '11px', fontWeight: '600', letterSpacing: '4px', marginTop: '4px' }}>
          LIMITED
        </div>

        {/* Tagline */}
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9.5px', marginTop: '12px', letterSpacing: '0.5px', fontStyle: 'italic' }}>
          Transforming Businesses with Smart Technology Solutions
        </div>

        {/* Accent divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px auto', width: '220px', justifyContent: 'center' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${theme.accent})` }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent }} />
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${theme.accent}, transparent)` }} />
        </div>

        {/* Contact strip */}
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.78)', flexWrap: 'wrap' }}>
          <span>📞 {COMPANY_PHONE}</span>
          <span>✉ helvinotechltd@gmail.com</span>
          <span>🌐 helvino.org</span>
        </div>

        {/* Address + Paybill */}
        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '8.5px', marginTop: '10px', letterSpacing: '0.5px' }}>
          Siaya, Kenya &nbsp;·&nbsp; M-Pesa Paybill: 522533 &nbsp;·&nbsp; A/c: 8071524
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
  const [busy, setBusy] = useState(false)
  const [empData, setEmpData] = useState<any>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const role = (session?.user as any)?.role as string
  const employeeId = (session?.user as any)?.employeeId
  const userEmail = session?.user?.email || ''
  const userName = (session?.user as any)?.name || ''

  // Fetch full employee record (session only stores minimal data)
  useEffect(() => {
    if (!employeeId) return
    fetch(`/api/employees/${employeeId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setEmpData(d))
      .catch(() => null)
  }, [employeeId])

  const firstName = empData?.firstName || userName.split(' ')[0] || ''
  const lastName  = empData?.lastName  || userName.split(' ').slice(1).join(' ') || ''
  const fullName  = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0]
  const initials  = `${firstName.charAt(0) || '?'}${lastName.charAt(0) || ''}`.toUpperCase()

  // Title: SALES_AGENT → "Staff"; others → jobTitle from DB or role label
  const jobTitle   = role === 'SALES_AGENT' ? 'Staff' : (empData?.jobTitle || ROLE_LABELS[role] || 'Staff Member')
  const department = empData?.department?.name || ''
  const phone      = empData?.phone || ''
  const email      = empData?.email || userEmail
  const photo      = empData?.profilePhoto || null
  const employeeCode = empData?.employeeCode || ''

  // ── Render card to canvas ──────────────────────────────────────────────────
  async function toCanvas(bg = '#ffffff') {
    if (!cardRef.current) throw new Error('Card not found')
    return html2canvas(cardRef.current, {
      scale: 3, useCORS: true, allowTaint: false,
      backgroundColor: bg, logging: false,
    })
  }

  // ── Download as PNG ────────────────────────────────────────────────────────
  async function downloadAsPNG() {
    setBusy(true)
    try {
      const canvas = await toCanvas(null as any)
      const link = document.createElement('a')
      link.download = `${fullName.replace(/\s+/g, '_')}_Business_Card_${face}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Business card downloaded as image!')
    } catch {
      toast.error('Failed to download image')
    }
    setBusy(false)
  }

  // ── Download as PDF ────────────────────────────────────────────────────────
  async function downloadAsPDF() {
    setBusy(true)
    try {
      const canvas = await toCanvas('#ffffff')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85, 54)
      pdf.save(`${fullName.replace(/\s+/g, '_')}_Business_Card.pdf`)
      toast.success('Business card downloaded as PDF!')
    } catch {
      toast.error('Failed to download PDF')
    }
    setBusy(false)
  }

  // ── Share on WhatsApp as image ────────────────────────────────────────────
  async function shareWhatsApp() {
    setBusy(true)
    try {
      const canvas = await toCanvas('#ffffff')

      canvas.toBlob(async (blob) => {
        if (!blob) { toast.error('Failed to generate image'); setBusy(false); return }

        const file = new File([blob], `${fullName.replace(/\s+/g, '_')}_Business_Card.png`, { type: 'image/png' })

        // Try Web Share API (works natively on mobile Chrome/Safari)
        if (typeof navigator !== 'undefined' && (navigator as any).canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${fullName} — Helvino Technologies Ltd` })
            setBusy(false)
            return
          } catch (shareErr: any) {
            // User cancelled share or share failed — fall through to download
            if (shareErr?.name === 'AbortError') { setBusy(false); return }
          }
        }

        // Desktop / unsupported: download image + open WhatsApp text
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = file.name; a.click()
        URL.revokeObjectURL(url)

        setTimeout(() => {
          const msg = [
            `*${fullName}*`,
            jobTitle,
            department ? `${department} · Helvino Technologies Ltd` : 'Helvino Technologies Ltd',
            '',
            phone ? `📱 ${phone}` : '',
            `📞 ${COMPANY_PHONE}`,
            `✉ ${email}`,
            `🌐 helvino.org`,
            '',
            'M-Pesa Paybill: 522533 | A/c: 8071524',
          ].filter(Boolean).join('\n')
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          toast.success('Card image saved — attach it in WhatsApp chat!', { duration: 5000 })
          setBusy(false)
        }, 500)
      }, 'image/png')
    } catch {
      toast.error('Failed to share on WhatsApp')
      setBusy(false)
    }
  }

  // ── Share via Email ────────────────────────────────────────────────────────
  function shareEmail() {
    const subject = encodeURIComponent(`${fullName} — Helvino Technologies Ltd`)
    const body = encodeURIComponent([
      `Contact Details — ${fullName}`,
      '',
      `Name:       ${fullName}`,
      `Title:      ${jobTitle}`,
      department ? `Department: ${department}` : '',
      `Company:    Helvino Technologies Ltd`,
      '',
      phone ? `Mobile:     ${phone}` : '',
      `Office:     ${COMPANY_PHONE}`,
      `Email:      ${email}`,
      `Website:    helvino.org`,
      '',
      'M-Pesa Paybill: 522533 | Account: 8071524',
    ].filter(Boolean).join('\n'))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Business Card</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Your professional Helvino card — download, print, or share instantly
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

          {/* Card container */}
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
            <button onClick={downloadAsPDF} disabled={busy}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
            <button onClick={downloadAsPNG} disabled={busy}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PNG Image
            </button>
            <button onClick={shareWhatsApp} disabled={busy}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-colors disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              WhatsApp
            </button>
            <button onClick={shareEmail}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors">
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
              <Printer className="w-4 h-4" />
              Print
            </button>
            {typeof navigator !== 'undefined' && (navigator as any).share && (
              <button onClick={async () => {
                setBusy(true)
                try {
                  const canvas = await toCanvas('#ffffff')
                  canvas.toBlob(async (blob) => {
                    if (!blob) return
                    const file = new File([blob], `${fullName}_Business_Card.png`, { type: 'image/png' })
                    await navigator.share({ files: [file], title: `${fullName} — Helvino Technologies Ltd` })
                  }, 'image/png')
                } catch { toast.error('Share failed') }
                setBusy(false)
              }} disabled={busy}
                className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
                <Share2 className="w-4 h-4" />
                Share Image
              </button>
            )}
          </div>

          {/* WhatsApp tip */}
          <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-xs text-green-700">
            <strong>WhatsApp tip:</strong> On mobile, the card image will open the share sheet directly.
            On desktop, the card is saved as an image — attach it in WhatsApp Web.
          </div>
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
                  <div style={{ width: '32px', height: '20px', borderRadius: '5px', background: `linear-gradient(135deg, ${t.dark}, ${t.mid})`, flexShrink: 0 }} />
                  <span className="text-slate-700">{t.name}</span>
                  {theme.id === t.id && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Card details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Your Card Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 flex-shrink-0">Name</span>
                <span className="font-semibold text-slate-800 text-right truncate">{fullName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 flex-shrink-0">Title</span>
                <span className="font-semibold text-slate-800 text-right truncate">{jobTitle}</span>
              </div>
              {department && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 flex-shrink-0">Dept</span>
                  <span className="font-semibold text-slate-800 text-right truncate">{department}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 flex-shrink-0">Mobile</span>
                <span className="font-semibold text-slate-800">{phone || <span className="text-slate-300 italic">not set</span>}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 flex-shrink-0">Office</span>
                <span className="font-semibold text-slate-800">{COMPANY_PHONE}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 flex-shrink-0">Email</span>
                <span className="font-semibold text-slate-800 text-right truncate text-xs max-w-36">{email}</span>
              </div>
              {employeeCode && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 flex-shrink-0">ID</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">{employeeCode}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Update phone &amp; photo from your{' '}
              <a href="/dashboard/profile" className="text-blue-600 hover:underline">Profile page</a>.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 mb-2">💡 Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1.5 leading-relaxed list-disc list-inside">
              <li>Use <strong>PDF</strong> for professional printing</li>
              <li>Use <strong>PNG</strong> for WhatsApp status / social media</li>
              <li>On mobile, <strong>WhatsApp</strong> opens share sheet with image</li>
              <li>Print on <strong>300gsm</strong> coated card for best quality</li>
              <li>Standard size: <strong>85mm × 54mm</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print styles */}
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
