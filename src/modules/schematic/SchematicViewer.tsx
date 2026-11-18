import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Cpu,
  ExternalLink,
  Eye,
  FileText,
  FileWarning,
  Filter,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Moon,
  RotateCcw,
  Search,
  Stethoscope,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BoardComponent,
  ModuleSharedProps,
  PinMeasurement,
  PowerRailNet,
  SchematicWire,
} from '../../types/circuit';
import { SCHEMATIC_STATUS_META } from '../../components/circuitLabels';
import { getComponentPinAnchor, SchematicSymbol } from './SchematicSymbols';
import { OscilloscopeDrawer } from './OscilloscopeDrawer';

const SHEET_W = 1280;
const SHEET_H = 820;

const CATEGORY_LABELS: Record<PowerRailNet['category'], string> = {
  standby: 'Nguồn Cấp Trước (Standby)',
  main_power: 'Nguồn Chính (+12V/+5V/+3.3V)',
  core_power: 'Nguồn Lõi (VCore / DRAM)',
  control_signal: 'Tín Hiệu Điều Khiển',
  high_voltage: 'Cao Áp (HV 320-390V)',
  ground: 'Mass (GND)',
};

function buildOrthogonalPath(
  wire: SchematicWire,
  fromComp: BoardComponent | undefined,
  toComp: BoardComponent | undefined,
  wireIndex: number
): { d: string; points: Array<{ x: number; y: number }>; mid: { x: number; y: number } } {
  if (!fromComp || !toComp) {
    return { d: '', points: [], mid: { x: 0, y: 0 } };
  }

  const dx = toComp.schematicPos.x - fromComp.schematicPos.x;
  const dy = toComp.schematicPos.y - fromComp.schematicPos.y;

  const defaultFromSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top';
  const defaultToSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'left' : 'right') : dy >= 0 ? 'top' : 'bottom';

  const start = getComponentPinAnchor(fromComp, wire.fromPin || wire.netId, defaultFromSide);
  const end = getComponentPinAnchor(toComp, wire.toPin || wire.netId, defaultToSide);

  let pts: Array<{ x: number; y: number }> = [start];

  if (wire.waypoints && wire.waypoints.length > 0) {
    for (const wp of wire.waypoints) {
      const prev = pts[pts.length - 1];
      if (Math.abs(prev.x - wp.x) > 1 && Math.abs(prev.y - wp.y) > 1) {
        pts.push({ x: wp.x, y: prev.y });
      }
      pts.push(wp);
    }
    const last = pts[pts.length - 1];
    if (Math.abs(last.x - end.x) > 1 && Math.abs(last.y - end.y) > 1) {
      pts.push({ x: end.x, y: last.y });
    }
    pts.push(end);
  } else {
    // Clean orthogonal Manhattan auto-step with slight stagger per wireIndex to prevent overlap
    const stagger = ((wireIndex % 5) - 2) * 10;
    if (start.side === 'left' || start.side === 'right') {
      const midX = (start.x + end.x) / 2 + stagger;
      if ((start.side === 'right' && end.x < start.x) || (start.side === 'left' && end.x > start.x)) {
        // Loop back cleanly around components
        const exitX = start.side === 'right' ? start.x + 28 : start.x - 28;
        const enterX = end.side === 'left' ? end.x - 28 : end.x + 28;
        const routeY = Math.min(start.y, end.y) - 48 + stagger;
        pts.push({ x: exitX, y: start.y }, { x: exitX, y: routeY }, { x: enterX, y: routeY }, { x: enterX, y: end.y }, end);
      } else {
        pts.push({ x: midX, y: start.y }, { x: midX, y: end.y }, end);
      }
    } else {
      const midY = (start.y + end.y) / 2 + stagger;
      pts.push({ x: start.x, y: midY }, { x: end.x, y: midY }, end);
    }
  }

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const midIdx = Math.floor(pts.length / 2);
  const a = pts[Math.max(0, midIdx - 1)];
  const b = pts[Math.min(pts.length - 1, midIdx)];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  return { d, points: pts, mid };
}

