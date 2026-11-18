import React, { useMemo } from 'react';
import {
  BoardComponent,
  FaultCase,
  HardwareBoard,
  PinMeasurement,
} from '../../types/circuit';

export const BOARD_VIEW_W = 1000;
export const BOARD_VIEW_H = 740;

interface RealisticPcbRendererProps {
  board: HardwareBoard;
  selectedComponentId: string | null;
  selectedPin: PinMeasurement | null;
  selectedNetId: string | null;
  activeFault: FaultCase | null;
  showZones: boolean;
  showAirwires: boolean;
  showSuspects: boolean;
  onSelectComponent: (componentId: string) => void;
  onProbePin: (component: BoardComponent, pin: PinMeasurement) => void;
}

function getPcbPalette(pcbColor: string, category: HardwareBoard['category']) {
  const c = pcbColor.toLowerCase();
  if (c.includes('1a') || c.includes('0f') || c.includes('11') || c.includes('black') || c.includes('dark')) {
    return {
      base: '#121820',
      highlight: '#1e293b',
      trace: 'rgba(148, 163, 184, 0.14)',
      silk: '#e2e8f0',
    };
  }
  if (c.includes('blue') || c.includes('1e3a') || c.includes('0284')) {
    return {
      base: '#0d2b4e',
      highlight: '#164273',
      trace: 'rgba(96, 165, 250, 0.18)',
      silk: '#f1f5f9',
    };
  }
  if (c.includes('green') || c.includes('1453') || c.includes('1665') || category === 'psu') {
    return {
      base: '#0d3b26',
      highlight: '#145335',
      trace: 'rgba(110, 231, 183, 0.16)',
      silk: '#f8fafc',
    };
  }
  if (c.includes('amber') || c.includes('brown') || c.includes('7835')) {
    return {
      base: '#3f2a14',
      highlight: '#593d1f',
      trace: 'rgba(251, 191, 36, 0.15)',
      silk: '#fef3c7',
    };
  }
  return {
    base: pcbColor || '#152232',
    highlight: '#24364d',
    trace: 'rgba(148, 163, 184, 0.15)',
    silk: '#e2e8f0',
  };
}

function getPinPadCoords(
  _comp: BoardComponent,
  pinIndex: number,
  totalPins: number,
  x: number,
  y: number,
  w: number,
  h: number
): { px: number; py: number } {
  const count = Math.max(1, totalPins);
  if (count <= 2) {
    return pinIndex === 0
      ? { px: x + w * 0.2, py: y + h * 0.5 }
      : { px: x + w * 0.8, py: y + h * 0.5 };
  }
  const half = Math.ceil(count / 2);
  if (pinIndex < half) {
    const ratio = half <= 1 ? 0.5 : (pinIndex + 0.5) / half;
    return { px: x + 2, py: y + ratio * h };
  }
  const rightCount = count - half;
  const rIdx = pinIndex - half;
  const ratio = rightCount <= 1 ? 0.5 : (rIdx + 0.5) / rightCount;
  return { px: x + w - 2, py: y + ratio * h };
}

