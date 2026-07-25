import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true }
})

export type LeadStatus = 'new' | 'design' | 'proposal' | 'won' | 'lost'

export interface Lead {
  id: string
  created_at?: string
  name: string
  phone: string
  email?: string
  address: string
  lat: number
  lng: number
  status: LeadStatus
  system_size_kw?: number
  panel_count?: number
  annual_prod_kwh?: number
  net_cost?: number
  roof_area_m2?: number
  notes?: string
  user_id?: string
}

export interface Project {
  id: string
  lead_id: string
  created_at?: string
  roof_polygon: number[][] // [lng, lat]
  panels: { lat: number, lng: number, w: number, h: number }[]
  tilt: number
  azimuth: number
  shading_loss: number
  panel_watt: number
  cost_per_kw: number
  has_battery: boolean
  annual_production: number
}

// Helper - fallback to localStorage if Supabase not configured
const LS_KEY = 'solar_leads_pro'

export async function getLeads(): Promise<Lead[]> {
  if (supabaseUrl.includes('your-project')) {
    // localStorage fallback
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  }
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data as Lead[]
}

export async function createLead(lead: Partial<Lead>): Promise<Lead | null> {
  if (supabaseUrl.includes('your-project')) {
    const newLead = { id: Date.now().toString(), created_at: new Date().toISOString(), status: 'new' as LeadStatus, ...lead } as Lead
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    existing.unshift(newLead)
    localStorage.setItem(LS_KEY, JSON.stringify(existing))
    return newLead
  }
  const { data, error } = await supabase.from('leads').insert(lead).select().single()
  if (error) { console.error(error); return null }
  return data as Lead
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  if (supabaseUrl.includes('your-project')) {
    const existing: Lead[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    const idx = existing.findIndex(l => l.id === id)
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updates }
      localStorage.setItem(LS_KEY, JSON.stringify(existing))
    }
    return existing[idx]
  }
  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single()
  if (error) console.error(error)
  return data
}
