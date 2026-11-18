import React from 'react';
import { BoardComponent, ComponentKind, PinMeasurement } from '../../types/circuit';

export interface SchematicSymbolProps {
  component: BoardComponent;
  isSelected: boolean;
  isSuspect: boolean;
  isNetHighlighted: boolean;
  isDimmed: boolean;
  selectedPinName?: string | null;
  highlightedNetId?: string | null;
  paperMode?: boolean;
  onSelectComponent: (componentId: string) => void;
  onSelectPin: (componentId: string, pin: PinMeasurement) => void;
  onHover?: (component: BoardComponent | null) => void;
}

export interface PinAnchor {
  x: number;
  y: number;
  side: 'left' | 'right' | 'top' | 'bottom';
}

const COMP_BOX_DIMS: Record<ComponentKind, { w: number; h: number }> = {
  cpu_socket: { w: 130, h: 120 },
  chipset: { w: 112, h: 96 },
  pwm_ic: { w: 112, h: 88 },
  super_io: { w: 114, h: 96 },
  bios_chip: { w: 96, h: 72 },
  ic: { w: 104, h: 80 },
  ram_slot: { w: 106, h: 76 },
  pcie_slot: { w: 110, h: 72 },
  atx_24pin: { w: 102, h: 92 },
  eps_8pin: { w: 92, h: 68 },
  connector: { w: 92, h: 68 },
  mosfet: { w: 72, h: 72 },
  drmos: { w: 84, h: 78 },
  inductor: { w: 76, h: 52 },
  capacitor_solid: { w: 56, h: 60 },
  capacitor_elec: { w: 56, h: 64 },
  resistor: { w: 72, h: 40 },
  diode: { w: 66, h: 46 },
  fuse: { w: 74, h: 42 },
  transformer: { w: 98, h: 88 },
  optocoupler: { w: 88, h: 68 },
  tl431: { w: 70, h: 64 },
  bridge_rectifier: { w: 78, h: 78 },
  heatsink: { w: 84, h: 52 },
};

export function getSymbolDims(kind: ComponentKind): { w: number; h: number } {
  return COMP_BOX_DIMS[kind] ?? { w: 88, h: 68 };
}

/**
 * Computes an SVG coordinate anchor for a given component and optional pin name/number
 * so orthogonal Manhattan wires connect cleanly to schematic symbol terminals.
 */
