'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Edit, Mail, Phone, UserX, Download } from 'lucide-react'
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
    bankAccount: employee?.bankAccount || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
    role: 'EMPLOYEE',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = employee ? `/api/employees/${employee.id}` : '/api/employees'
      const method = employee ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
  ]

  const F = ({ label, name, type = 'text', required = false, opts }: any) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {opts ? (
        <select value={(form as any)[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900">
          <option value="">Select...</option>
          {opts.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o.replace('_', ' ')}</option>)}
        </select>
      ) : (
        <input type={type} value={(form as any)[name]} onChange={e => set(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{employee ? `Editing ${employee.firstName} ${employee.lastName}` : 'Fill in the employee details below'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
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
                <F label="First Name" name="firstName" required />
                <F label="Last Name" name="lastName" required />
                <F label="Work Email" name="email" type="email" required />
                <F label="Personal Email" name="personalEmail" type="email" />
                <F label="Phone Number" name="phone" required />
                <F label="National ID / Passport" name="nationalId" />
                <F label="Date of Birth" name="dateOfBirth" type="date" />
                <F label="Gender" name="gender" opts={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other / Prefer not to say'}]} />
                <F label="City" name="city" />
                <F label="Address" name="address" />
                <F label="Emergency Contact Name" name="emergencyContact" />
                <F label="Emergency Contact Phone" name="emergencyPhone" />
              </div>
            )}

            {activeTab === 'employment' && (
              <div className="grid grid-cols-2 gap-4">
                <F label="Job Title" name="jobTitle" required />
                <F label="Department" name="departmentId" opts={departments.map((d: any) => ({ value: d.id, label: d.name }))} />
                <F label="Employment Type" name="employmentType" opts={['FULL_TIME','CONTRACT','INTERN','CONSULTANT'].map(v => ({ value: v, label: v.replace('_', ' ') }))} />
                <F label="Employment Status" name="employmentStatus" opts={['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED'].map(v => ({ value: v, label: v.replace('_', ' ') }))} />
                <F label="Date Hired" name="dateHired" type="date" required />
                <F label="Probation End Date" name="probationEndDate" type="date" />
                <F label="Reporting Manager" name="managerId"
                  opts={employees.filter((e: any) => e.id !== employee?.id).map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.jobTitle}` }))} />
                <F label="System Role" name="role" opts={[
                  {value:'EMPLOYEE',label:'Employee (Self-Service)'},
                  {value:'DEPARTMENT_HEAD',label:'Department Head'},
                  {value:'HR_MANAGER',label:'HR Manager'},
                  {value:'FINANCE_OFFICER',label:'Finance Officer'},
                  {value:'SUPER_ADMIN',label:'Super Admin'},
                ]} />
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="grid grid-cols-2 gap-4">
                <F label="Basic Salary (KES)" name="basicSalary" type="number" />
                <div /> {/* spacer */}
                <F label="Bank Name" name="bankName" />
                <F label="Bank Account Number" name="bankAccount" />
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            {activeTab !== 'personal' && (
              <button type="button" onClick={() => setActiveTab(activeTab === 'financial' ? 'employment' : 'personal')}
                className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 text-sm">← Back</button>
            )}
            {activeTab !== 'financial' ? (
              <button type="button" onClick={() => setActiveTab(activeTab === 'personal' ? 'employment' : 'financial')}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm">Next →</button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : (employee ? '💾 Update Employee' : '✅ Add Employee')}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
