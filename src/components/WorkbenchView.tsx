import React, { useEffect, useState } from 'react';
import { Box, Columns2, Image as ImageIcon, Layers, Link2 } from 'lucide-react';
import { ModuleSharedProps } from '../types/circuit';
import { SchematicViewer } from '../modules/schematic/SchematicViewer';
import { Board3DViewer } from '../modules/viewer3d/Board3DViewer';
import { PhotoBoardViewer } from '../modules/boardview/PhotoBoardViewer';

type RightPaneKind = 'boardview' | 'viewer3d';
type SplitRatio = '50-50' | '60-40' | '40-60';

export const WorkbenchView: React.FC<ModuleSharedProps> = (props) => {
  const { selectedBoard } = props;
  const supports3D = selectedBoard.supports3DSimulation !== false;
  const hasRealPhoto = Boolean(selectedBoard.realPhoto);

  const [rightPane, setRightPane] = useState<RightPaneKind>(() =>
    hasRealPhoto || !supports3D ? 'boardview' : 'viewer3d'
  );
  const [splitRatio, setSplitRatio] = useState<SplitRatio>('50-50');

  // Keep right pane valid and prioritize real photo when switching boards
  useEffect(() => {
    if (!supports3D || hasRealPhoto) {
      setRightPane('boardview');
    } else {
      setRightPane('viewer3d');
    }
  }, [selectedBoard.id, supports3D, hasRealPhoto]);

  const gridColsClass =
    splitRatio === '60-40'
      ? 'md:grid-cols-[3fr_2fr]'
      : splitRatio === '40-60'
        ? 'md:grid-cols-[2fr_3fr]'
        : 'md:grid-cols-2';

  const embeddedProps: ModuleSharedProps = {
    ...props,
    embedded: true,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Synchronized Workbench Control Bar */}
      <div className="cm-shell-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#141d2e]/90 px-4 py-1.5 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-300">
            <Link2 className="h-3.5 w-3.5" />
            <span>Đồng bộ 2 chiều</span>
          </span>
          <span className="hidden sm:inline text-slate-400">
            Nhấp linh kiện ở Sơ đồ nguyên lý hoặc Ảnh thực tế để đồng bộ chéo tức thì.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Split ratio switcher */}
          <div className="hidden md:flex items-center rounded-lg border border-slate-700/80 bg-slate-900/70 p-0.5 text-[11px] font-mono">
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
          <div className="flex items-center rounded-lg border border-slate-700/80 bg-slate-900/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setRightPane('boardview')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                rightPane === 'boardview'
                  ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {hasRealPhoto ? (
                <ImageIcon className="h-3.5 w-3.5" />
              ) : (
                <Layers className="h-3.5 w-3.5" />
              )}
              <span>{hasRealPhoto ? 'Ảnh Thực Tế & 2D' : 'BoardView 2D'}</span>
            </button>

            <button
              type="button"
              disabled={!supports3D}
              onClick={() => supports3D && setRightPane('viewer3d')}
              title={
                supports3D
                  ? 'Chuyển sang mô phỏng 3D & Camera nhiệt'
                  : 'Chưa có dữ liệu CAD 3D cho bo mạch này (đã để trống trung thực)'
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                !supports3D
                  ? 'cursor-not-allowed text-slate-600 opacity-60'
                  : rightPane === 'viewer3d'
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>{supports3D ? '3D & Nhiệt' : '3D (Trống NDA)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split-View Panes */}
      <div className={`grid flex-1 min-h-0 grid-cols-1 ${gridColsClass} gap-2.5 p-2.5 overflow-hidden`}>
        {/* Left: Interactive Schematic */}
        <div className="relative flex flex-col min-h-[280px] overflow-hidden rounded-xl border border-slate-700/70 bg-[#0d1524]">
          <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/75 px-3 py-1.5 text-[11px]">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5 truncate">
              <Columns2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Sơ Đồ Nguyên Lý — {selectedBoard.name}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">
              {selectedBoard.wires.length > 0
                ? `${selectedBoard.wires.length} đường mạch`
                : 'NDA / Trống'}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SchematicViewer {...embeddedProps} />
          </div>
        </div>

        {/* Right: Synchronized Real Photo / BoardView or 3D */}
        <div className="relative flex flex-col min-h-[280px] overflow-hidden rounded-xl border border-slate-700/70 bg-[#0d1524]">
          <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/75 px-3 py-1.5 text-[11px]">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              {rightPane === 'viewer3d' ? (
                <Box className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {rightPane === 'viewer3d'
                ? 'Mô Phỏng 3D & Camera Nhiệt'
                : hasRealPhoto
                  ? 'Ảnh Thực Tế Bo Mạch & Điểm Đo'
                  : 'BoardView & Ảnh Tự Tải'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {props.selectedComponentId ? `Focus: ${props.selectedComponentId}` : 'Toàn mạch'}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {rightPane === 'viewer3d' && supports3D ? (
              <Board3DViewer {...embeddedProps} />
            ) : (
              <PhotoBoardViewer {...embeddedProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
