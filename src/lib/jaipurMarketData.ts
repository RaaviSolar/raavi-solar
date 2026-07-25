// Jaipur Rajasthan Solar Market - Component Database 2026
// Raavi Solar internal vendor price list - DCR vs Non-DCR
// Source: DesiDime leak, Bluebird Solar, Heaven Green, TradeIndia Jaipur vendors, RRECL JVVNL

export type PanelCategory = 'DCR-PERC-Bi' | 'DCR-TOPCon' | 'NDCR-PERC-Bi' | 'NDCR-TOPCon'

export interface PanelSKU {
  sku: string
  category: PanelCategory
  watt: number
  type: string
  dcr: boolean
  brands: string[]
  cellTech: string
  efficiency: string
  pricePerWattRetail: { min: number, max: number, avg: number } // Jaipur retail incl GST
  pricePerPanelRetail: { min: number, max: number, avg: number }
  pricePerWattEmpanelled: { min: number, max: number } // JVVNL empanelled loot
  warrantyProduct: number
  warrantyLinear: string
  bestFor: string
}

export const JAIPUR_PANELS: PanelSKU[] = [
  {
    sku: 'DCR-PERC-540-Bi',
    category: 'DCR-PERC-Bi',
    watt: 540,
    type: 'DCR Mono PERC Bifacial Half-Cut',
    dcr: true,
    brands: ['Waaree Bi-55-540', 'Adani Shine 540', 'Vikram Somera 540', 'Saatvik 540', 'Goldi 540', 'Premier Energies 540', 'Tata Power 540'],
    cellTech: 'Mono PERC, 144 half-cut, bifacial',
    efficiency: '20.3-20.8%',
    pricePerWattRetail: { min: 30, max: 34, avg: 33 },
    pricePerPanelRetail: { min: 16200, max: 18360, avg: 17820 },
    pricePerWattEmpanelled: { min: 38, max: 42 },
    warrantyProduct: 12,
    warrantyLinear: '27yr 85%',
    bestFor: 'Subsidy residential 1-10kW, JVVNL net metering'
  },
  {
    sku: 'DCR-TOPCON-580',
    category: 'DCR-TOPCon',
    watt: 580,
    type: 'DCR TOPCon N-Type Bifacial',
    dcr: true,
    brands: ['Waaree TOPCon 580', 'Adani TOPCon 580', 'RenewSys TOPCon 580', 'Emmvee 580', 'Saatvik TOPCon'],
    cellTech: 'TOPCon N-Type, 144 cells, bifacial',
    efficiency: '21.2-22.1%',
    pricePerWattRetail: { min: 32, max: 38, avg: 35 },
    pricePerPanelRetail: { min: 18560, max: 22040, avg: 20300 },
    pricePerWattEmpanelled: { min: 40, max: 45 },
    warrantyProduct: 12,
    warrantyLinear: '30yr 87.4%',
    bestFor: 'Premium DCR, 15% more yield, future-proof 2026 trend'
  },
  {
    sku: 'NDCR-PERC-550-Bi',
    category: 'NDCR-PERC-Bi',
    watt: 550,
    type: 'Non-DCR Mono PERC Bifacial',
    dcr: false,
    brands: ['Longi Hi-MO 5m 550', 'JA Solar DeepBlue 550', 'Trina Vertex S+ 550', 'Canadian Solar 550', 'Waaree Non-DCR 550'],
    cellTech: 'Mono PERC, Chinese cell, India assemble',
    efficiency: '20.7-21.2%',
    pricePerWattRetail: { min: 18, max: 24, avg: 20 },
    pricePerPanelRetail: { min: 9900, max: 13200, avg: 11000 },
    pricePerWattEmpanelled: { min: 20, max: 24 },
    warrantyProduct: 12,
    warrantyLinear: '25yr 80%',
    bestFor: 'Commercial no subsidy, off-grid, cheapest gross'
  },
  {
    sku: 'NDCR-TOPCON-590',
    category: 'NDCR-TOPCon',
    watt: 590,
    type: 'Non-DCR TOPCon N-Type',
    dcr: false,
    brands: ['Longi Hi-MO 6 590', 'JA Solar DeepBlue 4.0 590', 'Trina Vertex S+ 590', 'Trina Vertex N 590'],
    cellTech: 'TOPCon N-Type 16BB, high efficiency',
    efficiency: '22.0-23.2%',
    pricePerWattRetail: { min: 20, max: 26, avg: 22 },
    pricePerPanelRetail: { min: 11800, max: 15340, avg: 12980 },
    pricePerWattEmpanelled: { min: 22, max: 26 },
    warrantyProduct: 15,
    warrantyLinear: '30yr 87.4%',
    bestFor: 'C&I highest efficiency, best LCOE no subsidy'
  },
]

export interface InverterSKU {
  sku: string
  capacityKw: number
  phase: '1-Ph' | '3-Ph'
  models: { brand: string, model: string, priceJaipur: number, warranty: string }[]
  avgPrice: number
  type: string
}

