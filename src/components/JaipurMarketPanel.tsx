'use client'
import { useState } from 'react'
import { JAIPUR_PANELS, JAIPUR_INVERTERS, JAIPUR_STRUCTURES, JAIPUR_BOS_3KW, JAIPUR_SUBSIDY, calculateJaipurQuote } from '@/lib/jaipurMarketData'

export default function JaipurMarketPanel({ onSelectQuote }: { onSelectQuote?: (kw: number, sku: string, struct: string) => void }) {
  const [kw, setKw] = useState(5)
  const [selectedPanel, setSelectedPanel] = useState('DCR-PERC-540-Bi')
  const [structType, setStructType] = useState('Low-Rise')
  const quote = calculateJaipurQuote(kw, selectedPanel, structType, JAIPUR_PANELS.find(p => p.sku === selectedPanel)?.dcr || false)
  const [activeTab, setActiveTab] = useState<'panels' | 'inverters' | 'structure' | 'bos' | 'quote'>('quote')

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <img src="/raavi-logo.png" alt="Raavi" className="h-7 w-auto" />
          <div>
            <div className="font-bold text-gray-900 text-sm">Jaipur Market Study 2026 - Vendor Price Database</div>
            <div className="text-xs text-gray-500">DCR vs Non-DCR • Live Vendor Price Jaipur • Quotation Helper • JVVNL</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
        {(['quote', 'panels', 'inverters', 'structure', 'bos'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-xs font-semibold uppercase whitespace-nowrap ${activeTab === t ? 'bg-white border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}>{t}</button>
        ))}
      </div>

      <div className="p-4 max-h-[420px] overflow-y-auto">
        {activeTab === 'quote' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-gray-700">System kW</label><input type="number" value={kw} onChange={e => setKw(parseFloat(e.target.value) || 1)} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-700">Panel SKU</label><select value={selectedPanel} onChange={e => setSelectedPanel(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl px-2 py-2 text-xs">{JAIPUR_PANELS.map(p => <option key={p.sku} value={p.sku}>{p.sku} {p.dcr ? 'DCR' : 'NDCR'} {p.watt}W @₹{p.pricePerWattRetail.avg}/W</option>)}</select></div>
              <div><label className="text-xs font-medium text-gray-700">Structure</label><select value={structType} onChange={e => setStructType(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl px-2 py-2 text-xs">{JAIPUR_STRUCTURES.map(s => <option key={s.type} value={s.type}>{s.type}</option>)}</select></div>
            </div>

            <div className="bg-gray-900 text-white rounded-xl p-4">
              <div className="text-xs text-gray-400 uppercase">Raavi Solar Jaipur Quote - {kw}kW {quote.panel.dcr ? 'DCR Subsidy Eligible' : 'Non-DCR'}</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>Panels: {quote.panelsNeeded} x {quote.panel.watt}W = ₹{quote.panelCost.toLocaleString()}<br/><span className="text-xs text-gray-400">{quote.panel.brands[0]}</span></div>
                <div>Inverter: ₹{quote.inverterCost.toLocaleString()}<br/><span className="text-xs text-gray-400">{quote.inverter.models[0].brand}</span></div>
                <div>Structure: ₹{quote.structureCost.toLocaleString()}<br/><span className="text-xs text-gray-400">{quote.struct.type}</span></div>
                <div>BOS: ₹{quote.bosCost.toLocaleString()}<br/><span className="text-xs text-gray-400">ACDB,DCDB,cables,earthing,net meter</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-3">
                <div><div className="text-xs text-gray-400">Gross</div><div className="font-bold text-lg">₹{quote.gross.toLocaleString()}</div></div>
                <div><div className="text-xs text-gray-400">Subsidy {quote.panel.dcr ? '✅' : '❌'}</div><div className="font-bold text-green-400">-₹{quote.subsidy.toLocaleString()}</div></div>
                <div><div className="text-xs text-gray-400">Net</div><div className="font-bold text-xl text-white">₹{quote.net.toLocaleString()}</div></div>
              </div>
              <div className="mt-3 text-xs text-gray-400">25yr savings: ₹{(kw * 1500 * 8 * 25).toLocaleString()} • Payback: {(quote.net / (kw * 1500 * 8)).toFixed(1)}yr • Source: Jaipur vendor 2026</div>
              {onSelectQuote && <button onClick={() => onSelectQuote(kw, selectedPanel, structType)} className="mt-3 w-full bg-white text-black font-bold py-2.5 rounded-xl text-sm">Use in Auto Design →</button>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              <b>💡 Jaipur Strategy:</b> {quote.panel.dcr ? `DCR price ₹${quote.panel.pricePerWattRetail.avg}/W महंगा पर subsidy ₹${quote.subsidy} से Net ₹${(quote.gross - quote.net - (JAIPUR_PANELS.find(p=>!p.dcr)?.pricePerWattRetail.avg || 20)*kw*1000).toLocaleString()} सस्ता Non-DCR vs DCR gross compare से। Residential में DCR ही बेचो।` : 'Non-DCR cheapest gross, commercial no-subsidy best।'}
            </div>
          </div>
        )}

        {activeTab === 'panels' && (
          <div className="space-y-3">
            {JAIPUR_PANELS.map(p => (
              <div key={p.sku} className={`border rounded-xl p-3 ${p.dcr ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start"><div><div className="font-bold text-sm text-gray-900">{p.sku} {p.dcr ? '✅ DCR' : '⚪ Non-DCR'} - {p.watt}W</div><div className="text-xs text-gray-500">{p.type} • {p.efficiency} • {p.brands.slice(0,2).join(', ')}</div></div><div className="text-right"><div className="font-bold text-gray-900">₹{p.pricePerWattRetail.avg}/W</div><div className="text-xs text-gray-500">₹{p.pricePerPanelRetail.avg.toLocaleString()}/panel</div></div></div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]"><div className="bg-white border rounded-lg p-2"><div className="text-gray-400">Retail Jaipur</div><div className="font-bold">₹{p.pricePerWattRetail.min}-₹{p.pricePerWattRetail.max}/W</div></div><div className="bg-white border rounded-lg p-2"><div className="text-gray-400">Empanelled JVVNL</div><div className="font-bold text-red-600">₹{p.pricePerWattEmpanelled.min}-₹{p.pricePerWattEmpanelled.max}/W loot</div></div><div className="bg-white border rounded-lg p-2"><div className="text-gray-400">Best For</div><div className="font-medium">{p.bestFor}</div></div></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inverters' && (
          <div className="space-y-3">
            {JAIPUR_INVERTERS.map(inv => (
              <div key={inv.sku} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="font-bold text-sm">{inv.capacityKw}kW {inv.phase} - Avg ₹{inv.avgPrice.toLocaleString()}</div>
                <div className="mt-2 space-y-1">{inv.models.map(m => <div key={m.brand+m.model} className="flex justify-between text-xs bg-white border rounded-lg p-2"><span>{m.brand} {m.model}</span><span className="font-bold">₹{m.priceJaipur.toLocaleString()} • {m.warranty}</span></div>)}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="space-y-2">
            {JAIPUR_STRUCTURES.map(s => (
              <div key={s.type} className="border border-gray-200 rounded-xl p-3 bg-white"><div className="flex justify-between"><span className="font-bold text-sm">{s.type} {s.height}</span><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{s.bestFor}</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-xs"><div>Per kW: ₹{s.costPerKw.min}-₹{s.costPerKw.max}</div><div>3kW: ₹{s.cost3kW.min}-₹{s.cost3kW.max}</div><div>5kW: ₹{s.cost5kW.min}-₹{s.cost5kW.max}</div></div></div>
            ))}
          </div>
        )}

        {activeTab === 'bos' && (
          <div className="space-y-2">
            {JAIPUR_BOS_3KW.map((b, idx) => (
              <div key={idx} className="flex justify-between text-xs border-b border-gray-100 py-2"><span className="font-medium w-1/3">{b.component}<br/><span className="text-gray-400 font-normal">{b.spec}</span></span><span className="w-1/3 text-gray-500">{b.brand}<br/>{b.qty3kW}</span><span className="w-1/3 text-right font-bold">{b.priceJaipur}<br/><span className="text-gray-500 font-normal">{b.total3kW} (3kW)</span></span></div>
            ))}
            <div className="bg-gray-900 text-white rounded-xl p-3 text-xs mt-3">Total BOS 3kW Jaipur: ~₹52k-62k (Excl panels, inverter, structure) - Source DesiDime + Indiamart Jaipur vendors</div>
          </div>
        )}
      </div>
    </div>
  )
}
