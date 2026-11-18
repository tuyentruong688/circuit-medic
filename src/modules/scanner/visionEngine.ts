import type { DeviceCategory, FaultCase, HardwareBoard } from '../../types/circuit';
import { DEVICE_CATEGORY_META } from '../../components/circuitLabels';
import { isFaultForBoard } from '../../data/registry';
import type {
  BoardMatchCandidate,
  BoxRect,
  DetectedAnomaly,
  DetectedZoneBox,
  GeminiVisionJsonResponse,
  HistogramProfile,
  ScanAnalysisResult,
} from './scannerTypes';

export const GEMINI_API_KEY_STORAGE = 'circuitmedic_gemini_api_key';

export function loadStoredGeminiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function saveStoredGeminiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  } catch {
    // Ignore storage quota errors in restricted browser contexts
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh để phân tích.'));
    img.src = src;
  });
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return [h, s, max];
}

interface GridClusterStats {
  sootCells: Array<{ gx: number; gy: number; score: number }>;
  corrosionCells: Array<{ gx: number; gy: number; score: number }>;
  yellowCells: Array<{ gx: number; gy: number; score: number }>;
  copperHeatCells: Array<{ gx: number; gy: number; score: number }>;
}

const GRID_COLS = 12;
const GRID_ROWS = 8;

