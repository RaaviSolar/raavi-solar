'use client'
import { useMemo } from 'react'

interface Props {
  panelsCount: number
  panelWatt: number
  inverterKw: number
  inverterPh: string
}

export default function StringingDesigner({ panelsCount, panelWatt, inverterKw, inverterPh }: Props) {
  // Auto stringing logic - Jaipur standard
  const stringing = useMemo(() => {
    // Panel specs typical 540W: Voc 49.5V, Vmp 41.5V, Isc 13.5A, Imp 12.8A
    const voc = 49.5, vmp = 41.5, isc = 13.5
    const inverterSpecs: Record<number, { mppt: number, maxStringsPerMppt: number, mpptVoltage: [number, number], maxVoc: number }> = {
      3: { mppt: 2, maxStringsPerMppt: 1, mpptVoltage: [100, 550], maxVoc: 600 },
      5: { mppt: 2, maxStringsPerMppt: 1, mpptVoltage: [100, 550], maxVoc: 600 },
      10: { mppt: 2, maxStringsPerMppt: 2, mpptVoltage: [150, 850], maxVoc: 1100 },
    }
    const spec = inverterSpecs[inverterKw] || inverterSpecs[3]
    const totalPanels = panelsCount || 6
    // Auto split into strings for MPPTs
    const stringsNeeded = Math.ceil(totalPanels / 12) // max 12 panels per string typical for 3kW (600Voc limit)
    const perString = Math.ceil(totalPanels / stringsNeeded)
    const strings = []
    let remaining = totalPanels
    for (let i = 0; i < stringsNeeded; i++) {
      const count = Math.min(perString, remaining)
      if (count <= 0) break
      const vmpString = count * vmp
      const vocString = count * voc
      const isValid = vocString <= spec.maxVoc && vmpString >= spec.mpptVoltage[0] && vmpString <= spec.mpptVoltage[1]
      strings.push({ id: i + 1, count, vmp: vmpString, voc: vocString, mppt: (i % spec.mppt) + 1, isValid, current: isc })
      remaining -= count
    }
    return { strings, spec, totalPanels }
  }, [panelsCount, panelWatt, inverterKw])

  const allValid = stringing.strings.every(s => s.isValid)
  const wireLoss = (panelsCount * 0.5 / 100 * 1500).toFixed(1) // approx 0.5% loss

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 text-white rounded-xl p-4">
        <div className="text-xs text-gray-400 uppercase font-bold">⚡ Electrical Stringing - Auto MPPT Design</div>
        <div className="mt-2 flex gap-3 text-xs"><span className="bg-white/10 px-2 py-1 rounded-full">{inverterKw}kW {inverterPh} • {stringing.spec.mppt} MPPT • MaxVoc {stringing.spec.maxVoc}V</span><span className={`px-2 py-1 rounded-full ${allValid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{allValid ? '✅ All Strings Valid' : '⚠️ Voltage Check Needed'}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stringing.strings.map(s => (
            <div key={s.id} className={`border rounded-xl p-3 ${s.isValid ? 'bg-white/10 border-white/20' : 'bg-red-500/20 border-red-500/50'}`}>
              <div className="flex justify-between"><span className="font-bold text-sm">String {s.id}</span><span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">MPPT {s.mppt}</span></div>
              <div className="text-xs mt-2 space-y-1 text-gray-300"><div>Panels: <b className="text-white">{s.count} x {panelWatt}W</b> = {(s.count * panelWatt / 1000).toFixed(2)}kW</div><div>Vmp: <b className={s.isValid ? 'text-green-300' : 'text-red-300'}>{s.vmp.toFixed(0)}V</b> (Range {stringing.spec.mpptVoltage[0]}-{stringing.spec.mpptVoltage[1]}V)</div><div>Voc: {s.voc.toFixed(0)}V / {stringing.spec.maxVoc}V max</div><div>Isc: {s.current}A</div></div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-400">Panel Voc 49.5V, Vmp 41.5V typical 540W • Wire loss ~{wireLoss} kWh/yr (0.5%) • Jaipur temp derate included</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="font-bold text-sm text-gray-900">📐 Single Line Diagram (SLD) - JVVNL Submission</div>
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto">
          <svg viewBox="0 0 600 220" className="w-full h-[220px]">
            {/* Panels */}
            {stringing.strings.map((s, idx) => (
              <g key={s.id} transform={`translate(${20 + idx * 180},20)`}>
                <rect x="0" y="0" width="140" height="60" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
                <text x="70" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">String {s.id} - MPPT{s.mppt}</text>
                <text x="70" y="36" textAnchor="middle" fontSize="10" fill="#374151">{s.count} x {panelWatt}W</text>
                <text x="70" y="50" textAnchor="middle" fontSize="9" fill="#6b7280">{s.vmp.toFixed(0)}V / {s.voc.toFixed(0)}Voc</text>
              </g>
            ))}
            {/* DCDB */}
            <rect x="220" y="110" width="100" height="40" rx="6" fill="#fef3c7" stroke="#f59e0b" />
            <text x="270" y="135" textAnchor="middle" fontSize="11" fontWeight="bold">DCDB</text>
            {/* Lines to DCDB */}
            {stringing.strings.map((_, idx) => <line key={idx} x1={90 + idx * 180} y1="80" x2="270" y2="110" stroke="#6b7280" strokeDasharray="4 4" />)}
            {/* Inverter */}
            <rect x="200" y="170" width="140" height="40" rx="8" fill="#111827" />
            <text x="270" y="195" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">{inverterKw}kW Inverter {inverterPh}</text>
            <line x1="270" y1="150" x2="270" y2="170" stroke="#111827" strokeWidth="2" />
            {/* Grid */}
            <text x="450" y="100" fontSize="10" fill="#6b7280">JVVNL Grid</text>
            <text x="450" y="115" fontSize="9" fill="#9ca3af">Net Meter → 7.15/kWh slab</text>
          </svg>
        </div>
        <div className="mt-2 text-[11px] text-gray-500">Auto generated SLD for JVVNL submission - Includes panel strings, DCDB, inverter, ACDB, net meter. Export to PDF for DISCOM.</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <b>💡 Jaipur Tip:</b> 3kW में max 12 panels per string (Voc 600V limit) - 6 panels = 1 string 249Vmp valid। 10kW 3Ph में 2 MPPT, each 2 strings max।
      </div>
    </div>
  )
}
