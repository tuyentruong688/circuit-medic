import type { ScanPreset } from './scannerTypes';

function createBaseCanvas(w = 960, h = 640): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot acquire 2D canvas context');
  }
  return [canvas, ctx];
}

function drawPcbSubstrate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  traceColor: string,
  isPsu = false
) {
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Board outline with subtle shadow
  const marginX = isPsu ? 52 : 34;
  const marginY = isPsu ? 48 : 30;
  const bw = w - marginX * 2;
  const bh = h - marginY * 2;

  ctx.fillStyle = baseColor;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(marginX, marginY, bw, bh, 12);
  ctx.fill();
  ctx.stroke();

  // Copper / solder-mask trace grid
  ctx.strokeStyle = traceColor;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 42; i++) {
    const y = marginY + 18 + ((i * 13) % (bh - 36));
    const x1 = marginX + 20 + ((i * 47) % (bw * 0.45));
    const x2 = x1 + 80 + ((i * 31) % 180);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(Math.min(x2, marginX + bw - 20), y);
    ctx.lineTo(Math.min(x2 + 18, marginX + bw - 16), y + (i % 2 === 0 ? 12 : -12));
    ctx.stroke();
  }

  // Gold mounting holes
  const holes = [
    [marginX + 18, marginY + 18],
    [marginX + bw - 18, marginY + 18],
    [marginX + 18, marginY + bh - 18],
    [marginX + bw - 18, marginY + bh - 18],
    [marginX + bw / 2, marginY + 18],
    [marginX + bw / 2, marginY + bh - 18],
  ];
  for (const [hx, hy] of holes) {
    ctx.fillStyle = '#d4a638';
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIcPackage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  pinsPerSide = 8
) {
  ctx.fillStyle = '#b8c4d4';
  const stepX = w / (pinsPerSide + 1);
  for (let i = 1; i <= pinsPerSide; i++) {
    ctx.fillRect(x + i * stepX - 2, y - 5, 4, 5);
    ctx.fillRect(x + i * stepX - 2, y + h, 4, 5);
  }
  const stepY = h / (pinsPerSide + 1);
  for (let i = 1; i <= pinsPerSide; i++) {
    ctx.fillRect(x - 5, y + i * stepY - 2, 5, 4);
    ctx.fillRect(x + w, y + i * stepY - 2, 5, 4);
  }

  ctx.fillStyle = '#181c24';
  ctx.strokeStyle = '#3c4658';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  // Pin 1 dot
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x + 8, y + 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = 'left';
}

function drawInductor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, marking = 'R22') {
  ctx.fillStyle = '#3b4252';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(marking, x + size / 2, y + size / 2 + 4);
  ctx.textAlign = 'left';
}

function drawSolidCap(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, stripeColor = '#2563eb') {
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stripeColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, -Math.PI * 0.7, -Math.PI * 0.1);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHeatsink(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dark = false) {
  ctx.fillStyle = dark ? '#262b36' : '#94a3b8';
  ctx.strokeStyle = dark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = dark ? '#11151d' : '#475569';
  const vertical = h > w;
  if (vertical) {
    for (let fy = y + 6; fy < y + h - 6; fy += 10) {
      ctx.fillRect(x + 4, fy, w - 8, 4);
    }
  } else {
    for (let fx = x + 6; fx < x + w - 6; fx += 10) {
      ctx.fillRect(fx, y + 4, 4, h - 8);
    }
  }
}

function drawSocketLga(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  // Metallic ILM frame
  ctx.fillStyle = '#9ca3af';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Gold pin array cavity
  ctx.fillStyle = '#c89b2b';
  ctx.fillRect(x + 18, y + 18, w - 36, h - 36);
  ctx.fillStyle = 'rgba(20, 24, 34, 0.28)';
  for (let gx = x + 22; gx < x + w - 22; gx += 7) {
    for (let gy = y + 22; gy < y + h - 22; gy += 7) {
      ctx.fillRect(gx, gy, 3, 3);
    }
  }

  // Center bridge island
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + w / 2 - 22, y + h / 2 - 28, 44, 56);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h + 18);
  ctx.textAlign = 'left';
}

