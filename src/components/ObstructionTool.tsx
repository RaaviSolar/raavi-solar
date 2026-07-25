'use client'
import { useState } from 'react'

interface Obstruction {
  id: string
  type: 'water_tank' | 'parapet' | 'tree' | 'ac_unit' | 'solar_heater'
  lat: number
  lng: number
  height: number
  width: number
  x?: number
  y?: number
}

export default function ObstructionTool({ obstructions, setObstructions, onAdd, map, currentCenter, roofPolygon }: {
  obstructions: Obstruction[],
  setObstructions: (o: Obstruction[]) => void,
  onAdd: (obs: Obstruction) => void,
  map: any,
  currentCenter: { lat: number, lng: number },
  roofPolygon: number[][] | null
}) {
  const [selectedType, setSelectedType] = useState<Obstruction['type']>('water_tank')
  const [sunTime, setSunTime] = useState(12) // 6-18
  const [sunAzimuth, setSunAzimuth] = useState(180) // Jaipur south

  const obstructionTypes: Record<string, { label: string, icon: string, defaultH: number, defaultW: number, color: string }> = {
    water_tank: { label: 'Water Tank', icon: '🚰', defaultH: 2.0, defaultW: 1.5, color: '#3b82f6' },
    parapet: { label: 'Parapet Wall', icon: '🧱', defaultH: 1.0, defaultW: 3.0, color: '#78716c' },
    tree: { label: 'Tree / Shadow', icon: '🌳', defaultH: 5.0, defaultW: 2.5, color: '#16a34a' },
    ac_unit: { label: 'AC Outdoor', icon: '❄️', defaultH: 0.8, defaultW: 0.9, color: '#6b7280' },
    solar_heater: { label: 'Solar Water Heater', icon: '☀️', defaultH: 1.2, defaultW: 2.0, color: '#f59e0b' },
  }

  const addObstruction = () => {
    const typeInfo = obstructionTypes[selectedType]
    const center = map ? map.getCenter() : currentCenter
    const newObs: Obstruction = {
      id: Math.random().toString(36).slice(2),
      type: selectedType,
      lat: center.lat + (Math.random() - 0.5) * 0.0001,
      lng: center.lng + (Math.random() - 0.5) * 0.0001,
      height: typeInfo.defaultH,
      width: typeInfo.defaultW,
    }
    onAdd(newObs)
  }

  // Calculate shadow length: shadow = height / tan(sunElevation)
  // Simplified sun elevation for Jaipur: at noon ~70°, morning/evening lower
  const getSunElevation = (hour: number) => {
    // Jaipur approx: 6am 5°, 9am 35°, 12pm 70°, 3pm 40°, 6pm 8°
    const elevations: Record<number, number> = { 6: 5, 7: 15, 8: 25, 9: 35, 10: 50, 11: 65, 12: 70, 13: 68, 14: 55, 15: 40, 16: 25, 17: 15, 18: 8 }
    return elevations[Math.round(hour)] || 30
  }

  const sunElevation = getSunElevation(sunTime)
  const shadowFactor = 1 / Math.tan(sunElevation * Math.PI / 180)

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="font-bold text-amber-900 text-sm">🧱 Obstruction & Shadow - Next Level</div>
        <div className="text-xs text-amber-800 mt-1">छत पर टंकी, पेड़, पैरापेट की height डालो - दिन भर shadow simulation देखो, panels shade से बचाओ</div>
      </div>

      <div>
        <div className="text-xs font-bold text-gray-500 uppercase">Add Obstruction</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(obstructionTypes).map(([key, info]) => (
            <button key={key} onClick={() => setSelectedType(key as any)} className={`border rounded-xl p-2.5 text-left text-xs ${selectedType === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <div className="text-lg">{info.icon}</div><div className="font-semibold mt-1">{info.label}</div><div className="text-[11px] opacity-70">H:{info.defaultH}m W:{info.defaultW}m</div>
            </button>
          ))}
        </div>
        <button onClick={addObstruction} className="w-full mt-3 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black">+ Add {obstructionTypes[selectedType].label} on Map</button>
        <div className="text-[11px] text-gray-500 mt-2">Map center पर obstruction place होगा, फिर drag कर सकते हो (Next: draggable markers)</div>
      </div>

      {obstructions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase">Placed Obstructions ({obstructions.length})</div>
          {obstructions.map(obs => (
            <div key={obs.id} className="bg-white border border-gray-200 rounded-xl p-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2"><span className="text-lg">{obstructionTypes[obs.type].icon}</span><div><div className="font-semibold text-xs">{obstructionTypes[obs.type].label}</div><div className="text-[11px] text-gray-500">H:{obs.height}m • Shadow: {(obs.height * shadowFactor).toFixed(1)}m @ {sunTime}:00</div></div></div>
              <div className="flex gap-1"><input type="number" value={obs.height} onChange={e => { const h = parseFloat(e.target.value) || 0; setObstructions(obstructions.map(o => o.id === obs.id ? { ...o, height: h } : o)) }} className="w-12 border rounded px-1 py-1 text-xs" step="0.1" /><button onClick={() => setObstructions(obstructions.filter(o => o.id !== obs.id))} className="w-6 h-6 rounded-full bg-red-50 text-red-600 grid place-items-center">✕</button></div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 text-white rounded-xl p-4">
        <div className="text-xs font-bold text-gray-400 uppercase">☀️ Sun Path Animation - Jaipur</div>
        <div className="mt-3 space-y-3">
          <div><div className="flex justify-between text-xs"><span>Time: {sunTime}:00</span><span>Elevation: {sunElevation}° • Shadow x{shadowFactor.toFixed(1)}</span></div><input type="range" min="6" max="18" step="0.5" value={sunTime} onChange={e => setSunTime(parseFloat(e.target.value))} className="w-full accent-white mt-1" /></div>
          <div><div className="flex justify-between text-xs"><span>Azimuth: {sunAzimuth}°</span><span>{sunAzimuth < 90 ? 'East' : sunAzimuth < 180 ? 'South-East' : sunAzimuth < 270 ? 'South-West' : 'West'}</span></div><input type="range" min="0" max="360" value={sunAzimuth} onChange={e => setSunAzimuth(parseFloat(e.target.value))} className="w-full accent-white" /></div>
          <div className="text-xs text-gray-400">Shadow length = Height / tan(elevation). Tree 5m @ 12pm (70°) = {(5 * (1 / Math.tan(70 * Math.PI / 180))).toFixed(1)}m shadow • Same tree @ 6pm (8°) = {(5 * (1 / Math.tan(8 * Math.PI / 180))).toFixed(1)}m long shadow!</div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]"><div className="bg-white/10 rounded-lg p-2 text-center"><div className="font-bold">Morning 9am</div><div className="text-gray-400">35° elev</div><div>1.4x height shadow</div></div><div className="bg-white/20 rounded-lg p-2 text-center border border-white/20"><div className="font-bold">Noon 12pm</div><div className="text-gray-300">70° elev</div><div>0.36x shadow (best)</div></div><div className="bg-white/10 rounded-lg p-2 text-center"><div className="font-bold">Evening 5pm</div><div className="text-gray-400">15° elev</div><div>3.7x long shadow</div></div></div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <b>💡 Jaipur Tip:</b> Water tank 2m height south side पर है तो north side panels safe। Tree 5m west में तो evening shade 18m तक जाएगा - panels east side लगाओ। App auto suggest करेगा।
      </div>
    </div>
  )
}
