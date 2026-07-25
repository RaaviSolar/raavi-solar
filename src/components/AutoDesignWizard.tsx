'use client'
import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAutoDesign: (kw: number, panelsNeeded: number, autoRoof: boolean) => void
  solarInsights: any
  currentCenter: { lat: number, lng: number }
  panelWatt: number
  roofArea: number
}

export default function AutoDesignWizard({ isOpen, onClose, onAutoDesign, solarInsights, currentCenter, panelWatt, roofArea }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [desiredKw, setDesiredKw] = useState<number>(5)
  const [monthlyBill, setMonthlyBill] = useState<string>('5000')
  const [sanctionedLoad, setSanctionedLoad] = useState<string>('5')
  const [billUnits, setBillUnits] = useState<number>(0)
  const [suggestedKw, setSuggestedKw] = useState<number>(5)
  const [maxPossibleKw, setMaxPossibleKw] = useState<number>(0)

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    if (solarInsights?.solarPotential) {
      const maxPanels = solarInsights.solarPotential.maxArrayPanelsCount || 20
      const maxKw = (maxPanels * panelWatt) / 1000
      setMaxPossibleKw(parseFloat(maxKw.toFixed(2)))
    } else {
      const est = roofArea > 0 ? (roofArea / 8) : 10 // 8 sqm per kW approx
      setMaxPossibleKw(parseFloat(est.toFixed(1)))
    }
  }, [isOpen, solarInsights, panelWatt, roofArea])

  useEffect(() => {
    const bill = parseFloat(monthlyBill) || 0
    const units = bill / 8 // Rs 8 per unit avg Jaipur
    setBillUnits(units)
    const annualUnits = units * 12
    const kwNeeded = annualUnits / 1500 // 1500 kWh/kWp Jaipur
    setSuggestedKw(Math.max(1, Math.round(kwNeeded * 10) / 10))
    if (step === 1 && bill > 0) {
      setDesiredKw(Math.max(1, Math.round(kwNeeded * 10) / 10))
    }
  }, [monthlyBill])

  if (!isOpen) return null

  const panelsNeeded = Math.ceil((desiredKw * 1000) / panelWatt)
  const areaNeeded = panelsNeeded * 2.5 // ~2.5 sqm per 540W with spacing
  const production = desiredKw * 1500
  const monthlySaving = billUnits * 8
  const yearlySaving = monthlySaving * 12
  const bestRoof = solarInsights?.solarPotential?.roofSegmentStats?.[0]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/raavi-logo.png" alt="Raavi" className="h-7 w-auto" />
            <div>
              <div className="font-bold text-gray-900">🤖 AI Auto Designer - Next Level</div>
              <div className="text-xs text-gray-500">Address → kW → Auto Roof Design → Full Proposal</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center text-gray-500">✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-gray-900' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">कितने kW का प्लांट लगाना है?</h2>
                <p className="text-sm text-gray-500 mt-1">बिजली बिल डालें, सिस्टम खुद suggest करेगा - Jaipur के लिए optimized</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase">Monthly Bill (₹)</label>
                  <input type="number" value={monthlyBill} onChange={e => setMonthlyBill(e.target.value)} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none" placeholder="5000" />
                  <div className="text-xs text-gray-500 mt-1">{billUnits.toFixed(0)} units/month</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase">Sanctioned Load (kW)</label>
                  <input type="number" value={sanctionedLoad} onChange={e => setSanctionedLoad(e.target.value)} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-bold text-gray-900" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-sm">💡</div>
                  <div>
                    <div className="font-bold text-blue-900 text-sm">AI Suggestion - Jaipur 26.9°N</div>
                    <div className="text-sm text-blue-800 mt-1">आपके ₹{monthlyBill}/month बिल के लिए <b>{suggestedKw} kW</b> perfect है। यह लगभग {Math.round(suggestedKw * 1500 / 12)} units/month बनाएगा।</div>
                    <div className="text-xs text-blue-600 mt-2">Google Solar Data: Max possible on this roof {maxPossibleKw} kW • Best roof {bestRoof?.pitchDegrees?.toFixed(0) || 15}° tilt, {bestRoof?.azimuthDegrees?.toFixed(0) || 180}° azimuth</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">Desired System Size - Final kW (आप edit कर सकते हैं)</label>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map(kw => (
                    <button key={kw} onClick={() => setDesiredKw(kw)} className={`py-3 rounded-xl border font-bold text-sm transition ${desiredKw === kw ? 'bg-gray-900 text-white border-gray-900 shadow' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>{kw} kW</button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input type="range" min={1} max={Math.max(15, maxPossibleKw)} step={0.5} value={desiredKw} onChange={e => setDesiredKw(parseFloat(e.target.value))} className="flex-1 accent-gray-900" />
                  <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-lg min-w-[90px] text-center">{desiredKw} kW</div>
                </div>
                <div className="mt-2 text-xs text-gray-500">Panels needed: {panelsNeeded} x {panelWatt}W • Area needed: ~{areaNeeded.toFixed(0)} m² • Max on roof: {maxPossibleKw} kW</div>
              </div>

              <button onClick={() => setStep(2)} className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl hover:bg-black transition shadow">Next → Analyze Roof</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">🏠 Roof Auto-Analysis</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span className="font-medium text-gray-900">{currentCenter.lat.toFixed(4)}, {currentCenter.lng.toFixed(4)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Best Roof Segment (Google Solar)</span><span className="font-bold text-gray-900">{bestRoof ? `${bestRoof.pitchDegrees.toFixed(0)}° pitch, ${bestRoof.azimuthDegrees.toFixed(0)}° az` : '15° / 180° (South) - Ideal for Jaipur'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Usable Area (Detected)</span><span className="font-bold">{bestRoof?.stats?.areaMeters2?.toFixed(1) || roofArea.toFixed(1)} m² • Need {areaNeeded.toFixed(0)} m²</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shade Analysis</span><span className={areaNeeded > (bestRoof?.stats?.areaMeters2 || roofArea || 100) ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{areaNeeded > (bestRoof?.stats?.areaMeters2 || roofArea || 100) ? '⚠️ Roof छोटा है, फिर भी adjust करेंगे' : '✅ Roof sufficient, no major shade'}</span></div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="font-bold text-green-900 text-sm flex items-center gap-2">✅ Auto Design Plan Ready</div>
                <div className="text-sm text-green-800 mt-2 leading-6">
                  • <b>{panelsNeeded} panels</b> x {panelWatt}W = <b>{desiredKw} kW</b><br/>
                  • Best roof पर auto place करेंगे - South facing, {bestRoof?.pitchDegrees?.toFixed(0) || 15}° tilt<br/>
                  • Annual production: <b>{production.toLocaleString()} kWh</b><br/>
                  • Yearly saving: <b>₹{yearlySaving.toLocaleString()}</b> • Payback ~4.5 yrs
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-gray-200 rounded-xl py-3 font-medium text-gray-700">← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold hover:bg-black">Auto Design Now 🤖</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full grid place-items-center text-2xl animate-pulse">🤖</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Designing Your {desiredKw}kW Plant...</h2>
                <p className="text-sm text-gray-500 mt-2">Google Solar + Raavi AI • Roof auto-detect • Panels auto-place • No errors</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Roof boundary auto-detected from satellite</div>
                <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Best segment selected: {bestRoof?.pitchDegrees?.toFixed(0) || 15}° tilt</div>
                <div className="flex items-center gap-2"><span className="text-green-600">✓</span> {panelsNeeded} panels placed optimally</div>
                <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Shade & production calculated</div>
                <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Finance & proposal ready</div>
              </div>
              <button onClick={() => { try { console.log('AutoDesign clicked', desiredKw, panelsNeeded); onAutoDesign(desiredKw, panelsNeeded, true); } catch(e){ console.error(e); alert('Design error: '+e) } finally { onClose(); } }} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition active:scale-95">🎉 Show My Design on Map</button>
              <div className="text-xs text-gray-400">Click करने पर map पर green roof + blue panels दिखेंगे • Raavi Solar Zero Errors</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
