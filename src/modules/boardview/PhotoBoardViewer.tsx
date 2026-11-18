import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Columns,
  Crosshair,
  GitBranch,
  Image as ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Stethoscope,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BoardComponent,
  ModuleSharedProps,
  PinMeasurement,
} from '../../types/circuit';
import {
  BOARD_VIEW_H,
  BOARD_VIEW_W,
  RealisticPcbRenderer,
} from './RealisticPcbRenderer';
import { MultimeterMode, VirtualMultimeter } from './VirtualMultimeter';

interface CustomPinAnnotation {
  id: string;
  xPct: number;
  yPct: number;
  label: string;
  expectedValue: string;
  color: string;
}

type SourceMode = 'reference' | 'custom_only' | 'side_by_side';

export const PhotoBoardViewer: React.FC<ModuleSharedProps> = ({
  selectedBoard,
  selectedComponentId,
  onSelectComponent,
  selectedNetId,
  onSelectNet,
  activeFault,
  onNavigateMode,
}) => {
  const [sourceMode, setSourceMode] = useState<SourceMode>('reference');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [customPhotoName, setCustomPhotoName] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [showZones, setShowZones] = useState(true);
  const [showAirwires, setShowAirwires] = useState(true);
  const [showSuspects, setShowSuspects] = useState(true);
  const [showCustomPins, setShowCustomPins] = useState(true);
  const [isPlacingPin, setIsPlacingPin] = useState(false);

  const [customPins, setCustomPins] = useState<CustomPinAnnotation[]>([]);
  const [newPinLabel, setNewPinLabel] = useState('TP_5VSB');
  const [newPinExpected, setNewPinExpected] = useState('5.05V');
  const [selectedCustomPinId, setSelectedCustomPinId] = useState<string | null>(null);

  const [meterMode, setMeterMode] = useState<MultimeterMode>('voltage');
  const [probedPin, setProbedPin] = useState<PinMeasurement | null>(null);

  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customImageContainerRef = useRef<HTMLDivElement | null>(null);

  const componentMap = useMemo(() => {
    const map = new Map<string, BoardComponent>();
    selectedBoard.components.forEach((c) => map.set(c.id, c));
    return map;
  }, [selectedBoard.components]);

  const selectedComponent = useMemo(
    () => (selectedComponentId ? componentMap.get(selectedComponentId) ?? null : null),
    [selectedComponentId, componentMap]
  );

  // Sync default probed pin when component changes
  useEffect(() => {
    if (selectedComponent && selectedComponent.pins.length > 0) {
      setProbedPin((prev) => {
        if (prev && selectedComponent.pins.some((p) => p.pin === prev.pin)) {
          return prev;
        }
        return selectedComponent.pins[0];
      });
    } else if (!selectedComponent) {
      setProbedPin(null);
    }
  }, [selectedComponent]);

  // Cleanup object URL on unmount or replace
  useEffect(() => {
    return () => {
      if (customPhotoUrl) {
        URL.revokeObjectURL(customPhotoUrl);
      }
    };
  }, [customPhotoUrl]);

  const handleLoadPhotoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const nextUrl = URL.createObjectURL(file);
    setCustomPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
    setCustomPhotoName(file.name);
    setSourceMode((prev) => (prev === 'reference' ? 'side_by_side' : prev));
  }, []);

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLoadPhotoFile(file);
  };

  const handleProbePin = (_comp: BoardComponent, pin: PinMeasurement) => {
    setProbedPin(pin);
    const matchingRail = selectedBoard.rails.find(
      (r) =>
        r.id.toLowerCase() === pin.net.toLowerCase() ||
        r.name.toLowerCase() === pin.net.toLowerCase()
    );
    if (matchingRail) {
      onSelectNet(matchingRail.id);
    }
  };

  const handleCustomImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPin || !customImageContainerRef.current) return;
    const rect = customImageContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    const pin: CustomPinAnnotation = {
      id: `pin-${Date.now()}`,
      xPct,
      yPct,
      label: newPinLabel.trim() || `TP${customPins.length + 1}`,
      expectedValue: newPinExpected.trim() || '3.3V',
      color: '#facc15',
    };
    setCustomPins((prev) => [...prev, pin]);
    setSelectedCustomPinId(pin.id);
    setIsPlacingPin(false);
  };

  const handleResetView = () => {
    setZoom(0.95);
    setPan({ x: 0, y: 0 });
  };

  const renderCustomPhotoPane = () => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDropFile}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors min-h-[340px] h-full overflow-hidden bg-slate-950/90 ${
        isDraggingFile
          ? 'border-cyan-400 bg-cyan-950/30'
          : 'border-slate-700/80'
      }`}
    >
      {customPhotoUrl ? (
        <div className="w-full h-full flex flex-col">
          {/* Custom photo annotation toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs">
            <span className="text-slate-300 truncate max-w-[180px]" title={customPhotoName}>
              📷 {customPhotoName || 'Ảnh thực tế'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="text"
                value={newPinLabel}
                onChange={(e) => setNewPinLabel(e.target.value)}
                placeholder="Tên điểm đo"
                className="w-20 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-amber-300"
              />
              <input
                type="text"
                value={newPinExpected}
                onChange={(e) => setNewPinExpected(e.target.value)}
                placeholder="Giá trị"
                className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-emerald-300"
              />
              <button
                type="button"
                onClick={() => setIsPlacingPin((v) => !v)}
                className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1 ${
                  isPlacingPin
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>{isPlacingPin ? 'Nhấp lên ảnh...' : 'Đặt Điểm Đo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomPins((v) => !v)}
                className={`px-2 py-0.5 rounded border text-[11px] ${
                  showCustomPins
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                {customPins.length}
              </button>
              {customPins.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCustomPins([])}
                  className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                  title="Xóa hết điểm đo tự đặt"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px]"
              >
                Đổi ảnh
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-3 overflow-auto bg-[#040811]">
            <div
              ref={customImageContainerRef}
              onClick={handleCustomImageClick}
              className={`relative inline-block max-w-full max-h-full ${
                isPlacingPin ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                src={customPhotoUrl}
                alt="Ảnh bo mạch thực tế của người dùng"
                className="max-h-[460px] w-auto object-contain rounded-lg border border-slate-700 shadow-2xl"
              />
              {showCustomPins &&
                customPins.map((pin) => {
                  const isActive = selectedCustomPinId === pin.id;
                  return (
                    <div
                      key={pin.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomPinId(pin.id);
                      }}
                      style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 border-slate-950 shadow-lg transition-transform ${
                          isActive ? 'scale-125 bg-cyan-400' : 'bg-amber-400 group-hover:scale-110'
                        }`}
                      />
                      <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-400/50 text-[10px] font-mono whitespace-nowrap text-amber-200 shadow">
                        {pin.label}: <span className="text-emerald-300">{pin.expectedValue}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-300">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-100 mb-1">
            Tải Ảnh Chụp Bo Mạch Thực Tế
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Kéo thả ảnh chụp Mainboard hoặc Nguồn ATX của bạn vào đây để đánh dấu điểm đo & so sánh song song với mạch chuẩn.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Chọn Ảnh Từ Máy Tính
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#060c16] text-slate-100 rounded-xl border border-cyan-500/20 overflow-hidden shadow-2xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLoadPhotoFile(f);
        }}
      />

      {/* Top BoardView Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/95 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Crosshair className="w-3.5 h-3.5" />
            <span>BoardView & Đo Đạc Trên Ảnh</span>
          </div>

          {/* Dual Source Mode Switcher */}
          <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSourceMode('reference')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sourceMode === 'reference'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mạch Chuẩn HD
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('side_by_side')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                sourceMode === 'side_by_side'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>So Sánh Song Song</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('custom_only')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                sourceMode === 'custom_only'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Ảnh Thực Tế</span>
            </button>
          </div>
        </div>

        {/* Layer & Navigation Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
              showZones
                ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vùng Mạch</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAirwires((v) => !v)}
            className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
              showAirwires
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Dò Thông Mạch (Airwire)</span>
          </button>

          {activeFault && (
            <button
              type="button"
              onClick={() => setShowSuspects((v) => !v)}
              className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
                showSuspects
                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Điểm Lỗi</span>
            </button>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))}
              className="p-1.5 hover:bg-slate-800 text-slate-300"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 border-x border-slate-800">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
              className="p-1.5 hover:bg-slate-800 text-slate-300"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 hover:bg-slate-800 text-cyan-300 border-l border-slate-800"
              title="Đặt lại góc nhìn"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigateMode('viewer3d')}
            className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs flex items-center gap-1"
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateMode('schematic')}
            className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs"
          >
            Nguyên Lý
          </button>
          <button
            type="button"
            onClick={() => onNavigateMode('diagnostics')}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Chẩn Đoán</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Board Canvas(es) + Virtual Multimeter Sidebar */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0 overflow-hidden">
        {/* Board Canvas Area */}
        <div className="xl:col-span-9 flex flex-col min-h-0 border-b xl:border-b-0 xl:border-r border-slate-800">
          {/* Net Continuity Tracer Quick Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 border-b border-slate-800/80 overflow-x-auto">
            <span className="text-[11px] text-slate-400 shrink-0">Dò Net (Airwire):</span>
            {selectedBoard.rails.map((rail) => {
              const active = selectedNetId === rail.id;
              return (
                <button
                  key={rail.id}
                  type="button"
                  onClick={() => onSelectNet(active ? null : rail.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-all ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
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
            {selectedNetId && (
              <button
                type="button"
                onClick={() => onSelectNet(null)}
                className="shrink-0 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          {/* Canvas Split or Single View */}
          <div
            className={`flex-1 min-h-0 p-3 bg-[#040912] overflow-hidden ${
              sourceMode === 'side_by_side'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                : 'flex flex-col'
            }`}
          >
            {sourceMode !== 'custom_only' && (
              <div
                onWheel={(e) => {
                  e.preventDefault();
                  setZoom((z) => Math.max(0.45, Math.min(2.2, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  setIsPanning(true);
                  panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
                }}
                onPointerMove={(e) => {
                  if (!isPanning) return;
                  setPan({
                    x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
                    y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
                  });
                }}
                onPointerUp={() => setIsPanning(false)}
                onPointerLeave={() => setIsPanning(false)}
                className={`relative flex-1 rounded-xl border border-slate-800 bg-[#050b16] overflow-hidden flex items-center justify-center min-h-[340px] ${
                  isPanning ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    width: BOARD_VIEW_W,
                    height: BOARD_VIEW_H,
                  }}
                  className="transition-transform duration-75"
                >
                  <RealisticPcbRenderer
                    board={selectedBoard}
                    selectedComponentId={selectedComponentId}
                    selectedPin={probedPin}
                    selectedNetId={selectedNetId}
                    activeFault={activeFault}
                    showZones={showZones}
                    showAirwires={showAirwires}
                    showSuspects={showSuspects}
                    onSelectComponent={onSelectComponent}
                    onProbePin={handleProbePin}
                  />
                </div>

                {/* Safety warning overlay for PSU boards */}
                {selectedBoard.safetyWarning && (
                  <div className="pointer-events-none absolute bottom-2 left-2 right-2 md:right-auto md:max-w-md rounded-lg bg-amber-950/90 border border-amber-500/50 px-2.5 py-1.5 text-[11px] text-amber-200 flex items-center gap-1.5 backdrop-blur">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{selectedBoard.safetyWarning}</span>
                  </div>
                )}
              </div>
            )}

            {(sourceMode === 'custom_only' || sourceMode === 'side_by_side') && (
              <div className="flex-1 min-h-[340px] h-full">{renderCustomPhotoPane()}</div>
            )}
          </div>
        </div>

        {/* Right Panel: Virtual Multimeter & Component Summary */}
        <div className="xl:col-span-3 p-3 bg-slate-950/80 overflow-y-auto flex flex-col gap-3">
          <VirtualMultimeter
            mode={meterMode}
            onChangeMode={setMeterMode}
            probedComponent={selectedComponent}
            probedPin={probedPin}
            activeFault={activeFault}
            onSelectPin={(pin) => {
              if (selectedComponent) handleProbePin(selectedComponent, pin);
            }}
          />

          {/* Selected Component Tips */}
          {selectedComponent ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {selectedComponent.id}
                </span>
                {selectedComponent.partNumber && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">
                    {selectedComponent.partNumber}
                  </span>
                )}
              </div>
              <div className="font-semibold text-slate-100">{selectedComponent.label}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {selectedComponent.description}
              </p>
              {selectedComponent.replacementTips && (
                <div className="rounded bg-cyan-950/40 border border-cyan-500/30 p-2 text-[11px] text-cyan-200">
                  <strong>Mẹo thay thế:</strong> {selectedComponent.replacementTips}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400 leading-relaxed">
              Nhấp vào linh kiện hoặc chấm pad vàng trên ảnh bo mạch để chạm que đo đồng hồ vạn năng và dò đường mạch liên thông.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
