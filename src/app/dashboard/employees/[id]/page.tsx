'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, User,
  DollarSign, Clock, Star, Award, Briefcase, Edit,
  FileText, Send, Download, RefreshCw, CheckCircle2, AlertCircle,
  Eye, Loader2, X, ShieldAlert
} from 'lucide-react'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const TERMINATION_REASONS = [
  { value: 'REDUNDANCY',          label: 'Redundancy' },
  { value: 'GROSS_MISCONDUCT',    label: 'Gross Misconduct' },
  { value: 'PERFORMANCE',         label: 'Poor Performance' },
  { value: 'RESIGNATION',         label: 'Resignation Accepted' },
  { value: 'CONTRACT_EXPIRY',     label: 'Expiry of Fixed-Term Contract' },
  { value: 'PROBATION_FAILURE',   label: 'Failure to Complete Probation' },
  { value: 'MUTUAL_AGREEMENT',    label: 'Mutual Agreement' },
  { value: 'OTHER',               label: 'Other' },
]

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const canTerminate = ['SUPER_ADMIN', 'HR_MANAGER'].includes(userRole)

  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Contract state
  const [contract, setContract] = useState<any>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractHtml, setContractHtml] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Termination letter state
  const [termLetter, setTermLetter] = useState<any>(null)
  const [termHtml, setTermHtml] = useState<string | null>(null)
  const [showTermPreview, setShowTermPreview] = useState(false)
  const [showTermForm, setShowTermForm] = useState(false)
  const [termGenerating, setTermGenerating] = useState(false)
  const [termSending, setTermSending] = useState(false)
  const [termResending, setTermResending] = useState(false)
  const [termDownloading, setTermDownloading] = useState(false)
  const [termForm, setTermForm] = useState({
    reason: 'REDUNDANCY',
    reasonDetails: '',
    lastWorkingDay: '',
    noticeDays: '30',
    payInLieu: false,
    issuedBy: '',
    issuedByTitle: 'HR Director',
  })
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [resending, setResending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  // Sales performance targets (editable before generating contract)
  const [agentClientTarget, setAgentClientTarget] = useState('5')
  const [agentRevenueTarget, setAgentRevenueTarget] = useState('250000')
  const [managerClientTarget, setManagerClientTarget] = useState('10')
  const [managerRevenueTarget, setManagerRevenueTarget] = useState('700000')
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/employees/${id}`).then(r => r.json()).then(d => {
      setEmployee(d)
      setLoading(false)
    })
  }, [id])

  // Fetch contract + termination letter when switching to contract tab
  useEffect(() => {
    if (activeTab !== 'contract' || !id) return
    setContractLoading(true)
    Promise.all([
      fetch(`/api/employees/${id}/contract`).then(r => r.json()),
      fetch(`/api/employees/${id}/termination`).then(r => r.json()),
    ]).then(([c, t]) => {
      setContract(c)
      if (c?.contractHtml) setContractHtml(c.contractHtml)
      setTermLetter(t)
      if (t?.letterHtml) setTermHtml(t.letterHtml)
    }).finally(() => setContractLoading(false))
  }, [activeTab, id])

  async function handleGenerate(sendEmail = false) {
    if (sendEmail) setSending(true); else setGenerating(true)
    try {
      const res = await fetch(`/api/employees/${id}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send: sendEmail,
          agentClientTarget:   agentClientTarget   ? Number(agentClientTarget)   : undefined,
          agentRevenueTarget:  agentRevenueTarget  ? Number(agentRevenueTarget)  : undefined,
          managerClientTarget: managerClientTarget ? Number(managerClientTarget) : undefined,
          managerRevenueTarget:managerRevenueTarget? Number(managerRevenueTarget): undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setContract({ ...contract, ...data, sentAt: sendEmail ? new Date().toISOString() : contract?.sentAt })
      setContractHtml(data.contractHtml)
      toast.success(sendEmail ? 'Contract generated and sent to employee email!' : 'Contract generated successfully!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setGenerating(false); setSending(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch(`/api/employees/${id}/contract`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setContract((c: any) => ({ ...c, sentAt: new Date().toISOString() }))
      toast.success('Contract resent to employee email!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setResending(false) }
  }

  async function handleDownloadPdf() {
    if (!contractHtml) { toast.error('Generate contract first'); return }
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1'
      container.innerHTML = contractHtml
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 400)) // let images load
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, allowTaint: true })
      document.body.removeChild(container)
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new (jsPDF as any)({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let y = 0
      let remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH)
        remaining -= pageH
        y += pageH
        if (remaining > 0) pdf.addPage()
      }
      pdf.save(`Contract_${employee.firstName}_${employee.lastName}.pdf`)
      toast.success('PDF downloaded!')
    } catch (e) {
      toast.error('PDF generation failed. Try printing from the preview.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleTermGenerate(send = false) {
    if (!termForm.lastWorkingDay || !termForm.issuedBy) {
      toast.error('Please fill in Last Working Day and Issued By fields')
      return
    }
    if (send) setTermSending(true); else setTermGenerating(true)
    try {
      const res = await fetch(`/api/employees/${id}/termination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...termForm, noticeDays: Number(termForm.noticeDays) || 30, send }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setTermLetter(data.letter)
      setTermHtml(data.letterHtml)
      setShowTermForm(false)
      toast.success(send ? 'Termination letter issued and sent to employee!' : 'Termination letter generated!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setTermGenerating(false); setTermSending(false)
    }
  }

  async function handleTermResend() {
    setTermResending(true)
    try {
      const res = await fetch(`/api/employees/${id}/termination`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setTermLetter((t: any) => ({ ...t, sentAt: new Date().toISOString() }))
      toast.success('Termination letter resent!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setTermResending(false)
    }
  }

  async function handleTermDownloadPdf() {
    if (!termHtml) { toast.error('Generate termination letter first'); return }
    setTermDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1'
      container.innerHTML = termHtml
      document.body.appendChild(container)
      await new Promise(r => setTimeout(r, 400))
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, allowTaint: true })
      document.body.removeChild(container)
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new (jsPDF as any)({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let y = 0; let remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH)
        remaining -= pageH; y += pageH
        if (remaining > 0) pdf.addPage()
      }
      pdf.save(`Termination_${employee.firstName}_${employee.lastName}.pdf`)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF generation failed. Try printing from the preview.')
    } finally {
      setTermDownloading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!employee || employee.error) return <div className="text-center py-16 text-slate-500">Employee not found</div>

  const tabs = ['overview', 'attendance', 'leaves', 'payroll', 'performance', 'contract']

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PROBATION: 'bg-blue-100 text-blue-700',
    ON_LEAVE: 'bg-yellow-100 text-yellow-700',
    RESIGNED: 'bg-gray-100 text-gray-600',
    TERMINATED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/employees" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-colors border border-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">{employee.firstName} {employee.lastName}</h1>
          <p className="text-slate-500 text-sm">{employee.employeeCode} · {employee.jobTitle}</p>
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black overflow-hidden flex-shrink-0 border-2 border-white/30">
            {employee.profilePhoto ? (
              <img src={employee.profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : getInitials(employee.firstName, employee.lastName)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black">{employee.firstName} {employee.lastName}</h2>
            <p className="text-blue-200">{employee.jobTitle} · {employee.department?.name || 'No Department'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-blue-200 text-sm">{employee.employeeCode}</span>
              <span className="text-blue-300">·</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                employee.employmentStatus === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
              }`}>{employee.employmentStatus}</span>
              <span className="text-blue-300">·</span>
              <span className="text-blue-200 text-sm">{employee.employmentType?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-2">
            <a href={`mailto:${employee.email}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-sm transition-colors">
              <Mail className="w-4 h-4" />{employee.email}
            </a>
            <a href={`tel:${employee.phone}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-sm transition-colors">
              <Phone className="w-4 h-4" />{employee.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Work Email', value: employee.email },
            { icon: Phone, label: 'Phone', value: employee.phone },
            { icon: Mail, label: 'Personal Email', value: employee.personalEmail || '—' },
            { icon: MapPin, label: 'City', value: employee.city || '—' },
            { icon: Building2, label: 'Department', value: employee.department?.name || '—' },
            { icon: Briefcase, label: 'Employment Type', value: employee.employmentType?.replace('_', ' ') },
            { icon: Calendar, label: 'Date Hired', value: formatDate(employee.dateHired) },
            { icon: DollarSign, label: 'Basic Salary', value: employee.basicSalary ? formatCurrency(employee.basicSalary) : '—' },
            { icon: User, label: 'Manager', value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—' },
            { icon: Phone, label: 'Emergency Contact', value: employee.emergencyContact ? `${employee.emergencyContact} — ${employee.emergencyPhone || ''}` : '—' },
            { icon: Building2, label: 'Bank', value: employee.bankName ? `${employee.bankName} — ${employee.bankAccount || ''}` : '—' },
            { icon: User, label: 'National ID', value: employee.nationalId || '—' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Attendance Records (Last 30)</h3>
          </div>
          {!employee.attendances?.length ? (
            <div className="text-center py-12 text-slate-400"><Clock className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No attendance records</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                {['Date','Clock In','Clock Out','Hours','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {employee.attendances.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{formatDate(a.date)}</td>
                    <td className="px-5 py-3 text-slate-600">{new Date(a.clockIn).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</td>
                    <td className="px-5 py-3 text-slate-600">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{a.totalHours ? `${a.totalHours.toFixed(1)}h` : '—'}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === 'PRESENT' ? 'bg-green-100 text-green-700' : a.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Leave History</h3>
            <div className="flex flex-wrap gap-2">
              {employee.leaveBalances?.map((lb: any) => (
                <div key={lb.id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-bold text-blue-800">{lb.leaveType}</span>
                  <span className="text-blue-600 ml-1">{lb.remaining}/{lb.allocated}</span>
                </div>
              ))}
            </div>
          </div>
          {!employee.leaves?.length ? (
            <div className="text-center py-12 text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No leave history</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                {['Type','Duration','Dates','Status','Approved By'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {employee.leaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{l.leaveType}</td>
                    <td className="px-5 py-3 text-slate-600">{l.days} day(s)</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.status === 'APPROVED' ? 'bg-green-100 text-green-700' : l.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{l.approver ? `${l.approver.firstName} ${l.approver.lastName}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Payroll History</h3></div>
          {!employee.payrolls?.length ? (
            <div className="text-center py-12 text-slate-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No payroll records</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                {['Period','Basic','Allowances','Gross','PAYE','NHIF','NSSF','Net Pay','Status'].map(h => <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase first:text-left">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {employee.payrolls.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{new Date(0, p.month - 1).toLocaleString('default', {month: 'short'})} {p.year}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.basicSalary)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.allowances)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.paye)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.nhif)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.nssf)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.netSalary)}</td>
                    <td className="px-4 py-3 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          {!employee.reviewsReceived?.length ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100">
              <Star className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No performance reviews yet</p>
            </div>
          ) : employee.reviewsReceived.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-slate-900">{r.period}</div>
                  <div className="text-slate-500 text-sm">By {r.reviewer?.firstName} {r.reviewer?.lastName}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="ml-1 font-bold text-slate-900">{r.rating}/5</span>
                </div>
              </div>
              {r.comments && <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3">{r.comments}</p>}
              {r.strengths && <p className="text-sm mt-2"><span className="font-semibold text-green-700">Strengths:</span> <span className="text-slate-600">{r.strengths}</span></p>}
              {r.improvements && <p className="text-sm mt-1"><span className="font-semibold text-amber-700">Areas for Improvement:</span> <span className="text-slate-600">{r.improvements}</span></p>}
            </div>
          ))}
        </div>
      )}

      {/* ── CONTRACT TAB ── */}
      {activeTab === 'contract' && (
        <div className="space-y-5">
          {contractLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Status card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">Employment Contract</h3>
                  </div>
                  {contract?.signedAt ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                    </span>
                  ) : contract?.sentAt ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> Awaiting Signature
                    </span>
                  ) : contract ? (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">Generated — Not Sent</span>
                  ) : (
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">Not Generated</span>
                  )}
                </div>

                {/* Status details grid */}
                {contract && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Generated</div>
                      <div className="text-sm font-semibold text-slate-700">{formatDate(contract.createdAt)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Last Sent</div>
                      <div className="text-sm font-semibold text-slate-700">{contract.sentAt ? formatDate(contract.sentAt) : '—'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Signed</div>
                      <div className="text-sm font-semibold text-slate-700">{contract.signedAt ? formatDate(contract.signedAt) : '—'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Signed By</div>
                      <div className="text-sm font-semibold text-slate-700">{contract.signedByName || '—'}</div>
                    </div>
                  </div>
                )}

                {/* Editable sales targets — shown only for sales roles */}
                {(() => {
                  const empRole = (employee?.user?.role || '').toUpperCase()
                  const titleLower = (employee?.jobTitle || '').toLowerCase()
                  const isMgr = empRole === 'SALES_MANAGER' ||
                    titleLower.includes('sales manager') || titleLower.includes('sales team lead')
                  const isAgent = !isMgr && (empRole === 'SALES_AGENT' || titleLower.includes('sales agent'))
                  if (!isMgr && !isAgent) return null
                  return (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">
                        Performance Targets — will be embedded in contract
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Monthly Client Target
                          </label>
                          <input
                            type="number" min="1"
                            value={isMgr ? managerClientTarget : agentClientTarget}
                            onChange={e => isMgr
                              ? setManagerClientTarget(e.target.value)
                              : setAgentClientTarget(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Monthly Revenue Target (KES)
                          </label>
                          <input
                            type="number" min="0" step="1000"
                            value={isMgr ? managerRevenueTarget : agentRevenueTarget}
                            onChange={e => isMgr
                              ? setManagerRevenueTarget(e.target.value)
                              : setAgentRevenueTarget(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        Adjust targets before generating. These figures will appear verbatim in the contract.
                      </p>
                    </div>
                  )
                })()}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Generate only */}
                  <button onClick={() => handleGenerate(false)} disabled={generating || sending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {contract ? 'Regenerate' : 'Generate Contract'}
                  </button>

                  {/* Generate + Send */}
                  <button onClick={() => handleGenerate(true)} disabled={generating || sending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {contract ? 'Regenerate & Send' : 'Generate & Send Email'}
                  </button>

                  {/* Resend */}
                  {contract && (
                    <button onClick={handleResend} disabled={resending}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                      {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Resend Email
                    </button>
                  )}

                  {/* Preview */}
                  {contractHtml && (
                    <button onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                  )}

                  {/* Download PDF */}
                  {contractHtml && (
                    <button onClick={handleDownloadPdf} disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download PDF
                    </button>
                  )}
                </div>

                {/* Send destination info */}
                <p className="text-xs text-slate-400 mt-3">
                  Email will be sent to: <span className="font-semibold text-slate-600">{employee.personalEmail || employee.email}</span>
                  {employee.personalEmail && <span className="text-slate-400"> (personal email)</span>}
                </p>
              </div>

              {/* Signing link (if sent but not signed) */}
              {contract?.token && !contract.signedAt && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">Awaiting employee signature</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Signing link:{' '}
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/contract/sign/${contract.token}`}
                        target="_blank" rel="noreferrer"
                        className="underline break-all">
                        /contract/sign/{contract.token}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {/* Signed confirmation */}
              {contract?.signedAt && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Contract signed</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Signed by <strong>{contract.signedByName}</strong> on {new Date(contract.signedAt).toLocaleString('en-KE')}
                      {contract.signedByIp && <span className="text-green-600"> · IP: {contract.signedByIp}</span>}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TERMINATION LETTER SECTION ── */}
      {activeTab === 'contract' && canTerminate && !contractLoading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-slate-900 text-base">Termination Letter</h3>
            </div>
            {termLetter ? (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${termLetter.sentAt ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                {termLetter.sentAt ? 'Issued & Sent' : 'Generated — Not Sent'}
              </span>
            ) : null}
          </div>

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            {/* Existing letter summary */}
            {termLetter && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Reason</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {TERMINATION_REASONS.find(r => r.value === termLetter.reason)?.label || termLetter.reason}
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Last Working Day</div>
                  <div className="text-sm font-semibold text-slate-700">{formatDate(termLetter.lastWorkingDay)}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Notice</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {termLetter.noticeDays} days{termLetter.payInLieu ? ' (pay in lieu)' : ''}
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Sent</div>
                  <div className="text-sm font-semibold text-slate-700">{termLetter.sentAt ? formatDate(termLetter.sentAt) : '—'}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setShowTermForm(f => !f) }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors">
                <ShieldAlert className="w-4 h-4" />
                {termLetter ? 'Re-issue Letter' : 'Issue Termination Letter'}
              </button>
              {termHtml && (
                <>
                  <button onClick={() => setShowTermPreview(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleTermDownloadPdf} disabled={termDownloading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                    {termDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download PDF
                  </button>
                  {termLetter && (
                    <button onClick={handleTermResend} disabled={termResending}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                      {termResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Resend Email
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Inline form */}
            {showTermForm && (
              <div className="mt-5 pt-5 border-t border-red-100">
                <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-4">Termination Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason for Termination *</label>
                    <select value={termForm.reason} onChange={e => setTermForm(f => ({ ...f, reason: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
                      {TERMINATION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Last Working Day *</label>
                    <input type="date" value={termForm.lastWorkingDay} onChange={e => setTermForm(f => ({ ...f, lastWorkingDay: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notice Period (days)</label>
                    <input type="number" min="0" value={termForm.noticeDays} onChange={e => setTermForm(f => ({ ...f, noticeDays: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Issued By (Full Name) *</label>
                    <input type="text" placeholder="e.g. Jane Wambua" value={termForm.issuedBy} onChange={e => setTermForm(f => ({ ...f, issuedBy: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Issuer Title</label>
                    <input type="text" value={termForm.issuedByTitle} onChange={e => setTermForm(f => ({ ...f, issuedByTitle: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input type="checkbox" id="payInLieu" checked={termForm.payInLieu} onChange={e => setTermForm(f => ({ ...f, payInLieu: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-400" />
                    <label htmlFor="payInLieu" className="text-sm font-semibold text-slate-700">Pay in lieu of notice</label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Additional Details / Explanation (optional)</label>
                    <textarea rows={3} value={termForm.reasonDetails} onChange={e => setTermForm(f => ({ ...f, reasonDetails: e.target.value }))}
                      placeholder="Any additional context or explanation to include in the letter..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleTermGenerate(false)} disabled={termGenerating || termSending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                    {termGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate Only
                  </button>
                  <button onClick={() => handleTermGenerate(true)} disabled={termGenerating || termSending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                    {termSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Generate &amp; Send to Employee
                  </button>
                  <button onClick={() => setShowTermForm(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Contract Preview Modal ── */}
      {showPreview && contractHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">Contract Preview — {employee.firstName} {employee.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadPdf} disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors">
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
                <button onClick={() => {
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(contractHtml); w.document.close(); w.print() }
                }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
                  Print / Save as PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={contractHtml}
                className="w-full border-0"
                style={{ height: '100%', minHeight: '70vh' }}
                title="Contract Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Termination Letter Preview Modal ── */}
      {showTermPreview && termHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-100 bg-red-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900">Termination Letter — {employee.firstName} {employee.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleTermDownloadPdf} disabled={termDownloading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors">
                  {termDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
                <button onClick={() => {
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(termHtml); w.document.close(); w.print() }
                }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
                  Print / Save as PDF
                </button>
                <button onClick={() => setShowTermPreview(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={termHtml}
                className="w-full border-0"
                style={{ height: '100%', minHeight: '70vh' }}
                title="Termination Letter Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
