'use client'
import dynamic from 'next/dynamic'

const SolarDesigner = dynamic(() => import('@/components/SolarDesigner'), { ssr: false, loading: () => <div className="h-screen bg-[#0f1115] text-white grid place-items-center">Loading SolarDesign Pro... Jaipur Solar Design loading ☀️</div> })

export default function Page(){
  return <SolarDesigner />
}
