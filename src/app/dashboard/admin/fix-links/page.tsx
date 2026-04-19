'use client'

import { useState } from 'react'

export default function FixEmployeeLinksPage() {
  const [code, setCode] = useState('HTL0022')
  const [diagData, setDiagData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function diagnose() {
    setLoading(true)
    setError(null)
    setFixResult(null)
    try {
      const res = await fetch(`/api/admin/fix-employee-link?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Error')
      else setDiagData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function applyFix() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/fix-employee-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Fix failed')
      else { setFixResult(json); setDiagData(null) }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Fix Employee–User Link</h1>

      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Employee code e.g. HTL0022"
          value={code}
          onChange={(e) => { setCode(e.target.value); setDiagData(null); setFixResult(null) }}
        />
        <button
          onClick={diagnose}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Diagnose'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">{error}</div>
      )}

      {fixResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4 text-sm">
          <p className="font-semibold mb-1">Fixed successfully</p>
          <p>{fixResult.message}</p>
          {fixResult.changed ? (
            <p className="mt-1 text-xs text-green-700">Previous employeeId: <code>{fixResult.previousEmployeeId ?? 'null'}</code> → <code>{fixResult.employeeId}</code></p>
          ) : (
            <p className="mt-1 text-xs text-green-700">No change needed — link was already correct.</p>
          )}
          <p className="mt-2 text-xs text-green-600">Ask {code} to refresh their dashboard — leads will now appear.</p>
        </div>
      )}

      {diagData && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Employee Record</h2>
            <table className="text-sm w-full">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-1 text-slate-500 w-36">Code</td><td className="py-1 font-mono">{diagData.employee.code}</td></tr>
                <tr><td className="py-1 text-slate-500">Name</td><td className="py-1">{diagData.employee.name}</td></tr>
                <tr><td className="py-1 text-slate-500">Email</td><td className="py-1 font-mono">{diagData.employee.email}</td></tr>
                <tr><td className="py-1 text-slate-500">Status</td><td className="py-1">{diagData.employee.status}</td></tr>
                <tr><td className="py-1 text-slate-500">Employee.id</td><td className="py-1 font-mono text-xs">{diagData.employee.id}</td></tr>
                <tr><td className="py-1 text-slate-500">Leads created</td><td className="py-1">{diagData.leadsCreated}</td></tr>
                <tr><td className="py-1 text-slate-500">Leads assigned</td><td className="py-1">{diagData.leadsAssigned}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">User Linked via employeeId</h2>
            {diagData.linkedUser ? (
              <table className="text-sm w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-1 text-slate-500 w-36">User.id</td><td className="py-1 font-mono text-xs">{diagData.linkedUser.id}</td></tr>
                  <tr><td className="py-1 text-slate-500">Email</td><td className="py-1 font-mono">{diagData.linkedUser.email}</td></tr>
                  <tr><td className="py-1 text-slate-500">Role</td><td className="py-1">{diagData.linkedUser.role}</td></tr>
                  <tr><td className="py-1 text-slate-500">employeeId</td><td className="py-1 font-mono text-xs">{diagData.linkedUser.employeeId}</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-red-600">No User has employeeId = this Employee.id</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">User Found by Email Match</h2>
            {diagData.userByEmail ? (
              <table className="text-sm w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-1 text-slate-500 w-36">User.id</td><td className="py-1 font-mono text-xs">{diagData.userByEmail.id}</td></tr>
                  <tr><td className="py-1 text-slate-500">Email</td><td className="py-1 font-mono">{diagData.userByEmail.email}</td></tr>
                  <tr><td className="py-1 text-slate-500">Role</td><td className="py-1">{diagData.userByEmail.role}</td></tr>
                  <tr><td className="py-1 text-slate-500">employeeId set to</td>
                    <td className="py-1 font-mono text-xs">
                      {diagData.userByEmail.employeeId ?? <span className="text-red-600">null</span>}
                      {diagData.userByEmail.employeeId && diagData.userByEmail.employeeId !== diagData.employee.id && (
                        <span className="ml-2 text-red-600 font-semibold">WRONG — should be {diagData.employee.id}</span>
                      )}
                      {diagData.userByEmail.employeeId === diagData.employee.id && (
                        <span className="ml-2 text-green-600">correct</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-red-600">No User found with email matching this Employee</p>
            )}
          </div>

          {diagData.issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-800 mb-2">Issues Found</h2>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                {diagData.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
              {diagData.fix && (
                <button
                  onClick={applyFix}
                  disabled={loading}
                  className="mt-4 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? 'Fixing…' : 'Apply Fix'}
                </button>
              )}
            </div>
          )}

          {diagData.issues.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
              No issues found — User–Employee link is correct.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
