import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Box,
  Camera,
  CheckCircle2,
  Columns2,
  Cpu,
  FileWarning,
  GitBranch,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  Stethoscope,
  Zap,
} from 'lucide-react';
import {
  DeviceCategory,
  FaultCase,
  HardwareBoard,
  ModuleSharedProps,
  ViewMode,
} from '../types/circuit';
import { isFaultForBoard } from '../data/registry';
import {
  DEVICE_CATEGORY_META,
  SCHEMATIC_STATUS_META,
  SEVERITY_META,
} from './circuitLabels';

interface DashboardHomeProps extends ModuleSharedProps {
  onOpenSearch: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  boards,
  selectedBoard,
  onSelectBoard,
  onSelectComponent,
  onSelectFault,
  onNavigateMode,
  faults,
  powerSequences,
  onOpenSearch,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | 'all'>('all');

  const sbcBoards = boards.filter((b) => b.category === 'sbc_mcu');
  const applianceBoards = boards.filter((b) => b.category === 'appliance');
  const gpuBoards = boards.filter((b) => b.category === 'gpu');
  const motherboards = boards.filter((b) => b.category === 'motherboard');
  const psus = boards.filter((b) => b.category === 'psu');

  const totalComponents = boards.reduce((sum, b) => sum + b.components.length, 0);
  const totalRails = boards.reduce((sum, b) => sum + b.rails.length, 0);
  const realPhotoCount = boards.filter((b) => Boolean(b.realPhoto)).length;
  const officialOrPublicSchCount = boards.filter((b) => {
    const s = b.docsMeta?.schematicStatus;
    return s === 'official_full' || s === 'official_partial' || s === 'public_reference';
  }).length;
  const ndaOrBlockCount = boards.length - officialOrPublicSchCount;

  const filteredBoards = useMemo(() => {
    if (categoryFilter === 'all') return boards;
    return boards.filter((b) => b.category === categoryFilter);
  }, [boards, categoryFilter]);

  const boardFaults = faults.filter((f) => isFaultForBoard(f, selectedBoard));

