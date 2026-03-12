'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, Building2, Clock, Calendar,
  DollarSign, Briefcase, BarChart3, Megaphone, Star,
  Bell, Search, Menu, X, LogOut, Settings, UserCircle,
  Shield, ChevronDown, Building, CheckCircle,
  TrendingUp, Target, FileText, Users2, RotateCcw, FolderOpen, Package, ListTodo,
  Video, Database, ShieldCheck,
  BookOpen, CreditCard, Receipt, Truck, Landmark, Percent, PiggyBank, ScrollText, ClipboardCheck,
  LifeBuoy
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const adminNavItems = [
  { href: '/dashboard/admin', icon: ShieldCheck, label: 'Admin Panel', exact: true,
    roles: ['SUPER_ADMIN'] },
]

const hrNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true,
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
  { href: '/dashboard/employees', icon: Users, label: 'Employees',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/departments', icon: Building2, label: 'Departments',
    roles: ['SUPER_ADMIN'] },
  { href: '/dashboard/attendance', icon: Clock, label: 'Attendance',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/leaves', icon: Calendar, label: 'Leave Management',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/payroll', icon: DollarSign, label: 'Payroll',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'] },
  { href: '/dashboard/performance', icon: Star, label: 'Performance',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/announcements', icon: Megaphone, label: 'Announcements',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD'] },
  { href: '/dashboard/profile', icon: UserCircle, label: 'My Profile',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
]

