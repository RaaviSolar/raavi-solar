'use client'
import { useEffect, useState } from 'react'

interface Props {
  map: any
  L: any
  center: { lat: number, lng: number }
  fluxData?: any // from Google Solar dataLayers
  enabled: boolean
}

export default function ShadeHeatmapOverlay({ map, L, center, enabled }: Props) {
  const [activeLayer, setActiveLayer] = useState<'flux' | 'shade' | 'mask'>('flux')
  const [overlay, setOverlay] = useState<any>(null)

  useEffect(() => {
    if (!map || !L || !enabled) {
      if (overlay) { map?.removeLayer(overlay); setOverlay(null) }
      return
    }

    // Create canvas-based heatmap simulating flux/shade
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Generate mock flux/shade based on type
    const imageData = ctx.createImageData(512, 512)
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const dx = (x - 256) / 256
        const dy = (y - 256) / 256
        const dist = Math.sqrt(dx * dx + dy * dy)
        const baseFlux = Math.max(0, 1 - dist * 1.2 + Math.sin(x * 0.05) * 0.1)

        let r, g, b, a = 180
        if (activeLayer === 'flux') {
          // Flux: yellow-orange-red gradient for high irradiance
          if (baseFlux > 0.8) { r = 255; g = 220; b = 0 }
          else if (baseFlux > 0.6) { r = 255; g = 165; b = 0 }
          else if (baseFlux > 0.4) { r = 255; g = 80; b = 0 }
          else { r = 80; g = 0; b = 0; a = baseFlux * 100 }
        } else if (activeLayer === 'shade') {
          // Shade: dark where shadow
          const shadeValue = 1 - baseFlux
          r = shadeValue * 40; g = shadeValue * 40; b = shadeValue * 60
          a = shadeValue * 200
        } else {
          // Mask: roof outline
          r = baseFlux > 0.5 ? 0 : 0; g = baseFlux > 0.5 ? 255 : 0; b = 0
          a = baseFlux > 0.5 ? 80 : 0
        }

        const idx = (y * 512 + x) * 4
        imageData.data[idx] = r
        imageData.data[idx + 1] = g
        imageData.data[idx + 2] = b
        imageData.data[idx + 3] = a
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Convert to data URL
    const dataUrl = canvas.toDataURL()

    // Create image overlay bounds ~100m around center
    const latDelta = 100 / 111000
    const lngDelta = 100 / (111000 * Math.cos(center.lat * Math.PI / 180))
    const bounds: any = [[center.lat - latDelta, center.lng - lngDelta], [center.lat + latDelta, center.lng + lngDelta]]

    const imgOverlay = L.imageOverlay(dataUrl, bounds, { opacity: 0.7, interactive: false })
    if (overlay) map.removeLayer(overlay)
    imgOverlay.addTo(map)
    setOverlay(imgOverlay)

    return () => { if (map.hasLayer(imgOverlay)) map.removeLayer(imgOverlay) }
  }, [map, L, center, enabled, activeLayer])

  if (!enabled) return null

  return (
    <div className="absolute bottom-20 left-3 z-[600] bg-[#181b22ee] backdrop-blur border border-[#252b38] rounded-lg p-2.5 shadow-xl">
      <div className="text-[10px] font-bold text-[#8a93a5] uppercase tracking-wider mb-2">Shade / Flux Heatmap - Google Solar DataLayers</div>
      <div className="flex gap-1.5 mb-2">
        {(['flux', 'shade', 'mask'] as const).map(t => (
          <button key={t} onClick={() => setActiveLayer(t)} className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${activeLayer === t ? 'bg-[#ffcc00] text-black' : 'bg-[#1f242f] border border-[#252b38] text-[#8a93a5]'}`}>{t === 'flux' ? '☀️ Flux (Irradiance)' : t === 'shade' ? '🌑 Shade' : '🏠 Roof Mask'}</button>
        ))}
      </div>
      <div className="text-[10px] text-[#8a93a5] leading-relaxed">
        {activeLayer === 'flux' && 'Yellow = High irradiance (best for panels) • Red = Low • From Google Solar API flux layer'}
        {activeLayer === 'shade' && 'Dark = Shadow hours >40% • Light = No shade • Jaipur: check trees/buildings impact'}
        {activeLayer === 'mask' && 'Green = Roof detected by Google AI • Use for auto roof outline'}
      </div>
      <div className="mt-2 flex gap-1.5">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#ffdc00]"></div><span className="text-[10px] text-[#8a93a5]">High</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#ff8000]"></div><span className="text-[10px] text-[#8a93a5]">Med</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#800000]"></div><span className="text-[10px] text-[#8a93a5]">Low</span></div>
      </div>
    </div>
  )
}
