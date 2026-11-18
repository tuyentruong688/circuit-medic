import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  EyeOff,
  Info,
  MapPin,
} from 'lucide-react';
import {
  BoardComponent,
  FaultCase,
  HardwareBoard,
  PinMeasurement,
} from '../../types/circuit';

export interface CustomPinAnnotation {
  id: string;
  xPct: number;
  yPct: number;
  label: string;
  expectedValue: string;
  color: string;
}

interface RealPhotoOverlayCanvasProps {
  board: HardwareBoard;
  photoUrl: string;
  isUserCustomPhoto?: boolean;
  customPhotoName?: string;
  selectedComponentId: string | null;
  selectedPin: PinMeasurement | null;
  selectedNetId: string | null;
  activeFault: FaultCase | null;
  thermalMode?: boolean;
  showComponents: boolean;
  showZones: boolean;
  showAirwires: boolean;
  showSuspects: boolean;
  showLoupe: boolean;
  showCustomPins: boolean;
  isPlacingPin: boolean;
  customPins: CustomPinAnnotation[];
  selectedCustomPinId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (nextZoom: number) => void;
  onPanChange: (nextPan: { x: number; y: number }) => void;
  onSelectComponent: (componentId: string) => void;
  onProbePin: (component: BoardComponent, pin: PinMeasurement) => void;
  onPlaceCustomPin: (xPct: number, yPct: number) => void;
  onSelectCustomPin: (pinId: string) => void;
}

