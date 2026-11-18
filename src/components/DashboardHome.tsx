import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Box,
  Camera,
  Columns2,
  Cpu,
  Flame,
  GitBranch,
  Layers,
  ShieldCheck,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { FaultCase, HardwareBoard, ModuleSharedProps, ViewMode } from '../types/circuit';
import { SEVERITY_META } from './circuitLabels';

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
  const motherboards = boards.filter((b) => b.category === 'motherboard');
  const psus = boards.filter((b) => b.category === 'psu');
  const totalComponents = boards.reduce((sum, b) => sum + b.components.length, 0);
  const totalRails = boards.reduce((sum, b) => sum + b.rails.length, 0);

  const boardFaults = faults.filter(
    (f) =>
      f.boardId === selectedBoard.id ||
      (selectedBoard.category === 'motherboard' && f.boardId === 'all_motherboards') ||
      (selectedBoard.category === 'psu' && f.boardId === 'all_psu')
  );

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
      subtitle: 'Chia đôi Sơ đồ nguyên lý & 3D/BoardView — nhấp linh kiện tự đồng bộ chéo tức thì.',
      badge: 'Đồng bộ 2 chiều',
      accent: 'from-cyan-500/20 to-emerald-500/10 border-cyan-500/35 text-cyan-300',
      icon: Columns2,
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
      mode: 'schematic',
      title: 'Sơ Đồ Nguyên Lý Tương Tác',
      subtitle: 'Dò đường mạch +12V, +VCORE, +5VSB, 390VDC PFC và xem bảng chân đo chi tiết.',
      badge: 'Net Tracer',
      accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/35 text-emerald-300',
      icon: GitBranch,
    },
    {
      mode: 'boardview',
      title: 'BoardView & Điểm Đo Nguội',
      subtitle: 'Bản đồ 2D top-down theo phân vùng với thông số Diode Mode & nội trở chuẩn.',
      badge: '2D Top-Down',
      accent: 'from-violet-500/20 to-purple-500/10 border-violet-500/35 text-violet-300',
      icon: Layers,
    },
    {
      mode: 'scanner',
      title: 'Quét Bo Mạch Camera / Ảnh',
      subtitle: 'Tải ảnh chụp thực tế hoặc mở camera để đối chiếu nhanh khu vực VRM / Sơ cấp PSU.',
      badge: '100% Client',
      accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/35 text-amber-300',
      icon: Camera,
    },
    {
      mode: 'diagnostics',
      title: 'Chẩn Đoán Pan Bệnh Thực Chiến',
      subtitle: 'Quy trình khoanh vùng lỗi từng bước theo triệu chứng, POST code và cách sửa.',
      badge: `${faults.length} Pan bệnh`,
      accent: 'from-rose-500/20 to-amber-500/10 border-rose-500/35 text-rose-300',
      icon: Stethoscope,
    },
  ];

  const handleLaunchFault = (fault: FaultCase) => {
    if (fault.boardId !== 'all_motherboards' && fault.boardId !== 'all_psu') {
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
      <section className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0E1728] via-[#0B1322] to-[#080E19] p-5 md:p-7 shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Static Hardware Lab • 100% Miễn phí & Chạy Offline trên trình duyệt</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Trạm Chẩn Đoán & Sửa Chữa{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                Mainboard PC & Nguồn ATX
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Dò đường nguồn song song giữa Sơ đồ nguyên lý, Mô hình 3D nhiệt FLIR và BoardView 2D.
              Tra cứu nhanh giá trị đo áp, Diode Mode, nội trở và chuỗi kích nguồn chuẩn cho kỹ thuật viên phần cứng.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigateMode('workbench')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:brightness-110 transition-all"
              >
                <Columns2 className="h-4 w-4" />
                <span>Mở Workbench Song Song</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateMode('viewer3d')}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
              >
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Xem 3D & Camera Nhiệt</span>
              </button>

              <button
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span>Tra cứu linh kiện (Ctrl+K)</span>
              </button>
            </div>
          </div>

          {/* Telemetry KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0 lg:w-[300px]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-[11px] text-slate-400">Bo Mạch Mẫu</div>
              <div className="mt-1 font-mono text-2xl font-bold text-cyan-300">{boards.length}</div>
              <div className="text-[10px] text-slate-500">
                {motherboards.length} Main • {psus.length} PSU
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-[11px] text-slate-400">Linh Kiện Số Hóa</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-300">{totalComponents}</div>
              <div className="text-[10px] text-slate-500">Có chân đo & nhiệt độ</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-[11px] text-slate-400">Đường Nguồn / Rail</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-300">{totalRails}</div>
              <div className="text-[10px] text-slate-500">Tô màu dòng điện 3D</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-[11px] text-slate-400">Pan Bệnh & Chuỗi</div>
              <div className="mt-1 font-mono text-2xl font-bold text-rose-300">
                {faults.length}/{powerSequences.length}
              </div>
              <div className="text-[10px] text-slate-500">Ca lỗi & Power Seq</div>
            </div>
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

      {/* Bottom 2-Column Section: Hardware Boards + Signature Faults */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Hardware Boards Picker */}
        <div className="xl:col-span-7 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>Bo Mạch Hỗ Trợ (Chọn để làm việc)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boards.map((board: HardwareBoard) => {
              const isSelected = board.id === selectedBoard.id;
              const isPsu = board.category === 'psu';
              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => onSelectBoard(board.id)}
                  className={`rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.14)]'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                        isPsu
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {isPsu ? <Zap className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                      {isPsu ? 'PSU ATX' : 'MAINBOARD'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{board.formFactor}</span>
                  </div>

                  <div className="mt-2 font-semibold text-sm text-slate-100 flex items-center justify-between gap-2">
                    <span className="truncate">{board.name}</span>
                    {isSelected && (
                      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300 border border-emerald-500/30">
                        ĐANG CHỌN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {board.brand} • {board.generation}
                  </div>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">{board.summary}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Signature Fault Cases for Active Board */}
        <div className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Pan Bệnh Nổi Bật ({boardFaults.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateMode('diagnostics')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Mở tất cả →
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left hover:border-rose-400/40 hover:bg-slate-900 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${sev.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dotClass}`} />
                      {sev.label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {fault.postCode ? `POST: ${fault.postCode}` : fault.brandTag}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs font-bold text-slate-100 group-hover:text-rose-200 transition-colors">
                    {fault.title}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">{fault.symptom}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