function drawSocketAm4(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Retention brackets top & bottom
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 10, y - 22, w + 20, 14);
  ctx.fillRect(x - 10, y + h + 8, w + 20, 14);

  // Cream/white ZIF PGA socket
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  // Pin hole grid
  ctx.fillStyle = '#334155';
  for (let gx = x + 12; gx < x + w - 12; gx += 7) {
    for (let gy = y + 12; gy < y + h - 12; gy += 7) {
      ctx.fillRect(gx, gy, 2.5, 2.5);
    }
  }
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x + w / 2 - 20, y + h / 2 - 20, 40, 40);

  // Lever bar
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x + w + 6, y, 6, h + 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOCKET AM4', x + w / 2, y + h + 36);
  ctx.textAlign = 'left';
}

function drawDimmSlots(ctx: CanvasRenderingContext2D, x: number, y: number, count = 4, height = 270) {
  for (let i = 0; i < count; i++) {
    const sx = x + i * 24;
    ctx.fillStyle = i % 2 === 0 ? '#111827' : '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.fillRect(sx, y, 14, height);
    ctx.strokeRect(sx, y, 14, height);
    ctx.fillStyle = '#d4a638';
    ctx.fillRect(sx + 5, y + 10, 4, height - 20);
  }
}

function drawPcieSlots(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Armored PCIe x16
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x, y, 280, 20);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 6, y + 5, 268, 10);

  // Secondary PCIe
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#64748b';
  ctx.fillRect(x, y + 48, 220, 16);
  ctx.strokeRect(x, y + 48, 220, 16);
}

function drawBurntMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  grad.addColorStop(0, 'rgba(10, 8, 6, 0.96)');
  grad.addColorStop(0.35, 'rgba(55, 28, 12, 0.85)');
  grad.addColorStop(0.7, 'rgba(120, 62, 22, 0.45)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cracked ember core
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 6);
  ctx.lineTo(cx + 3, cy + 2);
  ctx.lineTo(cx + 11, cy - 4);
  ctx.stroke();
}

function drawCorrosionCluster(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.fillStyle = 'rgba(74, 222, 128, 0.48)';
  for (let i = 0; i < 28; i++) {
    const px = cx + ((i * 19) % w) - w / 2;
    const py = cy + ((i * 23) % h) - h / 2;
    const r = 3 + (i % 5);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
  for (let i = 0; i < 14; i++) {
    const px = cx + ((i * 29) % (w - 8)) - w / 2 + 4;
    const py = cy + ((i * 17) % (h - 8)) - h / 2 + 4;
    ctx.fillRect(px, py, 3, 3);
  }
}

function drawYellowTransformer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  // Ferrite outer E-core
  ctx.fillStyle = '#1f2937';
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  // Characteristic yellow Mylar insulation tape
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x + 10, y + 6, w - 20, h - 12);
  ctx.strokeStyle = '#ca8a04';
  ctx.strokeRect(x + 10, y + 6, w - 20, h - 12);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = 'left';
}

function drawPsuBaseLayout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pcbColor: string,
  traceColor: string,
  brandTitle: string,
  isTl494 = false
) {
  drawPcbSubstrate(ctx, w, h, pcbColor, traceColor, true);

  // Primary vs Secondary isolation trench
  ctx.fillStyle = '#090d16';
  ctx.fillRect(470, 74, 8, h - 148);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('HV ISOLATION BARRIER', 415, 66);

  // AC input + Fuse + Bridge
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(74, 96, 54, 42);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('AC IN', 84, 121);

  // Bulk capacitor(s)
  if (isTl494) {
    drawSolidCap(ctx, 220, 210, 34, '#0f172a');
    drawSolidCap(ctx, 220, 295, 34, '#0f172a');
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px monospace';
    ctx.fillText('200V 470uF x2', 175, 345);
  } else {
    drawSolidCap(ctx, 225, 240, 46, '#b45309');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('420V 680uF', 190, 300);
  }

  // Primary heatsink + PFC / switching transistors
  drawHeatsink(ctx, 305, 110, 36, 260, !isTl494);
  drawHeatsink(ctx, 560, 120, 34, 240, !isTl494);

  // Main & 5VSB yellow Mylar transformers
  drawYellowTransformer(ctx, 390, 140, 120, 115, 'T_MAIN');
  drawYellowTransformer(ctx, 408, 305, 86, 80, 'T_5VSB');

  // Optocouplers straddling isolation barrier
  drawIcPackage(ctx, 456, 415, 34, 22, 'PC817', 2);
  drawIcPackage(ctx, 456, 452, 34, 22, 'PC817', 2);

  // Secondary DC-DC / Supervisor / Output caps
  drawIcPackage(ctx, 645, 420, 56, 46, isTl494 ? 'TL494' : 'WT7527', 6);
  drawSolidCap(ctx, 650, 160, 22, '#0284c7');
  drawSolidCap(ctx, 705, 160, 22, '#0284c7');
  drawSolidCap(ctx, 650, 220, 22, '#0284c7');
  drawSolidCap(ctx, 705, 220, 22, '#0284c7');

  // ATX 24-pin wire harness solder pad cluster
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#94a3b8';
  ctx.fillRect(775, 120, 95, 320);
  ctx.strokeRect(775, 120, 95, 320);
  const wireColors = ['#eab308', '#ef4444', '#f97316', '#9333ea', '#22c55e', '#94a3b8'];
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = wireColors[i % wireColors.length];
    ctx.fillRect(790, 134 + i * 24, 65, 10);
  }

  ctx.fillStyle = 'rgba(248, 250, 252, 0.8)';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(brandTitle, 74, h - 64);
}