export function getComponentPinAnchor(
  component: BoardComponent,
  pinQuery?: string,
  fallbackSide: 'left' | 'right' | 'top' | 'bottom' = 'right'
): PinAnchor {
  const { x, y } = component.schematicPos;
  const dims = getSymbolDims(component.kind);
  const hw = dims.w / 2;
  const hh = dims.h / 2;

  // Specialized 2/3-terminal discrete anchors
  if (component.kind === 'mosfet' || component.kind === 'drmos') {
    const q = (pinQuery || '').toLowerCase();
    if (q.includes('g') || q.includes('pwm') || q.includes('gate') || q === '1') {
      return { x: x - hw, y: y + 10, side: 'left' };
    }
    if (q.includes('d') || q.includes('vin') || q.includes('drain') || q.includes('12v')) {
      return { x, y: y - hh, side: 'top' };
    }
    if (q.includes('s') || q.includes('sw') || q.includes('lx') || q.includes('phase') || q.includes('source')) {
      return { x: x + hw, y, side: 'right' };
    }
  }

  if (component.kind === 'inductor' || component.kind === 'resistor' || component.kind === 'fuse' || component.kind === 'diode') {
    const idx = component.pins.findIndex(
      (p) => p.pin === pinQuery || p.name === pinQuery || p.net === pinQuery
    );
    if (idx === 0) return { x: x - hw, y, side: 'left' };
    if (idx >= 1) return { x: x + hw, y, side: 'right' };
  }

  if (component.kind === 'capacitor_elec' || component.kind === 'capacitor_solid') {
    const idx = component.pins.findIndex(
      (p) => p.pin === pinQuery || p.name === pinQuery || p.net === pinQuery
    );
    if (idx === 0) return { x, y: y - hh, side: 'top' };
    if (idx >= 1) return { x, y: y + hh, side: 'bottom' };
  }

  if (component.kind === 'transformer' || component.kind === 'optocoupler' || component.kind === 'bridge_rectifier') {
    const idx = component.pins.findIndex(
      (p) => p.pin === pinQuery || p.name === pinQuery || p.net === pinQuery
    );
    const total = Math.max(component.pins.length, 2);
    if (idx >= 0) {
      const isLeft = idx < Math.ceil(total / 2);
      const sideIdx = isLeft ? idx : idx - Math.ceil(total / 2);
      const sideCount = isLeft ? Math.ceil(total / 2) : Math.floor(total / 2);
      const offsetY = sideCount <= 1 ? 0 : -hh * 0.45 + (sideIdx / (sideCount - 1)) * (hh * 0.9);
      return {
        x: isLeft ? x - hw : x + hw,
        y: y + offsetY,
        side: isLeft ? 'left' : 'right',
      };
    }
  }

  // Multi-pin IC / block distribution
  if (pinQuery && component.pins.length > 0) {
    const idx = component.pins.findIndex(
      (p) =>
        p.pin.toLowerCase() === pinQuery.toLowerCase() ||
        p.name.toLowerCase() === pinQuery.toLowerCase() ||
        p.net.toLowerCase() === pinQuery.toLowerCase()
    );
    if (idx >= 0) {
      const half = Math.ceil(component.pins.length / 2);
      const isLeft = idx < half;
      const sideIdx = isLeft ? idx : idx - half;
      const sideCount = isLeft ? half : component.pins.length - half;
      const span = dims.h - 22;
      const offsetY = sideCount <= 1 ? 0 : -span / 2 + (sideIdx / (sideCount - 1)) * span;
      return {
        x: isLeft ? x - hw : x + hw,
        y: y + offsetY,
        side: isLeft ? 'left' : 'right',
      };
    }
  }

  switch (fallbackSide) {
    case 'left':
      return { x: x - hw, y, side: 'left' };
    case 'right':
      return { x: x + hw, y, side: 'right' };
    case 'top':
      return { x, y: y - hh, side: 'top' };
    case 'bottom':
      return { x, y: y + hh, side: 'bottom' };
  }
}