export const JAIPUR_INVERTERS: InverterSKU[] = [
  {
    sku: 'INV-3KW-1PH',
    capacityKw: 3,
    phase: '1-Ph',
    type: 'On-Grid String',
    avgPrice: 18500,
    models: [
      { brand: 'Growatt', model: 'MIN 3000-XH / 3300TL-X', priceJaipur: 17000, warranty: '5yr' },
      { brand: 'GoodWe', model: 'GW3000-NS', priceJaipur: 20000, warranty: '5yr' },
      { brand: 'Solis', model: 'S6 3kW', priceJaipur: 19000, warranty: '5yr' },
      { brand: 'K-Solare', model: '5G PRO 3kW (Indiamart Jaipur)', priceJaipur: 18502, warranty: '5yr' },
      { brand: 'Luminous', model: '3kW On-Grid', priceJaipur: 17500, warranty: '5yr' },
      { brand: 'Havells', model: 'Enviro 3kW', priceJaipur: 22000, warranty: '7yr' },
    ]
  },
  {
    sku: 'INV-5KW-1PH',
    capacityKw: 5,
    phase: '1-Ph',
    type: 'On-Grid',
    avgPrice: 40000,
    models: [
      { brand: 'Growatt', model: 'MIN 5000', priceJaipur: 38000, warranty: '5yr' },
      { brand: 'Havells', model: '5kW 1Ph', priceJaipur: 45000, warranty: '8yr' },
      { brand: 'Solis', model: '5kW', priceJaipur: 42000, warranty: '5yr' },
    ]
  },
  {
    sku: 'INV-10KW-3PH',
    capacityKw: 10,
    phase: '3-Ph',
    type: 'On-Grid 3Ph Dual MPPT',
    avgPrice: 58000,
    models: [
      { brand: 'Havells', model: '10kW 3Ph (TradeIndia Jaipur)', priceJaipur: 77500, warranty: '10yr (MRP 86800)' },
      { brand: 'Growatt', model: 'MID 10KTL3-X / MTL 10kW', priceJaipur: 56000, warranty: '5yr' },
      { brand: 'Solis', model: '10kW 3Ph S5', priceJaipur: 55000, warranty: '5yr' },
      { brand: 'VSOLE', model: '1-10kW (Jaipur Indiamart)', priceJaipur: 45000, warranty: '5yr' },
      { brand: 'Sungrow', model: 'SG10KTL', priceJaipur: 60000, warranty: '10yr' },
    ]
  }
]

export interface StructureSKU {
  type: 'Low-Rise' | 'Mid-Rise' | 'High-Rise' | 'Tin-Shed'
  height: string
  costPerKw: { min: number, max: number, avg: number }
  cost3kW: { min: number, max: number }
  cost5kW: { min: number, max: number }
  spec: string
  bestFor: string
}

export const JAIPUR_STRUCTURES: StructureSKU[] = [
  { type: 'Low-Rise', height: '300mm (1ft)', costPerKw: { min: 5000, max: 8000, avg: 6000 }, cost3kW: { min: 15000, max: 22000 }, cost5kW: { min: 25000, max: 35000 }, spec: 'GI HDG 80 micron, 2.5mm', bestFor: 'Flat RCC, no shadow' },
  { type: 'Mid-Rise', height: '600mm (2ft)', costPerKw: { min: 6000, max: 9500, avg: 7500 }, cost3kW: { min: 18000, max: 28000 }, cost5kW: { min: 30000, max: 42000 }, spec: 'GI HDG 80 micron', bestFor: 'Avoid parapet shadow' },
  { type: 'High-Rise', height: '1000-1200mm (3-4ft)', costPerKw: { min: 7000, max: 13000, avg: 10000 }, cost3kW: { min: 20000, max: 40000 }, cost5kW: { min: 35000, max: 55000 }, spec: 'GI 80 micron heavy', bestFor: 'Dust avoid, use terrace below - Jaipur dusty' },
  { type: 'Tin-Shed', height: 'Trapezoidal', costPerKw: { min: 6000, max: 9000, avg: 7000 }, cost3kW: { min: 18000, max: 27000 }, cost5kW: { min: 30000, max: 45000 }, spec: 'Alu clamp + GI', bestFor: 'Factory shed industrial' },
]

export interface BOSItem {
  component: string
  spec: string
  qty3kW: string
  brand: string
  priceJaipur: string
  total3kW: string
}

