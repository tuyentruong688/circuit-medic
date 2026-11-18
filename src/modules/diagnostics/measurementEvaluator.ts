import type { DiagnosticStep } from '../../types/circuit';

export type MeasurementStatus =
  | 'pass'
  | 'short_gnd'
  | 'open_circuit'
  | 'low_voltage'
  | 'over_voltage'
  | 'invalid';

export interface MeasurementEvaluation {
  status: MeasurementStatus;
  title: string;
  explanation: string;
  suggestedAction: string;
  parsedValue?: number;
  parsedUnit?: string;
}

interface ParsedInput {
  value: number;
  unit: 'v' | 'ohm' | 'unknown';
  isOpenLoop: boolean;
}

function parseUserMeasurement(raw: string): ParsedInput | null {
  const trimmed = raw.trim().toLowerCase().replace(/,/g, '.');
  if (!trimmed) return null;

  if (trimmed === 'ol' || trimmed === '0l' || trimmed.includes('hở') || trimmed.includes('vô cực') || trimmed.includes('open')) {
    return { value: Infinity, unit: 'ohm', isOpenLoop: true };
  }

  const match = trimmed.match(/(-?\d+(?:\.\d+)?)\s*(mv|v|kohm|kω|k|mohm|mω|ohm|ω|r)?/i);
  if (!match) return null;

  let num = parseFloat(match[1]);
  if (Number.isNaN(num)) return null;

  const suffix = (match[2] || '').toLowerCase();
  let unit: 'v' | 'ohm' | 'unknown' = 'unknown';

  if (suffix === 'mv') {
    num = num / 1000;
    unit = 'v';
  } else if (suffix === 'v') {
    unit = 'v';
  } else if (suffix === 'kohm' || suffix === 'kω' || suffix === 'k') {
    num = num * 1000;
    unit = 'ohm';
  } else if (suffix === 'mohm' || suffix === 'mω') {
    num = num * 1_000_000;
    unit = 'ohm';
  } else if (suffix === 'ohm' || suffix === 'ω' || suffix === 'r') {
    unit = 'ohm';
  }

  return { value: num, unit, isOpenLoop: false };
}

function extractExpectedRange(
  expectedText: string,
  measureMode: DiagnosticStep['measureMode']
): { min: number; max: number; nominal: number; isResistance: boolean } | null {
  const clean = expectedText.replace(/,/g, '.');

  // Detect resistance expectations
  const isRes =
    measureMode === 'resistance' ||
    /ω|ohm/i.test(clean);

  // Convert mV values inside expected string if present, else parse numbers
  const numbers: number[] = [];
  const tokenRegex = /(\d+(?:\.\d+)?)\s*(mv|v|kω|kohm|k|ω|ohm)?/gi;
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(clean)) !== null) {
    let val = parseFloat(m[1]);
    if (Number.isNaN(val)) continue;
    const unit = (m[2] || '').toLowerCase();
    // Skip percentages like "5%" or frequency like "300kHz" or "32.768kHz"
    const afterIdx = m.index + m[0].length;
    const nextChars = clean.slice(afterIdx, afterIdx + 4).toLowerCase();
    if (nextChars.startsWith('%') || nextChars.startsWith('hz')) continue;

    if (unit === 'mv') val = val / 1000;
    if (unit === 'kω' || unit === 'kohm' || (isRes && unit === 'k')) val = val * 1000;
    numbers.push(val);
  }

  if (numbers.length === 0) return null;

  // Handle "3.3V ± 5%" or "12V ±5%"
  const pctMatch = clean.match(/±\s*(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch && numbers.length >= 1) {
    const nom = numbers[0];
    const pct = parseFloat(pctMatch[1]) / 100;
    return {
      min: nom * (1 - pct),
      max: nom * (1 + pct),
      nominal: nom,
      isResistance: isRes,
    };
  }

  // Handle "> 100" or ">= 50"
  if (/^[\s]*[>≥]/.test(clean) && numbers.length === 1) {
    return {
      min: numbers[0],
      max: Infinity,
      nominal: numbers[0] * 1.5,
      isResistance: isRes,
    };
  }

  if (numbers.length >= 2) {
    const low = Math.min(numbers[0], numbers[1]);
    const high = Math.max(numbers[0], numbers[1]);
    return {
      min: low,
      max: high,
      nominal: (low + high) / 2,
      isResistance: isRes,
    };
  }

  const nom = numbers[0];
  // Default tolerance by mode
  if (measureMode === 'diode') {
    return {
      min: Math.max(0.05, nom * 0.72),
      max: nom * 1.35 + 0.05,
      nominal: nom,
      isResistance: false,
    };
  }
  if (isRes) {
    return {
      min: Math.max(0.5, nom * 0.65),
      max: nom * 2.5 + 10,
      nominal: nom,
      isResistance: true,
    };
  }
  // Voltage default ±10%
  return {
    min: nom * 0.88,
    max: nom * 1.12,
    nominal: nom,
    isResistance: false,
  };
}

