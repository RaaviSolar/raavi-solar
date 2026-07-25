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

  // Ultra robust coordinate parser - extracts lat,lng from ANY string containing two numbers like 26.955561,75.718295 or Coordinates: ...
  const parseCoordinates = (str: string): { lat: number, lng: number } | null => {
    if (!str) return null
    // Find all decimal numbers in string
    const numRegex = /-?\d+(?:\.\d+)?/g
    const nums = str.match(numRegex)
    if (nums && nums.length >= 2) {
      // Try last two numbers as lat/lng (handles "Coordinates: 26.95, 75.71" -> [26.95,75.71])
      // Also try first two
      const candidates = [
        { lat: parseFloat(nums[0]), lng: parseFloat(nums[1]) },
        { lat: parseFloat(nums[nums.length-2]), lng: parseFloat(nums[nums.length-1]) },
      ]
      for (const c of candidates) {
        if (!isNaN(c.lat) && !isNaN(c.lng) && c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180) {
          // Additional check: Jaipur region approx lat 26-27.5, lng 75-76.5 but allow global
          // For Jaipur quick test, but allow any
          return c
        }
      }
    }
    return null
  }

  const searchAddress = async (q: string) => {
    if (parseCoordinates(q)) { setResults([]); setIsSearching(false); return }
    if (!q || q.trim().length < 3) { setResults([]); return }
    setIsSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&countrycodes=in&addressdetails=1`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setResults(data)
      else {
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`
          const pRes = await fetch(photonUrl)
          const pData = await pRes.json()
          if (pData.features?.length > 0) {
            const mapped = pData.features.map((f: any) => ({
              lat: f.geometry.coordinates[1].toString(),
              lon: f.geometry.coordinates[0].toString(),
              display_name: [f.properties.name, f.properties.city, f.properties.state, 'India'].filter(Boolean).join(', '),
            }))
            setResults(mapped)
          } else setResults([])
        } catch { setResults([]) }
      }
    } catch { setResults([]) }
    setIsSearching(false)
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      const res = await fetch(url)
      const data = await res.json()
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setLastFetchedAddress(addr)
      return addr
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setLastFetchedAddress(fallback)
      return fallback
    }
  }

  const goToLatLng = async (lat: number, lng: number, displayName?: string) => {
    if (isNaN(lat) || isNaN(lng)) return
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { alert(`Invalid: Lat -90 to 90, Lng -180 to 180. Got ${lat}, ${lng}`); return }
    
    try {
      if (map) {
        map.setView([lat, lng], 19)
        if (L) {
          try { (window as any).searchMarkers?.forEach((m: any) => { try { map.removeLayer(m) } catch {} }) } catch {}
          ;(window as any).searchMarkers = []
          const marker = L.marker([lat, lng]).addTo(map)
          // Always reverse geocode for clean address - ignore displayName if it looks like coords
          let shouldUseDisplay = displayName && !parseCoordinates(displayName) && !displayName.toLowerCase().startsWith('coordinates:')
          let addr = shouldUseDisplay ? displayName! : await reverseGeocode(lat, lng)
          setLastFetchedAddress(addr)
          setQuery(addr)
          marker.bindPopup(`<b style="font-size:13px">${addr}</b><br/><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br/><button style="margin-top:8px;background:#111;color:#fff;border:0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer" onclick="window.dispatchEvent(new CustomEvent('raavi-open-wizard'))">🤖 AI Auto Design</button>`).openPopup()
          ;(window as any).searchMarkers.push(marker)
        }
      }
    } catch (e) { console.error('Map goTo failed', e) }
    
    setCurrentCenter({ lat, lng })
    setLatInput(lat.toString())
    setLngInput(lng.toString())
    
    let finalAddr = displayName && !parseCoordinates(displayName) && !displayName.toLowerCase().startsWith('coordinates:') ? displayName : await reverseGeocode(lat, lng)
    
    setQuery(finalAddr)
    onLocationChange(lat, lng, finalAddr)
    setResults([])
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    const coords = parseCoordinates(val)
    if (coords) {
      // Immediately show preview and auto-go after pause
      setResults([])
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => { goToLatLng(coords.lat, coords.lng, `${coords.lat}, ${coords.lng}`) }, 700)
      return
    }
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
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await goToLatLng(pos.coords.latitude, pos.coords.longitude)
    }, (err) => alert('Location error: ' + err.message), { enableHighAccuracy: true, timeout: 10000 })
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

  const coordsPreview = parseCoordinates(query)

  return (
    <div className="w-[350px]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={query} onChange={e => handleInputChange(e.target.value)} placeholder="Address या Coordinates - e.g. Tonk Road / 26.9124,75.7873" className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
            {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">...</span>}
            {query && !isSearching && <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-100 rounded-full grid place-items-center text-xs">✕</button>}
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <button onClick={useMyLocation} className="flex-1 bg-gray-900 text-white text-xs font-medium py-2 rounded-xl hover:bg-black">📍 My Location</button>
            <button onClick={() => setShowCoordInput(!showCoordInput)} className={`flex-1 text-xs font-medium py-2 rounded-xl border ${showCoordInput ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>🌐 Lat/Lng</button>
          </div>
        </div>

        {showCoordInput && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 bg-gray-50/50">
            <div className="text-xs font-bold text-gray-700 uppercase">Coordinates → Address (Real-Time)</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div><label className="text-[11px] text-gray-500">Lat</label><input value={latInput} onChange={e => setLatInput(e.target.value)} placeholder="26.9124" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-[11px] text-gray-500">Lng</label><input value={lngInput} onChange={e => setLngInput(e.target.value)} placeholder="75.7873" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 mt-2.5"><button onClick={handleCoordGo} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl">🌐 Go to Coords & Get Address</button><button onClick={async () => { if (currentCenter) { setLatInput(currentCenter.lat.toString()); setLngInput(currentCenter.lng.toString()); const a = await reverseGeocode(currentCenter.lat, currentCenter.lng); setQuery(a) } }} className="bg-white border border-gray-200 text-xs px-3 py-2.5 rounded-xl">📍 Current → Reverse</button></div>
            {lastFetchedAddress && <div className="mt-2.5 bg-white border border-gray-200 rounded-xl p-2.5"><div className="text-[10px] text-gray-500 uppercase font-bold">Real-Time Address:</div><div className="text-xs text-gray-900 mt-1 leading-relaxed">{lastFetchedAddress}</div><div className="text-[11px] text-gray-400 mt-1 font-mono">{latInput}, {lngInput}</div></div>}
          </div>
        )}

        {coordsPreview && query && (
          <div className="border-t border-gray-100 bg-blue-50 p-3">
            <div className="text-xs font-bold text-blue-900">📍 Coordinates Detected - Instant Go</div>
            <div className="mt-2 bg-white border border-blue-200 rounded-xl p-3">
              <div className="text-sm font-bold font-mono text-gray-900">{coordsPreview.lat}, {coordsPreview.lng}</div>
              <div className="text-xs text-gray-500 mt-1">Valid • Will auto open map + reverse geocode</div>
              <button onClick={() => goToLatLng(coordsPreview.lat, coordsPreview.lng)} className="mt-2 w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700">🌐 Go to {coordsPreview.lat.toFixed(5)}, {coordsPreview.lng.toFixed(5)} & Get Address</button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="border-t border-gray-100 max-h-[280px] overflow-y-auto">
            {results.map((r: any, i: number) => (
              <div key={i} onClick={() => selectResult(r)} className="p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer">
                <div className="font-medium text-sm text-gray-900">{r.display_name?.split(',').slice(0, 2).join(', ')}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{r.display_name}</div>
                <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-mono mt-1.5 inline-block">{parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border-t border-blue-100 p-2.5 text-[11px] text-blue-800">
          <div className="font-bold">Jaipur Quick Searches:</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Tonk Road Jaipur', 'Vaishali Nagar Jaipur', 'Malviya Nagar Jaipur', 'C Scheme Jaipur', 'Mansarovar Jaipur', 'Jagatpura Jaipur'].map(q => (
              <button key={q} onClick={() => { setQuery(q); searchAddress(q) }} className="bg-white border border-blue-200 rounded-full px-2.5 py-1 text-[11px] hover:bg-blue-100 font-medium">{q}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