async function extractImageFeatures(
  imageUrl: string
): Promise<{ histogram: HistogramProfile; clusters: GridClusterStats; base64Jpeg: string }> {
  const img = await loadImageElement(imageUrl);
  const sampleW = 240;
  const sampleH = 160;

  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');
  }
  ctx.drawImage(img, 0, 0, sampleW, sampleH);

  // Also produce a clean medium-res JPEG for optional Gemini Vision upload
  const uploadCanvas = document.createElement('canvas');
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 960, img.naturalHeight || 640));
  uploadCanvas.width = Math.max(320, Math.round((img.naturalWidth || 960) * scale));
  uploadCanvas.height = Math.max(240, Math.round((img.naturalHeight || 640) * scale));
  const uCtx = uploadCanvas.getContext('2d');
  uCtx?.drawImage(img, 0, 0, uploadCanvas.width, uploadCanvas.height);
  const base64Jpeg = uploadCanvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? '';

  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  const totalPixels = sampleW * sampleH;

  let greenCount = 0;
  let blackCount = 0;
  let blueCount = 0;
  let brownCount = 0;
  let copperGoldCount = 0;
  let metallicCount = 0;
  let yellowTransformerCount = 0;
  let charredSootCount = 0;
  let corrosionCount = 0;
  let edgeSum = 0;

  const cellSoot = new Float32Array(GRID_COLS * GRID_ROWS);
  const cellCorrosion = new Float32Array(GRID_COLS * GRID_ROWS);
  const cellYellow = new Float32Array(GRID_COLS * GRID_ROWS);
  const cellCopperHeat = new Float32Array(GRID_COLS * GRID_ROWS);
  const cellPixels = (sampleW / GRID_COLS) * (sampleH / GRID_ROWS);

  for (let y = 0; y < sampleH; y++) {
    const gy = Math.min(GRID_ROWS - 1, Math.floor((y / sampleH) * GRID_ROWS));
    for (let x = 0; x < sampleW; x++) {
      const gx = Math.min(GRID_COLS - 1, Math.floor((x / sampleW) * GRID_COLS));
      const idx = (y * sampleW + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      const [h, s, v] = rgbToHsv(r, g, b);
      const cellIdx = gy * GRID_COLS + gx;

      // Edge proxy vs left neighbor
      if (x > 0) {
        const prevIdx = idx - 4;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const prevLum =
          0.299 * imgData[prevIdx] + 0.587 * imgData[prevIdx + 1] + 0.114 * imgData[prevIdx + 2];
        if (Math.abs(lum - prevLum) > 22) edgeSum++;
      }

      // PCB Solder Mask classification
      if (h >= 85 && h <= 165 && s >= 0.22 && v >= 0.12 && v <= 0.65) {
        greenCount++;
      } else if (v >= 0.06 && v <= 0.23 && s < 0.35) {
        blackCount++;
      } else if (h >= 190 && h <= 245 && s >= 0.25 && v >= 0.14 && v <= 0.65) {
        blueCount++;
      } else if (h >= 24 && h <= 55 && s >= 0.25 && v >= 0.16 && v <= 0.52) {
        brownCount++;
      }

      // Copper / Gold pads & traces
      if (h >= 34 && h <= 54 && s >= 0.45 && v >= 0.45 && v <= 0.88) {
        copperGoldCount++;
      }

      // Yellow Mylar transformer tape (PSU hallmark)
      if (h >= 42 && h <= 60 && s >= 0.65 && v >= 0.62) {
        yellowTransformerCount++;
        cellYellow[cellIdx]++;
      }

      // Metallic heatsink / aluminum cap
      if (s <= 0.16 && v >= 0.52 && v <= 0.92) {
        metallicCount++;
      }

      // Charred soot / scorch / ember orange-brown rim
      if ((v < 0.11 && r >= b && h <= 45) || (h >= 12 && h <= 36 && s >= 0.45 && v >= 0.15 && v <= 0.55)) {
        charredSootCount++;
        cellSoot[cellIdx]++;
      }

      // Thermal/flux orange-red discoloration
      if (h >= 8 && h <= 28 && s >= 0.65 && v >= 0.45) {
        cellCopperHeat[cellIdx]++;
      }

      // Green/white oxide corrosion
      if (h >= 110 && h <= 155 && s >= 0.38 && v >= 0.58) {
        corrosionCount++;
        cellCorrosion[cellIdx]++;
      }
    }
  }

  const ratios = [
    { key: 'green' as const, label: 'Xanh lá Solder Mask (FR4)', hex: '#14532d', val: greenCount },
    { key: 'matte_black' as const, label: 'Đen nhám Gaming / Pro PCB', hex: '#18181b', val: blackCount },
    { key: 'blue' as const, label: 'Xanh dương PCB (Classic)', hex: '#1e3a5f', val: blueCount },
    { key: 'brown' as const, label: 'Nâu/Vàng Phíp Phenolic (PSU)', hex: '#574423', val: brownCount },
  ].sort((a, b) => b.val - a.val);

  const topPcb = ratios[0].val > totalPixels * 0.04 ? ratios[0] : { key: 'unknown' as const, label: 'Hỗn hợp / Ánh sáng phức tạp', hex: '#1e293b' };

  const collectCells = (arr: Float32Array, thresholdRatio: number) => {
    const out: Array<{ gx: number; gy: number; score: number }> = [];
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        const val = arr[gy * GRID_COLS + gx] / cellPixels;
        if (val >= thresholdRatio) {
          out.push({ gx, gy, score: val });
        }
      }
    }
    return out.sort((a, b) => b.score - a.score);
  };

  const natW = img.naturalWidth || sampleW;
  const natH = img.naturalHeight || sampleH;

  return {
    base64Jpeg,
    histogram: {
      width: natW,
      height: natH,
      aspectRatio: Number((natW / Math.max(1, natH)).toFixed(2)),
      dominantPcbColor: topPcb.key,
      dominantPcbLabel: topPcb.label,
      pcbHexEstimate: topPcb.hex,
      greenRatio: greenCount / totalPixels,
      blackRatio: blackCount / totalPixels,
      blueRatio: blueCount / totalPixels,
      brownRatio: brownCount / totalPixels,
      copperGoldRatio: copperGoldCount / totalPixels,
      metallicRatio: metallicCount / totalPixels,
      yellowTransformerRatio: yellowTransformerCount / totalPixels,
      charredSootRatio: charredSootCount / totalPixels,
      corrosionRatio: corrosionCount / totalPixels,
      edgeDensity: edgeSum / totalPixels,
    },
    clusters: {
      sootCells: collectCells(cellSoot, 0.14),
      corrosionCells: collectCells(cellCorrosion, 0.1),
      yellowCells: collectCells(cellYellow, 0.1),
      copperHeatCells: collectCells(cellCopperHeat, 0.12),
    },
  };
}

