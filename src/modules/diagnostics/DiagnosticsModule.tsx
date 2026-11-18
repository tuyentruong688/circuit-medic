import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Crosshair,
  Flame,
  Gauge,
  GitBranch,
  HelpCircle,
  Image,
  Lightbulb,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  SplitSquareHorizontal,
  Stethoscope,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  BoardComponent,
  DeviceCategory,
  DiagnosticStep,
  FaultCase,
  HardwareBoard,
  ModuleSharedProps,
  PowerRailNet,
  ViewMode,
} from '../../types/circuit';
import { evaluateLiveMeasurement, type MeasurementEvaluation } from './measurementEvaluator';
import { POST_CODE_ITEMS, type PostCodeItem } from './postCodeData';

const BRAND_FILTERS = [
  { id: 'all', label: 'Tất cả hãng' },
  { id: 'ASUS', label: 'ASUS' },
  { id: 'Gigabyte', label: 'Gigabyte' },
  { id: 'MSI', label: 'MSI' },
  { id: 'ASRock', label: 'ASRock' },
  { id: 'Corsair', label: 'Corsair' },
  { id: 'Seasonic', label: 'Seasonic' },
  { id: 'Cooler Master', label: 'Cooler Master' },
  { id: 'ATX', label: 'ATX Phổ Thông' },
];

const SEVERITY_META: Record<
  FaultCase['severity'],
  { label: string; badgeClass: string; borderClass: string }
> = {
  critical_hv: {
    label: 'NGUY HIỂM CAO ÁP 390VDC',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    borderClass: 'border-rose-500/40',
  },
  high: {
    label: 'Nghiêm trọng',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500/30',
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borderClass: 'border-cyan-500/30',
  },
  low: {
    label: 'Nhẹ / Cấu hình',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500/30',
  },
};

const MEASURE_MODE_LABELS: Record<
  DiagnosticStep['measureMode'],
  { label: string; unitHint: string; colorClass: string }
