import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Pause,
  Play,
  Waves,
  Zap,
} from 'lucide-react';
import {
  BoardComponent,
  FaultCase,
  HardwareBoard,
  PinMeasurement,
  PowerRailNet,
  PowerSequenceSpec,
} from '../../types/circuit';

interface OscilloscopeDrawerProps {
  board: HardwareBoard;
  selectedComponent: BoardComponent | null;
  selectedPin: PinMeasurement | null;
  selectedNet: PowerRailNet | null;
  activeFault: FaultCase | null;
  powerSequence: PowerSequenceSpec | null;
  onSelectNet: (netId: string | null) => void;
  onSelectPin: (pin: PinMeasurement) => void;
  defaultOpen?: boolean;
}

type WaveKind = 'pwm_300k' | 'rtc_32k' | 'pg_step' | 'dc_ripple' | 'ac_hv';

function inferWaveKind(
  pin: PinMeasurement | null,
  net: PowerRailNet | null,
  component: BoardComponent | null
): WaveKind {
  const hint = `${pin?.waveformHint ?? ''} ${pin?.name ?? ''} ${pin?.net ?? ''} ${net?.name ?? ''} ${component?.kind ?? ''}`.toLowerCase();
  if (hint.includes('32.768') || hint.includes('rtc') || hint.includes('xtal') || hint.includes('osc')) {
    return 'rtc_32k';
  }
  if (hint.includes('pwm') || hint.includes('300k') || hint.includes('gate') || hint.includes('sw') || hint.includes('lx') || hint.includes('llc') || hint.includes('drmos')) {
    return 'pwm_300k';
  }
  if (
    hint.includes('pg') ||
    hint.includes('pwr_ok') ||
    hint.includes('pwrok') ||
    hint.includes('rsmrst') ||
    hint.includes('pltrst') ||
    hint.includes('ps_on') ||
    hint.includes('vr_on') ||
    hint.includes('slp_s') ||
    net?.category === 'control_signal'
  ) {
    return 'pg_step';
  }
  if (hint.includes('ac') || hint.includes('390v') || hint.includes('310v') || net?.category === 'high_voltage') {
    return 'ac_hv';
  }
  return 'dc_ripple';
}

function parseNominalVolts(str: string | undefined): number {
  if (!str) return 3.3;
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? Math.abs(parseFloat(match[0])) : 3.3;
}

