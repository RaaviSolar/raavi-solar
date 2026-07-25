'use client'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function ProposalViewPage() {
  const params = useParams()
  const id = params.id as string
  const [signed, setSigned] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDraw = (e: any) => {
    setIsDrawing(true)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.lineTo(x, y); ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
  }
  const endDraw = () => setIsDrawing(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3"><img src="/raavi-logo.png" alt="Raavi" className="h-8 w-auto" /><span className="font-bold">Raavi Solar Proposal</span><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">ID: {id}</span></div>
        <div className="text-xs text-gray-500">📞 9214567383 • www.raavisolar.com</div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-8">
            <div className="flex justify-between items-start"><div><h1 className="text-3xl font-extrabold text-gray-900">Solar Proposal</h1><p className="text-gray-500 mt-2">Prepared for valuable customer • Jaipur • {new Date().toLocaleDateString('en-IN')}</p></div><div className="text-right"><div className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold">⚡ 5.40 kW System</div><div className="text-xs text-gray-500 mt-2">Raavi Solar - Powering Tomorrow (logo में)</div></div></div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="bg-gray-50 border rounded-xl p-4"><div className="text-xs font-bold text-gray-500 uppercase">System Details</div><div className="mt-2 text-sm leading-6">10 x 540W DCR Bifacial<br/>Tilt 15°, Az 180° South best<br/>Annual Production: 8,100 kWh<br/>Roof Area: 68 m²</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4"><div className="text-xs font-bold text-green-700 uppercase">Financials</div><div className="mt-2 text-sm leading-6">Gross: ₹3,25,000<br/>Subsidy: -₹78,000<br/>Net: <b>₹2,47,000</b><br/>Payback 3.2yr • 25yr saving ₹11.5L</div></div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="font-bold text-gray-900">✍️ Customer E-Signature - Approve Proposal</h3>
              <p className="text-sm text-gray-500 mt-1">Sign below to approve and move to installation. Tracking enabled.</p>
              <div className="mt-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-2">
                <canvas ref={canvasRef} width={600} height={180} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} className="w-full h-[180px] bg-white rounded-xl cursor-crosshair touch-none" />
              </div>
              <div className="mt-4 flex gap-3"><button onClick={() => { const c = canvasRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setSigned(false) }} className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm">Clear</button><button onClick={() => setSigned(true)} className="flex-1 bg-gray-900 text-white rounded-xl py-3 text-sm font-bold">✅ Sign & Approve Proposal</button></div>
              {signed && <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">✅ <b>Signed successfully!</b> Proposal ID {id} approved at {new Date().toLocaleString('en-IN')}. Raavi Solar team notified - Installation team will contact within 24h. Track status in customer portal.</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">Raavi Solar • 9214567383 • www.raavisolar.com • Jaipur Rajasthan • JVVNL Approved Vendor • DCR Panels • PM Surya Ghar Subsidy</div>
      </div>
    </div>
  )
}
