'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Building2, Calendar, DollarSign, Lock, CheckCircle, Star, Camera } from 'lucide-react'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [employee, setEmployee] = useState<any>(null)
  const [balances, setBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const employeeId = (session?.user as any)?.employeeId

  useEffect(() => {
    if (!employeeId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/employees/${employeeId}`).then(r => r.json()),
      fetch(`/api/leave-balances?employeeId=${employeeId}`).then(r => r.json()),
    ]).then(([e, b]) => {
      setEmployee(e)
      setBalances(Array.isArray(b) ? b : [])
      setLoading(false)
    })
  }, [employeeId])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setPwLoading(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setPwLoading(false); return }
    toast.success('Password changed successfully!')
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPwLoading(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !employeeId) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = (ev) => {
          const img = new Image()
          img.onerror = reject
          img.onload = () => {
            const MAX = 400
            let w = img.width, h = img.height
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else { w = Math.round(w * MAX / h); h = MAX }
            const canvas = document.createElement('canvas')
            canvas.width = w; canvas.height = h
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          }
          img.src = ev.target!.result as string
        }
        reader.readAsDataURL(file)
      })
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: base64 }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setEmployee((prev: any) => ({ ...prev, profilePhoto: updated.profilePhoto }))
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const tabs = ['overview','leaves','attendance','payroll','security']

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-2xl font-black text-slate-900">My Profile</h1>

      {employee && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black border-2 border-white/30 overflow-hidden">
                {employee.profilePhoto
                  ? <img src={employee.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : getInitials(employee.firstName, employee.lastName)}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Change photo"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-colors border border-slate-200 disabled:opacity-60"
              >
                {uploading
                  ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-slate-600" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{employee.firstName} {employee.lastName}</h2>
              <p className="text-blue-200">{employee.jobTitle} · {employee.department?.name}</p>
              <p className="text-blue-300 text-sm mt-1">{employee.employeeCode} · Joined {formatDate(employee.dateHired)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && employee && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Work Email', value: employee.email },
            { icon: Phone, label: 'Phone', value: employee.phone },
            { icon: Mail, label: 'Personal Email', value: employee.personalEmail || '—' },
            { icon: Building2, label: 'Department', value: employee.department?.name || '—' },
            { icon: User, label: 'Job Title', value: employee.jobTitle },
            { icon: Calendar, label: 'Date Hired', value: formatDate(employee.dateHired) },
            { icon: User, label: 'Employment Type', value: employee.employmentType?.replace('_',' ') },
            { icon: User, label: 'Status', value: employee.employmentStatus?.replace('_',' ') },
            { icon: User, label: 'Manager', value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—' },
            { icon: User, label: 'National ID', value: employee.nationalId || '—' },
            { icon: Building2, label: 'Bank', value: employee.bankName ? `${employee.bankName}` : '—' },
            { icon: Phone, label: 'Emergency Contact', value: employee.emergencyContact || '—' },
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

      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {balances.map((b: any) => (
              <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-900 text-sm">{b.leaveType}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{b.year}</span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min((b.used / b.allocated) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Used: <strong className="text-slate-900">{b.used}</strong></span>
                  <span>Remaining: <strong className="text-green-600">{b.remaining}</strong></span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Allocated: {b.allocated} days</div>
              </div>
            ))}
          </div>
          {employee?.leaves?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Leave History</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr>
                    {['Type','Days','From','To','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.leaves.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{l.leaveType}</td>
                        <td className="px-5 py-3 text-slate-600">{l.days}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(l.startDate)}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(l.endDate)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.status === 'APPROVED' ? 'bg-green-100 text-green-700' : l.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {!employee?.attendances?.length ? (
            <div className="text-center py-16 text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No attendance records</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200"><tr>
                  {['Date','Clock In','Clock Out','Hours','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.attendances.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{formatDate(a.date)}</td>
                      <td className="px-5 py-3 text-slate-600">{new Date(a.clockIn).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</td>
                      <td className="px-5 py-3 text-slate-600">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{a.totalHours ? `${a.totalHours.toFixed(1)}h` : '—'}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status==='PRESENT'?'bg-green-100 text-green-700':a.status==='LATE'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payroll' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {!employee?.payrolls?.length ? (
            <div className="text-center py-16 text-slate-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>No payslips yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200"><tr>
                  {['Period','Basic','Gross','PAYE','NHIF','NSSF','Net Pay'].map(h => <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase first:text-left">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.payrolls.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{new Date(0,p.month-1).toLocaleString('default',{month:'short'})} {p.year}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.basicSalary)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(p.grossSalary)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.paye)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.nhif)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(p.nssf)}</td>
                      <td className="px-4 py-3 text-right font-black text-green-600">{formatCurrency(p.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-md">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{field.label} *</label>
                <input type="password" required
                  value={(pwForm as any)[field.key]}
                  onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" disabled={pwLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2">
              {pwLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : <><CheckCircle className="w-4 h-4" />Update Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