function cellToBox(gx: number, gy: number, padX = 2, padY = 2): BoxRect {
  const cw = 100 / GRID_COLS;
  const ch = 100 / GRID_ROWS;
  const x = Math.max(2, gx * cw - padX);
  const y = Math.max(2, gy * ch - padY);
  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    w: Number(Math.min(96 - x, cw + padX * 2.4).toFixed(1)),
    h: Number(Math.min(96 - y, ch + padY * 2.4).toFixed(1)),
  };
}

function mapZonesFromBoard(
  board: HardwareBoard,
  category: DeviceCategory,
  preferPhotoBounds = false
): DetectedZoneBox[] {
  if (board.zones.length > 0) {
    return board.zones.slice(0, 6).map((z, idx) => {
      const rect = preferPhotoBounds && z.photoBounds ? z.photoBounds : z.bounds2d;
      return {
        id: `det-zone-${z.id}`,
        name: z.name,
        description: z.description,
        color: z.color || '#38bdf8',
        confidence: Math.max(76, 94 - idx * 3),
        box: {
          x: Math.max(2, Math.min(82, rect.x)),
          y: Math.max(2, Math.min(82, rect.y)),
          w: Math.max(12, Math.min(65, rect.w)),
          h: Math.max(12, Math.min(65, rect.h)),
        },
        mappedZoneId: z.id,
      };
    });
  }

  if (category === 'psu') {
    return [
      {
        id: 'det-psu-hv',
        name: 'Primary HV 390V & Cầu Diode',
        description: 'Tầng chỉnh lưu sơ cấp & Active PFC điện áp cao 310V–390VDC.',
        color: '#ef4444',
        confidence: 91,
        box: { x: 8, y: 12, w: 34, h: 52 },
      },
      {
        id: 'det-psu-5vsb',
        name: '5VSB Standby & Biến Áp Xung',
        description: 'Khối nguồn cấp trước +5VSB luôn có điện khi cắm dây AC.',
        color: '#a855f7',
        confidence: 88,
        box: { x: 40, y: 45, w: 20, h: 32 },
      },
      {
        id: 'det-psu-sec',
        name: 'Secondary DC-DC & Supervisor',
        description: 'Chỉnh lưu thứ cấp +12V, mạch hạ áp +5V/+3.3V và IC giám sát PG.',
        color: '#10b981',
        confidence: 86,
        box: { x: 60, y: 15, w: 30, h: 68 },
      },
    ];
  }

  return [
    {
      id: 'det-mb-vrm',
      name: 'CPU VRM Power Stage',
      description: 'Dàn MOSFET / DrMOS + cuộn cảm cấp áp lõi VCCIN_CORE.',
      color: '#f59e0b',
      confidence: 92,
      box: { x: 10, y: 12, w: 20, h: 48 },
    },
    {
      id: 'det-mb-ram',
      name: 'RAM Power & Khe DIMM',
      description: 'Mạch nguồn VDDQ / VTT cấp cho bộ nhớ hệ thống.',
      color: '#38bdf8',
      confidence: 89,
      box: { x: 54, y: 14, w: 18, h: 46 },
    },
    {
      id: 'det-mb-pch',
      name: 'Chipset PCH & BIOS / Super I/O',
      description: 'Khối điều khiển kích nguồn RSMRST#, SLP_S3#, BIOS SPI.',
      color: '#a855f7',
      confidence: 85,
      box: { x: 54, y: 64, w: 32, h: 26 },
    },
  ];
}

