'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, Users, Globe } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'employee' | 'client'>('employee')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      // Fetch session to determine role-based redirect
      const res = await fetch('/api/auth/session')
      const session = await res.json()
      if (session?.user?.role === 'CLIENT') {
        router.push('/client-portal/dashboard')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '50px 50px' }}
      />
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #3b82f6, transparent 50%)' }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-2xl shadow-blue-500/40">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Helvino Technologies</h1>
          <p className="text-blue-300 mt-1">Welcome — please sign in to continue</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setTab('employee'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                tab === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Login
            </button>
            <button
              onClick={() => { setTab('client'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                tab === 'client'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              Client Portal
            </button>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {tab === 'employee' ? 'Staff Sign In' : 'Client Sign In'}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                {tab === 'employee'
                  ? 'Sign in with your company credentials'
                  : 'Access your client portal account'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 bg-slate-50 transition-all"
                    placeholder={tab === 'employee' ? 'you@helvinocrm.org' : 'your@company.com'}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 bg-slate-50 transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
              {tab === 'client' && (
                <p className="text-slate-600 text-sm">
                  New client?{' '}
                  <Link href="/client-portal/register" className="text-blue-600 font-semibold hover:underline">
                    Create an account
                  </Link>
                </p>
              )}
              <p className="text-slate-500 text-sm">
                Account issues?{' '}
                <a href="mailto:hr@helvino.org" className="text-blue-600 font-semibold hover:underline">
                  {tab === 'employee' ? 'Contact HR' : 'Contact Support'}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-300/70 hover:text-blue-300 text-sm transition-colors">← Back to Website</Link>
        </div>

        <p className="text-center text-blue-300/40 text-xs mt-4">
          © {new Date().getFullYear()} Helvino Technologies Limited | helvinocrm.org | 0703445756
        </p>
      </div>
    </div>
  )
}
