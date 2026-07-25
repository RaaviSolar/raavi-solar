'use client'
import { useRef, useState, useEffect } from 'react'

interface Point { x: number, y: number }
interface PanelPix { x: number, y: number, id: string, wPx: number, hPx: number }

export default function RoofImageDesigner({ onClose, onDesignComplete, panelWatt, panelW, panelH }: {
  onClose: () => void,
  onDesignComplete: (panelsCount: number, roofAreaM2: number, imageDataUrl: string) => void,
  panelWatt: number,
  panelW: number,
  panelH: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [roofPolygon, setRoofPolygon] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [panels, setPanels] = useState<PanelPix[]>([])
  const [mode, setMode] = useState<'upload' | 'calibrate' | 'draw' | 'place'>('upload')
  const [calibration, setCalibration] = useState<{ p1: Point, p2: Point, realMeters: number, pxPerMeter: number } | null>(null)
  const [calibPoints, setCalibPoints] = useState<Point[]>([])
  const [showCalibModal, setShowCalibModal] = useState(false)
  const [tempRealLength, setTempRealLength] = useState('10')
  const [roofAreaM2, setRoofAreaM2] = useState(0)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setImageUrl(url)
      setMode('calibrate')
      setRoofPolygon([])
      setPanels([])
      setCalibration(null)
      setCalibPoints([])
      // Load image to ref
      const img = new Image()
      img.onload = () => { imageRef.current = img; drawCanvas() }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !imageRef.current) return
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw image scaled to fit container (contain)
    const img = imageRef.current
    const containerRatio = rect.width / rect.height
    const imgRatio = img.width / img.height
    let drawW, drawH, offsetX, offsetY
    if (containerRatio > imgRatio) {
      drawH = rect.height
      drawW = drawH * imgRatio
      offsetX = (rect.width - drawW) / 2
      offsetY = 0
    } else {
      drawW = rect.width
      drawH = drawW / imgRatio
      offsetX = 0
      offsetY = (rect.height - drawH) / 2
    }
    // Store transform for coordinate conversion
    ;(canvas as any)._imgTransform = { drawW, drawH, offsetX, offsetY, imgW: img.width, imgH: img.height, containerW: rect.width, containerH: rect.height }
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

    // Draw calibration line if exists
    if (calibration) {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(calibration.p1.x, calibration.p1.y)
      ctx.lineTo(calibration.p2.x, calibration.p2.y)
      ctx.stroke()
      ctx.setLineDash([])
      // Label
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 12px Inter'
      const midX = (calibration.p1.x + calibration.p2.x) / 2
      const midY = (calibration.p1.y + calibration.p2.y) / 2
      ctx.fillText(`${calibration.realMeters}m = ${calibration.pxPerMeter.toFixed(1)} px/m`, midX + 8, midY - 8)
    }

    // Draw calib points temp
    if (mode === 'calibrate' && calibPoints.length > 0) {
      ctx.fillStyle = '#ef4444'
      calibPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill() })
      if (calibPoints.length === 1) {
        // line to mouse? handled by mousemove not yet
      }
    }

    // Draw roof polygon
    if (roofPolygon.length > 0) {
      ctx.strokeStyle = '#16a34a'
      ctx.lineWidth = 3
      ctx.fillStyle = 'rgba(34,197,94,0.15)'
      ctx.beginPath()
      ctx.moveTo(roofPolygon[0].x, roofPolygon[0].y)
      roofPolygon.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y) })
      if (roofPolygon.length > 2) ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Points
      ctx.fillStyle = '#16a34a'
      roofPolygon.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke() })
    }

    // Draw panels
    panels.forEach(panel => {
      ctx.fillStyle = 'rgba(59,130,246,0.85)'
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 1.5
      ctx.fillRect(panel.x - panel.wPx / 2, panel.y - panel.hPx / 2, panel.wPx, panel.hPx)
      ctx.strokeRect(panel.x - panel.wPx / 2, panel.y - panel.hPx / 2, panel.wPx, panel.hPx)
      // Glass shine
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(panel.x - panel.wPx / 2 + 2, panel.y - panel.hPx / 2 + 2, panel.wPx - 4, 4)
    })
  }

  useEffect(() => { drawCanvas(); window.addEventListener('resize', drawCanvas); return () => window.removeEventListener('resize', drawCanvas) }, [roofPolygon, panels, calibration, calibPoints, imageUrl])

  const getCanvasPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const isPointInPolygon = (pt: Point, poly: Point[]) => {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
      const intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  const polygonAreaPixels = (poly: Point[]) => {
    let area = 0
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length
      area += poly[i].x * poly[j].y
      area -= poly[j].x * poly[i].y
    }
    return Math.abs(area) / 2
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e)
    if (mode === 'calibrate') {
      const newPoints = [...calibPoints, pt]
      setCalibPoints(newPoints)
      if (newPoints.length === 2) {
        setShowCalibModal(true)
      }
      drawCanvas()
    } else if (mode === 'draw') {
      setRoofPolygon([...roofPolygon, pt])
    }
  }

  const handleCalibConfirm = () => {
    const real = parseFloat(tempRealLength) || 10
    const p1 = calibPoints[0], p2 = calibPoints[1]
    const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const pxPerMeter = pxDist / real
    setCalibration({ p1, p2, realMeters: real, pxPerMeter })
    setCalibPoints([])
    setShowCalibModal(false)
    setMode('draw')
  }

  const handleAutoPlace = () => {
    if (roofPolygon.length < 3) { alert('पहले roof draw करें - Draw Roof पर क्लिक करके छत की boundary बनाएं'); return }
    if (!calibration) { alert('पहले calibration करें - 10m का reference line बनाएं ताकि area सही निकले'); return }
    const pxPerMeter = calibration.pxPerMeter
    const panelWPx = panelW * pxPerMeter
    const panelHPx = panelH * pxPerMeter
    const gapPx = 0.25 * pxPerMeter

    // Bounding box of roof
    const xs = roofPolygon.map(p => p.x), ys = roofPolygon.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)

    const newPanels: PanelPix[] = []
    for (let x = minX + panelWPx / 2; x < maxX - panelWPx / 2; x += panelWPx + gapPx) {
      for (let y = minY + panelHPx / 2; y < maxY - panelHPx / 2; y += panelHPx + gapPx) {
        const center = { x, y }
        if (isPointInPolygon(center, roofPolygon)) {
          newPanels.push({ x, y, id: Math.random().toString(36).slice(2), wPx: panelWPx, hPx: panelHPx })
        }
      }
    }
    setPanels(newPanels)
    const areaPx = polygonAreaPixels(roofPolygon)
    const areaM2 = areaPx / (pxPerMeter * pxPerMeter)
    setRoofAreaM2(areaM2)
  }

  const calculateArea = () => {
    if (!calibration || roofPolygon.length < 3) return 0
    const areaPx = polygonAreaPixels(roofPolygon)
    return areaPx / (calibration.pxPerMeter * calibration.pxPerMeter)
  }

  useEffect(() => {
    if (calibration && roofPolygon.length >= 3) {
      setRoofAreaM2(calculateArea())
    }
  }, [roofPolygon, calibration])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[1100px] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-3">
            <img src="/raavi-logo.png" alt="Raavi" className="h-7 w-auto" />
            <span className="font-bold text-gray-900">📸 Roof Image Upload - Design on Photo</span>
            {roofAreaM2 > 0 && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-bold">{roofAreaM2.toFixed(1)} m² • {panels.length} panels • {(panels.length * panelWatt / 1000).toFixed(2)}kW</span>}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 hidden md:block">Drone / Site photo upload करके उसी पर design</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center">✕</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Tools */}
          <div className="w-[280px] border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-4 overflow-y-auto">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step 1 - Upload</div>
              <label className="mt-2 block w-full bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-900 hover:bg-gray-50">
                <div className="text-2xl">📸</div>
                <div className="text-sm font-semibold mt-2">Roof Image Upload</div>
                <div className="text-xs text-gray-500 mt-1">Drone, site photo, Google Earth screenshot</div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {imageUrl && <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">✅ Image loaded • {imageRef.current?.width}x{imageRef.current?.height}px</div>}
            </div>

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase">Step 2 - Calibrate Scale</div>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                🔧 <b>बहुत जरूरी:</b> Photo पर कोई ज्ञात लंबाई (दीवार, 10m) पर 2 points click करो → Real meters डालो → System px/m calculate करेगा
              </div>
              <button onClick={() => { setMode('calibrate'); setCalibPoints([]) }} className={`mt-2 w-full py-2.5 rounded-xl text-sm font-semibold border ${mode === 'calibrate' ? 'bg-amber-400 text-black border-amber-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>📏 Calibrate {calibration && `✅ ${calibration.realMeters}m = ${calibration.pxPerMeter.toFixed(1)}px/m`}</button>
              {calibration && <div className="mt-2 text-xs text-gray-600">Scale: 1m = {calibration.pxPerMeter.toFixed(1)} px<br/>1 panel {panelW}m x {panelH}m = {(panelW * calibration.pxPerMeter).toFixed(0)} x {(panelH * calibration.pxPerMeter).toFixed(0)} px</div>}
            </div>

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase">Step 3 - Draw Roof</div>
              <button onClick={() => setMode('draw')} className={`mt-2 w-full py-2.5 rounded-xl text-sm font-semibold border ${mode === 'draw' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200'}`}>✏️ Draw Roof Boundary ({roofPolygon.length} pts)</button>
              <div className="mt-2 flex gap-2"><button onClick={() => setRoofPolygon([])} className="flex-1 bg-white border border-gray-200 rounded-lg py-2 text-xs">Clear Roof</button><button onClick={() => { if (roofPolygon.length > 0) { const a = polygonAreaPixels(roofPolygon); const m2 = calibration ? a / (calibration.pxPerMeter * calibration.pxPerMeter) : a; alert(`Area: ${a.toFixed(0)} px² = ${m2.toFixed(1)} m² ${calibration ? '' : '(calibrate करने पर exact m²)'}`) } }} className="flex-1 bg-white border border-gray-200 rounded-lg py-2 text-xs">📐 Area</button></div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase">Step 4 - Place Panels</div>
              <button onClick={handleAutoPlace} className="mt-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow">🔋 Auto Place {panelWatt}W ({panelW}x{panelH}m)</button>
              <button onClick={() => setPanels([])} className="mt-2 w-full bg-white border border-gray-200 rounded-xl py-2.5 text-sm">Clear Panels</button>
              <div className="mt-3 bg-gray-900 text-white rounded-xl p-3 text-sm">
                <div className="text-xs text-gray-400 uppercase">Auto Design Result</div>
                <div className="mt-1">Roof: <b>{roofAreaM2.toFixed(1)} m²</b></div>
                <div>Panels: <b>{panels.length} x {panelWatt}W</b></div>
                <div>System: <b>{(panels.length * panelWatt / 1000).toFixed(2)} kW</b></div>
                <div>Annual: <b>{Math.round(panels.length * panelWatt / 1000 * 1500).toLocaleString()} kWh</b></div>
              </div>
            </div>

            <button onClick={() => { if (imageUrl) onDesignComplete(panels.length, roofAreaM2, imageUrl) }} className="mt-auto w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black">✅ Use This Design in Main App →</button>
            <div className="text-[10px] text-gray-400 text-center">Raavi Solar - Next Level Image Design - Zero Error</div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#eef2f7] relative overflow-hidden" ref={containerRef}>
            {!imageUrl && (
              <div className="absolute inset-0 grid place-items-center text-center p-8">
                <div><div className="text-6xl">🛰️</div><div className="font-bold text-gray-900 mt-4">Roof Photo Upload करके Design शुरू करो</div><div className="text-sm text-gray-500 mt-2">Drone photo, site survey photo, या Google Earth screenshot upload करो<br/>फिर Calibrate → Draw Roof → Auto Place panels</div></div>
              </div>
            )}
            <canvas ref={canvasRef} onClick={handleCanvasClick} className="absolute inset-0 w-full h-full cursor-crosshair" style={{ display: imageUrl ? 'block' : 'none' }} />
            {mode === 'calibrate' && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow">📏 Calibration Mode - 2 points click करो (ज्ञात लंबाई)</div>}
            {mode === 'draw' && <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">✏️ Draw Mode - Roof boundary click करके बनाओ, double-click से close</div>}
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      {showCalibModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm grid place-items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-[340px] shadow-2xl">
            <div className="font-bold text-gray-900">📏 Real Length क्या है?</div>
            <div className="text-sm text-gray-500 mt-1">आपने {Math.round(Math.hypot(calibPoints[1].x - calibPoints[0].x, calibPoints[1].y - calibPoints[0].y))} pixels की line बनाई</div>
            <div className="text-xs text-gray-500 mt-2">इस line की असली लंबाई कितनी है? e.g. दीवार की लंबाई 10m, 5m etc.</div>
            <input type="number" value={tempRealLength} onChange={e => setTempRealLength(e.target.value)} className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-gray-900 focus:outline-none" placeholder="10" />
            <div className="flex gap-2 mt-4"><button onClick={() => { setCalibPoints([]); setShowCalibModal(false) }} className="flex-1 bg-gray-100 rounded-xl py-2.5 text-sm font-medium">Cancel</button><button onClick={handleCalibConfirm} className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold">Confirm - Set Scale ✅</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