export const JAIPUR_BOS_3KW: BOSItem[] = [
  { component: 'ACDB', spec: '1Ph 32A 1kV SPD', qty3kW: '1', brand: 'Waaree/Havells/Hensel', priceJaipur: '₹3,500-5,500', total3kW: '₹4,500' },
  { component: 'DCDB', spec: '2 string 1000V fuse+SPD', qty3kW: '1', brand: 'Waaree/Havells', priceJaipur: '₹4,000-6,000', total3kW: '₹5,000' },
  { component: 'DC Cable 4sqmm', spec: 'TUV 2-core RED+BLACK 1kV', qty3kW: '40m (20R+20B)', brand: 'Polycab/KEI', priceJaipur: '₹42-60/m', total3kW: '₹2,000' },
  { component: 'AC Cable 2.5sqmm', spec: '3-core', qty3kW: '20m', brand: 'Polycab', priceJaipur: '₹38-55/m', total3kW: '₹900' },
  { component: 'Earthing Wire', spec: '16sqmm Green + GI strip', qty3kW: '80m', brand: 'Local', priceJaipur: '₹90-125/m', total3kW: '₹9,000' },
  { component: 'MC4 Connectors', spec: 'TUV M+F pair', qty3kW: '6-8 pair', brand: 'Staubli/Elmex', priceJaipur: '₹60-120/pair', total3kW: '₹800' },
  { component: 'Earthings Chemical', spec: '40kg maintenance free + 50mm GI rod', qty3kW: '3 nos (Solar+AC+LA)', brand: 'JMV/Ashlok', priceJaipur: '₹3,000-4,500 each', total3kW: '₹10,500' },
  { component: 'Lightning Arrestor', spec: 'Copper 4ft Franklin / ESE tall', qty3kW: '1', brand: 'JMV', priceJaipur: '₹1,800-3,500 (ESE 8-12k)', total3kW: '₹2,500' },
  { component: 'Net Meter', spec: 'JVVNL approved Secure/Genus + box + Discom fees', qty3kW: '1', brand: 'Secure/Genus/HPL', priceJaipur: 'Meter ₹5.5-7.5k + Box ₹1.5-2.5k + Discom ₹2-4k', total3kW: '₹8,000' },
  { component: 'Civil + Installation', spec: 'Anchor, grouting, electrician 2 days', qty3kW: 'Lot', brand: 'Local', priceJaipur: '₹5k-8k/kW low-rise', total3kW: '₹10,000' },
]

export const JAIPUR_SUBSIDY = {
  '1kW': { grossMin: 75000, grossMax: 85000, subsidy: 30000, netMin: 45000, netMax: 55000 },
  '2kW': { grossMin: 150000, grossMax: 170000, subsidy: 60000, netMin: 90000, netMax: 110000 },
  '3kW': { grossMin: 190000, grossMax: 220000, subsidy: 78000, netMin: 112000, netMax: 142000 },
  '5kW': { grossMin: 320000, grossMax: 360000, subsidy: 78000, netMin: 242000, netMax: 282000 },
  '10kW': { grossMin: 550000, grossMax: 630000, subsidy: 78000, netMin: 472000, netMax: 552000 },
}

export const JVVNL_VENDORS_SAMPLE = [
  { name: 'Saanvi Solar Energy', address: '93 Chhatrasal Nagar Maviya, Jaipur', phone: '9413056699' },
  { name: 'SRK Solenergi', address: 'E-2, Panch Batti, M.I.Road, Jaipur', phone: '9829576756' },
  { name: 'Nysa Solar Radiance LLP', address: '50/56 Raja Path Mansarovar, Jaipur', phone: '7976831996' },
  { name: 'KMBG Infra LLP', address: '104-74 Vijaypath Mansarovar, Jaipur', phone: '9414004044' },
  { name: 'Sun Front Energy Pvt Ltd', address: '531 Electronic Market, Gopalpura Bypass, Jaipur', phone: '9929655514' },
]

export function calculateJaipurQuote(kw: number, panelSku: string, structureType: string, isDCR: boolean) {
  const panel = JAIPUR_PANELS.find(p => p.sku === panelSku) || JAIPUR_PANELS[0]
  const panelsNeeded = Math.ceil((kw * 1000) / panel.watt)
  const panelCost = panelsNeeded * panel.pricePerPanelRetail.avg
  const inverter = JAIPUR_INVERTERS.find(inv => inv.capacityKw >= kw) || JAIPUR_INVERTERS[0]
  const inverterCost = inverter.avgPrice
  const struct = JAIPUR_STRUCTURES.find(s => s.type === structureType) || JAIPUR_STRUCTURES[0]
  const structureCost = kw * struct.costPerKw.avg
  const bosCost = kw * 17000 // avg BOS per kW Jaipur for 3kW system ~52k/3=17k
  const gross = panelCost + inverterCost + structureCost + bosCost
  const subsidyKey = kw <= 1 ? '1kW' : kw <= 2 ? '2kW' : kw <= 3 ? '3kW' : kw <= 5 ? '5kW' : '10kW'
  const subsidyInfo = JAIPUR_SUBSIDY[subsidyKey as keyof typeof JAIPUR_SUBSIDY]
  const subsidy = isDCR && panel.dcr ? subsidyInfo.subsidy : 0
  const net = gross - subsidy
  return { panelsNeeded, panelCost, inverterCost, structureCost, bosCost, gross, subsidy, net, panel, inverter, struct }
}
