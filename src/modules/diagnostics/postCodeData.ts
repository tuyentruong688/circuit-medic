import type { DeviceCategory } from '../../types/circuit';

export interface PostCodeItem {
  code: string;
  label: string;
  category: DeviceCategory;
  severity: 'low' | 'medium' | 'high' | 'critical_hv';
  meaning: string;
  checkPoints: string[];
  suspectParts: string[];
  searchKeywords: string[];
}

export const POST_CODE_ITEMS: PostCodeItem[] = [
  {
    code: '00',
    label: 'POST 00',
    category: 'motherboard',
    severity: 'high',
    meaning: 'CPU chưa khởi chạy mã BIOS đầu tiên — thường do mất nguồn VCore (VCCIN_CORE), thiếu VR_ON, lỗi Socket CPU hoặc BIOS không đọc được.',
    checkPoints: ['Đo cuộn dây VRM CPU (0.8V–1.25V)', 'Kiểm tra chân VR_ON tại IC PWM', 'Kiểm tra xung PLTRST# (3.3V) & BIOS CS#'],
    suspectParts: ['PU101 / PU301 (PWM VRM)', 'PQ101 / PQ102 (MOSFET/DrMOS)', 'U_BIOS', 'CPU1 (Chân socket cong/bẩn)'],
    searchKeywords: ['00', 'vccin', 'vr_on', 'vrm', 'vddcr_cpu'],
  },
  {
    code: '55',
    label: 'POST 55',
    category: 'motherboard',
    severity: 'medium',
    meaning: 'Memory Not Installed / Lỗi khởi tạo RAM — Mainboard không nhận diện được thanh RAM hoặc mất một trong các nguồn nuôi RAM (VDDQ / VPP / VTT / PMIC DDR5).',
    checkPoints: ['Đo nguồn VDDQ khe RAM (1.1V DDR5 / 1.2V DDR4 / 1.5V DDR3)', 'Đo nguồn VTT_DDR (0.6V–0.75V) & VDDSPD (3.3V)', 'Kiểm tra xung SDA/SCL chân SMBus khe RAM'],
    suspectParts: ['PU_DDR (IC nguồn RAM)', 'DIMM_A2 / DIMM_1 (Oxy hóa khe RAM)', 'Tụ lọc VDDQ'],
    searchKeywords: ['55', 'ram', 'dram', 'vddq'],
  },
  {
    code: 'C1',
    label: 'POST C1',
    category: 'motherboard',
    severity: 'medium',
    meaning: 'Lỗi kiểm tra bộ nhớ cơ bản (Base Memory Detect) — Phổ biến trên dòng Gigabyte / ASRock H61-H81-B85 và DDR4/DDR5 khi sụt áp VTT/VREF hoặc lỗi mạch IMC trong CPU.',
    checkPoints: ['Đo áp tại tụ lọc chân nguồn DRAM', 'Kiểm tra chân DRAM_RESET# (1.2V/1.5V)', 'Kiểm tra chân socket CPU tiếp xúc kênh B'],
    suspectParts: ['DIMM_A2', 'PU_DDR', 'CPU1 (IMC)', 'U_BIOS'],
    searchKeywords: ['c1', '55', 'dram', 'ram'],
  },
  {
    code: 'D6',
    label: 'POST D6',
    category: 'motherboard',
    severity: 'medium',
    meaning: 'No Console Output Devices Found — Đã qua CPU & RAM nhưng lỗi xuất hình PCIe / VGA (chưa nhận GPU rời hoặc lỗi đường tín hiệu PCIe / BIOS UEFI GOP).',
    checkPoints: ['Đo nguồn 12V & 3.3V trên khe PCIe x16', 'Kiểm tra chân PCIE_RST# (3.3V) & cặp tụ coupling TX/RX', 'Thử Clear CMOS hoặc nạp lại BIOS'],
    suspectParts: ['PCIE_X16', 'U_BIOS', 'PCH1'],
    searchKeywords: ['d6', 'vga', 'pcie', 'xuất hình'],
  },
  {
    code: 'CPU LED',
    label: 'CPU LED',
    category: 'motherboard',
    severity: 'high',
    meaning: 'Đèn EZ Debug CPU sáng đỏ cố định — Hệ thống treo ở khâu cấp nguồn/xác thực CPU (mất 12V EPS 8-pin, chập pha VRM, mất VR_ON hoặc lỗi BIOS chưa hỗ trợ CPU).',
    checkPoints: ['Đo áp đầu nối 8-pin EPS_12V (12.0V)', 'Đo Diode Drop cuộn cảm VRM xem có chập mass không', 'Kiểm tra áp VCCIN_CORE & VRM_PG'],
    suspectParts: ['JEPS8', 'PQ101', 'PU101', 'U_BIOS'],
    searchKeywords: ['cpu', 'vrm', '00', 'vccin', '12v'],
  },
  {
    code: 'DRAM LED',
    label: 'DRAM LED',
    category: 'motherboard',
    severity: 'medium',
    meaning: 'Đèn DRAM sáng vàng/cam — Quá trình training RAM thất bại do thiếu áp VDDQ/VTT, lỗi PMIC trên thanh DDR5 hoặc dơ chân khe DIMM.',
    checkPoints: ['Đo nguồn chính khe RAM (1.1V / 1.2V)', 'Đo áp VPP (1.8V / 2.5V)', 'Vệ sinh khe RAM & kiểm tra điện trở băng chân SPD'],
    suspectParts: ['DIMM_A2', 'PU_DDR', 'U_SIO'],
    searchKeywords: ['dram', 'ram', '55', 'c1', 'vddq'],
  },
  {
    code: 'VGA LED',
    label: 'VGA LED',
    category: 'motherboard',
    severity: 'medium',
    meaning: 'Đèn VGA sáng trắng — Lỗi giao tiếp khe PCIe x16 hoặc GPU không phản hồi (mất áp 3.3V_AUX / 12V khe PCIe, đứt tụ coupling Gen4/Gen5 hoặc lỗi xuất hình).',
    checkPoints: ['Đo 12V (chân B1-B3) & 3.3V (chân A9-A10) khe PCIe x16', 'Kiểm tra tụ gốm đường dữ liệu PCIe gần khe', 'Đo tín hiệu PERST# (3.3V)'],
    suspectParts: ['PCIE_X16', 'PCH1', 'U_BIOS'],
    searchKeywords: ['vga', 'd6', 'pcie', 'xuất hình'],
  },
  {
    code: 'BOOT LED',
    label: 'BOOT LED',
    category: 'motherboard',
    severity: 'low',
    meaning: 'Đèn BOOT sáng xanh lá — Mainboard đã POST thành công (CPU/RAM/VGA OK) nhưng chưa tìm thấy ổ cứng chứa hệ điều hành hoặc lỗi cấu hình BIOS/NVMe.',
    checkPoints: ['Kiểm tra nguồn 3.3V cấp cho khe M.2 NVMe', 'Kiểm tra xung nhịp & giao tiếp SATA/PCH', 'Kiểm tra thiết lập CSM / UEFI trong BIOS'],
    suspectParts: ['U_BIOS', 'PCH1'],
    searchKeywords: ['bios', 'boot', 'pltrst'],
  },
  {
    code: 'PS_ON# Dead',
    label: 'PS_ON# Dead',
    category: 'psu',
    severity: 'critical_hv',
    meaning: 'Nối dây xanh lá (PS_ON#) xuống GND nhưng nguồn PSU không chạy hoặc nhích quạt rồi ngắt — do mất 5VSB, lỗi Active PFC 390V, chết IC Supervisor hoặc chập thứ cấp.',
    checkPoints: ['Đo dây tím +5VSB (phải đủ 5.0V ổn định khi tải)', 'Đo điện áp dây xanh lá PS_ON# khi hở (2.5V–5.0V)', 'Đo tụ lọc chính C_BULK1 (phải đạt 310V standby / 385-395V khi chạy PFC) — CẨN THẬN CAO ÁP!'],
    suspectParts: ['U_5VSB', 'C_5VSB_OUT', 'Q_PFC1', 'U_SUP', 'Q_SR12V'],
    searchKeywords: ['ps_on', '5vsb', 'nhích', 'pfc', '390v', 'cầu chì'],
  },
  {
    code: 'PG=0V',
    label: 'PG=0V',
    category: 'psu',
    severity: 'high',
    meaning: 'Nguồn có đủ +12V, +5V, +3.3V nhưng dây xám PWR_OK (Power Good) = 0V — khiến Mainboard quay quạt tít nhưng không bao giờ POST/xuất hình!',
    checkPoints: ['Đo dây xám chân 8 ATX 24-pin (chuẩn 3.3V–5.0V sau 100-500ms)', 'Kiểm tra chân PGI / UVP / OVP trên IC Supervisor (WT7527 / PS223 / LM339)', 'Kiểm tra tụ lọc ngõ ra 3.3V/5V/12V xem có gợn sóng ripple cao không'],
    suspectParts: ['U_SUP', 'U_OPT1', 'MOD_DCDC', 'C_OUT_12V'],
    searchKeywords: ['pwr_ok', 'pg', 'power good', 'dây xám'],
  },
  {
    code: 'BLDC Nháy Lỗi',
    label: 'Coway: Nháy đèn tốc độ',
    category: 'appliance',
    severity: 'critical_hv',
    meaning: 'Quạt BLDC Coway không quay hoặc nhích 1-2 giây rồi nháy toàn bộ hàng LED tốc độ — thường do mất +15V_DRV, thiếu lệnh VSP, mất xung Hall FG hoặc hỏng công tắc từ SW_DOOR / IC trong quạt 310VDC.',
    checkPoints: [
      'Đo công tắc từ cửa trước SW_DOOR khi đóng nắp (phải về 0V)',
      'Đo đủ 310VDC (Pin 1) & +15VDC (Pin 4) tại giắc quạt CN_MOTOR',
      'Kiểm tra áp VSP 1.8–5.5V (Pin 5) & xung hồi tiếp Hall FG ~2.5V (Pin 6)',
    ],
    suspectParts: ['CN_MOTOR', 'SW_DOOR', 'U_SMPS1', 'C_HV310'],
    searchKeywords: ['bldc', 'fg', 'vsp', 'cn_motor', 'sw_door', 'nháy đèn', 'quạt'],
  },
  {
    code: 'AQI Đỏ Mãi',
    label: 'Coway: AQI đỏ / Auto hú',
    category: 'appliance',
    severity: 'medium',
    meaning: 'Vòng đèn chất lượng không khí AQI treo Đỏ/Tím liên tục dù phòng sạch, quạt Auto luôn gầm rú mức cao nhất — do bụi bám bít thấu kính cảm biến quang CN_DUST hoặc sai áp VOUT_ADC.',
    checkPoints: [
      'Đo nguồn +5V_MCU tại Pin 1 giắc cảm biến bụi CN_DUST',
      'Đo áp tín hiệu VOUT_ADC tại Pin 3 ở phòng sạch (chuẩn 0.45V–0.95V; >2.4V là báo bẩn)',
    ],
    suspectParts: ['CN_DUST', 'U_MCU_AIR'],
    searchKeywords: ['aqi', 'cảm biến bụi', 'cn_dust', 'auto'],
  },
  {
    code: 'Hot/Cold Blink',
    label: 'Coway: Nháy LED Nóng/Lạnh',
    category: 'appliance',
    severity: 'high',
    meaning: 'Máy lọc nước Coway CHP nháy đèn Nóng hoặc Lạnh (hoặc đông đá bầu lạnh / nước không nóng) — do hỏng cảm biến nhiệt NTC 10kΩ, nhảy rơ-le Bimetal bầu nóng hoặc cháy/dính tiếp điểm Relay RLY_HEATER / RLY_COMP.',
    checkPoints: [
      'Đo nguội NTC 10kΩ @ 25°C (ngâm nước đá 0°C phải lên ~28–33kΩ)',
      'Kiểm tra thông mạch thanh nhiệt & nút Reset rơ-le Bimetal bầu nóng (~85–160Ω)',
      'Đo tiếp điểm COM-NO Relay RLY_COMP & RLY_HEATER xem có dính 0Ω hay cháy hở không',
    ],
    suspectParts: ['CN_NTC_HOT', 'CN_NTC_COLD', 'RLY_HEATER', 'RLY_COMP'],
    searchKeywords: ['ntc', 'bầu nóng', 'bầu lạnh', 'đông đá', 'bimetal', 'rly_heater', 'rly_comp'],
  },
];
