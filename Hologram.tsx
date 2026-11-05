 "use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sphere, Torus, Cylinder } from "@react-three/drei";

function HolographicHuman() {
  const rings = useMemo(() => [1.42, 1.62, 1.83], []);
  return (
    <group>
      <Float speed={1.25} rotationIntensity={0.1} floatIntensity={0.18}>
        {/* Stylized human bust made from procedural geometry; replace with a licensed GLB avatar for realism. */}
        <Sphere args={[0.58, 48, 48]} position={[0, 0.72, 0]} scale={[0.78, 1.05, 0.68]}>
          <MeshDistortMaterial color="#d9ad58" emissive="#8b5d18" emissiveIntensity={0.85}
            roughness={0.2} metalness={0.85} distort={0.12} speed={1.5} transparent opacity={0.62} />
        </Sphere>
        <Sphere args={[0.58, 40, 40]} position={[0, 0.72, 0]} scale={[0.78, 1.05, 0.68]}>
          <meshBasicMaterial color="#fff0c2" wireframe transparent opacity={0.42} />
        </Sphere>
        <Cylinder args={[0.22, 0.27, 0.48, 24]} position={[0, -0.12, 0]}>
          <meshStandardMaterial color="#b78332" emissive="#80551b" emissiveIntensity={0.7} transparent opacity={0.65} wireframe />
        </Cylinder>
        <Sphere args={[0.95, 48, 48]} position={[0, -0.72, 0]} scale={[1.18, 0.48, 0.52]}>
          <meshBasicMaterial color="#d9ad58" wireframe transparent opacity={0.46} />
        </Sphere>
        <Sphere args={[0.075, 16, 16]} position={[-0.24, 0.77, 0.49]}>
          <meshBasicMaterial color="#ffe5a3" />
        </Sphere>
        <Sphere args={[0.075, 16, 16]} position={[0.24, 0.77, 0.49]}>
          <meshBasicMaterial color="#ffe5a3" />
        </Sphere>
        <Torus args={[0.16, 0.012, 8, 48]} position={[0, 0.43, 0.45]} rotation={[0, 0, 0]}>
          <meshBasicMaterial color="#e6bd69" transparent opacity={0.8} />
        </Torus>
      </Float>
      {rings.map((r, i) => <Torus key={r} args={[r, 0.008 + i * 0.002, 8, 160]} rotation={[Math.PI / 2.2 + i * 0.18, 0.2, i * 0.5]}>
        <meshBasicMaterial color={i === 1 ? "#f2d28a" : "#a9782e"} transparent opacity={0.68} />
      </Torus>)}
      <pointLight color="#d9ad58" intensity={2.4} distance={5} />
    </group>
  );
}

export default function Hologram({ active }: { active: boolean }) {
  return <div className={`holo ${active ? "holo-active" : ""}`}>
    <Canvas camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 1.7]}>
      <ambientLight intensity={0.7} />
      <HolographicHuman />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.25} />
    </Canvas>
    <div className="holo-scan" />
    <span className="holo-label">J.A.R.V.I.S. HOLOGRAPHIC AVATAR</span>
  </div>;
}
