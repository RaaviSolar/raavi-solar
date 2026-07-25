'use client'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User'
  const email = user.email || 'demo@jaipursolar.com'

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white grid place-items-center text-xs font-bold">{name[0].toUpperCase()}</div>
        <span className="text-xs font-medium hidden md:block text-gray-700">{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[#181b22] border border-[#252b38] rounded-xl shadow-xl overflow-hidden z-[1000]">
          <div className="p-3 border-b border-[#252b38]">
            <div className="font-semibold text-sm">{name}</div>
            <div className="text-xs text-[#8a93a5]">{email}</div>
            <div className="mt-2 text-[11px] bg-[#14281c] border border-green-900 text-green-400 px-2 py-1 rounded-full inline-block">● Team: Jaipur Solar Pro</div>
          </div>
          <div className="p-2">
            <button className="w-full text-left text-xs px-3 py-2 hover:bg-[#1f242f] rounded">👥 Manage Team (3 members)</button>
            <button className="w-full text-left text-xs px-3 py-2 hover:bg-[#1f242f] rounded">⚙️ Settings & Branding</button>
            <button className="w-full text-left text-xs px-3 py-2 hover:bg-[#1f242f] rounded">💳 Billing - Free Plan</button>
            <div className="h-px bg-[#252b38] my-1" />
            <button onClick={() => signOut()} className="w-full text-left text-xs px-3 py-2 hover:bg-[#1a2336] rounded text-red-400">🚪 Sign Out</button>
          </div>
        </div>
      )}
    </div>
  )
}
