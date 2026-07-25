'use client'
import { useEffect, useState, useRef } from 'react'
import { calculateProduction, calculateFinance } from '@/lib/calculations'
import { getLeads, createLead, updateLead, Lead } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import UserMenu from './UserMenu'
import JaipurMarketPanel from './JaipurMarketPanel'
import AdvancedToolsHub from './AdvancedToolsHub'
import { JAIPUR_PANELS } from '@/lib/jaipurMarketData'
import dynamic from 'next/dynamic'

const ThreeRoofViewer = dynamic(() => import('./ThreeRoofViewer'), { ssr: false })
const ShadeOverlay = dynamic(() => import('./ShadeHeatmapOverlay'), { ssr: false })
const AutoDesignWizard = dynamic(() => import('./AutoDesignWizard'), { ssr: false })
const RoofImageDesigner = dynamic(() => import('./RoofImageDesigner'), { ssr: false })

export default function SolarDesigner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [L, setL] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [roofPolygon, setRoofPolygon] = useState<number[][] | null>(null)
  const [roofArea, setRoofArea] = useState(0)
  const [panels, setPanels] = useState<{ lat: number, lng: number, id: string }[]>([])
  const [tilt, setTilt] = useState(15)
  const [azimuth, setAzimuth] = useState(180)
  const [shading, setShading] = useState(6)
  const [panelWatt, setPanelWatt] = useState(540)
  const [panelW, setPanelW] = useState(1.13)
  const [panelH, setPanelH] = useState(2.27)
  const [costPerKw, setCostPerKw] = useState(48000)
  const [subsidy, setSubsidy] = useState(0)
  const [hasBattery, setHasBattery] = useState(false)
  const [activeTab, setActiveTab] = useState<'design' | 'energy' | 'finance' | 'team' | 'market'>('design')
  const [showProposal, setShowProposal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showImageDesigner, setShowImageDesigner] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', address: '' })
  const [solarInsights, setSolarInsights] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [is3D, setIs3D] = useState(false)
  const [shadeEnabled, setShadeEnabled] = useState(false)
  const [currentCenter, setCurrentCenter] = useState({ lat: 26.9124, lng: 75.7873 })
  const [isClient, setIsClient] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      setIsLoggedIn(!!localStorage.getItem('mock_user'))
    } catch {}
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const leaflet = await import('leaflet')
        await import('leaflet-draw')
        const turf = await import('@turf/turf')
        ;(window as any).turf = turf
        setL(leaflet)
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link)
        const link2 = document.createElement('link'); link2.rel = 'stylesheet'; link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css'; document.head.appendChild(link2)
      } catch (e) { console.error('Leaflet load failed', e) }
    })()
    getLeads().then(setLeads).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return
    try {
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([26.9124, 75.7873], 19)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 22 }).addTo(map)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 22, opacity: 0.6 }).addTo(map)
      const drawnItems = new L.FeatureGroup().addTo(map)
      // @ts-ignore
      map.on(L.Draw.Event.CREATED, (e: any) => {
        try {
          const layer = e.layer
          const latlngs = layer.getLatLngs()[0].map((p: any) => [p.lng, p.lat])
          latlngs.push(latlngs[0])
          setRoofPolygon(latlngs)
          const turf = (window as any).turf
          const poly = turf.polygon([latlngs])
          setRoofArea(turf.area(poly))
          drawnItems.clearLayers()
          drawnItems.addLayer(layer)
          autoPlaceFromPoly(latlngs, map, turf)
        } catch {}
      })
      map.on('moveend', () => { try { const c = map.getCenter(); setCurrentCenter({ lat: c.lat, lng: c.lng }) } catch {} })
      ;(window as any).solarMap = map
      ;(window as any).drawnItemsGlobal = drawnItems
      mapRef.current = map
      fetchSolarInsights(26.9124, 75.7873)
    } catch (e) { console.error('Map init failed', e) }
  }, [L])

  const prod = calculateProduction({ panelCount: panels.length, panelWatt, tilt, azimuth, shadingLoss: shading, roofArea, costPerKw, subsidy, hasBattery })
  const finance = calculateFinance(prod.systemKw, prod.annualKwh, costPerKw, subsidy, hasBattery)

  function getRect(center: [number, number], wM: number, hM: number) {
    const lat = center[0], lng = center[1]
    const mToLat = 1 / 111000, mToLng = 1 / (111000 * Math.cos(lat * Math.PI / 180))
    const dLat = (hM / 2) * mToLat, dLng = (wM / 2) * mToLng
    return [[lat - dLat, lng - dLng], [lat - dLat, lng + dLng], [lat + dLat, lng + dLng], [lat + dLat, lng - dLng]]
  }

  function autoPlaceFromPoly(polyLngLat: number[][], mapInstance = mapRef.current, turf = (window as any).turf, limit?: number) {
    if (!polyLngLat || !mapInstance || !turf) return { placed: 0, poly: polyLngLat }
    try {
      const pW = panelW, pH = panelH, gap = 0.25
      const poly = turf.polygon([polyLngLat])
      const bbox = turf.bbox(poly)
      const avgLat = polyLngLat[0][1]
      const mToLat = 1 / 111000
      const mToLng = 1 / (111000 * Math.cos(avgLat * Math.PI / 180))
      const stepX = (pW + gap) * mToLng, stepY = (pH + gap) * mToLat
      const newPanels: any[] = []
      ;(window as any).panelLayers?.forEach((l: any) => { try { mapInstance.removeLayer(l) } catch {} })
      ;(window as any).panelLayers = []
      let count = 0
      for (let lng = bbox[0]; lng < bbox[2] && (limit ? count < limit : true); lng += stepX) {
        for (let lat = bbox[1]; lat < bbox[3] && (limit ? count < limit : true); lat += stepY) {
          try {
            const pt = turf.point([lng + stepX / 2, lat + stepY / 2])
            if (turf.booleanPointInPolygon(pt, poly)) {
              const id = Math.random().toString(36).slice(2)
              const latlng: [number, number] = [lat + stepY / 2, lng + stepX / 2]
              const rect = getRect(latlng, pW, pH)
              const layer = L.polygon(rect, { color: '#2563eb', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.85 }).addTo(mapInstance)
              layer.on('click', () => { try { mapInstance.removeLayer(layer); setPanels(prev => prev.filter(p => p.id !== id)) } catch {} })
              ;(window as any).panelLayers.push(layer)
              newPanels.push({ lat: latlng[0], lng: latlng[1], id })
              count++
            }
          } catch {}
        }
      }
      setPanels(newPanels)
      return { placed: newPanels.length, poly: polyLngLat }
    } catch (e) { console.error(e); return { placed: 0, poly: polyLngLat } }
  }

  const handleAutoDesign = (desiredKw: number, panelsNeeded: number, autoRoof: boolean) => {
    try {
      const turf = (window as any).turf
      if (!turf || !mapRef.current || !L) return
      let targetPoly = roofPolygon
      if (!targetPoly || autoRoof) {
        const areaPerPanel = panelW * panelH * 1.4
        const totalAreaNeeded = panelsNeeded * areaPerPanel * 1.2
        const side = Math.sqrt(totalAreaNeeded)
        const halfSideLat = (side / 2) / 111000
        const halfSideLng = (side / 2) / (111000 * Math.cos(currentCenter.lat * Math.PI / 180))
        const cLat = currentCenter.lat, cLng = currentCenter.lng
        targetPoly = [
          [cLng - halfSideLng, cLat - halfSideLat],
          [cLng + halfSideLng, cLat - halfSideLat],
          [cLng + halfSideLng, cLat + halfSideLat],
          [cLng - halfSideLng, cLat + halfSideLat],
          [cLng - halfSideLng, cLat - halfSideLat],
        ]
        const poly = turf.polygon([targetPoly])
        setRoofPolygon(targetPoly)
        setRoofArea(turf.area(poly))
        const drawnItems = (window as any).drawnItemsGlobal
        if (drawnItems) {
          try {
            drawnItems.clearLayers()
            const latlngs = targetPoly.map(([lng, lat]: number[]) => ({ lat, lng }))
            const layer = L.polygon(latlngs, { color: '#16a34a', weight: 3, dashArray: '8 8', fillColor: '#dcfce7', fillOpacity: 0.4 }).addTo(mapRef.current)
            drawnItems.addLayer(layer)
          } catch {}
        }
        if (solarInsights?.solarPotential?.roofSegmentStats?.[0]) {
          setTilt(Math.round(solarInsights.solarPotential.roofSegmentStats[0].pitchDegrees))
          setAzimuth(Math.round(solarInsights.solarPotential.roofSegmentStats[0].azimuthDegrees))
        }
      }
      autoPlaceFromPoly(targetPoly!, mapRef.current, turf, panelsNeeded)
      if (selectedLead) { updateLead(selectedLead.id, { system_size_kw: desiredKw, panel_count: panelsNeeded }).catch(()=>{}) }
    } catch (e) { console.error('Auto design failed', e) }
  }

  const fetchSolarInsights = async (lat: number, lng: number) => {
    try {
      const bRes = await fetch(`/api/solar/building-insights?lat=${lat}&lng=${lng}`)
      const bData = await bRes.json()
      setSolarInsights(bData)
      if (bData?.solarPotential?.roofSegmentStats?.[0]) {
        setTilt(Math.round(bData.solarPotential.roofSegmentStats[0].pitchDegrees))
        setAzimuth(Math.round(bData.solarPotential.roofSegmentStats[0].azimuthDegrees))
      }
    } catch (e) { console.error(e) }
  }

  const handleSearch = async (q = search) => {
    if (!q) return
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`)
      const data = await r.json()
      setSearchResults(data)
    } catch { }
  }

  const selectResult = (item: any) => {
    try {
      if (!mapRef.current) return
      const lat = parseFloat(item.lat), lng = parseFloat(item.lon)
      mapRef.current.setView([lat, lng], 20)
      L.marker([lat, lng]).addTo(mapRef.current).bindPopup(item.display_name).openPopup()
      setSearchResults([]); setSearch(item.display_name)
      setCurrentCenter({ lat, lng })
      fetchSolarInsights(lat, lng)
      setTimeout(() => setShowWizard(true), 600)
    } catch {}
  }

  if (loading) return <div className="h-screen bg-gray-50 grid place-items-center text-gray-600">Loading Raavi Solar...</div>

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] text-gray-900 overflow-hidden">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/raavi-logo.png" alt="Raavi Solar" className="h-8 w-auto object-contain" style={{ maxWidth: '160px' }} />
          <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
            <span className="text-xs text-gray-500">www.raavisolar.com • 9214567383</span>
            {solarInsights?.mocked && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">Mock Data</span>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowImageDesigner(true)} className="px-3 py-1.5 text-xs rounded-xl bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:bg-gray-50">📸 Upload Roof</button>
          <button onClick={() => setShowAdvanced(true)} className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold shadow">🧪 Advanced</button>
          <button onClick={() => setShowWizard(true)} className="px-4 py-1.5 text-xs rounded-xl bg-gray-900 text-white font-bold shadow hover:bg-black">🤖 AI Auto Design</button>
          <button onClick={() => setShadeEnabled(!shadeEnabled)} className={`px-3 py-1.5 text-xs rounded-lg border font-medium ${shadeEnabled ? 'bg-amber-400 text-black border-amber-400' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{shadeEnabled ? '☀️ Hide' : '🌡️ Heatmap'}</button>
          <button onClick={() => setIs3D(!is3D)} className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium shadow-sm">{is3D ? '🗺️ 2D' : '🎥 3D'}</button>
          <button onClick={() => setShowProposal(true)} className="px-4 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow">📄 Proposal</button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {isClient && (user || isLoggedIn) ? <UserMenu /> : <button onClick={() => router.push('/auth')} className="px-3 py-1.5 text-xs rounded-lg bg-gray-900 text-white font-semibold">Login →</button>}
        </div>
      </div>

      {isClient && !user && !isLoggedIn && (
        <div className="bg-blue-50 border-b border-blue-200 text-xs text-center py-2 text-blue-800">💡 <b>Next Level:</b> Address डालते ही AI पूछेगा कितने kW चाहिए, फिर खुद roof design कर देगा! • <button onClick={() => setShowWizard(true)} className="underline font-bold">Try AI Auto Design →</button></div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[300px] bg-white border-r border-gray-200 flex flex-col hidden lg:flex shadow-sm">
          <div className="p-3 border-b border-gray-100">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider"><span>CRM • Leads</span><button onClick={() => setShowLeadModal(true)} className="bg-gray-900 text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-black">+ New</button></div>
            <input id="quickLead" placeholder="Quick add name + Enter" className="w-full mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={e => { if (e.key === 'Enter') { const el = e.target as HTMLInputElement; if (!el.value.trim()) return; createLead({ name: el.value.trim(), phone: '', address: '', lat: currentCenter.lat, lng: currentCenter.lng, status: 'new' }).then(l => { if (l) { setLeads(p => [l, ...p]); setSelectedLead(l); el.value = '' } }).catch(()=>{}) } }} />
            {solarInsights && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[11px] space-y-1.5">
                <div className="font-bold text-gray-900">☀️ Google Solar API</div>
                <div className="text-gray-500">Quality: {solarInsights.imageryQuality}</div>
                <div className="text-gray-600">Max: <b>{solarInsights.solarPotential?.maxArrayPanelsCount}</b> panels</div>
                <div className="mt-2 space-y-1">
                  {solarInsights.solarPotential?.roofSegmentStats?.slice(0, 2).map((seg: any, i: number) => (
                    <div key={i} className={`p-2 rounded-lg border text-[11px] ${i === 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-gray-200'}`}>
                      {i === 0 ? '★ BEST' : `Seg ${i + 1}`}: {seg.pitchDegrees?.toFixed(0)}° / {seg.azimuthDegrees?.toFixed(0)}°
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50">
            {leads.map(lead => (
              <div key={lead.id} onClick={() => { setSelectedLead(lead); if (lead.lat) { try { mapRef.current?.setView([lead.lat, lead.lng], 19); fetchSolarInsights(lead.lat, lead.lng) } catch {} } }} className={`bg-white border rounded-xl p-3 cursor-pointer shadow-sm hover:shadow transition ${selectedLead?.id === lead.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                <div className="flex justify-between"><span className="font-semibold text-[13px] text-gray-900">{lead.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">{lead.status}</span></div>
                <div className="text-[11px] text-gray-500 mt-1.5">⚡ {lead.system_size_kw?.toFixed(2) || prod.systemKw.toFixed(2)}kW • {lead.panel_count || panels.length} panels</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative bg-[#eef2f7] flex flex-col">
          <div className="absolute top-3 left-3 z-[500] flex gap-2">
            <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-xl p-2 flex gap-2 shadow-lg">
              <button onClick={() => { try { if (!mapRef.current || !L) return; // @ts-ignore
                  new L.Draw.Polygon(mapRef.current, { allowIntersection: false, shapeOptions: { color: '#2563eb', weight: 3 } }).enable()
                } catch {} }} className="bg-gray-900 text-white text-xs px-3.5 py-2 rounded-lg font-semibold hover:bg-black shadow">✏️ Draw Roof</button>
              <button onClick={() => setShowImageDesigner(true)} className="bg-white border border-gray-200 text-gray-700 text-xs px-3.5 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-50">📸 Upload Roof Image</button>
              <button onClick={() => setShowWizard(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3.5 py-2 rounded-lg font-bold shadow">🤖 AI kW → Auto Design</button>
              {roofArea > 0 && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg font-semibold">{roofArea.toFixed(0)}m² • {panels.length} panels</span>}
            </div>
          </div>
          <div className="absolute top-3 right-3 z-[500] w-[300px]">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="🔍 Address डालें - Tonk Road Jaipur" className="w-full px-4 py-2.5 text-sm focus:outline-none placeholder:text-gray-400" />
              <div className="px-3 py-1.5 bg-blue-50 text-[10px] text-blue-700 border-t border-blue-100">💡 Address select करते ही AI kW पूछेगा और auto design करेगा</div>
            </div>
            {searchResults.length > 0 && <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-auto">{searchResults.map((r: any, i: number) => <div key={i} onClick={() => selectResult(r)} className="p-3 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700"><b>{r.display_name.split(',')[0]}</b><br/><span className="text-gray-500">{r.display_name}</span></div>)}</div>}
          </div>
          <div ref={mapContainerRef} className="flex-1 w-full" />
          {shadeEnabled && mapRef.current && L && isClient && <ShadeOverlay map={mapRef.current} L={L} center={currentCenter} enabled={shadeEnabled} />}
          {is3D && <ThreeRoofViewer roofPolygon={roofPolygon} roofSegments={solarInsights?.solarPotential?.roofSegmentStats} panels={panels} tilt={tilt} azimuth={azimuth} onClose={() => setIs3D(false)} />}
        </div>

        <div className="w-[360px] bg-white border-l border-gray-200 flex flex-col shadow-sm">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {(['design', 'energy', 'finance', 'team', 'market'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider ${activeTab === t ? 'bg-white border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {activeTab === 'design' && (
              <>
                <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-4 mb-4">
                  <div className="text-xs text-gray-300 uppercase font-semibold">Current Design</div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><div className="text-2xl font-bold">{panels.length}</div><div className="text-xs text-gray-400">Panels x {panelWatt}W</div></div>
                    <div><div className="text-2xl font-bold">{prod.systemKw.toFixed(2)}kW</div><div className="text-xs text-gray-400">System Size</div></div>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs"><span className="bg-white/20 px-2 py-1 rounded-full">{roofArea.toFixed(0)}m² roof</span><span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full">{Math.round(prod.annualKwh).toLocaleString()} kWh/yr</span></div>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800"><b>🤖 AI Mode:</b> Address → kW input → Roof auto-detect → Panels auto-place</div>
                </div>
              </>
            )}
            {activeTab === 'energy' && (
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-3">Monthly - {prod.systemKw.toFixed(2)}kW</div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-end gap-1 h-32">{prod.monthly.map((v, i) => <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{ height: `${(v / (Math.max(...prod.monthly) || 1)) * 100}%` }} />)}</div>
                </div>
              </div>
            )}
            {activeTab === 'finance' && (
              <div className="space-y-3">
                <div className="bg-gray-900 text-white rounded-xl p-4"><div className="text-sm">💰 <b>₹{Math.round(finance.net).toLocaleString()}</b> Net Cost • {finance.payback.toFixed(1)}yr payback</div><div className="text-xs text-gray-400 mt-1">25yr saving ₹{Math.round(finance.twentyFiveYearSaving).toLocaleString()}</div></div>
              </div>
            )}
            {activeTab === 'team' && <div className="text-sm text-gray-500">Raavi Solar Team - Multi-user enabled</div>}
            {activeTab === 'market' && (
              <div className="-m-4">
                <JaipurMarketPanel onSelectQuote={(kw, sku, struct) => {
                  const p = JAIPUR_PANELS.find(x=>x.sku===sku)
                  setPanelWatt(p?.watt || 540)
                  const panelsNeeded = Math.ceil(kw*1000/(p?.watt || 540))
                  handleAutoDesign(kw, panelsNeeded, true)
                  setActiveTab('design')
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AutoDesignWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onAutoDesign={handleAutoDesign} solarInsights={solarInsights} currentCenter={currentCenter} panelWatt={panelWatt} roofArea={roofArea} />

      {showImageDesigner && (
        <RoofImageDesigner
          onClose={() => setShowImageDesigner(false)}
          panelWatt={panelWatt}
          panelW={panelW}
          panelH={panelH}
          onDesignComplete={(count, area) => {
            setRoofArea(area)
            const newPanels = Array.from({ length: count }, (_, i) => ({ lat: currentCenter.lat + (i * 0.00001), lng: currentCenter.lng + (i * 0.00001), id: Math.random().toString(36).slice(2) }))
            setPanels(newPanels as any)
            setShowImageDesigner(false)
          }}
        />
      )}

      {showAdvanced && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3"><img src="/raavi-logo.png" alt="Raavi" className="h-7 w-auto" /><span className="font-bold">Raavi Solar - Advanced Tools Hub (5 Features)</span></div>
              <button onClick={() => setShowAdvanced(false)} className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <AdvancedToolsHub panelsCount={panels.length} panelWatt={panelWatt} systemKw={prod.systemKw} roofArea={roofArea} roofPolygon={roofPolygon} annualProd={prod.annualKwh} map={mapRef.current} currentCenter={currentCenter} shadingLoss={shading} tilt={tilt} leadName={selectedLead?.name} leadPhone={selectedLead?.phone} />
            </div>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] grid place-items-center p-4" onClick={() => setShowLeadModal(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-[380px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="font-bold text-gray-900 mb-4">New Lead</div>
            <input placeholder="Name" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3" />
            <input placeholder="Phone" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3" />
            <input placeholder="Address" value={newLead.address} onChange={e => setNewLead({ ...newLead, address: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            <div className="flex gap-2 mt-5"><button onClick={() => setShowLeadModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100">Cancel</button><button onClick={async () => { if (!newLead.name) return; const lead = await createLead({ name: newLead.name, phone: newLead.phone, address: newLead.address, lat: currentCenter.lat, lng: currentCenter.lng, status: 'design' }); if (lead) { setLeads(p => [lead, ...p]); setSelectedLead(lead); setShowLeadModal(false); } }} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-semibold">Save</button></div>
          </div>
        </div>
      )}

      {showProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setShowProposal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[800px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between"><div className="flex gap-3"><img src="/raavi-logo.png" className="h-10 w-auto" /><div><div className="font-bold">Raavi Solar</div><div className="text-xs text-gray-500">{selectedLead?.name || 'Demo'} • 9214567383 • www.raavisolar.com</div></div></div><div className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-bold">⚡ {prod.systemKw.toFixed(2)}kW</div></div>
            <div className="p-6 bg-gray-50"><div className="grid grid-cols-2 gap-4 text-sm"><div className="bg-white border rounded-xl p-4">Panels: {panels.length} x {panelWatt}W<br/>Prod: {Math.round(prod.annualKwh).toLocaleString()} kWh/yr</div><div className="bg-green-50 border border-green-200 rounded-xl p-4">Net ₹{Math.round(finance.net).toLocaleString()} • Payback {finance.payback.toFixed(1)}yr</div></div><div className="mt-4 flex gap-2"><button onClick={() => { try { window.print() } catch {} }} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm">🖨️ Print PDF</button><button onClick={() => setShowProposal(false)} className="px-5 py-2.5 bg-white border rounded-xl text-sm">Close</button></div></div>
          </div>
        </div>
      )}
    </div>
  )
}
