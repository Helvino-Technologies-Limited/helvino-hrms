'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ClipboardCheck, ArrowLeft, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export default function PolicyCompliancePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)

  async function loadCompliance() {
    setLoading(true)
    try {
      const res = await fetch('/api/policies/compliance')
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to load compliance data')
    }
    setLoading(false)
  }

  useEffect(() => { loadCompliance() }, [])

  const summary = data?.summary ?? {}
  const policies: any[] = data?.policies ?? []

  const selectedPolicyData = policies.find(p => p.policy.id === selectedPolicy)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/policies"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Policy Compliance Report</h1>
          <p className="text-slate-500 text-sm">Employee policy acceptance tracking</p>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse border border-slate-100 shadow-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Active Policies</div>
            <div className="text-3xl font-black text-slate-900">{summary.totalPolicies ?? 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Employees</div>
            <div className="text-3xl font-black text-slate-900">{summary.totalEmployees ?? 0}</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-100">
            <div className="text-green-700 text-xs font-semibold uppercase mb-1">Total Accepted</div>
            <div className="text-3xl font-black text-green-700">{summary.overallAccepted ?? 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Overall Rate</div>
            <div className={`text-3xl font-black ${(summary.overallRate ?? 0) >= 80 ? 'text-green-700' : (summary.overallRate ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {summary.overallRate ?? 0}%
            </div>
          </div>
        </div>
      )}

      {/* Policy Compliance Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse border border-slate-100 shadow-sm" />)}
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-slate-200" />
          <p>No active policies found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policyData: any) => {
            const { policy, totalEmployees, accepted, pending, acceptanceRate, versionNumber } = policyData
            const isSelected = selectedPolicy === policy.id
            return (
              <div key={policy.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                  className="w-full p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedPolicy(isSelected ? null : policy.id)}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <Link href={`/dashboard/policies/${policy.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        onClick={e => e.stopPropagation()}>
                        {policy.title}
                      </Link>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {policy.policyType}{versionNumber ? ` · v${versionNumber}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{accepted}/{totalEmployees} employees</div>
                        <div className={`text-sm font-black ${acceptanceRate >= 80 ? 'text-green-700' : acceptanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {acceptanceRate}%
                        </div>
                      </div>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${acceptanceRate >= 80 ? 'bg-green-500' : acceptanceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${acceptanceRate}%` }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Employee acceptance details */}
                {isSelected && (
                  <div className="border-t border-slate-100">
                    <div className="px-5 py-3 bg-slate-50 flex items-center gap-3">
                      <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> {accepted} Accepted
                      </span>
                      <span className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {pending} Pending
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            {['Employee', 'Department', 'Job Title', 'Status', 'Date'].map(h => (
                              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {policyData.acceptances?.map((acc: any) => (
                            <tr key={acc.employee.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-slate-900 text-xs">{acc.employee.firstName} {acc.employee.lastName}</div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{acc.employee.department?.name || '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{acc.employee.jobTitle || '—'}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                {acc.accepted ? (
                                  <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                                    <CheckCircle className="w-3 h-3" /> Accepted
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">
                                {acc.acceptedAt ? formatDate(acc.acceptedAt) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
