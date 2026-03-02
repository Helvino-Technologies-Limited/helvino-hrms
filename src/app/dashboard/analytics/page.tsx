'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, TrendingDown, Briefcase, Calendar, Clock, DollarSign, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const kpis = [
    { label: 'Total Employees', value: data?.totalEmployees, sub: `${data?.activeEmployees} active`, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'New Hires This Month', value: data?.recentHires, sub: 'joined this month', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Turnover Rate', value: `${data?.turnoverRate}%`, sub: 'this year', icon: TrendingDown, color: 'from-red-500 to-red-600' },
    { label: 'Open Positions', value: data?.openJobs, sub: 'active job postings', icon: Briefcase, color: 'from-purple-500 to-purple-600' },
    { label: 'Pending Leaves', value: data?.pendingLeaves, sub: 'awaiting approval', icon: Calendar, color: 'from-amber-500 to-orange-500' },
    { label: 'Present Today', value: data?.attendanceToday, sub: 'clocked in today', icon: Clock, color: 'from-teal-500 to-teal-600' },
    { label: 'Monthly Payroll', value: data?.payrollSummary?.netSalary ? formatCurrency(data.payrollSummary.netSalary) : '—', sub: 'net pay this month', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Avg Performance', value: `${data?.avgPerformanceRating}/5`, sub: 'average rating', icon: Star, color: 'from-yellow-400 to-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">HR Analytics</h1>
        <p className="text-slate-500 text-sm">Executive overview — Helvino Technologies Limited</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`bg-gradient-to-br ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <kpi.icon className="text-white" style={{width:'18px',height:'18px'}} />
            </div>
            <div className="text-2xl font-black text-slate-900">{kpi.value ?? '—'}</div>
            <div className="text-slate-700 text-sm font-semibold">{kpi.label}</div>
            <div className="text-slate-400 text-xs mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {data?.departmentDistribution?.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5">Headcount by Department</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.departmentDistribution} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{fontSize:11}} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={130} />
                <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0,6,6,0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data?.employmentTypeBreakdown?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5">Employment Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.employmentTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="45%" outerRadius={90} innerRadius={45}>
                  {data.employmentTypeBreakdown.map((_:any, i:number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius:'12px'}} formatter={(v,n) => [v, (n as string).replace('_',' ')]} />
                <Legend formatter={v => v.replace('_',' ')} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {data?.monthlyGrowth?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Headcount Growth — Last 12 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} allowDecimals={false} />
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e2e8f0'}} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{fill:'#3b82f6',r:5,strokeWidth:2,stroke:'white'}} name="Total Employees" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.payrollSummary?.grossSalary && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Gross Payroll', value: formatCurrency(data.payrollSummary.grossSalary || 0), color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
            { label: 'Total PAYE Tax', value: formatCurrency(data.payrollSummary.paye || 0), color: 'bg-red-50 border-red-200', text: 'text-red-700' },
            { label: 'Net Payroll', value: formatCurrency(data.payrollSummary.netSalary || 0), color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          ].map(item => (
            <div key={item.label} className={`${item.color} border rounded-2xl p-5`}>
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${item.text}`}>{item.label}</div>
              <div className={`text-2xl font-black ${item.text}`}>{item.value}</div>
              <div className="text-slate-500 text-xs mt-1">Current month</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
