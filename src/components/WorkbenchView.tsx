import React, { useState } from 'react';
import { Box, Columns2, Layers, Link2 } from 'lucide-react';
import { ModuleSharedProps } from '../types/circuit';
import { SchematicViewer } from '../modules/schematic/SchematicViewer';
import { Board3DViewer } from '../modules/viewer3d/Board3DViewer';
import { PhotoBoardViewer } from '../modules/boardview/PhotoBoardViewer';

type RightPaneKind = 'viewer3d' | 'boardview';
type SplitRatio = '50-50' | '60-40' | '40-60';

export const WorkbenchView: React.FC<ModuleSharedProps> = (props) => {
  const [rightPane, setRightPane] = useState<RightPaneKind>('viewer3d');
  const [splitRatio, setSplitRatio] = useState<SplitRatio>('50-50');

  const gridColsClass =
    splitRatio === '60-40'
      ? 'lg:grid-cols-[3fr_2fr]'
      : splitRatio === '40-60'
        ? 'lg:grid-cols-[2fr_3fr]'
        : 'lg:grid-cols-2';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Synchronized Workbench Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/15 bg-[#0A111E]/90 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-300">
            <Link2 className="h-3.5 w-3.5" />
            <span>Đồng bộ 2 chiều</span>
          </span>
          <span className="hidden sm:inline text-slate-400">
            Nhấp linh kiện hoặc đường nguồn ở Sơ đồ nguyên lý để tự động focus sang {rightPane === 'viewer3d' ? 'Mô hình 3D' : 'BoardView 2D'}.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Split ratio switcher */}
          <div className="hidden lg:flex items-center rounded-lg border border-slate-800 bg-slate-950/70 p-0.5 text-[11px] font-mono">
            {(
              [
                { id: '40-60', label: '40/60' },
                { id: '50-50', label: '50/50' },
                { id: '60-40', label: '60/40' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSplitRatio(item.id)}
                className={`rounded-md px-2 py-1 transition-colors ${
                  splitRatio === item.id
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Đổi tỷ lệ chia màn hình"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right pane mode switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setRightPane('viewer3d')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                rightPane === 'viewer3d'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D & Nhiệt</span>
            </button>
            <button
              type="button"
              onClick={() => setRightPane('boardview')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                rightPane === 'boardview'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>BoardView 2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split-View Panes */}
      <div className={`grid flex-1 min-h-0 grid-cols-1 ${gridColsClass} gap-2 p-2 overflow-hidden`}>
        {/* Left: Interactive Schematic */}
        <div className="relative flex flex-col min-h-[280px] overflow-hidden rounded-xl border border-cyan-500/20 bg-[#080E18]">
          <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/70 px-3 py-1.5 text-[11px]">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Columns2 className="h-3.5 w-3.5" />
              Sơ Đồ Nguyên Lý — {props.selectedBoard.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {props.selectedBoard.wires.length} đường mạch
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SchematicViewer {...props} />
          </div>
        </div>

        {/* Right: Synchronized 3D or Photo BoardView */}
        <div className="relative flex flex-col min-h-[280px] overflow-hidden rounded-xl border border-cyan-500/20 bg-[#080E18]">
          <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/70 px-3 py-1.5 text-[11px]">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              {rightPane === 'viewer3d' ? <Box className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
              {rightPane === 'viewer3d'
                ? 'Mô Phỏng 3D & Camera Nhiệt'
                : 'BoardView Ảnh Chụp & Chân Đo'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {props.selectedComponentId ? `Focus: ${props.selectedComponentId}` : 'Toàn mạch'}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {rightPane === 'viewer3d' ? (
              <Board3DViewer {...props} />
            ) : (
              <PhotoBoardViewer {...props} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
