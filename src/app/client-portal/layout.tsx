'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Package, FolderOpen, FileText, Receipt,
  RotateCcw, LifeBuoy, Files, UserCircle, LogOut, Menu, X,
  Building2, Bell, ChevronRight, Globe
} from 'lucide-react'

const navItems = [
  { href: '/client-portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/client-portal/services', icon: Package, label: 'Service Requests' },
  { href: '/client-portal/projects', icon: FolderOpen, label: 'My Projects' },
  { href: '/client-portal/quotations', icon: FileText, label: 'Quotations' },
  { href: '/client-portal/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/client-portal/subscriptions', icon: RotateCcw, label: 'Subscriptions' },
  { href: '/client-portal/tickets', icon: LifeBuoy, label: 'Support Tickets' },
  { href: '/client-portal/documents', icon: Files, label: 'Documents' },
  { href: '/client-portal/profile', icon: UserCircle, label: 'My Profile' },
]

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated' && session.user.role !== 'CLIENT') {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'CLIENT') {
      fetch('/api/client/notifications')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setNotifications(d) })
        .catch(() => {})
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session.user.role !== 'CLIENT')) {
    return null
  }

  const client = session?.user?.client
  const unreadCount = notifications.filter(n => !n.isRead).length

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await fetch('/api/client/notifications', { method: 'PATCH' }).catch(() => {})
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
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
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">Client Portal</div>
              <div className="text-slate-500 text-xs">Helvino Technologies</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client info */}
        <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              {(client?.companyName || session?.user?.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {client?.companyName || session?.user?.name}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-slate-400 text-xs truncate">Client Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Menu</span>
          </div>
          <div className="space-y-0.5">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group
                  ${isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}>
                <item.icon className={`flex-shrink-0 ${isActive(item.href) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} style={{ width: '18px', height: '18px' }} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive(item.href) && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
          <button onClick={() => signOut({ callbackUrl: '/login' })}
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
                {navItems.find(n => isActive(n.href))?.label || 'Client Portal'}
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank"
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors">
              <Building2 className="w-3.5 h-3.5" />
              helvinocrm.org
            </Link>

            {/* Notifications */}
            <div className="relative">
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
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                                {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href="/client-portal/profile"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm hover:scale-105 transition-transform">
              {(client?.companyName || session?.user?.name || 'C').charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
