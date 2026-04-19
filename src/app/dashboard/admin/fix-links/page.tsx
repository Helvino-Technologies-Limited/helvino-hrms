'use client'

import { useState } from 'react'

export default function FixEmployeeLinksPage() {
  const [code, setCode] = useState('HTL0022')
  const [diagData, setDiagData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)
  const [reassignResult, setReassignResult] = useState<any>(null)
  const [repairAllResult, setRepairAllResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function diagnose() {
    setLoading(true); setError(null); setFixResult(null); setReassignResult(null)
    try {
      const res = await fetch(`/api/admin/fix-employee-link?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Error')
      else setDiagData(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function applyFix() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/fix-employee-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Fix failed')
      else { setFixResult(json); setDiagData(null) }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function reassignLeads() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/reassign-leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed')
      else setReassignResult(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function repairAll() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/repair-links')
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed')
      else setRepairAllResult(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Employee Link & Leads Repair</h1>
        <p className="text-slate-500 text-sm mt-1">Fix broken User→Employee links and reassign orphaned leads.</p>
      </div>

      {/* Repair All */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-800 text-sm">Repair All Broken Links</p>
          <p className="text-blue-600 text-xs mt-0.5">Scans every employee and fixes any User whose employeeId is wrong or null.</p>
        </div>
        <button onClick={repairAll} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
          {loading ? 'Running…' : 'Run Repair All'}
        </button>
      </div>

      {repairAllResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="font-semibold text-slate-800 mb-2">Repair All — Results</p>
          <p className="text-sm text-slate-600">Fixed: <strong className="text-green-700">{repairAllResult.summary.fixed}</strong> · OK: {repairAllResult.summary.ok} · No user: {repairAllResult.summary.noUser}</p>
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {repairAllResult.results.filter((r: any) => r.action === 'FIXED').map((r: any, i: number) => (
              <div key={i} className="text-xs bg-green-50 border border-green-100 rounded px-3 py-1.5">
                <strong>{r.employee}</strong> — {r.detail}
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="border-slate-200" />

      {/* Single employee */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Fix Individual Employee</p>
        <div className="flex gap-3">
          <input
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Employee code e.g. HTL0022"
            value={code}
            onChange={(e) => { setCode(e.target.value); setDiagData(null); setFixResult(null); setReassignResult(null) }}
          />
          <button onClick={diagnose} disabled={loading}
            className="bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
            Diagnose
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>}

      {fixResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          <p className="font-semibold">Link Fixed</p>
          <p>{fixResult.message}</p>
          {fixResult.changed && <p className="text-xs mt-1 text-green-700">employeeId: <code>{fixResult.previousEmployeeId ?? 'null'}</code> → <code>{fixResult.employeeId}</code></p>}
        </div>
      )}

      {reassignResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          <p className="font-semibold">Leads Reassigned</p>
          <p>{reassignResult.message}</p>
        </div>
      )}

      {diagData && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Employee</h2>
            <table className="text-sm w-full">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-1 text-slate-500 w-36">Code</td><td className="py-1 font-mono">{diagData.employee.code}</td></tr>
                <tr><td className="py-1 text-slate-500">Name</td><td className="py-1">{diagData.employee.name}</td></tr>
                <tr><td className="py-1 text-slate-500">Email</td><td className="py-1 font-mono">{diagData.employee.email}</td></tr>
                <tr><td className="py-1 text-slate-500">Employee.id</td><td className="py-1 font-mono text-xs">{diagData.employee.id}</td></tr>
                <tr><td className="py-1 text-slate-500">Leads (created)</td><td className="py-1">{diagData.leadsCreated}</td></tr>
                <tr><td className="py-1 text-slate-500">Leads (assigned)</td><td className="py-1">{diagData.leadsAssigned}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">User Found by Email</h2>
            {diagData.userByEmail ? (
              <table className="text-sm w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-1 text-slate-500 w-36">Email</td><td className="py-1 font-mono">{diagData.userByEmail.email}</td></tr>
                  <tr><td className="py-1 text-slate-500">Role</td><td className="py-1">{diagData.userByEmail.role}</td></tr>
                  <tr><td className="py-1 text-slate-500">employeeId</td>
                    <td className="py-1 font-mono text-xs">
                      {diagData.userByEmail.employeeId ?? <span className="text-red-600">null</span>}
                      {diagData.userByEmail.employeeId && diagData.userByEmail.employeeId !== diagData.employee.id && (
                        <span className="ml-2 text-red-600 font-semibold">WRONG</span>
                      )}
                      {diagData.userByEmail.employeeId === diagData.employee.id && (
                        <span className="ml-2 text-green-600">correct</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : <p className="text-sm text-red-600">No User found with matching email</p>}
          </div>

          {diagData.issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h2 className="font-semibold text-amber-800 mb-2">Issues</h2>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside mb-4">
                {diagData.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
              <div className="flex gap-3">
                {diagData.fix && (
                  <button onClick={applyFix} disabled={loading}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                    Fix User Link
                  </button>
                )}
                <button onClick={reassignLeads} disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  Fix Link + Assign Leads
                </button>
              </div>
            </div>
          )}

          {diagData.issues.length === 0 && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                Link is correct. You can still reassign unassigned leads to ensure they appear on the dashboard.
              </div>
              <button onClick={reassignLeads} disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                Assign Unassigned Leads to This Employee
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
