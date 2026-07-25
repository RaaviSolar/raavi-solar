import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '100'
  const key = process.env.GOOGLE_SOLAR_API_KEY

  if (!lat || !lng) return NextResponse.json({ error: 'lat lng required' }, { status: 400 })

  if (!key) {
    return NextResponse.json({
      mocked: true,
      message: 'Add GOOGLE_SOLAR_API_KEY for real DSM/RGB/Flux imagery',
      center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
      imageryQuality: 'HIGH',
      // In production you'd return URLs for tiff download of DSM, RGB, Mask, Flux, Shade
      dsmUrl: null,
      rgbUrl: null,
      fluxUrl: null
    })
  }

  try {
    const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=${radius}&view=FULL_LAYERS&requiredQuality=HIGH&key=${key}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (!resp.ok) return NextResponse.json({ error: data }, { status: resp.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
