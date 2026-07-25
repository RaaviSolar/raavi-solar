'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Fallback mock if Supabase not configured
    if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('your-project') || process.env.NEXT_PUBLIC_SUPABASE_URL === undefined) {
      // Mock login for demo
      const mockUser = { id: 'mock-user', email, user_metadata: { full_name: 'Demo User' } } as any
      setUser(mockUser)
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      return {}
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('your-project') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const mockUser = { id: 'mock-user', email, user_metadata: { full_name: fullName } } as any
      setUser(mockUser)
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      return {}
    }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    localStorage.removeItem('mock_user')
    setUser(null)
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
