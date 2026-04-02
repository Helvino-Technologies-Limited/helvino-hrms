'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Target, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

type TargetRow = {
  id: string
  role: string
  clientTarget: number
  revenueTarget: number
  updatedAt: string
}

const ROLE_LABELS: Record<string, string> = {
  SALES_AGENT: 'Sales Agent',
  SALES_MANAGER: 'Sales Manager',
}

const DEFAULTS: Record<string, { clientTarget: number; revenueTarget: number }> = {
  SALES_AGENT:   { clientTarget: 5,  revenueTarget: 250000 },
  SALES_MANAGER: { clientTarget: 10, revenueTarget: 500000 },
}

export default function SalesTargetsPage() {
  const { data: session } = useSession()
  const [targets, setTargets] = useState<TargetRow[]>([])
  const [form, setForm] = useState<Record<string, { clientTarget: string; revenueTarget: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAdmin = ['SUPER_ADMIN', 'HR_MANAGER'].includes(session?.user?.role ?? '')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/targets')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTargets(data)
        const init: typeof form = {}
        data.forEach((t: TargetRow) => {
          init[t.role] = {
            clientTarget: String(t.clientTarget),
            revenueTarget: String(t.revenueTarget),
          }
        })
        setForm(init)
      }
    } catch {
      toast.error('Failed to load targets')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function reset(role: string) {
    const def = DEFAULTS[role]
    if (!def) return
    setForm(prev => ({
      ...prev,
      [role]: { clientTarget: String(def.clientTarget), revenueTarget: String(def.revenueTarget) },
    }))
  }

  async function save() {
    setSaving(true)
    try {
      const payload = Object.entries(form).map(([role, vals]) => ({
        role,
        clientTarget: parseInt(vals.clientTarget) || 0,
        revenueTarget: parseFloat(vals.revenueTarget) || 0,
      }))
      const res = await fetch('/api/sales/targets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save')
      } else {
        toast.success('Targets updated successfully')
        load()
      }
    } catch {
      toast.error('Failed to save targets')
    }
    setSaving(false)
  }

  const roles = ['SALES_AGENT', 'SALES_MANAGER']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Sales Targets</h1>
        <p className="text-slate-500 text-sm mt-1">
          Set monthly performance targets displayed on each role&apos;s dashboard.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const current = targets.find(t => t.role === role)
            const f = form[role] ?? { clientTarget: '', revenueTarget: '' }
            const def = DEFAULTS[role]

            return (
              <div key={role} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{ROLE_LABELS[role] ?? role}</div>
                      {current && (
                        <div className="text-xs text-slate-400">
                          Last updated {new Date(current.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => reset(role)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset defaults
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Monthly Client Target
                    </label>
                    {isAdmin ? (
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={f.clientTarget}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            [role]: { ...prev[role], clientTarget: e.target.value },
                          }))}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">clients</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800">
                        {current?.clientTarget ?? def.clientTarget} clients
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Default: {def.clientTarget} clients</p>
                  </div>

                  {/* Revenue target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Monthly Revenue Target (KES)
                    </label>
                    {isAdmin ? (
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={f.revenueTarget}
                          onChange={e => setForm(prev => ({
                            ...prev,
                            [role]: { ...prev[role], revenueTarget: e.target.value },
                          }))}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">KES</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800">
                        {formatCurrency(current?.revenueTarget ?? def.revenueTarget)}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Default: {formatCurrency(def.revenueTarget)}</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 p-3 bg-blue-50 rounded-xl flex flex-wrap gap-4 text-xs">
                  <span className="text-blue-700">
                    <span className="font-semibold">Client target:</span>{' '}
                    {parseInt(f.clientTarget) || 0} new clients / month
                  </span>
                  <span className="text-blue-700">
                    <span className="font-semibold">Revenue target:</span>{' '}
                    {formatCurrency(parseFloat(f.revenueTarget) || 0)} / month
                  </span>
                </div>
              </div>
            )
          })}

          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-colors">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Targets
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
