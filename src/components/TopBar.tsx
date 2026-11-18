import React from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Flame,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { FaultCase, HardwareBoard, UiTheme, ViewMode } from '../types/circuit';
import { SCHEMATIC_STATUS_META, VIEW_MODE_META } from './circuitLabels';

interface TopBarProps {
  boards: HardwareBoard[];
  selectedBoard: HardwareBoard;
  onSelectBoard: (boardId: string) => void;
  selectedNetId: string | null;
  onSelectNet: (netId: string | null) => void;
  thermalMode: boolean;
  onToggleThermalMode: () => void;
  activeFault: FaultCase | null;
  onSelectFault: (fault: FaultCase | null) => void;
  activeMode: ViewMode;
  onNavigateMode: (mode: ViewMode) => void;
  onOpenSearch: () => void;
  uiTheme: UiTheme;
  onToggleUiTheme: () => void;
}

function formatBoardOptionLabel(prefix: string, board: HardwareBoard): string {
  const photoTag = board.realPhoto ? '📷 ' : '';
  const schStatus = board.docsMeta?.schematicStatus;
  const schTag =
    schStatus === 'official_full'
      ? ' · Full Schematic'
      : schStatus === 'official_partial'
        ? ' · Schematic Rút gọn'
        : schStatus === 'unavailable'
          ? ' · Chỉ Ảnh PCB (NDA)'
          : '';
  return `${photoTag}[${prefix}] ${board.name}${schTag}`;
}

