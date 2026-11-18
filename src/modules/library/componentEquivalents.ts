import type { ComponentKind } from '../../types/circuit';

export interface EquivalentEntry {
  keywords: string[];
  kind?: ComponentKind;
  equivalents: string[];
  solderingTip: string;
}

export const COMPONENT_EQUIVALENTS_DB: EquivalentEntry[] = [
  {
    keywords: ['sic654', 'fdmf5062', 'fdmf3170', 'ncp302155', 'aoz5311', 'drmos', 'isl99360'],
    kind: 'drmos',
    equivalents: ['SiC654A', 'FDMF5062', 'NCP302155 (kiểm tra pinout EN/PWM)', 'AOZ5311NQI'],
    solderingTip:
      'Gia nhiệt đều bằng máy khò 360–380°C kết hợp gia nhiệt đáy (preheater ~120°C). Bụng Thermal Pad rất lớn — dùng mỡ hàn tốt, ấn nhẹ khi thiếc chảy để tự cân bằng (self-align), tránh chạm 12V sang SW.',
  },
  {
    keywords: ['rt3628', 'ncp81530', 'xdpe152', 'isl69269', 'raa229131', 'asp2100', 'pwm'],
    kind: 'pwm_ic',
    equivalents: ['Thay đúng mã gốc theo hãng (PWM số có firmware riêng)'],
    solderingTip:
      'IC QFN chân ẩn rất nhỏ: khò 340°C gió nhẹ để không thổi bay trở 0402 xung quanh. Đọc kỹ chân VR_ON, VCC_5V và I2C/SVID trước khi kết luận chết IC.',
  },
  {
    keywords: ['4c10n', '4c06n', 'sm4377', 'sm4364', 'aon6508', 'aon6414', 'mdu1514', 'mosfet'],
    kind: 'mosfet',
    equivalents: ['NTMFS4C10N / 4C06N (30V 46A-69A)', 'SM4377NSKP / SM4364', 'AON6508 / AON6414AL'],
    solderingTip:
      'Thay cặp High-side / Low-side đồng bộ trên cùng pha VRM. Lưu ý thông số Rds(on) và Qg tương đương; luôn đo nguội cực G-S-D không chạm trước khi đóng điện.',
  },
  {
    keywords: ['it8688', 'it8689', 'nct6798', 'nct6797', 'it8728', 'super i/o', 'sio'],
    kind: 'super_io',
    equivalents: ['IT8688E (đúng rev CX/DX)', 'NCT6798D (kiểm tra đúng rev)', 'IT8728F (đời H61/H81)'],
    solderingTip:
      'LQFP 128 chân: bọc băng keo nhiệt Kapton quanh khe PCIe/RAM gần đó. Dùng thiếc chì 63/37 kéo vuốt chân (drag soldering) kèm flux lỏng, sau đó soi kính hiển vi từng chân tránh bắc cầu.',
  },
  {
    keywords: ['w25q128', 'w25q256', 'mx25l128', 'mx25u256', 'gd25b', 'bios'],
    kind: 'bios_chip',
    equivalents: ['W25Q128JVSIQ (3.3V)', 'MX25L12873F (3.3V)', 'W25Q256JVEQ (3.3V) — Chú ý loại 1.8V (W25Q128FW / MX25U)!'],
    solderingTip:
      'QUAN TRỌNG: Kiểm tra điện áp nuôi chip BIOS (3.3V hay 1.8V) trước khi kẹp máy nạp CH341A/RT809F! Nhớ backup file gốc để giữ MAC LAN, Serial và vùng ME Region.',
  },
  {
    keywords: ['ipp60r190', '20n60', 'k20a60', 'stf24n60', 'ipa60r190', 'pfc'],
    kind: 'mosfet',
    equivalents: ['IPP60R190P6 / IPA60R190C6', '20N60C3 / SPW20N60C3', 'TK20A60U / FCPF20N60'],
    solderingTip:
      'MOSFET cao áp PFC (600V–650V): luôn kiểm tra cả diode boost (STTH8S06 / BYV29) và điện trở shunt/gate drive (10Ω–22Ω) bị đứt ngầm khi MOSFET nổ. Test lại qua bóng đèn sợi đốt 100W nối tiếp!',
  },
  {
    keywords: ['mje13007', 'mje13009', '2sc2625', '13007', '13009'],
    kind: 'mosfet',
    equivalents: ['MJE13009 (nâng cấp dòng tốt hơn 13007)', '2SC2625 / 2SC3320', 'E13009L'],
    solderingTip:
      'Sò BJT nguồn TL494 chạy cặp đẩy kéo: thay cả 2 con cùng lô/hệ số khuếch đại hFE tương đồng. Kiểm tra luôn cặp tụ 1µF/50V và diode 1N4148 ở mạch kích cực B qua biến áp driver T_DRIVE.',
  },
  {
    keywords: ['tny278', 'tny280', 'em8569', 'viper22', 'str-a6069', '5vsb'],
    kind: 'pwm_ic',
    equivalents: ['TNY278PN / TNY279PN / TNY280PN (tăng công suất dự phòng)', 'EM8569C (chú ý sơ đồ chân trước khi thay)'],
    solderingTip:
      'IC nguồn cấp trước 5VSB: khi nổ IC thường kéo theo đứt điện trở cầu chì 2.2Ω–10Ω đầu vào và chập diode Zener bảo vệ chân BP/VCC. Kiểm tra tụ lọc 5VSB (1000µF/10V) xem có khô/phù không.',
  },
  {
    keywords: ['pc817', 'el817', 'ltv817', 'opto'],
    kind: 'optocoupler',
    equivalents: ['PC817C / EL817C / LTV-817C', 'PS2561'],
    solderingTip:
      'Cách ly sơ cấp – thứ cấp: lắp đúng chiều chấm chân 1 (Anode LED nằm phía thứ cấp nối TL431). Nếu quang bị rò hoặc giảm CTR sẽ gây vọt áp hoặc mất kích nguồn.',
  },
  {
    keywords: ['tl431', 'az431', 'ka431'],
    kind: 'tl431',
    equivalents: ['TL431ACLPR', 'AZ431AZ-ATRE1', 'KA431AZ'],
    solderingTip:
      'Chú ý thứ tự chân (TO-92: Ref-Anode-Cathode hoặc SOT-23 tùy mã)! Điện áp chuẩn chân Ref luôn xấp xỉ 2.495V khi mạch hồi tiếp hoạt động bình thường.',
  },
  {
    keywords: ['wt7527', 'ps223', 'sitronic', 'st9s313', 'supervisor', 'tl494', 'ka7500'],
    kind: 'ic',
    equivalents: ['TL494CN ↔ KA7500B (tương đương trực tiếp)', 'WT7527 ↔ PS223 (kiểm tra bảng chân trước khi độ)'],
    solderingTip:
      'Dùng mỏ hàn 60W + dây hút thiếc (wick) làm sạch lỗ xuyên (through-hole) nhẹ nhàng tránh bong pad mạch in trên bo PSU một lớp/hai lớp.',
  },
  {
    keywords: ['gbu808', 'gbu1006', 'gbj1508', 'kbu808', 'bridge'],
    kind: 'bridge_rectifier',
    equivalents: ['GBU808 (8A 800V)', 'GBJ1508 (15A 800V - chịu dòng cao hơn)', 'GBJ2510'],
    solderingTip:
      'Bôi keo tản nhiệt vào lưng cầu diode khi bắt lại vào tản nhôm. Đo kiểm 4 diode bên trong (chân ~ AC và + / -) không được thông 2 chiều.',
  },
];

