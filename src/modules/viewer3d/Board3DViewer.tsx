import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity,
  AlertTriangle,
  Box,
  Compass,
  Eye,
  Flame,
  Layers,
  Maximize2,
  RotateCcw,
  Tag,
  Zap,
} from 'lucide-react';
import { BoardComponent, ModuleSharedProps } from '../../types/circuit';
import { buildComponent3D, ComponentBuildResult } from './componentModels';
import { ResourceTracker } from './disposal';
import { createPowerFlowSystem } from './powerFlow';
import { createPcbTextures } from './textures';
import {
  getComponentTemperature,
  tempToCssColor,
  tempToFlirColor,
} from './thermalPalette';

interface HoverTooltipState {
  component: BoardComponent;
  x: number;
  y: number;
  tempC: number;
  isHotspot: boolean;
}

type CameraPreset = 'iso' | 'top' | 'low';

interface CameraFlight {
  active: boolean;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  progress: number;
}

export const Board3DViewer: React.FC<ModuleSharedProps> = ({
  selectedBoard,
  selectedComponentId,
  onSelectComponent,
  selectedNetId,
  onSelectNet,
  activeFault,
  thermalMode,
  onToggleThermalMode,
  onNavigateMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Interactive 3D HUD states
  const [explodedPct, setExplodedPct] = useState<number>(0);
  const [showPowerFlow, setShowPowerFlow] = useState<boolean>(true);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredTooltip, setHoveredTooltip] = useState<HoverTooltipState | null>(null);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);

  // Refs for 60fps loop access without recreating WebGL scene
  const livePropsRef = useRef({
    selectedComponentId,
    selectedNetId,
    activeFault,
    thermalMode,
    explodedPct,
    showPowerFlow,
    xrayMode,
    showLabels,
  });
  livePropsRef.current = {
    selectedComponentId,
    selectedNetId,
    activeFault,
    thermalMode,
    explodedPct,
    showPowerFlow,
    xrayMode,
    showLabels,
  };

  const callbacksRef = useRef({ onSelectComponent });
  callbacksRef.current = { onSelectComponent };

  // Imperative handles for camera presets & external fly-to
  const cameraApiRef = useRef<{
    flyToPreset: (preset: CameraPreset) => void;
    flyToComponent: (compId: string) => void;
  } | null>(null);

  const railIdToName = useMemo(
    () => new Map(selectedBoard.rails.map((r) => [r.id, r.name])),
    [selectedBoard.rails]
  );

  const selectedComponent = useMemo(
    () =>
      selectedBoard.components.find((c) => c.id === selectedComponentId) ?? null,
    [selectedBoard.components, selectedComponentId]
  );

  // Top 4 thermal hotspots for quick HUD click in Thermal Mode
  const thermalHotspots = useMemo(() => {
    return selectedBoard.components
      .map((comp) => ({
        comp,
        ...getComponentTemperature(comp, activeFault, railIdToName),
      }))
      .sort((a, b) => b.tempC - a.tempC)
      .slice(0, 4);
  }, [selectedBoard.components, activeFault, railIdToName]);

  // Trigger camera fly-to whenever selectedComponentId changes (e.g. cross-probed from Schematic)
  useEffect(() => {
    if (selectedComponentId && cameraApiRef.current) {
      cameraApiRef.current.flyToComponent(selectedComponentId);
    }
  }, [selectedComponentId]);

  // Main Three.js scene lifecycle (rebuilds only when selectedBoard changes)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWebglError(null);
    setHoveredTooltip(null);

    const tracker = new ResourceTracker();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(
        'Trình duyệt hoặc GPU hiện tại không khởi tạo được WebGL 3D. Vui lòng bật tăng tốc phần cứng (Hardware Acceleration).'
      );
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060b16');
    scene.fog = new THREE.FogExp2('#060b16', 0.0028);

    const boardW = selectedBoard.pcbSize.width;
    const boardD = selectedBoard.pcbSize.depth;
    const boardH = selectedBoard.pcbSize.thickness;
    const pcbTopY = boardH / 2;
    const maxDim = Math.max(boardW, boardD);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 600);
    const defaultIsoPos = new THREE.Vector3(0, maxDim * 0.78, maxDim * 0.96);
    camera.position.copy(defaultIsoPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minDistance = 12;
    controls.maxDistance = maxDim * 2.4;
    controls.target.set(0, 1, 0);
    controls.update();

    // Engineering Lab 3-Point Lighting
    const hemiLight = new THREE.HemisphereLight(0xcbe8ff, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
    keyLight.position.set(maxDim * 0.55, maxDim * 0.95, maxDim * 0.45);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = maxDim * 3;
    const dShadow = maxDim * 0.75;
    keyLight.shadow.camera.left = -dShadow;
    keyLight.shadow.camera.right = dShadow;
    keyLight.shadow.camera.top = dShadow;
    keyLight.shadow.camera.bottom = -dShadow;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-maxDim * 0.7, maxDim * 0.45, -maxDim * 0.65);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xf59e0b, 0.45, maxDim * 2.5);
    warmFill.position.set(maxDim * 0.4, 24, -maxDim * 0.4);
    scene.add(warmFill);

    // Subtle dark workbench grid floor
    const gridHelper = new THREE.GridHelper(maxDim * 2.8, 40, 0x1e3a5f, 0x0f1d32);
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);

    // Exploded layer groups
    const layerStandoffs = new THREE.Group();
    const layerPcb = new THREE.Group();
    const layerCopper = new THREE.Group();
    const layerSmd = new THREE.Group();
    const layerTall = new THREE.Group();
    scene.add(layerStandoffs, layerPcb, layerCopper, layerSmd, layerTall);

    // 1. Brass Standoffs (Layer 0)
    const standoffMat = tracker.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xd4a64a,
        metalness: 0.88,
        roughness: 0.28,
      })
    );
    const standoffGeo = tracker.trackGeometry(
      new THREE.CylinderGeometry(1.1, 1.1, 3.2, 6)
    );
    const padX = boardW * 0.45;
    const padZ = boardD * 0.44;
    const standoffCoords: Array<[number, number]> = [
      [-padX, -padZ],
      [padX, -padZ],
      [-padX, padZ],
      [padX, padZ],
      [0, -padZ],
      [0, padZ],
    ];
    standoffCoords.forEach(([sx, sz]) => {
      const m = new THREE.Mesh(standoffGeo, standoffMat);
      m.position.set(sx, -boardH / 2 - 1.6, sz);
      m.castShadow = true;
      layerStandoffs.add(m);
    });

    // 2. Multi-Layer FR4 PCB Substrate (Layer 1)
    const { surfaceTexture, copperTexture } = createPcbTextures(
      selectedBoard,
      tracker
    );
    const pcbEdgeMat = tracker.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(selectedBoard.pcbColor || '#0f281a').multiplyScalar(0.85),
        roughness: 0.55,
        metalness: 0.15,
        transparent: true,
        opacity: 1,
      })
    );
    const pcbTopMat = tracker.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: surfaceTexture,
        roughness: 0.36,
        metalness: 0.18,
        transparent: true,
        opacity: 1,
      })
    );
    const pcbTopBaseColor = pcbTopMat.color.clone();

    const pcbMesh = new THREE.Mesh(
      tracker.trackGeometry(new THREE.BoxGeometry(boardW, boardH, boardD)),
      [pcbEdgeMat, pcbEdgeMat, pcbTopMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat]
    );
    pcbMesh.receiveShadow = true;
    pcbMesh.castShadow = true;
    layerPcb.add(pcbMesh);

    // 3. Dedicated Copper Etch Plate + Live Particle Flow (Layer 2)
    const copperPlateMat = tracker.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: copperTexture,
        transparent: true,
        opacity: 0.25,
        roughness: 0.28,
        metalness: 0.85,
        depthWrite: false,
      })
    );
    const copperPlate = new THREE.Mesh(
      tracker.trackGeometry(new THREE.PlaneGeometry(boardW, boardD)),
      copperPlateMat
    );
    copperPlate.rotation.x = -Math.PI / 2;
    copperPlate.position.y = pcbTopY + 0.04;
    layerCopper.add(copperPlate);

    const powerFlow = createPowerFlowSystem(selectedBoard, pcbTopY, tracker);
    layerCopper.add(powerFlow.group);

    // Zone highlight overlays (subtle tinted frames on PCB)
    const zoneOverlays: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }> = [];
    selectedBoard.zones.forEach((zone) => {
      const zw = (zone.bounds2d.w / 100) * boardW;
      const zd = (zone.bounds2d.h / 100) * boardD;
      const zx = (zone.bounds2d.x / 100 - 0.5) * boardW + zw / 2;
      const zz = (zone.bounds2d.y / 100 - 0.5) * boardD + zd / 2;
      const zMat = tracker.trackMaterial(
        new THREE.MeshBasicMaterial({
          color: zone.color || '#38bdf8',
          transparent: true,
          opacity: 0.04,
          depthWrite: false,
        })
      );
      const zMesh = new THREE.Mesh(
        tracker.trackGeometry(new THREE.PlaneGeometry(zw, zd)),
        zMat
      );
      zMesh.rotation.x = -Math.PI / 2;
      zMesh.position.set(zx, pcbTopY + 0.05, zz);
      layerCopper.add(zMesh);
      zoneOverlays.push({ mesh: zMesh, mat: zMat });
    });

    // 4. Build Procedural 3D Components (Layers 3 & 4)
    const builtComponents: ComponentBuildResult[] = [];
    const hitboxes: THREE.Mesh[] = [];
    const compBuildMap = new Map<string, ComponentBuildResult>();

    selectedBoard.components.forEach((comp) => {
      const isSuspect =
        livePropsRef.current.activeFault?.suspectComponentIds.includes(comp.id) ??
        false;
      const built = buildComponent3D(comp, pcbTopY, isSuspect, tracker);
      builtComponents.push(built);
      hitboxes.push(built.hitboxMesh);
      compBuildMap.set(comp.id, built);
      if (built.layerCategory === 'smd') {
        layerSmd.add(built.group);
      } else {
        layerTall.add(built.group);
      }
    });

    // Smooth camera flight state
    const flight: CameraFlight = {
      active: false,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
      progress: 0,
    };

    const startFlight = (targetPos: THREE.Vector3, camPos: THREE.Vector3) => {
      flight.startPos.copy(camera.position);
      flight.endPos.copy(camPos);
      flight.startTarget.copy(controls.target);
      flight.endTarget.copy(targetPos);
      flight.progress = 0;
      flight.active = true;
    };

    cameraApiRef.current = {
      flyToPreset: (preset: CameraPreset) => {
        const target = new THREE.Vector3(0, 1, 0);
        if (preset === 'top') {
          startFlight(target, new THREE.Vector3(0, maxDim * 1.15, 0.01));
        } else if (preset === 'low') {
          startFlight(target, new THREE.Vector3(maxDim * 0.42, maxDim * 0.25, maxDim * 0.78));
        } else {
          startFlight(target, defaultIsoPos.clone());
        }
      },
      flyToComponent: (compId: string) => {
        const built = compBuildMap.get(compId);
        if (!built) return;
        const cPos = new THREE.Vector3();
        built.group.getWorldPosition(cPos);
        const span = Math.max(built.component.pos3d.w, built.component.pos3d.d, 5);
        const dist = Math.max(22, span * 2.6);
        const camOffset = new THREE.Vector3(dist * 0.55, dist * 0.72, dist * 0.82);
        startFlight(cPos.clone().add(new THREE.Vector3(0, 1.2, 0)), cPos.clone().add(camOffset));
      },
    };

    // Cancel automatic camera flight if user manually grabs OrbitControls
    const onControlStart = () => {
      flight.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // Raycasting & Pointer Interactions
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownXY = { x: 0, y: 0 };
    let hoveredId: string | null = null;

    const railLookup = new Map(selectedBoard.rails.map((r) => [r.id, r.name]));

    const updateTooltipFromEvent = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(hitboxes, false);
      if (hits.length > 0) {
        const compId = hits[0].object.userData.componentId as string;
        const built = compBuildMap.get(compId);
        if (built) {
          hoveredId = compId;
          renderer.domElement.style.cursor = 'pointer';
          const { tempC, isHotspot } = getComponentTemperature(
            built.component,
            livePropsRef.current.activeFault,
            railLookup
          );
          setHoveredTooltip({
            component: built.component,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            tempC,
            isHotspot,
          });
          return;
        }
      }
      hoveredId = null;
      renderer.domElement.style.cursor = 'grab';
      setHoveredTooltip(null);
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownXY = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownXY.x,
        e.clientY - pointerDownXY.y
      );
      if (dist > 6) return; // Was an orbit drag, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(hitboxes, false);
      if (hits.length > 0) {
        const compId = hits[0].object.userData.componentId as string;
        callbacksRef.current.onSelectComponent(compId);
      } else {
        callbacksRef.current.onSelectComponent(null);
      }
    };

    const onPointerLeave = () => {
      hoveredId = null;
      setHoveredTooltip(null);
    };

    renderer.domElement.addEventListener('pointermove', updateTooltipFromEvent);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // ResizeObserver for crisp layout in both full-screen & workbench split-view
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cw = Math.max(entry.contentRect.width, 200);
        const ch = Math.max(entry.contentRect.height, 200);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        renderer.setSize(cw, ch);
      }
    });
    resizeObserver.observe(container);

    // 60fps Animation Loop
    let rafId = 0;
    let prevTime = performance.now();
    let fpsCounter = 0;
    let fpsTimer = 0;
    let thermalBlend = livePropsRef.current.thermalMode ? 1 : 0;
    let smoothExplode = livePropsRef.current.explodedPct / 100;
    const tmpFlir = new THREE.Color();
    const coolPcbThermal = new THREE.Color('#0c1045');

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const elapsed = now / 1000;

      // FPS counter
      fpsCounter++;
      fpsTimer += dt;
      if (fpsTimer >= 0.75) {
        setFpsDisplay(Math.round(fpsCounter / fpsTimer));
        fpsCounter = 0;
        fpsTimer = 0;
      }

      const props = livePropsRef.current;

      // Smooth Exploded Layer View along Y axis
      const targetExplode = props.explodedPct / 100;
      smoothExplode += (targetExplode - smoothExplode) * Math.min(1, dt * 10);
      layerStandoffs.position.y = -smoothExplode * 5.5;
      layerPcb.position.y = -smoothExplode * 1.4;
      layerCopper.position.y = smoothExplode * 3.4;
      layerSmd.position.y = smoothExplode * 7.8;
      layerTall.position.y = smoothExplode * 13.5;

      // X-Ray mode PCB translucency & copper visibility
      const targetPcbOpacity = props.xrayMode ? 0.24 : 1.0;
      pcbTopMat.opacity += (targetPcbOpacity - pcbTopMat.opacity) * Math.min(1, dt * 10);
      pcbEdgeMat.opacity = pcbTopMat.opacity;
      const targetCopperOpacity = props.xrayMode
        ? 0.92
        : smoothExplode > 0.05
        ? 0.78
        : 0.16;
      copperPlateMat.opacity +=
        (targetCopperOpacity - copperPlateMat.opacity) * Math.min(1, dt * 10);

      zoneOverlays.forEach((zo) => {
        zo.mat.opacity = props.xrayMode ? 0.16 : 0.04;
      });

      // Thermal Camera / IR Heatmap smooth transition
      const targetThermal = props.thermalMode ? 1 : 0;
      thermalBlend += (targetThermal - thermalBlend) * Math.min(1, dt * 8);

      pcbTopMat.color.copy(pcbTopBaseColor).lerp(coolPcbThermal, thermalBlend * 0.85);

      // Update Power Flow Particles
      powerFlow.update(
        dt,
        elapsed,
        props.selectedNetId,
        props.activeFault,
        props.showPowerFlow
      );

      // Update every component's selection, hover, thermal tint, label, & fault beacon
      for (let i = 0; i < builtComponents.length; i++) {
        const item = builtComponents[i];
        const comp = item.component;
        const isSelected = props.selectedComponentId === comp.id;
        const isHovered = hoveredId === comp.id;
        const isSuspect =
          props.activeFault?.suspectComponentIds.includes(comp.id) ?? false;

        // Labels visibility
        item.labelSprite.visible =
          props.showLabels || isSelected || isHovered || isSuspect;

        // Selection / hover ring animation
        const ringMat = item.selectionRing.material as THREE.MeshStandardMaterial;
        if (isSelected) {
          ringMat.opacity = 0.88 + Math.sin(elapsed * 5) * 0.12;
          ringMat.color.setHex(0x22d3ee);
          ringMat.emissive.setHex(0x22d3ee);
          const s = 1.04 + Math.sin(elapsed * 4) * 0.05;
          item.selectionRing.scale.set(s, s, 1);
        } else if (isHovered) {
          ringMat.opacity = 0.65;
          ringMat.color.setHex(0x7dd3fc);
          ringMat.emissive.setHex(0x38bdf8);
          item.selectionRing.scale.set(1, 1, 1);
        } else {
          ringMat.opacity = 0;
        }

        // Fault beacon pulse
        item.faultBeacon.visible = isSuspect;
        if (isSuspect) {
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 6.5);
          const scalePulse = 0.96 + pulse * 0.14;
          item.faultBeacon.scale.set(scalePulse, 1, scalePulse);
        }

        // Thermal IR color interpolation
        if (thermalBlend > 0.005) {
          const { tempC, isHotspot } = getComponentTemperature(
            comp,
            props.activeFault,
            railLookup
          );
          const shimmer = isHotspot ? Math.sin(elapsed * 5 + i) * 3.5 : 0;
          tempToFlirColor(tempC + shimmer, tmpFlir);

          for (let j = 0; j < item.thermalTargets.length; j++) {
            const tgt = item.thermalTargets[j];
            tgt.material.color.copy(tgt.baseColor).lerp(tmpFlir, thermalBlend);
            tgt.material.emissive
              .copy(tgt.baseEmissive)
              .lerp(tmpFlir, thermalBlend * (isHotspot ? 0.72 : 0.28));
            tgt.material.emissiveIntensity =
              tgt.baseEmissiveIntensity +
              thermalBlend * (isHotspot ? 0.95 : 0.22);
          }
        } else {
          for (let j = 0; j < item.thermalTargets.length; j++) {
            const tgt = item.thermalTargets[j];
            tgt.material.color.copy(tgt.baseColor);
            tgt.material.emissive.copy(tgt.baseEmissive);
            tgt.material.emissiveIntensity = tgt.baseEmissiveIntensity;
          }
        }
      }

      // Smooth Camera Fly-To interpolation
      if (flight.active) {
        flight.progress = Math.min(1, flight.progress + dt * 2.1);
        const ease = 1 - Math.pow(1 - flight.progress, 3); // Cubic ease-out
        camera.position.lerpVectors(flight.startPos, flight.endPos, ease);
        controls.target.lerpVectors(flight.startTarget, flight.endTarget, ease);
        if (flight.progress >= 1) {
          flight.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      renderer.domElement.removeEventListener('pointermove', updateTooltipFromEvent);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      tracker.disposeAll();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      cameraApiRef.current = null;
    };
  }, [selectedBoard]);

  const firstPinVoltage = selectedComponent?.pins[0]?.expectedVoltage;

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/20 select-none">
      {/* Three.js WebGL Mount Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Graceful WebGL Fallback */}
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 p-6 text-center z-40">
          <div className="max-w-md rounded-xl border border-amber-500/40 bg-slate-900/90 p-5 text-slate-200">
            <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-amber-300 mb-1">
              Không thể khởi tạo 3D WebGL
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{webglError}</p>
          </div>
        </div>
      )}

      {/* Top-Left HUD: Board & Fault Status */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none max-w-[340px]">
        <div className="pointer-events-auto rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-cyan-300 uppercase">
              {selectedBoard.category === 'motherboard'
                ? 'Mainboard PC 3D'
                : 'Nguồn ATX 3D'}
            </span>
            <span className="ml-auto text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              {fpsDisplay} FPS
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-100 truncate mt-0.5">
            {selectedBoard.name}
          </div>
          <div className="text-[11px] text-slate-400">
            {selectedBoard.brand} • {selectedBoard.formFactor} •{' '}
            {selectedBoard.components.length} linh kiện
          </div>
        </div>

        {activeFault && (
          <div className="pointer-events-auto rounded-lg bg-rose-950/85 backdrop-blur-md border border-rose-500/50 px-3 py-2 shadow-lg">
            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Đang mô phỏng lỗi: {activeFault.title}</span>
            </div>
            <div className="text-[11px] text-rose-200/80 mt-1 flex flex-wrap gap-1">
              <span>Nghi ngờ:</span>
              {activeFault.suspectComponentIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onSelectComponent(id)}
                  className="px-1.5 py-0.5 rounded bg-rose-500/25 hover:bg-rose-500/45 border border-rose-400/40 text-rose-100 font-mono text-[10px] transition"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top-Right HUD: Camera Presets & Visualization Modes */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        {/* Camera Preset Bar */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1 shadow-lg">
          <button
            onClick={() => cameraApiRef.current?.flyToPreset('iso')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            title="Góc nhìn tổng quan Isometric"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tổng Quan</span>
          </button>
          <button
            onClick={() => cameraApiRef.current?.flyToPreset('top')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            title="Nhìn thẳng từ trên xuống (BoardView 3D)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Từ Trên</span>
          </button>
          <button
            onClick={() => cameraApiRef.current?.flyToPreset('low')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            title="Góc thấp ngắm linh kiện"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Góc Thấp</span>
          </button>
          <button
            onClick={() => {
              onSelectComponent(null);
              cameraApiRef.current?.flyToPreset('iso');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:bg-slate-700/70 transition"
            title="Đặt lại góc camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visualization Mode Toggles */}
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            onClick={() => setShowPowerFlow((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition shadow ${
              showPowerFlow
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dòng Điện 3D</span>
          </button>

          <button
            onClick={onToggleThermalMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition shadow ${
              thermalMode
                ? 'bg-orange-500/25 border-orange-400/70 text-orange-200'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Camera Nhiệt IR</span>
          </button>

          <button
            onClick={() => setXrayMode((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition shadow ${
              xrayMode
                ? 'bg-violet-500/25 border-violet-400/70 text-violet-200'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>X-Quang PCB</span>
          </button>

          <button
            onClick={() => setShowLabels((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition shadow ${
              showLabels
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Nhãn</span>
          </button>
        </div>
      </div>

      {/* Bottom-Left HUD: Exploded Layer View Slider + Selected Component Quick Card */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-2 max-w-[320px]">
        {selectedComponent && (
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 p-3 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {selectedComponent.id}
                  </span>
                  {selectedComponent.partNumber && (
                    <span className="text-[11px] font-mono text-slate-300">
                      {selectedComponent.partNumber}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-100 mt-1">
                  {selectedComponent.label}
                </div>
              </div>
              <button
                onClick={() => onSelectComponent(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800"
              >
                Đóng
              </button>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
              <span>Khu vực: {selectedComponent.zone}</span>
              {firstPinVoltage && (
                <span className="text-emerald-300 font-mono">
                  Áp: {firstPinVoltage}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                onClick={() => onNavigateMode('schematic')}
                className="flex-1 text-[11px] font-medium px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 transition"
              >
                Sơ Đồ Nguyên Lý
              </button>
              <button
                onClick={() => onNavigateMode('boardview')}
                className="flex-1 text-[11px] font-medium px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition"
              >
                BoardView Đo Đạc
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tách Lớp PCB</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300">
              {explodedPct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={explodedPct}
            onChange={(e) => setExplodedPct(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <button
              onClick={() => setExplodedPct(0)}
              className="hover:text-cyan-300 transition"
            >
              Gắn khít (0%)
            </button>
            <button
              onClick={() => setExplodedPct(65)}
              className="hover:text-cyan-300 transition"
            >
              Tách chuẩn (65%)
            </button>
            <button
              onClick={() => setExplodedPct(100)}
              className="hover:text-cyan-300 transition"
            >
              Toàn phần (100%)
            </button>
          </div>
        </div>
      </div>

      {/* Bottom-Right HUD: Thermal Legend OR Interactive Power Rail Filter */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2 max-w-[360px]">
        {thermalMode && (
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-md border border-orange-500/40 px-3 py-2.5 shadow-lg w-full">
            <div className="flex items-center justify-between text-[11px] font-semibold text-orange-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Ảnh Nhiệt FLIR IR (°C)
              </span>
              <span className="font-mono text-slate-300">24°C — 115°C+</span>
            </div>
            <div
              className="h-2.5 w-full rounded-full border border-slate-700"
              style={{
                background:
                  'linear-gradient(90deg, #0a0b3c 0%, #420a7e 22%, #a61b66 44%, #ef5612 66%, #ffbe1f 85%, #fffee6 100%)',
              }}
            />
            <div className="mt-2 flex flex-wrap gap-1 justify-end">
              {thermalHotspots.map(({ comp, tempC }) => (
                <button
                  key={comp.id}
                  onClick={() => onSelectComponent(comp.id)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tempToCssColor(tempC) }}
                  />
                  <span>{comp.id}</span>
                  <span className="text-orange-300">{tempC}°C</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Power Rail Filter Chips */}
        <div className="rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-2.5 py-2 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Lọc Đường Nguồn 3D
            </span>
            {selectedNetId && (
              <button
                onClick={() => onSelectNet(null)}
                className="text-[10px] text-cyan-300 hover:underline"
              >
                Hiện tất cả
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 justify-end max-w-[330px]">
            {selectedBoard.rails.slice(0, 8).map((rail) => {
              const active = selectedNetId === rail.id;
              return (
                <button
                  key={rail.id}
                  onClick={() => onSelectNet(active ? null : rail.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border transition ${
                    active
                      ? 'bg-slate-800 text-white border-white/60 shadow'
                      : 'bg-slate-950/70 text-slate-300 border-slate-700/70 hover:border-slate-500'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: rail.color }}
                  />
                  <span>{rail.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Vietnamese Hover Raycast Tooltip */}
      {hoveredTooltip && (
        <div
          className="pointer-events-none absolute z-30 w-64 rounded-lg bg-slate-950/95 border border-cyan-400/50 p-2.5 shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(
              hoveredTooltip.x + 16,
              (containerRef.current?.clientWidth ?? 600) - 270
            ),
            top: Math.max(12, hoveredTooltip.y - 24),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-cyan-300">
              {hoveredTooltip.component.id}
            </span>
            <span
              className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${tempToCssColor(hoveredTooltip.tempC)}33`,
                color: hoveredTooltip.isHotspot ? '#fca5a5' : '#fde68a',
              }}
            >
              {hoveredTooltip.tempC}°C
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100 mt-0.5">
            {hoveredTooltip.component.label}
          </div>
          {hoveredTooltip.component.partNumber && (
            <div className="text-[11px] font-mono text-slate-400">
              Mã LK: {hoveredTooltip.component.partNumber}
            </div>
          )}
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 space-y-0.5">
            <div>Khu vực: {hoveredTooltip.component.zone}</div>
            {hoveredTooltip.component.pins[0] && (
              <div>
                Áp chuẩn ({hoveredTooltip.component.pins[0].name}):{' '}
                <span className="font-mono text-emerald-300">
                  {hoveredTooltip.component.pins[0].expectedVoltage}
                </span>
              </div>
            )}
            <div className="text-slate-400">
              Nhiệt độ chuẩn:{' '}
              <span className="font-mono text-slate-200">
                {hoveredTooltip.component.normalTempC ?? 40}°C
              </span>
              {hoveredTooltip.component.faultTempC && (
                <>
                  {' '}
                  • Khi lỗi:{' '}
                  <span className="font-mono text-rose-400">
                    {hoveredTooltip.component.faultTempC}°C
                  </span>
                </>
              )}
            </div>
            {activeFault?.suspectComponentIds.includes(
              hoveredTooltip.component.id
            ) && (
              <div className="mt-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 rounded px-1.5 py-0.5">
                CẢNH BÁO: Linh kiện nghi ngờ gây lỗi!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
