import * as THREE from 'three';
import { BoardComponent, ComponentKind } from '../../types/circuit';
import { ResourceTracker } from './disposal';
import {
  createCapTopTexture,
  createChipMarkingTexture,
  createCpuPinGridTexture,
  createInductorTopTexture,
  createSilkscreenSpriteTexture,
  createTransformerTapeTexture,
} from './textures';

export interface ThermalTarget {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseEmissiveIntensity: number;
}

export interface ComponentBuildResult {
  component: BoardComponent;
  group: THREE.Group;
  layerCategory: 'smd' | 'tall';
  baseY: number;
  hitboxMesh: THREE.Mesh;
  thermalTargets: ThermalTarget[];
  selectionRing: THREE.Mesh;
  faultBeacon: THREE.Group;
  labelSprite: THREE.Sprite;
}

const TALL_KINDS = new Set<ComponentKind>([
  'capacitor_elec',
  'capacitor_solid',
  'inductor',
  'transformer',
  'cpu_socket',
  'ram_slot',
  'pcie_slot',
  'atx_24pin',
  'eps_8pin',
  'connector',
  'bridge_rectifier',
  'heatsink',
]);

function makeMat(
  tracker: ResourceTracker,
  params: THREE.MeshStandardMaterialParameters
): THREE.MeshStandardMaterial {
  return tracker.trackMaterial(new THREE.MeshStandardMaterial(params));
}

function addThermalMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.MeshStandardMaterial,
  thermalTargets: ThermalTarget[],
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  thermalTargets.push({
    mesh,
    material: mat,
    baseColor: mat.color.clone(),
    baseEmissive: mat.emissive.clone(),
    baseEmissiveIntensity: mat.emissiveIntensity,
  });

  return mesh;
}

function addStaticMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function buildComponent3D(
  comp: BoardComponent,
  pcbTopY: number,
  isFaultSuspect: boolean,
  tracker: ResourceTracker
): ComponentBuildResult {
  const w = Math.max(1.2, comp.pos3d.w);
  const d = Math.max(1.2, comp.pos3d.d);
  const h = Math.max(0.6, comp.pos3d.h);

  const group = new THREE.Group();
  const baseY = pcbTopY + (comp.pos3d.y || 0);
  group.position.set(comp.pos3d.x, baseY, comp.pos3d.z);
  group.rotation.y = comp.pos3d.rotationY ?? 0;

  const thermalTargets: ThermalTarget[] = [];

  // Shared metallic materials
  const silverMat = makeMat(tracker, {
    color: 0xd4dde8,
    metalness: 0.88,
    roughness: 0.24,
  });
  const goldMat = makeMat(tracker, {
    color: 0xf5b82e,
    metalness: 0.9,
    roughness: 0.22,
  });

  switch (comp.kind) {
    case 'cpu_socket': {
      // Dark composite socket housing
      const baseH = h * 0.48;
      const baseMat = makeMat(tracker, { color: 0x1a1f28, roughness: 0.72, metalness: 0.12 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w, baseH, d)),
        baseMat,
        thermalTargets,
        0,
        baseH / 2,
        0
      );

      // Dense gold LGA/AM4 pin grid cavity plate
      const pinTex = createCpuPinGridTexture(tracker);
      const pinPlateMat = makeMat(tracker, {
        map: pinTex,
        metalness: 0.65,
        roughness: 0.35,
      });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.PlaneGeometry(w * 0.82, d * 0.82)),
        pinPlateMat,
        thermalTargets,
        0,
        baseH + 0.03,
        0,
        -Math.PI / 2,
        0,
        0
      );

      // Stainless steel ILM retention frame (4 rails around socket)
      const frameH = h * 0.42;
      const railThick = Math.min(w, d) * 0.1;
      const frameY = baseH + frameH / 2;
      const frameMat = makeMat(tracker, { color: 0xa6b0be, metalness: 0.88, roughness: 0.28 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 1.02, frameH, railThick)),
        frameMat,
        thermalTargets,
        0,
        frameY,
        d * 0.47
      );
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 1.02, frameH, railThick)),
        frameMat,
        thermalTargets,
        0,
        frameY,
        -d * 0.47
      );
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(railThick, frameH, d * 0.86)),
        frameMat,
        thermalTargets,
        -w * 0.47,
        frameY,
        0
      );
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(railThick, frameH, d * 0.86)),
        frameMat,
        thermalTargets,
        w * 0.47,
        frameY,
        0
      );

      // Retention lever arm along the right side
      const leverMat = makeMat(tracker, { color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.CylinderGeometry(0.16, 0.16, d * 0.98, 10)),
        leverMat,
        w * 0.57,
        baseH + 0.28,
        0,
        Math.PI / 2,
        0,
        0
      );
      // Black grip tip on lever arm
      const gripMat = makeMat(tracker, { color: 0x0f172a, roughness: 0.6 });
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.SphereGeometry(0.32, 12, 12)),
        gripMat,
        w * 0.57,
        baseH + 0.28,
        d * 0.5
      );
      break;
    }

    case 'chipset':
    case 'pwm_ic':
    case 'super_io':
    case 'bios_chip':
    case 'ic': {
      const topTex = createChipMarkingTexture(comp.id, comp.partNumber, comp.kind, tracker);
      const bodyMat = makeMat(tracker, {
        color: comp.kind === 'chipset' ? 0x1a2632 : 0x14171f,
        roughness: 0.58,
        metalness: 0.18,
      });
      const topMat = makeMat(tracker, {
        map: topTex,
        roughness: 0.52,
        metalness: 0.15,
      });

      const bodyW = w * 0.82;
      const bodyD = d * 0.82;
      const bodyH = h * 0.78;

      if (comp.kind === 'chipset') {
        // BGA green/teal substrate + shiny silicon die in center
        const subMat = makeMat(tracker, { color: 0x0f4c3a, roughness: 0.45, metalness: 0.25 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w, h * 0.35, d)),
          subMat,
          thermalTargets,
          0,
          h * 0.175,
          0
        );
        const dieMat = makeMat(tracker, {
          map: topTex,
          color: 0x262e3d,
          roughness: 0.18,
          metalness: 0.72,
        });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.62, h * 0.55, d * 0.62)),
          dieMat,
          thermalTargets,
          0,
          h * 0.55,
          0
        );
      } else {
        // Multi-material epoxy body with laser-marked top face
        const matArray = [bodyMat, bodyMat, topMat, bodyMat, bodyMat, bodyMat];
        const chipMesh = new THREE.Mesh(
          tracker.trackGeometry(new THREE.BoxGeometry(bodyW, bodyH, bodyD)),
          matArray
        );
        chipMesh.position.y = bodyH / 2 + h * 0.08;
        chipMesh.castShadow = true;
        chipMesh.receiveShadow = true;
        group.add(chipMesh);
        thermalTargets.push({
          mesh: chipMesh,
          material: topMat,
          baseColor: topMat.color.clone(),
          baseEmissive: topMat.emissive.clone(),
          baseEmissiveIntensity: topMat.emissiveIntensity,
        });

        // Gull-wing metallic leads
        const leadGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.14, h * 0.22, Math.max(0.14, d * 0.06)));
        const isSoic8 = comp.kind === 'bios_chip';
        const leadsPerSide = isSoic8 ? 4 : Math.max(4, Math.min(10, Math.round(d * 1.4)));

        for (let i = 0; i < leadsPerSide; i++) {
          const t = leadsPerSide === 1 ? 0 : (i / (leadsPerSide - 1) - 0.5) * (bodyD * 0.82);
          addStaticMesh(group, leadGeo, silverMat, -bodyW / 2 - w * 0.05, h * 0.12, t);
          addStaticMesh(group, leadGeo, silverMat, bodyW / 2 + w * 0.05, h * 0.12, t);
        }

        if (!isSoic8) {
          const leadGeoZ = tracker.trackGeometry(new THREE.BoxGeometry(Math.max(0.14, w * 0.06), h * 0.22, d * 0.14));
          const leadsZ = Math.max(4, Math.min(10, Math.round(w * 1.4)));
          for (let i = 0; i < leadsZ; i++) {
            const t = leadsZ === 1 ? 0 : (i / (leadsZ - 1) - 0.5) * (bodyW * 0.82);
            addStaticMesh(group, leadGeoZ, silverMat, t, h * 0.12, -bodyD / 2 - d * 0.05);
            addStaticMesh(group, leadGeoZ, silverMat, t, h * 0.12, bodyD / 2 + d * 0.05);
          }
        }
      }
      break;
    }

    case 'mosfet':
    case 'drmos': {
      const isVerticalThroughHole = comp.kind === 'mosfet' && h > Math.max(w, d) * 0.85;
      const topTex = createChipMarkingTexture(comp.id, comp.partNumber, comp.kind, tracker);

      if (isVerticalThroughHole) {
        // Upright TO-220 / TO-247 power MOSFET (PSU PFC / LLC / SR)
        const tabMat = makeMat(tracker, { color: 0xb8c2cc, metalness: 0.88, roughness: 0.25 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.24, h * 0.72, d * 0.88)),
          tabMat,
          thermalTargets,
          -w * 0.26,
          h * 0.62,
          0
        );
        // Screw mounting hole ring at top of metal tab
        const holeMat = makeMat(tracker, { color: 0x0f172a, roughness: 0.8 });
        addStaticMesh(
          group,
          tracker.trackGeometry(new THREE.CylinderGeometry(d * 0.14, d * 0.14, w * 0.28, 14)),
          holeMat,
          -w * 0.26,
          h * 0.86,
          0,
          0,
          0,
          Math.PI / 2
        );
        // Epoxy front body
        const epoxyMat = makeMat(tracker, {
          map: topTex,
          color: 0x161922,
          roughness: 0.55,
          metalness: 0.14,
        });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.62, h * 0.52, d * 0.9)),
          epoxyMat,
          thermalTargets,
          w * 0.12,
          h * 0.52,
          0
        );
        // 3 vertical tinned leads entering PCB
        const legGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.12, h * 0.3, d * 0.1));
        [-d * 0.26, 0, d * 0.26].forEach((lz) => {
          addStaticMesh(group, legGeo, silverMat, w * 0.08, h * 0.15, lz);
        });
      } else {
        // SMD DPAK / QFN / DrMOS power stage with exposed copper thermal tab
        const tabMat = makeMat(tracker, { color: 0xd97b38, metalness: 0.88, roughness: 0.25 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.86, h * 0.3, d * 0.36)),
          tabMat,
          thermalTargets,
          0,
          h * 0.15,
          -d * 0.32
        );

        const epoxyMat = makeMat(tracker, {
          map: topTex,
          color: 0x181b22,
          roughness: 0.55,
          metalness: 0.16,
        });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.92, h * 0.78, d * 0.68)),
          epoxyMat,
          thermalTargets,
          0,
          h * 0.44,
          d * 0.05
        );

        // 3 front source/gate leads
        const leadGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.14, h * 0.2, d * 0.24));
        [-w * 0.28, 0, w * 0.28].forEach((lx) => {
          addStaticMesh(group, leadGeo, silverMat, lx, h * 0.11, d * 0.42);
        });
      }
      break;
    }

    case 'inductor': {
      const isToroid =
        comp.id.includes('PFC') ||
        comp.id.includes('GROUP') ||
        (comp.specs?.toLowerCase().includes('toroid') ?? false);

      if (isToroid) {
        // Copper-wound toroidal inductor coil (L_PFC / L_GROUP)
        const radius = Math.min(w, d) * 0.34;
        const tube = radius * 0.38;
        const coreMat = makeMat(tracker, { color: 0x2f3540, roughness: 0.6, metalness: 0.3 });
        const coreGeo = tracker.trackGeometry(new THREE.TorusGeometry(radius, tube, 14, 28));
        addThermalMesh(
          group,
          coreGeo,
          coreMat,
          thermalTargets,
          0,
          radius + tube + 0.15,
          0,
          0,
          0,
          0
        );

        // Dense enameled copper wire windings around toroid
        const wireMat = makeMat(tracker, {
          color: 0xd97324,
          metalness: 0.85,
          roughness: 0.22,
        });
        const windingGeo = tracker.trackGeometry(
          new THREE.TorusGeometry(tube * 1.15, tube * 0.18, 8, 14)
        );
        const turns = 20;
        for (let i = 0; i < turns; i++) {
          const ang = (i / turns) * Math.PI * 2;
          const wx = Math.cos(ang) * radius;
          const wy = Math.sin(ang) * radius + radius + tube + 0.15;
          const m = addThermalMesh(
            group,
            windingGeo,
            wireMat,
            thermalTargets,
            wx,
            wy,
            0,
            Math.PI / 2,
            0,
            ang
          );
          m.rotation.order = 'ZYX';
        }
      } else {
        // Ferrite cube choke with R22 / LR22 laser marking
        const chokeTex = createInductorTopTexture(comp.label || comp.id, tracker);
        const sideMat = makeMat(tracker, { color: 0x2b303a, roughness: 0.72, metalness: 0.22 });
        const topMat = makeMat(tracker, { map: chokeTex, roughness: 0.65, metalness: 0.2 });
        const cubeMesh = new THREE.Mesh(
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.94, h * 0.92, d * 0.94)),
          [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
        );
        cubeMesh.position.y = h * 0.46;
        cubeMesh.castShadow = true;
        cubeMesh.receiveShadow = true;
        group.add(cubeMesh);
        thermalTargets.push({
          mesh: cubeMesh,
          material: topMat,
          baseColor: topMat.color.clone(),
          baseEmissive: topMat.emissive.clone(),
          baseEmissiveIntensity: topMat.emissiveIntensity,
        });

        // Side solder pads
        const padGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.12, h * 0.25, d * 0.55));
        addStaticMesh(group, padGeo, silverMat, -w * 0.46, h * 0.14, 0);
        addStaticMesh(group, padGeo, silverMat, w * 0.46, h * 0.14, 0);
      }
      break;
    }

    case 'capacitor_solid':
    case 'capacitor_elec': {
      const isElec = comp.kind === 'capacitor_elec';
      const isHvBulk =
        isElec && (comp.id.includes('BULK') || comp.id.includes('HV') || h >= 5);
      const radius = Math.min(w, d) * 0.46;

      // Plastic SMD seat for solid caps
      if (!isElec) {
        const seatMat = makeMat(tracker, { color: 0x111827, roughness: 0.7 });
        addStaticMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.92, h * 0.16, d * 0.92)),
          seatMat,
          0,
          h * 0.08,
          0
        );
      }

      // Cylindrical body
      const sleeveColor = isElec ? (isHvBulk ? 0x162442 : 0x1e293b) : 0xcbd5e1;
      const bodyMat = makeMat(tracker, {
        color: sleeveColor,
        metalness: isElec ? 0.25 : 0.78,
        roughness: isElec ? 0.42 : 0.26,
      });
      const topTex = createCapTopTexture(isElec, isHvBulk, tracker);
      const topMat = makeMat(tracker, {
        map: topTex,
        metalness: 0.78,
        roughness: 0.28,
      });

      const cylH = isElec ? h * 0.95 : h * 0.84;
      const cylGeo = tracker.trackGeometry(new THREE.CylinderGeometry(radius, radius, cylH, 24));
      const cylMesh = new THREE.Mesh(cylGeo, [bodyMat, topMat, bodyMat]);
      cylMesh.position.y = isElec ? cylH / 2 : h * 0.16 + cylH / 2;
      cylMesh.castShadow = true;
      cylMesh.receiveShadow = true;
      group.add(cylMesh);
      thermalTargets.push({
        mesh: cylMesh,
        material: bodyMat,
        baseColor: bodyMat.color.clone(),
        baseEmissive: bodyMat.emissive.clone(),
        baseEmissiveIntensity: bodyMat.emissiveIntensity,
      });

      // Negative polarity vertical stripe for electrolytic capacitors
      if (isElec) {
        const stripeMat = makeMat(tracker, { color: 0xe2e8f0, roughness: 0.35 });
        addStaticMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(radius * 0.24, cylH * 0.88, radius * 0.12)),
          stripeMat,
          0,
          cylH / 2,
          radius * 0.96
        );
      }
      break;
    }

    case 'ram_slot':
    case 'pcie_slot': {
      const isPcie = comp.kind === 'pcie_slot';
      const slotMat = makeMat(tracker, {
        color: isPcie ? 0x94a3b8 : 0x1e2430,
        metalness: isPcie ? 0.78 : 0.18,
        roughness: isPcie ? 0.28 : 0.65,
      });

      const alongZ = d > w;
      const length = alongZ ? d : w;
      const thick = alongZ ? w : d;

      // Outer housing walls
      const wallThick = thick * 0.28;
      if (alongZ) {
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(wallThick, h, length * 0.92)),
          slotMat,
          thermalTargets,
          -thick * 0.34,
          h / 2,
          0
        );
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(wallThick, h, length * 0.92)),
          slotMat,
          thermalTargets,
          thick * 0.34,
          h / 2,
          0
        );
      } else {
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(length * 0.92, h, wallThick)),
          slotMat,
          thermalTargets,
          0,
          h / 2,
          -thick * 0.34
        );
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(length * 0.92, h, wallThick)),
          slotMat,
          thermalTargets,
          0,
          h / 2,
          thick * 0.34
        );
      }

      // Interior gold contact pins & keying bridge
      addStaticMesh(
        group,
        tracker.trackGeometry(
          new THREE.BoxGeometry(
            alongZ ? thick * 0.22 : length * 0.86,
            h * 0.6,
            alongZ ? length * 0.86 : thick * 0.22
          )
        ),
        goldMat,
        0,
        h * 0.32,
        0
      );

      // Retention latches at both ends
      const latchMat = makeMat(tracker, { color: 0xe2e8f0, roughness: 0.45 });
      const latchGeo = tracker.trackGeometry(
        new THREE.BoxGeometry(thick * 0.95, h * 1.12, thick * 0.65)
      );
      if (alongZ) {
        addStaticMesh(group, latchGeo, latchMat, 0, h * 0.56, -length * 0.47);
        addStaticMesh(group, latchGeo, latchMat, 0, h * 0.56, length * 0.47);
      } else {
        addStaticMesh(group, latchGeo, latchMat, -length * 0.47, h * 0.56, 0);
        addStaticMesh(group, latchGeo, latchMat, length * 0.47, h * 0.56, 0);
      }
      break;
    }

    case 'atx_24pin':
    case 'eps_8pin':
    case 'connector': {
      const nylonMat = makeMat(tracker, {
        color: 0x161b24,
        roughness: 0.62,
        metalness: 0.14,
      });
      // Outer molded nylon shroud
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w, h, d)),
        nylonMat,
        thermalTargets,
        0,
        h / 2,
        0
      );

      // Pin chambers inside header
      const cols = comp.kind === 'atx_24pin' ? 12 : comp.kind === 'eps_8pin' ? 4 : 4;
      const rows = 2;
      const pinGeo = tracker.trackGeometry(new THREE.BoxGeometry(0.24, h * 0.72, 0.24));
      const chamberMat = makeMat(tracker, { color: 0x090d14, roughness: 0.9 });
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.86, h * 0.16, d * 0.76)),
        chamberMat,
        0,
        h * 0.95,
        0
      );

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = (c / (cols - 1) - 0.5) * (w * 0.76);
          const pz = (r - 0.5) * (d * 0.42);
          addStaticMesh(group, pinGeo, goldMat, px, h * 0.65, pz);
        }
      }

      // Locking clip tab on side
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.25, h * 0.7, d * 0.14)),
        nylonMat,
        0,
        h * 0.55,
        d * 0.54
      );
      break;
    }

    case 'transformer': {
      // Yellow Mylar bobbin core
      const mylarTex = createTransformerTapeTexture(comp.id, tracker);
      const mylarMat = makeMat(tracker, {
        map: mylarTex,
        roughness: 0.38,
        metalness: 0.1,
      });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.74, h * 0.66, d * 0.78)),
        mylarMat,
        thermalTargets,
        0,
        h * 0.48,
        0
      );

      // Dark ferrite E-core outer frame (top/bottom yoke + side legs)
      const ferriteMat = makeMat(tracker, {
        color: 0x262a33,
        roughness: 0.68,
        metalness: 0.28,
      });
      // Top & bottom yokes
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w, h * 0.18, d * 0.92)),
        ferriteMat,
        thermalTargets,
        0,
        h * 0.9,
        0
      );
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w, h * 0.18, d * 0.92)),
        ferriteMat,
        thermalTargets,
        0,
        h * 0.14,
        0
      );
      // Left & right legs
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.15, h * 0.85, d * 0.92)),
        ferriteMat,
        thermalTargets,
        -w * 0.42,
        h * 0.52,
        0
      );
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.15, h * 0.85, d * 0.92)),
        ferriteMat,
        thermalTargets,
        w * 0.42,
        h * 0.52,
        0
      );
      break;
    }

    case 'heatsink': {
      const aluMat = makeMat(tracker, {
        color: comp.pos3d.color ? new THREE.Color(comp.pos3d.color).getHex() : 0x64748b,
        metalness: 0.86,
        roughness: 0.28,
      });
      // Base plate
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w, h * 0.22, d)),
        aluMat,
        thermalTargets,
        0,
        h * 0.11,
        0
      );

      // Parallel cooling fins
      const finCount = Math.max(5, Math.min(12, Math.round(w * 0.8)));
      const finGeo = tracker.trackGeometry(
        new THREE.BoxGeometry((w * 0.52) / finCount, h * 0.78, d * 0.96)
      );
      for (let i = 0; i < finCount; i++) {
        const fx = (i / (finCount - 1) - 0.5) * (w * 0.88);
        addThermalMesh(group, finGeo, aluMat, thermalTargets, fx, h * 0.61, 0);
      }
      break;
    }

    case 'bridge_rectifier': {
      const sipMat = makeMat(tracker, { color: 0x1a1e26, roughness: 0.6, metalness: 0.16 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.92, h * 0.78, d * 0.75)),
        sipMat,
        thermalTargets,
        0,
        h * 0.56,
        0
      );
      // 4 inline tinned legs
      const legGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.08, h * 0.24, d * 0.22));
      for (let i = 0; i < 4; i++) {
        const lx = (i / 3 - 0.5) * (w * 0.68);
        addStaticMesh(group, legGeo, silverMat, lx, h * 0.12, 0);
      }
      break;
    }

    case 'optocoupler': {
      // Primary-secondary isolation slot glow marker underneath PC817
      const isoPadMat = makeMat(tracker, {
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      });
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.18, 0.08, d * 1.4)),
        isoPadMat,
        0,
        0.05,
        0
      );

      // Cream/white 4-pin PC817 DIP body
      const optoMat = makeMat(tracker, { color: 0xe2e8f0, roughness: 0.48, metalness: 0.08 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.8, h * 0.72, d * 0.78)),
        optoMat,
        thermalTargets,
        0,
        h * 0.46,
        0
      );

      const legGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.18, h * 0.25, d * 0.16));
      [-d * 0.24, d * 0.24].forEach((lz) => {
        addStaticMesh(group, legGeo, silverMat, -w * 0.42, h * 0.12, lz);
        addStaticMesh(group, legGeo, silverMat, w * 0.42, h * 0.12, lz);
      });
      break;
    }

    case 'tl431': {
      const bodyMat = makeMat(tracker, { color: 0x161922, roughness: 0.55 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.CylinderGeometry(w * 0.38, w * 0.38, h * 0.68, 12, 1, false, 0, Math.PI)),
        bodyMat,
        thermalTargets,
        0,
        h * 0.58,
        0
      );
      const legGeo = tracker.trackGeometry(new THREE.CylinderGeometry(0.08, 0.08, h * 0.3, 6));
      [-w * 0.22, 0, w * 0.22].forEach((lx) => {
        addStaticMesh(group, legGeo, silverMat, lx, h * 0.15, 0);
      });
      break;
    }

    case 'fuse': {
      // Translucent glass cartridge fuse with nickel end-caps
      const capGeo = tracker.trackGeometry(
        new THREE.CylinderGeometry(Math.min(h, d) * 0.42, Math.min(h, d) * 0.42, w * 0.22, 16)
      );
      addStaticMesh(group, capGeo, silverMat, -w * 0.38, h * 0.48, 0, 0, 0, Math.PI / 2);
      addStaticMesh(group, capGeo, silverMat, w * 0.38, h * 0.48, 0, 0, 0, Math.PI / 2);

      const glassMat = makeMat(tracker, {
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.45,
        roughness: 0.12,
        metalness: 0.1,
      });
      addThermalMesh(
        group,
        tracker.trackGeometry(
          new THREE.CylinderGeometry(Math.min(h, d) * 0.38, Math.min(h, d) * 0.38, w * 0.58, 16)
        ),
        glassMat,
        thermalTargets,
        0,
        h * 0.48,
        0,
        0,
        0,
        Math.PI / 2
      );

      // Internal fuse filament (darkened/broken visually if fault suspect!)
      const wireMat = makeMat(tracker, {
        color: isFaultSuspect ? 0xef4444 : 0xfbbf24,
        emissive: isFaultSuspect ? 0x991b1b : 0x000000,
        metalness: 0.8,
      });
      addStaticMesh(
        group,
        tracker.trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, isFaultSuspect ? w * 0.24 : w * 0.56, 6)),
        wireMat,
        isFaultSuspect ? -w * 0.14 : 0,
        h * 0.48,
        0,
        0,
        0,
        Math.PI / 2
      );
      break;
    }

    case 'diode': {
      if (h > Math.max(w, d) * 0.85) {
        // Vertical TO-220 Schottky / Boost Diode (PSU)
        const tabMat = makeMat(tracker, { color: 0xb8c2cc, metalness: 0.88, roughness: 0.25 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.24, h * 0.7, d * 0.86)),
          tabMat,
          thermalTargets,
          -w * 0.24,
          h * 0.6,
          0
        );
        const bodyMat = makeMat(tracker, { color: 0x151820, roughness: 0.55 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.58, h * 0.52, d * 0.88)),
          bodyMat,
          thermalTargets,
          w * 0.1,
          h * 0.5,
          0
        );
        const legGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.12, h * 0.28, d * 0.12));
        [-d * 0.24, 0, d * 0.24].forEach((lz) => {
          addStaticMesh(group, legGeo, silverMat, w * 0.06, h * 0.14, lz);
        });
      } else {
        const bodyMat = makeMat(tracker, { color: 0x151820, roughness: 0.55 });
        addThermalMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.78, h * 0.72, d * 0.78)),
          bodyMat,
          thermalTargets,
          0,
          h * 0.42,
          0
        );
        // Silver cathode polarity band
        addStaticMesh(
          group,
          tracker.trackGeometry(new THREE.BoxGeometry(w * 0.14, h * 0.74, d * 0.8)),
          silverMat,
          w * 0.26,
          h * 0.42,
          0
        );
      }
      break;
    }

    case 'resistor': {
      const ceramicMat = makeMat(tracker, { color: 0x1e293b, roughness: 0.5 });
      addThermalMesh(
        group,
        tracker.trackGeometry(new THREE.BoxGeometry(w * 0.7, h * 0.75, d * 0.84)),
        ceramicMat,
        thermalTargets,
        0,
        h * 0.38,
        0
      );
      const endGeo = tracker.trackGeometry(new THREE.BoxGeometry(w * 0.18, h * 0.78, d * 0.86));
      addStaticMesh(group, endGeo, silverMat, -w * 0.4, h * 0.39, 0);
      addStaticMesh(group, endGeo, silverMat, w * 0.4, h * 0.39, 0);
      break;
    }
  }

  // Invisible clean raycast hitbox covering component volume
  const hitboxMat = makeMat(tracker, {
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitboxMesh = new THREE.Mesh(
    tracker.trackGeometry(new THREE.BoxGeometry(w * 1.15, Math.max(h * 1.25, 1.4), d * 1.15)),
    hitboxMat
  );
  hitboxMesh.position.y = Math.max(h * 0.5, 0.7);
  hitboxMesh.userData.componentId = comp.id;
  group.add(hitboxMesh);

  // Selection highlight ring at base
  const ringRadius = Math.max(w, d) * 0.66;
  const ringMat = makeMat(tracker, {
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const selectionRing = new THREE.Mesh(
    tracker.trackGeometry(new THREE.RingGeometry(ringRadius * 0.86, ringRadius, 32)),
    ringMat
  );
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = 0.08;
  group.add(selectionRing);

  // Fault diagnostic beacon (halo + vertical energy column)
  const faultBeacon = new THREE.Group();
  faultBeacon.visible = isFaultSuspect;
  const beaconMat = makeMat(tracker, {
    color: 0xef4444,
    emissive: 0xf97316,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const faultRing = new THREE.Mesh(
    tracker.trackGeometry(new THREE.RingGeometry(ringRadius * 0.92, ringRadius * 1.12, 32)),
    beaconMat
  );
  faultRing.rotation.x = -Math.PI / 2;
  faultRing.position.y = 0.12;
  faultBeacon.add(faultRing);

  const beamMat = makeMat(tracker, {
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const faultBeam = new THREE.Mesh(
    tracker.trackGeometry(new THREE.CylinderGeometry(ringRadius * 0.55, ringRadius * 0.78, h + 7, 20, 1, true)),
    beamMat
  );
  faultBeam.position.y = (h + 7) / 2;
  faultBeacon.add(faultBeam);
  group.add(faultBeacon);

  // Floating silkscreen sprite label
  const spriteTex = createSilkscreenSpriteTexture(
    comp.id,
    isFaultSuspect ? '#ef4444' : '#38bdf8',
    tracker
  );
  const spriteMat = tracker.trackMaterial(
    new THREE.SpriteMaterial({
      map: spriteTex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  );
  const labelSprite = new THREE.Sprite(spriteMat);
  labelSprite.position.set(0, h + 1.85, 0);
  labelSprite.scale.set(4.6, 1.45, 1);
  labelSprite.renderOrder = 20;
  group.add(labelSprite);

  return {
    component: comp,
    group,
    layerCategory: TALL_KINDS.has(comp.kind) ? 'tall' : 'smd',
    baseY,
    hitboxMesh,
    thermalTargets,
    selectionRing,
    faultBeacon,
    labelSprite,
  };
}