export const RealisticPcbRenderer: React.FC<RealisticPcbRendererProps> = ({
  board,
  selectedComponentId,
  selectedPin,
  selectedNetId,
  activeFault,
  showZones,
  showAirwires,
  showSuspects,
  onSelectComponent,
  onProbePin,
}) => {
  const palette = useMemo(
    () => getPcbPalette(board.pcbColor, board.category),
    [board.pcbColor, board.category]
  );

  const suspectSet = useMemo(
    () => new Set(activeFault?.suspectComponentIds ?? []),
    [activeFault]
  );

  const selectedRail = useMemo(
    () => (selectedNetId ? board.rails.find((r) => r.id === selectedNetId) ?? null : null),
    [selectedNetId, board.rails]
  );

  // Compute OpenBoardView-style airwires for selectedNetId
  const netAirwires = useMemo(() => {
    if (!showAirwires || !selectedNetId) return [];
    const matchingNodes: Array<{ compId: string; x: number; y: number }> = [];
    const seen = new Set<string>();

    for (const comp of board.components) {
      const cx = (comp.pos2d.x / 100) * BOARD_VIEW_W;
      const cy = (comp.pos2d.y / 100) * BOARD_VIEW_H;
      const cw = Math.max(26, (comp.pos2d.w / 100) * BOARD_VIEW_W);
      const ch = Math.max(24, (comp.pos2d.h / 100) * BOARD_VIEW_H);

      const pinIdx = comp.pins.findIndex(
        (p) =>
          p.net.toLowerCase() === selectedNetId.toLowerCase() ||
          (selectedRail && p.net.toLowerCase() === selectedRail.name.toLowerCase())
      );

      const isOnRail =
        pinIdx >= 0 ||
        Boolean(selectedRail?.connectedComponents.includes(comp.id)) ||
        board.wires.some(
          (w) =>
            w.netId === selectedNetId &&
            (w.fromComponentId === comp.id || w.toComponentId === comp.id)
        );

      if (isOnRail && !seen.has(comp.id)) {
        seen.add(comp.id);
        if (pinIdx >= 0) {
          const pad = getPinPadCoords(comp, pinIdx, comp.pins.length, cx, cy, cw, ch);
          matchingNodes.push({ compId: comp.id, x: pad.px, y: pad.py });
        } else {
          matchingNodes.push({ compId: comp.id, x: cx + cw / 2, y: cy + ch / 2 });
        }
      }
    }

    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < matchingNodes.length - 1; i++) {
      segments.push({
        x1: matchingNodes[i].x,
        y1: matchingNodes[i].y,
        x2: matchingNodes[i + 1].x,
        y2: matchingNodes[i + 1].y,
      });
    }
    return { nodes: matchingNodes, segments };
  }, [showAirwires, selectedNetId, board.components, board.wires, selectedRail]);

  // Subtle decorative copper routing lines under soldermask
  const decorativeTraces = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < board.components.length - 1; i++) {
      const a = board.components[i];
      const b = board.components[i + 1];
      const ax = ((a.pos2d.x + a.pos2d.w / 2) / 100) * BOARD_VIEW_W;
      const ay = ((a.pos2d.y + a.pos2d.h / 2) / 100) * BOARD_VIEW_H;
      const bx = ((b.pos2d.x + b.pos2d.w / 2) / 100) * BOARD_VIEW_W;
      const by = ((b.pos2d.y + b.pos2d.h / 2) / 100) * BOARD_VIEW_H;
      const midX = (ax + bx) / 2;
      lines.push(`M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${by} L ${bx} ${by}`);
    }
    return lines;
  }, [board.components]);

  const renderRealisticComponentTop = (comp: BoardComponent, x: number, y: number, w: number, h: number) => {
    switch (comp.kind) {
      case 'cpu_socket':
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} rx={5} fill="url(#pcb-metal-silver)" stroke="#94a3b8" strokeWidth={2} />
            <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={3} fill="#1e293b" stroke="#cbd5e1" strokeWidth={1} />
            <rect x={x + 15} y={y + 15} width={w - 30} height={h - 30} rx={2} fill="url(#pcb-gold-pad)" opacity={0.85} />
            {/* Retention latch arm */}
            <line x1={x + w + 4} y1={y + 6} x2={x + w + 4} y2={y + h - 4} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
          </g>
        );

      case 'capacitor_elec': {
        const r = Math.max(12, Math.min(w, h) * 0.48);
        const cx = x + w / 2;
        const cy = y + h / 2;
        return (
          <g>
            <circle cx={cx + 2} cy={cy + 3} r={r} fill="rgba(0,0,0,0.45)" />
            <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke="#475569" strokeWidth={1.6} />
            <circle cx={cx} cy={cy} r={r * 0.72} fill="url(#pcb-metal-silver)" />
            {/* K-vent score lines */}
            <line x1={cx - r * 0.45} y1={cy} x2={cx + r * 0.45} y2={cy} stroke="#475569" strokeWidth={1.2} />
            <line x1={cx} y1={cy - r * 0.45} x2={cx} y2={cy + r * 0.45} stroke="#475569" strokeWidth={1.2} />
            {/* Negative white/gold stripe */}
            <path d={`M ${cx - r * 0.6} ${cy - r * 0.7} A ${r} ${r} 0 0 0 ${cx - r * 0.6} ${cy + r * 0.7}`} fill="none" stroke="#e2e8f0" strokeWidth={3} />
          </g>
        );
      }

      case 'capacitor_solid': {
        const r = Math.max(10, Math.min(w, h) * 0.44);
        const cx = x + w / 2;
        const cy = y + h / 2;
        return (
          <g>
            <circle cx={cx + 1.5} cy={cy + 2} r={r} fill="rgba(0,0,0,0.4)" />
            <circle cx={cx} cy={cy} r={r} fill="url(#pcb-metal-silver)" stroke="#64748b" strokeWidth={1.2} />
            <path d={`M ${cx - r * 0.7} ${cy - r * 0.5} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.5} Z`} fill="#2563eb" opacity={0.85} />
          </g>
        );
      }

      case 'inductor':
        return (
          <g>
            <rect x={x + 2} y={y + 3} width={w} height={h} rx={4} fill="rgba(0,0,0,0.45)" />
            <rect x={x} y={y} width={w} height={h} rx={4} fill="#334155" stroke="#64748b" strokeWidth={1.5} />
            <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={2} fill="#1e293b" />
            <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="bold" fill="#cbd5e1">
              R22
            </text>
          </g>
        );

      case 'transformer':
        return (
          <g>
            <rect x={x + 3} y={y + 4} width={w} height={h} rx={3} fill="rgba(0,0,0,0.5)" />
            {/* Ferrite E-core outer */}
            <rect x={x} y={y} width={w} height={h} rx={3} fill="#18181b" stroke="#52525b" strokeWidth={1.6} />
            {/* Yellow Mylar Tape Center Bobbin */}
            <rect x={x + w * 0.16} y={y + 4} width={w * 0.68} height={h - 8} rx={2} fill="url(#pcb-mylar-yellow)" stroke="#b45309" strokeWidth={1} />
            <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold" fill="#451a03">
              {comp.id}
            </text>
          </g>
        );

      case 'heatsink':
        return (
          <g>
            <rect x={x + 3} y={y + 4} width={w} height={h} rx={3} fill="rgba(0,0,0,0.5)" />
            <rect x={x} y={y} width={w} height={h} rx={3} fill="url(#pcb-metal-silver)" stroke="#64748b" strokeWidth={1.4} />
            {Array.from({ length: 6 }).map((_, idx) => {
              const fx = x + 6 + (idx * (w - 12)) / 5;
              return <line key={idx} x1={fx} y1={y + 3} x2={fx} y2={y + h - 3} stroke="#334155" strokeWidth={2} />;
            })}
          </g>
        );

      case 'ram_slot':
      case 'pcie_slot':
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} rx={2} fill="#0f172a" stroke="#64748b" strokeWidth={1.4} />
            <rect x={x + 3} y={y + h * 0.35} width={w - 6} height={h * 0.3} fill="#020617" stroke="#ca8a04" strokeWidth={0.8} strokeDasharray="3 2" />
            <rect x={x - 3} y={y + 2} width={5} height={h - 4} rx={1} fill="#94a3b8" />
            <rect x={x + w - 2} y={y + 2} width={5} height={h - 4} rx={1} fill="#94a3b8" />
          </g>
        );

      case 'atx_24pin':
      case 'eps_8pin':
      case 'connector':
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} rx={3} fill="#18181b" stroke="#94a3b8" strokeWidth={1.6} />
            <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={2} fill="#09090b" />
            {Array.from({ length: 4 }).map((_, idx) => (
              <circle
                key={idx}
                cx={x + 10 + (idx * Math.max(8, w - 20)) / 3}
                cy={y + h / 2}
                r={2.5}
                fill="#eab308"
              />
            ))}
          </g>
        );

      case 'fuse':
        return (
          <g>
            <rect x={x} y={y + h * 0.2} width={w} height={h * 0.6} rx={4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.4} />
            <rect x={x} y={y + h * 0.2} width={w * 0.22} height={h * 0.6} rx={2} fill="url(#pcb-metal-silver)" />
            <rect x={x + w * 0.78} y={y + h * 0.2} width={w * 0.22} height={h * 0.6} rx={2} fill="url(#pcb-metal-silver)" />
          </g>
        );

      case 'mosfet':
      case 'drmos':
        return (
          <g>
            {/* Soldered copper thermal tab */}
            <rect x={x - 2} y={y - 3} width={w + 4} height={h + 6} rx={2} fill="url(#pcb-metal-silver)" opacity={0.85} />
            {/* Epoxy QFN/DPAK package */}
            <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={2} fill="#111827" stroke="#4b5563" strokeWidth={1} />
            <circle cx={x + 7} cy={y + 7} r={1.8} fill="#9ca3af" />
          </g>
        );

      default:
        // QFP / BGA / SOIC IC Package
        return (
          <g>
            {/* Gull-wing solder leads */}
            <rect x={x - 3} y={y + 4} width={w + 6} height={h - 8} fill="url(#pcb-silver-leads)" opacity={0.7} />
            <rect x={x + 4} y={y - 3} width={w - 8} height={h + 6} fill="url(#pcb-silver-leads)" opacity={0.7} />
            {/* Matte dark epoxy IC top */}
            <rect x={x} y={y} width={w} height={h} rx={3} fill="#0f172a" stroke="#475569" strokeWidth={1.4} />
            <circle cx={x + 7} cy={y + 7} r={2.2} fill="#cbd5e1" opacity={0.85} />
          </g>
        );
    }
  };

  return (
    <svg
      width={BOARD_VIEW_W}
      height={BOARD_VIEW_H}
      viewBox={`0 0 ${BOARD_VIEW_W} ${BOARD_VIEW_H}`}
      className="block rounded-xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] select-none"
    >
      <defs>
        <linearGradient id="pcb-board-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="55%" stopColor={palette.base} />
          <stop offset="100%" stopColor="#080d14" />
        </linearGradient>
        <pattern id="pcb-weave" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0 4 L 8 4 M 4 0 L 4 8" stroke="rgba(255,255,255,0.03)" strokeWidth="0.7" />
        </pattern>
        <linearGradient id="pcb-metal-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="pcb-gold-pad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="pcb-mylar-yellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <pattern id="pcb-silver-leads" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="#cbd5e1" />
        </pattern>
        <pattern id="hv-hazard" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="16" fill="#eab308" opacity={0.45} />
          <rect x="8" width="8" height="16" fill="#18181b" opacity={0.65} />
        </pattern>
      </defs>

      {/* Main PCB Substrate */}
      <rect
        x={12}
        y={12}
        width={BOARD_VIEW_W - 24}
        height={BOARD_VIEW_H - 24}
        rx={14}
        fill="url(#pcb-board-grad)"
        stroke="#475569"
        strokeWidth={2.5}
      />
      <rect
        x={12}
        y={12}
        width={BOARD_VIEW_W - 24}
        height={BOARD_VIEW_H - 24}
        rx={14}
        fill="url(#pcb-weave)"
      />

      {/* Copper Traces Beneath Soldermask */}
      <g>
        {decorativeTraces.map((d, idx) => (
          <path
            key={idx}
            d={d}
            fill="none"
            stroke={palette.trace}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Corner Brass Standoff Mounting Holes */}
      {[
        { cx: 36, cy: 36 },
        { cx: BOARD_VIEW_W - 36, cy: 36 },
        { cx: 36, cy: BOARD_VIEW_H - 36 },
        { cx: BOARD_VIEW_W - 36, cy: BOARD_VIEW_H - 36 },
        { cx: BOARD_VIEW_W / 2, cy: 36 },
        { cx: BOARD_VIEW_W / 2, cy: BOARD_VIEW_H - 36 },
      ].map((hole, idx) => (
        <g key={idx}>
          <circle cx={hole.cx} cy={hole.cy} r={12} fill="url(#pcb-gold-pad)" opacity={0.9} />
          <circle cx={hole.cx} cy={hole.cy} r={6.2} fill="#030712" stroke="#78350f" strokeWidth={1.5} />
        </g>
      ))}

      {/* PSU High-Voltage Primary / Secondary Isolation Trench */}
      {board.category === 'psu' && (
        <g>
          <rect
            x={BOARD_VIEW_W * 0.46}
            y={30}
            width={16}
            height={BOARD_VIEW_H - 60}
            rx={4}
            fill="#020617"
            stroke="#facc15"
            strokeWidth={1.4}
            strokeDasharray="6 4"
          />
          <rect
            x={BOARD_VIEW_W * 0.46 - 4}
            y={36}
            width={24}
            height={BOARD_VIEW_H - 72}
            fill="url(#hv-hazard)"
            opacity={0.4}
          />
          <text
            x={BOARD_VIEW_W * 0.46 + 8}
            y={BOARD_VIEW_H / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${BOARD_VIEW_W * 0.46 + 8} ${BOARD_VIEW_H / 2})`}
            fontSize={11}
            fontWeight="bold"
            fontFamily="monospace"
            fill="#fde047"
          >
            ⚡ RÃNH CÁCH LY CAO ÁP SƠ CẤP 390VDC — CẤM CHẠM TAY ⚡
          </text>
        </g>
      )}

      {/* Board Silkscreen Name & Spec Stamp */}
      <text x={58} y={42} fontSize={13} fontWeight="bold" fontFamily="monospace" fill={palette.silk} opacity={0.8}>
        {board.brand.toUpperCase()} · {board.name.toUpperCase()} ({board.formFactor})
      </text>

      {/* Functional Zone Overlays */}
      {showZones &&
        board.zones.map((zone) => {
          const zx = (zone.bounds2d.x / 100) * BOARD_VIEW_W;
          const zy = (zone.bounds2d.y / 100) * BOARD_VIEW_H;
          const zw = (zone.bounds2d.w / 100) * BOARD_VIEW_W;
          const zh = (zone.bounds2d.h / 100) * BOARD_VIEW_H;
          return (
            <g key={zone.id}>
              <rect
                x={zx}
                y={zy}
                width={zw}
                height={zh}
                rx={8}
                fill={zone.color}
                fillOpacity={0.11}
                stroke={zone.color}
                strokeWidth={1.4}
                strokeDasharray="6 3"
              />
              <rect x={zx + 6} y={zy - 9} width={Math.min(zw - 12, zone.name.length * 7 + 16)} height={18} rx={4} fill="#020617" stroke={zone.color} strokeWidth={1} />
              <text x={zx + 14} y={zy + 3} fontSize={10} fontWeight="600" fontFamily="sans-serif" fill="#f8fafc">
                {zone.name}
              </text>
            </g>
          );
        })}

      {/* Board Components */}
      {board.components.map((comp) => {
        const x = (comp.pos2d.x / 100) * BOARD_VIEW_W;
        const y = (comp.pos2d.y / 100) * BOARD_VIEW_H;
        const w = Math.max(30, (comp.pos2d.w / 100) * BOARD_VIEW_W);
        const h = Math.max(26, (comp.pos2d.h / 100) * BOARD_VIEW_H);
        const isSelected = selectedComponentId === comp.id;
        const isSuspect = showSuspects && suspectSet.has(comp.id);

        return (
          <g
            key={comp.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectComponent(comp.id);
              if (comp.pins.length > 0) {
                onProbePin(comp, comp.pins[0]);
              }
            }}
          >
            {/* Suspect fault pulsing hotspot */}
            {isSuspect && (
              <rect
                x={x - 8}
                y={y - 8}
                width={w + 16}
                height={h + 16}
                rx={8}
                fill="rgba(244, 63, 94, 0.16)"
                stroke="#f43f5e"
                strokeWidth={2.2}
                strokeDasharray="5 3"
              >
                <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
              </rect>
            )}

            {/* Selected outline */}
            {isSelected && (
              <rect
                x={x - 5}
                y={y - 5}
                width={w + 10}
                height={h + 10}
                rx={6}
                fill="rgba(56, 189, 248, 0.14)"
                stroke="#38bdf8"
                strokeWidth={2}
              />
            )}

            {renderRealisticComponentTop(comp, x, y, w, h)}

            {/* Silkscreen Designator */}
            <text
              x={x + w / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize={9.5}
              fontWeight="bold"
              fontFamily="monospace"
              fill={isSuspect ? '#fda4af' : isSelected ? '#7dd3fc' : palette.silk}
            >
              {comp.id}
            </text>

            {/* Clickable Probe Pads for each Pin */}
            {comp.pins.map((pin, idx) => {
              const { px, py } = getPinPadCoords(comp, idx, comp.pins.length, x, y, w, h);
              const isPinActive = isSelected && selectedPin?.pin === pin.pin;
              const isPinNet =
                Boolean(selectedNetId) &&
                (pin.net.toLowerCase() === selectedNetId?.toLowerCase() ||
                  (selectedRail && pin.net.toLowerCase() === selectedRail.name.toLowerCase()));

              return (
                <g
                  key={`${pin.pin}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComponent(comp.id);
                    onProbePin(comp, pin);
                  }}
                >
                  <circle
                    cx={px}
                    cy={py}
                    r={isPinActive ? 6 : isPinNet ? 5.2 : 3.8}
                    fill={
                      isPinActive
                        ? '#facc15'
                        : isPinNet
                        ? '#22d3ee'
                        : '#d97706'
                    }
                    stroke="#020617"
                    strokeWidth={1.2}
                  />
                  {isPinActive && (
                    <circle
                      cx={px}
                      cy={py}
                      r={10}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth={1.5}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* OpenBoardView / FlexBV Style Net Continuity Airwires */}
      {showAirwires && selectedNetId && netAirwires && 'segments' in netAirwires && (
        <g pointerEvents="none">
          {netAirwires.segments.map((seg, i) => (
            <g key={i}>
              <line
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#facc15"
                strokeWidth={4}
                opacity={0.3}
              />
              <line
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="7 5"
              />
            </g>
          ))}
          {netAirwires.nodes.map((node) => (
            <g key={node.compId}>
              <circle cx={node.x} cy={node.y} r={7.5} fill="none" stroke="#facc15" strokeWidth={2.2} />
              <circle cx={node.x} cy={node.y} r={3} fill="#facc15" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};
