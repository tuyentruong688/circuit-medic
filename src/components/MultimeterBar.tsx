import React from 'react';
import { Activity, AlertOctagon, Cpu, Gauge, Thermometer, Zap } from 'lucide-react';
import { BoardComponent, FaultCase, HardwareBoard, PowerRailNet } from '../types/circuit';

interface MultimeterBarProps {
  selectedBoard: HardwareBoard;
  selectedComponent: BoardComponent | null;
  selectedNet: PowerRailNet | null;
  activeFault: FaultCase | null;
  thermalMode: boolean;
  onSelectComponent: (componentId: string | null) => void;
}

export const MultimeterBar: React.FC<MultimeterBarProps> = ({
  selectedBoard,
  selectedComponent,
  selectedNet,
  activeFault,
  thermalMode,
  onSelectComponent,
}) => {
  const primaryPin = selectedComponent?.pins[0] ?? null;
  const isSuspect = Boolean(
    selectedComponent && activeFault?.suspectComponentIds.includes(selectedComponent.id)
  );
  const displayTemp = selectedComponent
    ? thermalMode || isSuspect
      ? selectedComponent.faultTempC ?? selectedComponent.normalTempC
      : selectedComponent.normalTempC
    : undefined;

  return (
    <footer className="cm-shell-footer z-20 shrink-0 border-t border-slate-800 bg-[#141d2e]/95 px-4 py-1.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
        {/* Left: Digital Multimeter Live Readout */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
            <Gauge className="h-3 w-3" />
            <span>DMM QUICK-PROBE</span>
          </div>

          {selectedComponent ? (
            <div className="flex flex-wrap items-center gap-3 font-mono">
              <span className="inline-flex items-center gap-1 font-semibold text-cyan-300">
                <Cpu className="h-3 w-3" />
                {selectedComponent.id}
                {selectedComponent.partNumber ? ` (${selectedComponent.partNumber})` : ''}
              </span>
              {primaryPin ? (
                <>
                  <span className="text-slate-400">
                    Pin <strong className="text-slate-200">{primaryPin.pin}</strong> ({primaryPin.name}):
                  </span>
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-emerald-300 border border-slate-800">
                    V = {primaryPin.expectedVoltage}
                  </span>
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-300 border border-slate-800">
                    Diode = {primaryPin.expectedDiodeDrop}
                  </span>
                  {primaryPin.expectedResistance && (
                    <span className="hidden lg:inline rounded bg-slate-900 px-1.5 py-0.5 text-sky-300 border border-slate-800">
                      Ω = {primaryPin.expectedResistance}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400">{selectedComponent.specs || selectedComponent.label}</span>
              )}
              {displayTemp !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border ${
                    isSuspect
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <Thermometer className="h-3 w-3" />
                  {displayTemp}°C
                </span>
              )}
            </div>
          ) : selectedNet ? (
            <div className="flex items-center gap-2.5 font-mono">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedNet.color }}
              />
              <span className="font-semibold text-slate-100">{selectedNet.name}</span>
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-cyan-300 border border-slate-800">
                Áp chuẩn: {selectedNet.nominalVoltage}
              </span>
              <span className="hidden md:inline text-slate-400">
                ({selectedNet.connectedComponents.length} linh kiện nối mạch)
              </span>
              {selectedNet.connectedComponents[0] && (
                <button
                  type="button"
                  onClick={() => onSelectComponent(selectedNet.connectedComponents[0])}
                  className="text-cyan-400 hover:underline"
                >
                  Nhảy tới {selectedNet.connectedComponents[0]} →
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400/70" />
              Nhấp vào bất kỳ linh kiện hoặc đường nguồn nào trên mạch để xem thông số đo áp / diode chuẩn.
            </span>
          )}
        </div>

        {/* Right: HV Safety or Board Quick Status */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedBoard.category === 'psu' ? (
            <span className="inline-flex items-center gap-1 rounded border border-rose-500/35 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
              <AlertOctagon className="h-3 w-3 text-rose-400" />
              HV 390VDC — Xả tụ chính trước khi đo nguội
            </span>
          ) : selectedBoard.category === 'gpu' ? (
            <span className="inline-flex items-center gap-1 rounded border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
              <AlertOctagon className="h-3 w-3 text-amber-400" />
              NVVDD rất thấp (0.2–0.6Ω): Phân biệt kỹ bằng thang 0.1Ω
            </span>
          ) : selectedBoard.category === 'appliance' ? (
            <span className="inline-flex items-center gap-1 rounded border border-rose-500/35 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
              <AlertOctagon className="h-3 w-3 text-rose-400" />
              220VAC / 310VDC & Ẩm Nước — Rút điện, xả tụ & lau khô trước khi đo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              <Zap className="h-3 w-3 text-emerald-400" />
              Đo Diode: Que ĐỎ chấm Mass (GND), Que ĐEN dò chân linh kiện
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