function rankBoardsAndFaults(
  boards: HardwareBoard[],
  faults: FaultCase[],
  category: DeviceCategory,
  histogram: HistogramProfile,
  hintText: string,
  targetBoardOverrideId?: string
): {
  matchedBoards: BoardMatchCandidate[];
  primaryBoard: HardwareBoard;
  suggestedFaults: FaultCase[];
} {
  const hint = hintText.toLowerCase();

  const scored: BoardMatchCandidate[] = boards.map((board) => {
    let score = 40;
    const reasons: string[] = [];

    if (targetBoardOverrideId && board.id === targetBoardOverrideId) {
      score += 48;
      reasons.push('Khớp mẫu chuẩn');
    }

    if (board.category === category) {
      score += 24;
      reasons.push(`Đúng phân loại ${DEVICE_CATEGORY_META[category].shortLabel}`);
    } else {
      score -= 22;
    }

    // Match brand / model / generation tokens from user hints or OCR text
    const tokens = [board.brand, board.name, board.generation, board.id]
      .join(' ')
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .filter((t) => t.length >= 3);

    for (const token of tokens) {
      if (hint.includes(token)) {
        score += 12;
        if (!reasons.includes(`Khớp từ khóa "${token}"`)) {
          reasons.push(`Khớp từ khóa "${token}"`);
        }
      }
    }

    // Color signature matching
    const pcbLow = board.pcbColor.toLowerCase();
    if (
      (histogram.dominantPcbColor === 'brown' && (board.id.includes('tl494') || pcbLow.includes('6') || pcbLow.includes('5'))) ||
      (histogram.dominantPcbColor === 'green' && (pcbLow.includes('1029') || pcbLow.includes('145'))) ||
      (histogram.dominantPcbColor === 'blue' && (board.id.includes('h81') || pcbLow.includes('1b'))) ||
      (histogram.dominantPcbColor === 'matte_black' && (pcbLow.includes('1') || pcbLow.includes('0')))
    ) {
      score += 9;
      reasons.push(`Tương đồng màu mạch ${histogram.dominantPcbLabel}`);
    }

    return {
      board,
      score: Math.min(99, Math.max(15, score)),
      reason: reasons.length > 0 ? reasons.join(' • ') : 'Độ tương đồng hình thái tổng thể',
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const primaryBoard = scored[0]?.board ?? boards[0];

  // Rank faults matching primaryBoard and hint keywords
  const faultScored = faults
    .filter((f) => f.category === primaryBoard.category)
    .map((fault) => {
      let fScore = 0;
      if (fault.boardId === primaryBoard.id) fScore += 35;
      else if (isFaultForBoard(fault, primaryBoard)) fScore += 15;

      const textBlob = `${fault.title} ${fault.symptom} ${fault.quickFixSummary} ${fault.suspectComponentIds.join(' ')}`.toLowerCase();
      const words = hint.split(/\s+/).filter((w) => w.length >= 2);
      for (const w of words) {
        if (textBlob.includes(w)) fScore += 14;
      }

      if (histogram.charredSootRatio > 0.025 && (textBlob.includes('chập') || textBlob.includes('nổ') || textBlob.includes('cháy') || textBlob.includes('mosfet'))) {
        fScore += 18;
      }
      if (histogram.corrosionRatio > 0.015 && (textBlob.includes('sio') || textBlob.includes('lan') || textBlob.includes('rsmrst'))) {
        fScore += 18;
      }
      if (histogram.brownRatio > 0.08 && textBlob.includes('5vsb')) {
        fScore += 10;
      }

      return { fault, fScore };
    })
    .sort((a, b) => b.fScore - a.fScore);

  return {
    matchedBoards: scored.slice(0, 3),
    primaryBoard,
    suggestedFaults: faultScored.slice(0, 4).map((x) => x.fault),
  };
}

export async function runLocalVisionScan(params: {
  imageUrl: string;
  boards: HardwareBoard[];
  faults: FaultCase[];
  hintText: string;
  targetBoardOverrideId?: string;
}): Promise<ScanAnalysisResult> {
  const { imageUrl, boards, faults, hintText, targetBoardOverrideId } = params;
  const { histogram, clusters } = await extractImageFeatures(imageUrl);
  const hint = hintText.toLowerCase();

  // Heuristic category classification across all 4 hardware categories
  let psuScore = 0;
  let mbScore = 0;
  let gpuScore = 0;
  let sbcScore = 0;

  if (histogram.yellowTransformerRatio > 0.012) psuScore += 42;
  if (histogram.brownRatio > 0.08) psuScore += 28;
  if (histogram.copperGoldRatio > 0.06 && histogram.edgeDensity > 0.14) mbScore += 25;
  if (histogram.metallicRatio > 0.12) mbScore += 14;
  if (histogram.blackRatio > 0.25) mbScore += 12;

  if (/(psu|nguồn|5vsb|pfc|tl494|cầu chì|fuse|corsair|seasonic|cooler master|llc|390v)/i.test(hint)) {
    psuScore += 45;
  }
  if (/(main|mainboard|vrm|mosfet|drmos|lga|am4|ram|dimm|bios|super i\/o|rsmrst|asus|gigabyte|msi|asrock|h81|b550|b760|b660)/i.test(hint)) {
    mbScore += 45;
  }
  if (/(gtx|rtx|gpu|vga|gddr|nvvdd|fbvddq|gp102|shunt|r005|1080)/i.test(hint)) {
    gpuScore += 55;
  }
  if (/(arduino|uno|pico|rp2040|raspberry|bcm2711|mxl7704|atmega|ncp1117|gpio)/i.test(hint)) {
    sbcScore += 55;
  }

  if (targetBoardOverrideId) {
    const target = boards.find((b) => b.id === targetBoardOverrideId);
    if (target?.category === 'psu') psuScore += 75;
    if (target?.category === 'motherboard') mbScore += 75;
    if (target?.category === 'gpu') gpuScore += 75;
    if (target?.category === 'sbc_mcu') sbcScore += 75;
  }

  const catScores: Array<{ cat: DeviceCategory; score: number }> = [
    { cat: 'motherboard', score: mbScore },
    { cat: 'psu', score: psuScore },
    { cat: 'gpu', score: gpuScore },
    { cat: 'sbc_mcu', score: sbcScore },
  ];
  catScores.sort((a, b) => b.score - a.score);
  const detectedCategory: DeviceCategory = catScores[0].cat;
  const secondScore = catScores[1]?.score ?? 0;
  const confidence = Math.min(97, Math.max(71, Math.round(72 + Math.abs(catScores[0].score - secondScore) * 0.45)));

  const { matchedBoards, primaryBoard, suggestedFaults } = rankBoardsAndFaults(
    boards,
    faults,
    detectedCategory,
    histogram,
    hintText,
    targetBoardOverrideId
  );

  const isRealBoardPhoto = Boolean(primaryBoard.realPhoto && imageUrl.includes(primaryBoard.realPhoto.imageUrl.replace('./', '')));
  const detectedZones = mapZonesFromBoard(primaryBoard, detectedCategory, isRealBoardPhoto || Boolean(targetBoardOverrideId && primaryBoard.realPhoto));
  const anomalies: DetectedAnomaly[] = [];

  if (clusters.sootCells.length > 0) {
    const top = clusters.sootCells[0];
    const isLeftSide = top.gx < 5;
    anomalies.push({
      id: 'anom-soot-1',
      title:
        detectedCategory === 'psu'
          ? isLeftSide
            ? 'Phát hiện vết cháy đen / nổ linh kiện Sơ Cấp HV'
            : 'Phát hiện vùng sạm nhiệt bất thường trên PSU'
          : isLeftSide
          ? 'Nghi cháy nổ MOSFET / DrMOS khu vực VRM CPU'
          : 'Phát hiện vết cháy sém / cặn cháy gần mạch cấp nguồn',
      severity: 'critical',
      confidence: Math.min(96, Math.round(78 + top.score * 45)),
      description: `Phân tích cụm điểm ảnh tối sẫm kết hợp viền nhiệt cam-nâu (${(top.score * 100).toFixed(0)}% mật độ bất thường trong vùng lưới [${top.gx},${top.gy}]).`,
      recommendedCheck:
        detectedCategory === 'psu'
          ? 'Ngắt điện 220V, xả tụ chính qua bóng đèn sợi đốt, đo thông mạch cầu chì F1, cầu diode BD1 & MOSFET PFC bằng đồng hồ thang Diode.'
          : 'Tháo tản nhiệt VRM, đo nội trở đường 12V EPS (chân 4-8 ATX 8-pin) và đo chập D-S các MOSFET/DrMOS trước khi cấp nguồn.',
      componentHint: primaryBoard.components[0]?.id,
      box: cellToBox(top.gx, top.gy, 3, 3),
    });
  }

  if (clusters.corrosionCells.length > 0) {
    const top = clusters.corrosionCells[0];
    anomalies.push({
      id: 'anom-corr-1',
      title: 'Phát hiện oxy hóa / rỉ sét chân IC (ẩm mốc xanh-trắng)',
      severity: 'warning',
      confidence: Math.min(93, Math.round(74 + top.score * 60)),
      description: 'Cụm màu xanh lục nhạt kèm đốm muối trắng đặc trưng của mạch bị ẩm hoặc rò dung dịch quanh chân QFP/Super I/O.',
      recommendedCheck: 'Vệ sinh sạch bằng cồn IPA 99% / dung dịch rửa mạch, kiểm tra đứt mạch mạch in và đo các chân lệnh kích nguồn RSMRST#.',
      box: cellToBox(top.gx, top.gy, 3, 3),
    });
  }

  if (clusters.copperHeatCells.length > 0 && anomalies.length === 0) {
    const top = clusters.copperHeatCells[0];
    anomalies.push({
      id: 'anom-heat-1',
      title: 'Dấu hiệu quá nhiệt / đổi màu lớp phủ khu vực công suất',
      severity: 'warning',
      confidence: 82,
      description: 'Phổ màu tại vùng công suất có xu hướng ngả cam/nâu do hoạt động quá tải nhiệt dài ngày hoặc phù tụ.',
      recommendedCheck: 'Kiểm tra ESR tụ lọc xung quanh, đo dòng rò MOSFET và kiểm tra tản nhiệt / keo tản nhiệt.',
      box: cellToBox(top.gx, top.gy, 3, 3),
    });
  }

  if (anomalies.length === 0) {
    anomalies.push({
      id: 'anom-baseline',
      title: 'Không thấy vết cháy nổ lớn — Khuyến nghị đo nguội theo Rail',
      severity: 'info',
      confidence: 79,
      description: 'Bề mặt PCB tương đối sạch; lỗi có thể nằm ở tụ khô ESR cao, đứt ngầm đường mạch, mất áp cấp trước hoặc lỗi BIOS/IC điều khiển.',
      recommendedCheck:
        detectedCategory === 'psu'
          ? 'Đo điện áp cấp trước +5VSB (dây tím) và kích thử chân PS_ON# (dây xanh lá) nối mass qua bóng đèn bảo vệ.'
          : 'Đo trở kháng các cuộn dây nguồn chính (+3VALW, +5VALW, VCORE, VDDQ) ở chế độ Diode trước khi kích nguồn.',
      box: { x: 26, y: 24, w: 46, h: 48 },
    });
  }

  const safetyWarning =
    detectedCategory === 'psu'
      ? 'CẢNH BÁO CAO ÁP 320V–390V DC: Tụ lọc chính sơ cấp vẫn tích điện nguy hiểm ngay cả khi đã rút phích cắm! Luôn xả tụ qua bóng đèn sợi đốt 60W–100W trước khi chạm mạch.'
      : primaryBoard.safetyWarning;

  const visibleComponents = primaryBoard.components.slice(0, 6).map((c) => `${c.id} (${c.label})`);
  const recommendedTestPoints = primaryBoard.rails.slice(0, 5).map((r) => `${r.name}: chuẩn ${r.nominalVoltage}`);

  return {
    engineUsed: 'local',
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    detectedCategory,
    categoryLabel: DEVICE_CATEGORY_META[detectedCategory].label,
    confidence,
    brandGuess: primaryBoard.brand,
    modelGuess: primaryBoard.name,
    safetyWarning,
    summaryVi: `Local Vision Engine nhận diện nền mạch ${histogram.dominantPcbLabel} (tỷ lệ khung ${histogram.aspectRatio}, mật độ biên ${(histogram.edgeDensity * 100).toFixed(1)}%). Đối chiếu chữ ký phần cứng khớp nhất với ${primaryBoard.name} (${primaryBoard.generation}).`,
    histogram,
    matchedBoards,
    primaryBoard,
    detectedZones,
    anomalies,
    visibleComponents,
    recommendedTestPoints,
    suggestedFaults,
  };
}

export async function runGeminiVisionScan(params: {
  apiKey: string;
  imageUrl: string;
  boards: HardwareBoard[];
  faults: FaultCase[];
  hintText: string;
  targetBoardOverrideId?: string;
}): Promise<ScanAnalysisResult> {
  const { apiKey, imageUrl, boards, faults, hintText, targetBoardOverrideId } = params;
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    const localRes = await runLocalVisionScan({
      imageUrl,
      boards,
      faults,
      hintText,
      targetBoardOverrideId,
    });
    return {
      ...localRes,
      fallbackNotice: 'Chưa nhập Gemini API Key — Hệ thống tự động chạy Engine 1 (Local Computer Vision Miễn Phí 100%).',
    };
  }

  try {
    const { histogram, base64Jpeg } = await extractImageFeatures(imageUrl);

    const promptText = [
      'Bạn là kỹ sư chuyên sửa chữa Mainboard PC, Nguồn ATX (PSU), Card VGA và bo nhúng SBC.',
      'Hãy phân tích ảnh bảng mạch điện tử đính kèm và trả về DUY NHẤT JSON hợp lệ theo schema sau (bằng tiếng Việt):',
      '{',
      '  "boardCategory": "motherboard" | "psu" | "gpu" | "sbc_mcu",',
      '  "brandGuess": "tên hãng đoán được (vd ASUS, Gigabyte, MSI, ASRock, Corsair, Seasonic, Cooler Master, Generic)",',
      '  "modelGuess": "tên dòng mạch hoặc topology (vd LGA1700 B760, AM4 B550, LLC+DC-DC, TL494)",',
      '  "confidence": 85,',
      '  "pcbColor": "màu PCB",',
      '  "safetyWarning": "cảnh báo an toàn nếu là nguồn cao áp 320-390VDC hoặc để trống nếu an toàn",',
      '  "summaryVi": "tóm tắt nhận định kỹ thuật ngắn gọn 2-3 câu bằng tiếng Việt",',
      '  "visibleComponents": ["danh sách linh kiện chính nhìn thấy trên ảnh"],',
      '  "detectedZones": [{"name": "tên vùng", "description": "mô tả", "confidence": 88, "box": {"x": 10, "y": 15, "w": 30, "h": 40}}],',
      '  "suspectedAnomalies": [{"title": "tên dấu hiệu lỗi", "severity": "critical|warning|info", "confidence": 85, "description": "mô tả vết cháy/phù tụ/oxy hóa", "recommendedCheck": "cách đo kiểm bằng đồng hồ vạn năng", "componentHint": "ID linh kiện nghi ngờ", "box": {"x": 20, "y": 25, "w": 18, "h": 18}}],',
      '  "recommendedTestPoints": ["điểm đo 1 + giá trị chuẩn", "điểm đo 2"]',
      '}',
      'Lưu ý tọa độ box là phần trăm 0..100 theo khung ảnh gốc.',
      hintText.trim() ? `Ghi chú thêm của kỹ thuật viên: "${hintText.trim()}"` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(trimmedKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Jpeg,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 160)}`);
    }

    const payload = await response.json();
    const rawText: string =
      payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const cleanedJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson) as GeminiVisionJsonResponse;
    const validCategories: DeviceCategory[] = ['motherboard', 'psu', 'gpu', 'sbc_mcu'];
    const category: DeviceCategory =
      parsed.boardCategory && validCategories.includes(parsed.boardCategory)
        ? parsed.boardCategory
        : 'motherboard';
    const combinedHint = `${hintText} ${parsed.brandGuess ?? ''} ${parsed.modelGuess ?? ''} ${(parsed.visibleComponents ?? []).join(' ')}`;

    const { matchedBoards, primaryBoard, suggestedFaults } = rankBoardsAndFaults(
      boards,
      faults,
      category,
      histogram,
      combinedHint,
      targetBoardOverrideId
    );

    const clampBox = (b?: { x: number; y: number; w: number; h: number }): BoxRect => ({
      x: Math.max(2, Math.min(85, Number(b?.x ?? 20))),
      y: Math.max(2, Math.min(85, Number(b?.y ?? 20))),
      w: Math.max(10, Math.min(80, Number(b?.w ?? 25))),
      h: Math.max(10, Math.min(80, Number(b?.h ?? 25))),
    });

    const detectedZones: DetectedZoneBox[] =
      parsed.detectedZones && parsed.detectedZones.length > 0
        ? parsed.detectedZones.map((z, i) => ({
            id: `gem-zone-${i}`,
            name: z.name,
            description: z.description,
            color: ['#38bdf8', '#f59e0b', '#a855f7', '#10b981'][i % 4],
            confidence: Math.min(99, Math.max(60, Number(z.confidence ?? 86))),
            box: clampBox(z.box),
          }))
        : mapZonesFromBoard(primaryBoard, category);

    const anomalies: DetectedAnomaly[] =
      parsed.suspectedAnomalies && parsed.suspectedAnomalies.length > 0
        ? parsed.suspectedAnomalies.map((a, i) => ({
            id: `gem-anom-${i}`,
            title: a.title,
            severity: a.severity === 'critical' || a.severity === 'warning' ? a.severity : 'info',
            confidence: Math.min(99, Math.max(60, Number(a.confidence ?? 84))),
            description: a.description,
            recommendedCheck: a.recommendedCheck || 'Kiểm tra nội trở và điện áp chuẩn theo sơ đồ BoardView.',
            componentHint: a.componentHint,
            box: clampBox(a.box),
          }))
        : [
            {
              id: 'gem-anom-none',
              title: 'Chưa phát hiện hư hỏng vật lý rõ rệt trên ảnh',
              severity: 'info',
              confidence: 80,
              description: 'Gemini Vision không ghi nhận vết cháy hoặc phù tụ rõ ràng.',
              recommendedCheck: 'Chuyển sang BoardView / Chẩn Đoán Từng Bước để đo nguội các đường nguồn chính.',
              box: { x: 25, y: 25, w: 50, h: 50 },
            },
          ];

    return {
      engineUsed: 'gemini',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      detectedCategory: category,
      categoryLabel: DEVICE_CATEGORY_META[category].label,
      confidence: Math.min(99, Math.max(65, Number(parsed.confidence ?? 91))),
      brandGuess: parsed.brandGuess || primaryBoard.brand,
      modelGuess: parsed.modelGuess || primaryBoard.name,
      safetyWarning:
        parsed.safetyWarning ||
        (category === 'psu'
          ? 'CẢNH BÁO CAO ÁP 320V–390V DC: Phải xả tụ lọc sơ cấp trước khi thao tác đo nguội!'
          : undefined),
      summaryVi:
        parsed.summaryVi ||
        `Gemini 2.5 Flash đã phân tích trực tiếp hình ảnh bảng mạch và đối chiếu với kho dữ liệu ${primaryBoard.name}.`,
      histogram,
      matchedBoards,
      primaryBoard,
      detectedZones,
      anomalies,
      visibleComponents: parsed.visibleComponents ?? primaryBoard.components.slice(0, 6).map((c) => c.label),
      recommendedTestPoints:
        parsed.recommendedTestPoints ?? primaryBoard.rails.slice(0, 4).map((r) => `${r.name}: ${r.nominalVoltage}`),
      suggestedFaults,
    };
  } catch (err) {
    const localRes = await runLocalVisionScan({
      imageUrl,
      boards,
      faults,
      hintText,
      targetBoardOverrideId,
    });
    const message = err instanceof Error ? err.message : 'Lỗi kết nối Gemini API';
    return {
      ...localRes,
      fallbackNotice: `Gemini Vision API không khả dụng (${message}) — Đã tự động chuyển về Engine 1 (Local Vision Miễn Phí).`,
    };
  }
}