export function findEquivalentsForComponent(
  partNumber?: string,
  label?: string,
  kind?: ComponentKind
): EquivalentEntry | undefined {
  const haystack = `${partNumber ?? ''} ${label ?? ''}`.toLowerCase();
  const byKeyword = COMPONENT_EQUIVALENTS_DB.find((entry) =>
    entry.keywords.some((kw) => haystack.includes(kw))
  );
  if (byKeyword) return byKeyword;

  if (kind) {
    return COMPONENT_EQUIVALENTS_DB.find((entry) => entry.kind === kind);
  }
  return undefined;
}

export function getKindLabelVi(kind: ComponentKind): string {
  const map: Record<ComponentKind, string> = {
    cpu_socket: 'Socket CPU',
    chipset: 'Chipset PCH',
    mosfet: 'MOSFET Công Suất',
    drmos: 'DrMOS Integrated',
    pwm_ic: 'IC PWM Điều Khiển',
    inductor: 'Cuộn Cảm / Choke',
    capacitor_solid: 'Tụ Rắn Polymer',
    capacitor_elec: 'Tụ Hóa Cao/Thấp Áp',
    resistor: 'Điện Trở / Shunt',
    diode: 'Diode Xung / Schottky',
    fuse: 'Cầu Chì Bảo Vệ',
    bios_chip: 'Chip BIOS SPI',
    super_io: 'IC Super I/O',
    ram_slot: 'Khe RAM DIMM',
    pcie_slot: 'Khe PCIe',
    atx_24pin: 'Cổng ATX 24-Pin',
    eps_8pin: 'Cổng CPU 8-Pin EPS',
    transformer: 'Biến Áp Xung',
    optocoupler: 'Quang Trở (Optocoupler)',
    tl431: 'IC Ổn Áp Mẫu TL431',
    bridge_rectifier: 'Cầu Diode Chỉnh Lưu',
    heatsink: 'Tản Nhiệt Nhôm',
    connector: 'Đầu Kết Nối / Cổng',
    ic: 'IC Chức Năng / Supervisor',
  };
  return map[kind] ?? kind;
}
