'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, Building2, Clock, Calendar,
  DollarSign, Briefcase, BarChart3, Megaphone, Star,
  Bell, Search, Menu, X, LogOut, Settings, UserCircle,
  Shield, ChevronDown, Building
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true,
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
  { href: '/dashboard/employees', icon: Users, label: 'Employees',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'] },
  { href: '/dashboard/departments', icon: Building2, label: 'Departments',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/attendance', icon: Clock, label: 'Attendance',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/leaves', icon: Calendar, label: 'Leave Management',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/payroll', icon: DollarSign, label: 'Payroll',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'] },
  { href: '/dashboard/recruitment', icon: Briefcase, label: 'Recruitment',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/performance', icon: Star, label: 'Performance',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/announcements', icon: Megaphone, label: 'Announcements',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'] },
  { href: '/dashboard/profile', icon: UserCircle, label: 'My Profile',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const role = session?.user?.role || 'EMPLOYEE'
  const employee = session?.user?.employee
  const filteredNav = navItems.filter(item => item.roles.includes(role))

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 transition-transform duration-300 ease-in-out flex flex-col
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">Helvino HRMS</div>
              <div className="text-slate-500 text-xs">Technologies Ltd</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden">
              {employee?.profilePhoto ? (
                <img src={employee.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(employee?.firstName || session?.user?.name?.split(' ')[0] || 'A', employee?.lastName || session?.user?.name?.split(' ')[1] || '')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {employee ? `${employee.firstName} ${employee.lastName}` : session?.user?.name}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-slate-400 text-xs truncate">{role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredNav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group
                ${isActive(item)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}>
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive(item) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} style={{ width: '18px', height: '18px' }} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive(item) && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-red-900/30 transition-all duration-150 group">
            <LogOut className="w-[18px] h-[18px] flex-shrink-0 group-hover:text-red-400" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 p-1">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {filteredNav.find(n => isActive(n))?.label || 'Dashboard'}
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                {currentTime.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank"
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors">
              <Building className="w-3.5 h-3.5" />
              helvino.org
            </Link>
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <Link href="/dashboard/profile"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm overflow-hidden hover:scale-105 transition-transform">
              {employee?.profilePhoto ? (
                <img src={employee.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(employee?.firstName || 'A', employee?.lastName || '')
              )}
            </Link>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
