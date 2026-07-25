'use client'
import { useState } from 'react'
import ObstructionTool from './ObstructionTool'
import StringingDesigner from './StringingDesigner'
import ConsumptionAnalyzer from './ConsumptionAnalyzer'
import ProposalShareAndSign from './ProposalShareAndSign'
import DRCAndBOQ from './DRCAndBOQ'

export default function AdvancedToolsHub({ panelsCount, panelWatt, systemKw, roofArea, roofPolygon, annualProd, map, currentCenter, shadingLoss, tilt, leadName, leadPhone }: any) {
  const [active, setActive] = useState<'obstruction' | 'stringing' | 'consumption' | 'share' | 'drc'>('obstruction')
  const [obstructions, setObstructions] = useState<any[]>([])

  const handleAddObs = (obs: any) => {
    setObstructions([...obstructions, obs])
    // Also add marker to map if map exists
    if (map && window && (window as any).L) {
      const L = (window as any).L
      const marker = L.marker([obs.lat, obs.lng], { draggable: true }).addTo(map)
      marker.bindPopup(`${obs.type} H:${obs.height}m`).openPopup()
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="font-bold text-sm">🧪 Advanced Tools - Next Level Features</span><span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">5 Tools • OpenSolar 3.0+</span></div>
        <div className="text-xs text-gray-400 hidden md:block">Obstruction • Stringing • Bill Analysis • WhatsApp E-Sign • DRC BOQ</div>
      </div>
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {[
          { id: 'obstruction', label: '🧱 Shadow' },
          { id: 'stringing', label: '⚡ Stringing' },
          { id: 'consumption', label: '📊 Bill Analysis' },
          { id: 'share', label: '💬 Share & Sign' },
          { id: 'drc', label: '🛡️ DRC & BOQ' },
        ].map(t => (
          <button key={t.id} onClick={() => setActive(t.id as any)} className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 ${active === t.id ? 'bg-white border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>
      <div className="p-4 max-h-[520px] overflow-y-auto">
        {active === 'obstruction' && <ObstructionTool obstructions={obstructions} setObstructions={setObstructions} onAdd={handleAddObs} map={map} currentCenter={currentCenter} roofPolygon={roofPolygon} />}
        {active === 'stringing' && <StringingDesigner panelsCount={panelsCount} panelWatt={panelWatt} inverterKw={Math.ceil(systemKw) || 3} inverterPh={systemKw > 5 ? '3-Ph' : '1-Ph'} />}
        {active === 'consumption' && <ConsumptionAnalyzer annualProdKwh={annualProd} systemKw={systemKw} />}
        {active === 'share' && <ProposalShareAndSign leadName={leadName || 'Demo Customer'} leadPhone={leadPhone || '9214567383'} systemKw={systemKw} proposalId={Math.random().toString(36).slice(2, 8).toUpperCase()} onSigned={(url) => alert('✅ Signed! Proposal approved')} />}
        {active === 'drc' && <DRCAndBOQ panelsCount={panelsCount} roofArea={roofArea} roofPolygon={roofPolygon} systemKw={systemKw} shadingLoss={shadingLoss} tilt={tilt} obstructionsCount={obstructions.length} />}
      </div>
    </div>
  )
}