export const OscilloscopeDrawer: React.FC<OscilloscopeDrawerProps> = ({
  board,
  selectedComponent,
  selectedPin,
  selectedNet,
  activeFault,
  powerSequence,
  onSelectNet,
  onSelectPin,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'scope' | 'sequence'>('scope');
  const [isRunning, setIsRunning] = useState(true);
  const [simulateFaultWave, setSimulateFaultWave] = useState(true);
  const [timeScale, setTimeScale] = useState<'1us' | '10us' | '5ms'>('10us');
  const [selectedStageOrder, setSelectedStageOrder] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);

  const effectivePin: PinMeasurement | null = useMemo(() => {
    if (selectedPin) return selectedPin;
    if (selectedComponent && selectedComponent.pins.length > 0) {
      return selectedComponent.pins[0];
    }
    return null;
  }, [selectedPin, selectedComponent]);

  const waveKind = useMemo(
    () => inferWaveKind(effectivePin, selectedNet, selectedComponent),
    [effectivePin, selectedNet, selectedComponent]
  );

  const isFaultImpacted = useMemo(() => {
    if (!activeFault || !simulateFaultWave) return false;
    const compHit = selectedComponent && activeFault.suspectComponentIds.includes(selectedComponent.id);
    const netHit =
      (selectedNet && activeFault.affectedRails.some((r) => r.toLowerCase() === selectedNet.id.toLowerCase() || r.toLowerCase() === selectedNet.name.toLowerCase())) ||
      (effectivePin && activeFault.affectedRails.some((r) => effectivePin.net.toLowerCase().includes(r.toLowerCase())));
    return Boolean(compHit || netHit);
  }, [activeFault, simulateFaultWave, selectedComponent, selectedNet, effectivePin]);

  const nominalV = useMemo(
    () => parseNominalVolts(effectivePin?.expectedVoltage ?? selectedNet?.nominalVoltage),
    [effectivePin, selectedNet]
  );

  useEffect(() => {
    if (!isOpen || activeTab !== 'scope') return;
    let rafId = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      if (isRunning) {
        phaseRef.current += 0.045;
      }
      const phase = phaseRef.current;

      // Dark CRT Scope background
      ctx.fillStyle = '#040a12';
      ctx.fillRect(0, 0, w, h);

      // Graticule grid (10x6)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) {
        const gx = (w / 10) * i;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let j = 1; j < 6; j++) {
        const gy = (h / 6) * j;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Center axes ticks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      // Ground 0V reference line
      const gndY = h * 0.78;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, gndY);
      ctx.lineTo(w, gndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waveform color
      const traceColor = isFaultImpacted
        ? '#f43f5e'
        : waveKind === 'pwm_300k'
        ? '#facc15'
        : waveKind === 'rtc_32k'
        ? '#34d399'
        : waveKind === 'pg_step'
        ? '#38bdf8'
        : waveKind === 'ac_hv'
        ? '#fb923c'
        : '#22d3ee';

      const freqFactor = timeScale === '1us' ? 1 : timeScale === '10us' ? 1.8 : 3.2;

      ctx.save();
      ctx.shadowColor = traceColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let px = 0; px < w; px++) {
        const t = (px / w) * Math.PI * 2 * freqFactor;
        let yVal = 0; // 0..1 normalized above gndY

        if (isFaultImpacted) {
          // Degraded/faulty waveform: flat 0V short or severe ripple collapse
          if (waveKind === 'pwm_300k') {
            // Brief startup hiccup then shutdown
            yVal = px < w * 0.16 && Math.sin(t * 6 + phase * 3) > 0.2 ? 0.28 : 0.015 * Math.sin(px * 0.7 + phase * 5);
          } else if (waveKind === 'dc_ripple') {
            yVal = 0.22 + 0.18 * Math.sin(t * 5 + phase * 2) + (Math.sin(px * 0.5) * 0.04);
          } else {
            yVal = 0.01 * Math.sin(px * 0.4 + phase * 4);
          }
        } else {
          switch (waveKind) {
            case 'pwm_300k': {
              const duty = 0.32;
              const cyc = ((t * 2.2 + phase) % (Math.PI * 2)) / (Math.PI * 2);
              const posCyc = cyc < 0 ? cyc + 1 : cyc;
              // Add slight switch-node ringing at rising edge
              const ring = posCyc < 0.06 ? Math.sin(posCyc * 180) * 0.11 * Math.exp(-posCyc * 35) : 0;
              yVal = posCyc < duty ? 0.65 + ring : 0.02;
              break;
            }
            case 'rtc_32k': {
              yVal = 0.36 + 0.28 * Math.sin(t * 3.5 + phase * 1.4);
              break;
            }
            case 'pg_step': {
              const stepPos = (w * 0.32 + Math.sin(phase * 0.25) * 8);
              if (px < stepPos) {
                yVal = 0.02;
              } else if (px < stepPos + 14) {
                yVal = ((px - stepPos) / 14) * 0.62;
              } else {
                yVal = 0.62 + 0.012 * Math.sin(px * 0.4);
              }
              break;
            }
            case 'ac_hv': {
              yVal = 0.35 + 0.32 * Math.abs(Math.sin(t * 1.5 + phase * 0.9));
              break;
            }
            case 'dc_ripple':
            default: {
              // Clean DC with minor high-freq ripple (~25mVpp)
              yVal = 0.56 + 0.028 * Math.sin(t * 6 + phase * 2.2) + 0.012 * Math.cos(t * 17 - phase);
              break;
            }
          }
        }

        const py = gndY - yVal * (h * 0.72);
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Trigger level arrow on left
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(8, h * 0.45 - 4);
      ctx.lineTo(8, h * 0.45 + 4);
      ctx.closePath();
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeTab, isRunning, waveKind, isFaultImpacted, timeScale]);

  const waveBadgeLabel = useMemo(() => {
    if (isFaultImpacted) return 'DẠNG SÓNG LỖI (SỤT ÁP / NGẮT BẢO VỆ)';
    switch (waveKind) {
      case 'pwm_300k':
        return '300kHz PWM Switching (Buck / LLC)';
      case 'rtc_32k':
        return '32.768kHz RTC Crystal Sine';
      case 'pg_step':
        return 'Logic Enable / Power-Good Step';
      case 'ac_hv':
        return 'Cao Áp PFC / Chỉnh Lưu Cầu';
      default:
        return 'DC Rail + Ripple Filter';
    }
  }, [waveKind, isFaultImpacted]);

  const selectedStage = useMemo(() => {
    if (!powerSequence) return null;
    return (
      powerSequence.stages.find((s) => s.order === selectedStageOrder) ??
      powerSequence.stages[0] ??
      null
    );
  }, [powerSequence, selectedStageOrder]);

  return (
    <div className="border-t border-cyan-500/25 bg-slate-950/95 backdrop-blur-md">
      {/* Drawer Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <span>Trình Phân Tích Tín Hiệu & Thứ Tự Nguồn</span>
          </button>

          <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800 ml-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('scope');
                setIsOpen(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'scope'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Dao Động Ký (Oscilloscope)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sequence');
                setIsOpen(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'sequence'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Chuỗi Nguồn ({powerSequence ? `${powerSequence.stages.length} bước` : 'N/A'})
              </span>
            </button>
          </div>
        </div>

        {/* Active Probe Summary Pill */}
        <div className="flex items-center gap-3 text-xs">
          {selectedComponent ? (
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">
                {selectedComponent.id}
              </span>
              {effectivePin && (
                <span className="text-slate-400">
                  Chân <strong className="text-amber-300">{effectivePin.pin}</strong> ({effectivePin.name}) ·{' '}
                  <span className="text-emerald-400 font-mono">{effectivePin.expectedVoltage}</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500">Chọn linh kiện hoặc đường mạch để đo dạng sóng</span>
          )}
        </div>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="p-3">
          {activeTab === 'scope' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* CRT Oscilloscope Canvas */}
              <div className="cm-preserve-dark lg:col-span-7 flex flex-col rounded-lg border border-slate-800 bg-[#040a12] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isFaultImpacted ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-mono font-semibold text-slate-200">{waveBadgeLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['1us', '10us', '5ms'] as const).map((ts) => (
                      <button
                        key={ts}
                        type="button"
                        onClick={() => setTimeScale(ts)}
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                          timeScale === ts
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ts}/div
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsRunning((r) => !r)}
                      className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isRunning ? 'Dừng' : 'Chạy'}</span>
                    </button>
                  </div>
                </div>
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={145}
                  className="w-full h-[145px] block"
                />
              </div>

              {/* Pin Selector & Telemetry Readout */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Thông Số Đo Chân (CH1 Probe)</span>
                  </div>
                  {activeFault && (
                    <button
                      type="button"
                      onClick={() => setSimulateFaultWave((v) => !v)}
                      className={`text-[11px] px-2 py-0.5 rounded border font-medium transition-colors ${
                        simulateFaultWave
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {simulateFaultWave ? 'Đang mô phỏng lỗi' : 'Xem sóng chuẩn'}
                    </button>
                  )}
                </div>

                {/* Telemetry grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-slate-950/90 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">Vpp / Vavg</div>
                    <div className="font-mono font-bold text-cyan-300 mt-0.5">
                      {isFaultImpacted ? '0.04 V' : `${nominalV.toFixed(2)} V`}
                    </div>
                  </div>
                  <div className="rounded bg-slate-950/90 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">Tần số</div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5">
                      {isFaultImpacted
                        ? '0 Hz'
                        : waveKind === 'pwm_300k'
                        ? '300 kHz'
                        : waveKind === 'rtc_32k'
                        ? '32.768 kHz'
                        : waveKind === 'ac_hv'
                        ? '65 kHz / 100Hz'
                        : 'DC'}
                    </div>
                  </div>
                  <div className="rounded bg-slate-950/90 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">Diode Drop</div>
                    <div className="font-mono font-bold text-emerald-300 mt-0.5">
                      {effectivePin?.expectedDiodeDrop ?? '0.420V'}
                    </div>
                  </div>
                </div>

                {/* Quick Pin Tabs for selected component */}
                {selectedComponent && selectedComponent.pins.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pt-1">
                    {selectedComponent.pins.map((p) => {
                      const active = effectivePin?.pin === p.pin;
                      return (
                        <button
                          key={`${p.pin}-${p.name}`}
                          type="button"
                          onClick={() => onSelectPin(p)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                            active
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.pin}:{p.name} ({p.expectedVoltage})
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    {effectivePin?.waveformHint ??
                      `Mẹo: Nhấp vào bất kỳ IC / MOSFET / chân linh kiện trên sơ đồ để soi dạng sóng thực tế.`}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Power Sequence Timing Waterfall */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {powerSequence ? (
                <>
                  <div className="lg:col-span-8 rounded-lg border border-slate-800 bg-slate-900/60 p-3 overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{powerSequence.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {powerSequence.platform}
                      </span>
                    </div>
                    <div className="space-y-1.5 min-w-[520px]">
                      {powerSequence.stages.map((stage, idx) => {
                        const isStageActive = selectedStage?.order === stage.order;
                        const total = powerSequence.stages.length;
                        const leftPct = (idx / total) * 72;
                        const widthPct = Math.max(18, 96 - leftPct);
                        const matchedRail = board.rails.find(
                          (r) =>
                            r.name.toLowerCase().includes(stage.signalName.toLowerCase()) ||
                            stage.signalName.toLowerCase().includes(r.name.toLowerCase())
                        );

                        return (
                          <button
                            key={stage.order}
                            type="button"
                            onClick={() => {
                              setSelectedStageOrder(stage.order);
                              if (matchedRail) onSelectNet(matchedRail.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors ${
                              isStageActive
                                ? 'bg-amber-500/15 border border-amber-500/40'
                                : 'hover:bg-slate-800/70 border border-transparent'
                            }`}
                          >
                            <span className="w-5 text-[10px] font-mono text-slate-500">
                              #{stage.order}
                            </span>
                            <span className="w-28 truncate text-[11px] font-mono font-semibold text-cyan-300">
                              {stage.signalName}
                            </span>
                            <div className="flex-1 h-3.5 bg-slate-950 rounded relative overflow-hidden border border-slate-800">
                              <div
                                className="h-full rounded-r transition-all"
                                style={{
                                  marginLeft: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  background: matchedRail?.color
                                    ? `linear-gradient(90deg, ${matchedRail.color}, ${matchedRail.color}66)`
                                    : 'linear-gradient(90deg, #38bdf8, #0284c7)',
                                }}
                              />
                            </div>
                            <span className="w-20 text-right text-[10px] font-mono text-emerald-300">
                              {stage.voltage}
                            </span>
                            <span className="w-16 text-right text-[10px] font-mono text-slate-400">
                              {stage.delayMs}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Stage Details */}
                  <div className="lg:col-span-4 rounded-lg border border-slate-800 bg-slate-900/70 p-3 flex flex-col justify-between text-xs">
                    {selectedStage && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              Bước #{selectedStage.order}: {selectedStage.signalName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[11px]">
                              {selectedStage.voltage}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mb-2 font-mono">
                            {selectedStage.source} → {selectedStage.destination} ({selectedStage.delayMs})
                          </div>
                          <p className="text-slate-200 leading-relaxed mb-2">
                            {selectedStage.description}
                          </p>
                        </div>
                        <div className="rounded bg-rose-950/40 border border-rose-500/30 p-2 text-[11px] text-rose-200 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Nếu mất lệnh này:</strong> {selectedStage.failureSymptom}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="col-span-12 text-xs text-slate-400 py-4 text-center">
                  Bo mạch này chưa liên kết bảng thứ tự nguồn chi tiết.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