export const SchematicViewer: React.FC<ModuleSharedProps> = ({
  selectedBoard,
  selectedComponentId,
  onSelectComponent,
  selectedNetId,
  onSelectNet,
  activeFault,
  onNavigateMode,
  powerSequences,
  embedded = false,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState({ x: 24, y: 18, scale: 0.84 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  const [hoveredComponent, setHoveredComponent] = useState<BoardComponent | null>(null);
  const [selectedPin, setSelectedPin] = useState<PinMeasurement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PowerRailNet['category'] | 'all'>('all');
  const [showMiniMap, setShowMiniMap] = useState(!embedded);
  const [animatePulse, setAnimatePulse] = useState(true);
  const [paperMode, setPaperMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const componentMap = useMemo(() => {
    const map = new Map<string, BoardComponent>();
    for (const c of selectedBoard.components) {
      map.set(c.id, c);
    }
    return map;
  }, [selectedBoard.components]);

  const railMap = useMemo(() => {
    const map = new Map<string, PowerRailNet>();
    for (const r of selectedBoard.rails) {
      map.set(r.id, r);
    }
    return map;
  }, [selectedBoard.rails]);

  const selectedComponent = useMemo(
    () => (selectedComponentId ? componentMap.get(selectedComponentId) ?? null : null),
    [selectedComponentId, componentMap]
  );

  const selectedNet = useMemo(
    () => (selectedNetId ? railMap.get(selectedNetId) ?? null : null),
    [selectedNetId, railMap]
  );

  const matchedPowerSequence = useMemo(() => {
    if (!selectedBoard.powerSequenceId) return powerSequences[0] ?? null;
    return (
      powerSequences.find((s) => s.id === selectedBoard.powerSequenceId) ??
      powerSequences[0] ??
      null
    );
  }, [selectedBoard.powerSequenceId, powerSequences]);

  // Fit-to-screen calculation
  const fitToScreen = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 40) return;
    const scaleX = (rect.width - 36) / SHEET_W;
    const scaleY = (rect.height - 36) / SHEET_H;
    const nextScale = Math.max(0.35, Math.min(1.5, Math.min(scaleX, scaleY)));
    const nextX = (rect.width - SHEET_W * nextScale) / 2;
    const nextY = (rect.height - SHEET_H * nextScale) / 2;
    setTransform({ x: nextX, y: nextY, scale: nextScale });
  }, []);

  useEffect(() => {
    fitToScreen();
  }, [selectedBoard.id, fitToScreen]);

  // Reset selected pin when changing component
  useEffect(() => {
    if (selectedComponent && selectedComponent.pins.length > 0) {
      setSelectedPin(selectedComponent.pins[0]);
    } else {
      setSelectedPin(null);
    }
  }, [selectedComponentId]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setTransform((prev) => {
      const nextScale = Math.max(0.3, Math.min(2.6, prev.scale * zoomFactor));
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: cursorX - (cursorX - prev.x) * ratio,
        y: cursorY - (cursorY - prev.y) * ratio,
      };
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.mx;
    const dy = e.clientY - panStartRef.current.my;
    setTransform((prev) => ({
      ...prev,
      x: panStartRef.current.tx + dx,
      y: panStartRef.current.ty + dy,
    }));
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const handleZoomBy = (factor: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTransform((prev) => {
      const nextScale = Math.max(0.3, Math.min(2.6, prev.scale * factor));
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
    });
  };

  // Connected component IDs for selectedNetId
  const netConnectedComponents = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNetId) return set;
    const rail = railMap.get(selectedNetId);
    if (rail) {
      rail.connectedComponents.forEach((id) => set.add(id));
    }
    for (const w of selectedBoard.wires) {
      if (w.netId === selectedNetId) {
        set.add(w.fromComponentId);
        set.add(w.toComponentId);
      }
    }
    return set;
  }, [selectedNetId, railMap, selectedBoard.wires]);

  // Filtered rails for legend
  const visibleRails = useMemo(() => {
    if (categoryFilter === 'all') return selectedBoard.rails;
    return selectedBoard.rails.filter((r) => r.category === categoryFilter);
  }, [selectedBoard.rails, categoryFilter]);

  const suspectSet = useMemo(
    () => new Set(activeFault?.suspectComponentIds ?? []),
    [activeFault]
  );

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      selectedBoard.components
        .filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q) ||
            (c.partNumber ?? '').toLowerCase().includes(q)
        )
        .map((c) => c.id)
    );
  }, [searchQuery, selectedBoard.components]);

  const handleSelectPin = (compId: string, pin: PinMeasurement) => {
    onSelectComponent(compId);
    setSelectedPin(pin);
    // Also match net if found
    const matchingRail = selectedBoard.rails.find(
      (r) =>
        r.id.toLowerCase() === pin.net.toLowerCase() ||
        r.name.toLowerCase() === pin.net.toLowerCase()
    );
    if (matchingRail) {
      onSelectNet(matchingRail.id);
    }
  };

  const schStatusMeta = selectedBoard.docsMeta
    ? SCHEMATIC_STATUS_META[selectedBoard.docsMeta.schematicStatus]
    : null;
  const isSchematicUnavailable =
    selectedBoard.docsMeta?.schematicStatus === 'unavailable' ||
    selectedBoard.wires.length === 0;

  if (isSchematicUnavailable) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/90 text-slate-100 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200">
              <FileWarning className="h-3.5 w-3.5 text-amber-400" />
              <span>Sơ Đồ Nguyên Lý</span>
            </div>
            {schStatusMeta && (
              <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${schStatusMeta.badgeClass}`}>
                {schStatusMeta.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/10 text-amber-300">
            <FileWarning className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Để Trống Sơ Đồ Nguyên Lý — {selectedBoard.name}
          </h3>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-400">
            {selectedBoard.docsMeta?.missingDataNote ||
              'Nhà sản xuất bảo mật hoàn toàn Schematic và BoardView gốc của bo mạch này. Ứng dụng để trống để tuân thủ nguyên tắc trung thực kỹ thuật (không tự suy diễn hoặc bịa sơ đồ).'}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {!embedded && (
              <button
                type="button"
                onClick={() => onNavigateMode('boardview')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Xem Trên Ảnh Thực Tế PCB</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateMode('diagnostics')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/50 transition-colors"
            >
              <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
              <span>Quy Trình Chẩn Đoán Khối Nguồn</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-700/70 overflow-hidden shadow-xl">
      {/* Inline SVG Animation Keyframes */}
      <style>{`
        @keyframes cmFlowPulse {
          from { stroke-dashoffset: 48; }
          to { stroke-dashoffset: 0; }
        }
        .cm-wire-pulse {
          animation: cmFlowPulse 1.35s linear infinite;
        }
        .cm-wire-pulse-fast {
          animation: cmFlowPulse 0.75s linear infinite;
        }
      `}</style>

      {/* Top Engineering CAD Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/95 border-b border-slate-800/90">
        <div className="flex items-center gap-2 flex-wrap">
          {!embedded && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Sơ Đồ Nguyên Lý EDA</span>
            </div>
          )}

          {schStatusMeta && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${schStatusMeta.badgeClass}`}
              title={selectedBoard.docsMeta?.schematicSourceLabel}
            >
              <span>{schStatusMeta.shortLabel}</span>
              {selectedBoard.docsMeta?.schematicSourceUrl && (
                <a
                  href={selectedBoard.docsMeta.schematicSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline inline-flex items-center"
                  title="Mở tài liệu Schematic gốc"
                >
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}
            </span>
          )}

          {/* Search Component */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm linh kiện..."
              className="pl-7 pr-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
            />
          </div>

          {/* Category Filter */}
          {!embedded && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as PowerRailNet['category'] | 'all')}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Tất cả đường nguồn ({selectedBoard.rails.length})</option>
                {(Object.keys(CATEGORY_LABELS) as PowerRailNet['category'][]).map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedNetId && (
            <button
              type="button"
              onClick={() => onSelectNet(null)}
              className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs flex items-center gap-1 hover:bg-amber-500/30"
            >
              <span>Net: {selectedNet?.name ?? selectedNetId}</span>
              <span className="font-bold ml-1">×</span>
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaperMode((v) => !v)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1 transition-colors ${
              paperMode
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title="Chuyển nền bản vẽ: Giấy Trắng PDF (dễ đọc) ↔ Nền Tối CAD"
          >
            {paperMode ? <FileText className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{paperMode ? 'Giấy PDF' : 'Tối CAD'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAnimatePulse((v) => !v)}
            className={`px-2 py-1 rounded text-xs border transition-colors ${
              animatePulse
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Bật/tắt xung dòng điện chạy trên mạch"
          >
            {animatePulse ? '⚡ Xung' : '⚡ Tĩnh'}
          </button>

          <button
            type="button"
            onClick={() => setShowMiniMap((v) => !v)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
              showMiniMap
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mini-map</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => handleZoomBy(0.85)}
              className="p-1.5 hover:bg-slate-800 text-slate-300"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 border-x border-slate-800">
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoomBy(1.18)}
              className="p-1.5 hover:bg-slate-800 text-slate-300"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1.5 hover:bg-slate-800 text-cyan-300 border-l border-slate-800"
              title="Vừa màn hình (Fit to Screen)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {!embedded && (
            <>
              {selectedBoard.supports3DSimulation !== false && (
                <button
                  type="button"
                  onClick={() => onNavigateMode('viewer3d')}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateMode('boardview')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>BoardView</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rail Quick-Filter Chips Bar (Hidden in embedded Workbench mode to avoid repeating TopBar strip) */}
      {!embedded && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 border-b border-slate-800/70 overflow-x-auto">
          <span className="text-[11px] text-slate-400 shrink-0 mr-1">Đường nguồn:</span>
          {visibleRails.map((rail) => {
            const isSelected = selectedNetId === rail.id;
            const isFaultRail = activeFault?.affectedRails.some(
              (r) => r.toLowerCase() === rail.id.toLowerCase() || r.toLowerCase() === rail.name.toLowerCase()
            );
            return (
              <button
                key={rail.id}
                type="button"
                onClick={() => onSelectNet(isSelected ? null : rail.id)}
                className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-white/70 text-white shadow'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: rail.color, boxShadow: `0 0 6px ${rail.color}` }}
                />
                <span>{rail.name}</span>
                <span className="text-slate-500">{rail.nominalVoltage}</span>
                {isFaultRail && <AlertTriangle className="w-3 h-3 text-rose-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Main CAD Viewport */}
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => {
          onSelectComponent(null);
        }}
        className={`${paperMode ? 'bg-slate-200' : 'cm-preserve-dark bg-[#060d18]'} relative flex-1 overflow-hidden ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: SHEET_W,
            height: SHEET_H,
          }}
          className="relative select-none"
        >
          <svg
            width={SHEET_W}
            height={SHEET_H}
            viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
            className={`block shadow-xl border ${
              paperMode
                ? 'border-slate-300 bg-[#fdfcf8]'
                : 'border-cyan-500/40 bg-[#071121]'
            }`}
          >
            <defs>
              <pattern id="cm-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke={paperMode ? 'rgba(15, 23, 42, 0.06)' : 'rgba(56, 189, 248, 0.06)'}
                  strokeWidth="0.8"
                />
              </pattern>
              <pattern id="cm-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#cm-grid-minor)" />
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke={paperMode ? 'rgba(15, 23, 42, 0.13)' : 'rgba(56, 189, 248, 0.14)'}
                  strokeWidth="1"
                />
              </pattern>
              <filter id="cm-wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* CAD Grid Background */}
            <rect width={SHEET_W} height={SHEET_H} fill="url(#cm-grid-major)" />

            {/* Outer Engineering Border & Coordinate Ticks */}
            <rect
              x={16}
              y={16}
              width={SHEET_W - 32}
              height={SHEET_H - 32}
              fill="none"
              stroke={paperMode ? '#334155' : '#1e40af'}
              strokeWidth={1.6}
            />
            <rect
              x={24}
              y={24}
              width={SHEET_W - 48}
              height={SHEET_H - 48}
              fill="none"
              stroke={paperMode ? 'rgba(51, 65, 85, 0.35)' : 'rgba(56, 189, 248, 0.3)'}
              strokeWidth={0.9}
            />

            {['1', '2', '3', '4', '5', '6'].map((col, idx) => (
              <text
                key={col}
                x={120 + idx * 205}
                y={13}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                fill="#64748b"
              >
                {col}
              </text>
            ))}
            {['A', 'B', 'C', 'D'].map((row, idx) => (
              <text
                key={row}
                x={10}
                y={120 + idx * 195}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                fill="#64748b"
              >
                {row}
              </text>
            ))}

            {/* Orthogonal Animated Net Wires */}
            <g>
              {selectedBoard.wires.map((wire, idx) => {
                const rail = railMap.get(wire.netId);
                const fromComp = componentMap.get(wire.fromComponentId);
                const toComp = componentMap.get(wire.toComponentId);
                const { d, points, mid } = buildOrthogonalPath(wire, fromComp, toComp, idx);
                if (!d) return null;

                const matchesCategory =
                  categoryFilter === 'all' || rail?.category === categoryFilter;
                const isWireSelected = selectedNetId === wire.netId;
                const isDimmed =
                  !matchesCategory || (Boolean(selectedNetId) && !isWireSelected);
                const color = rail?.color ?? '#38bdf8';
                const isFast =
                  rail?.category === 'core_power' ||
                  rail?.category === 'main_power' ||
                  rail?.category === 'high_voltage';

                return (
                  <g
                    key={wire.id}
                    className="cursor-pointer"
                    style={{
                      opacity: isDimmed ? 0.16 : 1,
                      transition: 'opacity 180ms ease',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNet(isWireSelected ? null : wire.netId);
                    }}
                  >
                    {/* Wide invisible hit target for easy wire clicking */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={12} />

                    {/* Base solid copper/signal trace */}
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={isWireSelected ? 3.2 : 2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isWireSelected ? 'url(#cm-wire-glow)' : undefined}
                      opacity={0.72}
                    />

                    {/* Animated current-flow pulse */}
                    {animatePulse && !isDimmed && (
                      <path
                        d={d}
                        fill="none"
                        stroke={paperMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={isWireSelected ? 2.0 : 1.2}
                        strokeDasharray="6 18"
                        strokeLinecap="round"
                        className={isFast ? 'cm-wire-pulse-fast' : 'cm-wire-pulse'}
                        opacity={paperMode ? (isWireSelected ? 0.65 : 0.35) : isWireSelected ? 0.95 : 0.65}
                      />
                    )}

                    {/* Junction dots at endpoints */}
                    {points.length >= 2 && (
                      <>
                        <circle cx={points[0].x} cy={points[0].y} r={2.8} fill={color} />
                        <circle
                          cx={points[points.length - 1].x}
                          cy={points[points.length - 1].y}
                          r={2.8}
                          fill={color}
                        />
                      </>
                    )}

                    {/* Wire Net Label Tag */}
                    {(!isDimmed || isWireSelected) && rail && (
                      <g transform={`translate(${mid.x}, ${mid.y})`}>
                        <rect
                          x={-28}
                          y={-9}
                          width={56}
                          height={16}
                          rx={3}
                          fill={paperMode ? '#ffffff' : '#050d1a'}
                          stroke={color}
                          strokeWidth={isWireSelected ? 1.4 : 0.8}
                          opacity={0.95}
                        />
                        <text
                          x={0}
                          y={2}
                          textAnchor="middle"
                          fontSize={7.5}
                          fontFamily="monospace"
                          fontWeight={isWireSelected ? '700' : '600'}
                          fill={paperMode ? '#0f172a' : color}
                        >
                          {rail.name.slice(0, 10)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Electronic Schematic Symbols */}
            <g>
              {selectedBoard.components.map((comp) => {
                const isSelected = selectedComponentId === comp.id;
                const isSuspect = suspectSet.has(comp.id);
                const isNetHighlighted =
                  Boolean(selectedNetId) && netConnectedComponents.has(comp.id);
                const isSearchHit = searchMatches.size > 0 && searchMatches.has(comp.id);

                const isDimmed =
                  (Boolean(selectedNetId) && !isNetHighlighted && !isSelected) ||
                  (searchMatches.size > 0 && !isSearchHit);

                return (
                  <SchematicSymbol
                    key={comp.id}
                    component={comp}
                    isSelected={isSelected || isSearchHit}
                    isSuspect={isSuspect}
                    isNetHighlighted={isNetHighlighted}
                    isDimmed={isDimmed}
                    selectedPinName={selectedPin?.pin ?? null}
                    highlightedNetId={selectedNetId}
                    paperMode={paperMode}
                    onSelectComponent={onSelectComponent}
                    onSelectPin={handleSelectPin}
                    onHover={setHoveredComponent}
                  />
                );
              })}
            </g>

            {/* Engineering CAD Title Block (Bottom Right) */}
            <g transform={`translate(${SHEET_W - 355}, ${SHEET_H - 102})`}>
              <rect
                width={326}
                height={74}
                fill={paperMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(5, 13, 28, 0.94)'}
                stroke={paperMode ? '#334155' : '#38bdf8'}
                strokeWidth={1.2}
              />
              <line x1={0} y1={24} x2={326} y2={24} stroke={paperMode ? '#cbd5e1' : 'rgba(56, 189, 248, 0.45)'} strokeWidth={1} />
              <line x1={0} y1={48} x2={326} y2={48} stroke={paperMode ? '#cbd5e1' : 'rgba(56, 189, 248, 0.45)'} strokeWidth={1} />
              <line x1={210} y1={24} x2={210} y2={74} stroke={paperMode ? '#cbd5e1' : 'rgba(56, 189, 248, 0.45)'} strokeWidth={1} />

              <text x={10} y={16} fontSize={10.5} fontWeight="bold" fontFamily="monospace" fill={paperMode ? '#0369a1' : '#38bdf8'}>
                CIRCUITMEDIC EDA · {selectedBoard.name.toUpperCase()}
              </text>
              <text x={10} y={39} fontSize={9} fontFamily="monospace" fill={paperMode ? '#1e293b' : '#cbd5e1'}>
                HÃNG: {selectedBoard.brand} · {selectedBoard.generation}
              </text>
              <text x={10} y={64} fontSize={8.5} fontFamily="monospace" fill={paperMode ? '#475569' : '#94a3b8'}>
                FORM: {selectedBoard.formFactor} · {selectedBoard.components.length} LK · {selectedBoard.wires.length} NETS
              </text>
              <text x={220} y={39} fontSize={9} fontFamily="monospace" fill={paperMode ? '#b45309' : '#fbbf24'}>
                {schStatusMeta?.shortLabel ?? 'EDA'}
              </text>
              <text x={220} y={64} fontSize={8.5} fontFamily="monospace" fill={paperMode ? '#047857' : '#34d399'}>
                SHEET: 1 / 1
              </text>
            </g>
          </svg>
        </div>

        {/* Floating Hover Tooltip */}
        {hoveredComponent && (
          <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-xs rounded-lg border border-cyan-500/40 bg-slate-950/95 px-3 py-2 shadow-xl backdrop-blur-md text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-cyan-300">
                {hoveredComponent.id}
                {hoveredComponent.partNumber ? ` (${hoveredComponent.partNumber})` : ''}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 uppercase">
                {hoveredComponent.kind}
              </span>
            </div>
            <div className="font-medium text-slate-100 mt-0.5">{hoveredComponent.label}</div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              {hoveredComponent.description}
            </div>
            {hoveredComponent.pins.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex flex-wrap gap-1.5 text-[10px] font-mono">
                {hoveredComponent.pins.slice(0, 3).map((p) => (
                  <span key={p.pin} className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300">
                    {p.name}: {p.expectedVoltage}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Fault Floating Banner */}
        {activeFault && (
          <div className="cm-preserve-dark absolute top-3 right-3 z-20 max-w-xs rounded-lg border border-rose-500/50 bg-rose-950/90 px-3 py-2 text-xs text-rose-100 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5 font-semibold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{activeFault.title}</span>
            </div>
            <div className="text-[11px] text-rose-200/90 mt-0.5">
              Nghi phạm: {activeFault.suspectComponentIds.join(', ')}
            </div>
          </div>
        )}

        {/* Mini-Map Overview */}
        {showMiniMap && (
          <div className="cm-preserve-dark hidden sm:block absolute bottom-3 right-3 z-20 w-44 rounded-lg border border-cyan-500/35 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-1">
              <span>Mini-map</span>
              <button
                type="button"
                onClick={fitToScreen}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>
            <svg viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} className="w-full h-24 bg-[#071121] rounded border border-slate-800">
              {selectedBoard.wires.map((w, i) => {
                const fc = componentMap.get(w.fromComponentId);
                const tc = componentMap.get(w.toComponentId);
                if (!fc || !tc) return null;
                const rail = railMap.get(w.netId);
                return (
                  <line
                    key={`${w.id}-${i}`}
                    x1={fc.schematicPos.x}
                    y1={fc.schematicPos.y}
                    x2={tc.schematicPos.x}
                    y2={tc.schematicPos.y}
                    stroke={rail?.color ?? '#38bdf8'}
                    strokeWidth={4}
                    opacity={0.55}
                  />
                );
              })}
              {selectedBoard.components.map((c) => (
                <circle
                  key={c.id}
                  cx={c.schematicPos.x}
                  cy={c.schematicPos.y}
                  r={suspectSet.has(c.id) ? 18 : 11}
                  fill={suspectSet.has(c.id) ? '#f43f5e' : selectedComponentId === c.id ? '#38bdf8' : '#cbd5e1'}
                />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Integrated Bottom Oscilloscope & Power Sequence Drawer */}
      <OscilloscopeDrawer
        board={selectedBoard}
        selectedComponent={selectedComponent}
        selectedPin={selectedPin}
        selectedNet={selectedNet}
        activeFault={activeFault}
        powerSequence={matchedPowerSequence}
        onSelectNet={onSelectNet}
        onSelectPin={(pin) => setSelectedPin(pin)}
        defaultOpen={!embedded}
      />
    </div>
  );
};
