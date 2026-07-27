import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dragonState } from "./dragonState";

type Props = { updateShared?: boolean };

/**
 * Procedural cinematic dragon. A Catmull-Rom curve is re-sampled every frame to
 * place ~22 body spheres, a head, horns, glowing eyes, flapping wings, a tail
 * chain, and trailing embers. When `updateShared` is true the head's screen
 * position and a "peek" 0..1 pulse are written to dragonState so the second
 * canvas + clip layer can react in lockstep.
 */
export default function DragonScene({ updateShared = false }: Props) {
  const { camera, size } = useThree();

  const bodyCount = 22;
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const embersRef = useRef<THREE.Points>(null);

  const bodyDummy = useMemo(() => new THREE.Object3D(), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const tmpV2 = useMemo(() => new THREE.Vector3(), []);
  const projV = useMemo(() => new THREE.Vector3(), []);

  // Ember particles state
  const emberCount = 90;
  const emberData = useMemo(() => {
    const pos = new Float32Array(emberCount * 3);
    const life = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) life[i] = Math.random();
    return { pos, life };
  }, []);

  const emberGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(emberData.pos, 3));
    return g;
  }, [emberData]);

  // Dragon path: layered lissajous around origin, drifting on Z for depth swaps.
  const pathPoint = (u: number, t: number, out: THREE.Vector3) => {
    // u ∈ [0,1] param along body from head to tail
    // t = time seconds
    const phase = t * 0.18 - u * 0.55;
    const x = Math.sin(phase * 1.3) * 5.2 + Math.sin(phase * 0.7 + 1.1) * 1.8;
    const y = Math.sin(phase * 0.9 + 0.4) * 2.4 + Math.cos(phase * 1.7) * 0.7 - u * 0.15;
    const z = Math.sin(phase * 0.6 + 2.1) * 3.2 + Math.cos(phase * 1.1) * 1.4;
    out.set(x, y, z);
    return out;
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    dragonState.t = t;

    // ---- Body chain along the path ----
    if (bodyRef.current) {
      for (let i = 0; i < bodyCount; i++) {
        const u = i / (bodyCount - 1);
        pathPoint(u, t, tmpV);
        // Tangent for orientation
        pathPoint(u + 0.01, t, tmpV2);
        bodyDummy.position.copy(tmpV);
        bodyDummy.lookAt(tmpV2);
        // Taper: fat in shoulders, thin at head/tail
        const taper = Math.sin(Math.PI * (0.15 + u * 0.85));
        const s = 0.22 + taper * 0.55 - u * 0.15;
        bodyDummy.scale.setScalar(Math.max(0.08, s));
        bodyDummy.updateMatrix();
        bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
      }
      bodyRef.current.instanceMatrix.needsUpdate = true;
    }

    // ---- Head ----
    pathPoint(0, t, tmpV);
    pathPoint(0.02, t, tmpV2);
    if (headRef.current) {
      headRef.current.position.copy(tmpV);
      // Look slightly toward pointer for life
      const lookTarget = tmpV2.clone();
      lookTarget.x += dragonState.pointerX * 0.8;
      lookTarget.y -= dragonState.pointerY * 0.8;
      headRef.current.lookAt(lookTarget);
      // Breathe
      const breathe = 1 + Math.sin(t * 1.3) * 0.03;
      headRef.current.scale.setScalar(breathe);
    }

    // ---- Wings (attached near shoulder ~ u=0.18) ----
    pathPoint(0.18, t, tmpV);
    pathPoint(0.2, t, tmpV2);
    const flap = Math.sin(t * 3.2);
    if (leftWing.current) {
      leftWing.current.position.copy(tmpV);
      leftWing.current.lookAt(tmpV2);
      leftWing.current.rotateZ(Math.PI / 2);
      leftWing.current.rotateX(flap * 0.9 - 0.2);
    }
    if (rightWing.current) {
      rightWing.current.position.copy(tmpV);
      rightWing.current.lookAt(tmpV2);
      rightWing.current.rotateZ(-Math.PI / 2);
      rightWing.current.rotateX(flap * 0.9 - 0.2);
    }

    // ---- Embers trail ----
    if (embersRef.current) {
      const arr = emberData.pos;
      for (let i = 0; i < emberCount; i++) {
        emberData.life[i] -= delta * 0.4;
        if (emberData.life[i] <= 0) {
          // Respawn near head
          const u = Math.random() * 0.25;
          pathPoint(u, t, tmpV);
          arr[i * 3] = tmpV.x + (Math.random() - 0.5) * 0.4;
          arr[i * 3 + 1] = tmpV.y + (Math.random() - 0.5) * 0.4;
          arr[i * 3 + 2] = tmpV.z + (Math.random() - 0.5) * 0.4;
          emberData.life[i] = 0.6 + Math.random() * 0.8;
        } else {
          arr[i * 3 + 1] += delta * 0.25;
          arr[i * 3] += Math.sin(t * 2 + i) * delta * 0.05;
        }
      }
      embersRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // ---- Sync shared state (only from one canvas) ----
    if (updateShared) {
      pathPoint(0, t, tmpV);
      projV.copy(tmpV).project(camera);
      dragonState.headX = ((projV.x + 1) / 2) * size.width;
      dragonState.headY = ((-projV.y + 1) / 2) * size.height;

      // Peek pulse: rises when head Z is close to camera (in front)
      const zNorm = THREE.MathUtils.clamp((tmpV.z + 3) / 6, 0, 1);
      // pulse also with slow sine so peeks are episodic
      const episodic = Math.max(0, Math.sin(t * 0.35) - 0.3) / 0.7;
      dragonState.peek = zNorm * episodic;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#eaf0fb", 8, 26]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-4, -2, 4]} intensity={0.6} color="#bcd6ff" />

      {/* Body chain */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, bodyCount]} castShadow>
        <sphereGeometry args={[1, 20, 20]} />
        <meshPhysicalMaterial
          color="#fbfaf6"
          metalness={0.35}
          roughness={0.35}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          sheen={0.5}
          sheenColor="#e8d9ff"
          emissive="#fff6f0"
          emissiveIntensity={0.06}
        />
      </instancedMesh>

      {/* Head */}
      <group ref={headRef}>
        <mesh>
          <sphereGeometry args={[0.42, 28, 28]} />
          <meshPhysicalMaterial
            color="#fbfaf6"
            metalness={0.35}
            roughness={0.3}
            clearcoat={0.8}
            sheen={0.6}
            sheenColor="#f0e4ff"
          />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.08, 0.35]}>
          <coneGeometry args={[0.24, 0.5, 20]} />
          <meshPhysicalMaterial color="#fbfaf6" metalness={0.3} roughness={0.35} />
        </mesh>
        {/* Horns */}
        <mesh position={[0.18, 0.28, -0.05]} rotation={[-0.2, 0, 0.3]}>
          <coneGeometry args={[0.06, 0.5, 12]} />
          <meshStandardMaterial color="#d8cfc0" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-0.18, 0.28, -0.05]} rotation={[-0.2, 0, -0.3]}>
          <coneGeometry args={[0.06, 0.5, 12]} />
          <meshStandardMaterial color="#d8cfc0" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.16, 0.06, 0.28]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#ff2a1a" />
        </mesh>
        <mesh position={[-0.16, 0.06, 0.28]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#ff2a1a" />
        </mesh>
        <pointLight position={[0, 0.06, 0.35]} intensity={0.8} distance={2.5} color="#ff2a1a" />
      </group>

      {/* Wings */}
      <mesh ref={leftWing}>
        <planeGeometry args={[2.2, 1.4, 8, 4]} />
        <meshPhysicalMaterial
          color="#f6f2ea"
          metalness={0.2}
          roughness={0.6}
          transmission={0.35}
          thickness={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={rightWing}>
        <planeGeometry args={[2.2, 1.4, 8, 4]} />
        <meshPhysicalMaterial
          color="#f6f2ea"
          metalness={0.2}
          roughness={0.6}
          transmission={0.35}
          thickness={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Embers */}
      <points ref={embersRef} geometry={emberGeom}>
        <pointsMaterial
          size={0.09}
          color="#ffb37a"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}