'use client'
import { useState, useMemo } from 'react'

export default function ConsumptionAnalyzer({ annualProdKwh, systemKw }: { annualProdKwh: number, systemKw: number }) {
  const [monthlyBill, setMonthlyBill] = useState('5000')
  const [monthlyUnits, setMonthlyUnits] = useState('625')
  const [useSlab, setUseSlab] = useState(true)

  // JVVNL Slab Rates Jaipur 2026 (approx from search)
  const slabs = [
    { upTo: 50, rate: 3.85, label: '0-50' },
    { upTo: 150, rate: 5.15, label: '51-150' },
    { upTo: 300, rate: 6.30, label: '151-300' },
    { upTo: Infinity, rate: 7.15, label: '300+ (Upper slab)' },
  ]

  const calcBillFromUnits = (units: number) => {
    let bill = 0, remaining = units
    let prev = 0
    for (const slab of slabs) {
      const slabUnits = Math.min(remaining, slab.upTo - prev)
      if (slabUnits <= 0) break
      bill += slabUnits * slab.rate
      remaining -= slabUnits
      prev = slab.upTo
      if (remaining <= 0) break
    }
    // Add fixed charges ~ Rs 400
    bill += 400
    return Math.round(bill)
  }

  const { billBefore, billAfter, monthlyData } = useMemo(() => {
    const unitsPerMonth = parseFloat(monthlyUnits) || 625
    const billB = useSlab ? calcBillFromUnits(unitsPerMonth) : parseFloat(monthlyBill) || 5000
    // Monthly production with seasonality (same as elsewhere)
    const prodYear = annualProdKwh || systemKw * 1500
    const monthlyFactors = [0.78, 0.88, 1.05, 1.12, 1.15, 1.05, 0.82, 0.80, 0.92, 1.02, 0.88, 0.78]
    const data = monthlyFactors.map((f, i) => {
      const prod = (prodYear / 12) * f
      const consumption = unitsPerMonth
      const net = consumption - prod // positive = import, negative = export
      const importUnits = net > 0 ? net : 0
      const exportUnits = net < 0 ? -net : 0
      const billBeforeMo = calcBillFromUnits(consumption)
      const billAfterMo = importUnits > 0 ? calcBillFromUnits(importUnits) : -exportUnits * 3.8 // export at Rs 3.8
      return { month: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i], prod, consumption, importUnits, exportUnits, billBeforeMo, billAfterMo }
    })
    const totalBillBefore = data.reduce((a, b) => a + b.billBeforeMo, 0)
    const totalBillAfterRaw = data.reduce((a, b) => a + b.billAfterMo, 0)
    const totalBillAfter = Math.max(0, totalBillAfterRaw) // if net export, bill min 0 but carry forward
    return { billBefore: totalBillBefore, billAfter: totalBillAfter, monthlyData: data }
  }, [monthlyUnits, monthlyBill, useSlab, annualProdKwh, systemKw])

  const yearlySaving = billBefore - billAfter
  const monthlyProdAvg = annualProdKwh / 12

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 text-white rounded-xl p-4">
        <div className="text-xs text-gray-400 uppercase font-bold">📊 Consumption vs Generation - JVVNL Slab Analysis</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400">Monthly Units (kWh)</label><input type="number" value={monthlyUnits} onChange={e => { setMonthlyUnits(e.target.value); setMonthlyBill(calcBillFromUnits(parseFloat(e.target.value) || 0).toString()) }} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white" /></div>
          <div><label className="text-xs text-gray-400">Monthly Bill ₹ (or auto from slab)</label><input type="number" value={monthlyBill} onChange={e => setMonthlyBill(e.target.value)} className="w-full mt-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white" /></div>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs"><input type="checkbox" checked={useSlab} onChange={e => setUseSlab(e.target.checked)} /> Use JVVNL slab rates (0-50: ₹3.85, 51-150: ₹5.15, 151-300: ₹6.30, 300+: ₹7.15)</label>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3"><div className="text-xs text-gray-400">Bill Before Solar</div><div className="font-bold text-lg">₹{billBefore.toLocaleString()}/yr</div><div className="text-xs text-gray-400">₹{(billBefore / 12).toFixed(0)}/mo avg</div></div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3"><div className="text-xs text-green-300">Bill After Solar</div><div className="font-bold text-lg text-green-300">₹{Math.max(0, billAfter).toLocaleString()}/yr</div><div className="text-xs text-green-400">Net import after export @₹3.8</div></div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3"><div className="text-xs text-blue-300">Yearly Saving</div><div className="font-bold text-lg text-blue-300">₹{yearlySaving.toLocaleString()}</div><div className="text-xs text-blue-400">{((yearlySaving / billBefore) * 100).toFixed(0)}% bill cut</div></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="font-bold text-sm text-gray-900">Monthly Import / Export - Jaipur Net Metering</div>
        <div className="mt-3 overflow-x-auto">
          <div className="flex items-end gap-1 h-32 min-w-[320px]">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '80px' }}>
                  <div className="bg-blue-500 rounded-t" style={{ height: `${Math.min(100, (d.prod / (parseFloat(monthlyUnits) || 625)) * 50)}%` }} title={`Prod ${d.prod.toFixed(0)}`} />
                  <div className="bg-gray-300 rounded-b" style={{ height: `${Math.min(100, (d.consumption / (parseFloat(monthlyUnits) || 625)) * 50)}%` }} />
                </div>
                <div className="text-[10px] text-gray-500">{d.month}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[11px]"><span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Solar Prod (~{monthlyProdAvg.toFixed(0)} avg)</span><span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 rounded-sm"></span> Consumption ({monthlyUnits})</span></div>
        </div>
        <div className="mt-4 grid grid-cols-12 gap-1 text-[10px]">
          {monthlyData.map((d, i) => (
            <div key={i} className={`p-1.5 rounded text-center ${d.importUnits > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
              <div className="font-bold">{d.month}</div><div>{d.importUnits > 0 ? `+${d.importUnits.toFixed(0)} imp` : `-${d.exportUnits.toFixed(0)} exp`}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">JVVNL net metering: Export credited @₹3.5-4.0/unit, import billed at slab (₹7.15 upper). If monthly export is more than import, carried forward. Yearly settlement.</div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <b>Jaipur Example:</b> 625 units consumption @ ₹7.15 slab upper = ~₹5000 bill. 5kW produces ~625 units/mo avg (1500*5/12=625). Net bill ~₹400 fixed + minor. Saving ₹4600/mo = ₹55k/yr. Payback 3.2yr with subsidy.
      </div>
    </div>
  )
}
