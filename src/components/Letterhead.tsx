import React from 'react'

interface LetterheadProps {
  children: React.ReactNode
  /** Name of the person signing the document — leave blank to show empty line */
  signerName?: string
  /** Job title / designation of the signer */
  signerTitle?: string
  /** Show the signature + stamp section (default true) */
  showSignature?: boolean
}

const COMPANY = {
  name: 'Helvino Technologies Ltd',
  address: 'Nairobi, Kenya',
  phone: '0110421320',
  email: 'helvinotechltd@gmail.com',
  website: 'helvino.org',
  paybill: '522533',
  account: '8071524',
  regLine: 'Reg. No. · P.O Box 12345-00100 Nairobi',
}

export default function Letterhead({
  children,
  signerName,
  signerTitle,
  showSignature = true,
}: LetterheadProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#1e293b',
        width: '100%',
      }}
    >
      {/* ── LETTERHEAD HEADER ────────────────────────────────────────── */}
      <div style={{ padding: '24px 40px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://helvino.org/images/logo.png"
            alt="Helvino Technologies"
            style={{ height: '56px', width: 'auto', objectFit: 'contain', display: 'block' }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Company details — right aligned */}
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', lineHeight: '1.2' }}>
            Helvino Technologies Ltd
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.7' }}>
            <div>{COMPANY.address} · {COMPANY.regLine}</div>
            <div>
              <span style={{ marginRight: '12px' }}>📞 {COMPANY.phone}</span>
              <span>✉ {COMPANY.email}</span>
            </div>
            <div>
              <span style={{ marginRight: '12px' }}>🌐 {COMPANY.website}</span>
              <span>M-Pesa Paybill: <strong>{COMPANY.paybill}</strong> · A/c: <strong>{COMPANY.account}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Blue accent bar */}
      <div style={{ margin: '12px 40px 0', height: '4px', background: 'linear-gradient(90deg, #1d4ed8, #0ea5e9)', borderRadius: '2px' }} />
      {/* Thin grey line */}
      <div style={{ margin: '3px 40px 0', height: '1px', background: '#e2e8f0' }} />

      {/* ── DOCUMENT BODY ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 40px' }}>
        {children}
      </div>

      {showSignature && (
        <>
          {/* Thin separator before signature */}
          <div style={{ margin: '8px 40px', height: '1px', background: '#e2e8f0' }} />

          {/* ── SIGNATURE + STAMP SECTION ──────────────────────────────── */}
          <div style={{ padding: '16px 40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'flex-start' }}>
            {/* Left: Signature */}
            <div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
                Authorized Signatory
              </div>

              {/* Signature space */}
              <div style={{ height: '48px', borderBottom: '1.5px solid #334155', marginBottom: '6px', position: 'relative' }}>
                {signerName && (
                  <div style={{ position: 'absolute', bottom: '4px', fontSize: '11px', color: '#1e293b', fontStyle: 'italic', fontWeight: '600' }}>
                    {signerName}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.8' }}>
                <div>
                  <span style={{ fontWeight: '700', marginRight: '6px' }}>Name:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', display: 'inline-block', minWidth: '140px', paddingBottom: '1px' }}>
                    {signerName || ''}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', marginRight: '6px' }}>Designation:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', display: 'inline-block', minWidth: '120px', paddingBottom: '1px' }}>
                    {signerTitle || ''}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', marginRight: '6px' }}>Date:</span>
                  <span style={{ borderBottom: '1px solid #94a3b8', display: 'inline-block', minWidth: '120px', paddingBottom: '1px' }}>
                    {''}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Company Stamp */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Official Stamp
              </div>
              {/* Stamp circle */}
              <div style={{
                width: '110px', height: '110px',
                borderRadius: '50%',
                border: '2.5px dashed #94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                background: '#f8fafc',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: '600', letterSpacing: '1px' }}>STAMP HERE</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '3px solid #1d4ed8', margin: '0 40px', paddingTop: '8px', paddingBottom: '16px' }}>
        <div style={{
          fontSize: '8.5px', color: '#64748b', textAlign: 'center', lineHeight: '1.6',
        }}>
          <strong style={{ color: '#1d4ed8' }}>Helvino Technologies Ltd</strong>
          {' · '}{COMPANY.address}
          {' · '}{COMPANY.phone}
          {' · '}{COMPANY.email}
          {' · '}{COMPANY.website}
          {' · '}M-Pesa Paybill: {COMPANY.paybill} A/c: {COMPANY.account}
        </div>
      </div>
    </div>
  )
}
