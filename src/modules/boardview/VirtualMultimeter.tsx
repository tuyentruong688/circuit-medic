import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  BoardComponent,
  FaultCase,
  PinMeasurement,
} from '../../types/circuit';

export type MultimeterMode = 'voltage' | 'diode' | 'resistance';

interface VirtualMultimeterProps {
  mode: MultimeterMode;
  onChangeMode: (mode: MultimeterMode) => void;
  probedComponent: BoardComponent | null;
  probedPin: PinMeasurement | null;
  activeFault: FaultCase | null;
  onSelectPin: (pin: PinMeasurement) => void;
}

interface ReadingEvaluation {
  expectedText: string;
  measuredText: string;
  unit: string;
  status: 'normal' | 'short' | 'open' | 'abnormal' | 'idle';
  verdict: string;
  isContinuityBeep: boolean;
}

function playContinuityBeep(freq = 2400, durationMs = 130) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, durationMs + 50);
  } catch {
    // Ignore audio context restriction errors
  }
}

function evaluateReading(
  mode: MultimeterMode,
  comp: BoardComponent | null,
  pin: PinMeasurement | null,
  activeFault: FaultCase | null
): ReadingEvaluation {
  if (!comp || !pin) {
    return {
      expectedText: '---',
      measuredText: mode === 'voltage' ? '0.000' : mode === 'diode' ? '.OL' : 'OL',
      unit: mode === 'voltage' ? 'VDC' : mode === 'diode' ? 'V (DIODE)' : 'Ω',
      status: 'idle',
      verdict: 'Chạm que đo vào chân linh kiện trên ảnh mạch để đo.',
      isContinuityBeep: false,
    };
  }

  const netLower = `${pin.net} ${pin.name}`.toLowerCase();
  const isGndPin = netLower === 'gnd' || netLower.includes('gnd') || netLower.includes('vss');

  // Check if activeFault affects this component or rail
  const compSuspect = Boolean(activeFault?.suspectComponentIds.includes(comp.id));
  const railAffected = Boolean(
    activeFault?.affectedRails.some(
      (r) =>
        pin.net.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(pin.net.toLowerCase())
    )
  );
  const faultText = `${activeFault?.title ?? ''} ${activeFault?.symptom ?? ''} ${activeFault?.quickFixSummary ?? ''}`.toLowerCase();
  const isShortFault =
    faultText.includes('chập') ||
    faultText.includes('chạm') ||
    faultText.includes('short') ||
    faultText.includes('nổ cầu chì');
  const isOpenOrDropFault =
    faultText.includes('mất') ||
    faultText.includes('đứt') ||
    faultText.includes('sụt') ||
    faultText.includes('khô tụ') ||
    faultText.includes('không nâng');

  const faultImpacted = (compSuspect || railAffected) && !isGndPin;

  if (mode === 'voltage') {
    const expectedText = pin.expectedVoltage || '0V';
    if (!faultImpacted) {
      return {
        expectedText,
        measuredText: expectedText.replace(/[^\d.,\-~V]/g, '') || expectedText,
        unit: 'VDC',
        status: 'normal',
        verdict: isGndPin ? 'Chân Mass (0.00V chuẩn).' : 'Điện áp nằm trong ngưỡng tiêu chuẩn.',
        isContinuityBeep: false,
      };
    }

    if (isShortFault) {
      return {
        expectedText,
        measuredText: '0.002',
        unit: 'VDC',
        status: 'short',
        verdict: `SỤT ÁP VỀ 0V! Nghi vấn chạm chập đường ${pin.net} tại ${comp.id}.`,
        isContinuityBeep: false,
      };
    }
    if (isOpenOrDropFault) {
      const hasPartial = expectedText.includes('390');
      return {
        expectedText,
        measuredText: hasPartial ? '308.4' : '0.000',
        unit: 'VDC',
        status: 'open',
        verdict: hasPartial
          ? 'Mất nâng áp PFC (chỉ đạt ~310VDC thay vì 390VDC)!'
          : `MẤT ĐIỆN ÁP trên chân ${pin.name} (${pin.net})!`,
        isContinuityBeep: false,
      };
    }
    return {
      expectedText,
      measuredText: '0.120',
      unit: 'VDC',
      status: 'abnormal',
      verdict: `Điện áp bất thường so với chuẩn (${expectedText}).`,
      isContinuityBeep: false,
    };
  }

  if (mode === 'diode') {
    const expectedText = pin.expectedDiodeDrop || '0.420V';
    const numericDrop = parseFloat(expectedText.replace(/[^\d.]/g, ''));
    const normalBeep = isGndPin || (!isNaN(numericDrop) && numericDrop < 0.05);

    if (!faultImpacted) {
      return {
        expectedText,
        measuredText: expectedText,
        unit: 'V (DIODE)',
        status: 'normal',
        verdict: isGndPin
          ? 'Thông mạch Mass (0.001V - Bíp!).'
          : 'Nội trở Diode bình thường, không chập.',
        isContinuityBeep: normalBeep,
      };
    }

    if (isShortFault || compSuspect) {
      return {
        expectedText,
        measuredText: '0.002V',
        unit: 'V (DIODE)',
        status: 'short',
        verdict: `CHẬP MẠCH XUỐNG MASS (0.002V - CÒI BÍP)! Nghi hỏng ${comp.id}.`,
        isContinuityBeep: true,
      };
    }

    return {
      expectedText,
      measuredText: 'OL',
      unit: 'V (DIODE)',
      status: 'open',
      verdict: `ĐỨT MẠCH / HỞ MẠCH (OL)! Kiểm tra trở mồi hoặc ${comp.id}.`,
      isContinuityBeep: false,
    };
  }

  // resistance mode
  const expectedText = pin.expectedResistance || (isGndPin ? '0.2 Ω' : '> 1.2 kΩ');
  if (!faultImpacted) {
    return {
      expectedText,
      measuredText: expectedText,
      unit: 'Ω',
      status: 'normal',
      verdict: isGndPin ? 'Thông Mass trực tiếp (< 0.5 Ω).' : 'Trở kháng đường mạch đạt chuẩn.',
      isContinuityBeep: isGndPin,
    };
  }

  if (isShortFault || compSuspect) {
    return {
      expectedText,
      measuredText: '0.4 Ω',
      unit: 'Ω',
      status: 'short',
      verdict: `CHẬP TRỞ KHÁNG THẤP (0.4 Ω)! Cách ly ${comp.id} để kiểm tra.`,
      isContinuityBeep: true,
    };
  }

  return {
    expectedText,
    measuredText: 'OL (∞)',
    unit: 'Ω',
    status: 'open',
    verdict: 'Trở kháng hở mạch (đứt cầu chì / đứt đường mạch).',
    isContinuityBeep: false,
  };
}

