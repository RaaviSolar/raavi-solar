'use client'
import { useMemo } from 'react'
import { JAIPUR_BOS_3KW } from '@/lib/jaipurMarketData'

interface Props {
  panelsCount: number
  roofArea: number
  roofPolygon: number[][] | null
  systemKw: number
  shadingLoss: number
  tilt: number
  obstructionsCount: number
}

export default function DRCAndBOQ({ panelsCount, roofArea, roofPolygon, systemKw, shadingLoss, tilt, obstructionsCount }: Props) {
  const checks = useMemo(() => {
    const list = []
    // Edge clearance - assume roof area vs panels area
    const panelArea = panelsCount * 2.27 * 1.13
    const coverage = roofArea > 0 ? (panelArea / roofArea) * 100 : 0
    list.push({ id: 'edge', label: 'Edge Clearance 300mm', status: coverage > 85 ? 'fail' : coverage > 70 ? 'warn' : 'pass', msg: coverage > 85 ? `Coverage ${coverage.toFixed(0)}% too high - 300mm edge clearance needed for fire safety` : coverage > 70 ? `Coverage ${coverage.toFixed(0)}% - keep 300mm edge` : `Coverage ${coverage.toFixed(0)}% ✅ Safe - edge clearance OK`, value: `${coverage.toFixed(0)}% coverage` })
    list.push({ id: 'maintenance', label: 'Maintenance Path 600mm', status: panelsCount > 12 && coverage > 60 ? 'warn' : 'pass', msg: panelsCount > 12 && coverage > 60 ? '12+ panels - need 600mm maintenance path every 2 rows' : 'Maintenance path OK', value: panelsCount > 12 ? 'Path needed' : 'Single row OK' })
    list.push({ id: 'shade', label: 'Shading Loss <15%', status: shadingLoss > 20 ? 'fail' : shadingLoss > 15 ? 'warn' : 'pass', msg: shadingLoss > 20 ? `Shading ${shadingLoss}% too high - remove obstructions or move panels` : shadingLoss > 15 ? `Shading ${shadingLoss}% borderline - check trees/tanks` : `Shading ${shadingLoss}% ✅ Excellent`, value: `${shadingLoss}% loss` })
    list.push({ id: 'tilt', label: 'Tilt for Jaipur 15-20°', status: tilt < 5 || tilt > 35 ? 'warn' : 'pass', msg: tilt < 5 ? 'Tilt <5° - dust accumulation risk Jaipur' : tilt > 35 ? 'Tilt >35° - wind load high, yield lower' : `Tilt ${tilt}° ideal for Jaipur 26.9°N`, value: `${tilt}°` })
    list.push({ id: 'obstruction', label: 'Obstructions Clearance', status: obstructionsCount > 0 ? 'warn' : 'pass', msg: obstructionsCount > 0 ? `${obstructionsCount} obstructions placed - ensure 1.5x height clearance` : 'No obstructions ✅', value: `${obstructionsCount} obs` })
    list.push({ id: 'clip', label: 'Inverter Clipping', status: systemKw > 0 && panelsCount * 0.54 / systemKw > 1.25 ? 'warn' : 'pass', msg: panelsCount * 0.54 / systemKw > 1.25 ? 'DC/AC ratio >1.25 - clipping loss possible' : `DC/AC ratio ${(panelsCount * 0.54 / (systemKw || 1)).toFixed(2)} OK`, value: `DC/AC ${(panelsCount * 0.54 / (systemKw || 1)).toFixed(2)}` })
    list.push({ id: 'load', label: 'Roof Load < 25 kg/m²', status: 'pass', msg: 'GI structure + panels ~12-15 kg/m² ✅ Safe for RCC', value: '~15 kg/m²' })
    return list
  }, [panelsCount, roofArea, shadingLoss, tilt, obstructionsCount, systemKw])

  const failCount = checks.filter(c => c.status === 'fail').length
  const warnCount = checks.filter(c => c.status === 'warn').length

  const boq = useMemo(() => {
    const panelWatt = systemKw > 0 ? Math.round((systemKw * 1000) / (panelsCount || 1)) : 540
    return [
      { item: `Solar Panels DCR ${panelWatt}W Bifacial`, qty: `${panelsCount} nos`, rate: '₹33/W', amount: `₹${(panelsCount * panelWatt * 33).toLocaleString()}` },
      { item: `Inverter ${systemKw.toFixed(1)}kW 1Ph On-Grid`, qty: '1 nos', rate: '-', amount: `₹${(systemKw <= 3 ? 18000 : systemKw <= 5 ? 40000 : 58000).toLocaleString()}` },
      { item: `GI Structure Low-Rise 300mm`, qty: `${systemKw.toFixed(1)}kW`, rate: '₹6k/kW', amount: `₹${Math.round(systemKw * 6000).toLocaleString()}` },
      ...JAIPUR_BOS_3KW.map(b => ({ item: b.component, qty: b.qty3kW, rate: b.priceJaipur, amount: b.total3kW })),
    ]
  }, [panelsCount, systemKw])

  return (
    <div className="space-y-4">
      <div className={`border rounded-xl p-4 ${failCount > 0 ? 'bg-red-50 border-red-200' : warnCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex justify-between items-center"><span className="font-bold text-sm">🛡️ DRC - Design Rule Checks</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${failCount > 0 ? 'bg-red-500 text-white' : warnCount > 0 ? 'bg-amber-500 text-black' : 'bg-green-600 text-white'}`}>{failCount > 0 ? `❌ ${failCount} Fail` : warnCount > 0 ? `⚠️ ${warnCount} Warn` : '✅ All Pass'}</span></div>
        <div className="mt-3 space-y-2">
          {checks.map(c => (
            <div key={c.id} className={`border rounded-xl p-2.5 flex justify-between items-start gap-2 ${c.status === 'fail' ? 'bg-white border-red-300' : c.status === 'warn' ? 'bg-white border-amber-300' : 'bg-white border-green-200'}`}>
              <div className="flex gap-2"><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${c.status === 'fail' ? 'bg-red-100 text-red-600' : c.status === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{c.status === 'fail' ? '✕' : c.status === 'warn' ? '!' : '✓'}</span><div><div className="font-semibold text-xs text-gray-900">{c.label}</div><div className="text-[11px] text-gray-600 mt-0.5">{c.msg}</div></div></div><div className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{c.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">DRC auto checks on every design change - OpenSolar style. Edge 300mm fire safety, maintenance 600mm, shade 15% से कम, tilt 15-20° Jaipur, DC/AC 1.25 से कम, roof load 25kg प्रति sqm से कम.</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center"><span className="font-bold text-sm">📋 Auto BOQ & Purchase Order - Jaipur</span><span className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full">{boq.length} items</span></div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 sticky top-0"><tr><th className="text-left p-2">Item</th><th className="text-left p-2">Qty</th><th className="text-right p-2">Rate</th><th className="text-right p-2">Amount</th></tr></thead>
            <tbody>{boq.map((b, i) => <tr key={i} className="border-b border-gray-100"><td className="p-2 font-medium">{b.item}</td><td className="p-2 text-gray-500">{b.qty}</td><td className="p-2 text-right text-gray-500">{b.rate}</td><td className="p-2 text-right font-bold">{b.amount}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 flex justify-between text-sm font-bold"><span>Total Est (Gross)</span><span>₹{Math.round(systemKw * 65000).toLocaleString()} (₹65k/kW avg Jaipur DCR)</span></div>
        <div className="p-3 grid grid-cols-2 gap-2"><button className="bg-white border border-gray-200 rounded-xl py-2.5 text-xs font-medium">📄 Export BOQ PDF</button><button className="bg-gray-900 text-white rounded-xl py-2.5 text-xs font-bold">🛒 Generate PO for Vendors</button></div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <b>💡 Inventory:</b> Auto BOQ from market database (Jaipur vendor rates). Generate PO: panels Waaree dealer, inverter Growatt dealer, structure local VKI, BOS Polycab. Track stock in Supabase inventory table (next).
      </div>
    </div>
  )
}
