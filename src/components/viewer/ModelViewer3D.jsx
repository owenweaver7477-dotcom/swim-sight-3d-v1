import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, AlertCircle, Loader2 } from 'lucide-react';
import * as THREE from 'three';

// Minimal Three.js GLTFLoader inline (avoids import issues)
// Uses basic OrbitControls via mouse events
function useThreeViewer(containerRef, modelUrl) {
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);
  const modelRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!modelUrl || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1f2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Orbit controls via mouse
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { theta: 0, phi: Math.PI / 3, radius: 3 };

    function updateCamera() {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.5, 0);
    }
    updateCamera();

    const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - prevMouse.x) * 0.005;
      const dy = (e.clientY - prevMouse.y) * 0.005;
      spherical.theta -= dx;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onWheel = (e) => {
      spherical.radius = Math.max(0.5, Math.min(20, spherical.radius + e.deltaY * 0.01));
      updateCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    // Load GLTF
    setStatus('loading');

    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          // Auto-scale
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) model.scale.setScalar(2 / maxDim);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center.multiplyScalar(2 / maxDim));
          scene.add(model);
          modelRef.current = model;
          setStatus('loaded');
        },
        undefined,
        (err) => {
          setErrorMsg('Model could not be loaded. Check file URL, CORS, file type and model export.');
          setStatus('error');
        }
      );
    }).catch(() => {
      setErrorMsg('3D loader module could not be initialized.');
      setStatus('error');
    });

    // Animate
    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      if (modelRef.current && !isDragging) {
        modelRef.current.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    }
    animate();
    animFrameRef.current = frameId;

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelUrl]);

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1, 3);
      cameraRef.current.lookAt(0, 0.5, 0);
    }
  };

  return { status, errorMsg, resetView };
}

export default function ModelViewer3D({ assetUrl, fileName }) {
  const containerRef = useRef(null);
  const { status, errorMsg, resetView } = useThreeViewer(containerRef, assetUrl);

  if (!assetUrl) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#1a1f2e]">
      {status === 'error' ? (
        <div className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <div className="text-sm font-medium text-destructive mb-1">3D Model Failed to Load</div>
          <div className="text-xs text-muted-foreground max-w-xs mx-auto">{errorMsg}</div>
        </div>
      ) : (
        <div className="relative">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#1a1f2e]/80">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground ml-2">Loading 3D model...</span>
            </div>
          )}
          <div ref={containerRef} className="w-full h-72" />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Button size="icon" variant="secondary" className="h-7 w-7 opacity-70 hover:opacity-100" onClick={resetView} title="Reset view">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
          {fileName && (
            <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-black/50 px-2 py-1 rounded">
              {fileName}
            </div>
          )}
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-black/50 px-2 py-1 rounded">
            Drag to rotate · Scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}