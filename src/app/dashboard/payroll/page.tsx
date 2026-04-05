'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DollarSign, RefreshCw, TrendingUp, TrendingDown, Users, FileText, Lock, CheckCircle, Info, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']
const SALES_ROLES_WITH_TARGETS = ['SALES_AGENT', 'SALES_MANAGER']

export default function PayrollPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false

  if (!session) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return isAdmin ? <AdminPayrollView /> : <EmployeePayslipView />
}

// ─── Admin view ────────────────────────────────────────────────────────────────

function AdminPayrollView() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

  async function loadPayroll() {
    setLoading(true)
    const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
    const data = await res.json()
    setPayrolls(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadPayroll() }, [selectedMonth, selectedYear])

  async function generatePayroll() {
    setGenerating(true)
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setGenerating(false); return }
    toast.success(`✅ ${data.message}`)
    loadPayroll()
    setGenerating(false)
  }

  const summary = {
    gross: payrolls.reduce((s, p) => s + p.grossSalary, 0),
    net: payrolls.reduce((s, p) => s + p.netSalary, 0),
    paye: payrolls.reduce((s, p) => s + p.paye, 0),
    nhif: payrolls.reduce((s, p) => s + p.nhif, 0),
    nssf: payrolls.reduce((s, p) => s + p.nssf, 0),
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payroll Management</h1>
          <p className="text-slate-500 text-sm">Kenya-compliant payroll — PAYE, NHIF, NSSF</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={generatePayroll}
            disabled={generating || payrolls.length > 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm transition-colors">
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {payrolls.length > 0 ? 'Already Generated' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      {payrolls.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Employees', value: String(payrolls.length), icon: Users, color: 'from-slate-500 to-slate-600' },
            { label: 'Gross Payroll', value: formatCurrency(summary.gross), icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
            { label: 'PAYE Tax', value: formatCurrency(summary.paye), icon: TrendingDown, color: 'from-red-500 to-red-600' },
            { label: 'NHIF + NSSF', value: formatCurrency(summary.nhif + summary.nssf), icon: TrendingDown, color: 'from-orange-500 to-orange-600' },
            { label: 'Net Payroll', value: formatCurrency(summary.net), icon: DollarSign, color: 'from-green-500 to-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className={`bg-gradient-to-br ${s.color} w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                <s.icon className="text-white" style={{width:'18px',height:'18px'}} />
              </div>
              <div className="text-lg font-black text-slate-900">{s.value}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-600">No payroll for {months[selectedMonth-1]} {selectedYear}</p>
            <p className="text-sm mt-1">Click "Generate Payroll" to process salaries for all active employees</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee','Basic','Allowances','Gross','PAYE','NHIF','NSSF','Net Pay','Status'].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{p.employee?.firstName} {p.employee?.lastName}</div>
                          <div className="text-slate-400 text-xs">{p.employee?.employeeCode} · {p.employee?.department?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.basicSalary)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.allowances)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.paye)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.nhif)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.nssf)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.netSalary)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : p.status === 'PROCESSED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">TOTALS</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(payrolls.reduce((s,p)=>s+p.basicSalary,0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(payrolls.reduce((s,p)=>s+p.allowances,0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(summary.gross)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(summary.paye)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(summary.nhif)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(summary.nssf)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600 text-base">{formatCurrency(summary.net)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Employee payslip view ──────────────────────────────────────────────────────

function EmployeePayslipView() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined

  const [payslips, setPayslips] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Sales target gate state
  const [targetCheck, setTargetCheck] = useState<{
    isSalesRole: boolean
    hasTarget: boolean
    targetMet: boolean
    clientTarget?: number
    revenueTarget?: number
    clientsAchieved?: number
    revenueAchieved?: number
    targetPeriodEnd?: string
  } | null>(null)
  const [targetLoading, setTargetLoading] = useState(false)

  const isSalesWithTarget = role ? SALES_ROLES_WITH_TARGETS.includes(role) : false

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

  async function loadPayslips() {
    setLoading(true)
    const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setPayslips(list)
    setSelected(list[0] ?? null)
    setLoading(false)
  }

  async function loadTargetCheck() {
    if (!isSalesWithTarget) return
    setTargetLoading(true)
    const res = await fetch(`/api/payroll/target-check?month=${selectedMonth}&year=${selectedYear}`)
    const data = await res.json()
    setTargetCheck(data)
    setTargetLoading(false)
  }

  useEffect(() => {
    loadPayslips()
    loadTargetCheck()
  }, [selectedMonth, selectedYear])

  // Determine last day of target month for display
  const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const releaseDate = `${months[selectedMonth % 12]} 1, ${selectedMonth === 12 ? selectedYear + 1 : selectedYear}`
  const paymentWindow = `${months[selectedMonth % 12]} 2–5, ${selectedMonth === 12 ? selectedYear + 1 : selectedYear}`

  // Is the target period still in progress? (current month = selected month/year)
  const now = new Date()
  const isCurrentMonth = now.getMonth() + 1 === selectedMonth && now.getFullYear() === selectedYear

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Payslip</h1>
          <p className="text-slate-500 text-sm">Your monthly salary breakdown</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Sales schedule info banner — always shown for sales roles */}
      {isSalesWithTarget && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-0.5">
            <p className="font-semibold">Payslip release policy for sales team</p>
            <p>Your target period runs from the <strong>1st to the last day</strong> of each month. Payslips are released on the <strong>1st of the following month</strong> — but only if your monthly target has been achieved. Salary payments are made between the <strong>2nd and 5th</strong> of each month.</p>
          </div>
        </div>
      )}

      {loading || targetLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isSalesWithTarget && targetCheck?.hasTarget && !targetCheck.targetMet ? (
        /* ── Target not met: payslip is locked ── */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white flex items-center gap-3">
            <Lock className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="text-lg font-black">Payslip Locked — Target Not Yet Met</div>
              <div className="text-orange-100 text-sm">
                {isCurrentMonth
                  ? `Your target period ends on ${months[selectedMonth-1]} ${lastDayOfMonth}, ${selectedYear}. Meet your targets to unlock your payslip on ${releaseDate}.`
                  : `You did not meet your ${months[selectedMonth-1]} ${selectedYear} targets. Your payslip remains locked.`}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <p className="text-sm text-slate-500">
              {isCurrentMonth
                ? `You still have until ${months[selectedMonth-1]} ${lastDayOfMonth}, ${selectedYear} to achieve your targets. Once met, your payslip will be available from ${releaseDate} and salary paid between ${paymentWindow}.`
                : `Your ${months[selectedMonth-1]} ${selectedYear} payslip is permanently locked because the monthly targets were not achieved.`}
            </p>

            {/* Progress cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clients */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clients Acquired</span>
                  {(targetCheck.clientsAchieved ?? 0) >= (targetCheck.clientTarget ?? 1)
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <Lock className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {targetCheck.clientsAchieved ?? 0}
                  <span className="text-base font-medium text-slate-400"> / {targetCheck.clientTarget}</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((targetCheck.clientsAchieved ?? 0) / (targetCheck.clientTarget ?? 1)) * 100)}%` }}
                  />
                </div>
                {(targetCheck.clientsAchieved ?? 0) < (targetCheck.clientTarget ?? 1) && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {(targetCheck.clientTarget ?? 0) - (targetCheck.clientsAchieved ?? 0)} more client{((targetCheck.clientTarget ?? 0) - (targetCheck.clientsAchieved ?? 0)) !== 1 ? 's' : ''} needed
                  </p>
                )}
              </div>

              {/* Revenue */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</span>
                  {(targetCheck.revenueAchieved ?? 0) >= (targetCheck.revenueTarget ?? 1)
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <Lock className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(targetCheck.revenueAchieved ?? 0)}
                  <span className="text-base font-medium text-slate-400"> / {formatCurrency(targetCheck.revenueTarget ?? 0)}</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((targetCheck.revenueAchieved ?? 0) / (targetCheck.revenueTarget ?? 1)) * 100)}%` }}
                  />
                </div>
                {(targetCheck.revenueAchieved ?? 0) < (targetCheck.revenueTarget ?? 1) && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {formatCurrency((targetCheck.revenueTarget ?? 0) - (targetCheck.revenueAchieved ?? 0))} more needed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-600">No payslip for {months[selectedMonth-1]} {selectedYear}</p>
          <p className="text-sm mt-1">Your payslip will appear here once payroll is processed by HR</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Target met badge for sales roles */}
          {isSalesWithTarget && targetCheck?.targetMet && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                Monthly target achieved — payslip unlocked. Salary payment: {paymentWindow}.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black">{selected.employee?.firstName} {selected.employee?.lastName}</div>
                  <div className="text-blue-200 text-sm">{selected.employee?.jobTitle} · {selected.employee?.department?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-200">Payslip</div>
                  <div className="font-bold">{months[selectedMonth-1]} {selectedYear}</div>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${selected.status === 'PAID' ? 'bg-green-400 text-green-900' : 'bg-blue-400 text-blue-900'}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Earnings</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selected.basicSalary)}</span>
                </div>
                {selected.allowances > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Allowances</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(selected.allowances)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-900">Gross Salary</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selected.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Deductions</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">PAYE Tax</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(selected.paye)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">NHIF</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(selected.nhif)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">NSSF</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(selected.nssf)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-900">Total Deductions</span>
                  <span className="font-bold text-red-600">-{formatCurrency(selected.paye + selected.nhif + selected.nssf)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="px-6 py-5 bg-green-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Net Pay</span>
                <span className="text-2xl font-black text-green-600">{formatCurrency(selected.netSalary)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
