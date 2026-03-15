'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronDown, ChevronRight, Download, BookOpen, HelpCircle } from 'lucide-react'

interface Section { heading: string; body: string[] }
interface Chapter { id: string; title: string; sections: Section[] }

const chapters: Chapter[] = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    sections: [
      {
        heading: 'Logging In',
        body: [
          'Open your browser and go to https://helvino-hrms.onrender.com/login.',
          'Click the "Client Portal" tab.',
          'Enter your email address and password provided by Helvino Technologies Ltd.',
          'Click Sign In. You will land on your Client Portal dashboard.',
          'If you have forgotten your password, contact your account manager at Helvino Technologies Ltd.',
        ],
      },
      {
        heading: 'Navigating the Portal',
        body: [
          'The left sidebar shows all sections of your client portal.',
          'The top bar shows the current section name. Click the bell icon to see notifications.',
          'On mobile, tap the ☰ icon to open the sidebar.',
          'Click Sign Out at the bottom of the sidebar to log out securely.',
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    title: '2. My Dashboard',
    sections: [
      {
        heading: 'What You See on Your Dashboard',
        body: [
          'Your dashboard gives a quick overview of your account with Helvino Technologies Ltd.',
          'Active Subscriptions: services you are currently subscribed to.',
          'Outstanding Invoices: invoices awaiting payment.',
          'Open Support Tickets: unresolved support requests.',
          'Recent activity and announcements from your account manager.',
        ],
      },
    ],
  },
  {
    id: 'services',
    title: '3. Service Requests',
    sections: [
      {
        heading: 'Requesting a New Service',
        body: [
          'Go to Service Requests in the sidebar.',
          'Click "New Request". Describe the service you need and provide any relevant details.',
          'Submit the request. Your account manager will review it and respond within 1–2 business days.',
          'You can track the status of each request (Pending, In Progress, Completed, Cancelled).',
        ],
      },
      {
        heading: 'Viewing Existing Requests',
        body: [
          'All your service requests are listed with their current status.',
          'Click any request to see the full details and any updates from the Helvino team.',
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: '4. My Projects',
    sections: [
      {
        heading: 'Tracking Project Progress',
        body: [
          'Go to My Projects in the sidebar.',
          'Projects are work being done for you by Helvino Technologies Ltd.',
          'Each project shows: name, current phase, progress percentage, and key milestones.',
          'Click a project to see detailed status updates, deliverables, and timelines.',
          'Contact your account manager if a project milestone is overdue.',
        ],
      },
    ],
  },
  {
    id: 'quotations',
    title: '5. Quotations',
    sections: [
      {
        heading: 'Reviewing a Quotation',
        body: [
          'Go to Quotations in the sidebar.',
          'When Helvino sends you a quotation it will appear here with status "Sent".',
          'Click the quotation to view the full breakdown: services, quantities, unit prices, tax, and total.',
          'To accept the quotation, click "Approve". To decline, click "Reject" and optionally leave a reason.',
          'Approved quotations lead to an invoice being generated.',
        ],
      },
    ],
  },
  {
    id: 'invoices',
    title: '6. Invoices',
    sections: [
      {
        heading: 'Viewing Your Invoices',
        body: [
          'Go to Invoices in the sidebar.',
          'All invoices issued to you are listed: invoice number, amount, due date, and status.',
          'Status options: Draft, Sent, Partially Paid, Paid, Overdue, Cancelled.',
          'Click an invoice to see the full breakdown and payment history.',
        ],
      },
      {
        heading: 'Making a Payment',
        body: [
          'To pay an invoice, use the bank details or M-Pesa paybill provided on the invoice.',
          'Once you have paid, notify your account manager or raise a support ticket with the payment reference.',
          'The invoice status will be updated to Paid or Partially Paid once confirmed.',
        ],
      },
    ],
  },
  {
    id: 'subscriptions',
    title: '7. Subscriptions',
    sections: [
      {
        heading: 'Viewing Your Subscriptions',
        body: [
          'Go to Subscriptions in the sidebar.',
          'Each subscription shows: service name, start date, renewal/expiry date, billing frequency, and status.',
          'Status options: Active, Expiring Soon, Expired, Cancelled.',
          'You will receive a notification 30 days before a subscription expires.',
        ],
      },
      {
        heading: 'Renewing a Subscription',
        body: [
          'To renew an expiring subscription, raise a Support Ticket or contact your account manager.',
          'Your account manager will process the renewal and update the subscription dates.',
        ],
      },
    ],
  },
  {
    id: 'tickets',
    title: '8. Support Tickets',
    sections: [
      {
        heading: 'Raising a Support Ticket',
        body: [
          'Go to Support Tickets in the sidebar.',
          'Click "New Ticket". Enter a subject, describe your issue or question in detail, and set a priority level.',
          'Click Submit. The Helvino support team will respond within 24 hours on business days.',
        ],
      },
      {
        heading: 'Following Up',
        body: [
          'Open your ticket to see the reply thread. You can add more messages at any time.',
          'If your issue is urgent, set priority to "Urgent" when creating the ticket, or call 0703 445 756.',
          'Once your issue is resolved, click "Close Ticket". You can re-open it if the issue returns.',
        ],
      },
    ],
  },
  {
    id: 'documents',
    title: '9. Documents',
    sections: [
      {
        heading: 'Accessing Shared Documents',
        body: [
          'Go to Documents in the sidebar.',
          'Helvino shares important documents here: contracts, agreements, SLAs, reports, and deliverables.',
          'Click any document to download it.',
          'If a document is missing or you need additional documents, raise a Support Ticket.',
        ],
      },
    ],
  },
  {
    id: 'profile',
    title: '10. My Profile',
    sections: [
      {
        heading: 'Updating Your Details',
        body: [
          'Go to My Profile in the sidebar.',
          'Update your contact information: name, phone number, and email address.',
          'Click Save to apply changes.',
          'To change your password, click "Change Password", enter your current password and your new password, then confirm.',
          'Contact your account manager if you need to update your company name or billing address.',
        ],
      },
    ],
  },
  {
    id: 'help',
    title: '11. Help & Contact',
    sections: [
      {
        heading: 'Getting Support',
        body: [
          'For technical issues with the portal, raise a Support Ticket.',
          'For billing queries, contact accounts@helvino.org.',
          'For general inquiries, call Helvino Technologies Ltd: 0703 445 756.',
          'Business hours: Monday–Friday 8:00 AM – 6:00 PM (EAT).',
          'Website: helvinocrm.org',
        ],
      },
    ],
  },
]

export default function ClientHelpPage() {
  const { data: session } = useSession()
  const clientName = (session?.user as any)?.client?.name || session?.user?.name || 'Client'
  const [open, setOpen] = useState<Set<string>>(new Set([chapters[0].id]))

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpen(new Set(chapters.map(c => c.id)))
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, nav, header, footer, [data-print-hide] { display: none !important; }
          body, html { background: white !important; }
          main { padding: 0 !important; overflow: visible !important; }
          [data-accordion-body] { display: block !important; max-height: none !important; overflow: visible !important; }
          [data-chapter] { page-break-before: always; break-before: page; }
          [data-chapter]:first-of-type { page-break-before: avoid; break-before: avoid; }
          [data-toc] { page-break-after: always; break-after: page; }
          h2 { page-break-after: avoid; font-size: 14pt; }
          h3 { page-break-after: avoid; font-size: 12pt; }
          p, li { font-size: 10pt; line-height: 1.5; }
          @page { margin: 18mm 15mm; size: A4; }
        }
      ` }} />

      <div className="max-w-4xl space-y-6">

        {/* Cover */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-blue-200 text-sm font-semibold tracking-wider uppercase">Helvino Technologies Ltd</div>
                  <h1 className="text-2xl font-black">Client Portal Guide</h1>
                </div>
              </div>
              <p className="text-blue-200 text-sm">
                For: <span className="text-white font-bold">{clientName}</span>
                &nbsp;·&nbsp;{new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-blue-300 text-xs mt-1">
                This guide covers everything you can do in your Helvino client portal.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap" data-print-hide>
              <button
                onClick={expandAll}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <HelpCircle className="w-4 h-4" /> Expand All
              </button>
              <button
                onClick={() => { expandAll(); setTimeout(() => window.print(), 300) }}
                className="flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-black transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-toc>
          <h2 className="text-lg font-black text-slate-900 mb-4">Table of Contents</h2>
          <ol className="space-y-1.5">
            {chapters.map((ch, idx) => (
              <li key={ch.id} className="flex items-center gap-3">
                <span className="text-blue-600 font-bold text-sm w-6 flex-shrink-0">{idx + 1}.</span>
                <button
                  data-print-hide
                  onClick={() => {
                    setOpen(prev => new Set([...prev, ch.id]))
                    setTimeout(() => document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  }}
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 text-left transition-colors"
                >
                  {ch.title.replace(/^\d+\.\s*/, '')}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Chapters */}
        {chapters.map((ch) => {
          const isOpen = open.has(ch.id)
          return (
            <div key={ch.id} id={ch.id} data-chapter className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                data-print-hide
                onClick={() => toggle(ch.id)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <h2 className="text-base font-black text-slate-900">{ch.title}</h2>
                {isOpen
                  ? <ChevronDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  : <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />}
              </button>

              <div data-accordion-body style={{ display: isOpen ? 'block' : 'none' }}>
                <div className="px-6 pb-6 space-y-5 border-t border-slate-100">
                  {ch.sections.map((sec, si) => (
                    <div key={si} className="pt-4">
                      <h3 className="text-sm font-black text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
                        {sec.heading}
                      </h3>
                      <ul className="space-y-2">
                        {sec.body.map((line, li) => (
                          <li key={li} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                            <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800" data-print-hide>
          <strong>Tip:</strong> Click "Download PDF" at the top to save this guide. In the print dialog, choose "Save as PDF". For best results use Google Chrome.
        </div>

      </div>
    </>
  )
}