export const RealPhotoOverlayCanvas: React.FC<RealPhotoOverlayCanvasProps> = ({
  board,
  photoUrl,
  isUserCustomPhoto = false,
  customPhotoName,
  selectedComponentId,
  selectedPin,
  selectedNetId,
  activeFault,
  thermalMode = false,
  showComponents,
  showZones,
  showAirwires,
  showSuspects,
  showLoupe,
  showCustomPins,
  isPlacingPin,
  customPins,
  selectedCustomPinId,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onSelectComponent,
  onProbePin,
  onPlaceCustomPin,
  onSelectCustomPin,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageBoxRef = useRef<HTMLDivElement | null>(null);
  const [vpSize, setVpSize] = useState<{ w: number; h: number }>({ w: 680, h: 420 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0, moved: false });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      setVpSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [loupeState, setLoupeState] = useState<{
    xPct: number;
    yPct: number;
    relX: number;
    relY: number;
    imgW: number;
    imgH: number;
  } | null>(null);

  const suspectSet = useMemo(
    () => new Set(activeFault?.suspectComponentIds ?? []),
    [activeFault]
  );

  const selectedRail = useMemo(
    () => (selectedNetId ? board.rails.find((r) => r.id === selectedNetId) ?? null : null),
    [selectedNetId, board.rails]
  );

  // Only components with verified photoPos (unless user custom photo, which uses user-placed pins)
  const photoMappedComponents = useMemo(() => {
    if (isUserCustomPhoto) return [];
    return board.components.filter((c) => Boolean(c.photoPos));
  }, [board.components, isUserCustomPhoto]);

  const unmappedComponents = useMemo(() => {
    if (isUserCustomPhoto) return [];
    return board.components.filter((c) => !c.photoPos);
  }, [board.components, isUserCustomPhoto]);

  const photoMappedZones = useMemo(() => {
    if (isUserCustomPhoto) return [];
    return board.zones.filter((z) => Boolean(z.photoBounds));
  }, [board.zones, isUserCustomPhoto]);

  // Compute SVG Airwires connecting photo-mapped components on the selected rail
  const photoAirwires = useMemo(() => {
    if (isUserCustomPhoto || !showAirwires || !selectedNetId) {
      return { nodes: [] as Array<{ compId: string; x: number; y: number }>, segments: [] as Array<{ x1: number; y1: number; x2: number; y2: number }> };
    }
    const nodes: Array<{ compId: string; x: number; y: number }> = [];
    const seen = new Set<string>();

    for (const comp of photoMappedComponents) {
      if (!comp.photoPos) continue;
      const isOnRail =
        comp.pins.some(
          (p) =>
            p.net.toLowerCase() === selectedNetId.toLowerCase() ||
            (selectedRail && p.net.toLowerCase() === selectedRail.name.toLowerCase())
        ) ||
        Boolean(selectedRail?.connectedComponents.includes(comp.id)) ||
        board.wires.some(
          (w) =>
            w.netId === selectedNetId &&
            (w.fromComponentId === comp.id || w.toComponentId === comp.id)
        );

      if (isOnRail && !seen.has(comp.id)) {
        seen.add(comp.id);
        nodes.push({
          compId: comp.id,
          x: comp.photoPos.x + comp.photoPos.w / 2,
          y: comp.photoPos.y + comp.photoPos.h / 2,
        });
      }
    }

    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      segments.push({
        x1: nodes[i].x,
        y1: nodes[i].y,
        x2: nodes[i + 1].x,
        y2: nodes[i + 1].y,
      });
    }
    return { nodes, segments };
  }, [isUserCustomPhoto, showAirwires, selectedNetId, photoMappedComponents, selectedRail, board.wires]);

  const hoveredComponent = useMemo(
    () => (hoveredCompId ? board.components.find((c) => c.id === hoveredCompId) ?? null : null),
    [hoveredCompId, board.components]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isPlacingPin) return;
    setIsPanning(true);
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y, moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mx;
      const dy = e.clientY - panStartRef.current.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        panStartRef.current.moved = true;
      }
      onPanChange({
        x: panStartRef.current.px + dx,
        y: panStartRef.current.py + dy,
      });
    }

    if (showLoupe && imageBoxRef.current && viewportRef.current) {
      const imgRect = imageBoxRef.current.getBoundingClientRect();
      const vpRect = viewportRef.current.getBoundingClientRect();
      if (
        e.clientX >= imgRect.left &&
        e.clientX <= imgRect.right &&
        e.clientY >= imgRect.top &&
        e.clientY <= imgRect.bottom
      ) {
        setLoupeState({
          xPct: ((e.clientX - imgRect.left) / imgRect.width) * 100,
          yPct: ((e.clientY - imgRect.top) / imgRect.height) * 100,
          relX: e.clientX - vpRect.left,
          relY: e.clientY - vpRect.top,
          imgW: imgRect.width,
          imgH: imgRect.height,
        });
      } else {
        setLoupeState(null);
      }
    } else if (loupeState) {
      setLoupeState(null);
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPin || !imageBoxRef.current) return;
    const rect = imageBoxRef.current.getBoundingClientRect();
    const xPct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    onPlaceCustomPin(xPct, yPct);
  };

  const selectedCompObj = selectedComponentId
    ? board.components.find((c) => c.id === selectedComponentId) ?? null
    : null;

  return (
    <div className="cm-preserve-dark relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-[#0b1220]">
      {/* Interactive Zoom / Pan Viewport */}
      <div
        ref={viewportRef}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.14 : -0.14;
          onZoomChange(Math.max(0.55, Math.min(3.0, Number((zoom + delta).toFixed(2)))));
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setIsPanning(false);
          setLoupeState(null);
        }}
        className={`relative flex-1 flex items-center justify-center overflow-hidden p-4 ${
          isPlacingPin
            ? 'cursor-crosshair'
            : isPanning
              ? 'cursor-grabbing'
              : 'cursor-grab'
        }`}
      >
        {/* Scaled & Panned Image + Exact Overlay Wrapper */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          className="transition-transform duration-75 will-change-transform"
        >
          <div
            ref={imageBoxRef}
            onClick={handleImageClick}
            className="relative inline-block shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-lg overflow-hidden border border-slate-600/60 bg-slate-950"
          >
            <img
              src={photoUrl}
              alt={
                isUserCustomPhoto
                  ? customPhotoName || 'Ảnh chụp thực tế của người dùng'
                  : `Ảnh thực tế bo mạch ${board.name}`
              }
              draggable={false}
              style={{
                maxWidth: Math.max(180, vpSize.w - 32),
                maxHeight: Math.max(140, vpSize.h - 32),
              }}
              className="block w-auto h-auto select-none"
            />

            {/* Optional Subtle Zone Overlays */}
            {showZones && photoMappedZones.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {photoMappedZones.map((zone) => {
                  const b = zone.photoBounds!;
                  return (
                    <div
                      key={zone.id}
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.w}%`,
                        height: `${b.h}%`,
                        borderColor: zone.color,
                        backgroundColor: `${zone.color}12`,
                      }}
                      className="absolute rounded-md border-2 border-dashed"
                    >
                      <span
                        style={{ backgroundColor: `${zone.color}dd` }}
                        className="inline-block rounded-br px-1.5 py-0.5 text-[9px] font-bold text-white shadow"
                      >
                        {zone.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SVG Airwire Continuity Overlay on Real Photo */}
            {showAirwires && selectedNetId && photoAirwires.segments.length > 0 && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {photoAirwires.segments.map((seg, i) => (
                  <g key={i}>
                    <line
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke="#020617"
                      strokeWidth={1.1}
                      vectorEffect="non-scaling-stroke"
                      opacity={0.7}
                    />
                    <line
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke={selectedRail?.color ?? '#38bdf8'}
                      strokeWidth={2.6}
                      strokeDasharray="6 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
                {photoAirwires.nodes.map((node) => (
                  <circle
                    key={node.compId}
                    cx={node.x}
                    cy={node.y}
                    r={0.85}
                    fill={selectedRail?.color ?? '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth={0.25}
                  />
                ))}
              </svg>
            )}

            {/* Component Bounding Boxes & Interactive Pin Dots on Real Photo */}
            {showComponents && photoMappedComponents.length > 0 && (
              <div className="absolute inset-0">
                {photoMappedComponents.map((comp) => {
                  const p = comp.photoPos!;
                  const isSelected = selectedComponentId === comp.id;
                  const isHovered = hoveredCompId === comp.id;
                  const isSuspect = showSuspects && suspectSet.has(comp.id);
                  const isOnSelectedNet =
                    Boolean(selectedNetId) &&
                    (comp.pins.some(
                      (pin) =>
                        pin.net.toLowerCase() === selectedNetId?.toLowerCase() ||
                        (selectedRail &&
                          pin.net.toLowerCase() === selectedRail.name.toLowerCase())
                    ) ||
                      Boolean(selectedRail?.connectedComponents.includes(comp.id)));

                  const dimmed = Boolean(selectedNetId) && !isOnSelectedNet && !isSelected;

                  const borderColor = isSuspect
                    ? '#f43f5e'
                    : isSelected
                      ? '#22d3ee'
                      : isOnSelectedNet
                        ? selectedRail?.color ?? '#38bdf8'
                        : isHovered
                          ? '#facc15'
                          : 'rgba(250, 204, 21, 0.72)';

                  const thermalGlow =
                    thermalMode && (isSuspect || (comp.faultTempC ?? 0) >= 95)
                      ? 'rgba(244, 63, 94, 0.34)'
                      : isSelected
                        ? 'rgba(34, 211, 238, 0.22)'
                        : isSuspect
                          ? 'rgba(244, 63, 94, 0.24)'
                          : 'rgba(15, 23, 42, 0.08)';

                  return (
                    <div
                      key={comp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (panStartRef.current.moved) return;
                        onSelectComponent(comp.id);
                      }}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId((prev) => (prev === comp.id ? null : prev))}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.w}%`,
                        height: `${p.h}%`,
                        borderColor,
                        backgroundColor: thermalGlow,
                        opacity: dimmed ? 0.28 : 1,
                      }}
                      className={`group absolute cursor-pointer rounded border-[1.5px] transition-all ${
                        isSelected
                          ? 'z-20 ring-2 ring-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,0.45)]'
                          : isSuspect
                            ? 'z-10 ring-2 ring-rose-400/70 animate-pulse'
                            : 'z-10 hover:z-20 hover:border-2'
                      }`}
                    >
                      {/* Compact high-contrast pill tag */}
                      <span
                        className={`pointer-events-none absolute -top-4 left-0 whitespace-nowrap rounded px-1 py-0.2 font-mono text-[9px] font-bold shadow-md border ${
                          isSuspect
                            ? 'bg-rose-600 text-white border-rose-300'
                            : isSelected
                              ? 'bg-cyan-400 text-slate-950 border-white'
                              : 'bg-slate-950/90 text-amber-200 border-amber-400/60 group-hover:bg-amber-300 group-hover:text-slate-950'
                        }`}
                      >
                        {comp.id}
                        {thermalMode && ` · ${isSuspect ? comp.faultTempC ?? 95 : comp.normalTempC ?? 38}°C`}
                      </span>

                      {/* Probeable pin dots shown on selected component */}
                      {isSelected && comp.pins.length > 0 && (
                        <div className="absolute -bottom-3 left-0 flex items-center gap-1">
                          {comp.pins.slice(0, 4).map((pin) => {
                            const isPinActive = selectedPin?.pin === pin.pin;
                            return (
                              <button
                                key={pin.pin}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onProbePin(comp, pin);
                                }}
                                title={`Đo chân ${pin.pin} (${pin.name}): ${pin.expectedVoltage}`}
                                className={`rounded-full px-1 py-0.2 font-mono text-[8px] font-bold border shadow transition-transform hover:scale-110 ${
                                  isPinActive
                                    ? 'bg-emerald-400 text-slate-950 border-white'
                                    : 'bg-slate-950/95 text-emerald-300 border-emerald-400/70'
                                }`}
                              >
                                {pin.pin}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* User Custom Pin Annotations */}
            {showCustomPins &&
              customPins.map((pin) => {
                const isActive = selectedCustomPinId === pin.id;
                return (
                  <div
                    key={pin.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomPin(pin.id);
                    }}
                    style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                    className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full border-2 border-slate-950 shadow-lg transition-transform ${
                        isActive ? 'scale-125 bg-cyan-400' : 'bg-amber-400 group-hover:scale-110'
                      }`}
                    />
                    <div className="mt-1 whitespace-nowrap rounded border border-amber-400/50 bg-slate-950/95 px-1.5 py-0.5 font-mono text-[10px] text-amber-200 shadow">
                      {pin.label}: <span className="text-emerald-300">{pin.expectedValue}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 2.5x Magnifying Loupe Overlay */}
        {showLoupe && loupeState && (
          <div
            style={{
              left: Math.max(12, Math.min(loupeState.relX + 20, (viewportRef.current?.clientWidth ?? 600) - 165)),
              top: Math.max(12, Math.min(loupeState.relY - 75, (viewportRef.current?.clientHeight ?? 400) - 165)),
              width: 148,
              height: 148,
              backgroundImage: `url("${photoUrl}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${loupeState.imgW * 2.5}px ${loupeState.imgH * 2.5}px`,
              backgroundPosition: `${-(loupeState.xPct / 100) * (loupeState.imgW * 2.5) + 74}px ${
                -(loupeState.yPct / 100) * (loupeState.imgH * 2.5) + 74
              }px`,
            }}
            className="pointer-events-none absolute z-40 rounded-full border-2 border-cyan-300 shadow-[0_0_28px_rgba(0,0,0,0.8)] bg-slate-950"
          >
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/25 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full border border-cyan-300/70" />
            </div>
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-slate-950/85 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
              2.5× SOI MẠCH
            </span>
          </div>
        )}

        {/* Hovered Component Floating Quick Card */}
        {hoveredComponent && !isPlacingPin && (
          <div className="pointer-events-none absolute top-3 left-3 z-30 max-w-xs rounded-lg border border-cyan-500/40 bg-slate-950/92 px-3 py-2 text-xs shadow-xl backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-cyan-300">{hoveredComponent.id}</span>
              {hoveredComponent.partNumber && (
                <span className="font-mono text-[10px] text-slate-400">
                  {hoveredComponent.partNumber}
                </span>
              )}
            </div>
            <div className="mt-0.5 font-semibold text-slate-100">{hoveredComponent.label}</div>
            {hoveredComponent.photoNote && (
              <div className="mt-1 text-[10px] text-amber-300">{hoveredComponent.photoNote}</div>
            )}
            {hoveredComponent.pins[0] && (
              <div className="mt-1 font-mono text-[10px] text-emerald-300">
                {hoveredComponent.pins[0].name}: {hoveredComponent.pins[0].expectedVoltage} (Diode:{' '}
                {hoveredComponent.pins[0].expectedDiodeDrop})
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Real-Photo Status, Safety Note, Source Attribution & Unmapped Footnote */}
      <div className="border-t border-slate-800/80 bg-slate-950/95 px-3 py-2 text-[11px] space-y-1.5">
        {board.safetyWarning && !isUserCustomPhoto && (
          <div className="flex items-start gap-1.5 rounded bg-amber-950/60 border border-amber-500/35 px-2 py-1 text-[10px] text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
            <span className="line-clamp-1">{board.safetyWarning}</span>
          </div>
        )}
        {!isUserCustomPhoto && board.realPhoto && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
              <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">{board.realPhoto.viewNote}</span>
            </div>
            <a
              href={board.realPhoto.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-cyan-300 hover:border-cyan-400"
            >
              <span>
                {board.realPhoto.license}
                {board.realPhoto.author ? ` · ${board.realPhoto.author}` : ''}
              </span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        )}

        {/* Selected Component photo note if covered by heatsink */}
        {selectedCompObj?.photoNote && (
          <div className="flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200">
            <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
            <span>
              <strong>{selectedCompObj.id}:</strong> {selectedCompObj.photoNote}
            </span>
          </div>
        )}

        {/* Honest disclosure of components obscured/not boxed directly on the whole-board photo */}
        {!isUserCustomPhoto && unmappedComponents.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
              <EyeOff className="h-3 w-3 text-slate-400" />
              Khuất dưới tản nhiệt / dây nguồn trên ảnh toàn bo (chọn để xem thông số):
            </span>
            {unmappedComponents.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectComponent(c.id)}
                className={`rounded px-1.5 py-0.5 font-mono border transition-colors ${
                  selectedComponentId === c.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {c.id}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
