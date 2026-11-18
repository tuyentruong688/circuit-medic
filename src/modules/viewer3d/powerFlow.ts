import * as THREE from 'three';
import { FaultCase, HardwareBoard, PowerRailNet } from '../../types/circuit';
import { ResourceTracker } from './disposal';
import { createParticleGlowTexture } from './textures';

interface TracePath {
  netId: string;
  netName: string;
  color: THREE.Color;
  speed: number;
  points: THREE.Vector3[];
  cumulativeLengths: number[];
  totalLength: number;
  lineMaterial: THREE.LineBasicMaterial;
  particlesPerWire: number;
}

export interface PowerFlowSystem {
  group: THREE.Group;
  update: (
    dt: number,
    elapsed: number,
    selectedNetId: string | null,
    activeFault: FaultCase | null,
    showFlow: boolean
  ) => void;
}

function getSpeedForRailCategory(cat: PowerRailNet['category'] | undefined): number {
  switch (cat) {
    case 'high_voltage':
      return 0.55;
    case 'core_power':
      return 0.72;
    case 'main_power':
      return 0.58;
    case 'standby':
      return 0.36;
    case 'control_signal':
      return 0.45;
    case 'ground':
      return 0.25;
    default:
      return 0.48;
  }
}

function samplePolyline(
  points: THREE.Vector3[],
  cumLengths: number[],
  totalLen: number,
  tNormalized: number,
  out: THREE.Vector3
): THREE.Vector3 {
  if (points.length === 0) return out.set(0, 0, 0);
  if (points.length === 1 || totalLen <= 0.0001) return out.copy(points[0]);

  const targetDist = (((tNormalized % 1) + 1) % 1) * totalLen;
  for (let i = 0; i < cumLengths.length - 1; i++) {
    const d0 = cumLengths[i];
    const d1 = cumLengths[i + 1];
    if (targetDist >= d0 && targetDist <= d1) {
      const segLen = d1 - d0;
      const alpha = segLen > 0.0001 ? (targetDist - d0) / segLen : 0;
      out.copy(points[i]).lerp(points[i + 1], alpha);
      return out;
    }
  }
  return out.copy(points[points.length - 1]);
}

/**
 * Builds the 3D PCB trace lines and animated GPU particle flow system
 * along `board.wires`, colored by each wire's `PowerRailNet.color`.
 */
