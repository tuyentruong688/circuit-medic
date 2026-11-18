import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Crosshair,
  Eye,
  EyeOff,
  FileCode2,
  ImagePlus,
  KeyRound,
  Layers,
  Microscope,
  Radar,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  Wrench,
  Zap,
} from 'lucide-react';
import type { FaultCase, HardwareBoard, ModuleSharedProps } from '../../types/circuit';
import { SCAN_PRESETS } from './presetGenerator';
import type {
  DetectedAnomaly,
  DetectedZoneBox,
  ScanAnalysisResult,
  ScanEngineMode,
  ScanInputMode,
  ScanPreset,
} from './scannerTypes';
import {
  loadStoredGeminiKey,
  runGeminiVisionScan,
  runLocalVisionScan,
  saveStoredGeminiKey,
} from './visionEngine';

export const BoardScannerModule: React.FC<ModuleSharedProps> = ({
  boards,
  selectedBoard,
  onSelectBoard,
  onSelectComponent,
  onSelectFault,
  onNavigateMode,
  faults,
}) => {
  const [inputMode, setInputMode] = useState<ScanInputMode>('preset');
  const [engineMode, setEngineMode] = useState<ScanEngineMode>('local');
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>(() => loadStoredGeminiKey());
  const [keySavedFlash, setKeySavedFlash] = useState(false);

  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLabel, setImageLabel] = useState<string>('');
  const [hintText, setHintText] = useState<string>('');
  const [targetPresetBoardId, setTargetPresetBoardId] = useState<string | undefined>(undefined);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState('Sẵn sàng quét bảng mạch');
  const [scanResult, setScanResult] = useState<ScanAnalysisResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [showZonesOverlay, setShowZonesOverlay] = useState(true);
  const [showAnomaliesOverlay, setShowAnomaliesOverlay] = useState(true);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [chosenReferenceBoardId, setChosenReferenceBoardId] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [stopCamera]);

  useEffect(() => {
    if (inputMode !== 'camera') {
      stopCamera();
    }
  }, [inputMode, stopCamera]);

  const executeScan = useCallback(
    async (
      targetUrl: string,
      customHint: string,
      overrideBoardId?: string,
      overrideEngine?: ScanEngineMode
    ) => {
      if (!targetUrl || boards.length === 0) return;

      const activeEngine = overrideEngine ?? engineMode;
      setIsScanning(true);
      setScanError(null);
      setSelectedOverlayId(null);

      const stages =
        activeEngine === 'gemini' && geminiKey.trim()
          ? [
              'Đang chuẩn hóa khung hình mạch điện tử...',
              'Đang gửi ảnh tới Gemini 2.5 Flash Vision...',
              'Đang đối chiếu kho dữ liệu linh kiện & pan-bệnh...',
            ]
          : [
              'Đang quét histogram màu Solder Mask & mật độ đồng...',
              'Đang phân cụm vết cháy đen, phù tụ & oxy hóa chân IC...',
              'Đang khớp chữ ký phần cứng & ánh xạ vùng chức năng...',
            ];

      setScanStageText(stages[0]);
      const t1 = window.setTimeout(() => setScanStageText(stages[1]), 420);
      const t2 = window.setTimeout(() => setScanStageText(stages[2]), 860);

      try {
        // Keep laser scan animation visible briefly for clear visual feedback
        const minSweepDelay = new Promise((r) => window.setTimeout(r, 1150));
        const analysisPromise =
          activeEngine === 'gemini'
            ? runGeminiVisionScan({
                apiKey: geminiKey,
                imageUrl: targetUrl,
                boards,
                faults,
                hintText: customHint,
                targetBoardOverrideId: overrideBoardId,
              })
            : runLocalVisionScan({
                imageUrl: targetUrl,
                boards,
                faults,
                hintText: customHint,
                targetBoardOverrideId: overrideBoardId,
              });

        const [result] = await Promise.all([analysisPromise, minSweepDelay]);
        setScanResult(result);
        setChosenReferenceBoardId(result.primaryBoard.id);
        if (result.anomalies[0]) {
          setSelectedOverlayId(result.anomalies[0].id);
        }
      } catch (err) {
        setScanError(
          err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân tích hình ảnh bảng mạch.'
        );
      } finally {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        setIsScanning(false);
      }
    },
    [boards, engineMode, faults, geminiKey]
  );

  // Load first preset on initial mount for instant demonstration
  useEffect(() => {
    if (!imageUrl && SCAN_PRESETS.length > 0 && boards.length > 0) {
      const first = SCAN_PRESETS[0];
      const generated = first.generateImage();
      setActivePresetId(first.id);
      setImageUrl(generated);
      setImageLabel(first.title);
      setHintText(first.defaultHintText);
      setTargetPresetBoardId(first.targetBoardId);
      void executeScan(generated, first.defaultHintText, first.targetBoardId, 'local');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.length]);

  const handleSelectPreset = (preset: ScanPreset) => {
    stopCamera();
    const generated = preset.generateImage();
    setActivePresetId(preset.id);
    setImageUrl(generated);
    setImageLabel(preset.title);
    setHintText(preset.defaultHintText);
    setTargetPresetBoardId(preset.targetBoardId);
    void executeScan(generated, preset.defaultHintText, preset.targetBoardId);
  };

  const handleFileAccepted = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setActivePresetId(null);
    setTargetPresetBoardId(undefined);
    setImageUrl(url);
    setImageLabel(file.name);
    void executeScan(url, hintText, undefined);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileAccepted(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Trình duyệt hoặc môi trường hiện tại không hỗ trợ API Camera (getUserMedia). Bạn có thể chuyển sang tab Tải ảnh hoặc Bộ Mẫu Thực Chiến.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setCameraError(
        `Không thể truy cập Camera/Webcam (${msg || 'Quyền truy cập bị từ chối hoặc chưa cắm thiết bị'}). Hãy cấp quyền Camera hoặc tải ảnh chụp từ máy.`
      );
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapshotUrl = canvas.toDataURL('image/jpeg', 0.92);

    setActivePresetId(null);
    setTargetPresetBoardId(undefined);
    setImageUrl(snapshotUrl);
    setImageLabel(`Ảnh chụp Camera (${new Date().toLocaleTimeString('vi-VN')})`);
    stopCamera();
    void executeScan(snapshotUrl, hintText, undefined);
  };

  const handleSaveApiKey = () => {
    saveStoredGeminiKey(geminiKey);
    setKeySavedFlash(true);
    window.setTimeout(() => setKeySavedFlash(false), 2000);
  };

  const activeTargetBoard: HardwareBoard = useMemo(() => {
    if (chosenReferenceBoardId) {
      const found = boards.find((b) => b.id === chosenReferenceBoardId);
      if (found) return found;
    }
    return scanResult?.primaryBoard ?? selectedBoard;
  }, [boards, chosenReferenceBoardId, scanResult, selectedBoard]);

  const primarySuggestedFault: FaultCase | null = useMemo(() => {
    if (!scanResult) return null;
    if (scanResult.suggestedFaults.length > 0) return scanResult.suggestedFaults[0];
    return faults.find((f) => f.category === activeTargetBoard.category) ?? null;
  }, [activeTargetBoard.category, faults, scanResult]);

  const handleOpenBoardInMode = (mode: 'viewer3d' | 'schematic' | 'boardview') => {
    onSelectBoard(activeTargetBoard.id);
    onNavigateMode(mode);
  };

  const handleStartDiagnostics = (fault?: FaultCase | null) => {
    const chosen = fault ?? primarySuggestedFault;
    onSelectBoard(activeTargetBoard.id);
    if (chosen) {
      onSelectFault(chosen);
      if (chosen.suspectComponentIds.length > 0) {
        const compMatch = activeTargetBoard.components.find((c) =>
          chosen.suspectComponentIds.includes(c.id)
        );
        if (compMatch) {
          onSelectComponent(compMatch.id);
        }
      }
    }
    onNavigateMode('diagnostics');
  };

  const selectedAnomaly: DetectedAnomaly | undefined = scanResult?.anomalies.find(
    (a) => a.id === selectedOverlayId
  );
  const selectedZone: DetectedZoneBox | undefined = scanResult?.detectedZones.find(
    (z) => z.id === selectedOverlayId
  );

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 p-4 lg:p-6 text-slate-100">
      {/* Top Cyber-Scanner Header */}
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/85 p-4 lg:p-5 shadow-lg shadow-cyan-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <Radar className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white">
                  Nhận Diện Bảng Mạch &amp; Quét Lỗi Thông Minh
                </h2>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  100% Miễn Phí Online
                </span>
              </div>
              <p className="mt-1 text-xs lg:text-sm text-slate-400">
                Phân tích ảnh chụp thực tế Mainboard / Nguồn ATX để nhận diện model, khoanh vùng khối mạch, phát hiện cháy nổ / phù tụ / oxy hóa và chuyển thẳng sang 3D, BoardView hoặc Quy trình sửa chữa.
              </p>
            </div>
          </div>

          {/* Engine Selector + Optional Gemini BYOK Drawer Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-700/80 bg-slate-950/90 p-1">
              <button
                type="button"
                onClick={() => setEngineMode('local')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  engineMode === 'local'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Microscope className="h-3.5 w-3.5" />
                Local Vision (0đ)
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('gemini')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  engineMode === 'gemini'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Gemini 2.5 Vision (BYOK)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowKeyDrawer((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-200 transition"
            >
              <KeyRound className="h-3.5 w-3.5 text-violet-400" />
              <span>API Key {geminiKey.trim() ? '(Đã lưu)' : '(Tùy chọn)'}</span>
              {showKeyDrawer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Gemini Free-Tier BYOK Settings Drawer */}
        <AnimatePresence>
          {showKeyDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl border border-violet-500/30 bg-slate-950/90 p-3.5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-violet-300">
                      Google AI Studio Gemini API Key (Miễn phí BYOK — Tùy chọn)
                    </label>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Key chỉ lưu cục bộ trong <code className="text-slate-300">localStorage</code> trình duyệt của bạn và chỉ gửi trực tiếp tới{' '}
                      <code className="text-slate-300">generativelanguage.googleapis.com</code> (<code className="text-slate-300">gemini-2.5-flash</code>). Nếu bỏ trống, hệ thống tự động dùng Engine 1 (Local Vision) miễn phí 100%.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy... (dán key Google AI Studio miễn phí tại đây)"
                        className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition"
                      >
                        {keySavedFlash ? 'Đã lưu vào trình duyệt!' : 'Lưu Key'}
                      </button>
                      {geminiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setGeminiKey('');
                            saveStoredGeminiKey('');
                          }}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa Key
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Workspace Grid: Left Input & Viewport | Right Diagnostics & Handoff */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* LEFT COLUMN (7 cols): Input Modes + Cyber-Scanner Viewport */}
        <div className="flex flex-col gap-4 xl:col-span-7">
          {/* 3 Input Mode Tabs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setInputMode('preset')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  inputMode === 'preset'
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Zap className="h-4 w-4 text-amber-400" />
                Bộ Mẫu Thực Chiến (6)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  inputMode === 'upload'
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Upload className="h-4 w-4 text-cyan-400" />
                Tải Ảnh / Kéo Thả
              </button>
              <button
                type="button"
                onClick={() => setInputMode('camera')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  inputMode === 'camera'
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Camera className="h-4 w-4 text-emerald-400" />
                Chụp Camera / Webcam
              </button>
            </div>

            {/* Mode Content Area */}
            <div className="mt-3">
              {inputMode === 'preset' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SCAN_PRESETS.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`group flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                          isActive
                            ? 'border-cyan-400/70 bg-cyan-500/10'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                preset.category === 'psu'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {preset.category === 'psu' ? 'PSU ATX' : 'Mainboard'}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                preset.severityBadge === 'critical'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : preset.severityBadge === 'warning'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {preset.defectTag}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-cyan-300">
                            {preset.title}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                          {preset.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {inputMode === 'upload' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-950/70 hover:border-cyan-500/60'
                  }`}
                >
                  <ImagePlus className="h-9 w-9 text-cyan-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-200">
                    Kéo thả ảnh chụp Mainboard hoặc Nguồn ATX vào đây
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hỗ trợ JPG, PNG, WEBP • Xử lý hoàn toàn trên trình duyệt hoặc qua Gemini Vision BYOK
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileAccepted(file);
                    }}
                  />
                </div>
              )}

              {inputMode === 'camera' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  {cameraError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                  <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-black aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`h-full w-full object-contain ${cameraActive ? 'block' : 'hidden'}`}
                    />
                    {!cameraActive && (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <Camera className="h-10 w-10 text-slate-500" />
                        <p className="text-xs text-slate-400">
                          Hướng camera điện thoại hoặc webcam thẳng góc vào bảng mạch cần soi lỗi.
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                        >
                          Bật Camera Trực Tiếp
                        </button>
                      </div>
                    )}
                  </div>
                  {cameraActive && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Tắt Camera
                      </button>
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                      >
                        <ScanLine className="h-4 w-4" />
                        Chụp Ảnh &amp; Quét Ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Technician Hint + Re-Scan Bar */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                placeholder="Ghi chú thêm triệu chứng / mã silkscreen (vd: B760-F cháy VRM, mất 5VSB, nổ cầu chì)..."
                className="flex-1 rounded-xl border border-slate-700/90 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={!imageUrl || isScanning}
                onClick={() => void executeScan(imageUrl, hintText, targetPresetBoardId)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50 transition"
              >
                <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Đang Quét...' : 'Quét & Phân Tích'}
              </button>
            </div>
          </div>

          {/* Cyber-Scanner Optical Viewport with Bounding Boxes & Laser Beam */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-3 shadow-xl">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Crosshair className="h-4 w-4" />
                <span className="truncate max-w-[280px] sm:max-w-[380px]">
                  {imageLabel || 'Khung quét quang học'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowZonesOverlay((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                    showZonesOverlay
                      ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  {showZonesOverlay ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  Khối mạch
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnomaliesOverlay((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                    showAnomaliesOverlay
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  {showAnomaliesOverlay ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  Điểm lỗi
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 aspect-[3/2]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageLabel || 'Scanned PCB'}
                  className="h-full w-full object-contain select-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  Chọn mẫu thực chiến, tải ảnh hoặc chụp camera để bắt đầu quét.
                </div>
              )}

              {/* Subtle HUD Corner Brackets */}
              <div className="pointer-events-none absolute inset-2">
                <div className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-cyan-400/70" />
                <div className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-cyan-400/70" />
                <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-400/70" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-400/70" />
              </div>

              {/* Zone Bounding Boxes */}
              {!isScanning &&
                showZonesOverlay &&
                scanResult?.detectedZones.map((zone) => {
                  const isSelected = selectedOverlayId === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedOverlayId(zone.id)}
                      style={{
                        left: `${zone.box.x}%`,
                        top: `${zone.box.y}%`,
                        width: `${zone.box.w}%`,
                        height: `${zone.box.h}%`,
                        borderColor: zone.color,
                        backgroundColor: isSelected ? `${zone.color}28` : `${zone.color}12`,
                      }}
                      className="absolute rounded-md border border-dashed text-left transition hover:brightness-125"
                    >
                      <span
                        style={{ backgroundColor: zone.color }}
                        className="inline-block rounded-br px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow"
                      >
                        {zone.name} ({zone.confidence}%)
                      </span>
                    </button>
                  );
                })}

              {/* Anomaly Bounding Boxes */}
              {!isScanning &&
                showAnomaliesOverlay &&
                scanResult?.anomalies.map((anom) => {
                  const isSelected = selectedOverlayId === anom.id;
                  const borderCls =
                    anom.severity === 'critical'
                      ? 'border-rose-500 bg-rose-500/20'
                      : anom.severity === 'warning'
                      ? 'border-amber-400 bg-amber-500/20'
                      : 'border-emerald-400 bg-emerald-500/15';
                  const badgeCls =
                    anom.severity === 'critical'
                      ? 'bg-rose-500 text-white'
                      : anom.severity === 'warning'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-400 text-slate-950';

                  return (
                    <motion.button
                      key={anom.id}
                      type="button"
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setSelectedOverlayId(anom.id)}
                      style={{
                        left: `${anom.box.x}%`,
                        top: `${anom.box.y}%`,
                        width: `${anom.box.w}%`,
                        height: `${anom.box.h}%`,
                      }}
                      className={`absolute rounded-lg border-2 ${borderCls} ${
                        isSelected ? 'ring-2 ring-white shadow-lg shadow-rose-500/30' : ''
                      }`}
                    >
                      <span
                        className={`absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold shadow ${badgeCls}`}
                      >
                        {anom.severity === 'critical' ? 'LỖI NGHIÊM TRỌNG' : anom.severity === 'warning' ? 'CẢNH BÁO' : 'KIỂM TRA'} • {anom.confidence}%
                      </span>
                    </motion.button>
                  );
                })}

              {/* Animated Cyber Laser Sweep during scanning */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-cyan-950/35 backdrop-blur-[1px]"
                  >
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '96%', '0%'] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_22px_6px_rgba(34,211,238,0.8)]"
                    />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <div className="flex items-center gap-2 rounded-full border border-cyan-400/50 bg-slate-950/90 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-lg">
                        <Activity className="h-4 w-4 animate-pulse text-cyan-400" />
                        {scanStageText}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Overlay Callout */}
            {(selectedAnomaly || selectedZone) && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs">
                {selectedAnomaly ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-rose-300">{selectedAnomaly.title}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        Độ tin cậy: {selectedAnomaly.confidence}%
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300">{selectedAnomaly.description}</p>
                    <p className="mt-1.5 text-emerald-300">
                      <span className="font-semibold">Cách kiểm tra:</span> {selectedAnomaly.recommendedCheck}
                    </p>
                  </div>
                ) : selectedZone ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sky-300">Khối mạch: {selectedZone.name}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        Độ khớp: {selectedZone.confidence}%
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300">{selectedZone.description}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Recognition Results, Safety Warning, Action Handoff & Faults */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          {scanError && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-200">
              {scanError}
            </div>
          )}

          {scanResult ? (
            <>
              {/* Fallback notice if Gemini key missing or errored */}
              {scanResult.fallbackNotice && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                  {scanResult.fallbackNotice}
                </div>
              )}

              {/* Safety Warning Banner (High Voltage PSU etc.) */}
              {scanResult.safetyWarning && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-500/50 bg-rose-950/50 p-3.5 shadow-md shadow-rose-950/20">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-rose-300">
                      Cảnh báo an toàn điện áp cao
                    </div>
                    <p className="mt-0.5 text-xs text-rose-100/90 leading-relaxed">
                      {scanResult.safetyWarning}
                    </p>
                  </div>
                </div>
              )}

              {/* Recognition Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          scanResult.detectedCategory === 'psu'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {scanResult.categoryLabel}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {scanResult.engineUsed === 'gemini' ? 'Gemini 2.5 Vision' : 'Local CV Engine'} • {scanResult.timestamp}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-white">
                      {scanResult.brandGuess} — {scanResult.modelGuess}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xl font-black text-emerald-400">{scanResult.confidence}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Độ tin cậy</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{scanResult.summaryVi}</p>

                {/* Computer Vision Telemetry Strip */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-[11px]">
                  <div>
                    <div className="text-slate-400">Màu Solder Mask</div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-200">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-white/30"
                        style={{ backgroundColor: scanResult.histogram.pcbHexEstimate }}
                      />
                      <span className="truncate">{scanResult.histogram.dominantPcbLabel.split(' ')[0]}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Cụm cháy sém</div>
                    <div
                      className={`mt-0.5 font-semibold ${
                        scanResult.histogram.charredSootRatio > 0.02 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {(scanResult.histogram.charredSootRatio * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Oxy hóa / Ẩm</div>
                    <div
                      className={`mt-0.5 font-semibold ${
                        scanResult.histogram.corrosionRatio > 0.01 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {(scanResult.histogram.corrosionRatio * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Reference Board Switcher */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Mạch chuẩn khớp nhất trong kho CircuitMedic
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {scanResult.matchedBoards.map((candidate) => {
                      const active = activeTargetBoard.id === candidate.board.id;
                      return (
                        <button
                          key={candidate.board.id}
                          type="button"
                          onClick={() => {
                            setChosenReferenceBoardId(candidate.board.id);
                            onSelectBoard(candidate.board.id);
                          }}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                            active
                              ? 'border-cyan-400/60 bg-cyan-500/15 text-white'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold truncate">{candidate.board.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{candidate.reason}</div>
                          </div>
                          <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                            {candidate.score}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4 Actionable Handoff Buttons */}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleOpenBoardInMode('viewer3d')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
                  >
                    <Box className="h-4 w-4 text-cyan-400" />
                    Mở Sơ Đồ 3D Mạch Tương Ứng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenBoardInMode('schematic')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 transition"
                  >
                    <FileCode2 className="h-4 w-4 text-indigo-400" />
                    Mở Sơ Đồ Nguyên Lý
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenBoardInMode('boardview')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
                  >
                    <Layers className="h-4 w-4 text-emerald-400" />
                    Mở BoardView Đo Đạc Trên Ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartDiagnostics(primarySuggestedFault)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Bắt Đầu Quy Trình Chẩn Đoán Sửa Chữa
                  </button>
                </div>
              </div>

              {/* Detected Anomalies & Test Points */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  Vùng Bất Thường &amp; Điểm Đo Đề Xuất
                </div>
                <div className="mt-2.5 flex flex-col gap-2">
                  {scanResult.anomalies.map((anom) => (
                    <button
                      key={anom.id}
                      type="button"
                      onClick={() => setSelectedOverlayId(anom.id)}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        selectedOverlayId === anom.id
                          ? 'border-rose-400/70 bg-rose-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{anom.title}</span>
                        <span className="text-[11px] font-bold text-amber-300">{anom.confidence}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{anom.recommendedCheck}</p>
                    </button>
                  ))}
                </div>

                {scanResult.recommendedTestPoints.length > 0 && (
                  <div className="mt-3 border-t border-slate-800 pt-2.5">
                    <div className="text-[11px] font-semibold text-slate-400">
                      Điểm đo nhanh đồng hồ vạn năng:
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {scanResult.recommendedTestPoints.map((tp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {tp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Fault Cases from Knowledge Base */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Wrench className="h-4 w-4 text-amber-400" />
                  Pan Bệnh Gợi Ý Liên Quan ({scanResult.suggestedFaults.length})
                </div>
                <div className="mt-2.5 flex flex-col gap-2">
                  {scanResult.suggestedFaults.map((fault) => (
                    <div
                      key={fault.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-100">{fault.title}</div>
                          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                            {fault.symptom}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            fault.severity === 'critical_hv' || fault.severity === 'high'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {fault.severity === 'critical_hv' ? 'HV Nguy Hiểm' : fault.severity}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-300 truncate">
                          {fault.quickFixSummary}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartDiagnostics(fault)}
                          className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition"
                        >
                          Chẩn đoán
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-xs text-slate-400">
              <Radar className="h-10 w-10 text-cyan-500/60 mb-2" />
              Đang chờ dữ liệu quét bảng mạch...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