export const VirtualMultimeter: React.FC<VirtualMultimeterProps> = ({
  mode,
  onChangeMode,
  probedComponent,
  probedPin,
  activeFault,
  onSelectPin,
}) => {
  const [hold, setHold] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [simulateFault, setSimulateFault] = useState(true);
  const lastBeepKeyRef = useRef<string>('');

  const effectiveFault = simulateFault ? activeFault : null;

  const evalResult = useMemo(
    () => evaluateReading(mode, probedComponent, probedPin, effectiveFault),
    [mode, probedComponent, probedPin, effectiveFault]
  );

  // Trigger continuity buzzer on short / GND beep
  useEffect(() => {
    if (!soundEnabled || hold || !evalResult.isContinuityBeep) return;
    const key = `${mode}-${probedComponent?.id}-${probedPin?.pin}-${evalResult.status}`;
    if (key !== lastBeepKeyRef.current) {
      lastBeepKeyRef.current = key;
      playContinuityBeep(evalResult.status === 'short' ? 2750 : 2100, 140);
    }
  }, [soundEnabled, hold, evalResult, mode, probedComponent?.id, probedPin?.pin]);

  const lcdBg =
    evalResult.status === 'short'
      ? 'bg-rose-950/90 border-rose-500/60 text-rose-300'
      : evalResult.status === 'open' || evalResult.status === 'abnormal'
      ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
      : 'bg-[#091c14] border-emerald-500/40 text-emerald-300';

  return (
    <div className="rounded-xl border border-slate-700/90 bg-slate-950/95 p-3 shadow-2xl flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          <span className="text-xs font-bold tracking-wide text-slate-100 uppercase">
            Đồng Hồ Vạn Năng Ảo
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className={`p-1 rounded border text-xs ${
              soundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Tắt còi thông mạch' : 'Bật còi thông mạch'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setHold((h) => !h)}
            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono flex items-center gap-1 ${
              hold
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <PauseCircle className="w-3 h-3" />
            <span>HOLD</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Dial */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onChangeMode('voltage')}
          className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors flex flex-col items-center gap-0.5 ${
            mode === 'voltage'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Điện Áp DC</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('diode')}
          className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors flex flex-col items-center gap-0.5 ${
            mode === 'diode'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diode / Bíp</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('resistance')}
          className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors flex flex-col items-center gap-0.5 ${
            mode === 'resistance'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="font-mono font-bold text-xs leading-none">Ω</span>
          <span>Trở Kháng</span>
        </button>
      </div>

      {/* Backlit Digital 7-Segment Style LCD */}
      <div className={`rounded-lg border-2 p-3 font-mono relative overflow-hidden ${lcdBg}`}>
        <div className="flex items-center justify-between text-[10px] opacity-80 mb-1">
          <span>
            {mode === 'voltage'
              ? 'DC VOLTS · AUTO'
              : mode === 'diode'
              ? 'DIODE / CONTINUITY'
              : 'OHMS · RESISTANCE'}
          </span>
          <div className="flex items-center gap-1.5">
            {evalResult.isContinuityBeep && (
              <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 font-bold animate-pulse">
                ♪ BEEP
              </span>
            )}
            {hold && <span className="text-amber-300 font-bold">HOLD</span>}
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 my-1">
          <span className="text-3xl font-extrabold tracking-wider tabular-nums drop-shadow">
            {evalResult.measuredText}
          </span>
          <span className="text-xs font-bold opacity-90">{evalResult.unit}</span>
        </div>

        {probedPin && (
          <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1 border-t border-white/10">
            <span className="opacity-75">Giá trị chuẩn:</span>
            <span className="font-bold text-white/95">{evalResult.expectedText}</span>
          </div>
        )}
      </div>

      {/* Active Fault Comparison Toggle */}
      {activeFault && (
        <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-rose-950/40 border border-rose-500/30">
          <span className="text-rose-200 truncate mr-2">Pan bệnh: {activeFault.title}</span>
          <button
            type="button"
            onClick={() => setSimulateFault((v) => !v)}
            className="shrink-0 px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px]"
          >
            {simulateFault ? 'Đang đo lỗi' : 'Đo mạch tốt'}
          </button>
        </div>
      )}

      {/* Diagnostic Verdict */}
      <div
        className={`rounded-lg px-2.5 py-2 text-xs flex items-start gap-2 border ${
          evalResult.status === 'short'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            : evalResult.status === 'open' || evalResult.status === 'abnormal'
            ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
            : evalResult.status === 'normal'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-slate-900/70 border-slate-800 text-slate-400'
        }`}
      >
        {evalResult.status === 'short' || evalResult.status === 'open' ? (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        )}
        <span>{evalResult.verdict}</span>
      </div>

      {/* Quick Pin List for Probed Component */}
      {probedComponent && probedComponent.pins.length > 0 && (
        <div className="pt-1 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>
              Chân đo {probedComponent.id} ({probedComponent.pins.length} chân):
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Que đen → MASS</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
            {probedComponent.pins.map((p) => {
              const isSelected = probedPin?.pin === p.pin;
              return (
                <button
                  key={`${p.pin}-${p.name}`}
                  type="button"
                  onClick={() => onSelectPin(p)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-[11px] font-mono border transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="truncate">
                    <strong className="text-amber-300">{p.pin}</strong> {p.name}{' '}
                    <span className="text-slate-500">({p.net})</span>
                  </span>
                  <span className="text-emerald-300 shrink-0 ml-2">
                    {mode === 'voltage'
                      ? p.expectedVoltage
                      : mode === 'diode'
                      ? p.expectedDiodeDrop
                      : p.expectedResistance || '>1kΩ'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
