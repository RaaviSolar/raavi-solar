// Production-grade solar calculations for Jaipur & India
export interface SystemInputs {
  panelCount: number
  panelWatt: number
  tilt: number
  azimuth: number
  shadingLoss: number // %
  roofArea: number
  costPerKw: number
  subsidy: number
  hasBattery: boolean
  batteryKwh?: number
}

export function calculateProduction(inputs: SystemInputs, locationLat = 26.9124) {
  // Jaipur: GHI ~5.8 kWh/m2/day, 300 sunny days
  // Specific yield with tilt/azimuth loss model
  const baseYield = 1650 // kWh/kWp ideal Jaipur
  const tiltLoss = Math.abs(inputs.tilt - 20) * 6 // 20° optimal for Jaipur lat
  const azimuthLoss = Math.abs(inputs.azimuth - 180) * 1.2 // South facing 180 is best
  const soilingLoss = 3 // %
  const inverterLoss = 2
  const tempLoss = 6 // high temp in Raj
  const wiringLoss = 2

  const effectiveYield = baseYield - tiltLoss - azimuthLoss
  const systemKw = (inputs.panelCount * inputs.panelWatt) / 1000
  const derate = (1 - inputs.shadingLoss / 100) * (1 - soilingLoss / 100) * (1 - inverterLoss / 100) * (1 - tempLoss / 100) * (1 - wiringLoss / 100) * 0.92

  const annualKwh = systemKw * effectiveYield * derate

  // Monthly split for Rajasthan
  const monthlyFactors = [0.78, 0.88, 1.05, 1.12, 1.15, 1.05, 0.82, 0.80, 0.92, 1.02, 0.88, 0.78]
  const monthly = monthlyFactors.map(f => (annualKwh / 12) * f)

  return {
    systemKw,
    specificYield: effectiveYield * derate,
    annualKwh,
    monthly,
    prRatio: derate * 100,
    co2Avoided: annualKwh * 0.82, // kg
    treesEquivalent: Math.round(annualKwh * 0.82 / 20)
  }
}

export function calculateFinance(systemKw: number, annualKwh: number, costPerKw: number, subsidy: number, hasBattery: boolean, downPerc = 20, interest = 10, tariff = 8) {
  const batteryCost = hasBattery ? 65000 : 0
  const gross = systemKw * costPerKw + batteryCost
  const net = Math.max(0, gross - subsidy)
  const yearlySaving = annualKwh * tariff
  const payback = yearlySaving > 0 ? net / yearlySaving : 0
  const loan = net * (1 - downPerc / 100)
  const monthlyRate = interest / 100 / 12
  const n = 60
  const emi = loan > 0 ? (loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : 0
  const twentyFiveYearSaving = yearlySaving * 25 - net

  return { gross, net, yearlySaving, payback, loan, emi, twentyFiveYearSaving }
}

// Google Solar API response types
export interface SolarBuildingInsights {
  name: string
  center: { latitude: number, longitude: number }
  imageryDate: { year: number, month: number, day: number }
  imageryProcessedDate: { year: number, month: number, day: number }
  solarPotential: {
    maxArrayPanelsCount: number
    maxArrayAreaMeters2: number
    maxSunshineHoursPerYear: number
    carbonOffsetFactorKgPerMwh: number
    wholeRoofStats: { areaMeters2: number, sunshineQuantiles: number[] }
    roofSegmentStats: { pitchDegrees: number, azimuthDegrees: number, stats: { areaMeters2: number, sunshineQuantiles: number[] }, center: { latitude: number, longitude: number } }[]
  }
  imageryQuality: string
}
