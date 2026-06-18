import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

const cameraPresets = {
  side: {
    position: new THREE.Vector3(0, 1.35, 7.2),
    target: new THREE.Vector3(0, 0.45, 0),
  },
  top: {
    position: new THREE.Vector3(0.15, 8.5, 0.35),
    target: new THREE.Vector3(0, 0, 0),
  },
  follow: {
    position: new THREE.Vector3(-4.8, 2.25, 4.8),
    target: new THREE.Vector3(0.7, 0.55, 0),
  },
  alignment: {
    position: new THREE.Vector3(4.6, 2.65, 3.2),
    target: new THREE.Vector3(0.15, 0.55, 0),
  },
};

function CameraRig({ preset, viewKey }) {
  const { camera, gl } = useThree();
  const controls = useRef(null);
  const isAnimating = useRef(true);
  const activePreset = cameraPresets[preset] || cameraPresets.side;

  useEffect(() => {
    const instance = new ThreeOrbitControls(camera, gl.domElement);
    instance.enableDamping = true;
    instance.dampingFactor = 0.065;
    instance.rotateSpeed = 0.55;
    instance.zoomSpeed = 0.68;
    instance.panSpeed = 0.72;
    instance.enablePan = true;
    instance.screenSpacePanning = true;
    instance.minDistance = 2.4;
    instance.maxDistance = 12;
    instance.maxPolarAngle = Math.PI * 0.52;
    instance.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    instance.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.current = instance;

    return () => {
      instance.dispose();
      controls.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    isAnimating.current = true;
  }, [preset, viewKey]);

  useFrame(() => {
    if (!controls.current) return;

    if (isAnimating.current) {
      camera.position.lerp(activePreset.position, 0.055);
      controls.current.target.lerp(activePreset.target, 0.06);

      if (
        camera.position.distanceTo(activePreset.position) < 0.035 &&
        controls.current.target.distanceTo(activePreset.target) < 0.035
      ) {
        isAnimating.current = false;
      }
    }

    controls.current.update();
  });

  return null;
}

function WaterPlane() {
  const gridRef = useRef(null);
  const waveRef = useRef(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (gridRef.current) gridRef.current.position.z = (elapsed * 0.12) % 1;
    if (waveRef.current) waveRef.current.material.opacity = 0.12 + Math.sin(elapsed * 0.7) * 0.025;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <planeGeometry args={[28, 20, 1, 1]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.78} />
      </mesh>
      <gridHelper ref={gridRef} args={[28, 56, '#0ea5e9', '#0f172a']} position={[0, -0.52, 0]} />
      <mesh ref={waveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <ringGeometry args={[1.7, 1.73, 96]} />
        <meshBasicMaterial color="#00f2fe" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SwimmerRig({ preset }) {
  const group = useRef(null);
  const lineColor = preset === 'alignment' ? '#e0f2fe' : '#00f2fe';
  const joints = useMemo(
    () => [
      [-1.85, 0.46, 0],
      [-1.2, 0.52, 0.03],
      [-0.45, 0.62, 0],
      [0.18, 0.56, 0.02],
      [0.92, 0.5, -0.02],
      [1.55, 0.43, 0],
    ],
    []
  );
  const leftArm = useMemo(() => [[-0.4, 0.62, 0], [-0.9, 0.24, -0.38], [-1.45, 0.2, -0.72]], []);
  const rightArm = useMemo(() => [[-0.4, 0.62, 0], [0.1, 0.28, 0.38], [0.7, 0.22, 0.7]], []);
  const kickLine = useMemo(() => [[1.35, 0.44, 0], [1.95, 0.22, -0.3], [2.45, 0.24, -0.54]], []);
  const kickLineRight = useMemo(() => [[1.35, 0.44, 0], [1.92, 0.72, 0.28], [2.38, 0.66, 0.46]], []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const elapsed = clock.getElapsedTime();
    group.current.position.y = Math.sin(elapsed * 1.2) * 0.035;
    group.current.rotation.z = Math.sin(elapsed * 0.65) * 0.035;
  });

  return (
    <group ref={group}>
      <SceneLine points={joints} color={lineColor} opacity={0.88} />
      <SceneLine points={leftArm} color="#38bdf8" opacity={0.58} />
      <SceneLine points={rightArm} color="#38bdf8" opacity={0.58} />
      <SceneLine points={kickLine} color="#67e8f9" opacity={0.52} />
      <SceneLine points={kickLineRight} color="#67e8f9" opacity={0.52} />
      {[...joints, leftArm[2], rightArm[2], kickLine[2], kickLineRight[2]].map((point, index) => (
        <mesh key={`${point.join('-')}-${index}`} position={point}>
          <sphereGeometry args={[index < joints.length ? 0.052 : 0.04, 16, 16]} />
          <meshStandardMaterial color={index < joints.length ? '#e0f2fe' : '#00f2fe'} emissive="#0891b2" emissiveIntensity={0.45} />
        </mesh>
      ))}
      <mesh position={[-2.05, 0.48, 0]} scale={[0.34, 0.2, 0.2]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#dbeafe" emissive="#075985" emissiveIntensity={0.2} transparent opacity={0.9} />
      </mesh>
      <SceneLine
        points={[[-2.35, 0.48, -0.85], [2.65, 0.48, -0.85]]}
        color="#00f2fe"
        opacity={0.32}
      />
    </group>
  );
}

const SceneLine = React.forwardRef(function SceneLine({ points, color, opacity = 1 }, ref) {
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
  }, [points]);

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial attach="material" color={color} transparent opacity={opacity} />
    </line>
  );
});

function TelemetryPath() {
  const points = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => {
        const t = index / 95;
        return [
          -4.8 + t * 9.6,
          -0.2 + Math.sin(t * Math.PI * 4) * 0.08,
          -1.25 + Math.sin(t * Math.PI * 2) * 0.32,
        ];
      }),
    []
  );

  return (
    <SceneLine
      points={points}
      color="#00f2fe"
      opacity={0.75}
    />
  );
}

export default function SwimTelemetryScene({ cameraPreset, viewKey }) {
  return (
    <div className="absolute inset-0 h-screen w-screen" style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 1.35, 7.2], fov: 45, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
        }}
        style={{ display: 'block', width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 7, 19]} />
        <ambientLight intensity={0.42} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} color="#e0f2fe" />
        <pointLight position={[-3, 1.2, 3]} intensity={2.2} color="#00f2fe" distance={8} />
        <WaterPlane />
        <SwimmerRig preset={cameraPreset} />
        <TelemetryPath />
        <CameraRig preset={cameraPreset} viewKey={viewKey} />
      </Canvas>
    </div>
  );
}