export const TopBar: React.FC<TopBarProps> = ({
  boards,
  selectedBoard,
  onSelectBoard,
  selectedNetId,
  onSelectNet,
  thermalMode,
  onToggleThermalMode,
  activeFault,
  onSelectFault,
  activeMode,
  onNavigateMode,
  onOpenSearch,
  uiTheme,
  onToggleUiTheme,
}) => {
  const sbcList = boards.filter((b) => b.category === 'sbc_mcu');
  const gpuList = boards.filter((b) => b.category === 'gpu');
  const motherboardList = boards.filter((b) => b.category === 'motherboard');
  const psuList = boards.filter((b) => b.category === 'psu');

  const modeMeta = VIEW_MODE_META[activeMode];
  const schMeta = selectedBoard.docsMeta
    ? SCHEMATIC_STATUS_META[selectedBoard.docsMeta.schematicStatus]
    : null;

  // Show up to 6 key power rails directly in top telemetry strip
  const topRails = selectedBoard.rails.slice(0, 6);

  return (
    <header className="cm-shell-header z-20 shrink-0 border-b border-slate-800/90 bg-[#141d2e]/95 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        {/* Left: Mode Title + Board Selector + Transparency Badge */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="hidden xl:block pr-2.5 border-r border-slate-700/80">
            <div className="text-xs font-semibold text-slate-100">{modeMeta.label}</div>
            <div className="text-[11px] text-slate-400 max-w-[240px] truncate">
              {modeMeta.description}
            </div>
          </div>

          {/* Board Selector Dropdown grouped by 4 hardware categories */}
          <div className="relative flex items-center">
            <label htmlFor="board-selector" className="sr-only">
              Chọn bo mạch
            </label>
            <select
              id="board-selector"
              value={selectedBoard.id}
              onChange={(e) => onSelectBoard(e.target.value)}
              className="appearance-none rounded-lg border border-slate-700 bg-slate-900/90 pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-100 shadow-inner focus:border-cyan-400 focus:outline-none hover:border-cyan-400/60 transition-colors cursor-pointer max-w-[320px]"
            >
              {sbcList.length > 0 && (
                <optgroup label="Bo Mạch Nhúng & SBC (Có Ảnh Thật + Schematic Gốc)">
                  {sbcList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBoardOptionLabel('SBC', b)}
                    </option>
                  ))}
                </optgroup>
              )}
              {gpuList.length > 0 && (
                <optgroup label="Card Đồ Họa Rời VGA / GPU (Ảnh Thực Tế PCB)">
                  {gpuList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBoardOptionLabel('GPU', b)}
                    </option>
                  ))}
                </optgroup>
              )}
              {motherboardList.length > 0 && (
                <optgroup label="Mainboard PC (Desktop)">
                  {motherboardList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBoardOptionLabel('Main', b)}
                    </option>
                  ))}
                </optgroup>
              )}
              {psuList.length > 0 && (
                <optgroup label="Nguồn Máy Tính ATX (PSU)">
                  {psuList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {formatBoardOptionLabel('PSU', b)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-cyan-400" />
          </div>

          {/* Honest Documentation & Real-Photo Badges */}
          <div className="hidden 2xl:flex items-center gap-1.5">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                selectedBoard.realPhoto
                  ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/70 text-slate-400'
              }`}
              title={
                selectedBoard.realPhoto
                  ? selectedBoard.realPhoto.sourceLabel
                  : 'Chưa có ảnh chụp thực tế bản quyền mở cho bo mạch này'
              }
            >
              {selectedBoard.realPhoto ? '📷 Có ảnh thực tế' : '📷 Chưa có ảnh thật'}
            </span>
            {schMeta && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${schMeta.badgeClass}`}
                title={selectedBoard.docsMeta?.schematicSourceLabel}
              >
                {schMeta.shortLabel}
              </span>
            )}
          </div>

          {/* Search trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
            title="Tìm nhanh linh kiện, đường nguồn hoặc pan bệnh (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Tìm linh kiện / rail...</span>
            <kbd className="hidden md:inline-block rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: UI Theme Toggle + Thermal Toggle + Active Fault Indicator + Quick Workbench */}
        <div className="flex items-center gap-2">
          {activeFault && (
            <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-xs text-rose-200">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 animate-pulse" />
              <button
                type="button"
                onClick={() => onNavigateMode('diagnostics')}
                className="max-w-[160px] truncate font-medium hover:underline"
                title={`Đang mô phỏng lỗi: ${activeFault.title}`}
              >
                {activeFault.title}
              </button>
              <button
                type="button"
                onClick={() => onSelectFault(null)}
                className="rounded p-0.5 text-rose-300 hover:bg-rose-500/25 hover:text-white"
                title="Tắt mô phỏng lỗi"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Theme Switcher (Nordic Slate / Daylight Lab) */}
          <button
            type="button"
            onClick={onToggleUiTheme}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 transition-colors"
            title="Chuyển giao diện: Tối Dịu Mắt (Nordic Slate) ↔ Sáng Rõ (Daylight Lab)"
          >
            {uiTheme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Tối Dịu Mắt</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Giao Diện Sáng</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleThermalMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              thermalMode
                ? 'border-rose-400/60 bg-gradient-to-r from-rose-500/25 to-amber-500/25 text-amber-200 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
                : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-amber-500/40 hover:text-amber-200'
            }`}
            title="Bật/Tắt Camera Nhiệt Hồng Ngoại (FLIR Heatmap)"
          >
            <Flame className={`h-3.5 w-3.5 ${thermalMode ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{thermalMode ? 'Nhiệt IR: BẬT' : 'Camera Nhiệt'}</span>
          </button>

          {activeMode !== 'workbench' && (
            <button
              type="button"
              onClick={() => onNavigateMode('workbench')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-colors"
              title="Mở chế độ chia đôi màn hình Sơ đồ nguyên lý + Ảnh thực tế/3D"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Workbench</span>
            </button>
          )}
        </div>
      </div>

      {/* Unified Power Rail Telemetry Strip (Single source of rail filter across views) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-slate-950/50 px-4 py-1.5">
        <span className="inline-flex shrink-0 items-center gap-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <Zap className="h-3 w-3 text-cyan-400" />
          Đường Nguồn:
        </span>

        <button
          type="button"
          onClick={() => onSelectNet(null)}
          className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
            selectedNetId === null
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200 font-semibold'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          Tất cả ({selectedBoard.rails.length})
        </button>

        {topRails.map((rail) => {
          const isSelected = selectedNetId === rail.id;
          return (
            <button
              key={rail.id}
              type="button"
              onClick={() => onSelectNet(isSelected ? null : rail.id)}
              title={`${rail.name} (${rail.nominalVoltage}) — ${rail.description}`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-all ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'border-slate-800/90 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
              }`}
              style={
                isSelected
                  ? { borderColor: rail.color, boxShadow: `0 0 10px ${rail.color}40` }
                  : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: rail.color, boxShadow: `0 0 5px ${rail.color}` }}
              />
              <span className="font-semibold">{rail.name}</span>
              <span className="text-[10px] text-slate-400">{rail.nominalVoltage}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
