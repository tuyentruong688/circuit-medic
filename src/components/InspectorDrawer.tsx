import React from 'react';
import {
  AlertTriangle,
  Box,
  Cpu,
  Flame,
  GitBranch,
  Layers,
  Stethoscope,
  Thermometer,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  BoardComponent,
  FaultCase,
  HardwareBoard,
  PowerRailNet,
  ViewMode,
} from '../types/circuit';
import { COMPONENT_KIND_LABELS, RAIL_CATEGORY_LABELS } from './circuitLabels';

interface InspectorDrawerProps {
  selectedBoard: HardwareBoard;
  selectedComponent: BoardComponent | null;
  selectedNet: PowerRailNet | null;
  activeFault: FaultCase | null;
  faults: FaultCase[];
  thermalMode: boolean;
  onSelectComponent: (componentId: string | null) => void;
  onSelectNet: (netId: string | null) => void;
  onSelectFault: (fault: FaultCase | null) => void;
  onNavigateMode: (mode: ViewMode) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  selectedBoard,
  selectedComponent,
  selectedNet,
  activeFault,
  faults,
  thermalMode,
  onSelectComponent,
  onSelectNet,
  onSelectFault,
  onNavigateMode,
}) => {
  if (!selectedComponent && !selectedNet) {
    return null;
  }

  const boardScopedFaults = faults.filter(
    (f) =>
      f.boardId === selectedBoard.id ||
      (selectedBoard.category === 'motherboard' && f.boardId === 'all_motherboards') ||
      (selectedBoard.category === 'psu' && f.boardId === 'all_psu')
  );

  const relatedFaults = selectedComponent
    ? boardScopedFaults.filter(
        (f) =>
          f.suspectComponentIds.includes(selectedComponent.id) ||
          f.steps.some(
            (s) =>
              s.targetComponentId === selectedComponent.id ||
              s.failSuspectComponents.includes(selectedComponent.id)
          )
      )
    : selectedNet
      ? boardScopedFaults.filter((f) => f.affectedRails.includes(selectedNet.id))
      : [];

  const isSuspect = Boolean(
    selectedComponent && activeFault?.suspectComponentIds.includes(selectedComponent.id)
  );

  const componentZone = selectedComponent
    ? selectedBoard.zones.find((z) => z.id === selectedComponent.zone)
    : undefined;

  return (
    <aside className="z-20 flex h-full w-full sm:w-[370px] lg:w-[400px] shrink-0 flex-col border-l border-cyan-500/20 bg-[#0A111E]/96 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-cyan-500/15 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-cyan-300 border border-cyan-500/30">
              {selectedComponent ? 'Cross-Probe Linh Kiện' : 'Cross-Probe Đường Nguồn'}
            </span>
            {isSuspect && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-300 border border-rose-500/40">
                <AlertTriangle className="h-3 w-3" />
                Nghi vấn lỗi
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-sm font-bold text-white">
            {selectedComponent ? `${selectedComponent.id} — ${selectedComponent.label}` : selectedNet?.name}
          </h3>
          <p className="truncate text-[11px] text-slate-400">
            {selectedComponent
              ? `${COMPONENT_KIND_LABELS[selectedComponent.kind]}${
                  selectedComponent.partNumber ? ` • ${selectedComponent.partNumber}` : ''
                }`
              : selectedNet
                ? `${RAIL_CATEGORY_LABELS[selectedNet.category]} • ${selectedNet.nominalVoltage}`
                : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (selectedComponent) onSelectComponent(null);
            else onSelectNet(null);
          }}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Đóng bảng kiểm tra"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedComponent ? (
          <>
            {/* Quick Cross-Probe Jump Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateMode('viewer3d')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-2 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
              >
                <Box className="h-3.5 w-3.5" />
                <span>Xem trên 3D</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateMode('schematic')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Sơ Đồ Nguyên Lý</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateMode('boardview')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-2 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Ảnh Chụp BoardView</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (relatedFaults[0]) {
                    onSelectFault(relatedFaults[0]);
                  }
                  onNavigateMode('diagnostics');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20 transition-colors"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Chẩn Đoán Lỗi</span>
              </button>
            </div>

            {/* Summary & Thermal Metrics */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2.5">
              <p className="text-xs text-slate-300 leading-relaxed">{selectedComponent.description}</p>

              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                {componentZone && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5"
                    style={{
                      borderColor: `${componentZone.color}55`,
                      backgroundColor: `${componentZone.color}18`,
                      color: componentZone.color,
                    }}
                  >
                    <Cpu className="h-3 w-3" />
                    Vùng: {componentZone.name}
                  </span>
                )}
                {selectedComponent.specs && (
                  <span className="rounded border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-slate-300">
                    {selectedComponent.specs}
                  </span>
                )}
              </div>

              {(selectedComponent.normalTempC !== undefined ||
                selectedComponent.faultTempC !== undefined) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Thermometer className="h-3 w-3 text-emerald-400" />
                      Nhiệt độ chuẩn
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-300">
                      {selectedComponent.normalTempC ?? '--'}°C
                    </div>
                  </div>
                  <div
                    className={`rounded-lg border px-2.5 py-1.5 ${
                      thermalMode || isSuspect
                        ? 'border-rose-500/40 bg-rose-500/15'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Flame className="h-3 w-3 text-rose-400" />
                      Khi chạm / quá tải
                    </div>
                    <div className="font-mono text-xs font-bold text-rose-300">
                      {selectedComponent.faultTempC ?? '--'}°C
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pinout & Multimeter Table */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Zap className="h-3.5 w-3.5" />
                Bảng Chân & Thông Số Đo ({selectedComponent.pins.length})
              </h4>

              {selectedComponent.pins.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] uppercase text-slate-400">
                        <th className="px-2.5 py-2">Chân</th>
                        <th className="px-2 py-2">Rail</th>
                        <th className="px-2 py-2">Áp / Diode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {selectedComponent.pins.map((pin) => {
                        const matchedRail = selectedBoard.rails.find(
                          (r) => r.id === pin.net || r.name === pin.net
                        );
                        return (
                          <tr key={`${pin.pin}-${pin.name}`} className="hover:bg-slate-900/50">
                            <td className="px-2.5 py-2 align-top">
                              <div className="font-mono font-bold text-slate-100">{pin.pin}</div>
                              <div className="text-[10px] text-slate-400">{pin.name}</div>
                            </td>
                            <td className="px-2 py-2 align-top">
                              {matchedRail ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectNet(matchedRail.id)}
                                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 hover:border-cyan-400"
                                  title="Nhấn để dò toàn bộ đường nguồn này"
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: matchedRail.color }}
                                  />
                                  {pin.net}
                                </button>
                              ) : (
                                <span className="font-mono text-[10px] text-slate-300">{pin.net}</span>
                              )}
                              {pin.waveformHint && (
                                <div className="mt-1 text-[10px] text-sky-300/80">
                                  Osc: {pin.waveformHint}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 align-top font-mono">
                              <div className="text-emerald-300">{pin.expectedVoltage}</div>
                              <div className="text-[10px] text-amber-300">{pin.expectedDiodeDrop}</div>
                              {pin.expectedResistance && (
                                <div className="text-[10px] text-slate-400">Ω: {pin.expectedResistance}</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
                  Linh kiện thụ động / kết nối cơ khí không có bảng chân đo riêng.
                </div>
              )}
            </div>

            {/* Common Failure Modes */}
            {selectedComponent.commonFailureModes.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Hư Hỏng Thường Gặp
                </h4>
                <ul className="space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-200">
                  {selectedComponent.commonFailureModes.map((mode, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{mode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Replacement Tips */}
            {selectedComponent.replacementTips && (
              <div className="space-y-1.5">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Wrench className="h-3.5 w-3.5" />
                  Lưu Ý Thay Thế & Hàn Khò
                </h4>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-slate-200 leading-relaxed">
                  {selectedComponent.replacementTips}
                </div>
              </div>
            )}
          </>
        ) : (
          selectedNet && (
            <>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: selectedNet.color,
                      boxShadow: `0 0 10px ${selectedNet.color}`,
                    }}
                  />
                  <span className="font-mono text-sm font-bold text-white">
                    {selectedNet.nominalVoltage}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedNet.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Linh kiện trên đường {selectedNet.name} ({selectedNet.connectedComponents.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedNet.connectedComponents.map((compId) => {
                    const comp = selectedBoard.components.find((c) => c.id === compId);
                    return (
                      <button
                        key={compId}
                        type="button"
                        onClick={() => onSelectComponent(compId)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-xs hover:border-cyan-400/50 hover:bg-slate-900 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-cyan-300">{compId}</div>
                          <div className="truncate text-[11px] text-slate-400">
                            {comp ? `${comp.label}${comp.partNumber ? ` (${comp.partNumber})` : ''}` : 'Linh kiện trên mạch'}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Kiểm tra →</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )
        )}

        {/* Related Fault Cases */}
        {relatedFaults.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300">
              <Stethoscope className="h-3.5 w-3.5" />
              Pan Bệnh Liên Quan ({relatedFaults.length})
            </h4>
            <div className="space-y-1.5">
              {relatedFaults.map((fault) => (
                <button
                  key={fault.id}
                  type="button"
                  onClick={() => {
                    onSelectFault(fault);
                    onNavigateMode('diagnostics');
                  }}
                  className="w-full rounded-lg border border-rose-500/25 bg-rose-500/10 p-2.5 text-left hover:border-rose-400/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-rose-200">{fault.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{fault.symptom}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
