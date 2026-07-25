'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('demo@raavisolar.com')
  const [password, setPassword] = useState('demo123')
  const [name, setName] = useState('Raavi Solar Team')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const router = useRouter()

  if (user) {
    router.push('/')
    return <div className="h-screen bg-gray-50 grid place-items-center text-gray-600">Redirecting to Raavi Solar Studio...</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name)
    setLoading(false)
    if (res.error) setError(res.error)
    else router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <img src="/raavi-logo.png" alt="Raavi Solar" className="h-10 w-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="text-gray-500 mt-2 text-sm">Raavi Solar Design Studio • Jaipur Installers</p>
            <p className="text-gray-400 text-xs mt-1">📞 9214567383 • www.raavisolar.com</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div><label className="text-xs font-medium text-gray-700">Full Name / Company</label><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Raavi Solar" /></div>
              )}
              <div><label className="text-xs font-medium text-gray-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="you@raavisolar.com" /></div>
              <div><label className="text-xs font-medium text-gray-700">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <button disabled={loading} className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 hover:bg-black transition shadow">{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In →' : 'Create Account'}</button>
            </form>

            <div className="my-5 flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"></div><span className="text-xs text-gray-400">OR</span><div className="flex-1 h-px bg-gray-200"></div></div>

            <button onClick={signInWithGoogle} className="w-full bg-white border border-gray-200 text-gray-900 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50"> <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" /> Continue with Google</button>

            <div className="mt-6 text-center text-sm text-gray-500">
              {mode === 'signin' ? <>No account? <button onClick={() => setMode('signup')} className="text-gray-900 font-semibold hover:underline">Sign up</button></> : <>Have account? <button onClick={() => setMode('signin')} className="text-gray-900 font-semibold hover:underline">Sign in</button></>}
            </div>

            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <div className="font-bold mb-1">Demo Mode</div>
              demo@raavisolar.com / demo123 works without Supabase. Add Supabase keys for real auth.
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-white border-l border-gray-200 p-12 flex-col justify-between">
        <div />
        <div>
          <div className="text-4xl font-bold text-gray-900 leading-tight tracking-tight">Design solar<br/>like a pro,<br/><span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">3x faster</span></div>
          <div className="mt-4 text-gray-500 text-sm leading-relaxed">Raavi Solar Studio - Google Solar API + 3D Extrusion + Shade Heatmap + CRM + Proposals.</div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-gray-900 font-bold">⚡ 2.5kWp avg</div><div className="text-xs text-gray-500 mt-1">Jaipur residential</div></div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-green-700 font-bold">💰 ₹48k/kW</div><div className="text-xs text-gray-500 mt-1">Your margin</div></div>
          </div>
        </div>
        <div className="text-xs text-gray-400">© 2026 Raavi Solar - 9214567383 • www.raavisolar.com</div>
      </div>
    </div>
  )
}
