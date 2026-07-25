import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const key = process.env.GOOGLE_SOLAR_API_KEY

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat lng required' }, { status: 400 })
  }

  if (!key) {
    // Mock response for Jaipur when no API key - useful for demo
    return NextResponse.json({
      mocked: true,
      name: `projects/solar-api-123/buildingInsights/mock_${lat}_${lng}`,
      center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
      imageryDate: { year: 2024, month: 6, day: 15 },
      imageryQuality: 'HIGH',
      solarPotential: {
        maxArrayPanelsCount: 28,
        maxArrayAreaMeters2: 52.5,
        maxSunshineHoursPerYear: 1720,
        carbonOffsetFactorKgPerMwh: 438.2,
        wholeRoofStats: { areaMeters2: 120, sunshineQuantiles: [80, 140, 170] },
        roofSegmentStats: [
          { pitchDegrees: 15, azimuthDegrees: 180, stats: { areaMeters2: 65, sunshineQuantiles: [120, 165, 190] }, center: { latitude: parseFloat(lat), longitude: parseFloat(lng) } },
          { pitchDegrees: 5, azimuthDegrees: 90, stats: { areaMeters2: 30, sunshineQuantiles: [80, 120, 150] }, center: { latitude: parseFloat(lat) + 0.0001, longitude: parseFloat(lng) } }
        ],
        financialAnalyses: []
      },
      message: 'Add GOOGLE_SOLAR_API_KEY in .env to get real Google data. This is mocked data for Jaipur region.'
    })
  }

  try {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${key}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (!resp.ok) return NextResponse.json({ error: data }, { status: resp.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
