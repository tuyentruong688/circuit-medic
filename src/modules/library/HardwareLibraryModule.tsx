import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  FileCode2,
  FileText,
  Image,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  SplitSquareHorizontal,
  Stethoscope,
  Wrench,
  Zap,
} from 'lucide-react';
import type {
  BoardComponent,
  ComponentKind,
  DeviceCategory,
  FaultCase,
  HardwareBoard,
  ModuleSharedProps,
  PowerSequenceSpec,
  PowerSequenceStage,
  ViewMode,
} from '../../types/circuit';
import { isFaultForBoard } from '../../data/registry';
import { DEVICE_CATEGORY_META, SCHEMATIC_STATUS_META } from '../../components/circuitLabels';
import { findEquivalentsForComponent, getKindLabelVi } from './componentEquivalents';
import { exportBoardAsJson, exportBoardAsMarkdown } from './exportHelpers';

type LibraryTab = 'catalog' | 'power_sequence' | 'cross_reference';

const GENERATION_CHIPS = [
  { id: 'all', label: 'Tất cả đời mạch' },
  { id: 'Coway', label: 'Coway (BLDC / RO / Bidet)' },
  { id: 'AVR', label: 'Arduino AVR' },
  { id: 'RP2040', label: 'Pico RP2040' },
  { id: 'BCM2711', label: 'Raspberry Pi 4' },
  { id: 'Pascal', label: 'VGA Pascal GTX' },
  { id: 'LGA1700', label: 'LGA1700' },
  { id: 'AM4', label: 'AMD AM4' },
  { id: 'LGA1150', label: 'LGA1150 / H81' },
  { id: 'LLC', label: '80+ Gold LLC' },
  { id: 'TL494', label: 'TL494 ATX' },
];

type KindGroupFilter =
  | 'all'
  | 'power_stage'
  | 'pwm_ic'
  | 'logic_bios'
  | 'diode_opto'
  | 'passive_magnetic';

const KIND_GROUPS: Array<{ id: KindGroupFilter; label: string }> = [
  { id: 'all', label: 'Tất cả linh kiện' },
  { id: 'power_stage', label: 'MOSFET / DrMOS' },
  { id: 'pwm_ic', label: 'IC PWM / Supervisor' },
  { id: 'logic_bios', label: 'Super I/O / BIOS / PCH' },
  { id: 'diode_opto', label: 'Diode / Opto / TL431' },
  { id: 'passive_magnetic', label: 'Tụ / Cuộn cảm / Biến áp' },
];

function matchesKindGroup(kind: ComponentKind, group: KindGroupFilter): boolean {
  if (group === 'all') return true;
  if (group === 'power_stage') return kind === 'mosfet' || kind === 'drmos';
  if (group === 'pwm_ic') return kind === 'pwm_ic' || kind === 'ic';
  if (group === 'logic_bios')
    return kind === 'super_io' || kind === 'bios_chip' || kind === 'chipset' || kind === 'cpu_socket';
  if (group === 'diode_opto')
    return (
      kind === 'diode' ||
      kind === 'optocoupler' ||
      kind === 'tl431' ||
      kind === 'bridge_rectifier'
    );
  return (
    kind === 'capacitor_elec' ||
    kind === 'capacitor_solid' ||
    kind === 'inductor' ||
    kind === 'transformer' ||
    kind === 'fuse' ||
    kind === 'resistor'
  );
}

interface AggregatedComponentRow {
  uid: string;
  board: HardwareBoard;
  component: BoardComponent;
  equivalents: string[];
  solderingTip: string;
}

