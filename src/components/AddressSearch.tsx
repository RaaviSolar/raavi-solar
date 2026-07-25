'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  map: any
  L: any
  currentCenter: { lat: number, lng: number }
  onLocationChange: (lat: number, lng: number, address: string) => void
  setCurrentCenter: (c: { lat: number, lng: number }) => void
}

export default function AddressSearch({ map, L, currentCenter, onLocationChange, setCurrentCenter }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCoordInput, setShowCoordInput] = useState(false)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [lastFetchedAddress, setLastFetchedAddress] = useState('')
  const [isCoordQuery, setIsCoordQuery] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // More robust coordinate regex - handles 26.955561,75.718295 / 26.955561 75.718295 / with spaces
  const parseCoordinates = (str: string): { lat: number, lng: number } | null => {
    const trimmed = str.trim()
    // Match: lat, lng  or lat lng  or lat, lng with optional spaces
    const patterns = [
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/, // comma separated
      /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/, // space separated
    ]
    for (const p of patterns) {
      const m = trimmed.match(p)
      if (m) {
        const lat = parseFloat(m[1]), lng = parseFloat(m[2])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng }
        }
      }
    }
    return null
  }

  const searchAddress = async (q: string) => {
    // Don't search if it's coordinates
    if (parseCoordinates(q)) { setIsCoordQuery(true); setResults([]); setIsSearching(false); return }
    setIsCoordQuery(false)
    if (!q || q.trim().length < 3) { setResults([]); return }
    setIsSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&countrycodes=in&addressdetails=1&extratags=1`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setResults(data)
      } else {
        // Fallback: Photon
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`
          const pRes = await fetch(photonUrl)
          const pData = await pRes.json()
          if (pData.features && pData.features.length > 0) {
            const mapped = pData.features.map((f: any) => ({
              lat: f.geometry.coordinates[1].toString(),
              lon: f.geometry.coordinates[0].toString(),
              display_name: [f.properties.name, f.properties.street, f.properties.city, f.properties.state, 'India'].filter(Boolean).join(', '),
            }))
            setResults(mapped)
          } else {
            setResults([])
          }
        } catch {
          setResults([])
        }
      }
    } catch (e) {
      console.error('Geocoding failed', e)
      setResults([])
    }
    setIsSearching(false)
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await res.json()
      const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setLastFetchedAddress(addr)
      return addr
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setLastFetchedAddress(fallback)
      return fallback
    }
  }

  const goToLatLng = async (lat: number, lng: number, displayName?: string) => {
    if (isNaN(lat) || isNaN(lng)) { alert('Invalid coordinates'); return }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { alert('Lat must be -90 to 90, Lng -180 to 180'); return }
    
    // If map not ready, still update center and try
    try {
      if (map) {
        map.setView([lat, lng], 19)
        if (L) {
          try { (window as any).searchMarkers?.forEach((m: any) => { try { map.removeLayer(m) } catch {} }) } catch {}
          ;(window as any).searchMarkers = []
          const marker = L.marker([lat, lng]).addTo(map)
          const addr = displayName || await reverseGeocode(lat, lng)
          marker.bindPopup(`<b>${addr}</b><br/><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br/><div style="margin-top:8px"><button style="background:#111;color:#fff;border:0;padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer" onclick="window.dispatchEvent(new CustomEvent('raavi-open-wizard'))">🤖 AI Auto Design for this location</button></div>`).openPopup()
          ;(window as any).searchMarkers.push(marker)
        }
      }
    } catch (e) { console.error('Map goTo failed', e) }
    
    setCurrentCenter({ lat, lng })
    setLatInput(lat.toString())
    setLngInput(lng.toString())
    
    let addr = displayName
    if (!addr) {
      addr = await reverseGeocode(lat, lng)
    } else {
      setLastFetchedAddress(addr)
    }
    setQuery(addr)
    onLocationChange(lat, lng, addr)
    setResults([])
    setIsCoordQuery(false)
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    
    // Immediately check if it's coordinates
    const coords = parseCoordinates(val)
    if (coords) {
      setIsCoordQuery(true)
      setResults([])
      if (debounceRef.current) clearTimeout(debounceRef.current)
      // Auto go to coordinates after 800ms pause (user finished typing)
      debounceRef.current = setTimeout(() => {
        goToLatLng(coords.lat, coords.lng, `Coordinates: ${coords.lat}, ${coords.lng}`)
      }, 800)
      return
    }
    
    setIsCoordQuery(false)
    // Debounce regular search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(val), 500)
  }

  const selectResult = (item: any) => {
    const lat = parseFloat(item.lat), lng = parseFloat(item.lon)
    if (isNaN(lat) || isNaN(lng)) return
    goToLatLng(lat, lng, item.display_name)
    setResults([])
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported in this browser'); return }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude
      await goToLatLng(lat, lng)
    }, (err) => alert('Location error: ' + err.message + '\nEnsure location permission allowed and you are on HTTPS (vercel.app is HTTPS)'), { enableHighAccuracy: true, timeout: 10000 })
  }

  const handleCoordGo = () => {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput)
    if (isNaN(lat) || isNaN(lng)) { alert('Valid lat/lng डालें e.g. 26.9124, 75.7873'); return }
    goToLatLng(lat, lng)
  }

  useEffect(() => {
    if (!map) return
    const onMapClick = async (e: any) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        await goToLatLng(e.latlng.lat, e.latlng.lng)
      }
    }
    try { map.on('click', onMapClick) } catch {}
    return () => { try { map.off('click', onMapClick) } catch {} }
  }, [map, L])

  useEffect(() => {
    const handler = () => { /* wizard open handled by parent via event */ }
    window.addEventListener('raavi-autodesign' as any, handler)
    return () => window.removeEventListener('raavi-autodesign' as any, handler)
  }, [])

  // If query is exactly coordinates, don't show "No results" - show coord preview instead
  const coordsPreview = parseCoordinates(query)

  return (
    <div className="w-[360px]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input value={query} onChange={e => handleInputChange(e.target.value)} placeholder="Address या Coordinates डालें - e.g. Tonk Road / 26.9124,75.7873" className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
              {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">...</span>}
              {query && !isSearching && <button onClick={() => { setQuery(''); setResults([]); setIsCoordQuery(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-100 rounded-full grid place-items-center text-xs">✕</button>}
            </div>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <button onClick={useMyLocation} className="flex-1 bg-gray-900 text-white text-xs font-medium py-2 rounded-xl hover:bg-black">📍 My Location</button>
            <button onClick={() => setShowCoordInput(!showCoordInput)} className={`flex-1 text-xs font-medium py-2 rounded-xl border ${showCoordInput ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>🌐 {showCoordInput ? 'Hide Coords' : 'Lat/Lng → Address'}</button>
          </div>
        </div>

        {showCoordInput && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 bg-gray-50/50">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Coordinates → Address (Real-Time Reverse)</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div><label className="text-[11px] text-gray-500">Latitude</label><input value={latInput} onChange={e => setLatInput(e.target.value)} placeholder="26.9124" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none" /></div>
              <div><label className="text-[11px] text-gray-500">Longitude</label><input value={lngInput} onChange={e => setLngInput(e.target.value)} placeholder="75.7873" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none" /></div>
            </div>
            <div className="flex gap-2 mt-2.5"><button onClick={handleCoordGo} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-black">🌐 Go to Coords & Get Address</button><button onClick={async () => { if (currentCenter) { setLatInput(currentCenter.lat.toString()); setLngInput(currentCenter.lng.toString()); const addr = await reverseGeocode(currentCenter.lat, currentCenter.lng); setQuery(addr) } }} className="bg-white border border-gray-200 text-xs px-3 py-2.5 rounded-xl hover:bg-gray-50">📍 Current → Reverse</button></div>
            {lastFetchedAddress && <div className="mt-2.5 bg-white border border-gray-200 rounded-xl p-2.5"><div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Fetched Real-Time Address:</div><div className="text-xs text-gray-900 mt-1 leading-relaxed">{lastFetchedAddress}</div><div className="text-[11px] text-gray-400 mt-1 font-mono">{latInput}, {lngInput}</div></div>}
          </div>
        )}

        {/* Coordinates preview - when input is coordinates, show preview instead of no results */}
        {coordsPreview && query && (
          <div className="border-t border-gray-100 bg-blue-50 p-3">
            <div className="text-xs font-bold text-blue-900">📍 Coordinates Detected - Real-Time</div>
            <div className="mt-2 bg-white border border-blue-200 rounded-xl p-3">
              <div className="text-sm font-bold text-gray-900">{coordsPreview.lat}, {coordsPreview.lng}</div>
              <div className="text-xs text-gray-500 mt-1">Valid lat/lng • Click Go to view on map & get address</div>
              <button onClick={() => goToLatLng(coordsPreview.lat, coordsPreview.lng)} className="mt-2 w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700">🌐 Go to {coordsPreview.lat.toFixed(5)}, {coordsPreview.lng.toFixed(5)} & Get Address</button>
            </div>
          </div>
        )}

        {results.length > 0 && !coordsPreview && (
          <div className="border-t border-gray-100 max-h-[300px] overflow-y-auto">
            {results.map((r: any, i: number) => (
              <div key={i} onClick={() => r.lat && r.lon && selectResult(r)} className="p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer">
                <div className="font-medium text-sm text-gray-900 line-clamp-2">{r.display_name?.split(',').slice(0, 3).join(', ')}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{r.display_name}</div>
                {r.lat && r.lon && <div className="flex gap-2 mt-1.5"><span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-mono">{parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}</span></div>}
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && !isSearching && query.length >= 3 && !coordsPreview && (
          <div className="p-4 text-center border-t border-gray-100">
            <div className="text-sm font-bold text-gray-700">Searching for "{query}"</div>
            <div className="text-xs text-gray-500 mt-2 leading-relaxed">No results - Try full address like:<br/><b>"C Scheme, Jaipur, Rajasthan"</b><br/>Or coordinates: <code className="bg-gray-100 px-1.5 py-0.5 rounded">26.9124,75.7873</code><br/>Or use My Location or Lat/Lng tab</div>
          </div>
        )}

        <div className="bg-blue-50 border-t border-blue-100 p-2.5 text-[11px] text-blue-800">
          <div className="font-bold">Jaipur Quick Searches (Real-Time):</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Tonk Road Jaipur', 'Vaishali Nagar Jaipur', 'Malviya Nagar Jaipur', 'C Scheme Jaipur', 'Mansarovar Jaipur', 'Jagatpura Jaipur', '26.9124,75.7873 Jaipur Center'].map(q => (
              <button key={q} onClick={() => { setQuery(q); const c = parseCoordinates(q); if (c) goToLatLng(c.lat, c.lng); else searchAddress(q) }} className="bg-white border border-blue-200 rounded-full px-2.5 py-1 text-[11px] hover:bg-blue-100 font-medium">{q}</button>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-blue-600">💡 Tip: Search box में <code>26.955561,75.718295</code> जैसा coordinate डालो → Auto-detect होकर map खुलेगा + Address reverse होगा। Map पर <b>Ctrl+Click</b> से भी address निकलेगा।</div>
        </div>
      </div>
    </div>
  )
}
