import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Cpu, Search, X, Zap } from 'lucide-react';
import { FaultCase, HardwareBoard } from '../types/circuit';

interface ComponentQuickSearchModalProps {
  open: boolean;
  onClose: () => void;
  selectedBoard: HardwareBoard;
  faults: FaultCase[];
  onSelectComponent: (componentId: string) => void;
  onSelectNet: (netId: string) => void;
  onSelectFault: (fault: FaultCase) => void;
}

export const ComponentQuickSearchModal: React.FC<ComponentQuickSearchModalProps> = ({
  open,
  onClose,
  selectedBoard,
  faults,
  onSelectComponent,
  onSelectNet,
  onSelectFault,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const normalized = query.trim().toLowerCase();

  const matchedComponents = useMemo(() => {
    if (!normalized) return selectedBoard.components.slice(0, 8);
    return selectedBoard.components
      .filter(
        (c) =>
          c.id.toLowerCase().includes(normalized) ||
          c.label.toLowerCase().includes(normalized) ||
          (c.partNumber && c.partNumber.toLowerCase().includes(normalized)) ||
          c.description.toLowerCase().includes(normalized)
      )
      .slice(0, 12);
  }, [normalized, selectedBoard.components]);

  const matchedRails = useMemo(() => {
    if (!normalized) return selectedBoard.rails.slice(0, 5);
    return selectedBoard.rails
      .filter(
        (r) =>
          r.name.toLowerCase().includes(normalized) ||
          r.nominalVoltage.toLowerCase().includes(normalized) ||
          r.description.toLowerCase().includes(normalized)
      )
      .slice(0, 6);
  }, [normalized, selectedBoard.rails]);

  const matchedFaults = useMemo(() => {
    const boardFaults = faults.filter(
      (f) =>
        f.boardId === selectedBoard.id ||
        (selectedBoard.category === 'motherboard' && f.boardId === 'all_motherboards') ||
        (selectedBoard.category === 'psu' && f.boardId === 'all_psu')
    );
    if (!normalized) return boardFaults.slice(0, 4);
    return boardFaults
      .filter(
        (f) =>
          f.title.toLowerCase().includes(normalized) ||
          f.symptom.toLowerCase().includes(normalized) ||
          (f.postCode && f.postCode.toLowerCase().includes(normalized))
      )
      .slice(0, 6);
  }, [faults, normalized, selectedBoard]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/75 p-4 pt-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/35 bg-[#0B1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Search className="h-4 w-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tìm linh kiện (PQ101, U_PWM...), rail (+VCORE, +5VSB) hoặc pan bệnh trên ${selectedBoard.name}...`}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {matchedComponents.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Linh Kiện ({matchedComponents.length})
              </div>
              {matchedComponents.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectComponent(c.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-cyan-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Cpu className="h-4 w-4 shrink-0 text-cyan-400" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">
                        <span className="font-mono text-cyan-300">{c.id}</span> — {c.label}
                      </div>
                      <div className="truncate text-[11px] text-slate-400">
                        {c.partNumber ? `${c.partNumber} • ` : ''}
                        {c.description}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">{c.zone}</span>
                </button>
              ))}
            </div>
          )}

          {matchedRails.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Đường Nguồn / Power Rails ({matchedRails.length})
              </div>
              {matchedRails.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelectNet(r.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Zap className="h-4 w-4 shrink-0" style={{ color: r.color }} />
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-slate-100">
                        {r.name} ({r.nominalVoltage})
                      </div>
                      <div className="truncate text-[11px] text-slate-400">{r.description}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {r.connectedComponents.length} LK
                  </span>
                </button>
              ))}
            </div>
          )}

          {matchedFaults.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pan Bệnh Liên Quan ({matchedFaults.length})
              </div>
              {matchedFaults.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onSelectFault(f);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-rose-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <div className="min-w-0">
                      <div className="font-semibold text-rose-200 truncate">{f.title}</div>
                      <div className="truncate text-[11px] text-slate-400">{f.symptom}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {f.steps.length} bước
                  </span>
                </button>
              ))}
            </div>
          )}

          {matchedComponents.length === 0 &&
            matchedRails.length === 0 &&
            matchedFaults.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Không tìm thấy kết quả phù hợp cho "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
