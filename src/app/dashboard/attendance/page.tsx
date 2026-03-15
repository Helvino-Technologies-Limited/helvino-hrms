'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, CheckCircle, XCircle, AlertTriangle, Timer } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const { data: session } = useSession()
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clockLoading, setClockLoading] = useState(false)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const employeeId = (session?.user as any)?.employeeId
  const isHR = ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'].includes(session?.user?.role || '')

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadAttendance = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (!isHR && employeeId) params.set('employeeId', employeeId)
    const res = await fetch(`/api/attendance?${params}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setAttendance(list)
    if (employeeId) {
      const today = new Date().toDateString()
      const rec = list.find((a: any) => new Date(a.date).toDateString() === today && a.employeeId === employeeId)
      setTodayRecord(rec || null)
    }
    setLoading(false)
  }, [month, year, employeeId, isHR])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  async function handleClock(action: string) {
    setClockLoading(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, action }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setClockLoading(false); return }
    toast.success(action === 'clock-in' ? `✅ Clocked in! Status: ${data.status}` : '👋 Clocked out successfully!')
    loadAttendance()
    setClockLoading(false)
  }

  const stats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    totalHours: attendance.reduce((s: number, a: any) => s + (a.totalHours || 0), 0),
  }

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Attendance</h1>
          <p className="text-slate-500 text-sm">{currentTime.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {isHR && (
          <div className="flex gap-2">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Clock widget */}
      {employeeId && (
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Current Time</div>
              <div className="text-5xl font-black tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {todayRecord ? (
                  <>
                    <div className="text-slate-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Clocked in: <strong>{new Date(todayRecord.clockIn).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</strong>
                      {todayRecord.status === 'LATE' && <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-bold">LATE</span>}
                    </div>
                    {todayRecord.clockOut && (
                      <div className="text-slate-300 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Clocked out: <strong>{new Date(todayRecord.clockOut).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</strong>
                        · <strong>{todayRecord.totalHours?.toFixed(1)}h</strong> worked
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Not clocked in yet today
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {!todayRecord && (
                <button onClick={() => handleClock('clock-in')} disabled={clockLoading}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-green-700 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-5 h-5" />
                  {clockLoading ? 'Processing...' : 'Clock In'}
                </button>
              )}
              {todayRecord && !todayRecord.clockOut && (
                <button onClick={() => handleClock('clock-out')} disabled={clockLoading}
                  className="bg-red-500 hover:bg-red-400 disabled:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-500/30">
                  <XCircle className="w-5 h-5" />
                  {clockLoading ? 'Processing...' : 'Clock Out'}
                </button>
              )}
              {todayRecord?.clockOut && (
                <div className="bg-white/10 border border-white/20 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Day Complete · {todayRecord.totalHours?.toFixed(1)}h
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats + Table — HR/Admin only */}
      {isHR && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: stats.present, icon: CheckCircle, color: 'from-green-500 to-green-600' },
              { label: 'Late Arrivals', value: stats.late, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500' },
              { label: 'Absent', value: stats.absent, icon: XCircle, color: 'from-red-500 to-red-600' },
              { label: 'Total Hours', value: `${stats.totalHours.toFixed(0)}h`, icon: Timer, color: 'from-blue-500 to-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className={`bg-gradient-to-br ${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-black text-slate-900">{s.value}</div>
                <div className="text-slate-500 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium">No attendance records for {months[month-1]} {year}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Clock In</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Clock Out</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Hours</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {a.employee?.firstName?.[0]}{a.employee?.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{a.employee?.firstName} {a.employee?.lastName}</div>
                              <div className="text-slate-400 text-xs">{a.employee?.department?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{formatDate(a.date)}</td>
                        <td className="px-5 py-3.5 text-slate-600">{new Date(a.clockIn).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</td>
                        <td className="px-5 py-3.5 text-slate-600">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'}) : <span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{a.totalHours ? `${a.totalHours.toFixed(1)}h` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                            a.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
