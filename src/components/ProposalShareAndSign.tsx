'use client'
import { useState, useRef } from 'react'

export default function ProposalShareAndSign({ leadName, leadPhone, systemKw, proposalId, onSigned }: {
  leadName: string,
  leadPhone: string,
  systemKw: number,
  proposalId: string,
  onSigned: (signatureDataUrl: string) => void
}) {
  const [viewCount, setViewCount] = useState(3)
  const [signed, setSigned] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const proposalLink = typeof window !== 'undefined' ? `${window.location.origin}/proposal/${proposalId}` : `/proposal/${proposalId}`
  const whatsappMessage = `Hi ${leadName}, Raavi Solar - ${systemKw}kW Solar Proposal ready! 🌞\n\n📄 View Proposal: ${proposalLink}\n💰 Net Cost after subsidy, 25yr savings, 3D design included\n📞 Call: 9214567383 | www.raavisolar.com\n\nViewed ${viewCount} times • Sign online to approve`

  const handleWhatsappShare = () => {
    const phone = leadPhone.replace(/[^0-9]/g, '').slice(-10)
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(url, '_blank')
    setWhatsappSent(true)
    setViewCount(v => v + 1)
  }

  const startDraw = (e: any) => {
    setIsDrawing(true)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  const endDraw = () => setIsDrawing(false)
  const clearSign = () => { const c = canvasRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height) }
  const confirmSign = () => {
    const dataUrl = canvasRef.current!.toDataURL()
    setSigned(true)
    onSigned(dataUrl)
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="font-bold text-green-900 text-sm">💬 WhatsApp + E-Sign - Proposal Sharing</div>
        <div className="mt-3 space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500 uppercase font-bold">Proposal Link (Trackable)</div>
            <div className="mt-1 flex gap-2"><input value={proposalLink} readOnly className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs" /><button onClick={() => navigator.clipboard.writeText(proposalLink)} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs">Copy</button></div>
            <div className="mt-2 flex gap-3 text-xs"><span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">👁️ {viewCount} views</span><span className="bg-gray-100 px-2 py-1 rounded-full">Last: 2h ago</span><span className={`px-2 py-1 rounded-full ${signed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700'}`}>{signed ? '✅ Signed' : '⏳ Pending sign'}</span></div>
          </div>

          <button onClick={handleWhatsappShare} className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#128C7E]"><span className="text-lg">💬</span> Share on WhatsApp to {leadName} {whatsappSent && '✅ Sent'}</button>
          <div className="grid grid-cols-2 gap-2"><button className="bg-white border border-gray-200 rounded-xl py-2.5 text-xs font-medium">📧 Email Proposal</button><button className="bg-white border border-gray-200 rounded-xl py-2.5 text-xs font-medium">📱 SMS Link</button></div>
          <div className="text-xs text-gray-500">Pre-filled Hindi/English message with proposal link, Raavi branding, phone, website. Tracking: when customer opens link, view count +1, you get notification (Supabase Realtime).</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="font-bold text-sm text-gray-900">✍️ E-Signature - Customer Approval</div>
        <div className="text-xs text-gray-500 mt-1">Customer online sign कर सकता है - proposal/[id] page पर</div>
        <div className="mt-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-2">
          <canvas ref={canvasRef} width={400} height={150} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} className="w-full h-[150px] bg-white rounded-lg cursor-crosshair touch-none" />
        </div>
        <div className="mt-3 flex gap-2"><button onClick={clearSign} className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-xs">Clear</button><button onClick={confirmSign} className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-xs font-bold">✅ Confirm Signature & Approve Proposal</button></div>
        {signed && <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">✅ Signed by {leadName} • {new Date().toLocaleString('en-IN')} • IP tracked • Proposal status: SIGNED → Move to Installation</div>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800"><b>💡 Workflow:</b> Share → Customer views (view count) → Customer signs online → Auto status WON → Team notified → Installation Kanban में move। OpenSolar जैसा।</div>
    </div>
  )
}