export function createPowerFlowSystem(
  board: HardwareBoard,
  pcbTopY: number,
  tracker: ResourceTracker
): PowerFlowSystem {
  const group = new THREE.Group();
  const compMap = new Map(board.components.map((c) => [c.id, c]));
  const railMap = new Map(board.rails.map((r) => [r.id, r]));

  const traceY = pcbTopY + 0.16;
  const traces: TracePath[] = [];

  board.wires.forEach((wire, idx) => {
    const fromC = compMap.get(wire.fromComponentId);
    const toC = compMap.get(wire.toComponentId);
    if (!fromC || !toC) return;

    const rail = railMap.get(wire.netId);
    const color = new THREE.Color(rail?.color || '#38bdf8');
    const offset = ((idx % 5) - 2) * 0.45;

    const pStart = new THREE.Vector3(
      fromC.pos3d.x + offset * 0.3,
      traceY,
      fromC.pos3d.z + offset * 0.3
    );
    const pEnd = new THREE.Vector3(
      toC.pos3d.x + offset * 0.3,
      traceY,
      toC.pos3d.z + offset * 0.3
    );

    // Build clean orthogonal PCB trace route
    const midX = (pStart.x + pEnd.x) * 0.5 + offset * 0.6;
    const pts = [
      pStart,
      new THREE.Vector3(midX, traceY, pStart.z),
      new THREE.Vector3(midX, traceY, pEnd.z),
      pEnd,
    ];

    const cumLengths: number[] = [0];
    let totalLength = 0;
    for (let i = 1; i < pts.length; i++) {
      totalLength += pts[i].distanceTo(pts[i - 1]);
      cumLengths.push(totalLength);
    }

    const lineGeo = tracker.trackGeometry(new THREE.BufferGeometry().setFromPoints(pts));
    const lineMat = tracker.trackMaterial(
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      })
    );
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    const particlesPerWire = Math.max(3, Math.min(8, Math.round(totalLength / 6)));
    traces.push({
      netId: wire.netId,
      netName: rail?.name ?? wire.netId,
      color,
      speed: getSpeedForRailCategory(rail?.category),
      points: pts,
      cumulativeLengths: cumLengths,
      totalLength,
      lineMaterial: lineMat,
      particlesPerWire,
    });
  });

  // Single merged THREE.Points buffer for ultra-smooth 60fps particle updates
  const totalParticles = traces.reduce((acc, t) => acc + t.particlesPerWire, 0);
  const positions = new Float32Array(Math.max(1, totalParticles) * 3);
  const colors = new Float32Array(Math.max(1, totalParticles) * 3);

  const particleGeo = tracker.trackGeometry(new THREE.BufferGeometry());
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const glowTex = createParticleGlowTexture(tracker);
  const particleMat = tracker.trackMaterial(
    new THREE.PointsMaterial({
      size: 1.65,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const pointsMesh = new THREE.Points(particleGeo, particleMat);
  pointsMesh.frustumCulled = false;
  group.add(pointsMesh);

  const tmpPos = new THREE.Vector3();
  const tmpColor = new THREE.Color();

  const update = (
    _dt: number,
    elapsed: number,
    selectedNetId: string | null,
    activeFault: FaultCase | null,
    showFlow: boolean
  ) => {
    pointsMesh.visible = showFlow && totalParticles > 0;
    if (totalParticles === 0) return;

    const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = particleGeo.getAttribute('color') as THREE.BufferAttribute;

    let pIdx = 0;
    for (let tIdx = 0; tIdx < traces.length; tIdx++) {
      const trace = traces[tIdx];
      const isSelectedNet =
        selectedNetId !== null &&
        (trace.netId === selectedNetId || trace.netName === selectedNetId);
      const isDimmed = selectedNetId !== null && !isSelectedNet;
      const isFaultRail =
        activeFault !== null &&
        (activeFault.affectedRails.includes(trace.netId) ||
          activeFault.affectedRails.includes(trace.netName));

      // Update trace line brightness
      trace.lineMaterial.opacity = isSelectedNet
        ? 0.95
        : isDimmed
        ? 0.12
        : isFaultRail
        ? 0.72 + Math.sin(elapsed * 6) * 0.2
        : 0.5;

      const brightness = isSelectedNet ? 1.45 : isDimmed ? 0.15 : 1.05;
      tmpColor.copy(trace.color);
      if (isFaultRail && !isSelectedNet) {
        // Subtle fault amber-red pulse blend
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 7);
        tmpColor.lerp(new THREE.Color('#ef4444'), pulse * 0.55);
      }
      tmpColor.multiplyScalar(brightness);

      const speedMul = isSelectedNet ? 1.55 : isDimmed ? 0.4 : 1.0;

      for (let k = 0; k < trace.particlesPerWire; k++) {
        const phase = k / trace.particlesPerWire + (tIdx % 7) * 0.13;
        const t = phase + elapsed * trace.speed * speedMul;
        samplePolyline(trace.points, trace.cumulativeLengths, trace.totalLength, t, tmpPos);

        if (!showFlow || isDimmed) {
          // Keep dimmed particles faint but still moving cleanly
          posAttr.setXYZ(pIdx, tmpPos.x, tmpPos.y + 0.25, tmpPos.z);
        } else {
          posAttr.setXYZ(pIdx, tmpPos.x, tmpPos.y + 0.28, tmpPos.z);
        }
        colAttr.setXYZ(pIdx, tmpColor.r, tmpColor.g, tmpColor.b);
        pIdx++;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  };

  return { group, update };
}