  const launchCards: Array<{
    mode: ViewMode;
    title: string;
    subtitle: string;
    badge: string;
    accent: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      mode: 'workbench',
      title: 'Workbench Song Song',
      subtitle: 'Chia đôi Sơ đồ nguyên lý & Ảnh thực tế / 3D — nhấp linh kiện đồng bộ chéo tức thì.',
      badge: 'Đồng bộ 2 chiều',
      accent: 'from-cyan-500/20 to-emerald-500/10 border-cyan-500/35 text-cyan-300',
      icon: Columns2,
    },
    {
      mode: 'boardview',
      title: 'Ảnh Thực Tế & BoardView',
      subtitle: 'Biểu diễn linh kiện, đường nguồn Airwire và soi mạch 2.5× trực tiếp trên ảnh chụp PCB thật.',
      badge: `${realPhotoCount} Ảnh thực tế`,
      accent: 'from-teal-500/20 to-emerald-500/10 border-teal-500/35 text-teal-300',
      icon: ImageIcon,
    },
    {
      mode: 'schematic',
      title: 'Sơ Đồ Nguyên Lý EDA',
      subtitle: 'Hỗ trợ nền Giấy Trắng PDF dễ đọc, dò rail nguồn, dạng sóng và minh bạch nguồn tài liệu.',
      badge: 'Giấy PDF / CAD',
      accent: 'from-emerald-500/20 to-sky-500/10 border-emerald-500/35 text-emerald-300',
      icon: GitBranch,
    },
    {
      mode: 'viewer3d',
      title: 'Mô Phỏng 3D & Nhiệt IR',
      subtitle: 'PCB đa lớp 60fps, dòng điện chạy mạch, tách lớp Exploded và Camera Nhiệt FLIR.',
      badge: 'Three.js WebGL',
      accent: 'from-sky-500/20 to-indigo-500/10 border-sky-500/35 text-sky-300',
      icon: Box,
    },
    {
      mode: 'scanner',
      title: 'Quét Bo Mạch Camera / Ảnh',
      subtitle: 'Tải ảnh chụp hoặc chọn nhanh ảnh bo thật để khoanh vùng VRM, MCU và linh kiện lỗi.',
      badge: '100% Client',
      accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/35 text-amber-300',
      icon: Camera,
    },
    {
      mode: 'diagnostics',
      title: 'Chẩn Đoán Pan Bệnh Thực Chiến',
      subtitle: 'Quy trình khoanh vùng lỗi từng bước theo triệu chứng, POST code và trị số đo thực tế.',
      badge: `${faults.length} Pan bệnh`,
      accent: 'from-rose-500/20 to-amber-500/10 border-rose-500/35 text-rose-300',
      icon: Stethoscope,
    },
  ];

  const handleLaunchFault = (fault: FaultCase) => {
    const isWildcard =
      fault.boardId === 'all_motherboards' ||
      fault.boardId === 'all_psu' ||
      fault.boardId === 'all_gpu' ||
      fault.boardId === 'all_sbc_mcu' ||
      fault.boardId === 'all_appliances';
    if (!isWildcard) {
      onSelectBoard(fault.boardId);
    } else {
      const matchBoard = boards.find((b) => b.category === fault.category);
      if (matchBoard && selectedBoard.category !== fault.category) {
        onSelectBoard(matchBoard.id);
      }
    }
    onSelectFault(fault);
    if (fault.suspectComponentIds[0]) {
      onSelectComponent(fault.suspectComponentIds[0]);
    }
    onNavigateMode('diagnostics');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Hero Banner */}
      <section className="lab-panel relative overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CircuitMedic v1.2 • Minh bạch tư liệu, Ảnh thực tế & Giao diện Sáng/Dịu mắt</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Trạm Chẩn Đoán & Sửa Chữa{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Bo Mạch Điện Tử, Mainboard, VGA, PSU & Gia Dụng Coway
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Biểu diễn chân đo, đường mạch Airwire và điểm nghi ngờ lỗi trực tiếp lên ảnh chụp PCB thực tế hoặc Sơ đồ nguyên lý giấy PDF. Tư liệu thiếu hoặc bảo mật NDA được để trống trung thực.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigateMode('workbench')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition-all"
              >
                <Columns2 className="h-4 w-4" />
                <span>Mở Workbench Song Song</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateMode('boardview')}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                <span>Xem Ảnh Thực Tế PCB</span>
              </button>

              <button
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span>Tra cứu linh kiện (Ctrl+K)</span>
              </button>
            </div>
          </div>

          {/* Telemetry KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0 lg:w-[320px]">
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Bo Mạch Hệ Thống</div>
              <div className="mt-1 font-mono text-2xl font-bold text-cyan-300">{boards.length}</div>
              <div className="text-[10px] text-slate-400">
                {sbcBoards.length} SBC • {applianceBoards.length} Coway • {gpuBoards.length} VGA • {motherboards.length} Main • {psus.length} PSU
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Ảnh Thực Tế PCB</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-300">
                {realPhotoCount}/{boards.length}
              </div>
              <div className="text-[10px] text-slate-400">Bản quyền mở xác thực</div>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Linh Kiện / Rail</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-300">
                {totalComponents}/{totalRails}
              </div>
              <div className="text-[10px] text-slate-400">Có thông số đo chuẩn</div>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Pan Bệnh / Chuỗi</div>
              <div className="mt-1 font-mono text-2xl font-bold text-rose-300">
                {faults.length}/{powerSequences.length}
              </div>
              <div className="text-[10px] text-slate-400">Ca lỗi & Power Seq</div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Documentation & Real-Photo Status Summary Strip */}
      <section className="lab-panel rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-500/15 text-cyan-300">
            <Layers className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs min-w-0">
            <div className="font-bold text-slate-100">
              Báo Cáo Minh Bạch Tư Liệu & Hình Ảnh Thực Tế
            </div>
            <p className="text-slate-400 leading-relaxed">
              Các bo mạch thiếu tư liệu gốc được gắn nhãn và để trống trung thực thay vì bịa sơ đồ hay ghép ảnh giả:
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{realPhotoCount} bo có ảnh thực tế</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
            <GitBranch className="h-3.5 w-3.5" />
            <span>{officialOrPublicSchCount} bo có Schematic gốc/công khai</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-amber-300">
            <FileWarning className="h-3.5 w-3.5" />
            <span>{ndaOrBlockCount} bo thương mại NDA (khối tham chiếu / để trống)</span>
          </span>
        </div>
      </section>

      {/* Hardware Boards Picker (Categorized + Real Photo Thumbnails) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span>Bo Mạch Hỗ Trợ ({filteredBoards.length})</span>
            </h2>

            {/* Category filter tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: `Tất cả (${boards.length})` },
                  { id: 'sbc_mcu', label: `Nhúng / SBC (${sbcBoards.length})` },
                  { id: 'appliance', label: `Gia Dụng Coway (${applianceBoards.length})` },
                  { id: 'gpu', label: `Card VGA (${gpuBoards.length})` },
                  { id: 'motherboard', label: `Mainboard (${motherboards.length})` },
                  { id: 'psu', label: `Nguồn ATX (${psus.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${
                    categoryFilter === tab.id
                      ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredBoards.map((board: HardwareBoard) => {
              const isSelected = board.id === selectedBoard.id;
              const catMeta = DEVICE_CATEGORY_META[board.category];
              const schMeta = board.docsMeta
                ? SCHEMATIC_STATUS_META[board.docsMeta.schematicStatus]
                : null;

              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => onSelectBoard(board.id)}
                  className={`group rounded-xl border p-3.5 text-left transition-all flex flex-col gap-2.5 ${
                    isSelected
                      ? 'border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_20px_rgba(56,189,248,0.14)]'
                      : 'border-slate-700/80 bg-slate-900/65 hover:border-slate-600 hover:bg-slate-900/90'
                  }`}
                >
                  {/* Real Photo Preview Strip OR Honest Empty Notice */}
                  <div className="relative h-28 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80">
                    {board.realPhoto ? (
                      <>
                        <img
                          src={board.realPhoto.imageUrl}
                          alt={board.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="cm-preserve-dark absolute bottom-1.5 left-1.5 rounded bg-slate-950/85 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 border border-emerald-500/40 backdrop-blur">
                          📷 Ảnh thực tế ({board.realPhoto.license})
                        </span>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                        <ImageIcon className="h-5 w-5 text-slate-600 mb-1" />
                        <span className="text-[11px] font-medium text-slate-400">
                          Chưa có ảnh thực tế (Để trống)
                        </span>
                        <span className="text-[9px] text-slate-500">
                          Hỗ trợ tải ảnh riêng & Sơ đồ bố trí 2D
                        </span>
                      </div>
                    )}

                    {isSelected && (
                      <span className="cm-preserve-dark absolute top-1.5 right-1.5 rounded bg-cyan-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-950 shadow">
                        ĐANG CHỌN
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${catMeta.badgeClass}`}
                    >
                      {board.category === 'psu' ? (
                        <Zap className="h-3 w-3" />
                      ) : (
                        <Cpu className="h-3 w-3" />
                      )}
                      {catMeta.shortLabel}
                    </span>
                    {schMeta && (
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${schMeta.badgeClass}`}
                      >
                        {schMeta.shortLabel}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-sm text-slate-100 truncate">
                      {board.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {board.brand} • {board.generation}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{board.summary}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Signature Fault Cases for Active Board */}
        <div className="xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Pan Bệnh ({selectedBoard.name.split('(')[0].trim()})</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateMode('diagnostics')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Mở tất cả ({faults.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {boardFaults.slice(0, 5).map((fault) => {
              const sev = SEVERITY_META[fault.severity];
              return (
                <button
                  key={fault.id}
                  type="button"
                  onClick={() => handleLaunchFault(fault)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 text-left hover:border-rose-400/50 hover:bg-slate-900 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${sev.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dotClass}`} />
                      {sev.label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {fault.postCode ? `POST: ${fault.postCode}` : fault.brandTag}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                    {fault.title}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {fault.symptom}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 Core Modules Launch Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Công Cụ Chẩn Đoán Chuyên Sâu</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateMode('library')}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Xem Thư viện & Chuỗi kích nguồn →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {launchCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.mode}
                type="button"
                onClick={() => onNavigateMode(card.mode)}
                className="group lab-panel flex flex-col justify-between rounded-xl p-4 text-left hover:border-cyan-400/50 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br ${card.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md border border-slate-700/80 bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                    {card.badge}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {card.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
