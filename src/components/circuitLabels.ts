import { ComponentKind, FaultCase, PowerRailNet, ViewMode } from '../types/circuit';

export const COMPONENT_KIND_LABELS: Record<ComponentKind, string> = {
  cpu_socket: 'Socket CPU',
  chipset: 'Chipset PCH',
  mosfet: 'MOSFET Công Suất',
  drmos: 'DrMOS Power Stage',
  pwm_ic: 'IC Điều Khiển PWM',
  inductor: 'Cuộn Cảm / Choke',
  capacitor_solid: 'Tụ Rắn Polymer',
  capacitor_elec: 'Tụ Hóa Lọc Nguồn',
  resistor: 'Điện Trở / Shunt',
  diode: 'Diode / Schottky',
  fuse: 'Cầu Chì Bảo Vệ',
  bios_chip: 'Chip BIOS / SPI Flash',
  super_io: 'IC Super I/O (SIO)',
  ram_slot: 'Khe RAM DIMM',
  pcie_slot: 'Khe PCIe x16',
  atx_24pin: 'Cổng Nguồn ATX 24-Pin',
  eps_8pin: 'Cổng Nguồn CPU 8-Pin',
  transformer: 'Biến Áp Xung',
  optocoupler: 'Opto Cách Ly Quang',
  tl431: 'IC Ổn Áp Tham Chiếu TL431',
  bridge_rectifier: 'Cầu Diode Chỉnh Lưu',
  heatsink: 'Tản Nhiệt Nhôm',
  connector: 'Đầu Kết Nối / Header',
  ic: 'IC Tích Hợp',
};

export const RAIL_CATEGORY_LABELS: Record<PowerRailNet['category'], string> = {
  standby: 'Nguồn Chờ (Standby)',
  main_power: 'Nguồn Chính (Main)',
  core_power: 'Nguồn Lõi (Core VRM)',
  control_signal: 'Tín Hiệu Điều Khiển',
  ground: 'Mass (GND)',
  high_voltage: 'Cao Áp Sơ Cấp (HV)',
};

export const SEVERITY_META: Record<
  FaultCase['severity'],
  { label: string; badgeClass: string; dotClass: string }
> = {
  low: {
    label: 'Nhẹ',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  medium: {
    label: 'Trung Bình',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  high: {
    label: 'Nghiêm Trọng',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotClass: 'bg-orange-400',
  },
  critical_hv: {
    label: 'Nguy Hiểm Cao Áp',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    dotClass: 'bg-rose-500',
  },
};

export const VIEW_MODE_META: Record<
  ViewMode,
  { label: string; shortLabel: string; description: string; shortcut: string }
> = {
  dashboard: {
    label: 'Tổng Quan Phòng Lab',
    shortLabel: 'Tổng Quan',
    description: 'Trung tâm điều khiển, thống kê bo mạch và truy cập nhanh pan bệnh',
    shortcut: '1',
  },
  workbench: {
    label: 'Workbench Song Song',
    shortLabel: 'Workbench',
    description: 'Chia đôi màn hình: Sơ đồ nguyên lý đồng bộ trực tiếp với 3D / BoardView',
    shortcut: '2',
  },
  scanner: {
    label: 'Quét Bo Mạch (Camera/Ảnh)',
    shortLabel: 'Quét Mạch',
    description: 'Chụp ảnh hoặc tải ảnh bo mạch thật để đối chiếu vùng linh kiện',
    shortcut: '3',
  },
  schematic: {
    label: 'Sơ Đồ Nguyên Lý',
    shortLabel: 'Schematic',
    description: 'Sơ đồ khối & dây dẫn nguồn tương tác, dò rail và chân IC',
    shortcut: '4',
  },
  viewer3d: {
    label: 'Mô Phỏng 3D & Nhiệt IR',
    shortLabel: '3D & Nhiệt',
    description: 'Dựng hình PCB 3D 60fps, dòng điện chạy mạch và camera nhiệt FLIR',
    shortcut: '5',
  },
  boardview: {
    label: 'Ảnh Chụp & BoardView',
    shortLabel: 'BoardView',
    description: 'Bản đồ linh kiện 2D top-down kèm giá trị đo nguội & điểm đo chuẩn',
    shortcut: '6',
  },
  diagnostics: {
    label: 'Chẩn Đoán Pan Bệnh',
    shortLabel: 'Chẩn Đoán',
    description: 'Quy trình khoanh vùng lỗi từng bước theo triệu chứng thực tế',
    shortcut: '7',
  },
  library: {
    label: 'Thư Viện & Chuỗi Nguồn',
    shortLabel: 'Thư Viện',
    description: 'Tra cứu linh kiện, datasheet chân đo và chuỗi kích nguồn Intel/AMD/PSU',
    shortcut: '8',
  },
};