export const SchematicSymbol: React.FC<SchematicSymbolProps> = ({
  component,
  isSelected,
  isSuspect,
  isNetHighlighted,
  isDimmed,
  selectedPinName,
  highlightedNetId,
  paperMode = false,
  onSelectComponent,
  onSelectPin,
  onHover,
}) => {
  const { x, y } = component.schematicPos;
  const { w, h } = getSymbolDims(component.kind);
  const hw = w / 2;
  const hh = h / 2;

  const strokeMain = isSuspect
    ? paperMode
      ? '#e11d48'
      : '#f43f5e'
    : isSelected
    ? paperMode
      ? '#0284c7'
      : '#38bdf8'
    : isNetHighlighted
    ? paperMode
      ? '#d97706'
      : '#facc15'
    : paperMode
    ? '#1e293b'
    : '#7dd3fc';

  const strokeSub = isSuspect
    ? paperMode
      ? '#be123c'
      : '#fda4af'
    : isSelected
    ? paperMode
      ? '#0369a1'
      : '#bae6fd'
    : paperMode
    ? '#475569'
    : '#94a3b8';

  const bodyFill = paperMode
    ? isSelected
      ? 'rgba(2, 132, 199, 0.12)'
      : isSuspect
      ? 'rgba(225, 29, 72, 0.10)'
      : 'rgba(255, 255, 255, 0.96)'
    : isSelected
    ? 'rgba(14, 116, 144, 0.25)'
    : isSuspect
    ? 'rgba(159, 18, 57, 0.22)'
    : 'rgba(10, 22, 40, 0.92)';

  const accentGold = paperMode ? '#b45309' : '#fbbf24';

  const renderDiscreteSymbol = () => {
    switch (component.kind) {
      case 'mosfet':
      case 'drmos': {
        return (
          <g>
            {/* Outer subtle package frame for DrMOS or clean MOSFET ring */}
            {component.kind === 'drmos' ? (
              <rect
                x={x - hw + 4}
                y={y - hh + 4}
                width={w - 8}
                height={h - 8}
                rx={6}
                fill={bodyFill}
                stroke={strokeMain}
                strokeWidth={1.6}
                strokeDasharray="4 2"
              />
            ) : (
              <circle
                cx={x + 4}
                cy={y}
                r={24}
                fill={bodyFill}
                stroke={strokeMain}
                strokeWidth={1.5}
              />
            )}
            {/* Gate input stub & vertical gate bar */}
            <line x1={x - hw} y1={y + 10} x2={x - 10} y2={y + 10} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x - 10} y1={y - 12} x2={x - 10} y2={y + 13} stroke={strokeMain} strokeWidth={2.2} />
            {/* Broken channel segments (Enhancement N-CH) */}
            <line x1={x - 4} y1={y - 13} x2={x - 4} y2={y - 6} stroke={strokeMain} strokeWidth={2} />
            <line x1={x - 4} y1={y - 3} x2={x - 4} y2={y + 4} stroke={strokeMain} strokeWidth={2} />
            <line x1={x - 4} y1={y + 7} x2={x - 4} y2={y + 14} stroke={strokeMain} strokeWidth={2} />
            {/* Drain top connection */}
            <line x1={x - 4} y1={y - 10} x2={x + 12} y2={y - 10} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x + 12} y1={y - 10} x2={x + 12} y2={y - hh} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x + 12} y1={y - hh} x2={x} y2={y - hh} stroke={strokeMain} strokeWidth={1.8} />
            {/* Source bottom + arrow */}
            <line x1={x - 4} y1={y} x2={x + 12} y2={y} stroke={strokeMain} strokeWidth={1.6} />
            <polygon points={`${x - 3},${y} ${x + 3},${y - 3} ${x + 3},${y + 3}`} fill={strokeMain} />
            <line x1={x - 4} y1={y + 10} x2={x + 12} y2={y + 10} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x + 12} y1={y} x2={x + 12} y2={y + 10} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x + 12} y1={y} x2={x + hw} y2={y} stroke={strokeMain} strokeWidth={1.8} />
            {/* Internal body diode */}
            <line x1={x + 21} y1={y - 10} x2={x + 21} y2={y + 10} stroke={strokeSub} strokeWidth={1.2} />
            <line x1={x + 12} y1={y - 10} x2={x + 21} y2={y - 10} stroke={strokeSub} strokeWidth={1.2} />
            <line x1={x + 12} y1={y + 10} x2={x + 21} y2={y + 10} stroke={strokeSub} strokeWidth={1.2} />
            <polygon points={`${x + 16},${y + 4} ${x + 26},${y + 4} ${x + 21},${y - 4}`} fill={strokeSub} />
            <line x1={x + 16} y1={y - 4} x2={x + 26} y2={y - 4} stroke={strokeSub} strokeWidth={1.3} />
            {/* Terminal markers */}
            <text x={x - hw + 3} y={y + 6} fontSize={7.5} fill={strokeSub} fontFamily="monospace">G</text>
            <text x={x + 4} y={y - hh + 10} fontSize={7.5} fill={strokeSub} fontFamily="monospace">D</text>
            <text x={x + hw - 10} y={y - 4} fontSize={7.5} fill={strokeSub} fontFamily="monospace">S</text>
          </g>
        );
      }

      case 'inductor': {
        return (
          <g>
            <rect
              x={x - hw}
              y={y - hh}
              width={w}
              height={h}
              rx={4}
              fill={paperMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(6, 13, 24, 0.55)'}
              stroke="transparent"
            />
            {/* Leads */}
            <line x1={x - hw} y1={y + 4} x2={x - 24} y2={y + 4} stroke={strokeMain} strokeWidth={2} />
            <line x1={x + 24} y1={y + 4} x2={x + hw} y2={y + 4} stroke={strokeMain} strokeWidth={2} />
            {/* 4 Inductor Coil Arcs */}
            <path
              d={`M ${x - 24} ${y + 4} A 6 7 0 0 1 ${x - 12} ${y + 4} A 6 7 0 0 1 ${x} ${y + 4} A 6 7 0 0 1 ${x + 12} ${y + 4} A 6 7 0 0 1 ${x + 24} ${y + 4}`}
              fill="none"
              stroke={strokeMain}
              strokeWidth={2.2}
            />
            {/* Ferrite Core Parallel Bars */}
            <line x1={x - 22} y1={y - 9} x2={x + 22} y2={y - 9} stroke="#fbbf24" strokeWidth={1.6} />
            <line x1={x - 22} y1={y - 13} x2={x + 22} y2={y - 13} stroke="#fbbf24" strokeWidth={1.6} />
          </g>
        );
      }

      case 'capacitor_elec':
      case 'capacitor_solid': {
        const isPolarized = true;
        return (
          <g>
            <line x1={x} y1={y - hh} x2={x} y2={y - 5} stroke={strokeMain} strokeWidth={2} />
            <line x1={x} y1={y + 6} x2={x} y2={y + hh} stroke={strokeMain} strokeWidth={2} />
            {/* Top positive plate */}
            <line x1={x - 16} y1={y - 5} x2={x + 16} y2={y - 5} stroke={strokeMain} strokeWidth={2.6} />
            {/* Bottom curved or solid plate */}
            {component.kind === 'capacitor_elec' ? (
              <path
                d={`M ${x - 16} ${y + 8} Q ${x} ${y + 1} ${x + 16} ${y + 8}`}
                fill="none"
                stroke={strokeMain}
                strokeWidth={2.4}
              />
            ) : (
              <line x1={x - 16} y1={y + 6} x2={x + 16} y2={y + 6} stroke={strokeMain} strokeWidth={2.6} />
            )}
            {isPolarized && (
              <text x={x + 10} y={y - 9} fontSize={11} fontWeight="bold" fill="#fbbf24" fontFamily="monospace">
                +
              </text>
            )}
          </g>
        );
      }

      case 'resistor': {
        return (
          <g>
            <line x1={x - hw} y1={y} x2={x - 22} y2={y} stroke={strokeMain} strokeWidth={2} />
            <polyline
              points={`${x - 22},${y} ${x - 18},${y - 8} ${x - 11},${y + 8} ${x - 4},${y - 8} ${x + 3},${y + 8} ${x + 10},${y - 8} ${x + 17},${y + 8} ${x + 22},${y}`}
              fill="none"
              stroke={strokeMain}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <line x1={x + 22} y1={y} x2={x + hw} y2={y} stroke={strokeMain} strokeWidth={2} />
          </g>
        );
      }

      case 'fuse': {
        return (
          <g>
            <rect
              x={x - 26}
              y={y - 12}
              width={52}
              height={24}
              rx={3}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={1.3}
              strokeDasharray="3 2"
            />
            <line x1={x - hw} y1={y} x2={x - 20} y2={y} stroke={strokeMain} strokeWidth={2} />
            <circle cx={x - 18} cy={y} r={2.5} fill={strokeMain} />
            <path
              d={`M ${x - 16} ${y} Q ${x - 8} ${y - 11} ${x} ${y} T ${x + 16} ${y}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2.2}
            />
            <circle cx={x + 18} cy={y} r={2.5} fill={strokeMain} />
            <line x1={x + 20} y1={y} x2={x + hw} y2={y} stroke={strokeMain} strokeWidth={2} />
          </g>
        );
      }

      case 'diode': {
        return (
          <g>
            <line x1={x - hw} y1={y} x2={x - 10} y2={y} stroke={strokeMain} strokeWidth={2} />
            <polygon
              points={`${x - 10},${y - 12} ${x - 10},${y + 12} ${x + 10},${y}`}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={2}
            />
            {/* Schottky S-hook cathode bar */}
            <path
              d={`M ${x + 6} ${y - 12} L ${x + 10} ${y - 12} L ${x + 10} ${y + 12} L ${x + 14} ${y + 12}`}
              fill="none"
              stroke={strokeMain}
              strokeWidth={2.2}
            />
            <line x1={x + 10} y1={y} x2={x + hw} y2={y} stroke={strokeMain} strokeWidth={2} />
          </g>
        );
      }

      case 'tl431': {
        return (
          <g>
            <rect x={x - 26} y={y - 22} width={52} height={44} rx={4} fill={bodyFill} stroke={strokeMain} strokeWidth={1.5} />
            <line x1={x} y1={y - hh} x2={x} y2={y - 9} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x} y1={y + 9} x2={x} y2={y + hh} stroke={strokeMain} strokeWidth={1.8} />
            <line x1={x - hw} y1={y} x2={x - 5} y2={y} stroke={strokeMain} strokeWidth={1.8} />
            <polygon points={`${x - 10},${y + 9} ${x + 10},${y + 9} ${x},${y - 9}`} fill="none" stroke={strokeMain} strokeWidth={2} />
            <path d={`M ${x - 13} ${y - 12} L ${x - 10} ${y - 9} L ${x + 10} ${y - 9} L ${x + 13} ${y - 6}`} fill="none" stroke={strokeMain} strokeWidth={2} />
            <text x={x - hw + 3} y={y - 4} fontSize={7} fill={strokeSub} fontFamily="monospace">REF</text>
          </g>
        );
      }

      case 'bridge_rectifier': {
        return (
          <g>
            <polygon
              points={`${x},${y - 30} ${x + 30},${y} ${x},${y + 30} ${x - 30},${y}`}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={1.8}
            />
            {/* Inner 4 mini diode marks */}
            <circle cx={x} cy={y} r={8} fill="none" stroke={strokeSub} strokeWidth={1} strokeDasharray="2 2" />
            <text x={x - 24} y={y + 3} fontSize={9} fill="#fbbf24" fontFamily="monospace">~</text>
            <text x={x + 17} y={y + 3} fontSize={9} fill="#fbbf24" fontFamily="monospace">~</text>
            <text x={x - 3} y={y - 16} fontSize={9} fill="#ef4444" fontFamily="monospace">+</text>
            <text x={x - 3} y={y + 23} fontSize={10} fill="#94a3b8" fontFamily="monospace">-</text>
            <line x1={x - hw} y1={y - 12} x2={x - 18} y2={y - 12} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x - hw} y1={y + 12} x2={x - 18} y2={y + 12} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x + 18} y1={y - 12} x2={x + hw} y2={y - 12} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x + 18} y1={y + 12} x2={x + hw} y2={y + 12} stroke={strokeMain} strokeWidth={1.6} />
          </g>
        );
      }

      case 'transformer': {
        return (
          <g>
            <rect
              x={x - hw + 6}
              y={y - hh + 4}
              width={w - 12}
              height={h - 8}
              rx={5}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={1.4}
              strokeDasharray="4 2"
            />
            {/* Primary Winding */}
            <path
              d={`M ${x - hw} ${y - 22} L ${x - 16} ${y - 22} A 5 5.5 0 0 1 ${x - 16} ${y - 11} A 5 5.5 0 0 1 ${x - 16} ${y} A 5 5.5 0 0 1 ${x - 16} ${y + 11} A 5 5.5 0 0 1 ${x - 16} ${y + 22} L ${x - hw} ${y + 22}`}
              fill="none"
              stroke="#f97316"
              strokeWidth={2}
            />
            {/* Magnetic Ferrite Core Bars */}
            <line x1={x - 3} y1={y - 28} x2={x - 3} y2={y + 28} stroke="#fbbf24" strokeWidth={2.2} />
            <line x1={x + 3} y1={y - 28} x2={x + 3} y2={y + 28} stroke="#fbbf24" strokeWidth={2.2} />
            {/* Secondary Winding */}
            <path
              d={`M ${x + hw} ${y - 22} L ${x + 16} ${y - 22} A 5 5.5 0 0 0 ${x + 16} ${y - 11} A 5 5.5 0 0 0 ${x + 16} ${y} A 5 5.5 0 0 0 ${x + 16} ${y + 11} A 5 5.5 0 0 0 ${x + 16} ${y + 22} L ${x + hw} ${y + 22}`}
              fill="none"
              stroke={strokeMain}
              strokeWidth={2}
            />
            {/* Polarity dots */}
            <circle cx={x - 19} cy={y - 25} r={2} fill="#fbbf24" />
            <circle cx={x + 19} cy={y - 25} r={2} fill="#fbbf24" />
          </g>
        );
      }

      case 'optocoupler': {
        return (
          <g>
            <rect
              x={x - hw + 6}
              y={y - hh + 4}
              width={w - 12}
              height={h - 8}
              rx={4}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={1.6}
            />
            {/* HV Isolation dashed barrier */}
            <line x1={x} y1={y - hh + 6} x2={x} y2={y + hh - 6} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="3 3" />
            {/* Left LED */}
            <line x1={x - hw} y1={y - 14} x2={x - 18} y2={y - 14} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x - 18} y1={y - 14} x2={x - 18} y2={y + 14} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x - 18} y1={y + 14} x2={x - hw} y2={y + 14} stroke={strokeMain} strokeWidth={1.6} />
            <polygon points={`${x - 24},${y - 6} ${x - 12},${y - 6} ${x - 18},${y + 5}`} fill="#f97316" />
            <line x1={x - 24} y1={y + 6} x2={x - 12} y2={y + 6} stroke="#f97316" strokeWidth={1.6} />
            {/* Optical arrows */}
            <line x1={x - 8} y1={y - 3} x2={x + 4} y2={y - 3} stroke="#fbbf24" strokeWidth={1.2} />
            <line x1={x - 8} y1={y + 4} x2={x + 4} y2={y + 4} stroke="#fbbf24" strokeWidth={1.2} />
            {/* Right Phototransistor */}
            <line x1={x + 12} y1={y - 12} x2={x + 12} y2={y + 12} stroke={strokeMain} strokeWidth={2.2} />
            <line x1={x + 12} y1={y - 6} x2={x + 24} y2={y - 14} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x + 24} y1={y - 14} x2={x + hw} y2={y - 14} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x + 12} y1={y + 6} x2={x + 24} y2={y + 14} stroke={strokeMain} strokeWidth={1.6} />
            <line x1={x + 24} y1={y + 14} x2={x + hw} y2={y + 14} stroke={strokeMain} strokeWidth={1.6} />
          </g>
        );
      }

      case 'heatsink': {
        return (
          <g>
            <rect x={x - hw} y={y - hh} width={w} height={h} rx={4} fill={bodyFill} stroke={strokeMain} strokeWidth={1.5} />
            {[-24, -12, 0, 12, 24].map((dx) => (
              <line key={dx} x1={x + dx} y1={y - hh + 6} x2={x + dx} y2={y + hh - 6} stroke={strokeSub} strokeWidth={1.5} />
            ))}
          </g>
        );
      }

      default: {
        // Multi-pin IC / Socket / Slot / Connector Block
        const pins = component.pins || [];
        const half = Math.ceil(pins.length / 2);
        const leftPins = pins.slice(0, half);
        const rightPins = pins.slice(half);

        const renderSidePins = (sidePins: PinMeasurement[], side: 'left' | 'right') => {
          const count = sidePins.length;
          const span = h - 22;
          return sidePins.map((pin, idx) => {
            const offsetY = count <= 1 ? 0 : -span / 2 + (idx / (count - 1)) * span;
            const py = y + offsetY;
            const isLeft = side === 'left';
            const pxEdge = isLeft ? x - hw : x + hw;
            const pxStub = isLeft ? x - hw - 10 : x + hw + 10;
            const isPinSelected = isSelected && selectedPinName === pin.pin;
            const isPinOnNet =
              Boolean(highlightedNetId) &&
              pin.net.toLowerCase().includes(highlightedNetId!.toLowerCase());

            return (
              <g
                key={`${pin.pin}-${idx}`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin(component.id, pin);
                }}
              >
                <line
                  x1={pxStub}
                  y1={py}
                  x2={pxEdge}
                  y2={py}
                  stroke={isPinSelected ? '#facc15' : isPinOnNet ? '#22d3ee' : strokeMain}
                  strokeWidth={isPinSelected || isPinOnNet ? 2.4 : 1.5}
                />
                <circle
                  cx={pxStub}
                  cy={py}
                  r={isPinSelected ? 3.5 : 2.3}
                  fill={isPinSelected ? accentGold : isPinOnNet ? '#0ea5e9' : paperMode ? '#ffffff' : '#0f172a'}
                  stroke={strokeMain}
                  strokeWidth={1.2}
                />
                <text
                  x={isLeft ? pxEdge + 4 : pxEdge - 4}
                  y={py + 3}
                  textAnchor={isLeft ? 'start' : 'end'}
                  fontSize={7.5}
                  fontFamily="monospace"
                  fill={isPinSelected ? accentGold : paperMode ? '#1e293b' : '#cbd5e1'}
                >
                  {pin.name.slice(0, 9)}
                </text>
              </g>
            );
          });
        };

        return (
          <g>
            <rect
              x={x - hw}
              y={y - hh}
              width={w}
              height={h}
              rx={5}
              fill={bodyFill}
              stroke={strokeMain}
              strokeWidth={isSelected ? 2.2 : 1.6}
            />
            {/* Pin-1 notch */}
            <path
              d={`M ${x - 7} ${y - hh} A 7 7 0 0 0 ${x + 7} ${y - hh}`}
              fill="none"
              stroke={strokeSub}
              strokeWidth={1.4}
            />
            <circle cx={x - hw + 8} cy={y - hh + 8} r={2.2} fill={strokeSub} />
            {/* Category watermark inside IC */}
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize={8}
              fontFamily="monospace"
              fill="rgba(148, 163, 184, 0.38)"
            >
              {component.kind.toUpperCase()}
            </text>
            {renderSidePins(leftPins, 'left')}
            {renderSidePins(rightPins, 'right')}
          </g>
        );
      }
    }
  };

  return (
    <g
      className="cursor-pointer select-none"
      style={{
        opacity: isDimmed ? 0.25 : 1,
        transition: 'opacity 180ms ease',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectComponent(component.id);
      }}
      onMouseEnter={() => onHover?.(component)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Suspect fault pulse ring */}
      {isSuspect && (
        <rect
          x={x - hw - 9}
          y={y - hh - 9}
          width={w + 18}
          height={h + 18}
          rx={10}
          fill="rgba(244, 63, 94, 0.08)"
          stroke="#f43f5e"
          strokeWidth={1.6}
          strokeDasharray="5 3"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.95;0.25;0.95"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Selection halo */}
      {isSelected && (
        <rect
          x={x - hw - 6}
          y={y - hh - 6}
          width={w + 12}
          height={h + 12}
          rx={8}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      {renderDiscreteSymbol()}

      {/* Designator & Part Number Header */}
      <text
        x={x}
        y={y - hh - 8}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight="700"
        fontFamily="monospace"
        fill={
          isSuspect
            ? paperMode
              ? '#be123c'
              : '#fda4af'
            : isSelected
              ? paperMode
                ? '#0369a1'
                : '#7dd3fc'
              : paperMode
                ? '#0f172a'
                : '#f8fafc'
        }
      >
        {component.id}
        {component.partNumber ? ` · ${component.partNumber}` : ''}
      </text>

      {/* Vietnamese Description Sub-label */}
      <text
        x={x}
        y={y + hh + 13}
        textAnchor="middle"
        fontSize={8.5}
        fontFamily="sans-serif"
        fill={paperMode ? '#475569' : '#94a3b8'}
      >
        {component.label.length > 26 ? `${component.label.slice(0, 24)}…` : component.label}
      </text>

      {isSuspect && (
        <g transform={`translate(${x + hw - 2}, ${y - hh - 2})`}>
          <circle r={7} fill="#e11d48" stroke="#fff1f2" strokeWidth={1.2} />
          <text x={0} y={3} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#ffffff">
            !
          </text>
        </g>
      )}
    </g>
  );
};