const recruitmentNavItems = [
  { href: '/dashboard/recruitment', icon: LayoutDashboard, label: 'Overview', exact: true,
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment/jobs', icon: Briefcase, label: 'Job Postings',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment/applications', icon: Users, label: 'Applications',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment/interviews', icon: Video, label: 'Interviews',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment/candidates', icon: Database, label: 'Talent Pool',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment/analytics', icon: BarChart3, label: 'ATS Analytics',
    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
]

const salesNavItems = [
  { href: '/dashboard/sales', icon: TrendingUp, label: 'Sales Overview', exact: true,
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER'] },
  { href: '/dashboard/sales/leads', icon: Target, label: 'Leads',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT'] },
  { href: '/dashboard/sales/quotations', icon: FileText, label: 'Quotations',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER'] },
  { href: '/dashboard/sales/clients', icon: Users2, label: 'Clients',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT'] },
  { href: '/dashboard/sales/subscriptions', icon: RotateCcw, label: 'Subscriptions',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'FINANCE_OFFICER'] },
  { href: '/dashboard/sales/tasks', icon: ListTodo, label: 'Sales Tasks',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT'] },
  { href: '/dashboard/sales/services', icon: Package, label: 'Service Catalog',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER'] },
  { href: '/dashboard/sales/portfolio', icon: FolderOpen, label: 'Portfolio',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_OFFICER', 'EMPLOYEE'] },
  { href: '/dashboard/sales/reports', icon: BarChart3, label: 'Sales Reports',
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'FINANCE_OFFICER'] },
]

const accountingNavItems = [
  { href: '/dashboard/accounting', icon: LayoutDashboard, label: 'Finance Dashboard', exact: true,
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/chart-of-accounts', icon: BookOpen, label: 'Chart of Accounts',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/invoices', icon: FileText, label: 'Invoices',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/payments', icon: CreditCard, label: 'Payments',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/expenses', icon: Receipt, label: 'Expenses',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/suppliers', icon: Truck, label: 'Suppliers & Bills',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/bank', icon: Landmark, label: 'Bank Accounts',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/taxes', icon: Percent, label: 'Tax Management',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/budgets', icon: PiggyBank, label: 'Budgets',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
  { href: '/dashboard/accounting/reports', icon: BarChart3, label: 'Financial Reports',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'] },
]

const policiesNavItems = [
  { href: '/dashboard/policies', icon: ScrollText, label: 'Company Policies', exact: true,
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
  { href: '/dashboard/policies/compliance', icon: ClipboardCheck, label: 'Policy Compliance',
    roles: ['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER'] },
]

const supportNavItems = [
  { href: '/dashboard/tickets', icon: LifeBuoy, label: 'Support Tickets', exact: false,
    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER', 'SALES_AGENT', 'DEPARTMENT_HEAD', 'FINANCE_OFFICER', 'EMPLOYEE'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const role = session?.user?.role || 'EMPLOYEE'

  // Enforce page-level access control: redirect if the current path is not in the user's allowed routes
  useEffect(() => {
    if (status !== 'authenticated') return
    // Redirect client portal users
    if (role === 'CLIENT') {
      router.replace('/client-portal/dashboard')
      return
    }
    const allItems = [...adminNavItems, ...hrNavItems, ...recruitmentNavItems, ...salesNavItems, ...accountingNavItems, ...policiesNavItems, ...supportNavItems]
    // Find the most specific nav item matching the current path
    const match = allItems
      .filter(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]
    if (match && !match.roles.includes(role)) {
      router.replace('/dashboard')
    }
  }, [pathname, role, status, router])
  const employee = session?.user?.employee
  const filteredAdminNav = adminNavItems.filter(item => item.roles.includes(role))
  const filteredHrNav = hrNavItems.filter(item => item.roles.includes(role))
  const filteredRecruitmentNav = recruitmentNavItems.filter(item => item.roles.includes(role))
  const filteredSalesNav = salesNavItems.filter(item => item.roles.includes(role))
  const filteredAccountingNav = accountingNavItems.filter(item => item.roles.includes(role))
  const filteredPoliciesNav = policiesNavItems.filter(item => item.roles.includes(role))
  const filteredSupportNav = supportNavItems.filter(item => item.roles.includes(role))
  const allNavItems = [...adminNavItems, ...hrNavItems, ...recruitmentNavItems, ...salesNavItems, ...accountingNavItems, ...policiesNavItems, ...supportNavItems]

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (d.items) { setNotifications(d.items); setUnreadCount(d.unreadCount) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  async function markAllRead() {
    const annIds = notifications.filter(n => !n.read && n.annId).map(n => n.annId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    if (annIds.length > 0) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementIds: annIds }),
      }).catch(() => {})
    }
  }

  function isActive(item: typeof hrNavItems[0]) {
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
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Admin Section */}
          {filteredAdminNav.length > 0 && (
            <div className="mb-3">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-red-400/80 uppercase tracking-wider">Administration</span>
              </div>
              <div className="space-y-0.5">
                {filteredAdminNav.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group ${isActive(item) ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:text-white hover:bg-red-900/30'}`}>
                    <item.icon className={`flex-shrink-0 ${isActive(item) ? 'text-white' : 'text-red-400/70 group-hover:text-red-300'}`} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive(item) && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* HR Section */}
          <div className="space-y-0.5">
            {filteredHrNav.map(item => (
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
          </div>

          {/* Recruitment Section */}
          {filteredRecruitmentNav.length > 0 && (
            <div className="mt-4">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recruitment & ATS</span>
              </div>
              <div className="space-y-0.5">
                {filteredRecruitmentNav.map(item => (
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
              </div>
            </div>
          )}

          {/* Sales Section - only show if user has access to any sales item */}
          {filteredSalesNav.length > 0 && (
            <div className="mt-4">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales & CRM</span>
              </div>
              <div className="space-y-0.5">
                {filteredSalesNav.map(item => (
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
              </div>
            </div>
          )}

          {/* Accounting & Finance Section */}
          {filteredAccountingNav.length > 0 && (
            <div className="mt-4">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">Accounting & Finance</span>
              </div>
              <div className="space-y-0.5">
                {filteredAccountingNav.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group
                      ${isActive(item)
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-emerald-900/30'
                      }
                    `}>
                    <item.icon className={`flex-shrink-0 ${isActive(item) ? 'text-white' : 'text-emerald-400/70 group-hover:text-emerald-300'}`} style={{ width: '18px', height: '18px' }} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive(item) && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* HR Policies Section */}
          {filteredPoliciesNav.length > 0 && (
            <div className="mt-4">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">HR Policies</span>
              </div>
              <div className="space-y-0.5">
                {filteredPoliciesNav.map(item => (
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
              </div>
            </div>
          )}

          {/* Support Section */}
          {filteredSupportNav.length > 0 && (
            <div className="mt-4">
              <div className="px-3 mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Support</span>
              </div>
              <div className="space-y-0.5">
                {filteredSupportNav.map(item => (
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
              </div>
            </div>
          )}
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
                {allNavItems.filter(item => item.roles.includes(role)).find(n => isActive(n))?.label || 'Dashboard'}
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
              helvinocrm.org
            </Link>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'announcement' ? 'bg-blue-100' : n.title.includes('Approved') ? 'bg-green-100' : 'bg-red-100'}`}>
                              {n.type === 'announcement'
                                ? <Megaphone className="w-4 h-4 text-blue-600" />
                                : <CheckCircle className={`w-4 h-4 ${n.title.includes('Approved') ? 'text-green-600' : 'text-red-500'}`} />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                                {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <Link href="/dashboard/announcements" onClick={() => setNotifOpen(false)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                      View all announcements →
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