export const HardwareLibraryModule: React.FC<ModuleSharedProps> = ({
  boards,
  selectedBoard,
  onSelectBoard,
  onSelectComponent,
  onNavigateMode,
  faults,
  powerSequences,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('catalog');

  // Tab 1: Catalog filters
  const [catFilter, setCatFilter] = useState<'all' | DeviceCategory>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Tab 2: Power Sequence Simulator
  const [selectedSeqId, setSelectedSeqId] = useState<string>(
    () => selectedBoard.powerSequenceId || powerSequences[0]?.id || ''
  );
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1500);
  const [simulateFailAtCurrent, setSimulateFailAtCurrent] = useState<boolean>(false);

  // Tab 3: Cross-Reference Table
  const [xrefSearch, setXrefSearch] = useState<string>('');
  const [xrefGroup, setXrefGroup] = useState<KindGroupFilter>('all');
  const [xrefCategory, setXrefCategory] = useState<'all' | DeviceCategory>('all');

  // Keep selectedSeqId valid if powerSequences updates
  const activeSequence: PowerSequenceSpec | undefined = useMemo(() => {
    return (
      powerSequences.find((s) => s.id === selectedSeqId) ??
      powerSequences.find((s) => s.id === selectedBoard.powerSequenceId) ??
      powerSequences[0]
    );
  }, [powerSequences, selectedSeqId, selectedBoard.powerSequenceId]);

  useEffect(() => {
    setActiveStageIdx(0);
    setIsPlaying(false);
    setSimulateFailAtCurrent(false);
  }, [activeSequence?.id]);

  // Playback timer for Power Sequence
  useEffect(() => {
    if (!isPlaying || !activeSequence || activeSequence.stages.length === 0) return;
    if (simulateFailAtCurrent) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveStageIdx((prev) => {
        if (prev + 1 >= activeSequence.stages.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeedMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeSequence, playSpeedMs, simulateFailAtCurrent]);

  // Available brands dynamically extracted from boards
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const b of boards) {
      set.add(b.brand);
    }
    return Array.from(set);
  }, [boards]);

  // Related faults per board helper
  const getFaultsForBoard = (board: HardwareBoard): FaultCase[] => {
    return faults.filter((f) => isFaultForBoard(f, board));
  };

  // Filtered boards for Tab 1
  const filteredBoards = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return boards.filter((b) => {
      if (catFilter !== 'all' && b.category !== catFilter) return false;
      if (brandFilter !== 'all' && !b.brand.toLowerCase().includes(brandFilter.toLowerCase())) {
        return false;
      }
      if (genFilter !== 'all') {
        const genHaystack = `${b.generation} ${b.name} ${b.summary}`.toLowerCase();
        if (!genHaystack.includes(genFilter.toLowerCase())) return false;
      }
      if (q) {
        const haystack = [
          b.name,
          b.brand,
          b.generation,
          b.formFactor,
          b.summary,
          ...b.rails.map((r) => r.name),
          ...b.components.map((c) => `${c.id} ${c.partNumber ?? ''} ${c.label}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [boards, catFilter, brandFilter, genFilter, catalogSearch]);

  // Aggregated Cross-Reference components for Tab 3
  const aggregatedComponents = useMemo<AggregatedComponentRow[]>(() => {
    const q = xrefSearch.trim().toLowerCase();
    const rows: AggregatedComponentRow[] = [];

    for (const board of boards) {
      if (xrefCategory !== 'all' && board.category !== xrefCategory) continue;

      for (const comp of board.components) {
        if (!matchesKindGroup(comp.kind, xrefGroup)) continue;

        const eq = findEquivalentsForComponent(comp.partNumber, comp.label, comp.kind);
        const equivalents = eq?.equivalents ?? ['Tra datasheet đúng mã chân & dòng chịu tải'];
        const solderingTip =
          comp.replacementTips ||
          eq?.solderingTip ||
          'Kiểm tra nội trở Diode Drop trên chân nguồn trước khi cấp điện lại.';

        if (q) {
          const haystack = [
            comp.id,
            comp.label,
            comp.partNumber ?? '',
            comp.specs ?? '',
            comp.description,
            board.name,
            board.brand,
            ...equivalents,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) continue;
        }

        rows.push({
          uid: `${board.id}__${comp.id}`,
          board,
          component: comp,
          equivalents,
          solderingTip,
        });
      }
    }
    return rows;
  }, [boards, xrefSearch, xrefGroup, xrefCategory]);

  const handleLaunchBoardMode = (boardId: string, mode: ViewMode) => {
    onSelectBoard(boardId);
    onNavigateMode(mode);
  };

  const handleLocateComponent = (boardId: string, componentId: string, mode: ViewMode) => {
    onSelectBoard(boardId);
    onSelectComponent(componentId);
    onNavigateMode(mode);
  };

  const handleExport = (board: HardwareBoard, format: 'json' | 'md') => {
    const related = getFaultsForBoard(board);
    const seq = powerSequences.find((s) => s.id === board.powerSequenceId);
    if (format === 'json') {
      exportBoardAsJson(board, related, seq);
      setExportNotice(`Đã xuất sơ đồ JSON: circuitmedic-${board.id}.json`);
    } else {
      exportBoardAsMarkdown(board, related, seq);
      setExportNotice(`Đã xuất phiếu sửa chữa Markdown: phieu-sua-chua-${board.id}.md`);
    }
    window.setTimeout(() => setExportNotice(null), 3500);
  };

  const activeStage: PowerSequenceStage | undefined =
    activeSequence?.stages[activeStageIdx] ?? activeSequence?.stages[0];

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-4 flex flex-col gap-4 text-slate-100">
      {/* Top Tab Navigation Header */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-md p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: 'catalog' as LibraryTab,
              label: 'Danh Mục Mạch Theo Hãng & Đời',
              icon: Layers,
              badge: `${boards.length} mạch`,
            },
            {
              id: 'power_sequence' as LibraryTab,
              label: 'Trình Mô Phỏng Power Sequence',
              icon: Activity,
              badge: `${powerSequences.length} chuỗi`,
            },
            {
              id: 'cross_reference' as LibraryTab,
              label: 'Bảng Tra Nhanh Linh Kiện & Tương Đương',
              icon: Cpu,
              badge: 'IC / MOSFET',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-all border ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.18)]'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-slate-300 border border-slate-700">
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {exportNotice && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {exportNotice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TAB 1: Board & Schematic Catalog */}
      {activeTab === 'catalog' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {/* Filter Bar */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Tìm tên bo mạch, mã IC (SiC654, TL494, B760, RM750x)..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'appliance', label: DEVICE_CATEGORY_META.appliance.shortLabel },
                  { id: 'sbc_mcu', label: DEVICE_CATEGORY_META.sbc_mcu.shortLabel },
                  { id: 'gpu', label: DEVICE_CATEGORY_META.gpu.shortLabel },
                  { id: 'motherboard', label: DEVICE_CATEGORY_META.motherboard.shortLabel },
                  { id: 'psu', label: DEVICE_CATEGORY_META.psu.shortLabel },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatFilter(c.id as 'all' | DeviceCategory)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors ${
                      catFilter === c.id
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="md:col-span-3">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tất cả hãng ({availableBrands.length})</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generation Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Thế hệ / Kiến trúc:</span>
              {GENERATION_CHIPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenFilter(g.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    genFilter === g.id
                      ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Board Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
              {filteredBoards.map((board) => {
                const isSelected = board.id === selectedBoard.id;
                const relatedFaults = getFaultsForBoard(board);
                const seq = powerSequences.find((s) => s.id === board.powerSequenceId);

                return (
                  <motion.div
                    key={board.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-3.5 transition-all ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400/70 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                        : 'bg-slate-900/75 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Top Meta */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg border border-white/15 shrink-0 flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: board.pcbColor || '#134e4a' }}
                            title={`Màu PCB: ${board.pcbColor}`}
                          >
                            <Cpu className="w-5 h-5 text-white/90" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${DEVICE_CATEGORY_META[board.category].badgeClass}`}
                              >
                                {DEVICE_CATEGORY_META[board.category].shortLabel}
                              </span>
                              {board.docsMeta && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${SCHEMATIC_STATUS_META[board.docsMeta.schematicStatus].badgeClass}`}
                                >
                                  {SCHEMATIC_STATUS_META[board.docsMeta.schematicStatus].shortLabel}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                                {board.brand}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                                {board.generation}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                                {board.formFactor}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {board.name}
                            </h3>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-semibold shrink-0">
                            Đang mở
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{board.summary}</p>

                      {board.safetyWarning && (
                        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-200 flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{board.safetyWarning}</span>
                        </div>
                      )}

                      {/* Stats Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-950/75 border border-slate-800">
                          <div className="text-sm font-mono font-bold text-cyan-300">
                            {board.components.length}
                          </div>
                          <div className="text-[10px] text-slate-400">Linh kiện định vị</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/75 border border-slate-800">
                          <div className="text-sm font-mono font-bold text-emerald-300">
                            {board.rails.length}
                          </div>
                          <div className="text-[10px] text-slate-400">Đường nguồn / Net</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/75 border border-slate-800">
                          <div className="text-sm font-mono font-bold text-amber-300">
                            {relatedFaults.length}
                          </div>
                          <div className="text-[10px] text-slate-400">Pan-bệnh đặc trưng</div>
                        </div>
                      </div>

                      {/* Rail Summary Pills */}
                      <div className="flex flex-wrap gap-1">
                        {board.rails.slice(0, 7).map((rail) => (
                          <span
                            key={rail.id}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-center gap-1.5 text-slate-200"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: rail.color }}
                            />
                            {rail.name}
                            <span className="text-slate-400">({rail.nominalVoltage})</span>
                          </span>
                        ))}
                        {board.rails.length > 7 && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400">
                            +{board.rails.length - 7} rail khác
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Footer: 1-Click Launch + Export */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLaunchBoardMode(board.id, 'schematic')}
                          className="py-1.5 px-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" /> Nguyên Lý
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchBoardMode(board.id, 'viewer3d')}
                          className="py-1.5 px-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <Box className="w-3.5 h-3.5" /> Mô Phỏng 3D
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchBoardMode(board.id, 'boardview')}
                          className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" /> BoardView
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchBoardMode(board.id, 'workbench')}
                          className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <SplitSquareHorizontal className="w-3.5 h-3.5" /> Song Song
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          {seq && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSeqId(seq.id);
                                setActiveTab('power_sequence');
                              }}
                              className="text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                            >
                              <Activity className="w-3 h-3" /> Chuỗi kích nguồn ({seq.stages.length} bước)
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExport(board, 'md')}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                            title="Tải xuống Phiếu Sửa Chữa & Thông Số Đo (.md)"
                          >
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>Xuất Phiếu (.md)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExport(board, 'json')}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                            title="Tải xuống dữ liệu Sơ Đồ & Chân Linh Kiện (.json)"
                          >
                            <FileCode2 className="w-3 h-3 text-cyan-400" />
                            <span>JSON</span>
                            <Download className="w-3 h-3 opacity-70" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Power Sequence Interactive Simulator */}
      {activeTab === 'power_sequence' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1 pb-4">
          {/* Sequence Selector Pills */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Chọn Kiến Trúc Chuỗi Kích Nguồn (Power-Up Sequence)
              </div>
              {selectedBoard.powerSequenceId && (
                <span className="text-[11px] text-slate-400">
                  Mạch đang chọn ({selectedBoard.name}) dùng:{' '}
                  <strong className="text-cyan-300 font-mono">
                    {selectedBoard.powerSequenceId}
                  </strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {powerSequences.map((seq) => {
                const isSelected = activeSequence?.id === seq.id;
                return (
                  <button
                    key={seq.id}
                    type="button"
                    onClick={() => setSelectedSeqId(seq.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/70 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${DEVICE_CATEGORY_META[seq.category].badgeClass}`}
                      >
                        {DEVICE_CATEGORY_META[seq.category].shortLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {seq.stages.length} bước
                      </span>
                    </div>
                    <div className="text-xs font-bold leading-snug line-clamp-2">{seq.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{seq.platform}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeSequence && (
            <>
              {/* Player Controls + Timeline */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{activeSequence.title}</h3>
                    <p className="text-xs text-slate-400">
                      Nền tảng: {activeSequence.platform} • Nhấn từng giai đoạn hoặc bấm Phát để mô phỏng trình tự tín hiệu
                    </p>
                  </div>

                  {/* Player Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSimulateFailAtCurrent(false);
                        setIsPlaying((p) => !p);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                        isPlaying
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 hover:bg-cyan-500/30'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Tạm dừng' : 'Phát mô phỏng'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStageIdx((i) => Math.max(0, i - 1));
                      }}
                      disabled={activeStageIdx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200"
                      title="Bước trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStageIdx((i) =>
                          Math.min(activeSequence.stages.length - 1, i + 1)
                        );
                      }}
                      disabled={activeStageIdx >= activeSequence.stages.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200"
                      title="Bước kế"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setSimulateFailAtCurrent(false);
                        setActiveStageIdx(0);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>

                    <select
                      value={playSpeedMs}
                      onChange={(e) => setPlaySpeedMs(Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                      title="Tốc độ mô phỏng"
                    >
                      <option value={2400}>0.5x Chậm</option>
                      <option value={1500}>1x Chuẩn</option>
                      <option value={800}>2x Nhanh</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setSimulateFailAtCurrent((v) => !v);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                        simulateFailAtCurrent
                          ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-rose-500/50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {simulateFailAtCurrent ? 'Đang giả lập đứt tại bước này' : 'Giả lập lỗi tại bước này'}
                    </button>
                  </div>
                </div>

                {/* Animated Interactive Timeline Nodes */}
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[760px] flex items-stretch gap-2 pt-1">
                    {activeSequence.stages.map((stage, idx) => {
                      const isCurrent = idx === activeStageIdx;
                      const isPassed = idx < activeStageIdx;
                      const isBlockedAfterFail = simulateFailAtCurrent && idx > activeStageIdx;
                      const isFailedNode = simulateFailAtCurrent && isCurrent;

                      return (
                        <button
                          key={`${stage.order}-${stage.signalName}`}
                          type="button"
                          onClick={() => {
                            setIsPlaying(false);
                            setActiveStageIdx(idx);
                          }}
                          className={`flex-1 min-w-[115px] p-2.5 rounded-xl border text-left transition-all relative ${
                            isFailedNode
                              ? 'bg-rose-950/70 border-rose-400 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
                              : isCurrent
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                              : isBlockedAfterFail
                              ? 'bg-slate-950/40 border-slate-800/60 text-slate-600 opacity-55'
                              : isPassed
                              ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-100'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono opacity-80">
                              #{stage.order}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isFailedNode
                                  ? 'bg-rose-400 animate-ping'
                                  : isCurrent
                                  ? 'bg-cyan-300 animate-pulse'
                                  : isBlockedAfterFail
                                  ? 'bg-slate-700'
                                  : isPassed
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-600'
                              }`}
                            />
                          </div>
                          <div className="text-xs font-mono font-bold truncate">
                            {stage.signalName}
                          </div>
                          <div className="text-[10px] font-mono mt-0.5 truncate opacity-85">
                            {isBlockedAfterFail ? 'BỊ KHÓA (0V)' : stage.voltage}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                            {stage.delayMs}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Stage Engineering Inspector */}
                {activeStage && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeSequence.id}-${activeStage.order}-${simulateFailAtCurrent}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="rounded-xl bg-slate-950/85 border border-slate-800 p-4 space-y-4"
                    >
                      {/* Signal Flow Diagram: Source -> Signal -> Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-3">
                        <div className="md:col-span-4 p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            Nguồn phát tín hiệu (Source)
                          </div>
                          <div className="text-sm font-semibold text-cyan-200 mt-0.5">
                            {activeStage.source}
                          </div>
                        </div>

                        <div className="md:col-span-3 flex flex-col items-center justify-center text-center px-2">
                          <span
                            className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold border ${
                              simulateFailAtCurrent
                                ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                                : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            }`}
                          >
                            {activeStage.signalName}
                          </span>
                          <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-400 to-emerald-400/40 my-2 relative">
                            <ArrowRight className="w-4 h-4 text-cyan-300 absolute right-0 top-1/2 -translate-y-1/2" />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                            <span className="text-emerald-300">{activeStage.voltage}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-300">
                              <Clock className="w-3 h-3" /> {activeStage.delayMs}
                            </span>
                          </div>
                        </div>

                        <div className="md:col-span-4 p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            Đích nhận (Destination)
                          </div>
                          <div className="text-sm font-semibold text-emerald-200 mt-0.5">
                            {activeStage.destination}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                          <div className="font-semibold text-cyan-300">
                            Vai trò kỹ thuật của giai đoạn #{activeStage.order}
                          </div>
                          <p className="text-slate-300 leading-relaxed">{activeStage.description}</p>
                        </div>

                        <div
                          className={`p-3 rounded-lg border space-y-1 ${
                            simulateFailAtCurrent
                              ? 'bg-rose-950/60 border-rose-500/60'
                              : 'bg-rose-950/30 border-rose-500/30'
                          }`}
                        >
                          <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            Triệu chứng khi mất / sai lệch giai đoạn này
                          </div>
                          <p className="text-rose-100/90 leading-relaxed">
                            {activeStage.failureSymptom}
                          </p>
                          {simulateFailAtCurrent && (
                            <p className="text-[11px] text-amber-300 font-medium pt-1">
                              → Trạng thái giả lập: Toàn bộ {activeSequence.stages.length - activeStageIdx - 1} giai đoạn phía sau bị khóa ở mức 0V (không thể khởi động tiếp).
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigateMode('diagnostics')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Mở Chẩn Đoán Lỗi Liên Quan
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateMode('schematic')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> Xem Trên Sơ Đồ Nguyên Lý
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: Quick Component & Replacement Equivalents Cross-Reference */}
      {activeTab === 'cross_reference' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {/* Search & Group Filters */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 p-3.5 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={xrefSearch}
                  onChange={(e) => setXrefSearch(e.target.value)}
                  placeholder="Tìm mã linh kiện (SiC654, IT8688E, W25Q128, MJE13007, TNY278, WT7527, PC817)..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={xrefCategory}
                  onChange={(e) => setXrefCategory(e.target.value as 'all' | DeviceCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tất cả phân loại bo mạch</option>
                  <option value="appliance">Chỉ Gia Dụng Coway (Lọc khí / Lọc nước / Bidet)</option>
                  <option value="sbc_mcu">Chỉ Nhúng & SBC (Arduino / RPi)</option>
                  <option value="gpu">Chỉ Card Đồ Họa VGA / GPU</option>
                  <option value="motherboard">Chỉ Mainboard PC</option>
                  <option value="psu">Chỉ Nguồn ATX (PSU)</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-center justify-end text-xs text-slate-400 font-mono">
                Hiển thị {aggregatedComponents.length} linh kiện
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {KIND_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setXrefGroup(g.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    xrefGroup === g.id
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 rounded-xl border border-slate-800/90 bg-slate-900/75 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 z-10">
                  <tr>
                    <th className="py-3 px-3.5">Ký Hiệu & Mã Part</th>
                    <th className="py-3 px-3.5">Loại / Bo Mạch</th>
                    <th className="py-3 px-3.5">Mã Tương Đương Thay Thế</th>
                    <th className="py-3 px-3.5">Kinh Nghiệm Hàn & Lưu Ý Kỹ Thuật</th>
                    <th className="py-3 px-3.5 text-right">Định Vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {aggregatedComponents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Không tìm thấy linh kiện phù hợp từ khóa.
                      </td>
                    </tr>
                  ) : (
                    aggregatedComponents.map((row) => {
                      const { board, component, equivalents, solderingTip } = row;
                      return (
                        <tr
                          key={row.uid}
                          className="hover:bg-slate-800/40 transition-colors align-top"
                        >
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 font-mono font-bold text-cyan-300">
                                {component.id}
                              </span>
                              <span className="font-semibold text-white">
                                {component.partNumber || component.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {component.label}
                              {component.specs ? ` • ${component.specs}` : ''}
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] mb-1">
                              {getKindLabelVi(component.kind)}
                            </span>
                            <div className="text-[11px] text-slate-300 font-medium">
                              {board.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Khu vực: {component.zone}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 max-w-[260px]">
                            <div className="flex flex-wrap gap-1">
                              {equivalents.map((eq) => (
                                <span
                                  key={eq}
                                  className="px-2 py-0.5 rounded bg-emerald-500/12 border border-emerald-500/30 text-emerald-200 font-mono text-[11px]"
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 max-w-[340px]">
                            <p className="text-slate-300 leading-relaxed flex items-start gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{solderingTip}</span>
                            </p>
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleLocateComponent(board.id, component.id, 'viewer3d')
                                }
                                className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 text-[11px]"
                                title="Xem vị trí linh kiện trên 3D"
                              >
                                3D
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleLocateComponent(board.id, component.id, 'boardview')
                                }
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-200 text-[11px]"
                                title="Xem trên ảnh BoardView"
                              >
                                Ảnh
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleLocateComponent(board.id, component.id, 'schematic')
                                }
                                className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 text-[11px]"
                                title="Xem trên Sơ đồ nguyên lý"
                              >
                                Sơ đồ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