export function evaluateLiveMeasurement(
  rawInput: string,
  step: DiagnosticStep
): MeasurementEvaluation | null {
  if (!rawInput.trim()) return null;

  const parsed = parseUserMeasurement(rawInput);
  if (!parsed) {
    return {
      status: 'invalid',
      title: 'Không nhận dạng được giá trị đo',
      explanation: 'Hãy nhập số kèm đơn vị, ví dụ: 0.002V, 3.31V, 390V, 450mV, 120Ω hoặc OL.',
      suggestedAction: 'Nhập lại giá trị hiển thị trên đồng hồ vạn năng.',
    };
  }

  if (parsed.isOpenLoop) {
    if (step.measureMode === 'diode' || step.measureMode === 'resistance') {
      return {
        status: 'open_circuit',
        title: 'Hở mạch / Đứt đường mạch (OL)',
        explanation: 'Đồng hồ báo vô cực (OL) cho thấy mạch không có đường dẫn về mass hoặc đã đứt mạch/chết linh kiện nối tiếp.',
        suggestedAction: 'Kiểm tra cầu chì, điện trở mồi/cầu phân áp, mối hàn chân IC hoặc đứt mạch in (trace).',
        parsedValue: Infinity,
        parsedUnit: 'Ω',
      };
    }
  }

  const val = parsed.value;
  const expected = extractExpectedRange(step.expectedValue, step.measureMode);

  // Diode Mode checks
  if (step.measureMode === 'diode') {
    if (val <= 0.025) {
      return {
        status: 'short_gnd',
        title: 'CHẠM CHẬP GND NGHIÊM TRỌNG!',
        explanation: `Giá trị Diode Drop đo được (${val.toFixed(3)}V) gần bằng 0V — đường mạch hoặc linh kiện đang chạm thẳng xuống Mass (GND). Tuyệt đối KHÔNG cấp nguồn kích thử!`,
        suggestedAction: 'Dùng máy cấp dòng dò chập (Voltage Injection 1V giới hạn dòng) hoặc đo tách từng MOSFET/tụ gốm trên đường nguồn này.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    if (val >= 2.2) {
      return {
        status: 'open_circuit',
        title: 'Đứt mạch / Hở chân (Diode Drop quá cao)',
        explanation: `Đo được ${val.toFixed(3)}V vượt ngưỡng thông thường của mối nối bán dẫn (0.15V - 0.85V). Có thể bong chân BGA, hở mạch hoặc đứt trở gánh.`,
        suggestedAction: 'Soi kính lúp chân hàn, kiểm tra lại que đo đen/đỏ (que đỏ đặt Mass, que đen chấm điểm đo ở thang Diode).',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    if (expected && val >= expected.min && val <= expected.max) {
      return {
        status: 'pass',
        title: 'Nội trở Diode đạt chuẩn',
        explanation: `Giá trị ${val.toFixed(3)}V nằm trong dải chuẩn (${step.expectedValue}). Không có dấu hiệu chạm chập hay đứt đường.`,
        suggestedAction: 'Có thể chuyển sang bước kiểm tra tiếp theo.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    if (expected && val < expected.min) {
      return {
        status: 'low_voltage',
        title: 'Nội trở thấp bất thường (Nghi rò / bán chập)',
        explanation: `Đo được ${val.toFixed(3)}V thấp hơn ngưỡng chuẩn (${step.expectedValue}). Linh kiện trên đường này có thể bị rò (MOSFET, tụ lọc hoặc IC PCH/CPU).`,
        suggestedAction: 'Kiểm tra nhiệt độ vùng nghi ngờ hoặc cách ly tụ lọc / MOSFET để xác định thủ phạm.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    return {
      status: 'pass',
      title: 'Giá trị Diode hợp lệ (không chập)',
      explanation: `Đo được ${val.toFixed(3)}V — không bị chạm mass. Đối chiếu thêm với thông số chuẩn: ${step.expectedValue}.`,
      suggestedAction: 'Xác nhận lại cực tính que đo và chuyển bước tiếp theo nếu phù hợp.',
      parsedValue: val,
      parsedUnit: 'V',
    };
  }

  // Resistance Mode checks
  if (step.measureMode === 'resistance') {
    if (val <= 2.0 && (!expected || expected.min > 5)) {
      return {
        status: 'short_gnd',
        title: 'CHẠM CHẬP THẤP TRỞ (< 2Ω)!',
        explanation: `Trở kháng đo được chỉ ${val.toFixed(2)}Ω so với chuẩn (${step.expectedValue}). Đường mạch đang bị chập nặng.`,
        suggestedAction: 'Không cấp nguồn! Tách tải hoặc kiểm tra MOSFET/tụ lọc/IC trên đường này.',
        parsedValue: val,
        parsedUnit: 'Ω',
      };
    }
    if (expected && val >= expected.min && val <= expected.max) {
      return {
        status: 'pass',
        title: 'Trở kháng đạt chuẩn kỹ thuật',
        explanation: `Giá trị ${val}Ω nằm trong phạm vi cho phép (${step.expectedValue}).`,
        suggestedAction: 'Bấm "Đạt chuẩn (Pass)" để qua bước kế tiếp.',
        parsedValue: val,
        parsedUnit: 'Ω',
      };
    }
    if (expected && val < expected.min) {
      return {
        status: 'low_voltage',
        title: 'Trở kháng thấp hơn chuẩn',
        explanation: `Đo được ${val}Ω, thấp hơn mức chuẩn (${step.expectedValue}). Nghi ngờ rò tụ hoặc lỗi bán dẫn.`,
        suggestedAction: 'Bấm "Sai lệch / Chạm chập (Fail)" để xem chẩn đoán và hướng xử lý.',
        parsedValue: val,
        parsedUnit: 'Ω',
      };
    }
    return {
      status: 'open_circuit',
      title: 'Trở kháng cao hơn chuẩn (Nghi đứt mạch / tăng trị số)',
      explanation: `Đo được ${val}Ω vượt ngưỡng chuẩn (${step.expectedValue}). Có thể đứt điện trở cầu, đứt mạch hoặc hở mối hàn.`,
      suggestedAction: 'Kiểm tra lại điện trở hoặc bấm "Sai lệch (Fail)" để xem hướng dẫn xử lý.',
      parsedValue: val,
      parsedUnit: 'Ω',
    };
  }

  // Voltage / Oscilloscope Mode checks
  if (expected) {
    if (expected.nominal > 0.4 && val <= 0.08) {
      return {
        status: 'open_circuit',
        title: 'Mất điện áp hoàn toàn (≈ 0V)',
        explanation: `Đo được ${val.toFixed(3)}V trong khi chuẩn yêu cầu ${step.expectedValue}. Nguồn chưa được kích mở, mất lệnh Enable hoặc đang bị ngắt bảo vệ (SCP/OCP).`,
        suggestedAction: 'Kiểm tra lại điều kiện đầu vào (Vin, EN/VR_ON) hoặc đo nguội thang Diode xem đường này có chạm GND không.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    if (val >= expected.min && val <= expected.max) {
      return {
        status: 'pass',
        title: 'Điện áp đạt chuẩn!',
        explanation: `Đo được ${val.toFixed(2)}V nằm chính xác trong dải chuẩn (${step.expectedValue}).`,
        suggestedAction: 'Đánh dấu "Đạt chuẩn (Pass)" để tiếp tục sang bước kiểm tra kế tiếp.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    if (val < expected.min) {
      return {
        status: 'low_voltage',
        title: 'Sụt áp / Thiếu áp bất thường',
        explanation: `Đo được ${val.toFixed(2)}V, thấp hơn mức chuẩn (${step.expectedValue}). Ví dụ: nếu tụ lọc chính PSU chỉ đạt ~310V thay vì 385-395V nghĩa là mạch Active PFC chưa hoạt động; nếu 3.3V/5V bị kéo sụt có thể do khô tụ hoặc rò tải.`,
        suggestedAction: 'Bấm "Sai lệch / Chạm chập (Fail)" để xem khoanh vùng linh kiện nghi ngờ.',
        parsedValue: val,
        parsedUnit: 'V',
      };
    }
    return {
      status: 'over_voltage',
      title: 'Quá áp nguy hiểm (OVP)!',
      explanation: `Đo được ${val.toFixed(2)}V vượt quá giới hạn chuẩn (${step.expectedValue}). Nguy cơ nổ tụ hoặc chết tải phía sau (lỗi hồi tiếp TL431 / PC817 hoặc hỏng cầu chia áp).`,
      suggestedAction: 'Ngắt điện ngay! Kiểm tra Optocoupler, TL431 và mạch hồi tiếp FB trước khi thử lại.',
      parsedValue: val,
      parsedUnit: 'V',
    };
  }

  return {
    status: 'pass',
    title: 'Đã ghi nhận giá trị đo',
    explanation: `Giá trị nhập: ${rawInput}. Đối chiếu trực tiếp với yêu cầu chuẩn: ${step.expectedValue}.`,
    suggestedAction: 'Chọn Pass hoặc Fail dựa trên đối chiếu thực tế.',
    parsedValue: val,
    parsedUnit: 'V',
  };
}
