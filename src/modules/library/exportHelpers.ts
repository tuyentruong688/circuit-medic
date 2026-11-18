import type { FaultCase, HardwareBoard, PowerSequenceSpec } from '../../types/circuit';

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBoardAsJson(
  board: HardwareBoard,
  relatedFaults: FaultCase[],
  sequence?: PowerSequenceSpec
): void {
  const payload = {
    exportedBy: 'CircuitMedic Engineering Studio',
    exportedAt: new Date().toISOString(),
    board,
    powerSequence: sequence ?? null,
    relatedFaults,
  };
  triggerDownload(
    `circuitmedic-${board.id}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
}

export function exportBoardAsMarkdown(
  board: HardwareBoard,
  relatedFaults: FaultCase[],
  sequence?: PowerSequenceSpec
): void {
  const lines: string[] = [];

  lines.push(`# PHIẾU KỸ THUẬT & SƠ ĐỒ SỬA CHỮA: ${board.name}`);
  lines.push('');
  lines.push(`- **Hãng:** ${board.brand}`);
  lines.push(
    `- **Phân loại:** ${board.category === 'motherboard' ? 'Mainboard Máy Tính PC' : 'Nguồn Máy Tính ATX (PSU)'}`
  );
  lines.push(`- **Thế hệ / Kiến trúc:** ${board.generation}`);
  lines.push(`- **Form Factor:** ${board.formFactor}`);
  lines.push(`- **Tóm tắt:** ${board.summary}`);
  if (board.safetyWarning) {
    lines.push(`- **CẢNH BÁO AN TOÀN:** ${board.safetyWarning}`);
  }
  lines.push('');

  lines.push('## 1. Hệ Thống Đường Nguồn & Tín Hiệu (Power Rails)');
  lines.push('| Mã Net | Tên Đường Nguồn | Điện Áp Chuẩn | Nhóm | Mô Tả |');
  lines.push('|---|---|---|---|---|');
  for (const rail of board.rails) {
    lines.push(
      `| \`${rail.id}\` | ${rail.name} | **${rail.nominalVoltage}** | ${rail.category} | ${rail.description} |`
    );
  }
  lines.push('');

  lines.push('## 2. Danh Sách Linh Kiện & Thông Số Đo Chân (Pinout Reference)');
  for (const comp of board.components) {
    lines.push(`### ${comp.id} — ${comp.label} ${comp.partNumber ? `(${comp.partNumber})` : ''}`);
    lines.push(`- **Loại:** ${comp.kind} | **Khu vực:** ${comp.zone}`);
    if (comp.specs) lines.push(`- **Thông số:** ${comp.specs}`);
    lines.push(`- **Mô tả:** ${comp.description}`);
    if (comp.pins.length > 0) {
      lines.push('');
      lines.push('| Chân | Tên | Net | Áp Chuẩn | Diode Drop | Trở Kháng / Xung |');
      lines.push('|---|---|---|---|---|---|');
      for (const pin of comp.pins) {
        lines.push(
          `| ${pin.pin} | ${pin.name} | \`${pin.net}\` | ${pin.expectedVoltage} | ${pin.expectedDiodeDrop} | ${pin.expectedResistance ?? pin.waveformHint ?? '-'} |`
        );
      }
    }
    if (comp.commonFailureModes.length > 0) {
      lines.push(`- **Lỗi hay gặp:** ${comp.commonFailureModes.join('; ')}`);
    }
    if (comp.replacementTips) {
      lines.push(`- **Lưu ý thay thế:** ${comp.replacementTips}`);
    }
    lines.push('');
  }

  if (sequence) {
    lines.push(`## 3. Chuỗi Kích Nguồn (Power Sequence): ${sequence.title}`);
    lines.push('| STT | Tín Hiệu | Nguồn Phát | Đích | Điện Áp | Độ Trễ | Triệu Chứng Khi Mất |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const st of sequence.stages) {
      lines.push(
        `| ${st.order} | \`${st.signalName}\` | ${st.source} | ${st.destination} | ${st.voltage} | ${st.delayMs} | ${st.failureSymptom} |`
      );
    }
    lines.push('');
  }

  if (relatedFaults.length > 0) {
    lines.push('## 4. Pan-Bệnh Đặc Trưng Liên Quan');
    for (const fault of relatedFaults) {
      lines.push(`### [${fault.severity.toUpperCase()}] ${fault.title}`);
      lines.push(`- **Triệu chứng:** ${fault.symptom}`);
      lines.push(`- **Xử lý nhanh:** ${fault.quickFixSummary}`);
      lines.push(`- **Đường nguồn ảnh hưởng:** ${fault.affectedRails.join(', ')}`);
      lines.push(`- **Linh kiện nghi ngờ:** ${fault.suspectComponentIds.join(', ')}`);
      lines.push('');
    }
  }

  triggerDownload(
    `phieu-sua-chua-${board.id}.md`,
    lines.join('\n'),
    'text/markdown;charset=utf-8'
  );
}
