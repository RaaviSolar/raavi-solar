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
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time forward geocoding with debounce
  const searchAddress = async (q: string) => {
    if (!q || q.trim().length < 3) { setResults([]); return }
    setIsSearching(true)
    try {
      // Try Nominatim first
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&countrycodes=in&addressdetails=1&extratags=1&namedetails=1&accept-language=en,hi`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setResults(data)
      } else {
        // Fallback: try Photon API (more permissive)
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&osm_tag=place`
          const pRes = await fetch(photonUrl)
          const pData = await pRes.json()
          if (pData.features && pData.features.length > 0) {
            const mapped = pData.features.map((f: any) => ({
              lat: f.geometry.coordinates[1].toString(),
              lon: f.geometry.coordinates[0].toString(),
              display_name: f.properties.name + (f.properties.city ? ', ' + f.properties.city : '') + (f.properties.state ? ', ' + f.properties.state : '') + ', India',
              osm_id: f.properties.osm_id,
              type: f.properties.osm_type
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
      setResults([{ display_name: '⚠️ Search failed - Check internet or try coordinates e.g. 26.9124,75.7873', lat: '', lon: '' }])
    }
    setIsSearching(false)
  }

  // Reverse geocoding: lat,lng -> address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en,hi`
      const res = await fetch(url)
      const data = await res.json()
      const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setLastFetchedAddress(addr)
      setQuery(addr)
      return addr
    } catch (e) {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setLastFetchedAddress(fallback)
      return fallback
    }
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    // Check if input is coordinates like "26.9124,75.7873" or "26.9124 75.7873"
    const coordMatch = val.match(/^\s*(-?\d+\.?\d*)\s*[, ]\s*(-?\d+\.?\d*)\s*$/)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]), lng = parseFloat(coordMatch[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLatInput(lat.toString())
        setLngInput(lng.toString())
        // Auto navigate to coordinates
        goToLatLng(lat, lng, `Coordinates: ${lat}, ${lng}`)
        setResults([])
        return
      }
    }

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(val), 400)
  }

  const goToLatLng = async (lat: number, lng: number, displayName?: string) => {
    if (!map) return
    map.setView([lat, lng], 19)
    if (L) {
      // Clear previous search markers
      try { (window as any).searchMarkers?.forEach((m: any) => map.removeLayer(m)) } catch {}
      ;(window as any).searchMarkers = []
      const marker = L.marker([lat, lng]).addTo(map)
      const addr = displayName || await reverseGeocode(lat, lng)
      marker.bindPopup(`<b>${addr}</b><br/><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br/><button onclick="window.dispatchEvent(new CustomEvent('raavi-autodesign', {detail:{lat:${lat},lng:${lng}}}))" style="margin-top:6px;background:#111;color:#fff;border:0;padding:4px 8px;border-radius:6px;font-size:11px">🤖 AI Auto Design for ${lat.toFixed(4)},${lng.toFixed(4)}</button>`).openPopup()
      ;(window as any).searchMarkers.push(marker)
    }
    setCurrentCenter({ lat, lng })
    const addr = displayName || await reverseGeocode(lat, lng)
    onLocationChange(lat, lng, addr)
    setResults([])
  }

  const selectResult = (item: any) => {
    const lat = parseFloat(item.lat), lng = parseFloat(item.lon)
    if (isNaN(lat) || isNaN(lng)) return
    goToLatLng(lat, lng, item.display_name)
    setQuery(item.display_name)
    setResults([])
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude
      setLatInput(lat.toString()); setLngInput(lng.toString())
      await goToLatLng(lat, lng)
    }, (err) => alert('Location error: ' + err.message), { enableHighAccuracy: true })
  }

  const handleCoordGo = () => {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput)
    if (isNaN(lat) || isNaN(lng)) { alert('Valid lat/lng डालें e.g. 26.9124, 75.7873 (Jaipur)'); return }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { alert('Lat -90 to 90, Lng -180 to 180'); return }
    goToLatLng(lat, lng)
  }

  // Map click to reverse geocode - setup once
  useEffect(() => {
    if (!map) return
    const onMapClick = async (e: any) => {
      const lat = e.latlng.lat, lng = e.latlng.lng
      // Only if user holds Shift or we are in address mode? For now always reverse on click with Ctrl
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        await goToLatLng(lat, lng)
      }
    }
    map.on('click', onMapClick)
    return () => { try { map.off('click', onMapClick) } catch {} }
  }, [map, L])

  // Listen for custom event from popup button to trigger auto design wizard (dispatched from popup HTML)
  useEffect(() => {
    const handler = (e: any) => {
      const { lat, lng } = e.detail
      // Trigger the AI wizard via custom event that SolarDesigner listens? We'll call onLocationChange already did
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('raavi-open-wizard', { detail: { lat, lng } }))
      }
    }
    window.addEventListener('raavi-autodesign' as any, handler)
    return () => window.removeEventListener('raavi-autodesign' as any, handler)
  }, [])

  return (
    <div className="w-[340px]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Search Input */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input value={query} onChange={e => handleInputChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchAddress(query) }} placeholder="Address डालें - e.g. Tonk Road Jaipur, C Scheme, Malviya Nagar..." className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
              {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">Searching...</span>}
              {query && !isSearching && <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-100 rounded-full grid place-items-center text-xs">✕</button>}
            </div>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <button onClick={useMyLocation} className="flex-1 bg-gray-900 text-white text-xs font-medium py-2 rounded-xl hover:bg-black">📍 My Location</button>
            <button onClick={() => setShowCoordInput(!showCoordInput)} className="flex-1 bg-white border border-gray-200 text-xs font-medium py-2 rounded-xl hover:bg-gray-50">🌐 Lat/Lng → Address</button>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
            💡 <b>Real-Time:</b> Jaipur का कोई भी address टाइप करो - Tonk Road, Vaishali Nagar, Mansarovar, या coordinates <code className="bg-gray-100 px-1 rounded">26.9124,75.7873</code> डालो तो auto open होगा। Map पर <b>Ctrl+Click</b> से भी address निकलेगा।
          </div>
        </div>

        {/* Coordinates Input - Expandable */}
        {showCoordInput && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 bg-gray-50/50">
            <div className="text-xs font-bold text-gray-700 uppercase">Coordinates → Address (Reverse Geocoding)</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div><label className="text-[11px] text-gray-500">Latitude</label><input value={latInput} onChange={e => setLatInput(e.target.value)} placeholder="26.9124" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-[11px] text-gray-500">Longitude</label><input value={lngInput} onChange={e => setLngInput(e.target.value)} placeholder="75.7873" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 mt-2"><button onClick={handleCoordGo} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2 rounded-xl">🌐 Go to Coordinates & Get Address</button><button onClick={() => { if (currentCenter) { setLatInput(currentCenter.lat.toString()); setLngInput(currentCenter.lng.toString()); reverseGeocode(currentCenter.lat, currentCenter.lng) } }} className="bg-white border border-gray-200 text-xs px-3 py-2 rounded-xl">📍 Current → Reverse</button></div>
            {lastFetchedAddress && <div className="mt-2 bg-white border border-gray-200 rounded-xl p-2.5 text-xs"><div className="text-gray-500 uppercase font-bold text-[10px]">Fetched Address:</div><div className="text-gray-900 mt-1">{lastFetchedAddress}</div><div className="text-gray-400 mt-1">{latInput}, {lngInput}</div></div>}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="border-t border-gray-100 max-h-[300px] overflow-y-auto">
            {results.map((r: any, i: number) => (
              <div key={i} onClick={() => r.lat && r.lon && selectResult(r)} className={`p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer ${!r.lat ? 'bg-amber-50' : ''}`}>
                <div className="font-medium text-sm text-gray-900 line-clamp-2">{r.display_name?.split(',').slice(0, 3).join(', ')}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{r.display_name}</div>
                {r.lat && r.lon && <div className="flex gap-2 mt-1.5"><span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}</span>{r.type && <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{r.type}</span>}</div>}
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && !isSearching && query.length >= 3 && (
          <div className="p-4 text-center border-t border-gray-100">
            <div className="text-xs text-gray-500">No results for "{query}" - Try:<br/>• Full address: "C Scheme, Jaipur, Rajasthan"<br/>• Or coordinates: "26.9124,75.7873"<br/>• Or click 📍 My Location</div>
          </div>
        )}

        {/* Footer Tips */}
        <div className="bg-blue-50 border-t border-blue-100 p-2.5 text-[11px] text-blue-800">
          <div className="font-bold">Jaipur Quick Searches:</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {['Tonk Road Jaipur', 'Vaishali Nagar Jaipur', 'Malviya Nagar Jaipur', 'C Scheme Jaipur', 'Mansarovar Jaipur', 'Jagatpura Jaipur'].map(q => (
              <button key={q} onClick={() => { setQuery(q); searchAddress(q) }} className="bg-white border border-blue-200 rounded-full px-2.5 py-1 text-[11px] hover:bg-blue-100">{q}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
