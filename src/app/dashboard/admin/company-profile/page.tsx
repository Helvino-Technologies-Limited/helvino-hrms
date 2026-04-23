'use client'

import { useRef, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'

const LOGO = 'https://helvino.org/images/logo.png'
const TOTAL = 8

/* ── Shared sub-components ──────────────────────────────────────── */

function Watermark() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 0,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="" crossOrigin="anonymous"
        style={{ width: 380, height: 380, objectFit: 'contain', opacity: 0.04 }} />
    </div>
  )
}

function Hdr() {
  return (
    <div style={{
      padding: '13px 36px', borderBottom: '2.5px solid #1d4ed8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="Helvino" crossOrigin="anonymous"
          style={{ height: 34, objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1d4ed8', letterSpacing: 0.5 }}>
            HELVINO TECHNOLOGIES LIMITED
          </div>
          <div style={{ fontSize: 8.5, color: '#64748b' }}>
            Your Trusted Technology Partner · helvino.org
          </div>
        </div>
      </div>
      <div style={{ fontSize: 8.5, color: '#94a3b8', textAlign: 'right' }}>
        <div>Reg. No: PVT-6LULDGP7</div>
        <div>Est. 2019 · Siaya, Kenya</div>
      </div>
    </div>
  )
}

function Ftr({ n }: { n: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '9px 36px', borderTop: '1px solid #e2e8f0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: '#fff',
    }}>
      <div style={{ fontSize: 8, color: '#94a3b8' }}>
        © 2026 Helvino Technologies Limited · Corporate Profile · Confidential
      </div>
      <div style={{ fontSize: 8, color: '#94a3b8' }}>Page {n} of {TOTAL}</div>
    </div>
  )
}

function SectionTitle({ sub, title }: { sub: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1d4ed8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>
        {sub}
      </div>
      <div style={{ fontSize: 21, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{title}</div>
      <div style={{ height: 3, width: 44, background: '#1d4ed8', borderRadius: 2 }} />
    </div>
  )
}

/* ── Page wrapper ────────────────────────────────────────────────── */
function Page({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div className="pdf-page" style={{
      width: 794, height: 1123, background: '#fff',
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
    }}>
      <Watermark />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 1 — COVER
══════════════════════════════════════════════════════════════════ */
function Cover() {
  return (
    <Page>
      {/* Top accent */}
      <div style={{ background: '#1d4ed8', height: 7 }} />

      {/* Logo + reg */}
      <div style={{ padding: '22px 42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="Helvino" crossOrigin="anonymous" style={{ height: 54, objectFit: 'contain' }} />
        <div style={{ fontSize: 9, color: '#64748b', textAlign: 'right', lineHeight: 1.8 }}>
          <div>Registration No: PVT-6LULDGP7</div>
          <div>info@helvino.org · helvino.org</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 70px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 5, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 18 }}>
          Corporate Profile
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginBottom: 18 }}>
          Helvino Technologies<br />Limited
        </div>
        <div style={{ width: 72, height: 4, background: '#1d4ed8', borderRadius: 2, marginBottom: 26 }} />
        <div style={{ fontSize: 15, color: '#475569', fontWeight: 500, maxWidth: 440, lineHeight: 1.7 }}>
          Transforming Businesses Across Kenya with Cutting-Edge, Affordable IT Solutions
        </div>
        <div style={{ marginTop: 28, padding: '11px 30px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 600 }}>Your Trusted Technology Partner Since 2019</div>
        </div>
      </div>

      {/* Divider image strip */}
      <div style={{ margin: '0 42px', borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#0f172a 0%,#1d4ed8 50%,#0f172a 100%)', padding: '22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {[
            { n: '200+', l: 'Happy Clients' },
            { n: '350+', l: 'Projects Delivered' },
            { n: '98%', l: 'Client Satisfaction' },
            { n: '5+', l: 'Years Experience' },
            { n: '25', l: 'Team Members' },
          ].map(({ n, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa' }}>{n}</div>
              <div style={{ fontSize: 9, color: '#93c5fd', marginTop: 2, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Service tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '22px 42px 0' }}>
        {['Custom Software', 'Web Development', 'Network & WiFi', 'CCTV & Security', 'Cybersecurity', 'IT Support'].map(s => (
          <span key={s} style={{ fontSize: 9, background: '#f1f5f9', color: '#334155', borderRadius: 20, padding: '4px 14px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            {s}
          </span>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#1d4ed8', padding: '14px 42px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 9.5, color: '#bfdbfe' }}>
          📍 Siaya Township, Kenya &nbsp;|&nbsp; 📞 +254 703 445 756 &nbsp;|&nbsp; ✉ info@helvino.org
        </div>
        <div style={{ fontSize: 9.5, color: '#bfdbfe', fontWeight: 700 }}>2026 Edition</div>
      </div>
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 2 — ABOUT + VISION / MISSION / VALUES
══════════════════════════════════════════════════════════════════ */
function About() {
  return (
    <Page>
      <Hdr />
      <div style={{ padding: '24px 36px 60px' }}>
        <SectionTitle sub="About Us" title="Company Overview" />

        <div style={{ fontSize: 9.5, color: '#334155', lineHeight: 1.85, marginBottom: 22 }}>
          <p style={{ marginBottom: 9 }}>
            <strong>Helvino Technologies Limited</strong> is a proudly Kenyan IT solutions company founded
            in <strong>2019</strong> by Kevin Owino Odhiambo. Formally registered in 2026 under registration
            number <strong>PVT-6LULDGP7</strong>, the company has grown into a leading provider of
            comprehensive digital transformation services across East Africa, headquartered in <strong>Siaya Township, Kenya</strong>.
          </p>
          <p style={{ marginBottom: 9 }}>
            With over <strong>200 clients</strong>, <strong>350+ completed projects</strong>, and a <strong>98% client satisfaction rate</strong>,
            Helvino serves diverse sectors including healthcare, education, hospitality, NGOs, and SMEs.
            Our 25-person team operates across 9 specialized departments delivering end-to-end
            digital solutions that empower organizations to thrive in the digital economy.
          </p>
          <p>
            A nationwide network of sales representatives and a 24/7 specialized IT support team allow
            Helvino to bridge the technology gap for businesses of all sizes — delivering high-quality,
            affordable, web-based software solutions accessible on any device, anywhere.
          </p>
        </div>

        {/* Vision + Mission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#0f172a', borderRadius: 10, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, background: '#1d4ed8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔭</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#60a5fa' }}>Our Vision</div>
            </div>
            <div style={{ fontSize: 9.5, color: '#cbd5e1', lineHeight: 1.75 }}>
              To be East Africa&apos;s most trusted and innovative technology partner, empowering every
              business and community with accessible, reliable, and transformative digital solutions
              that drive sustainable economic growth and human development.
            </div>
          </div>
          <div style={{ background: '#1d4ed8', borderRadius: 10, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎯</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#bfdbfe' }}>Our Mission</div>
            </div>
            <div style={{ fontSize: 9.5, color: '#eff6ff', lineHeight: 1.75 }}>
              To deliver cutting-edge, affordable IT solutions — including custom software, web development,
              network infrastructure, cybersecurity, and CCTV systems — that solve real business challenges
              and enable our clients to operate with greater efficiency and confidence.
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1d4ed8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Core Values</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { e: '🏆', t: 'Excellence', d: 'We deliver world-class solutions that consistently exceed expectations, maintaining the highest standards in every engagement.' },
              { e: '🤝', t: 'Customer First', d: 'Our clients are at the heart of every decision. We listen, understand pain points, and craft solutions that truly make a difference.' },
              { e: '💡', t: 'Innovation', d: 'We embrace emerging technologies and creative thinking to keep our clients ahead of the curve in a fast-evolving landscape.' },
              { e: '🔒', t: 'Integrity', d: 'We build lasting trust through transparency, honesty, and ethical practice in every relationship and engagement.' },
              { e: '⚡', t: 'Reliability', d: 'With 24/7 support and a proven 98% satisfaction rate, clients know they can count on us when it matters most.' },
              { e: '🌍', t: 'Impact', d: 'We measure success by the tangible positive change we create for businesses, communities, and lives across Kenya and beyond.' },
            ].map(({ e, t, d }) => (
              <div key={t} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 17, marginBottom: 5 }}>{e}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 8.5, color: '#64748b', lineHeight: 1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Ftr n={2} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 3 — LEADERSHIP TEAM
══════════════════════════════════════════════════════════════════ */
function Leadership() {
  const team = [
    {
      name: 'Kevin Owino Odhiambo', title: 'Founder & Chief Executive Officer',
      role: 'Software Engineer', email: 'kevin@helvino.org', phone: '0703 445 756',
      bio: `Kevin is the visionary founder of Helvino Technologies Limited. A seasoned software engineer with
a deep passion for technology-driven business transformation, he leads the company's strategic direction,
product development, and innovation roadmap. His entrepreneurial spirit and technical acumen have been
the driving force behind Helvino's growth from a startup in Siaya to an established IT solutions provider
with a nationwide reach and a 200+ client portfolio.`,
      initials: 'KO', color: '#1d4ed8',
    },
    {
      name: 'Evaline Akoth Ochieng', title: 'Head of Sales & Business Development',
      role: 'Sales & Marketing Leadership', email: 'eva.ochieng@helvino.org', phone: '0724 344 062',
      bio: `Evaline drives Helvino's business development and sales strategy, overseeing a nationwide sales team
of 20 professionals. With deep expertise in client relationship management and market expansion, she has
been instrumental in growing Helvino's client base across Kenya. Her focus on understanding client pain points
has led to the company's industry-leading 98% client satisfaction rate and sustained revenue growth.`,
      initials: 'EA', color: '#7c3aed',
    },
    {
      name: 'Omondi Oliver Otieno', title: 'Human Resource Manager',
      role: 'People & Organizational Development', email: 'oliver@helvino.org', phone: '0757 493 570',
      bio: `Oliver leads Helvino's human resource function, managing recruitment, talent development, employee
relations, and organizational culture. With a team of HR professionals under his guidance, he ensures Helvino
attracts and retains top technology talent while fostering a productive, inclusive workplace. His systematic
approach to HR has supported the company's rapid team growth across 9 departments.`,
      initials: 'OO', color: '#059669',
    },
    {
      name: 'Tracy Kwamboka', title: 'Assistant Human Resource Manager',
      role: 'HR Operations & Compliance', email: 'tracy@helvino.org', phone: '0757 295 452',
      bio: `Tracy supports Helvino's HR operations, handling day-to-day employee management, onboarding,
benefits administration, and HR compliance. Her meticulous attention to detail and commitment to employee
welfare make her an integral part of the leadership team. She plays a key role in maintaining smooth HR
operations and ensuring a positive employee experience across all departments.`,
      initials: 'TK', color: '#d97706',
    },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '24px 36px 60px' }}>
        <SectionTitle sub="Our People" title="Leadership Team" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {team.map(({ name, title, role, email, phone, bio, initials, color }) => (
            <div key={name} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: color, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 11, background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>{title}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>{role}</div>
                </div>
              </div>
              <div style={{ padding: '13px 18px', background: '#f8fafc' }}>
                <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.75, marginBottom: 11, whiteSpace: 'pre-line' }}>{bio}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 8.5, color: '#64748b' }}>
                    <span style={{ color }}>✉ </span>{email}
                  </div>
                  <div style={{ fontSize: 8.5, color: '#64748b' }}>
                    <span style={{ color }}>📞 </span>{phone}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Ftr n={3} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 4 — SERVICES
══════════════════════════════════════════════════════════════════ */
function Services() {
  const svcs = [
    {
      icon: '💻', title: 'Custom Software Development', color: '#1d4ed8', bg: '#eff6ff',
      desc: 'We design and build bespoke software solutions tailored to your unique business requirements. From school management systems to hospital platforms, our solutions are web-based, multi-device, and built for scale.',
      tags: ['Web Applications', 'Mobile-Responsive', 'Database Design', 'API Development', 'System Integration'],
    },
    {
      icon: '🌐', title: 'Web Design & Development', color: '#7c3aed', bg: '#faf5ff',
      desc: 'We create stunning, professional websites that convert visitors into clients. From corporate sites to e-commerce platforms, our designs are modern, fast, and optimized for all devices and search engines.',
      tags: ['Corporate Websites', 'E-Commerce', 'NGO Sites', 'Hotel Websites', 'SEO Optimization'],
    },
    {
      icon: '📡', title: 'Network & WiFi Infrastructure', color: '#0891b2', bg: '#ecfeff',
      desc: 'Professional network design, deployment, and management for businesses of all sizes. We deliver reliable, high-speed connectivity solutions that power your digital operations and support growth.',
      tags: ['LAN/WAN Setup', 'WiFi Deployment', 'Network Security', 'Bandwidth Mgmt', 'Remote Monitoring'],
    },
    {
      icon: '📷', title: 'CCTV & Surveillance Systems', color: '#dc2626', bg: '#fef2f2',
      desc: 'Comprehensive physical security solutions with high-definition CCTV installation and remote monitoring for businesses, homes, schools, hospitals, and public spaces across Kenya.',
      tags: ['HD / 4K Cameras', 'Remote Monitoring', 'Night Vision', 'Cloud Recording', 'Access Control'],
    },
    {
      icon: '🔐', title: 'Cybersecurity Solutions', color: '#059669', bg: '#f0fdf4',
      desc: 'Protect your digital assets with our comprehensive cybersecurity services including vulnerability assessments, penetration testing, security audits, and ongoing monitoring to safeguard your business.',
      tags: ['Vulnerability Assessment', 'Pen Testing', 'Security Audits', 'Data Protection', 'Compliance'],
    },
    {
      icon: '🛠️', title: 'IT Support & Consultancy', color: '#d97706', bg: '#fffbeb',
      desc: 'Round-the-clock IT support and strategic technology consultancy. Our expert team is available 24/7 to resolve issues, optimize systems, and provide guidance on your technology strategy and roadmap.',
      tags: ['24/7 Helpdesk', 'Remote Support', 'On-Site Service', 'IT Strategy', 'System Optimization'],
    },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '24px 36px 60px' }}>
        <SectionTitle sub="What We Offer" title="Our Services" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {svcs.map(({ icon, title, color, bg, desc, tags }) => (
            <div key={title} style={{ background: bg, border: `1px solid ${color}28`, borderRadius: 9, padding: 15, borderLeft: `4px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                <span style={{ fontSize: 21 }}>{icon}</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{title}</div>
              </div>
              <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.7, marginBottom: 9 }}>{desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tags.map(t => (
                  <span key={t} style={{ fontSize: 7.5, background: '#fff', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Ftr n={4} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 5 — PROJECT PORTFOLIO
══════════════════════════════════════════════════════════════════ */
function Portfolio() {
  const projects = [
    { icon: '🏫', name: 'SkulManager – School Management System', url: 'skulmanager.org', cat: 'Education', color: '#1d4ed8', bg: '#eff6ff', desc: 'Comprehensive school management covering enrollment, fee management, academic records, timetabling, parent communication, and staff management. Deployed across multiple schools in Kenya.' },
    { icon: '🏥', name: 'Hospital Management System', url: 'hms-three-nu.vercel.app', cat: 'Healthcare', color: '#dc2626', bg: '#fef2f2', desc: 'Full-featured hospital platform covering patient registration, appointments, clinical records, pharmacy management, billing, and reporting. Built for hospitals of all sizes.' },
    { icon: '🦷', name: 'Dental Clinic Management System', url: 'dental-eight-taupe.vercel.app', cat: 'Healthcare', color: '#7c3aed', bg: '#faf5ff', desc: 'Specialized dental clinic management with patient scheduling, treatment records, billing, dental charting, and appointment reminders for modern dental practices.' },
    { icon: '🔧', name: 'Hardware Management System', url: 'hard-two.vercel.app', cat: 'Retail', color: '#059669', bg: '#f0fdf4', desc: 'Inventory and sales management for hardware shops. Tracks stock levels, manages suppliers, processes sales, and generates financial reports in real time.' },
    { icon: '💊', name: 'Pharmacy Management System', url: 'pmss-coral.vercel.app', cat: 'Healthcare', color: '#d97706', bg: '#fffbeb', desc: 'End-to-end pharmacy management covering drug inventory, prescription tracking, customer management, sales, expiry alerts, and regulatory compliance.' },
    { icon: '💧', name: 'Water Purification Management System', url: 'purify-kappa.vercel.app', cat: 'Utilities', color: '#0891b2', bg: '#ecfeff', desc: 'Management system for water purification and sales covering production tracking, customer orders, delivery management, billing, and inventory control.' },
    { icon: '🏨', name: 'Hotel Management System', url: 'hotel-psi-six.vercel.app', cat: 'Hospitality', color: '#be185d', bg: '#fdf2f8', desc: 'Comprehensive hotel management covering room booking, reservations, check-in/out, billing, housekeeping, restaurant POS, and revenue reporting.' },
    { icon: '⛳', name: 'The Audrey Golf Resort Website', url: 'theaudreyresort.org', cat: 'Hospitality', color: '#1d4ed8', bg: '#eff6ff', desc: 'Premium corporate website featuring online booking, amenities showcase, event management, gallery, and client engagement for a leading Kenyan resort.' },
    { icon: '🤝', name: 'Lifted to Lift – NGO Website', url: 'liftedtolift.org', cat: 'NGO', color: '#059669', bg: '#f0fdf4', desc: 'Impact-focused NGO website featuring program showcases, donation integration, volunteer management, impact reporting, and community engagement tools.' },
    { icon: '🌱', name: 'Mbelee Maisha – NGO Website', url: 'mbeleemaisha.org', cat: 'NGO', color: '#7c3aed', bg: '#faf5ff', desc: 'Responsive NGO website with program highlights, fundraising capabilities, news & blog, volunteer portal, and community impact showcases.' },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '22px 36px 60px' }}>
        <SectionTitle sub="Our Work" title="Project Portfolio" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {projects.map(({ icon, name, url, cat, color, bg, desc }) => (
            <div key={name} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 8, padding: 11, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 7, background: color, color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: 7.5, color: color, fontFamily: 'monospace' }}>{url}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 13, padding: '9px 14px', background: '#f1f5f9', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, color: '#64748b' }}>
            ✦ Helvino has delivered <strong>350+ projects</strong> across Kenya including church websites (cjck.org), corporate portals,
            e-commerce platforms, and enterprise systems. Visit <strong>helvino.org</strong> to explore our full portfolio.
          </div>
        </div>
      </div>
      <Ftr n={5} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 6 — TARGET MARKET + USP
══════════════════════════════════════════════════════════════════ */
function MarketUSP() {
  const markets = [
    { e: '🏥', t: 'Healthcare', d: 'Hospitals, clinics, pharmacies, and dental practices seeking digital management solutions.' },
    { e: '🏫', t: 'Education', d: 'Schools, colleges, and training institutions requiring student and academic management platforms.' },
    { e: '🏢', t: 'Enterprises & SMEs', d: 'Businesses of all sizes seeking ERP, CRM, inventory, and operational software systems.' },
    { e: '🤝', t: 'NGOs & Non-Profits', d: 'Non-governmental organizations needing websites, donor management, and impact reporting tools.' },
    { e: '🏨', t: 'Hospitality', d: 'Hotels, resorts, restaurants, and tourism operators requiring booking and management systems.' },
    { e: '🏠', t: 'Homes & Residences', d: 'Homes and residential estates seeking CCTV surveillance, WiFi installation, and security systems.' },
    { e: '🌐', t: 'Organizations & Projects', d: 'Any organization or project requiring a professional website, web portal, or digital presence.' },
    { e: '💧', t: 'Utilities & Agriculture', d: 'Water companies, utilities, and agribusinesses needing tracking, billing, and management systems.' },
  ]

  const usps = [
    { icon: '🌍', title: 'Nationwide Sales Coverage', desc: 'Helvino operates a dedicated software sales team across Kenya, ensuring clients in every county can access our solutions with personalized on-the-ground support.' },
    { icon: '💰', title: 'Affordable & Competitive Pricing', desc: 'We offer world-class technology solutions at prices that are significantly more affordable than international competitors, making digital transformation accessible to all.' },
    { icon: '📱', title: 'Web-Based & Device Agnostic', desc: 'All our software solutions are web-based and fully responsive, accessible from any device — phone, tablet, or desktop — with no specialized hardware required.' },
    { icon: '🎯', title: 'Client-Centric Approach', desc: 'We focus on understanding each client\'s specific pain points and build solutions around their needs, resulting in our 98% satisfaction rate and long-term client relationships.' },
    { icon: '⚡', title: '24/7 Specialized IT Support', desc: 'Our dedicated technical team provides round-the-clock support, ensuring minimal downtime and rapid resolution of any issues that arise post-deployment.' },
    { icon: '🔒', title: 'End-to-End Solutions', desc: 'From software development to network setup, CCTV, cybersecurity, and ongoing support, Helvino is a one-stop technology partner for all your IT needs.' },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '22px 36px 60px' }}>
        {/* Target Market */}
        <SectionTitle sub="Who We Serve" title="Target Market" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 26 }}>
          {markets.map(({ e, t, d }) => (
            <div key={t} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 11, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{e}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* USP */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1d4ed8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Why Choose Us</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Unique Selling Points</div>
          <div style={{ height: 3, width: 44, background: '#1d4ed8', borderRadius: 2, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {usps.map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 11, background: '#f8fafc', borderRadius: 8, padding: 13, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 8.5, color: '#475569', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Ftr n={6} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 7 — TEAM STRUCTURE
══════════════════════════════════════════════════════════════════ */
function TeamStructure() {
  const depts = [
    { icon: '💼', name: 'Sales & Marketing', count: 20, color: '#1d4ed8', bg: '#eff6ff', desc: 'Business development, client acquisition, and marketing across Kenya\'s regions. The largest department driving Helvino\'s nationwide growth.' },
    { icon: '👥', name: 'Human Resources', count: 4, color: '#7c3aed', bg: '#faf5ff', desc: 'People management, recruitment, talent development, employee relations, onboarding, and organizational development.' },
    { icon: '💻', name: 'Software Development', count: 0, color: '#059669', bg: '#f0fdf4', desc: 'Custom software engineering and development — building the platforms and systems that power our clients\' operations.' },
    { icon: '🌐', name: 'Network & Infrastructure', count: 0, color: '#0891b2', bg: '#ecfeff', desc: 'Network design, deployment, and management services. LAN/WAN setup, WiFi infrastructure, and network security.' },
    { icon: '📷', name: 'CCTV & Security Systems', count: 0, color: '#dc2626', bg: '#fef2f2', desc: 'Physical security and surveillance solutions — high-definition CCTV systems, access control, and remote monitoring.' },
    { icon: '🔐', name: 'Cybersecurity', count: 0, color: '#d97706', bg: '#fffbeb', desc: 'Information security and compliance — vulnerability assessments, penetration testing, and security audits.' },
    { icon: '💰', name: 'Finance & Operations', count: 0, color: '#be185d', bg: '#fdf2f8', desc: 'Financial management and operations — accounting, budgeting, compliance, and administrative functions.' },
    { icon: '🛠️', name: 'IT Support', count: 0, color: '#475569', bg: '#f8fafc', desc: 'Helpdesk and technical support services — 24/7 client support, system maintenance, and troubleshooting.' },
    { icon: '🏢', name: 'Reception & Administration', count: 1, color: '#334155', bg: '#f1f5f9', desc: 'First point of contact for visitors, clients, and staff. Handles communication coordination and administrative operations.' },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '22px 36px 60px' }}>
        <SectionTitle sub="Our Organization" title="Team Structure" />

        {/* Summary */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
          {[
            { n: '25', l: 'Total Employees', c: '#1d4ed8' },
            { n: '9', l: 'Departments', c: '#7c3aed' },
            { n: '20', l: 'Sales Team', c: '#059669' },
            { n: '4', l: 'HR Team', c: '#d97706' },
          ].map(({ n, l, c }) => (
            <div key={l} style={{ flex: 1, background: c, borderRadius: 9, padding: '14px 16px', textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{n}</div>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Departments grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11 }}>
          {depts.map(({ icon, name, count, color, bg, desc }) => (
            <div key={name} style={{ background: bg, border: `1px solid ${color}28`, borderRadius: 9, overflow: 'hidden' }}>
              <div style={{ background: color, padding: '10px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#fff' }}>{name}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '2px 9px' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{count}</span>
                </div>
              </div>
              <div style={{ padding: '9px 13px' }}>
                <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.65 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Org note */}
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8 }}>
          <div style={{ fontSize: 8.5, color: '#64748b', lineHeight: 1.6 }}>
            <strong>Organizational Note:</strong> Helvino Technologies operates under the leadership of the Founder & CEO, supported by heads of each department.
            The Sales & Marketing department constitutes the largest workforce with a nationwide field team. All technical departments maintain specialist expertise
            with cross-functional collaboration on client projects. The HR department oversees all people functions company-wide.
          </div>
        </div>
      </div>
      <Ftr n={7} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 8 — TESTIMONIALS + CONTACT
══════════════════════════════════════════════════════════════════ */
function TestimonialsContact() {
  const reviews = [
    { name: 'Vincent Ondigo', org: 'The Audrey Golf Resort', quote: 'Your time management and planning align well with clients\' expectations. Great work and positive results. We are happy to have partnered with Helvino.' },
    { name: 'Elizabeth Atieno', org: 'Mbelee Maisha', quote: 'Delivered ahead of schedule at a fair price. Communication was clear throughout, the website works perfectly on all devices, and training was provided post-launch.' },
    { name: 'Derick Amolloh', org: 'KABABA PRINTS', quote: 'Fast and reliable services, easy to use. I\'m a very happy client! Helvino delivered exactly what we needed with professionalism.' },
    { name: 'Mukubwa', org: 'School Client', quote: 'Helvino built an amazing school management system that has transformed how we run our institution. Highly recommend their services to any school.' },
    { name: 'Lorna Kwodi', org: 'Splash & Shine CarWash', quote: 'The carwash management system was built faster than the agreed deadline. Exceptional service, happy client!' },
    { name: 'Thomas Onyango', org: 'Splash and Shine', quote: 'Provides working apps and websites. Any improvements and updates requested are completed promptly. Very professional team.' },
  ]

  return (
    <Page>
      <Hdr />
      <div style={{ padding: '22px 36px 60px' }}>
        {/* Testimonials */}
        <SectionTitle sub="Client Voices" title="Testimonials" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 26 }}>
          {reviews.map(({ name, org, quote }) => (
            <div key={name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: 14 }}>
              <div style={{ fontSize: 20, color: '#1d4ed8', marginBottom: 7, lineHeight: 1 }}>"</div>
              <div style={{ fontSize: 8.5, color: '#334155', lineHeight: 1.75, marginBottom: 11, fontStyle: 'italic' }}>{quote}</div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#0f172a' }}>{name}</div>
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{org}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1d4ed8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Get in Touch</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Contact Information</div>
        <div style={{ height: 3, width: 44, background: '#1d4ed8', borderRadius: 2, marginBottom: 16 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { icon: '📍', title: 'Headquarters', lines: ['Siaya Township', 'Siaya County, Kenya'] },
            { icon: '📞', title: 'Phone / WhatsApp', lines: ['+254 703 445 756', '+254 110 421 320'] },
            { icon: '✉', title: 'Email', lines: ['info@helvino.org', 'kevin@helvino.org'] },
            { icon: '🌐', title: 'Website', lines: ['helvino.org', 'helvinocrm.org'] },
            { icon: '💼', title: 'LinkedIn', lines: ['linkedin.com/company/', 'helvino-technologies-limited'] },
            { icon: '📅', title: 'Availability', lines: ['24/7 Technical Support', 'Mon–Sat: 8am – 8pm'] },
          ].map(({ icon, title, lines }) => (
            <div key={title} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: '#1d4ed8', marginBottom: 3 }}>{title}</div>
                {lines.map(l => <div key={l} style={{ fontSize: 8.5, color: '#334155', lineHeight: 1.7 }}>{l}</div>)}
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div style={{ background: '#0f172a', borderRadius: 10, padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Ready to Transform Your Business?
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>
              Contact us today for a free consultation and discover how Helvino can power your digital journey.
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Helvino" crossOrigin="anonymous"
              style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
      </div>
      <Ftr n={8} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function CompanyProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const isAuthorized = session?.user?.role === 'SUPER_ADMIN' && session?.user?.email === 'kevin@helvino.org'

  useEffect(() => {
    if (session && !isAuthorized) router.replace('/dashboard')
  }, [session, isAuthorized, router])

  if (!session || !isAuthorized) return null

  async function downloadPDF() {
    if (!profileRef.current) return
    setGenerating(true)
    const toastId = toast.loading('Generating PDF — please wait…')
    try {
      const pages = profileRef.current.querySelectorAll<HTMLElement>('.pdf-page')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
        })
        const img = canvas.toDataURL('image/jpeg', 0.95)
        if (i > 0) pdf.addPage()
        pdf.addImage(img, 'JPEG', 0, 0, 210, 297)
        toast.loading(`Rendering page ${i + 1} of ${pages.length}…`, { id: toastId })
      }

      pdf.save('Helvino-Technologies-Corporate-Profile-2026.pdf')
      toast.success('PDF downloaded successfully!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Company Profile
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Full corporate profile ready for tender documents, client pitches, and partnerships
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-blue-200 transition-all"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-blue-900 text-sm">8-Page Full Corporate Profile</div>
          <div className="text-blue-700 text-xs mt-1">
            Includes: Cover · Company Overview · Vision/Mission/Values · Leadership Team · Services ·
            Project Portfolio · Target Market & USP · Team Structure · Testimonials · Contact Information.
            Formatted for A4, ready for tender submissions and client presentations.
          </div>
        </div>
      </div>

      {/* PDF Preview — horizontally scrollable if viewport is narrow */}
      <div className="bg-slate-200 rounded-2xl p-6 overflow-x-auto">
        <div
          ref={profileRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: 794,
            margin: '0 auto',
          }}
        >
          <Cover />
          <About />
          <Leadership />
          <Services />
          <Portfolio />
          <MarketUSP />
          <TeamStructure />
          <TestimonialsContact />
        </div>
      </div>
    </div>
  )
}