> = {
  voltage: {
    label: 'Đo Điện Áp DC (V)',
    unitHint: 'VD: 3.31V, 12.02V, 390V, 0V',
    colorClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  diode: {
    label: 'Đo Diode Drop (Que đỏ Mass)',
    unitHint: 'VD: 0.002V (chạm), 0.435V, OL',
    colorClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
  resistance: {
    label: 'Đo Điện Trở (Ω)',
    unitHint: 'VD: 0.8Ω, 120Ω, 10kΩ, OL',
    colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  visual: {
    label: 'Kiểm Tra Trực Quan / Nhiệt',
    unitHint: 'VD: Phù tụ, cháy nổ, mùi khét hoặc nhập áp đo kèm',
    colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  oscilloscope: {
    label: 'Đo Xung Dao Động Ký',
    unitHint: 'VD: 3.3V, 1.8V hoặc nhập biên độ đo',
    colorClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  },
};

type StepResult = 'pending' | 'pass' | 'fail';

export const DiagnosticsModule: React.FC<ModuleSharedProps> = ({
  boards,
  selectedBoard,
  onSelectBoard,
  onSelectComponent,
  onSelectNet,
  activeFault,
  onSelectFault,
  onNavigateMode,
  faults,
}) => {
  // Filters
  const [deviceFilter, setDeviceFilter] = useState<'all' | DeviceCategory>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | FaultCase['severity']>('all');
  const [onlyCurrentBoard, setOnlyCurrentBoard] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPostCode, setSelectedPostCode] = useState<PostCodeItem | null>(null);

  // Wizard state per fault
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepResults, setStepResults] = useState<Record<string, StepResult>>({});
  const [measurementInputs, setMeasurementInputs] = useState<Record<string, string>>({});
  const [wizardOutcome, setWizardOutcome] = useState<'active' | 'resolved' | 'failed'>('active');

  const currentFault = useMemo<FaultCase | null>(() => {
    if (activeFault) return activeFault;
    return faults[0] ?? null;
  }, [activeFault, faults]);

  // Reset wizard when fault changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setStepResults({});
    setMeasurementInputs({});
    setWizardOutcome('active');
  }, [currentFault?.id]);

  // Filtered fault list
  const filteredFaults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faults.filter((f) => {
      if (deviceFilter !== 'all' && f.category !== deviceFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (onlyCurrentBoard) {
        const matchesSpecific = f.boardId === selectedBoard.id;
        const matchesGeneric =
          (f.boardId === 'all_motherboards' && selectedBoard.category === 'motherboard') ||
          (f.boardId === 'all_psu' && selectedBoard.category === 'psu');
        if (!matchesSpecific && !matchesGeneric) return false;
      }
      if (brandFilter !== 'all') {
        const brandMatch =
          f.brandTag.toLowerCase().includes(brandFilter.toLowerCase()) ||
          f.title.toLowerCase().includes(brandFilter.toLowerCase()) ||
          (brandFilter === 'ATX' &&
            (f.brandTag.toLowerCase().includes('generic') ||
              f.brandTag.toLowerCase().includes('phổ thông') ||
              f.boardId === 'generic-atx-tl494' ||
              f.boardId === 'all_psu'));
        if (!brandMatch) return false;
      }
      if (selectedPostCode) {
        const haystack = [
          f.title,
          f.symptom,
          f.postCode ?? '',
          f.quickFixSummary,
          ...f.affectedRails,
          ...f.suspectComponentIds,
        ]
          .join(' ')
          .toLowerCase();
        const matchesPost =
          f.category === selectedPostCode.category &&
          selectedPostCode.searchKeywords.some((kw) => haystack.includes(kw.toLowerCase()));
        if (!matchesPost) return false;
      }
      if (q) {
        const haystack = [
          f.title,
          f.symptom,
          f.brandTag,
          f.postCode ?? '',
          f.quickFixSummary,
          ...f.rootCauses,
          ...f.affectedRails,
          ...f.suspectComponentIds,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    faults,
    deviceFilter,
    severityFilter,
    onlyCurrentBoard,
    selectedBoard,
    brandFilter,
    selectedPostCode,
    searchQuery,
  ]);

  // Resolve target board for current fault (either exact boardId or currently selectedBoard)
  const targetBoardForFault = useMemo<HardwareBoard>(() => {
    if (!currentFault) return selectedBoard;
    const exact = boards.find((b) => b.id === currentFault.boardId);
    if (exact) return exact;
    if (
      (currentFault.boardId === 'all_motherboards' && selectedBoard.category === 'motherboard') ||
      (currentFault.boardId === 'all_psu' && selectedBoard.category === 'psu')
    ) {
      return selectedBoard;
    }
    return boards.find((b) => b.category === currentFault.category) ?? selectedBoard;
  }, [boards, currentFault, selectedBoard]);

  const currentStep: DiagnosticStep | null = useMemo(() => {
    if (!currentFault || currentFault.steps.length === 0) return null;
    return currentFault.steps[Math.min(currentStepIndex, currentFault.steps.length - 1)] ?? null;
  }, [currentFault, currentStepIndex]);

  const resolveComponent = (componentId?: string): BoardComponent | undefined => {
    if (!componentId) return undefined;
    return (
      targetBoardForFault.components.find((c) => c.id === componentId) ??
      selectedBoard.components.find((c) => c.id === componentId)
    );
  };

  const resolveNet = (netId?: string): PowerRailNet | undefined => {
    if (!netId) return undefined;
    return (
      targetBoardForFault.rails.find((r) => r.id === netId || r.name === netId) ??
      selectedBoard.rails.find((r) => r.id === netId || r.name === netId)
    );
  };

  const handleCrossProbe = (
    mode: ViewMode,
    componentId?: string,
    netId?: string
  ) => {
    if (targetBoardForFault.id !== selectedBoard.id) {
      onSelectBoard(targetBoardForFault.id);
    }
    if (componentId) {
      onSelectComponent(componentId);
    }
    if (netId) {
      const resolved = resolveNet(netId);
      onSelectNet(resolved ? resolved.id : netId);
    }
    onNavigateMode(mode);
  };

  const handlePickFault = (fault: FaultCase) => {
    onSelectFault(fault);
    const exact = boards.find((b) => b.id === fault.boardId);
    if (exact && exact.id !== selectedBoard.id) {
      onSelectBoard(exact.id);
    } else if (
      fault.category !== selectedBoard.category &&
      (fault.boardId === 'all_motherboards' || fault.boardId === 'all_psu')
    ) {
      const firstCatBoard = boards.find((b) => b.category === fault.category);
      if (firstCatBoard) onSelectBoard(firstCatBoard.id);
    }
  };

  const handleSelectPostCode = (item: PostCodeItem) => {
    if (selectedPostCode?.code === item.code) {
      setSelectedPostCode(null);
      return;
    }
    setSelectedPostCode(item);
    setDeviceFilter(item.category);
  };

  const handleStepPass = () => {
    if (!currentFault || !currentStep) return;
    setStepResults((prev) => ({ ...prev, [currentStep.id]: 'pass' }));

    if (currentStep.passNextStepId === 'resolved') {
      setWizardOutcome('resolved');
      return;
    }

    if (currentStep.passNextStepId) {
      const nextIdx = currentFault.steps.findIndex((s) => s.id === currentStep.passNextStepId);
      if (nextIdx !== -1) {
        setCurrentStepIndex(nextIdx);
        setWizardOutcome('active');
        return;
      }
    }

    if (currentStepIndex + 1 < currentFault.steps.length) {
      setCurrentStepIndex((idx) => idx + 1);
      setWizardOutcome('active');
    } else {
      setWizardOutcome('resolved');
    }
  };

  const handleStepFail = () => {
    if (!currentStep) return;
    setStepResults((prev) => ({ ...prev, [currentStep.id]: 'fail' }));
    setWizardOutcome('failed');
  };

  const handleResetWizard = () => {
    setCurrentStepIndex(0);
    setStepResults({});
    setMeasurementInputs({});
    setWizardOutcome('active');
  };

  const currentMeasurementRaw = currentStep ? measurementInputs[currentStep.id] ?? '' : '';
  const liveEval: MeasurementEvaluation | null = useMemo(() => {
    if (!currentStep || !currentMeasurementRaw.trim()) return null;
    return evaluateLiveMeasurement(currentMeasurementRaw, currentStep);
  }, [currentStep, currentMeasurementRaw]);

  const activeStepComponent = resolveComponent(currentStep?.targetComponentId);
  const activeStepNet = resolveNet(currentStep?.targetNetId);

  const isPsuOrHv =
    currentFault?.category === 'psu' || currentFault?.severity === 'critical_hv';

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-4 flex flex-col gap-4 text-slate-100">
      {/* Top Interactive POST Code & LED Debug Decoder Bar */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-md p-3.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Giải Mã Nhanh POST Code / EZ Debug LED & Tín Hiệu PSU
              </h2>
              <p className="text-[11px] text-slate-400">
                Chọn mã lỗi trên card test main hoặc trạng thái PSU để khoanh vùng điểm đo và lọc pan-bệnh tương ứng
              </p>
            </div>
          </div>
          {selectedPostCode && (
            <button
              type="button"
              onClick={() => setSelectedPostCode(null)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Bỏ lọc mã [{selectedPostCode.code}]
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POST_CODE_ITEMS.map((item) => {
            const active = selectedPostCode?.code === item.code;
            const isPsu = item.category === 'psu';
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectPostCode(item)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : isPsu
                    ? 'bg-rose-950/35 border-rose-500/30 text-rose-300 hover:bg-rose-900/40'
                    : 'bg-slate-950/70 border-slate-700/80 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.severity === 'critical_hv'
                      ? 'bg-rose-400 animate-pulse'
                      : item.severity === 'high'
                      ? 'bg-amber-400'
                      : item.severity === 'medium'
                      ? 'bg-cyan-400'
                      : 'bg-emerald-400'
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedPostCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 rounded-lg bg-slate-950/85 border border-cyan-500/30 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      {selectedPostCode.code}
                    </span>
                    <span className="font-semibold text-white">Ý nghĩa kỹ thuật</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selectedPostCode.meaning}</p>
                </div>
                <div>
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" /> Điểm cần đo ngay
                  </div>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {selectedPostCode.checkPoints.map((cp) => (
                      <li key={cp}>{cp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Linh kiện nghi ngờ hàng đầu
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedPostCode.suspectParts.map((sp) => (
                      <span
                        key={sp}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Split Workspace: Fault Finder (Left) + Guided Troubleshooting Wizard (Right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT: Multi-way Fault Finder */}
        <div className="xl:col-span-5 flex flex-col rounded-xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-md overflow-hidden min-h-[420px]">
          <div className="p-3.5 border-b border-slate-800/80 space-y-2.5 bg-slate-950/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Tra Cứu Pan-Bệnh Thực Chiến ({filteredFaults.length}/{faults.length})
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyCurrentBoard}
                  onChange={(e) => setOnlyCurrentBoard(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                Chỉ mạch đang chọn
              </label>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm triệu chứng, mã lỗi, đường nguồn (+5VSB, VCCIN_CORE, Q_PFC1)..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Device Category Tabs */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'motherboard', label: 'Mainboard PC' },
                { id: 'psu', label: 'Nguồn PSU' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDeviceFilter(tab.id as 'all' | DeviceCategory)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    deviceFilter === tab.id
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Brand & Severity Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {BRAND_FILTERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as 'all' | FaultCase['severity'])
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Mọi mức độ</option>
                <option value="critical_hv">Nguy hiểm cao áp (HV)</option>
                <option value="high">Nghiêm trọng</option>
                <option value="medium">Trung bình</option>
                <option value="low">Nhẹ / Cấu hình</option>
              </select>
            </div>
          </div>

          {/* Scrollable Fault Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredFaults.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-400 text-xs space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
                <p>Không tìm thấy pan-bệnh khớp bộ lọc hiện tại.</p>
                <button
                  type="button"
                  onClick={() => {
                    setDeviceFilter('all');
                    setBrandFilter('all');
                    setSeverityFilter('all');
                    setOnlyCurrentBoard(false);
                    setSearchQuery('');
                    setSelectedPostCode(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              filteredFaults.map((fault) => {
                const isSelected = currentFault?.id === fault.id;
                const sev = SEVERITY_META[fault.severity];
                return (
                  <button
                    key={fault.id}
                    type="button"
                    onClick={() => handlePickFault(fault)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-500/12 border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${sev.badgeClass}`}
                        >
                          {sev.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {fault.brandTag}
                        </span>
                        {fault.postCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            POST {fault.postCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {fault.steps.length} bước
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug mb-1">
                      {fault.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {fault.symptom}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {fault.affectedRails.slice(0, 4).map((rail) => (
                        <span
                          key={rail}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300/90 border border-slate-800 font-mono text-[10px]"
                        >
                          {rail}
                        </span>
                      ))}
                      {fault.suspectComponentIds.slice(0, 3).map((cid) => (
                        <span
                          key={cid}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300/90 border border-slate-800 font-mono text-[10px]"
                        >
                          {cid}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Interactive Guided Troubleshooting Wizard */}
        <div className="xl:col-span-7 flex flex-col rounded-xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-md overflow-hidden">
          {!currentFault ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Stethoscope className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">
                Chọn một pan-bệnh bên trái để bắt đầu quy trình chẩn đoán từng bước
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Fault Header & Target Board Link */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          SEVERITY_META[currentFault.severity].badgeClass
                        }`}
                      >
                        {SEVERITY_META[currentFault.severity].label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                        {currentFault.brandTag}
                      </span>
                      {currentFault.postCode && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Mã lỗi: {currentFault.postCode}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {currentFault.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Mạch tham chiếu:{' '}
                      <strong className="text-cyan-300">{targetBoardForFault.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetWizard}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5"
                      title="Làm lại quy trình đo từ Bước 1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Làm lại
                    </button>
                  </div>
                </div>

                {/* High Voltage Safety Alert */}
                {isPsuOrHv && (
                  <div className="p-3 rounded-lg bg-rose-950/55 border border-rose-500/50 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-rose-300 uppercase tracking-wide">
                        Cảnh Báo An Toàn Điện Cao Áp Sơ Cấp (320V – 390V DC)
                      </div>
                      <p className="text-rose-100/90 leading-relaxed">
                        1) Luôn xả tụ lọc chính{' '}
                        <code className="px-1 py-0.5 rounded bg-rose-900/60 font-mono">
                          C_BULK1
                        </code>{' '}
                        qua bóng đèn sợi đốt hoặc điện trở công suất 2kΩ/5W trước khi đo nguội.
                        <br />
                        2) <strong>Mẹo thợ chuyên nghiệp:</strong> Khi nghi chạm cầu diode/MOSFET PFC sau khi thay linh kiện, hãy hàn nối tiếp{' '}
                        <strong className="text-amber-300">
                          bóng đèn sợi đốt 60W–100W thay cho cầu chì F1
                        </strong>{' '}
                        rồi mới cắm điện AC 220V! Nếu đèn sáng rực đứng yên tức còn chạm nặng (không nổ MOSFET mới).
                      </p>
                    </div>
                  </div>
                )}

                {/* Symptom & Root Causes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Hiện tượng lâm sàng
                    </div>
                    <p className="text-slate-300 leading-relaxed">{currentFault.symptom}</p>
                    <div className="pt-1 border-t border-slate-800/80 text-emerald-300">
                      <strong>Hướng xử lý nhanh:</strong> {currentFault.quickFixSummary}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Nguyên nhân gốc rễ thường gặp
                    </div>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {currentFault.rootCauses.map((rc) => (
                        <li key={rc}>{rc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Affected Rails & Suspect Components with 1-click Cross-Probe */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">Đường nguồn ảnh hưởng:</span>
                    {currentFault.affectedRails.map((rail) => (
                      <button
                        key={rail}
                        type="button"
                        onClick={() => handleCrossProbe('schematic', undefined, rail)}
                        className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/35 text-cyan-200 font-mono text-[11px] transition-colors"
                        title="Nhấn để xem đường nguồn này trên Sơ đồ nguyên lý"
                      >
                        {rail}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">Linh kiện nghi ngờ:</span>
                    {currentFault.suspectComponentIds.map((compId) => (
                      <button
                        key={compId}
                        type="button"
                        onClick={() => handleCrossProbe('viewer3d', compId, undefined)}
                        className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/35 text-amber-200 font-mono text-[11px] flex items-center gap-1 transition-colors"
                        title="Nhấn để định vị linh kiện trên mô phỏng 3D"
                      >
                        <Crosshair className="w-3 h-3" />
                        {compId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Step-by-Step Decision Tree Wizard */}
              <div className="rounded-xl bg-slate-950/75 border border-cyan-500/30 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Cây Chẩn Đoán Từng Bước (Guided Troubleshooting)
                    </h3>
                  </div>

                  {/* Stepper Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentFault.steps.map((step, idx) => {
                      const status = stepResults[step.id] ?? 'pending';
                      const isCurrent = idx === currentStepIndex && wizardOutcome === 'active';
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            setCurrentStepIndex(idx);
                            setWizardOutcome('active');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1 transition-all ${
                            isCurrent
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                              : status === 'pass'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : status === 'fail'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {status === 'pass' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'fail' && <XCircle className="w-3 h-3" />}
                          B{step.stepNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Step Card */}
                {currentStep && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-4"
                    >
                      {/* Step Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                              BƯỚC {currentStep.stepNumber} / {currentFault.steps.length}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                MEASURE_MODE_LABELS[currentStep.measureMode].colorClass
                              }`}
                            >
                              {MEASURE_MODE_LABELS[currentStep.measureMode].label}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{currentStep.title}</h4>
                        </div>

                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-right">
                          <div className="text-[10px] uppercase tracking-wider text-emerald-400">
                            Giá trị chuẩn (Expected)
                          </div>
                          <div className="text-sm font-mono font-bold text-emerald-200">
                            {currentStep.expectedValue}
                          </div>
                        </div>
                      </div>

                      {/* Instruction */}
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                        {currentStep.instruction}
                      </p>

                      {/* Probe Placement & 1-Click Cross-Probing */}
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                              Vị trí đặt que đo:
                            </span>
                            {currentStep.targetComponentId && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30 font-mono">
                                {currentStep.targetComponentId}
                                {activeStepComponent?.partNumber
                                  ? ` (${activeStepComponent.partNumber})`
                                  : ''}
                              </span>
                            )}
                            {currentStep.targetNetId && (
                              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 font-mono">
                                Net: {activeStepNet?.name ?? currentStep.targetNetId}
                                {activeStepNet?.nominalVoltage
                                  ? ` [${activeStepNet.nominalVoltage}]`
                                  : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {activeStepComponent && activeStepComponent.pins.length > 0 && (
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-2">
                            <span>Pinout tham khảo:</span>
                            {activeStepComponent.pins.slice(0, 3).map((p) => (
                              <span
                                key={p.pin}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300"
                              >
                                Pin {p.pin} ({p.name}): {p.expectedVoltage} | Diode{' '}
                                {p.expectedDiodeDrop}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 1-Click Cross-Probing Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleCrossProbe(
                                'viewer3d',
                                currentStep.targetComponentId,
                                currentStep.targetNetId
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Box className="w-3.5 h-3.5" /> Soi trên Mô Phỏng 3D
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCrossProbe(
                                'schematic',
                                currentStep.targetComponentId,
                                currentStep.targetNetId
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" /> Xem Sơ Đồ Nguyên Lý
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCrossProbe(
                                'boardview',
                                currentStep.targetComponentId,
                                currentStep.targetNetId
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Image className="w-3.5 h-3.5" /> Mở BoardView Ảnh Chụp
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCrossProbe(
                                'workbench',
                                currentStep.targetComponentId,
                                currentStep.targetNetId
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <SplitSquareHorizontal className="w-3.5 h-3.5" /> Mở Song Song (Workbench)
                          </button>
                        </div>
                      </div>

                      {/* Live Measurement Evaluator */}
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-700/80 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                            <Gauge className="w-4 h-4" />
                            Bộ Đánh Giá Số Đo Thực Tế (Live Measurement Evaluator)
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {['0.002V', '0V', '0.43V', '3.30V', '12.05V', '310V', '390V'].map(
                              (preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() =>
                                    setMeasurementInputs((prev) => ({
                                      ...prev,
                                      [currentStep.id]: preset,
                                    }))
                                  }
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
                                >
                                  {preset}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={currentMeasurementRaw}
                            onChange={(e) =>
                              setMeasurementInputs((prev) => ({
                                ...prev,
                                [currentStep.id]: e.target.value,
                              }))
                            }
                            placeholder={`Nhập số đo thực tế trên đồng hồ (${
                              MEASURE_MODE_LABELS[currentStep.measureMode].unitHint
                            })`}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                          />
                          {currentMeasurementRaw && (
                            <button
                              type="button"
                              onClick={() =>
                                setMeasurementInputs((prev) => ({
                                  ...prev,
                                  [currentStep.id]: '',
                                }))
                              }
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                            >
                              Xóa số đo
                            </button>
                          )}
                        </div>

                        {liveEval && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg border text-xs space-y-1 ${
                              liveEval.status === 'pass'
                                ? 'bg-emerald-950/50 border-emerald-500/45 text-emerald-100'
                                : liveEval.status === 'short_gnd' ||
                                  liveEval.status === 'over_voltage'
                                ? 'bg-rose-950/60 border-rose-500/55 text-rose-100'
                                : liveEval.status === 'invalid'
                                ? 'bg-slate-900 border-slate-700 text-slate-300'
                                : 'bg-amber-950/50 border-amber-500/45 text-amber-100'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1.5">
                              {liveEval.status === 'pass' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : liveEval.status === 'invalid' ? (
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                              )}
                              {liveEval.title}
                            </div>
                            <p className="opacity-90 leading-relaxed">{liveEval.explanation}</p>
                            <p className="font-medium opacity-95">
                              → Khuyến nghị: {liveEval.suggestedAction}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handleStepPass}
                          className="py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Đạt chuẩn (Pass) → Bước tiếp</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleStepFail}
                          className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Sai lệch / Chạm chập (Fail) → Xem kết luận</span>
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Fail Diagnosis & Repair Action Panel */}
                <AnimatePresence>
                  {wizardOutcome === 'failed' && currentStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-xl bg-rose-950/45 border border-rose-500/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5" />
                          KẾT LUẬN CHẨN ĐOÁN TẠI BƯỚC {currentStep.stepNumber}
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40">
                          PHÁT HIỆN LỖI
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-rose-100 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-rose-500/25">
                        <strong>Phân tích lỗi:</strong> {currentStep.failDiagnosis}
                      </div>

                      <div className="text-xs sm:text-sm text-emerald-200 leading-relaxed bg-emerald-950/35 p-3 rounded-lg border border-emerald-500/30 flex items-start gap-2">
                        <Wrench className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Cách xử lý & thay thế:</strong> {currentStep.repairAction}
                        </div>
                      </div>

                      {currentStep.failSuspectComponents.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-slate-300 font-medium">
                            Linh kiện thủ phạm cần tháo đo / thay thế:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentStep.failSuspectComponents.map((cid) => (
                              <div
                                key={cid}
                                className="flex items-center gap-1 rounded-lg bg-slate-900 border border-amber-500/40 px-2.5 py-1 text-xs"
                              >
                                <span className="font-mono font-bold text-amber-300">{cid}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCrossProbe('viewer3d', cid, undefined)}
                                  className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-[10px]"
                                >
                                  3D
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCrossProbe('schematic', cid, undefined)}
                                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[10px]"
                                >
                                  Sơ đồ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCrossProbe('boardview', cid, undefined)}
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 text-[10px]"
                                >
                                  Ảnh
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {currentStepIndex + 1 < currentFault.steps.length && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStepIndex((idx) => idx + 1);
                              setWizardOutcome('active');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                          >
                            Vẫn kiểm tra tiếp bước sau <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleResetWizard}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Kiểm tra lại sau khi sửa
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Resolved Panel */}
                  {wizardOutcome === 'resolved' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-xl bg-emerald-950/45 border border-emerald-500/50 p-4 space-y-2.5"
                    >
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <Sparkles className="w-5 h-5" />
                        HOÀN TẤT QUY TRÌNH ĐO KIỂM — CÁC ĐIỂM ĐO ĐẠT CHUẨN!
                      </div>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        Tất cả các bước kiểm tra cho pan-bệnh <strong>{currentFault.title}</strong> đã vượt qua chuẩn kỹ thuật. Nếu thiết bị vẫn chưa hoạt động ổn định, hãy đối chiếu thêm chuỗi khởi động nguồn trong mục{' '}
                        <button
                          type="button"
                          onClick={() => onNavigateMode('library')}
                          className="underline text-cyan-300 hover:text-cyan-200 font-semibold"
                        >
                          Kho Sơ Đồ & Power Sequence
                        </button>{' '}
                        hoặc kiểm tra lại chân tiếp xúc Socket / Khe RAM / BIOS.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResetWizard}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Đo lại từ đầu
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateMode('library')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-1.5"
                        >
                          <Lightbulb className="w-3.5 h-3.5" /> Mở Trình Mô Phỏng Power Sequence
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
