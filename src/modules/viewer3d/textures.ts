import * as THREE from 'three';
import { ComponentKind, HardwareBoard } from '../../types/circuit';
import { ResourceTracker } from './disposal';

function toCanvasXY(
  x3d: number,
  z3d: number,
  board: HardwareBoard,
  widthPx: number,
  heightPx: number
): { cx: number; cy: number } {
  const u = (x3d + board.pcbSize.width / 2) / board.pcbSize.width;
  const v = (z3d + board.pcbSize.depth / 2) / board.pcbSize.depth;
  return { cx: u * widthPx, cy: v * heightPx };
}

function adjustHexBrightness(hex: string, factor: number): string {
  const c = new THREE.Color(hex || '#112a1c');
  c.multiplyScalar(factor);
  return `#${c.getHexString()}`;
}

export interface PcbTextureBundle {
  surfaceTexture: THREE.CanvasTexture;
  copperTexture: THREE.CanvasTexture;
}

/**
 * Generates high-resolution FR4 PCB solder mask + silkscreen texture
 * and a separate transparent copper etching layer for Exploded View / X-Ray.
 */
export function createPcbTextures(
  board: HardwareBoard,
  tracker: ResourceTracker
): PcbTextureBundle {
  const W = 2048;
  const H = Math.round((W * board.pcbSize.depth) / board.pcbSize.width);

  const surfaceCanvas = document.createElement('canvas');
  surfaceCanvas.width = W;
  surfaceCanvas.height = H;
  const ctx = surfaceCanvas.getContext('2d')!;

  const copperCanvas = document.createElement('canvas');
  copperCanvas.width = W;
  copperCanvas.height = H;
  const cCtx = copperCanvas.getContext('2d')!;

  // 1. Base FR4 solder mask
  const baseColor = board.pcbColor || '#0f281a';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  // Subtle fiberglass weave pattern
  ctx.strokeStyle = adjustHexBrightness(baseColor, 1.18);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.16;
  const step = 12;
  for (let x = 0; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 2. Copper pours & trace buses (drawn onto both surface subtly and copper layer vividly)
  const compMap = new Map(board.components.map((c) => [c.id, c]));
  const railMap = new Map(board.rails.map((r) => [r.id, r]));

  // Subtle embedded ground plane polygons under zones
  board.zones.forEach((zone) => {
    const zx = (zone.bounds2d.x / 100) * W;
    const zy = (zone.bounds2d.y / 100) * H;
    const zw = (zone.bounds2d.w / 100) * W;
    const zh = (zone.bounds2d.h / 100) * H;

    ctx.fillStyle = adjustHexBrightness(baseColor, 1.14);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(zx + 6, zy + 6, Math.max(0, zw - 12), Math.max(0, zh - 12));
    ctx.globalAlpha = 1;

    cCtx.fillStyle = 'rgba(212, 149, 66, 0.14)';
    cCtx.fillRect(zx + 8, zy + 8, Math.max(0, zw - 16), Math.max(0, zh - 16));
  });

  // Etched copper traces from board.wires
  board.wires.forEach((wire, idx) => {
    const fromC = compMap.get(wire.fromComponentId);
    const toC = compMap.get(wire.toComponentId);
    if (!fromC || !toC) return;

    const p1 = toCanvasXY(fromC.pos3d.x, fromC.pos3d.z, board, W, H);
    const p2 = toCanvasXY(toC.pos3d.x, toC.pos3d.z, board, W, H);
    const rail = railMap.get(wire.netId);
    const offset = ((idx % 5) - 2) * 5;

    const drawTrace = (
      targetCtx: CanvasRenderingContext2D,
      stroke: string,
      width: number,
      alpha: number
    ) => {
      targetCtx.save();
      targetCtx.globalAlpha = alpha;
      targetCtx.strokeStyle = stroke;
      targetCtx.lineWidth = width;
      targetCtx.lineCap = 'round';
      targetCtx.lineJoin = 'round';
      targetCtx.beginPath();
      targetCtx.moveTo(p1.cx + offset, p1.cy + offset);
      const midX = (p1.cx + p2.cx) / 2 + offset * 1.4;
      targetCtx.lineTo(midX, p1.cy + offset);
      targetCtx.lineTo(midX, p2.cy + offset);
      targetCtx.lineTo(p2.cx + offset, p2.cy + offset);
      targetCtx.stroke();
      targetCtx.restore();
    };

    // Subtle trace ridge under solder mask
    drawTrace(ctx, adjustHexBrightness(baseColor, 1.45), 5, 0.55);
    // Vivid metallic copper on copper layer
    drawTrace(cCtx, rail?.color ?? '#d89b44', 4.5, 0.85);
    drawTrace(cCtx, '#f5c66c', 1.8, 0.9);
  });

  // Decorative differential micro-traces around CPU/Chipset/PFC for realism
  cCtx.strokeStyle = 'rgba(222, 165, 78, 0.32)';
  cCtx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const y = (H / 25) * (i + 1);
    cCtx.beginPath();
    cCtx.moveTo(40, y);
    cCtx.lineTo(W * 0.25 + (i % 4) * 35, y);
    cCtx.lineTo(W * 0.28 + (i % 4) * 35, y + 18);
    cCtx.lineTo(W * 0.65, y + 18);
    cCtx.stroke();

    ctx.strokeStyle = adjustHexBrightness(baseColor, 1.24);
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W * 0.25 + (i % 4) * 35, y);
    ctx.lineTo(W * 0.28 + (i % 4) * 35, y + 18);
    ctx.lineTo(W * 0.65, y + 18);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 3. PSU High-Voltage Primary/Secondary Isolation Trench warning
  if (board.category === 'psu') {
    const isoX = W * 0.46;
    ctx.save();
    ctx.fillStyle = '#07090d';
    ctx.fillRect(isoX - 8, 24, 16, H - 48);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(isoX, 18);
    ctx.lineTo(isoX, H - 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.translate(isoX - 18, H * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PRIMARY HV 390V  //  ISOLATION BARRIER  //  SECONDARY LV', 0, 0);
    ctx.restore();
  }

  // 4. Zone silkscreen dashed borders & crisp engineering labels
  board.zones.forEach((zone) => {
    const zx = (zone.bounds2d.x / 100) * W;
    const zy = (zone.bounds2d.y / 100) * H;
    const zw = (zone.bounds2d.w / 100) * W;
    const zh = (zone.bounds2d.h / 100) * H;

    ctx.save();
    ctx.strokeStyle = zone.color || '#38bdf8';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(zx, zy, zw, zh);
    ctx.setLineDash([]);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = zone.color || '#7dd3fc';
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(zone.name.toUpperCase(), zx + 12, zy + 28);
    ctx.restore();
  });

  // 5. Component footprints, copper solder pads, and silkscreen designators
  board.components.forEach((comp) => {
    const { cx, cy } = toCanvasXY(comp.pos3d.x, comp.pos3d.z, board, W, H);
    const pw = (comp.pos3d.w / board.pcbSize.width) * W;
    const pd = (comp.pos3d.d / board.pcbSize.depth) * H;

    ctx.save();
    ctx.translate(cx, cy);
    if (comp.pos3d.rotationY) {
      ctx.rotate(-comp.pos3d.rotationY);
    }

    // Gold/tinned pad rings
    ctx.fillStyle = '#d4a64a';
    ctx.globalAlpha = 0.75;
    const padSize = Math.max(6, Math.min(14, pw * 0.14));
    ctx.fillRect(-pw / 2 - 4, -pd / 2 - 4, padSize, padSize);
    ctx.fillRect(pw / 2 + 4 - padSize, -pd / 2 - 4, padSize, padSize);
    ctx.fillRect(-pw / 2 - 4, pd / 2 + 4 - padSize, padSize, padSize);
    ctx.fillRect(pw / 2 + 4 - padSize, pd / 2 + 4 - padSize, padSize, padSize);

    // Silkscreen outline
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(-pw / 2 - 3, -pd / 2 - 3, pw + 6, pd + 6);

    // Pin 1 silkscreen triangle/dot
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(-pw / 2 - 8, -pd / 2 - 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Designator text near footprint
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(comp.id, 0, pd / 2 + 22);
    ctx.restore();

    // Copper layer footprint pads
    cCtx.save();
    cCtx.translate(cx, cy);
    if (comp.pos3d.rotationY) cCtx.rotate(-comp.pos3d.rotationY);
    cCtx.fillStyle = '#e8b34e';
    cCtx.fillRect(-pw / 2 - 3, -pd / 2 - 3, pw + 6, pd + 6);
    cCtx.restore();
  });

  // 6. Gold Mounting Holes with via ring
  const marginX = 48;
  const marginY = 48;
  const holes = [
    [marginX, marginY],
    [W - marginX, marginY],
    [marginX, H - marginY],
    [W - marginX, H - marginY],
    [W * 0.5, marginY],
    [W * 0.5, H - marginY],
  ];
  holes.forEach(([hx, hy]) => {
    // Copper gold ring
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(hx, hy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Radial thermal relief vias
    ctx.fillStyle = '#ca8a04';
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(hx + Math.cos(ang) * 16, hy + Math.sin(ang) * 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center drill hole
    ctx.fillStyle = '#070a10';
    ctx.beginPath();
    ctx.arc(hx, hy, 10, 0, Math.PI * 2);
    ctx.fill();

    cCtx.fillStyle = '#facc15';
    cCtx.beginPath();
    cCtx.arc(hx, hy, 20, 0, Math.PI * 2);
    cCtx.fill();
  });

  // 7. Board revision & model silkscreen stamp
  ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${board.brand.toUpperCase()}  •  ${board.name}  •  REV 1.04`, 90, H - 24);

  const surfaceTexture = tracker.trackTexture(new THREE.CanvasTexture(surfaceCanvas));
  surfaceTexture.colorSpace = THREE.SRGBColorSpace;
  surfaceTexture.anisotropy = 8;

  const copperTexture = tracker.trackTexture(new THREE.CanvasTexture(copperCanvas));
  copperTexture.colorSpace = THREE.SRGBColorSpace;
  copperTexture.anisotropy = 8;

  return { surfaceTexture, copperTexture };
}

/**
 * Laser-etched matte black epoxy top texture for ICs, MOSFETs, BIOS, Super I/O, Chipset.
 */
export function createChipMarkingTexture(
  id: string,
  partNumber: string | undefined,
  kind: ComponentKind,
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kind === 'chipset' ? '#171c24' : '#13161c';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle epoxy grain
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Pin 1 dimple
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(32, 32, 12, 0, Math.PI * 2);
  ctx.fill();

  // Laser marking
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(id, 128, 118);

  if (partNumber) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '22px monospace';
    ctx.fillText(partNumber.slice(0, 14), 128, 158);
  }

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Ferrite choke top marking (R22 / LR22 / 1R0).
 */
export function createInductorTopTexture(
  label: string,
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2b2f38';
  ctx.fillRect(0, 0, 256, 256);

  // Sintered ferrite texture dots
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 320; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  const marking = label.toUpperCase().includes('LR22')
    ? 'LR22'
    : label.toUpperCase().includes('1R0')
    ? '1R0'
    : 'R22';

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 74px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(marking, 128, 128);

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Brushed aluminum capacitor top with K-vent / Y-vent score lines or polymer polarity stripe.
 */
export function createCapTopTexture(
  isElectrolytic: boolean,
  isHvBulk: boolean,
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, '#eef2f6');
  grad.addColorStop(0.7, '#cbd5e1');
  grad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  if (isElectrolytic) {
    // K-vent / Y-vent score lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = isHvBulk ? 7 : 5;
    ctx.lineCap = 'round';

    // Vertical main score
    ctx.beginPath();
    ctx.moveTo(128, 36);
    ctx.lineTo(128, 220);
    ctx.stroke();

    // K diagonal arms
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(205, 58);
    ctx.moveTo(128, 128);
    ctx.lineTo(205, 198);
    ctx.stroke();

    if (isHvBulk) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 128, 96, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Polymer solid cap blue/red polarity crescent + 560uF rating
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(128, 128, 118, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.lineTo(128, 128);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('560', 100, 118);
    ctx.font = 'bold 26px monospace';
    ctx.fillText('6.3V', 100, 152);
  }

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Yellow Mylar transformer insulation wrap texture with component designation.
 */
export function createTransformerTapeTexture(
  id: string,
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 256);

  // Overlapping Mylar tape bands
  ctx.fillStyle = '#facc15';
  ctx.globalAlpha = 0.45;
  ctx.fillRect(0, 20, 256, 46);
  ctx.fillRect(0, 145, 256, 52);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 248);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(id, 128, 118);
  ctx.font = 'bold 22px monospace';
  ctx.fillText('HI-POT 3.75kV', 128, 158);

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Dense gold pin-grid texture for CPU Socket cavity.
 */
export function createCpuPinGridTexture(
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#14181f';
  ctx.fillRect(0, 0, 512, 512);

  // Pin grid with center MLCC capacitor island
  for (let gx = 20; gx < 492; gx += 12) {
    for (let gy = 20; gy < 492; gy += 12) {
      const inCenter = gx > 180 && gx < 332 && gy > 180 && gy < 332;
      if (inCenter) continue;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(gx, gy, 7, 7);
    }
  }

  // Center SMD MLCC decoupling caps inside socket cavity
  ctx.fillStyle = '#854d0e';
  for (let cx = 196; cx <= 300; cx += 24) {
    for (let cy = 196; cy <= 300; cy += 18) {
      ctx.fillRect(cx, cy, 14, 8);
    }
  }

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Floating silkscreen designator badge texture for 3D sprites.
 */
export function createSilkscreenSpriteTexture(
  id: string,
  accentColor: string,
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(10, 15, 28, 0.86)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(6, 6, 244, 68, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, 128, 41);

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft radial glow sprite texture for 3D power rail flow particles.
 */
export function createParticleGlowTexture(
  tracker: ResourceTracker
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
