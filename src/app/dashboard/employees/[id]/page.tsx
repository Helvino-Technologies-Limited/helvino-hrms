'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, User,
  DollarSign, Clock, Star, Award, Briefcase, Edit
} from 'lucide-react'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetch(`/api/employees/${id}`).then(r => r.json()).then(d => {
      setEmployee(d)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!employee || employee.error) return <div className="text-center py-16 text-slate-500">Employee not found</div>

  const tabs = ['overview', 'attendance', 'leaves', 'payroll', 'performance']

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
    </div>
  )
}
