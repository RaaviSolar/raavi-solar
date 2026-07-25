'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface Props {
  roofPolygon: number[][] | null // [lng, lat]
  roofSegments?: any[] // from Google Solar API
  panels: { lat: number, lng: number, id: string }[]
  tilt: number
  azimuth: number
  onClose: () => void
}

export default function ThreeRoofViewer({ roofPolygon, roofSegments, panels, tilt, azimuth, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b0e14)
    scene.fog = new THREE.Fog(0x0b0e14, 80, 200)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(30, 35, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 5
    controls.maxDistance = 150

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(50, 80, 30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    scene.add(dirLight)
    const fill = new THREE.DirectionalLight(0x4f8cff, 0.3)
    fill.position.set(-20, 20, -20)
    scene.add(fill)

    // Ground
    const groundGeo = new THREE.PlaneGeometry(300, 300)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.9 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const grid = new THREE.GridHelper(300, 60, 0x252b38, 0x1e2533)
    scene.add(grid)

    // Helper to convert lng/lat to local XZ - use first point as origin
    let origin = roofPolygon?.[0] ? { lng: roofPolygon[0][0], lat: roofPolygon[0][1] } : { lng: 75.7873, lat: 26.9124 }
    const toXZ = (lng: number, lat: number) => {
      const mToLat = 111000
      const mToLng = 111000 * Math.cos(origin.lat * Math.PI / 180)
      return { x: (lng - origin.lng) * mToLng, z: -(lat - origin.lat) * mToLat }
    }

    // Draw roof segments from Google Solar API if available, else fallback to drawn polygon
    if (roofSegments && roofSegments.length > 0) {
      roofSegments.forEach((seg, idx) => {
        const center = seg.center ? toXZ(seg.center.longitude, seg.center.latitude) : { x: idx * 12, z: 0 }
        const area = seg.stats?.areaMeters2 || 40
        const side = Math.sqrt(area)
        const pitch = (seg.pitchDegrees || tilt) * Math.PI / 180
        const az = (seg.azimuthDegrees || azimuth) * Math.PI / 180

        // Create roof plane
        const roofGeo = new THREE.PlaneGeometry(side, side)
        const hue = idx === 0 ? 0x252b38 : idx === 1 ? 0x2a2a3a : 0x232a3a
        const roofMat = new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0xffcc00 : hue,
          roughness: 0.7,
          metalness: 0.1,
          emissive: idx === 0 ? 0x332200 : 0x000000,
          emissiveIntensity: idx === 0 ? 0.2 : 0,
          side: THREE.DoubleSide
        })
        const roofMesh = new THREE.Mesh(roofGeo, roofMat)
        roofMesh.position.set(center.x, 5 + idx * 0.1, center.z)
        // Apply pitch and azimuth
        roofMesh.rotation.x = -pitch - Math.PI / 2
        roofMesh.rotation.z = -az * 0.1 // simplified
        roofMesh.receiveShadow = true
        roofMesh.castShadow = true
        scene.add(roofMesh)

        // Label - best segment highlighted
        if (idx === 0) {
          const canvas = document.createElement('canvas')
          canvas.width = 256; canvas.height = 64
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#ffcc00'; ctx.fillRect(0, 0, 256, 64)
          ctx.fillStyle = '#000'; ctx.font = 'bold 18px Inter'; ctx.fillText(`BEST ROOF ${seg.pitchDegrees}°/${seg.azimuthDegrees}°`, 10, 36)
          const tex = new THREE.CanvasTexture(canvas)
          const spriteMat = new THREE.SpriteMaterial({ map: tex })
          const sprite = new THREE.Sprite(spriteMat)
          sprite.position.set(center.x, 10, center.z)
          sprite.scale.set(12, 3, 1)
          scene.add(sprite)
        }
      })
    } else if (roofPolygon && roofPolygon.length > 2) {
      // Fallback: extrude drawn polygon
      const shapePoints = roofPolygon.slice(0, -1).map(([lng, lat]) => {
        const { x, z } = toXZ(lng, lat)
        return new THREE.Vector2(x, z)
      })
      if (shapePoints.length >= 3) {
        const shape = new THREE.Shape(shapePoints)
        const extrudeSettings = { depth: 0.4, bevelEnabled: false }
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        geom.rotateX(Math.PI / 2)
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a3242, roughness: 0.6 })
        const mesh = new THREE.Mesh(geom, mat)
        mesh.position.y = 5
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
      }
    }

    // Panels - place on best roof
    panels.forEach((p, i) => {
      const { x, z } = toXZ(p.lng, p.lat)
      const pw = 1.13, ph = 2.27 // meters
      const panelGeo = new THREE.BoxGeometry(pw, 0.12, ph)
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x10141f,
        emissive: 0x0a2a4a,
        emissiveIntensity: 0.15,
        roughness: 0.2,
        metalness: 0.8,
      })
      const borderGeo = new THREE.EdgesGeometry(panelGeo)
      const panelMesh = new THREE.Mesh(panelGeo, panelMat)
      panelMesh.position.set(x, 6 + Math.sin(i * 0.3) * 0.05, z)
      // Apply tilt
      panelMesh.rotation.x = -tilt * Math.PI / 180
      panelMesh.rotation.y = (azimuth - 180) * Math.PI / 180 * 0.1
      panelMesh.castShadow = true
      panelMesh.receiveShadow = true
      scene.add(panelMesh)

      // Glass top
      const glassGeo = new THREE.PlaneGeometry(pw * 0.95, ph * 0.95)
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.9 })
      const glass = new THREE.Mesh(glassGeo, glassMat)
      glass.position.set(0, 0.07, 0)
      glass.rotation.x = -Math.PI / 2
      panelMesh.add(glass)

      // Cell lines
      for (let c = 1; c < 3; c++) {
        const lineGeo = new THREE.BoxGeometry(pw * 0.02, 0.02, ph * 0.95)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x0a1a2a })
        const line = new THREE.Mesh(lineGeo, lineMat)
        line.position.y = 0.08
        line.position.x = (c - 1.5) * pw * 0.3
        panelMesh.add(line)
      }
    })

    // Animation loop
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [roofPolygon, roofSegments, panels, tilt, azimuth])

  return (
    <div className="absolute inset-0 bg-[#0b0e14] z-20 flex flex-col">
      <div className="h-12 border-b border-[#252b38] flex items-center justify-between px-4 bg-[#15181f]">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold">🎥 Full 3D - Google Solar roofSegmentStats</div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ffcc00] text-black font-bold">{panels.length} panels • {roofSegments?.length || 1} roof segments</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[11px] text-[#8a93a5] hidden md:block">Drag to orbit • Scroll to zoom • Shift+Drag to pan</span>
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-[#1f242f] border border-[#252b38] text-xs">✕ Close 3D</button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
      <div className="h-10 border-t border-[#252b38] flex items-center px-4 gap-4 text-[11px] text-[#8a93a5] bg-[#15181f]">
        <span>💡 Yellow = Best roof (South facing, 15° pitch) - Auto from Google Solar API</span>
        <span className="hidden md:inline">• Panels: Mono Bifacial 540W - Jaipur 5.5 PSH</span>
      </div>
    </div>
  )
}
