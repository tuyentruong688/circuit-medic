import React from 'react';
import {
  Activity,
  BookOpen,
  Box,
  Camera,
  Columns2,
  Cpu,
  Flame,
  GitBranch,
  LayoutDashboard,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { HardwareBoard, ViewMode } from '../types/circuit';
import { VIEW_MODE_META } from './circuitLabels';

interface SidebarProps {
  activeMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  selectedBoard: HardwareBoard;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onResetSelection: () => void;
  hasSelection: boolean;
}

const NAV_ITEMS: Array<{ mode: ViewMode; icon: React.FC<{ className?: string }> }> = [
  { mode: 'dashboard', icon: LayoutDashboard },
  { mode: 'workbench', icon: Columns2 },
  { mode: 'scanner', icon: Camera },
  { mode: 'schematic', icon: GitBranch },
  { mode: 'viewer3d', icon: Box },
  { mode: 'boardview', icon: Layers },
  { mode: 'diagnostics', icon: Stethoscope },
  { mode: 'library', icon: BookOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeMode,
  onSelectMode,
  selectedBoard,
  collapsed,
  onToggleCollapse,
  onResetSelection,
  hasSelection,
}) => {
  const isPsu = selectedBoard.category === 'psu';

  return (
    <aside
      className={`relative z-30 flex h-full shrink-0 flex-col border-r border-cyan-500/15 bg-[#090F1A]/95 backdrop-blur-xl transition-all duration-200 ${
        collapsed ? 'w-[72px]' : 'w-[252px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-cyan-500/15 px-3">
        <button
          type="button"
          onClick={() => onSelectMode('dashboard')}
          className="flex items-center gap-2.5 overflow-hidden text-left group"
          title="Về Tổng Quan Phòng Lab"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-emerald-500/20 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)] group-hover:border-cyan-300 transition-colors">
            <Activity className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-100 text-sm">
                  Circuit<span className="text-cyan-400">Medic</span>
                </span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-emerald-300 border border-emerald-500/30">
                  LAB
                </span>
              </div>
              <p className="truncate text-[10px] text-slate-400">
                Chẩn đoán Mainboard & PSU
              </p>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-cyan-300 transition-colors"
          title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {!collapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Không Gian Kỹ Thuật
          </div>
        )}
        {NAV_ITEMS.map(({ mode, icon: Icon }) => {
          const meta = VIEW_MODE_META[mode];
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectMode(mode)}
              title={collapsed ? `${meta.label} (${meta.shortcut})` : meta.description}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/35 shadow-[0_0_14px_rgba(34,211,238,0.12)]'
                  : 'text-slate-400 border border-transparent hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-cyan-400" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{meta.shortLabel}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-200'
                        : 'bg-slate-800/80 text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {meta.shortcut}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Board Telemetry Card */}
      <div className="border-t border-cyan-500/15 p-2.5 space-y-2">
        {!collapsed ? (
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  isPsu
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isPsu ? <Zap className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                {isPsu ? 'NGUỒN ATX' : 'MAINBOARD'}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{selectedBoard.formFactor}</span>
            </div>

            <div>
              <div className="truncate text-xs font-semibold text-slate-100" title={selectedBoard.name}>
                {selectedBoard.name}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {selectedBoard.brand} • {selectedBoard.generation}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-[10px]">
              <div className="rounded bg-slate-950/70 py-1 border border-slate-800">
                <div className="text-cyan-300 font-semibold">{selectedBoard.components.length}</div>
                <div className="text-[9px] text-slate-500">Linh kiện</div>
              </div>
              <div className="rounded bg-slate-950/70 py-1 border border-slate-800">
                <div className="text-emerald-300 font-semibold">{selectedBoard.rails.length}</div>
                <div className="text-[9px] text-slate-500">Rail nguồn</div>
              </div>
              <div className="rounded bg-slate-950/70 py-1 border border-slate-800">
                <div className="text-amber-300 font-semibold">{selectedBoard.zones.length}</div>
                <div className="text-[9px] text-slate-500">Phân vùng</div>
              </div>
            </div>

            {selectedBoard.safetyWarning && (
              <div className="flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[10px] leading-snug text-rose-200">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span className="line-clamp-2">{selectedBoard.safetyWarning}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 py-2"
            title={selectedBoard.name}
          >
            {isPsu ? (
              <Zap className="h-4 w-4 text-amber-400" />
            ) : (
              <Cpu className="h-4 w-4 text-cyan-400" />
            )}
            {selectedBoard.safetyWarning && <Flame className="h-3.5 w-3.5 text-rose-400" />}
          </div>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={onResetSelection}
            title="Xóa chọn linh kiện / đường nguồn / lỗi đang theo dõi"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Đặt Lại Lựa Chọn</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
