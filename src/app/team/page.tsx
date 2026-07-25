'use client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function TeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 p-8">
      <div className="flex items-center gap-3 mb-6">
        <img src="/raavi-logo.png" alt="Raavi Solar" className="h-8 w-auto" />
        <span className="text-sm text-gray-500">www.raavisolar.com • 9214567383</span>
      </div>
      <button onClick={() => router.push('/')} className="text-sm mb-6 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50">← Back to Designer</button>
      <h1 className="text-2xl font-bold">👥 Team Management</h1>
      <p className="text-gray-500 text-sm mt-2">Raavi Solar - Multi-user SaaS like OpenSolar</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="font-bold">Owner</div>
          <div className="text-xs text-gray-500 mt-2">Full access • CRM + Design + Finance + Team + Billing</div>
          <div className="mt-4 text-xs bg-gray-50 border rounded-lg p-2">{user?.email || 'demo@raavisolar.com'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="font-bold">Sales</div>
          <div className="text-xs text-gray-500 mt-2">CRM only • Can create leads, view proposals</div>
          <button className="mt-4 w-full bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl">Invite Sales User</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="font-bold">Designer</div>
          <div className="text-xs text-gray-500 mt-2">Design only • Roof draw, panels, 3D, shade</div>
          <button className="mt-4 w-full bg-white border border-gray-200 text-xs py-2.5 rounded-xl">Invite Designer</button>
        </div>
      </div>
    </div>
  )
}
