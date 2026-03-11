'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Edit, Mail, Phone, UserX, Upload, X, FileText, Image, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
  RESIGNED: 'bg-gray-100 text-gray-600 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-700 border-red-200',
  PROBATION: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterDept) params.set('department', filterDept)
    if (filterStatus) params.set('status', filterStatus)
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/employees?${params}`),
        fetch('/api/departments'),
      ])
      const [empData, deptData] = await Promise.all([empRes.json(), deptRes.json()])
      setEmployees(Array.isArray(empData) ? empData : [])
      setDepartments(Array.isArray(deptData) ? deptData : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [search, filterDept, filterStatus])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm">{employees.length} total records</p>
        </div>
        <button onClick={() => { setEditingEmployee(null); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-blue-200 text-sm">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name, email, code..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-40">
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Status</option>
            {['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500">Loading...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-semibold">No employees found</p>
            <p className="text-sm mt-1">Add your first employee to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Employee', 'Department', 'Type', 'Date Hired', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm">
                          {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt="" className="w-full h-full object-cover" />
                          ) : `${emp.firstName[0]}${emp.lastName[0]}`}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{emp.firstName} {emp.lastName}</div>
                          <div className="text-slate-400 text-xs">{emp.employeeCode} · {emp.jobTitle}</div>
                          <div className="text-slate-400 text-xs">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-700 text-sm">{emp.department?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600 text-sm">{emp.employmentType?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600 text-sm">{formatDate(emp.dateHired)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[emp.employmentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {emp.employmentStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/employees/${emp.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => { setEditingEmployee(emp); setShowForm(true) }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <a href={`mailto:${emp.email}`}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Send Email">
                          <Mail className="w-4 h-4" />
                        </a>
                        <a href={`tel:${emp.phone}`}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Call">
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); loadData(); toast.success(editingEmployee ? 'Employee updated!' : 'Employee added successfully!') }}
        />
      )}
    </div>
  )
}

function FormField({ label, name, type = 'text', required = false, opts, form, set }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts ? (
        <select value={form[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
          <option value="">Select...</option>
          {opts.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o.replace(/_/g, ' ')}</option>)}
        </select>
      ) : (
        <input type={type} value={form[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
      )}
    </div>
  )
}

function EmployeeFormModal({ employee, departments, employees, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [form, setForm] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    personalEmail: employee?.personalEmail || '',
    phone: employee?.phone || '',
    nationalId: employee?.nationalId || '',
    dateOfBirth: employee?.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
    gender: employee?.gender || '',
    address: employee?.address || '',
    city: employee?.city || '',
    departmentId: employee?.departmentId || '',
    jobTitle: employee?.jobTitle || '',
    employmentType: employee?.employmentType || 'FULL_TIME',
    employmentStatus: employee?.employmentStatus || 'ACTIVE',
    dateHired: employee?.dateHired ? new Date(employee.dateHired).toISOString().split('T')[0] : '',
    probationEndDate: employee?.probationEndDate ? new Date(employee.probationEndDate).toISOString().split('T')[0] : '',
    basicSalary: employee?.basicSalary || '',
    managerId: employee?.managerId || '',
    bankName: employee?.bankName || '',
    bankBranch: employee?.bankBranch || '',
    bankCode: employee?.bankCode || '',
    bankAccount: employee?.bankAccount || '',
    mpesaPhone: employee?.mpesaPhone || '',
    kraPin: employee?.kraPin || '',
    shaNumber: employee?.shaNumber || '',
    nssfNumber: employee?.nssfNumber || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
    role: 'EMPLOYEE',
    idFrontUrl: employee?.idFrontUrl || '',
    idBackUrl: employee?.idBackUrl || '',
    passportPhotoUrl: employee?.passportPhotoUrl || '',
    kraPinUrl: employee?.kraPinUrl || '',
    nhifCardUrl: employee?.nhifCardUrl || '',
    nssfCardUrl: employee?.nssfCardUrl || '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // For new employees: store locally in form state
  function setDocLocal(field: string, dataUrl: string) { set(field, dataUrl) }
  // For existing employees: DocUpload uploads directly; update local preview too
  function onDocSaved(field: string, dataUrl: string) { set(field, dataUrl) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = employee ? `/api/employees/${employee.id}` : '/api/employees'
      const method = employee ? 'PATCH' : 'POST'
      // For existing employees, documents are already uploaded individually — exclude from payload
      const docFields = ['idFrontUrl','idBackUrl','passportPhotoUrl','kraPinUrl','nhifCardUrl','nssfCardUrl']
      const payload = employee
        ? Object.fromEntries(Object.entries(form).filter(([k]) => !docFields.includes(k)))
        : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'financial', label: 'Financial' },
    { id: 'documents', label: 'Documents' },
  ]
  const tabOrder = ['personal', 'employment', 'financial', 'documents']

  // send contract resend action for existing employee
  async function resendContract() {
    if (!employee) return
    try {
      const res = await fetch(`/api/employees/${employee.id}/contract`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Contract sent to employee\'s email!')
    } catch {
      toast.error('Failed to send contract')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{employee ? `Editing ${employee.firstName} ${employee.lastName}` : 'Fill in the employee details below'}</p>
          </div>
          <div className="flex items-center gap-2">
            {employee && (
              <button type="button" onClick={resendContract}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                <Send className="w-3 h-3" />Resend Contract
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">{error}</div>}

            {activeTab === 'personal' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" name="firstName" required form={form} set={set} />
                <FormField label="Last Name" name="lastName" required form={form} set={set} />
                <FormField label="Work Email" name="email" type="email" required form={form} set={set} />
                <FormField label="Personal Email" name="personalEmail" type="email" form={form} set={set} />
                <FormField label="Phone Number" name="phone" required form={form} set={set} />
                <FormField label="National ID / Passport" name="nationalId" form={form} set={set} />
                <FormField label="Date of Birth" name="dateOfBirth" type="date" form={form} set={set} />
                <FormField label="Gender" name="gender" opts={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other / Prefer not to say'}]} form={form} set={set} />
                <FormField label="City" name="city" form={form} set={set} />
                <FormField label="Address" name="address" form={form} set={set} />
                <FormField label="Emergency Contact Name" name="emergencyContact" form={form} set={set} />
                <FormField label="Emergency Contact Phone" name="emergencyPhone" form={form} set={set} />
              </div>
            )}

            {activeTab === 'employment' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Job Title" name="jobTitle" required form={form} set={set} />
                <FormField label="Department" name="departmentId" opts={departments.map((d: any) => ({ value: d.id, label: d.name }))} form={form} set={set} />
                <FormField label="Employment Type" name="employmentType" opts={['FULL_TIME','CONTRACT','INTERN','CONSULTANT'].map(v => ({ value: v, label: v.replace('_', ' ') }))} form={form} set={set} />
                <FormField label="Employment Status" name="employmentStatus" opts={['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED'].map(v => ({ value: v, label: v.replace('_', ' ') }))} form={form} set={set} />
                <FormField label="Date Hired" name="dateHired" type="date" required form={form} set={set} />
                <FormField label="Probation End Date" name="probationEndDate" type="date" form={form} set={set} />
                <FormField label="Reporting Manager" name="managerId"
                  opts={employees.filter((e: any) => e.id !== employee?.id).map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.jobTitle}` }))}
                  form={form} set={set} />
                <FormField label="System Role" name="role" opts={[
                  {value:'EMPLOYEE',label:'Employee (Self-Service)'},
                  {value:'DEPARTMENT_HEAD',label:'Department Head'},
                  {value:'HR_MANAGER',label:'HR Manager'},
                  {value:'FINANCE_OFFICER',label:'Finance Officer'},
                  {value:'SUPER_ADMIN',label:'Super Admin'},
                ]} form={form} set={set} />
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Basic Salary (KES)" name="basicSalary" type="number" form={form} set={set} />
                <FormField label="KRA PIN" name="kraPin" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Government Contributions</p>
                </div>
                <FormField label="SHA Number (formerly NHIF)" name="shaNumber" form={form} set={set} />
                <FormField label="NSSF Number" name="nssfNumber" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Details</p>
                </div>
                <FormField label="Bank Name" name="bankName" opts={[
                  'KCB Bank','Equity Bank','Co-operative Bank','NCBA Bank','Absa Bank',
                  'Standard Chartered','DTB Bank','Family Bank','I&M Bank','Stanbic Bank',
                  'Prime Bank','NIC Bank','Sidian Bank','Guaranty Trust Bank','HFC Bank',
                  'Bank of Africa','UBA Kenya','Gulf African Bank','First Community Bank','Consolidated Bank',
                ].map(b => ({ value: b, label: b }))} form={form} set={set} />
                <FormField label="Bank Branch" name="bankBranch" form={form} set={set} />
                <FormField label="Bank Code (Branch Code)" name="bankCode" form={form} set={set} />
                <FormField label="Account Number" name="bankAccount" form={form} set={set} />
                <div className="col-span-2 pt-1 pb-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Money</p>
                </div>
                <FormField label="M-Pesa Phone Number" name="mpesaPhone" form={form} set={set} />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  Upload supporting documents. Accepted: images (JPG, PNG) and PDFs. Max 4 MB each.
                  {!employee && <span className="font-semibold text-blue-700"> An employment contract will be auto-generated and emailed for digital signing when you save.</span>}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(['idFrontUrl','idBackUrl','passportPhotoUrl','kraPinUrl','nhifCardUrl','nssfCardUrl'] as const).map((field, i) => (
                    <DocUpload key={field}
                      label={['National ID — Front','National ID — Back','Passport Photo','KRA PIN Certificate','NHIF Card','NSSF Card'][i]}
                      field={field}
                      value={form[field]}
                      employeeId={employee?.id}
                      onSaved={onDocSaved}
                      onSetLocal={setDocLocal}
                      onClear={() => {
                        set(field, '')
                        if (employee?.id) {
                          fetch(`/api/employees/${employee.id}/documents`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ field, value: null }),
                          }).catch(console.error)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            {activeTab !== 'personal' && (
              <button type="button"
                onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) - 1])}
                className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm">
                ← Back
              </button>
            )}
            {activeTab !== 'documents' ? (
              <button type="button"
                onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) + 1])}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm">
                Next →
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                    : employee ? '💾 Update Employee' : '✅ Add Employee & Send Contract'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function DocUpload({ label, field, value, employeeId, onSaved, onSetLocal, onClear }: {
  label: string
  field: string
  value: string
  employeeId?: string   // if set → upload immediately; otherwise store locally for new employee
  onSaved?: (field: string, dataUrl: string) => void
  onSetLocal?: (field: string, dataUrl: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const isImage = value.startsWith('data:image')

  async function handleFile(file: File) {
    const MAX = 4 * 1024 * 1024
    if (file.size > MAX) { setErr('Max 4 MB per file'); return }
    setErr('')
    const reader = new FileReader()
    reader.onload = async e => {
      const dataUrl = e.target?.result as string
      if (employeeId) {
        // Existing employee — upload immediately
        setUploading(true)
        try {
          const res = await fetch(`/api/employees/${employeeId}/documents`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field, value: dataUrl }),
          })
          if (!res.ok) { setErr('Upload failed'); return }
          onSaved?.(field, dataUrl)
        } catch { setErr('Upload failed') }
        finally { setUploading(false) }
      } else {
        // New employee — store locally, send with form POST
        onSetLocal?.(field, dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500">{label}</label>
      {value ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group">
          {isImage ? (
            <img src={value} alt={label} className="w-full h-28 object-cover" />
          ) : (
            <div className="h-28 flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">PDF Uploaded</span>
            </div>
          )}
          <button type="button" onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
            <X className="w-3 h-3" />
          </button>
          {employeeId && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Saved</div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-60">
          {uploading
            ? <><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /><span className="text-xs">Uploading...</span></>
            : <><Upload className="w-5 h-5" /><span className="text-xs font-medium">Click to upload</span><span className="text-xs text-slate-300">JPG, PNG or PDF · max 4 MB</span></>
          }
        </button>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}
