import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

/** Tracks normalized (-1..1) pointer position across the whole window, since the
 * canvas itself is pointer-events:none (clicks must pass through to the UI below). */
function usePointerRef() {
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])
  return pointer
}

function GlassOrb({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const targetX = pointer.current.y * 0.3
    const targetY = pointer.current.x * 0.4 + state.clock.elapsedTime * 0.12
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.04
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.04
  })

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[0, 0, -1.4]}>
        <mesh>
          <icosahedronGeometry args={[0.85, 4]} />
          <MeshDistortMaterial
            color="#38bdf8"
            attach="material"
            distort={0.3}
            speed={1.8}
            roughness={0.1}
            metalness={0.2}
            transparent
            opacity={0.2}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.89, 1]} />
          <meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.12} />
        </mesh>
      </Float>
      <Sparkles count={35} scale={2.6} size={1.6} speed={0.3} color="#c4b5fd" opacity={0.45} />
    </group>
  )
}

function SceneLights(props: ThreeElements['ambientLight']) {
  return (
    <>
      <ambientLight intensity={0.7} {...props} />
      <pointLight position={[5, 5, 5]} intensity={30} color="#38bdf8" />
      <pointLight position={[-5, -3, -5]} intensity={20} color="#a78bfa" />
    </>
  )
}

export function ThreeCanvas() {
  const pointer = usePointerRef()

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ maskImage: 'radial-gradient(closest-side, black 55%, transparent 100%)' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <GlassOrb pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  )
}
