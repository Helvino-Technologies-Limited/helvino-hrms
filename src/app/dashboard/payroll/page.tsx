'use client'
import { useEffect, useState } from 'react'
import { DollarSign, RefreshCw, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PayrollPage() {
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

  const months2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