export const SCAN_PRESETS: ScanPreset[] = [
  {
    id: 'preset-burnt-vrm-b760',
    title: 'ASUS ROG B760-F — Cháy MOSFET / DrMOS VRM',
    subtitle: 'Mainboard LGA1700 • Vết cháy đen khu vực PQ101 / PQ102',
    category: 'motherboard',
    targetBoardId: 'asus-rog-b760f',
    targetFaultHint: 'Chạm chập nguồn 12V VRM CPU',
    defectTag: 'Cháy nổ DrMOS VRM',
    severityBadge: 'critical',
    defaultHintText: 'ASUS B760-F LGA1700, kích nguồn quạt nhích nhẹ tắt ngay, nghi cháy DrMOS VRM',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPcbSubstrate(ctx, w, h, '#141923', 'rgba(180, 145, 70, 0.16)');

      // Heatsinks & VRM phases
      drawHeatsink(ctx, 78, 86, 52, 260, true);
      drawHeatsink(ctx, 180, 56, 230, 44, true);

      // VRM DrMOS + Chokes + Solid Caps
      for (let i = 0; i < 6; i++) {
        drawIcPackage(ctx, 152, 120 + i * 38, 28, 24, i === 2 ? 'PQ101' : `DR${i + 1}`, 3);
        drawInductor(ctx, 198, 118 + i * 38, 30, 'R22');
        drawSolidCap(ctx, 252, 132 + i * 38, 12, '#1d4ed8');
      }

      // CPU Socket LGA1700
      drawSocketLga(ctx, 295, 145, 180, 190, 'LGA1700');

      // DDR5 DIMM Slots
      drawDimmSlots(ctx, 535, 110, 4, 275);

      // Chipset PCH + Heatsink
      drawHeatsink(ctx, 540, 425, 115, 100, true);
      drawIcPackage(ctx, 730, 435, 58, 58, 'U_SIO', 7);
      drawIcPackage(ctx, 680, 520, 32, 24, 'BIOS', 4);

      // PCIe slots & 24-pin ATX
      drawPcieSlots(ctx, 220, 430);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#64748b';
      ctx.fillRect(680, 150, 32, 165);
      ctx.strokeRect(680, 150, 32, 165);

      // Burnt defect on PQ101 / PQ102 area
      drawBurntMark(ctx, 166, 208, 48);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('ROG STRIX B760-F GAMING WIFI  REV 1.02', 64, h - 46);
      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'preset-bulged-5vsb-corsair',
    title: 'Corsair RM750x — Phù Tụ +5VSB & Tụ Lọc Chính',
    subtitle: 'Nguồn ATX 80+ Gold • Phù đầu tụ điện phân & rỉ dung dịch',
    category: 'psu',
    targetBoardId: 'corsair-rm750x',
    targetFaultHint: 'Có 5VSB nhưng sụt áp, tụ phù',
    defectTag: 'Phù tụ điện phân',
    severityBadge: 'warning',
    defaultHintText: 'Corsair RM750x 80+ Gold, 5VSB dao động kích nguồn lúc được lúc không, thấy tụ phù',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPsuBaseLayout(ctx, w, h, '#102922', 'rgba(74, 222, 128, 0.16)', 'CORSAIR RM750x • LLC + DC-DC');

      // Fuse & NTC
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(142, 108, 42, 14);
      ctx.fillStyle = '#0f172a';
      ctx.font = '10px monospace';
      ctx.fillText('F1', 156, 118);

      // Bulged & leaking electrolyte capacitor near 5VSB secondary
      ctx.fillStyle = 'rgba(146, 64, 14, 0.55)';
      ctx.beginPath();
      ctx.arc(542, 365, 36, 0, Math.PI * 2);
      ctx.fill();

      drawSolidCap(ctx, 542, 365, 24, '#b91c1c');
      // Swollen K-vent bulge highlight
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(530, 353);
      ctx.lineTo(554, 377);
      ctx.moveTo(554, 353);
      ctx.lineTo(530, 377);
      ctx.stroke();

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'preset-blown-fuse-tl494',
    title: 'Nguồn ATX TL494 — Nổ Cầu Chì F1 & Cháy NTC/Cầu Diode',
    subtitle: 'Nguồn phổ thông Half-Bridge • Cháy đen khu vực sơ cấp 220VAC',
    category: 'psu',
    targetBoardId: 'generic-atx-tl494',
    targetFaultHint: 'Nổ cầu chì F1 chạm cầu diode BD1',
    defectTag: 'Nổ sơ cấp HV 310V',
    severityBadge: 'critical',
    defaultHintText: 'Nguồn ATX TL494 cắm điện nổ cái tách, cháy đen cầu chì F1 và cầu diode',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPsuBaseLayout(ctx, w, h, '#4f4627', 'rgba(217, 119, 6, 0.22)', 'ATX-450W TL494 HALF-BRIDGE', true);

      // Bridge rectifier BD1
      ctx.fillStyle = '#111827';
      ctx.fillRect(145, 165, 42, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText('BD1', 156, 183);

      // Blown fuse + charred crater over F1 & BD1
      drawBurntMark(ctx, 145, 142, 58);

      // Charred MJE13007 switch transistor spot
      drawBurntMark(ctx, 322, 235, 34);

      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'preset-corroded-sio-h81',
    title: 'ASRock H81M-DGS — Ăn Mòn Chân Super I/O & LAN',
    subtitle: 'Mainboard LGA1150 • Oxy hóa xanh rỉ sét ẩm mốc quanh U_SIO',
    category: 'motherboard',
    targetBoardId: 'asrock-h81m-dgs',
    targetFaultHint: 'Mất lệnh RSMRST# Super I/O chập chip LAN',
    defectTag: 'Oxy hóa / rỉ chân IC',
    severityBadge: 'warning',
    defaultHintText: 'Mainboard H81 ẩm mốc quanh Super I/O và chip LAN, kích nguồn không chạy',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPcbSubstrate(ctx, w, h, '#1b2838', 'rgba(56, 189, 248, 0.14)');

      for (let i = 0; i < 4; i++) {
        drawIcPackage(ctx, 130, 125 + i * 44, 24, 22, `Q${i + 1}`, 3);
        drawInductor(ctx, 180, 122 + i * 44, 28, '1R0');
        drawSolidCap(ctx, 235, 136 + i * 44, 12, '#0ea5e9');
      }

      drawSocketLga(ctx, 300, 135, 175, 180, 'LGA1150 H81');
      drawDimmSlots(ctx, 540, 115, 2, 260);
      drawIcPackage(ctx, 550, 425, 86, 86, 'PCH H81', 8);
      drawPcieSlots(ctx, 200, 435);

      // CMOS Battery
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(465, 485, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('CR2032', 446, 488);

      // Super I/O & LAN
      drawIcPackage(ctx, 720, 415, 68, 68, 'U_SIO', 8);
      drawIcPackage(ctx, 645, 515, 42, 42, 'U_LAN', 5);

      // Green-white corrosion cluster over U_SIO & U_LAN
      drawCorrosionCluster(ctx, 750, 448, 86, 86);
      drawCorrosionCluster(ctx, 665, 535, 48, 48);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('ASRock H81M-DGS  REV 2.04', 64, h - 46);
      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'preset-amd-am4-b550',
    title: 'MSI MAG B550 Tomahawk — Board AMD AM4 Quét VRM',
    subtitle: 'Mainboard AM4 ATX • Quá nhiệt dàn VRM VDDCR_SOC / CPU',
    category: 'motherboard',
    targetBoardId: 'msi-b550-tomahawk',
    targetFaultHint: 'Bệnh AMD AM4 chết VDDCR_SOC VRM nóng',
    defectTag: 'Quá nhiệt vùng VRM AM4',
    severityBadge: 'info',
    defaultHintText: 'MSI B550 Tomahawk AMD AM4, có nguồn quạt quay nhưng không POST, vùng VRM nóng',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPcbSubstrate(ctx, w, h, '#18181b', 'rgba(244, 63, 94, 0.14)');

      drawHeatsink(ctx, 82, 82, 54, 270, true);
      drawHeatsink(ctx, 195, 54, 210, 46, true);

      for (let i = 0; i < 6; i++) {
        drawIcPackage(ctx, 154, 118 + i * 38, 26, 24, `PQ30${i + 1}`, 3);
        drawInductor(ctx, 196, 116 + i * 38, 28, 'R47');
        drawSolidCap(ctx, 248, 130 + i * 38, 11, '#ef4444');
      }

      drawSocketAm4(ctx, 300, 148, 175, 175);
      drawDimmSlots(ctx, 545, 108, 4, 275);
      drawHeatsink(ctx, 555, 420, 120, 105, true);
      drawIcPackage(ctx, 735, 440, 60, 60, 'U_SIO', 7);
      drawPcieSlots(ctx, 210, 435);

      // Subtle thermal discoloration over PQ302
      const heatGrad = ctx.createRadialGradient(168, 170, 5, 168, 170, 42);
      heatGrad.addColorStop(0, 'rgba(234, 88, 12, 0.55)');
      heatGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(168, 170, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('MSI MAG B550 TOMAHAWK  MS-7C91', 64, h - 46);
      return canvas.toDataURL('image/png');
    },
  },
  {
    id: 'preset-lga1700-gigabyte-ram',
    title: 'Gigabyte B660M DS3H — Lỗi Nguồn RAM & Q_RSMRST',
    subtitle: 'Mainboard LGA1700 mATX • Đèn DRAM LED sáng, dấu vết cháy nhẹ khu DDR',
    category: 'motherboard',
    targetBoardId: 'gigabyte-b660m-ds3h',
    targetFaultHint: 'Lỗi nhận RAM DRAM LED mất nguồn VDDQ',
    defectTag: 'Lỗi mạch RAM / DRAM LED',
    severityBadge: 'warning',
    defaultHintText: 'Gigabyte B660M DS3H đèn DRAM sáng vàng không nhận RAM, nghi mất nguồn VDDQ',
    generateImage: () => {
      const w = 960;
      const h = 640;
      const [canvas, ctx] = createBaseCanvas(w, h);
      drawPcbSubstrate(ctx, w, h, '#1e242b', 'rgba(56, 189, 248, 0.15)');

      drawHeatsink(ctx, 88, 92, 46, 220, false);
      for (let i = 0; i < 5; i++) {
        drawIcPackage(ctx, 152, 120 + i * 40, 26, 22, `PQ20${i + 1}`, 3);
        drawInductor(ctx, 194, 118 + i * 40, 28, '1R0');
      }

      drawSocketLga(ctx, 285, 140, 175, 180, 'LGA1700 B660M');
      drawDimmSlots(ctx, 525, 110, 4, 270);

      // RAM power IC + inductor near DIMM
      drawIcPackage(ctx, 645, 330, 38, 32, 'PU_DDR', 5);
      drawInductor(ctx, 648, 280, 28, '1R5');
      drawSolidCap(ctx, 695, 305, 13, '#3b82f6');

      // Flux / scorch mark near PU_DDR
      drawBurntMark(ctx, 662, 344, 34);

      drawHeatsink(ctx, 525, 430, 100, 90, false);
      drawIcPackage(ctx, 730, 440, 56, 56, 'U_SIO', 7);
      drawPcieSlots(ctx, 210, 435);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('GIGABYTE B660M DS3H DDR4  REV 1.0', 64, h - 46);
      return canvas.toDataURL('image/png');
    },
  },
];
