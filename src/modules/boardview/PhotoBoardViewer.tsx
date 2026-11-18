import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  ClipboardPaste,
  Columns,
  Crosshair,
  GitBranch,
  Image as ImageIcon,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Search,
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
import {
  CustomPinAnnotation,
  RealPhotoOverlayCanvas,
} from './RealPhotoOverlayCanvas';
import { MultimeterMode, VirtualMultimeter } from './VirtualMultimeter';

type SourceMode = 'real_photo' | 'layout_2d' | 'side_by_side';

export const PhotoBoardViewer: React.FC<ModuleSharedProps> = ({
  selectedBoard,
  selectedComponentId,
  onSelectComponent,
  selectedNetId,
  onSelectNet,
  activeFault,
  thermalMode,
  onNavigateMode,
  embedded = false,
}) => {
  const hasOfficialRealPhoto = Boolean(selectedBoard.realPhoto?.imageUrl);

  const [sourceMode, setSourceMode] = useState<SourceMode>(() =>
    hasOfficialRealPhoto ? 'real_photo' : 'layout_2d'
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [customPhotoName, setCustomPhotoName] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [showComponents, setShowComponents] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showAirwires, setShowAirwires] = useState(true);
  const [showSuspects, setShowSuspects] = useState(true);
  const [showLoupe, setShowLoupe] = useState(false);
  const [showCustomPins, setShowCustomPins] = useState(true);
  const [isPlacingPin, setIsPlacingPin] = useState(false);

  const [customPins, setCustomPins] = useState<CustomPinAnnotation[]>([]);
  const [newPinLabel, setNewPinLabel] = useState('TP_5V');
  const [newPinExpected, setNewPinExpected] = useState('5.00V');
  const [selectedCustomPinId, setSelectedCustomPinId] = useState<string | null>(null);

  const [meterMode, setMeterMode] = useState<MultimeterMode>('voltage');
  const [probedPin, setProbedPin] = useState<PinMeasurement | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically default to 'real_photo' when switching to a board that has a real photo
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    if (selectedBoard.realPhoto?.imageUrl) {
      setSourceMode('real_photo');
    } else if (!customPhotoUrl) {
      setSourceMode((prev) => (prev === 'real_photo' ? 'real_photo' : 'layout_2d'));
    }
  }, [selectedBoard.id, selectedBoard.realPhoto?.imageUrl]);

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
    setCustomPhotoName(file.name || 'Ảnh dán từ Clipboard');
    setSourceMode('real_photo');
  }, []);

  // Support Ctrl+V image paste directly into PhotoBoardViewer
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            handleLoadPhotoFile(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleLoadPhotoFile]);

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

  const handlePlaceCustomPin = (xPct: number, yPct: number) => {
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
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const activeRealPhotoUrl = customPhotoUrl ?? selectedBoard.realPhoto?.imageUrl ?? null;
  const isUsingCustomPhoto = Boolean(customPhotoUrl);

  const renderRealPhotoPane = () => {
    if (activeRealPhotoUrl) {
      return (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDropFile}
          className={`flex h-full min-h-[300px] flex-col rounded-xl overflow-hidden ${
            isDraggingFile ? 'ring-2 ring-cyan-400' : ''
          }`}
        >
          {/* Compact real-photo action strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <ImageIcon className="h-3 w-3" />
                {isUsingCustomPhoto ? 'Ảnh tự tải lên' : 'Ảnh Thực Tế Xác Thực'}
              </span>
              <span className="truncate text-[11px] text-slate-300">
                {isUsingCustomPhoto ? customPhotoName : selectedBoard.realPhoto?.sourceLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {isUsingCustomPhoto && (
                <>
                  <input
                    type="text"
                    value={newPinLabel}
                    onChange={(e) => setNewPinLabel(e.target.value)}
                    placeholder="Tên điểm đo"
                    className="w-20 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-amber-300"
                  />
                  <input
                    type="text"
                    value={newPinExpected}
                    onChange={(e) => setNewPinExpected(e.target.value)}
                    placeholder="Giá trị"
                    className="w-16 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300"
                  />
                </>
              )}

              <button
                type="button"
                onClick={() => setIsPlacingPin((v) => !v)}
                className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] ${
                  isPlacingPin
                    ? 'animate-pulse border-amber-400 bg-amber-500/25 text-amber-200'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title="Nhấp để gắn ghi chú điểm đo trực tiếp lên ảnh thực tế"
              >
                <Plus className="h-3 w-3" />
                <span>{isPlacingPin ? 'Chấm lên ảnh...' : 'Gắn Điểm Đo'}</span>
              </button>

              {customPins.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCustomPins((v) => !v)}
                    className={`rounded border px-2 py-0.5 text-[11px] ${
                      showCustomPins
                        ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {customPins.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPins([])}
                    className="rounded border border-rose-500/30 bg-rose-500/15 p-1 text-rose-300 hover:bg-rose-500/30"
                    title="Xóa hết điểm đo tự đặt"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700"
              >
                {isUsingCustomPhoto ? 'Đổi ảnh' : 'Tải ảnh riêng'}
              </button>

              {isUsingCustomPhoto && hasOfficialRealPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    if (customPhotoUrl) URL.revokeObjectURL(customPhotoUrl);
                    setCustomPhotoUrl(null);
                    setCustomPhotoName('');
                  }}
                  className="rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[11px] text-cyan-200 hover:bg-cyan-500/25"
                >
                  Về ảnh gốc bo mạch
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <RealPhotoOverlayCanvas
              board={selectedBoard}
              photoUrl={activeRealPhotoUrl}
              isUserCustomPhoto={isUsingCustomPhoto}
              customPhotoName={customPhotoName}
              selectedComponentId={selectedComponentId}
              selectedPin={probedPin}
              selectedNetId={selectedNetId}
              activeFault={activeFault}
              thermalMode={thermalMode}
              showComponents={showComponents}
              showZones={showZones}
              showAirwires={showAirwires}
              showSuspects={showSuspects}
              showLoupe={showLoupe}
              showCustomPins={showCustomPins}
              isPlacingPin={isPlacingPin}
              customPins={customPins}
              selectedCustomPinId={selectedCustomPinId}
              zoom={zoom}
              pan={pan}
              onZoomChange={setZoom}
              onPanChange={setPan}
              onSelectComponent={onSelectComponent}
              onProbePin={handleProbePin}
              onPlaceCustomPin={handlePlaceCustomPin}
              onSelectCustomPin={setSelectedCustomPinId}
            />
          </div>
        </div>
      );
    }

    // Honest Empty Photo Card when no open-license real photo is available for this model
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDropFile}
        className={`flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors bg-slate-950/70 ${
          isDraggingFile ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700/80'
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-300">
          <ImageIcon className="h-6 w-6" />
        </div>
        <div className="mb-1 text-sm font-bold text-slate-100">
          Chưa Có Ảnh Chụp Thực Tế Cho {selectedBoard.name}
        </div>
        <p className="mb-4 max-w-md text-xs leading-relaxed text-slate-400">
          {selectedBoard.docsMeta?.missingDataNote ||
            'Hệ thống chưa tìm thấy ảnh chụp trần đúng đời bo mạch này ở nguồn bản quyền mở. Ứng dụng để trống trung thực (không ghép ảnh bo mạch khác để mô phỏng sai).'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Tải Ảnh Chụp Từ Máy</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            <ClipboardPaste className="h-3.5 w-3.5 text-cyan-400" />
            <span>Hoặc nhấn Ctrl+V dán ảnh</span>
          </span>

          <button
            type="button"
            onClick={() => setSourceMode('layout_2d')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Mở Bố Trí Khối 2D Tham Chiếu</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/90 text-slate-100 shadow-xl">
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {!embedded && (
            <div className="flex items-center gap-1.5 rounded-md border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-300">
              <Crosshair className="h-3.5 w-3.5" />
              <span>Ảnh Thực Tế & BoardView</span>
            </div>
          )}

          {/* Honest Mode Switcher */}
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSourceMode('real_photo')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
                sourceMode === 'real_photo'
                  ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              <span>{hasOfficialRealPhoto ? 'Ảnh Thực Tế' : 'Ảnh Thực Tế (Trống)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('layout_2d')}
              className={`rounded px-2.5 py-1 transition-colors ${
                sourceMode === 'layout_2d'
                  ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bố Trí Khối 2D
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('side_by_side')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
                sourceMode === 'side_by_side'
                  ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>Song Song</span>
            </button>
          </div>
        </div>

        {/* Layer & Navigation Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {sourceMode !== 'layout_2d' && (
            <>
              <button
                type="button"
                onClick={() => setShowComponents((v) => !v)}
                className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                  showComponents
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
                title="Hiện/Ẩn khung đánh dấu linh kiện trên ảnh thực tế"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>Linh Kiện</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoupe((v) => !v)}
                className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                  showLoupe
                    ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
                title="Bật kính lúp 2.5× soi chân IC & ký hiệu trên ảnh thực tế"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Soi 2.5×</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              showZones
                ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-200'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Phân Vùng</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAirwires((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              showAirwires
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Dò Net</span>
          </button>

          {activeFault && (
            <button
              type="button"
              onClick={() => setShowSuspects((v) => !v)}
              className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                showSuspects
                  ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Điểm Lỗi</span>
            </button>
          )}

          <div className="flex items-center overflow-hidden rounded-md border border-slate-800 bg-slate-900">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:bg-slate-800"
              title="Thu nhỏ"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="border-x border-slate-800 px-2 font-mono text-[11px] text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:bg-slate-800"
              title="Phóng to"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="border-l border-slate-800 p-1.5 text-cyan-300 hover:bg-slate-800"
              title="Đặt lại góc nhìn"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {!embedded && (
            <>
              {selectedBoard.supports3DSimulation !== false && (
                <button
                  type="button"
                  onClick={() => onNavigateMode('viewer3d')}
                  className="flex items-center gap-1 rounded border border-indigo-400/40 bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-500/30"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>3D</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateMode('schematic')}
                className="rounded border border-cyan-400/40 bg-cyan-500/20 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-500/30"
              >
                Nguyên Lý
              </button>
              <button
                type="button"
                onClick={() => onNavigateMode('diagnostics')}
                className="hidden items-center gap-1 rounded border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30 sm:flex"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Chẩn Đoán</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace: Board Canvas(es) + Optional Virtual Multimeter Sidebar */}
      <div
        className={`flex-1 min-h-0 overflow-hidden ${
          embedded ? 'flex flex-col' : 'grid grid-cols-1 xl:grid-cols-12'
        }`}
      >
        {/* Board Canvas Area */}
        <div
          className={`${
            embedded ? 'flex-1' : 'xl:col-span-9 border-b xl:border-b-0 xl:border-r border-slate-800'
          } flex flex-col min-h-0`}
        >
          {/* Net Continuity Tracer Quick Selector (Hidden when embedded since TopBar already has it) */}
          {!embedded && (
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800/80 bg-slate-900/70 px-3 py-1.5">
              <span className="shrink-0 text-[11px] text-slate-400">Dò Net (Airwire):</span>
              {selectedBoard.rails.map((rail) => {
                const active = selectedNetId === rail.id;
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => onSelectNet(active ? null : rail.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] transition-all ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
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
                  className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          )}

          {/* Canvas Split or Single View */}
          <div
            className={`flex-1 min-h-0 overflow-hidden bg-[#0a101d] p-2.5 ${
              sourceMode === 'side_by_side'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
                : 'flex flex-col'
            }`}
          >
            {(sourceMode === 'real_photo' || sourceMode === 'side_by_side') && (
              <div className="flex-1 min-h-[280px] h-full">{renderRealPhotoPane()}</div>
            )}

            {(sourceMode === 'layout_2d' || sourceMode === 'side_by_side') && (
              <div
                onWheel={(e) => {
                  e.preventDefault();
                  setZoom((z) =>
                    Math.max(0.45, Math.min(2.4, Number((z + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))))
                  );
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
                className={`cm-preserve-dark relative flex flex-1 min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#070d19] ${
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
                    showZones={showZones || sourceMode === 'layout_2d'}
                    showAirwires={showAirwires}
                    showSuspects={showSuspects}
                    onSelectComponent={onSelectComponent}
                    onProbePin={handleProbePin}
                  />
                </div>

                {/* Label badge reminding this is a reference diagram, not a real photo */}
                <div className="pointer-events-none absolute top-2.5 left-2.5 rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-slate-300 backdrop-blur">
                  Sơ đồ bố trí khối 2D (Tham chiếu vị trí tương đối)
                </div>

                {selectedBoard.safetyWarning && (
                  <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/90 px-2.5 py-1.5 text-[11px] text-amber-200 backdrop-blur md:right-auto md:max-w-md">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="truncate">{selectedBoard.safetyWarning}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Virtual Multimeter & Component Summary (Only in full standalone mode) */}
        {!embedded && (
          <div className="xl:col-span-3 flex flex-col gap-3 overflow-y-auto bg-slate-950/85 p-3">
            <div className="cm-preserve-dark">
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
            </div>

            {selectedComponent ? (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-300">
                    {selectedComponent.id}
                  </span>
                  {selectedComponent.partNumber && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      {selectedComponent.partNumber}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-100">{selectedComponent.label}</div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {selectedComponent.description}
                </p>
                {selectedComponent.replacementTips && (
                  <div className="rounded border border-cyan-500/30 bg-cyan-950/40 p-2 text-[11px] text-cyan-200">
                    <strong>Mẹo thay thế:</strong> {selectedComponent.replacementTips}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs leading-relaxed text-slate-400">
                Nhấp vào linh kiện trên ảnh thực tế hoặc sơ đồ 2D để đo thông số chuẩn từng chân và dò đường mạch liên thông.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
