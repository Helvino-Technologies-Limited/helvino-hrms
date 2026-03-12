'use client'
import { useEffect, useState } from 'react'
import { RotateCcw, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  SUSPENDED: 'bg-amber-100 text-amber-700',
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [renewModal, setRenewModal] = useState<any>(null)

  useEffect(() => {
    fetch('/api/client/subscriptions')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSubscriptions(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const expiring = subscriptions.filter(s => s.status === 'ACTIVE' && daysUntil(s.expiryDate) <= 30)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your recurring services and renewals</p>
      </div>

      {expiring.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {expiring.length} subscription{expiring.length > 1 ? 's' : ''} expiring within 30 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {expiring.map(s => s.serviceName).join(', ')} — renew now to avoid disruption.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RotateCcw className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No subscriptions yet</h3>
          <p className="text-slate-400 text-sm mt-1">Your recurring services will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {subscriptions.map(sub => {
            const days = daysUntil(sub.expiryDate)
            const isExpiringSoon = sub.status === 'ACTIVE' && days <= 30 && days > 0
            const isExpired = sub.status === 'EXPIRED' || days <= 0
            return (
              <div key={sub.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isExpiringSoon ? 'border-amber-200' : isExpired ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <RotateCcw className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{sub.serviceName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[sub.status] || 'bg-slate-100 text-slate-600'}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                    {sub.description && <p className="text-sm text-slate-500 mt-2">{sub.description}</p>}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Renewal Price</span>
                    <span className="font-bold text-slate-900">KES {Number(sub.renewalPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Billing Cycle</span>
                    <span className="text-slate-700 font-medium">{sub.billingCycle}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Start Date</span>
                    <span className="text-slate-700">{new Date(sub.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Expiry Date</span>
                    <span className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                      {new Date(sub.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {sub.status === 'ACTIVE' && (
                  <div className={`mt-4 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    isExpired ? 'bg-red-50 text-red-700' :
                    isExpiringSoon ? 'bg-amber-50 text-amber-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {isExpired ? <AlertCircle className="w-4 h-4" /> : isExpiringSoon ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {isExpired ? 'Expired' : isExpiringSoon ? `Expires in ${days} day${days !== 1 ? 's' : ''}` : `Active — ${days} days remaining`}
                  </div>
                )}

                {(isExpiringSoon || isExpired || sub.status === 'EXPIRED') && (
                  <button
                    onClick={() => setRenewModal(sub)}
                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Renew Now
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Renewal Instructions Modal */}
      {renewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Renew Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">{renewModal.serviceName}</p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
              <p className="text-sm font-bold text-blue-800 mb-1">Renewal Amount</p>
              <p className="text-2xl font-bold text-blue-900">KES {Number(renewModal.renewalPrice).toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">per {renewModal.billingCycle.toLowerCase()} period</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 mb-4">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                To renew, make payment and contact us at <span className="font-semibold">support@helvino.org</span> or WhatsApp <span className="font-semibold">+254 703 445 756</span> with your company name and service name.
              </p>
            </div>
            <button onClick={() => setRenewModal(null)}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
