import type { HardwareBoard } from '../../types/circuit';

export const DESKTOP_MOTHERBOARDS: HardwareBoard[] = [
  // =========================================================================
  // 1. ASUS ROG STRIX B760-F GAMING WIFI (Intel LGA1700, ATX, DDR5)
  // =========================================================================
  {
    id: 'asus-rog-b760f',
    name: 'ASUS ROG Strix B760-F Gaming WiFi',
    brand: 'ASUS',
    category: 'motherboard',
    generation: 'Intel LGA1700 (12th/13th/14th Gen Raptor Lake-S)',
    formFactor: 'ATX (305mm x 244mm)',
    pcbColor: '#121316',
    pcbSize: { width: 100, depth: 82, thickness: 2 },
    powerSequenceId: 'seq-intel-lga1700',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (RAA229131 / ISL99390 / NCT6798D)',
      missingDataNote:
        'ASUS bảo mật Schematic (.pdf) & BoardView (.fz/.asc) gốc theo NDA. Ứng dụng chưa có ảnh chụp trần bản quyền mở cho model này nên phần Ảnh Thực Tế được để trống; Sơ đồ nguyên lý chỉ biểu diễn luồng nguồn tham chiếu theo datasheet các IC chính.',
    },
    summary: 'Bo mạch chủ gaming cao cấp socket LGA1700, thiết kế dàn VRM 16+1 phase DrMOS 90A ISL99390, quản lý bởi controller RAA229131, hỗ trợ DDR5 kênh đôi và PCIe 5.0 x16. Mạch bảo vệ ESD và chuỗi khởi động chuẩn Intel 700 Series PCH.',
    safetyWarning: 'LƯU Ý: Vcore cấp nguồn dòng điện cực lớn lên tới 100A+ ở điện áp thấp (~1.1V). Khi đo đạc khu vực DrMOS và tụ lọc VCORE, tuyệt đối không chạm trượt que đo giữa chân Phase (SW) và chân Vin 12V gây phóng tia lửa điện phá hủy CPU socket!',
    zones: [
      {
        id: 'zone-vrm-vcore',
        name: 'Khu vực Nguồn CPU VRM (Core / GT / VCCIN)',
        description: 'Dàn cấp nguồn 16+1 pha DrMOS, cuộn cảm hợp kim MicroFine và tụ lọc rắn Black Metallic 560uF 6.3V',
        color: '#dc2626',
        bounds2d: { x: 8, y: 10, w: 26, h: 32 }
      },
      {
        id: 'zone-cpu-socket',
        name: 'Socket CPU LGA1700',
        description: 'Đế socket 1700 chân tiếp xúc mạ vàng với các chân tín hiệu DMI, PCIe, DDR5 và cấp nguồn Core/VTT',
        color: '#2563eb',
        bounds2d: { x: 36, y: 12, w: 26, h: 30 }
      },
      {
        id: 'zone-ram-bank',
        name: 'Khe Cắm RAM DDR5 (DIMM A/B)',
        description: '4 khe DDR5 kênh đôi, khu vực IC quản lý nguồn DDR5 PMIC và lọc nguồn VDD/VDDQ 1.1V - 1.4V',
        color: '#16a34a',
        bounds2d: { x: 66, y: 10, w: 26, h: 34 }
      },
      {
        id: 'zone-pch-south',
        name: 'Chipset Intel B760 PCH & Khối RTC',
        description: 'Chip cầu nam Intel B760, thạch anh 32.768kHz, mạch RTC 3V và IC SPI Flash BIOS Winbond 256Mb',
        color: '#9333ea',
        bounds2d: { x: 64, y: 56, w: 28, h: 32 }
      },
      {
        id: 'zone-pcie-slots',
        name: 'Khe Mở Rộng PCIe 5.0 x16 & Khe M.2 NVMe',
        description: 'Khe cắm bọc giáp SafeSlot dẫn thẳng từ CPU, các đường tín hiệu PCIe vi sai 100MHz và nguồn 3.3V/12V',
        color: '#0891b2',
        bounds2d: { x: 12, y: 50, w: 46, h: 42 }
      },
      {
        id: 'zone-io-sio',
        name: 'Khu vực Super I/O & Cổng Giao Tiếp Sau (Rear I/O)',
        description: 'IC Super I/O Nuvoton NCT6798D giám sát nhiệt độ/quạt/PS_ON, khối âm thanh SupremeFX và bảo vệ ESD',
        color: '#ea580c',
        bounds2d: { x: 4, y: 44, w: 16, h: 46 }
      }
    ],
    rails: [
      {
        id: 'rail-12v-eps',
        name: '12V_EPS',
        nominalVoltage: '+12.0V',
        category: 'main_power',
        color: '#ef4444',
        description: 'Nguồn 12V chính từ cổng nguồn EPS 8-pin dẫn đến cực D (VIN) của các DrMOS cấp nguồn CPU',
        connectedComponents: ['JEPS8', 'PQ101', 'PQ102', 'PU101']
      },
      {
        id: 'rail-5vsb',
        name: '+5VSB',
        nominalVoltage: '+5.0V',
        category: 'standby',
        color: '#8b5cf6',
        description: 'Nguồn cấp trước 5V duy trì từ bộ nguồn ATX, nuôi khối chuyển đổi 3.3VSB và cổng USB Standby',
        connectedComponents: ['JATX24', 'PU_3V5V', 'U_SIO']
      },
      {
        id: 'rail-3valw',
        name: '+3VALW',
        nominalVoltage: '+3.3V',
        category: 'standby',
        color: '#06b6d4',
        description: 'Điện áp 3.3V Standby hạ từ 5VSB qua IC RT6575 nuôi Super I/O, Flash ROM và khối RTC PCH',
        connectedComponents: ['PU_3V5V', 'U_SIO', 'U_BIOS', 'PCH1']
      },
      {
        id: 'rail-vccin-core',
        name: 'VCCIN_CORE',
        nominalVoltage: '+1.15V',
        category: 'core_power',
        color: '#10b981',
        description: 'Đường nguồn chính cấp cho nhân P-Core / E-Core của CPU LGA1700 sau các cuộn choke PL101/PL102',
        connectedComponents: ['PL101', 'PC101', 'CPU1']
      },
      {
        id: 'rail-vddq-ddr5',
        name: 'VDDQ_DDR5',
        nominalVoltage: '+1.10V',
        category: 'main_power',
        color: '#3b82f6',
        description: 'Điện áp bus dữ liệu bộ nhớ DDR5 cấp tới các chân socket DIMM và CPU IMC',
        connectedComponents: ['DIMM_A2', 'CPU1']
      },
      {
        id: 'rail-vcc1p8',
        name: 'VCC1P8_PROC',
        nominalVoltage: '+1.80V',
        category: 'main_power',
        color: '#f59e0b',
        description: 'Nguồn 1.8V PLL và phụ trợ cấp cho CPU và khối DMI của PCH B760',
        connectedComponents: ['CPU1', 'PCH1']
      },
      {
        id: 'rail-rsmrst',
        name: 'RSMRST#',
        nominalVoltage: '+3.3V',
        category: 'control_signal',
        color: '#ec4899',
        description: 'Tín hiệu Resume Reset giải phóng PCH chuẩn bị cho quá trình kích nguồn chính',
        connectedComponents: ['U_SIO', 'PCH1']
      },
      {
        id: 'rail-slp-s3',
        name: 'SLP_S3#',
        nominalVoltage: '+3.3V',
        category: 'control_signal',
        color: '#6366f1',
        description: 'Tín hiệu lệnh thoát trạng thái nghỉ S3 phát từ PCH đến SIO để kéo chân PS_ON# xuống đất',
        connectedComponents: ['PCH1', 'U_SIO']
      },
      {
        id: 'rail-pltrst',
        name: 'PLTRST#',
        nominalVoltage: '+3.3V',
        category: 'control_signal',
        color: '#14b8a6',
        description: 'Tín hiệu Platform Reset từ PCH gửi tới toàn bộ bo mạch (CPU, PCIe, SIO) giải phóng reset hệ thống',
        connectedComponents: ['PCH1', 'CPU1', 'PCIE_X16', 'U_SIO']
      },
      {
        id: 'rail-gnd',
        name: 'GND',
        nominalVoltage: '0V',
        category: 'ground',
        color: '#475569',
        description: 'Mặt phẳng mass chung toàn bo mạch (Common Ground Return Plane)',
        connectedComponents: ['JATX24', 'JEPS8', 'CPU1', 'PCH1', 'U_SIO', 'PC101', 'ESD_USB1']
      }
    ],
    components: [
      {
        id: 'CPU1',
        label: 'CPU1',
        kind: 'cpu_socket',
        zone: 'zone-cpu-socket',
        description: 'Socket CPU LGA1700 (1700 chân Land Grid Array) hỗ trợ vi xử lý Intel Core i3/i5/i7/i9 thế hệ 12, 13 và 14.',
        partNumber: 'LOTES-LGA1700-REV3',
        specs: '1700 pins, VCORE ~0.7V-1.35V, TDP 125W-253W',
        pos3d: { x: 0, y: 0, z: -10, w: 20, d: 24, h: 4, color: '#475569' },
        pos2d: { x: 38, y: 14, w: 22, h: 26 },
        schematicPos: { x: 620, y: 220 },
        pins: [
          { pin: 'VCORE_IN', name: 'VCORE_SENSE', net: 'rail-vccin-core', expectedVoltage: '1.15V', expectedDiodeDrop: '0.008V - 0.015V', expectedResistance: '0.8 - 2.5 Ohm', waveformHint: 'Nhiễu DC Ripple < 25mVpp' },
          { pin: 'VDD_1P8', name: 'VCC1P8A', net: 'rail-vcc1p8', expectedVoltage: '1.80V', expectedDiodeDrop: '0.420V', expectedResistance: '450 Ohm' },
          { pin: 'PLTRST_IN', name: 'RESET#_CPU', net: 'rail-pltrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.510V' },
          { pin: 'VSS', name: 'GND_PLANE', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V', expectedResistance: '0.0 Ohm' }
        ],
        commonFailureModes: [
          'Cong méo, cháy gãy chân socket do người dùng gắn CPU lệch khớp',
          'Chập đường nguồn VCORE sang mass dẫn đến tắt nguồn bảo vệ OCP trong 0.1 giây',
          'Mất tiếp xúc đường tín hiệu RAM Channel A/B gây lỗi mã POST C1/55'
        ],
        replacementTips: 'Sử dụng máy hàn chip BGA chuyên dụng với nhiệt profile chì hàn không chì (Lead-Free peak 240°C), căn chỉnh camera quang học chính xác từng góc.',
        normalTempC: 45,
        faultTempC: 95
      },
      {
        id: 'PU101',
        label: 'PU101',
        kind: 'pwm_ic',
        zone: 'zone-vrm-vcore',
        description: 'IC điều khiển PWM kỹ thuật số 16+1 pha hỗ trợ giao thức IMVP9.1 điều khiển từng tầng DrMOS Vcore.',
        partNumber: 'RAA229131',
        specs: 'QFN-60, Multi-phase Digital Controller, PMBus/I2C/SVID Interface',
        pos3d: { x: -28, y: 0, z: -24, w: 7, d: 7, h: 1.5, color: '#1e293b' },
        pos2d: { x: 12, y: 12, w: 6, h: 6 },
        schematicPos: { x: 260, y: 220 },
        pins: [
          { pin: '1', name: 'VCC5', net: 'rail-5vsb', expectedVoltage: '5.00V', expectedDiodeDrop: '0.520V', expectedResistance: '12 kOhm' },
          { pin: '12', name: 'VR_ENABLE', net: 'rail-slp-s3', expectedVoltage: '3.30V', expectedDiodeDrop: '0.580V' },
          { pin: '24', name: 'PWM1_OUT', net: 'rail-vccin-core', expectedVoltage: '2.10V', expectedDiodeDrop: '0.640V', waveformHint: 'Xung vuông PWM tần số 500kHz amplitude 5V' },
          { pin: '48', name: 'VR_RDY / PGOOD', net: 'rail-pltrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.490V' }
        ],
        commonFailureModes: [
          'Chết IC do xung ngược từ DrMOS bị đánh thủng đường Phase',
          'Mất tín hiệu VR_READY khiến toàn bo mạch treo không phát xung reset PLTRST#',
          'Nhiệt độ hoạt động quá cao gây mất pha điều khiển'
        ],
        replacementTips: 'Khò nóng đều bụng IC (Exposed Pad nối mass tản nhiệt), dùng thiếc hàn nhiệt độ trung bình 183°C (Sn63Pb37) để dễ thay thế an toàn.',
        normalTempC: 50,
        faultTempC: 85
      },
      {
        id: 'PQ101',
        label: 'PQ101',
        kind: 'drmos',
        zone: 'zone-vrm-vcore',
        description: 'IC DrMOS tầng công suất thông minh tích hợp High-side, Low-side MOSFET và Driver dòng tải tối đa 90A.',
        partNumber: 'ISL99390',
        specs: 'Smart Power Stage, 90A, PQFN-39 package, 16V Vin max',
        pos3d: { x: -26, y: 0, z: -14, w: 5, d: 5, h: 1.2, color: '#0f172a' },
        pos2d: { x: 14, y: 22, w: 5, h: 5 },
        schematicPos: { x: 380, y: 190 },
        pins: [
          { pin: 'VIN', name: 'VIN_12V', net: 'rail-12v-eps', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 50 kOhm' },
          { pin: 'PHASE', name: 'SW_PHASE1', net: 'rail-vccin-core', expectedVoltage: '1.15V', expectedDiodeDrop: '0.012V', waveformHint: 'Xung răng cưa PWM 500kHz đỉnh 12V chuyển tiếp' },
          { pin: 'PWM', name: 'PWM_IN', net: 'rail-vccin-core', expectedVoltage: '2.10V', expectedDiodeDrop: '0.610V' },
          { pin: 'BOOT', name: 'BOOTSTRAP', net: 'rail-12v-eps', expectedVoltage: '16.5V', expectedDiodeDrop: '0.540V' }
        ],
        commonFailureModes: [
          'Đánh thủng cực High-side làm đường 12V_EPS xông thẳng vào VCORE làm chập cháy CPU',
          'Nổ nứt thân IC DrMOS do quá nhiệt tải kéo dài',
          'Đo que đỏ mass que đen chân VIN thấy trở kháng 0.00 Ohm (chập nguồn 12V EPS)'
        ],
        replacementTips: 'Bắt buộc kiểm tra kỹ trở kháng chân VIN và chân PHASE trước khi cấp nguồn. Dùng mỏ hàn chì cạo sạch keo tản nhiệt và thiếc hàn cũ.',
        normalTempC: 58,
        faultTempC: 110
      },
      {
        id: 'PQ102',
        label: 'PQ102',
        kind: 'drmos',
        zone: 'zone-vrm-vcore',
        description: 'Tầng DrMOS pha phụ trách cấp nguồn VCCGT (Graphics Core tích hợp) công suất 90A.',
        partNumber: 'ISL99390',
        specs: 'Smart Power Stage, 90A, Low Phase GT',
        pos3d: { x: -26, y: 0, z: -6, w: 5, d: 5, h: 1.2, color: '#0f172a' },
        pos2d: { x: 14, y: 30, w: 5, h: 5 },
        schematicPos: { x: 380, y: 270 },
        pins: [
          { pin: 'VIN', name: 'VIN_12V', net: 'rail-12v-eps', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 50 kOhm' },
          { pin: 'PHASE', name: 'SW_PHASE2', net: 'rail-vccin-core', expectedVoltage: '0.90V', expectedDiodeDrop: '0.015V' },
          { pin: 'GND', name: 'PGND', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Chập kênh Low-side khiến nguồn VCCGT rớt về 0V, máy chạy quạt quay nhưng không lên hình',
          'Mất tín hiệu hồi tiếp dòng (IMON) làm controller ngắt VRM sau 3 giây'
        ],
        replacementTips: 'Thay thế bằng IC cùng mã ISL99390 hoặc tương thích họ RAA22090 tương đương dòng 90A.',
        normalTempC: 54,
        faultTempC: 105
      },
      {
        id: 'PL101',
        label: 'PL101',
        kind: 'inductor',
        zone: 'zone-vrm-vcore',
        description: 'Cuộn cảm đúc hợp kim MicroFine Choke lọc sóng cao tần ngõ ra nguồn VCORE phase 1.',
        partNumber: 'R22-SMD-HIGH-CURRENT',
        specs: '0.22uH, dòng chịu đựng bão hòa 65A, nội trở DCR 0.8mOhm',
        pos3d: { x: -16, y: 0, z: -14, w: 6, d: 6, h: 5, color: '#334155' },
        pos2d: { x: 22, y: 22, w: 5, h: 5 },
        schematicPos: { x: 470, y: 190 },
        pins: [
          { pin: '1', name: 'SW_IN', net: 'rail-12v-eps', expectedVoltage: '1.15V', expectedDiodeDrop: '0.012V' },
          { pin: '2', name: 'VOUT', net: 'rail-vccin-core', expectedVoltage: '1.15V', expectedDiodeDrop: '0.012V', expectedResistance: '1.2 Ohm' }
        ],
        commonFailureModes: [
          'Hở chân hàn (cold solder joint) do nhiệt độ chu kỳ tải nặng co giãn liên tục',
          'Om cuộn dây bên trong lõi ferit gây nóng bất thường và tiếng rít coil whine lớn'
        ],
        replacementTips: 'Gia nhiệt mặt đáy bo mạch bằng bàn nhiệt 120°C trước khi dùng mỏ khò để tránh bong tróc mạch in nhiều lớp.',
        normalTempC: 55,
        faultTempC: 90
      },
      {
        id: 'PL102',
        label: 'PL102',
        kind: 'inductor',
        zone: 'zone-vrm-vcore',
        description: 'Cuộn cảm hợp kim lọc dòng ngõ ra VCCGT pha 2.',
        partNumber: 'R22-SMD-HIGH-CURRENT',
        specs: '0.22uH, 65A, DCR 0.8mOhm',
        pos3d: { x: -16, y: 0, z: -6, w: 6, d: 6, h: 5, color: '#334155' },
        pos2d: { x: 22, y: 30, w: 5, h: 5 },
        schematicPos: { x: 470, y: 270 },
        pins: [
          { pin: '1', name: 'SW_IN', net: 'rail-12v-eps', expectedVoltage: '0.90V', expectedDiodeDrop: '0.015V' },
          { pin: '2', name: 'VOUT', net: 'rail-vccin-core', expectedVoltage: '0.90V', expectedDiodeDrop: '0.015V' }
        ],
        commonFailureModes: ['Bong chân chì mass hoặc nứt lõi gốm do va đập vật lý'],
        replacementTips: 'Thay cuộn cảm cùng chỉ số Henries (0.22uH) và dòng định mức tối thiểu 60A.',
        normalTempC: 52,
        faultTempC: 85
      },
      {
        id: 'PC101',
        label: 'PC101',
        kind: 'capacitor_solid',
        zone: 'zone-vrm-vcore',
        description: 'Tụ điện thể rắn polymer Black Metallic lọc phẳng điện áp gợn VCORE ngõ vào CPU.',
        partNumber: 'FP5K-561-6V3',
        specs: '560uF, 6.3V, ESR cực thấp 5 mOhm, tuổi thọ 5000 giờ tại 105°C',
        pos3d: { x: -8, y: 0, z: -10, w: 4, d: 4, h: 7, color: '#1e293b' },
        pos2d: { x: 30, y: 24, w: 4, h: 5 },
        schematicPos: { x: 550, y: 220 },
        pins: [
          { pin: '+', name: 'POS', net: 'rail-vccin-core', expectedVoltage: '1.15V', expectedDiodeDrop: '0.012V' },
          { pin: '-', name: 'NEG_GND', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Chập xuyên lớp điện môi polymer gây sập nguồn 12V/VCORE về mass ngay lập tức',
          'Tăng ESR làm dao động Vcore không ổn định gây màn hình xanh WHEA_UNCORRECTABLE_ERROR khi chạy nặng'
        ],
        replacementTips: 'Thay đúng tụ rắn Ultra Low ESR cùng điện áp danh định >= 6.3V dung lượng từ 470uF - 560uF.',
        normalTempC: 48,
        faultTempC: 90
      },
      {
        id: 'PCH1',
        label: 'PCH1',
        kind: 'chipset',
        zone: 'zone-pch-south',
        description: 'Chipset cầu nam Intel B760 điều khiển I/O ngoại vi, SATA, PCIe Gen4, USB và chuỗi phân cấp nguồn S0-S5.',
        partNumber: 'SRM4L (Intel B760)',
        specs: 'BGA FCBGA1079, TDP 6W, Giao tiếp DMI 4.0 x4 với CPU',
        pos3d: { x: 26, y: 0, z: 20, w: 14, d: 14, h: 2, color: '#334155' },
        pos2d: { x: 70, y: 64, w: 16, h: 18 },
        schematicPos: { x: 860, y: 460 },
        pins: [
          { pin: 'VCC_RTC', name: 'RTC_AUX', net: 'rail-3valw', expectedVoltage: '3.05V', expectedDiodeDrop: '0.580V', expectedResistance: '> 100 kOhm' },
          { pin: 'VCC_3P3', name: 'VCC3_PCH', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.360V', expectedResistance: '280 Ohm' },
          { pin: 'RSMRST#', name: 'RSMRST#_IN', net: 'rail-rsmrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.520V' },
          { pin: 'SLP_S3#', name: 'SLP_S3#_OUT', net: 'rail-slp-s3', expectedVoltage: '3.30V', expectedDiodeDrop: '0.560V' },
          { pin: 'PLTRST#', name: 'PLTRST#_OUT', net: 'rail-pltrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.490V' }
        ],
        commonFailureModes: [
          'Chập đường 3.3V Standby hoặc 1.05V PCH làm bo mạch nóng rực Chipset ngay khi cắm dây nguồn 24-pin',
          'Mất xung dao động RTC 32.768kHz khiến PCH không kéo tín hiệu SLP_S3# lên mức cao (máy không kích được nguồn)',
          'Sét đánh qua cổng LAN RJ45 xông vào PCH làm cháy khối điều khiển PCIe/GbE'
        ],
        replacementTips: 'Cần máy đóng chip BGA chuyên nghiệp, lưới làm chân BGA stencil B760 và bi chì 0.35mm.',
        normalTempC: 48,
        faultTempC: 85
      },
      {
        id: 'U_BIOS',
        label: 'U_BIOS',
        kind: 'bios_chip',
        zone: 'zone-pch-south',
        description: 'Bộ nhớ SPI Flash ROM chứa mã UEFI firmware ASUS EZ Flash 3, Intel ME Region và cấu hình khởi động.',
        partNumber: 'Winbond W25Q256JVEIQ',
        specs: '256M-bit (32MB), điện áp hoạt động 3.3V, chuẩn giao tiếp SPI SOIC-8',
        pos3d: { x: 38, y: 0, z: 28, w: 4, d: 5, h: 1.2, color: '#09090b' },
        pos2d: { x: 84, y: 78, w: 5, h: 5 },
        schematicPos: { x: 990, y: 440 },
        pins: [
          { pin: '8', name: 'VCC_3V3', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.460V', expectedResistance: '> 15 kOhm' },
          { pin: '1', name: 'CS#', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.620V', waveformHint: 'Xung dữ liệu nhấp nháy khi vừa bấm nút kích nguồn' },
          { pin: '6', name: 'SCLK', net: 'rail-3valw', expectedVoltage: '1.60V', expectedDiodeDrop: '0.610V', waveformHint: 'Xung nhịp Clock 50MHz - 104MHz' },
          { pin: '4', name: 'GND', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Lỗi hỏng dữ liệu BIOS (corrupt firmware) sau khi cập nhật dở dang hoặc mất điện',
          'Lỗi phân vùng Intel Management Engine (ME) khiến máy khởi động chậm 30 giây hoặc tắt sau đúng 30 phút',
          'Chết chip nhớ vật lý khiến chân CS# luôn ở mức thấp không có dữ liệu trao đổi'
        ],
        replacementTips: 'Sử dụng mạch nạp RT809H hoặc CH341A với kẹp SOIC-8 nạp lại bản BIOS Dump sạch (Clear ME) từ trang chủ ASUS.',
        normalTempC: 38,
        faultTempC: 60
      },
      {
        id: 'U_SIO',
        label: 'U_SIO',
        kind: 'super_io',
        zone: 'zone-io-sio',
        description: 'IC Super I/O quản lý chuỗi kích nguồn, giám sát điện áp phần cứng (Hardware Monitor), điều tốc quạt PWM.',
        partNumber: 'Nuvoton NCT6798D',
        specs: 'LQFP-128, ACPI 5.0, LPC bus interface, H/W Monitor',
        pos3d: { x: -36, y: 0, z: 22, w: 9, d: 9, h: 1.6, color: '#18181b' },
        pos2d: { x: 8, y: 70, w: 9, h: 9 },
        schematicPos: { x: 120, y: 480 },
        pins: [
          { pin: '3VSB', name: '3VSB_IN', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.480V', expectedResistance: '5.2 kOhm' },
          { pin: 'PWRBTN#', name: 'PWRBTN#_FRONT', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.680V', waveformHint: 'Sụt xuống 0V khi nhấn nút Power On' },
          { pin: 'RSMRST#', name: 'RSMRST#_OUT', net: 'rail-rsmrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.520V' },
          { pin: 'PSON#', name: 'PSON#_OUT', net: 'rail-5vsb', expectedVoltage: '0.05V (kích) / 5.0V (chờ)', expectedDiodeDrop: '0.640V' }
        ],
        commonFailureModes: [
          'Chết mạch kích nguồn SIO làm chân PSON# không thể kéo xuống 0V để kích mở nguồn ATX',
          'Chạm chập ngõ vào cảm biến quạt hoặc cảm biến nhiệt làm máy báo lỗi CPU Fan Error dù quạt vẫn quay',
          'Hỏng đường truyền RSMRST# khiến Chipset không nhận biết được nguồn cấp trước đã sẵn sàng'
        ],
        replacementTips: 'Dùng mỏ hàn dao vuốt chì mềm 63/37 với mỡ hàn Amtech 559 để hàn lại 128 chân LQFP đều đẹp không dính chân.',
        normalTempC: 42,
        faultTempC: 75
      },
      {
        id: 'JATX24',
        label: 'JATX24',
        kind: 'atx_24pin',
        zone: 'zone-ram-bank',
        description: 'Cổng cắm nguồn ATX 24-Pin tiêu chuẩn cung cấp các đường nguồn +12V, +5V, +3.3V, +5VSB, -12V và chân PS_ON#.',
        partNumber: 'MOLEX-ATX-24P-MALE',
        specs: '24-pin dual row, dòng tải định mức 8A/pin mạ thiếc phosphor-bronze',
        pos3d: { x: 44, y: 0, z: -10, w: 8, d: 26, h: 10, color: '#f8fafc' },
        pos2d: { x: 92, y: 14, w: 6, h: 28 },
        schematicPos: { x: 80, y: 120 },
        pins: [
          { pin: '9', name: '+5VSB', net: 'rail-5vsb', expectedVoltage: '5.05V', expectedDiodeDrop: '0.510V', expectedResistance: '> 1.2 kOhm' },
          { pin: '16', name: 'PS_ON#', net: 'rail-5vsb', expectedVoltage: '3.3V - 5.0V (Chờ) / 0V (Kích)', expectedDiodeDrop: '0.640V' },
          { pin: '1', name: '+3.3V', net: 'rail-3valw', expectedVoltage: '3.32V', expectedDiodeDrop: '0.380V', expectedResistance: '> 250 Ohm' },
          { pin: '4', name: '+5V', net: 'rail-5vsb', expectedVoltage: '5.02V', expectedDiodeDrop: '0.420V', expectedResistance: '> 500 Ohm' },
          { pin: '10', name: '+12V1', net: 'rail-12v-eps', expectedVoltage: '12.10V', expectedDiodeDrop: '0.480V', expectedResistance: '> 2 kOhm' }
        ],
        commonFailureModes: [
          'Chân tiếp xúc pin 5VSB hoặc +12V bị oxi hóa, cháy xém do cắm lỏng gây sụt áp',
          'Chân cắm bị cong gãy khi tháo lắp nguồn thô bạo'
        ],
        replacementTips: 'Dùng ống hút thiếc công suất lớn hoặc mỏ hàn súng 100W để rút chân kim loại ra khỏi lỗ xuyên mạch mạ đồng dày.',
        normalTempC: 35,
        faultTempC: 80
      },
      {
        id: 'JEPS8',
        label: 'JEPS8',
        kind: 'eps_8pin',
        zone: 'zone-vrm-vcore',
        description: 'Cặp đầu cắm nguồn CPU ProCool 8+8 Pin cấp nguồn 12V riêng biệt chịu dòng tải cao cho VRM CPU.',
        partNumber: 'ASUS-PROCOOL-8P-SOLID',
        specs: 'Dual 8-pin 12V EPS, chân kim loại đặc (Solid Core) chịu dòng đến 13A mỗi chân',
        pos3d: { x: -38, y: 0, z: -32, w: 10, d: 14, h: 9, color: '#1e293b' },
        pos2d: { x: 8, y: 4, w: 12, h: 8 },
        schematicPos: { x: 80, y: 260 },
        pins: [
          { pin: '1-4', name: 'GND_RETURN', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V', expectedResistance: '0.0 Ohm' },
          { pin: '5-8', name: '12V_EPS_IN', net: 'rail-12v-eps', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 5 kOhm' }
        ],
        commonFailureModes: [
          'Chập đường 12V CPU sang GND do chết DrMOS/MOSFET kéo theo bộ nguồn nhảy cúp rơ-le tức thì',
          'Đầu cắm bị chảy nhựa do người dùng cắm sai đầu dây PCIe 8-pin vào socket CPU EPS'
        ],
        replacementTips: 'Cạo sạch muội than nhựa cháy trước khi thay đầu cắm mới; luôn kiểm tra đo thông mạch trước khi cắm điện.',
        normalTempC: 38,
        faultTempC: 85
      },
      {
        id: 'DIMM_A2',
        label: 'DIMM_A2',
        kind: 'ram_slot',
        zone: 'zone-ram-bank',
        description: 'Khe cắm RAM DDR5 288-pin ưu tiên kênh A (Primary Slot) với thiết kế chốt khóa một bên Q-Latch.',
        partNumber: 'SMD-DDR5-288P-SMT',
        specs: '288 Pins SMT, DDR5-7800+ (OC), PMIC on Module',
        pos3d: { x: 20, y: 0, z: -10, w: 4, d: 34, h: 7, color: '#09090b' },
        pos2d: { x: 74, y: 12, w: 4, h: 32 },
        schematicPos: { x: 780, y: 140 },
        pins: [
          { pin: 'VIN_BULK', name: 'VIN_12V_PMIC', net: 'rail-12v-eps', expectedVoltage: '12.00V', expectedDiodeDrop: '0.510V' },
          { pin: 'VDD_SENSE', name: 'VDD_1V1', net: 'rail-vddq-ddr5', expectedVoltage: '1.10V', expectedDiodeDrop: '0.340V', expectedResistance: '80 Ohm' },
          { pin: 'VDDQ_SENSE', name: 'VDDQ_1V1', net: 'rail-vddq-ddr5', expectedVoltage: '1.10V', expectedDiodeDrop: '0.340V', expectedResistance: '85 Ohm' },
          { pin: 'VSS', name: 'GND_BUS', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Chân tiếp xúc DDR5 mạ vàng bị xỉn oxy hóa khiến BIOS không nhận diện thanh RAM hoặc báo đèn vàng Q-LED DRAM',
          'Cong gãy chân tiếp xúc lá đồng bên trong khe do cắm ngược hoặc tháo lắp mạnh tay'
        ],
        replacementTips: 'Dùng dung dịch tẩy rửa DeoxIT D5 hoặc cồn Isopropyl 99% chải nhẹ chân tiếp xúc bằng chổi lông tơ mềm.',
        normalTempC: 36,
        faultTempC: 65
      },
      {
        id: 'PCIE_X16',
        label: 'PCIE_X16',
        kind: 'pcie_slot',
        zone: 'zone-pcie-slots',
        description: 'Khe cắm cạc đồ họa rời PCI Express 5.0 x16 bọc giáp thép SafeSlot kết nối trực tiếp với 16 làn vi sai của CPU.',
        partNumber: 'PCIE-GEN5-164P-SHIELDED',
        specs: 'PCIe 5.0 32 GT/s bandwidth, 164 pins, chốt tháo nhanh Q-Release',
        pos3d: { x: -8, y: 0, z: 12, w: 38, d: 4, h: 6, color: '#64748b' },
        pos2d: { x: 18, y: 56, w: 42, h: 4 },
        schematicPos: { x: 740, y: 620 },
        pins: [
          { pin: 'A1', name: 'PRSNT1#', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' },
          { pin: 'A2', name: '+12V_PCIE', net: 'rail-12v-eps', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 5 kOhm' },
          { pin: 'A9', name: '+3.3V_PCIE', net: 'rail-3valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.380V', expectedResistance: '> 300 Ohm' },
          { pin: 'A11', name: 'PERST#', net: 'rail-pltrst', expectedVoltage: '3.30V', expectedDiodeDrop: '0.510V' }
        ],
        commonFailureModes: [
          'Rách gãy chân hàn SMT hoặc cong vênh khe cắm do cạc màn hình VGA nặng tỳ đè khi vận chuyển',
          'Mất tín hiệu PERST# (Platform Reset) làm cạc đồ họa không nhận diện (Code POST 97/d6)'
        ],
        replacementTips: 'Sử dụng kẹp gia cố cơ khí hoặc bệ đỡ card màn hình (GPU Sag Bracket) sau khi hàn thay thế khe cắm mới.',
        normalTempC: 38,
        faultTempC: 70
      },
      {
        id: 'PU_3V5V',
        label: 'PU_3V5V',
        kind: 'pwm_ic',
        zone: 'zone-pch-south',
        description: 'IC điều khiển chuyển đổi nguồn kép đồng bộ Buck hạ áp từ 5VSB tạo ra đường nguồn cấp trước +3.3VALW cho toàn bo.',
        partNumber: 'RT6575BGQW',
        specs: 'WQFN-20, Dual Synchronous Step-Down Controller, 5V LDO & 3.3V Buck',
        pos3d: { x: 34, y: 0, z: 12, w: 4, d: 4, h: 1.0, color: '#111827' },
        pos2d: { x: 78, y: 52, w: 5, h: 5 },
        schematicPos: { x: 320, y: 440 },
        pins: [
          { pin: 'VIN', name: '5VSB_IN', net: 'rail-5vsb', expectedVoltage: '5.05V', expectedDiodeDrop: '0.510V', expectedResistance: '> 1.5 kOhm' },
          { pin: 'VOUT3', name: '+3.3VALW_OUT', net: 'rail-3valw', expectedVoltage: '3.33V', expectedDiodeDrop: '0.390V', expectedResistance: '> 400 Ohm' },
          { pin: 'EN', name: 'ENABLE_IN', net: 'rail-5vsb', expectedVoltage: '4.80V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: [
          'Chết nổ IC làm mất hoàn toàn điện áp 3.3VALW dẫn đến bo mạch mất nguồn cấp trước, không sáng đèn LED Standby',
          'Chập chân VOUT3 kéo sụt toàn bộ nguồn 5VSB của bộ nguồn máy tính'
        ],
        replacementTips: 'Kiểm tra đo nguội trở kháng cuộn cảm đầu ra trước khi thay IC; nếu trở kháng < 5 Ohm thì nghi ngờ PCH hoặc SIO đã bị chập.',
        normalTempC: 44,
        faultTempC: 95
      },
      {
        id: 'ESD_USB1',
        label: 'ESD_USB1',
        kind: 'diode',
        zone: 'zone-io-sio',
        description: 'Mảng diode dập xung tĩnh điện (ESD Protection Diode Array) bảo vệ đường dữ liệu vi sai USB D+/D- phía sau bo mạch.',
        partNumber: 'USBLC6-2SC6',
        specs: 'SOT-23-6, điện dung cực thấp 0.35pF, điện áp đánh thủng 6V, chịu xung ESD 15kV',
        pos3d: { x: -42, y: 0, z: 4, w: 3, d: 3, h: 1.0, color: '#1e293b' },
        pos2d: { x: 4, y: 46, w: 3, h: 3 },
        schematicPos: { x: 120, y: 640 },
        pins: [
          { pin: '1', name: 'IO1_DP', net: 'rail-3valw', expectedVoltage: '0.05V - 3.0V', expectedDiodeDrop: '0.620V' },
          { pin: '2', name: 'GND', net: 'rail-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' },
          { pin: '3', name: 'IO2_DM', net: 'rail-3valw', expectedVoltage: '0.05V - 3.0V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: [
          'Bị đánh thủng nối tắt chân Data sang Mass (GND) sau khi người dùng cắm USB phóng tĩnh điện vào mùa đông',
          'Làm liệt cổng USB hoặc PCH báo lỗi quá dòng Over Current Protection cảnh báo tắt sau 15 giây'
        ],
        replacementTips: 'Có thể xả bỏ tạm thời diode để test xem cổng USB có nhận lại hay không, sau đó thay mới bảo vệ an toàn cho PCH.',
        normalTempC: 32,
        faultTempC: 60
      }
    ],
    wires: [
      { id: 'w101', netId: 'rail-12v-eps', fromComponentId: 'JEPS8', fromPin: '5-8', toComponentId: 'PQ101', toPin: 'VIN' },
      { id: 'w102', netId: 'rail-12v-eps', fromComponentId: 'JEPS8', fromPin: '5-8', toComponentId: 'PQ102', toPin: 'VIN' },
      { id: 'w103', netId: 'rail-vccin-core', fromComponentId: 'PU101', fromPin: 'PWM1_OUT', toComponentId: 'PQ101', toPin: 'PWM' },
      { id: 'w104', netId: 'rail-vccin-core', fromComponentId: 'PQ101', fromPin: 'PHASE', toComponentId: 'PL101', toPin: '1' },
      { id: 'w105', netId: 'rail-vccin-core', fromComponentId: 'PQ102', fromPin: 'PHASE', toComponentId: 'PL102', toPin: '1' },
      { id: 'w106', netId: 'rail-vccin-core', fromComponentId: 'PL101', fromPin: '2', toComponentId: 'PC101', toPin: '+' },
      { id: 'w107', netId: 'rail-vccin-core', fromComponentId: 'PC101', fromPin: '+', toComponentId: 'CPU1', toPin: 'VCORE_IN' },
      { id: 'w108', netId: 'rail-5vsb', fromComponentId: 'JATX24', fromPin: '9', toComponentId: 'PU_3V5V', toPin: 'VIN' },
      { id: 'w109', netId: 'rail-3valw', fromComponentId: 'PU_3V5V', fromPin: 'VOUT3', toComponentId: 'U_SIO', toPin: '3VSB' },
      { id: 'w110', netId: 'rail-3valw', fromComponentId: 'PU_3V5V', fromPin: 'VOUT3', toComponentId: 'U_BIOS', toPin: '8' },
      { id: 'w111', netId: 'rail-3valw', fromComponentId: 'PU_3V5V', fromPin: 'VOUT3', toComponentId: 'PCH1', toPin: 'VCC_3P3' },
      { id: 'w112', netId: 'rail-rsmrst', fromComponentId: 'U_SIO', fromPin: 'RSMRST#_OUT', toComponentId: 'PCH1', toPin: 'RSMRST#' },
      { id: 'w113', netId: 'rail-slp-s3', fromComponentId: 'PCH1', fromPin: 'SLP_S3#_OUT', toComponentId: 'U_SIO', toPin: 'PWRBTN#' },
      { id: 'w114', netId: 'rail-slp-s3', fromComponentId: 'PCH1', fromPin: 'SLP_S3#_OUT', toComponentId: 'PU101', toPin: '12' },
      { id: 'w115', netId: 'rail-pltrst', fromComponentId: 'PCH1', fromPin: 'PLTRST#_OUT', toComponentId: 'CPU1', toPin: 'PLTRST_IN' },
      { id: 'w116', netId: 'rail-pltrst', fromComponentId: 'PCH1', fromPin: 'PLTRST#_OUT', toComponentId: 'PCIE_X16', toPin: 'A11' }
    ]
  },

  // =========================================================================
  // 2. GIGABYTE B660M DS3H DDR4 (Intel LGA1700, mATX, Discrete MOSFET VRM)
  // =========================================================================
  {
    id: 'gigabyte-b660m-ds3h',
    name: 'Gigabyte B660M DS3H DDR4',
    brand: 'Gigabyte',
    category: 'motherboard',
    generation: 'Intel LGA1700 (12th/13th Gen Alder Lake / Raptor Lake)',
    formFactor: 'Micro-ATX (244mm x 244mm)',
    pcbColor: '#1a1f2c',
    pcbSize: { width: 85, depth: 85, thickness: 1.8 },
    powerSequenceId: 'seq-intel-lga1700',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (4C10N / 4C06N / IT8689E)',
      missingDataNote:
        'Gigabyte không công bố công khai Schematic & BoardView gốc dòng B660M. Chưa có ảnh chụp thực tế bản quyền mở cho model này nên phần Ảnh Thực Tế được để trống; không dùng ảnh bo mạch khác thay thế.',
    },
    summary: 'Bo mạch chủ văn phòng và phổ thông bền bỉ Ultra Durable LGA1700, kiến trúc nguồn 6+2+1 phase dùng MOSFET rời OnSemi 4C10N/4C06N, Super I/O ITE IT8689E và chip quản lý RAM DDR4 riêng biệt.',
    safetyWarning: 'CHÚ Ý: Thiết kế MOSFET rời không có heatsink tản nhiệt dày ở các phase phụ, khi chạy Stress-test nhiệt độ lưng MOSFET có thể vượt 90°C. Cẩn thận bỏng tay khi sờ trực tiếp!',
    zones: [
      {
        id: 'zone-vrm-discrete',
        name: 'Dàn VRM MOSFET Rời 6+2+1 Phase',
        description: 'Tầng High-side 4C10N, Low-side 4C06N và cuộn choke kín',
        color: '#dc2626',
        bounds2d: { x: 10, y: 12, w: 26, h: 32 }
      },
      {
        id: 'zone-socket-lga1700',
        name: 'Socket LGA1700 CPU',
        description: 'Socket CPU và hệ thống tụ dán gốm MLCC giải mã decoupling mặt đáy',
        color: '#2563eb',
        bounds2d: { x: 38, y: 14, w: 24, h: 28 }
      },
      {
        id: 'zone-ddr4-memory',
        name: 'Hàng Khe Cắm DDR4 & Nguồn 1.2V',
        description: '4 khe DDR4 3200MHz và IC điều khiển nguồn RAM RT8120D',
        color: '#16a34a',
        bounds2d: { x: 66, y: 10, w: 26, h: 36 }
      },
      {
        id: 'zone-pch-b660',
        name: 'Chipset Intel B660 & SPI Flash',
        description: 'PCH B660 tản nhiệt nhôm nhỏ, IC BIOS Macronix 128Mb',
        color: '#9333ea',
        bounds2d: { x: 62, y: 58, w: 28, h: 30 }
      },
      {
        id: 'zone-sio-ite',
        name: 'Super I/O ITE & Khu Vực Chân Kích',
        description: 'IC Super I/O IT8689E, mạch đệm kích nguồn RSMRST# và Front Panel',
        color: '#ea580c',
        bounds2d: { x: 8, y: 52, w: 22, h: 40 }
      }
    ],
    rails: [
      {
        id: 'rail-12v-in',
        name: '12V_MAIN',
        nominalVoltage: '+12.0V',
        category: 'main_power',
        color: '#ef4444',
        description: 'Nguồn 12V chính từ cổng ATX và EPS cấp cho VRM CPU và khe cắm PCIe',
        connectedComponents: ['JEPS8', 'JATX24', 'PQ201']
      },
      {
        id: 'rail-5vsb-gb',
        name: '+5VSB',
        nominalVoltage: '+5.0V',
        category: 'standby',
        color: '#8b5cf6',
        description: 'Nguồn cấp trước 5V duy trì trạng thái chờ',
        connectedComponents: ['JATX24', 'U_SIO']
      },
      {
        id: 'rail-vcore-gb',
        name: 'VCORE',
        nominalVoltage: '+1.10V',
        category: 'core_power',
        color: '#10b981',
        description: 'Nguồn cấp nhân CPU sau cuộn cảm PL201',
        connectedComponents: ['PL201', 'CPU1']
      },
      {
        id: 'rail-vdd-ddr4',
        name: 'VDD_DDR4',
        nominalVoltage: '+1.20V',
        category: 'main_power',
        color: '#3b82f6',
        description: 'Nguồn cấp cho thanh nhớ DDR4 từ IC nguồn xung PU_DDR',
        connectedComponents: ['PU_DDR', 'DIMM_1']
      },
      {
        id: 'rail-rsmrst-gb',
        name: 'RSMRST#',
        nominalVoltage: '+3.3V',
        category: 'control_signal',
        color: '#ec4899',
        description: 'Tín hiệu Resume Reset kích hoạt PCH từ mạch bóng bán dẫn Q_RSMRST',
        connectedComponents: ['Q_RSMRST', 'PCH1']
      },
      {
        id: 'rail-gnd-gb',
        name: 'GND',
        nominalVoltage: '0V',
        category: 'ground',
        color: '#475569',
        description: 'Mass chung toàn bo',
        connectedComponents: ['JATX24', 'JEPS8', 'CPU1', 'PQ202', 'PCH1']
      }
    ],
    components: [
      {
        id: 'CPU1',
        label: 'CPU1',
        kind: 'cpu_socket',
        zone: 'zone-socket-lga1700',
        description: 'Socket LGA1700 chuẩn Intel, kết nối trực tiếp với thanh DDR4 qua giao thức IMC DDR4 1.2V.',
        partNumber: 'FOXCONN-LGA1700-UD',
        specs: '1700 pins, hỗ trợ CPU Core i5-12400 / i3-12100',
        pos3d: { x: 0, y: 0, z: -8, w: 18, d: 22, h: 3.5, color: '#475569' },
        pos2d: { x: 40, y: 16, w: 20, h: 24 },
        schematicPos: { x: 620, y: 220 },
        pins: [
          { pin: 'VCORE', name: 'VCC_CPU', net: 'rail-vcore-gb', expectedVoltage: '1.10V', expectedDiodeDrop: '0.010V', expectedResistance: '1.5 Ohm' },
          { pin: 'VDD4', name: 'VDD_DDR_IMC', net: 'rail-vdd-ddr4', expectedVoltage: '1.20V', expectedDiodeDrop: '0.360V', expectedResistance: '120 Ohm' }
        ],
        commonFailureModes: ['Cong chân socket do lắp ráp bất cẩn', 'Mất nhận kênh nhớ B'],
        replacementTips: 'Sử dụng kính lúp soi chân vi mô 40X và nhíp chuyên dụng gắp chân nắn lại theo đúng hướng ánh sáng phản chiếu.',
        normalTempC: 42,
        faultTempC: 90
      },
      {
        id: 'PU201',
        label: 'PU201',
        kind: 'pwm_ic',
        zone: 'zone-vrm-discrete',
        description: 'IC điều khiển PWM nguồn VCORE đa pha điều khiển độc lập các tầng kích MOSFET High-side và Low-side.',
        partNumber: 'OnSemi NCP81530',
        specs: 'QFN-48, 6+2 Phase Digital PWM Controller, VR13/IMVP9 compliant',
        pos3d: { x: -26, y: 0, z: -20, w: 6, d: 6, h: 1.2, color: '#1e293b' },
        pos2d: { x: 12, y: 14, w: 6, h: 6 },
        schematicPos: { x: 240, y: 200 },
        pins: [
          { pin: '5', name: 'VCC', net: 'rail-5vsb-gb', expectedVoltage: '5.00V', expectedDiodeDrop: '0.510V' },
          { pin: '14', name: 'DRV_H1', net: 'rail-12v-in', expectedVoltage: '1.80V (DC avg)', expectedDiodeDrop: '0.620V', waveformHint: 'Xung vuông biên độ 12V kích Gate High-side' },
          { pin: '15', name: 'DRV_L1', net: 'rail-vcore-gb', expectedVoltage: '2.50V (DC avg)', expectedDiodeDrop: '0.600V', waveformHint: 'Xung vuông biên độ 5V kích Gate Low-side' }
        ],
        commonFailureModes: ['Mất lệnh kích EN từ SIO', 'Hỏng kênh điều khiển Gate khiến MOSFET dẫn thông vĩnh viễn gây chập nguồn'],
        replacementTips: 'Kiểm tra kỹ các điện trở mồi (Bootstrap Resistor) và diode BOOT xung quanh trước khi hàn IC mới.',
        normalTempC: 48,
        faultTempC: 85
      },
      {
        id: 'PQ201',
        label: 'PQ201',
        kind: 'mosfet',
        zone: 'zone-vrm-discrete',
        description: 'MOSFET kênh N phân cực trên (High-side) điều khiển đóng ngắt nguồn 12V EPS vào cuộn cảm.',
        partNumber: 'OnSemi 4C10N (NTMFS4C10N)',
        specs: 'N-Channel, 30V, 46A, SO-8 FL (5x6mm Flat Lead), Rds(on) 6.9 mOhm',
        pos3d: { x: -24, y: 0, z: -10, w: 5, d: 5, h: 1.0, color: '#0f172a' },
        pos2d: { x: 14, y: 24, w: 5, h: 5 },
        schematicPos: { x: 380, y: 160 },
        pins: [
          { pin: 'D', name: 'DRAIN_12V', net: 'rail-12v-in', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 10 kOhm' },
          { pin: 'S', name: 'SOURCE_PHASE', net: 'rail-vcore-gb', expectedVoltage: '1.10V', expectedDiodeDrop: '0.010V', expectedResistance: '1.5 Ohm' },
          { pin: 'G', name: 'GATE_CTRL', net: 'rail-12v-in', expectedVoltage: '1.80V', expectedDiodeDrop: '0.640V' }
        ],
        commonFailureModes: [
          'Chập cực D-S làm điện áp 12V phóng thẳng qua cuộn cảm nướng chín CPU',
          'Đo chân D và S bằng thang đo Diode nghe còi Buzzer kêu liên tục (0.000V)'
        ],
        replacementTips: 'Bắt buộc xả bỏ kiểm tra cuộn cảm và tụ lọc; có thể thay thế bằng AON6512 hoặc SM4377.',
        normalTempC: 62,
        faultTempC: 115
      },
      {
        id: 'PQ202',
        label: 'PQ202',
        kind: 'mosfet',
        zone: 'zone-vrm-discrete',
        description: 'MOSFET kênh N phân cực dưới (Low-side) dập dòng tự cảm của cuộn cảm về mass bảo vệ mạch.',
        partNumber: 'OnSemi 4C06N (NTMFS4C06N)',
        specs: 'N-Channel, 30V, 69A, SO-8 FL, Rds(on) cực thấp 4.0 mOhm',
        pos3d: { x: -24, y: 0, z: -4, w: 5, d: 5, h: 1.0, color: '#0f172a' },
        pos2d: { x: 14, y: 32, w: 5, h: 5 },
        schematicPos: { x: 380, y: 260 },
        pins: [
          { pin: 'D', name: 'DRAIN_PHASE', net: 'rail-vcore-gb', expectedVoltage: '1.10V', expectedDiodeDrop: '0.010V' },
          { pin: 'S', name: 'SOURCE_GND', net: 'rail-gnd-gb', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' },
          { pin: 'G', name: 'GATE_CTRL', net: 'rail-vcore-gb', expectedVoltage: '2.50V', expectedDiodeDrop: '0.610V' }
        ],
        commonFailureModes: ['Đánh thủng cực D-S làm đường Vcore thông thẳng mass, nguồn bật lên ngắt liền sau 0.5s'],
        replacementTips: 'Thay bằng MOSFET có Rds(on) <= 4.0 mOhm và dòng Id >= 60A.',
        normalTempC: 58,
        faultTempC: 100
      },
      {
        id: 'PL201',
        label: 'PL201',
        kind: 'inductor',
        zone: 'zone-vrm-discrete',
        description: 'Cuộn cảm cuộn dây kín hợp kim Ferrite lọc phẳng dòng điện pha VCORE.',
        partNumber: 'R36-FERRITE-CHOKE',
        specs: '0.36uH, Dòng tải 45A',
        pos3d: { x: -16, y: 0, z: -8, w: 6, d: 6, h: 4.5, color: '#334155' },
        pos2d: { x: 22, y: 26, w: 5, h: 5 },
        schematicPos: { x: 490, y: 210 },
        pins: [
          { pin: '1', name: 'SW', net: 'rail-12v-in', expectedVoltage: '1.10V', expectedDiodeDrop: '0.010V' },
          { pin: '2', name: 'OUT', net: 'rail-vcore-gb', expectedVoltage: '1.10V', expectedDiodeDrop: '0.010V' }
        ],
        commonFailureModes: ['Nứt vỡ lõi ferit do va đập tản nhiệt khí nặng'],
        replacementTips: 'Thay cuộn cảm kích thước chuẩn 10x10mm trị số 0.36uH.',
        normalTempC: 56,
        faultTempC: 85
      },
      {
        id: 'PCH1',
        label: 'PCH1',
        kind: 'chipset',
        zone: 'zone-pch-b660',
        description: 'Chipset cầu nam Intel B660 mATX quản lý ngoại vi và phân phối xung nhịp.',
        partNumber: 'SRL4E (Intel B660)',
        specs: 'FCBGA1079, 6W TDP',
        pos3d: { x: 22, y: 0, z: 20, w: 12, d: 12, h: 2, color: '#334155' },
        pos2d: { x: 68, y: 65, w: 15, h: 16 },
        schematicPos: { x: 820, y: 460 },
        pins: [
          { pin: '3V3', name: 'VCC3P3_PCH', net: 'rail-5vsb-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.350V', expectedResistance: '260 Ohm' },
          { pin: 'RSMRST', name: 'RSMRST#', net: 'rail-rsmrst-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.520V' }
        ],
        commonFailureModes: ['Chập mạch nguồn 1.05V PCH làm chết nguồn kích', 'Lỗi khối PCIe slot 1 không nhận cạc đồ họa rời'],
        replacementTips: 'Kiểm tra kỹ khối thạch anh 32.768kHz và tụ lọc xung quanh trước khi kết luận chết PCH.',
        normalTempC: 50,
        faultTempC: 88
      },
      {
        id: 'U_BIOS',
        label: 'U_BIOS',
        kind: 'bios_chip',
        zone: 'zone-pch-b660',
        description: 'IC SPI Flash ROM lưu trữ firmware UEFI Gigabyte Q-Flash Plus.',
        partNumber: 'Macronix MX25L12873F',
        specs: '128Mb (16MB), 3.3V, SOP-8',
        pos3d: { x: 32, y: 0, z: 26, w: 4, d: 5, h: 1.2, color: '#09090b' },
        pos2d: { x: 80, y: 76, w: 4, h: 5 },
        schematicPos: { x: 960, y: 450 },
        pins: [
          { pin: '8', name: 'VCC', net: 'rail-5vsb-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.470V' },
          { pin: '1', name: 'CS#', net: 'rail-5vsb-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Lỗi BIOS làm quạt quay xong ngắt liên tục theo chu kỳ 5 giây (Boot Loop)'],
        replacementTips: 'Có thể dùng tính năng Gigabyte Q-Flash Plus nạp trực tiếp qua cổng USB màu trắng không cần gắn CPU/RAM.',
        normalTempC: 36,
        faultTempC: 55
      },
      {
        id: 'U_SIO',
        label: 'U_SIO',
        kind: 'super_io',
        zone: 'zone-sio-ite',
        description: 'IC Super I/O chuyên dụng điều khiển logic kích nguồn máy tính Gigabyte.',
        partNumber: 'ITE IT8689E',
        specs: 'LQFP-128, ITE Super Hardware Monitor',
        pos3d: { x: -32, y: 0, z: 18, w: 8, d: 8, h: 1.4, color: '#18181b' },
        pos2d: { x: 10, y: 68, w: 8, h: 8 },
        schematicPos: { x: 140, y: 460 },
        pins: [
          { pin: 'VCC', name: 'VBAT/3VSB', net: 'rail-5vsb-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.490V' },
          { pin: 'PSON', name: 'PSON#', net: 'rail-5vsb-gb', expectedVoltage: '0.05V / 5.0V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Hỏng cổng giao tiếp quạt làm quạt CPU luôn quay 100% tốc độ gầm rú', 'Mất lệnh kích nguồn'],
        replacementTips: 'Hàn khò nhiệt vừa phải tránh làm phù mạch PCB mATX mỏng.',
        normalTempC: 40,
        faultTempC: 72
      },
      {
        id: 'PU_DDR',
        label: 'PU_DDR',
        kind: 'pwm_ic',
        zone: 'zone-ddr4-memory',
        description: 'IC chuyển đổi xung Buck hạ áp từ 5V tạo ra nguồn 1.2V nuôi toàn bộ các thanh RAM DDR4.',
        partNumber: 'Richtek RT8120D',
        specs: 'SOP-8, Single Phase Synchronous Buck PWM Controller',
        pos3d: { x: 30, y: 0, z: -26, w: 4, d: 4, h: 1.2, color: '#1e293b' },
        pos2d: { x: 74, y: 8, w: 5, h: 5 },
        schematicPos: { x: 680, y: 80 },
        pins: [
          { pin: '5', name: 'VCC12', net: 'rail-12v-in', expectedVoltage: '12.00V', expectedDiodeDrop: '0.520V' },
          { pin: '8', name: 'PHASE_DDR', net: 'rail-vdd-ddr4', expectedVoltage: '1.20V', expectedDiodeDrop: '0.360V' },
          { pin: '1', name: 'BOOT', net: 'rail-12v-in', expectedVoltage: '16.2V', expectedDiodeDrop: '0.550V' }
        ],
        commonFailureModes: ['Chết IC làm mất nguồn RAM 1.2V khiến máy khởi động không lên hình, cắm còi buzzer kêu 3 tiếng bíp dài'],
        replacementTips: 'Có thể thay thế bằng APW7120 hoặc uP6101 tương thích chân cắm 1-1.',
        normalTempC: 45,
        faultTempC: 85
      },
      {
        id: 'JATX24',
        label: 'JATX24',
        kind: 'atx_24pin',
        zone: 'zone-ddr4-memory',
        description: 'Cổng cắm nguồn ATX 24 chân tiêu chuẩn.',
        partNumber: 'ATX-24P-STANDARD',
        specs: '24-pin vertical socket',
        pos3d: { x: 38, y: 0, z: -10, w: 6, d: 24, h: 9, color: '#f8fafc' },
        pos2d: { x: 88, y: 14, w: 5, h: 26 },
        schematicPos: { x: 80, y: 120 },
        pins: [
          { pin: '9', name: '5VSB', net: 'rail-5vsb-gb', expectedVoltage: '5.00V', expectedDiodeDrop: '0.510V' },
          { pin: '16', name: 'PS_ON', net: 'rail-5vsb-gb', expectedVoltage: '3.3V / 0V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Lỏng chân tiếp xúc chập chờn khi cắm dây nguồn phụ'],
        replacementTips: 'Vệ sinh pin đồng bằng bình xịt RP7 hoặc Contact Cleaner chuyên dụng.',
        normalTempC: 32,
        faultTempC: 70
      },
      {
        id: 'JEPS8',
        label: 'JEPS8',
        kind: 'eps_8pin',
        zone: 'zone-vrm-discrete',
        description: 'Đầu vào nguồn CPU 8 chân 12V.',
        partNumber: 'EPS-8P-SOCKET',
        specs: '8-Pin 12V High Current',
        pos3d: { x: -32, y: 0, z: -32, w: 8, d: 10, h: 9, color: '#1e293b' },
        pos2d: { x: 10, y: 4, w: 8, h: 6 },
        schematicPos: { x: 80, y: 220 },
        pins: [
          { pin: '12V', name: 'VIN', net: 'rail-12v-in', expectedVoltage: '12.00V', expectedDiodeDrop: '0.480V' },
          { pin: 'GND', name: 'GND', net: 'rail-gnd-gb', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập 12V do nổ MOSFET High-side'],
        replacementTips: 'Đo thang diode giữa chân 12V và GND trước khi bật nguồn.',
        normalTempC: 34,
        faultTempC: 80
      },
      {
        id: 'DIMM_1',
        label: 'DIMM_1',
        kind: 'ram_slot',
        zone: 'zone-ddr4-memory',
        description: 'Khe cắm DDR4 kênh 1 288-pin.',
        partNumber: 'DDR4-288P-BLACK',
        specs: '288 Pins, 1.2V standard JEDEC',
        pos3d: { x: 18, y: 0, z: -10, w: 3.5, d: 30, h: 6, color: '#09090b' },
        pos2d: { x: 70, y: 12, w: 3.5, h: 30 },
        schematicPos: { x: 800, y: 120 },
        pins: [
          { pin: 'VDD', name: 'VDD_1V2', net: 'rail-vdd-ddr4', expectedVoltage: '1.20V', expectedDiodeDrop: '0.360V' },
          { pin: 'VTT', name: 'VTT_0V6', net: 'rail-vdd-ddr4', expectedVoltage: '0.60V', expectedDiodeDrop: '0.380V' }
        ],
        commonFailureModes: ['Bám bụi bẩn gây không nhận RAM hoặc dump xanh BSOD Memory Management'],
        replacementTips: 'Vệ sinh khe bằng bàn chải đánh răng khô thấm cồn cọ dọc theo chiều khe.',
        normalTempC: 35,
        faultTempC: 60
      },
      {
        id: 'PCIE_1',
        label: 'PCIE_1',
        kind: 'pcie_slot',
        zone: 'zone-pch-b660',
        description: 'Khe cắm cạc đồ họa PCIe 4.0 x16.',
        partNumber: 'PCIE-GEN4-164P',
        specs: '164 pins, Gen4 x16',
        pos3d: { x: -6, y: 0, z: 12, w: 34, d: 3.5, h: 5, color: '#334155' },
        pos2d: { x: 20, y: 56, w: 38, h: 4 },
        schematicPos: { x: 740, y: 620 },
        pins: [
          { pin: '12V', name: '12V_SLOT', net: 'rail-12v-in', expectedVoltage: '12.00V', expectedDiodeDrop: '0.480V' },
          { pin: 'GND', name: 'GND', net: 'rail-gnd-gb', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Gãy chốt giữ đuôi cạc PCIe'],
        replacementTips: 'Gắn lại lẫy nhựa thay thế.',
        normalTempC: 36,
        faultTempC: 65
      },
      {
        id: 'Q_RSMRST',
        label: 'Q_RSMRST',
        kind: 'mosfet',
        zone: 'zone-sio-ite',
        description: 'Cặp bóng bán dẫn kép giải phóng tín hiệu Reset Resume cấp cho PCH.',
        partNumber: '2N7002-DUAL',
        specs: 'SOT-363, N-Channel small signal MOSFET',
        pos3d: { x: -20, y: 0, z: 26, w: 2.5, d: 2.5, h: 0.8, color: '#1e293b' },
        pos2d: { x: 24, y: 76, w: 3, h: 3 },
        schematicPos: { x: 300, y: 520 },
        pins: [
          { pin: 'D', name: 'DRAIN', net: 'rail-rsmrst-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.520V' },
          { pin: 'G', name: 'GATE', net: 'rail-5vsb-gb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Rò rỉ cực D-S làm tụt áp RSMRST# xuống dưới 1.5V khiến PCH câm nín không khởi động'],
        replacementTips: 'Đo kiểm điện áp chân D khi cắm nguồn chờ; nếu dưới 3.0V thay ngay transistor mới.',
        normalTempC: 35,
        faultTempC: 70
      }
    ],
    wires: [
      { id: 'w201', netId: 'rail-12v-in', fromComponentId: 'JEPS8', fromPin: '12V', toComponentId: 'PQ201', toPin: 'D' },
      { id: 'w202', netId: 'rail-12v-in', fromComponentId: 'PQ201', fromPin: 'S', toComponentId: 'PL201', toPin: '1' },
      { id: 'w203', netId: 'rail-vcore-gb', fromComponentId: 'PQ202', fromPin: 'D', toComponentId: 'PL201', toPin: '1' },
      { id: 'w204', netId: 'rail-vcore-gb', fromComponentId: 'PL201', fromPin: '2', toComponentId: 'CPU1', toPin: 'VCORE' },
      { id: 'w205', netId: 'rail-vdd-ddr4', fromComponentId: 'PU_DDR', fromPin: '8', toComponentId: 'DIMM_1', toPin: 'VDD' },
      { id: 'w206', netId: 'rail-rsmrst-gb', fromComponentId: 'Q_RSMRST', fromPin: 'D', toComponentId: 'PCH1', toPin: 'RSMRST' }
    ]
  },

  // =========================================================================
  // 3. MSI MAG B550 TOMAHAWK (AMD AM4, ATX, DrMOS VRM)
  // =========================================================================
  {
    id: 'msi-b550-tomahawk',
    name: 'MSI MAG B550 Tomahawk',
    brand: 'MSI',
    category: 'motherboard',
    generation: 'AMD Socket AM4 (Ryzen 3000 / 5000 Series Vermeer & Cezanne)',
    formFactor: 'ATX (305mm x 244mm)',
    pcbColor: '#1c1c1f',
    pcbSize: { width: 100, depth: 82, thickness: 2 },
    powerSequenceId: 'seq-amd-am4',
    supports3DSimulation: true,
    realPhoto: {
      imageUrl: './boards/msi-b550-tomahawk.jpg',
      sourceLabel: 'Wikimedia Commons — File:MSI B550 Tomahawk 19354.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:MSI_B550_Tomahawk_19354.jpg',
      license: 'CC BY-SA 3.0',
      author: 'Michael Wolf',
      viewNote:
        'Ảnh chụp thực tế xoay ngang 90° (tản nhiệt VRM & I/O ở phía trên-phải, khe PCIe bên trái). Dàn DrMOS & cuộn cảm VRM nằm dưới tản nhiệt nhôm khối lớn.',
    },
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (RAA229004 / ISL99360 / NCT6687D)',
      missingDataNote:
        'Có ảnh chụp thực tế bo mạch (CC BY-SA 3.0), nhưng hãng MSI không công bố Schematic & BoardView gốc (.cad/.tvw). Dữ liệu dây nối chỉ là sơ đồ khối tham chiếu theo datasheet linh kiện.',
    },
    summary: 'Bo mạch chủ socket AM4 huyền thoại của MSI, trang bị hệ thống cấp nguồn 10+2+1 phase với DrMOS Intersil ISL99360 60A, tản nhiệt Extended Heatsink nhôm khối lớn, quản lý nguồn phụ Richtek RT7291A và Super I/O Nuvoton NCT6687D-M.',
    safetyWarning: 'CHÚ Ý ĐẶC THÙ AM4: Khác với Intel, AMD AM4 có chân pin nằm trên thân CPU (PGA 1331). Khi tháo tản nhiệt CPU dính keo cũ, tuyệt đối không giật thẳng lên làm bật CPU ra khỏi socket làm cong gãy chân PGA!',
    zones: [
      {
        id: 'zone-msi-vrm',
        name: 'VRM Cấp Nguồn CPU & SOC (DrMOS 60A)',
        description: 'Dàn cấp nguồn 10 pha VDDCR_CPU và 2 pha VDDCR_SOC dùng DrMOS ISL99360 60A',
        color: '#dc2626',
        bounds2d: { x: 8, y: 10, w: 26, h: 32 },
        photoBounds: { x: 45, y: 2, w: 53, h: 66 }
      },
      {
        id: 'zone-am4-socket',
        name: 'Socket AMD AM4 (PGA 1331)',
        description: 'Đế socket 1331 lỗ tiếp xúc có ngàm khóa cần gạt kim loại',
        color: '#2563eb',
        bounds2d: { x: 36, y: 12, w: 26, h: 30 },
        photoBounds: { x: 54, y: 39, w: 26, h: 25 }
      },
      {
        id: 'zone-ddr4-bank',
        name: '4 Khe DDR4 Boost & Nguồn Bộ Nhớ',
        description: 'Công nghệ DDR4 Boost mạch tín hiệu độc lập, hỗ trợ xung nhịp 4400MHz+ A-XMP',
        color: '#16a34a',
        bounds2d: { x: 66, y: 10, w: 26, h: 34 },
        photoBounds: { x: 42, y: 69, w: 50, h: 29 }
      },
      {
        id: 'zone-amd-b550-pch',
        name: 'Chipset AMD B550 Promontory',
        description: 'Chipset B550 không cần quạt tản nhiệt chủ động, hỗ trợ PCIe 3.0 hạ tầng',
        color: '#9333ea',
        bounds2d: { x: 64, y: 56, w: 28, h: 32 },
        photoBounds: { x: 14, y: 61, w: 26, h: 35 }
      },
      {
        id: 'zone-msi-pcie-m2',
        name: 'Khe PCIe 4.0 Steel Armor & M.2 Shield Frozr',
        description: 'Khe cắm cạc đồ họa bọc thép hàn điểm xuyên mạch chống gãy xé PCB',
        color: '#0891b2',
        bounds2d: { x: 12, y: 48, w: 46, h: 44 },
        photoBounds: { x: 4, y: 2, w: 41, h: 60 }
      }
    ],
    rails: [
      {
        id: 'rail-msi-12v',
        name: '+12V_CPU',
        nominalVoltage: '+12.0V',
        category: 'main_power',
        color: '#ef4444',
        description: 'Đường cấp nguồn 12V từ cổng EPS 8-pin dẫn vào chân VIN DrMOS',
        connectedComponents: ['JEPS8', 'PQ301', 'PQ302']
      },
      {
        id: 'rail-vddcr-cpu',
        name: 'VDDCR_CPU',
        nominalVoltage: '+1.20V',
        category: 'core_power',
        color: '#10b981',
        description: 'Điện áp cấp cho các lõi tính toán Zen 3 (Vcore)',
        connectedComponents: ['PL301', 'CPU1']
      },
      {
        id: 'rail-vddcr-soc',
        name: 'VDDCR_SOC',
        nominalVoltage: '+1.05V',
        category: 'core_power',
        color: '#06b6d4',
        description: 'Điện áp cấp cho nhân đồ họa Vega tích hợp và bộ điều khiển RAM IMC của AMD',
        connectedComponents: ['PQ302', 'CPU1']
      },
      {
        id: 'rail-msi-5valw',
        name: '+5V_ALW',
        nominalVoltage: '+5.0V',
        category: 'standby',
        color: '#8b5cf6',
        description: 'Nguồn 5V luôn có hạ từ 5VSB qua IC RT7291A nuôi mạch đèn LED và cảm biến',
        connectedComponents: ['PU_5VALW', 'U_SIO']
      },
      {
        id: 'rail-msi-gnd',
        name: 'GND',
        nominalVoltage: '0V',
        category: 'ground',
        color: '#475569',
        description: 'Mặt phẳng mass chung toàn bo',
        connectedComponents: ['JATX24', 'JEPS8', 'CPU1', 'PCH1', 'U_SIO']
      }
    ],
    components: [
      {
        id: 'CPU1',
        label: 'CPU1',
        kind: 'cpu_socket',
        zone: 'zone-am4-socket',
        description: 'Đế cắm vi xử lý Socket AM4 1331 chân cắm PGA hỗ trợ Ryzen 3000/4000G/5000.',
        partNumber: 'LOTES-AM4-PGA1331',
        specs: '1331 pins PGA, ngàm khóa gạt kim loại mạ niken',
        pos3d: { x: 0, y: 0, z: -10, w: 22, d: 24, h: 4, color: '#475569' },
        pos2d: { x: 38, y: 14, w: 22, h: 26 },
        photoPos: { x: 58.5, y: 41, w: 17.5, h: 20.5 },
        schematicPos: { x: 620, y: 220 },
        pins: [
          { pin: 'VDDCR_CPU', name: 'CORE_VCC', net: 'rail-vddcr-cpu', expectedVoltage: '1.20V', expectedDiodeDrop: '0.015V', expectedResistance: '2.0 Ohm' },
          { pin: 'VDDCR_SOC', name: 'SOC_VCC', net: 'rail-vddcr-soc', expectedVoltage: '1.05V', expectedDiodeDrop: '0.035V', expectedResistance: '8.5 Ohm' },
          { pin: 'GND', name: 'VSS', net: 'rail-msi-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Chân socket PGA bên trong bị kẹt tụt lún dẫn đến CPU không tiếp xúc nhận đủ RAM kênh đôi',
          'Đứt mạch ngầm dưới đáy socket do vặn ốc tản nhiệt quá chặt làm cong vênh PCB'
        ],
        replacementTips: 'Dùng máy hàn chip chuyên dụng AM4 với khuôn giữ mặt lưng bo mạch chống phồng rộp.',
        normalTempC: 45,
        faultTempC: 92
      },
      {
        id: 'PU301',
        label: 'PU301',
        kind: 'pwm_ic',
        zone: 'zone-msi-vrm',
        description: 'IC điều khiển PWM kỹ thuật số Renesas đa pha cấu hình cho nền tảng AMD SVI2.',
        partNumber: 'Renesas RAA229004',
        specs: 'QFN-56, 8-Phase Digital Controller, giao thức SVI2 AMD Bus',
        pos3d: { x: -28, y: 0, z: -24, w: 6.5, d: 6.5, h: 1.2, color: '#1e293b' },
        pos2d: { x: 12, y: 12, w: 6, h: 6 },
        schematicPos: { x: 260, y: 200 },
        pins: [
          { pin: 'VCC', name: 'VCC_5V', net: 'rail-msi-5valw', expectedVoltage: '5.00V', expectedDiodeDrop: '0.510V' },
          { pin: 'SVD', name: 'SVI2_DATA', net: 'rail-vddcr-cpu', expectedVoltage: '1.80V', expectedDiodeDrop: '0.620V', waveformHint: 'Giao tiếp chuỗi dữ liệu SVI2 giữa CPU và VRM' },
          { pin: 'SVC', name: 'SVI2_CLK', net: 'rail-vddcr-cpu', expectedVoltage: '1.80V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Lỗi không đàm thoại được tín hiệu SVI2 với CPU làm VRM không xuất áp Vcore'],
        replacementTips: 'Nạp lại BIOS trước khi thay IC vì vi mã AMD AGESA quản lý thông số SVI2 rất chặt.',
        normalTempC: 50,
        faultTempC: 85
      },
      {
        id: 'PQ301',
        label: 'PQ301',
        kind: 'drmos',
        zone: 'zone-msi-vrm',
        description: 'IC DrMOS thông minh cấp nguồn cho các pha VDDCR_CPU.',
        partNumber: 'Intersil ISL99360',
        specs: '60A Smart Power Stage, QFN-32 package, 5.0V PWM logic',
        pos3d: { x: -26, y: 0, z: -14, w: 5, d: 5, h: 1.1, color: '#0f172a' },
        pos2d: { x: 14, y: 22, w: 5, h: 5 },
        photoPos: { x: 58, y: 22, w: 9, h: 9 },
        photoNote: 'Khu vực DrMOS Vcore (che bởi tản nhiệt Extended Heatsink phía trên)',
        schematicPos: { x: 380, y: 180 },
        pins: [
          { pin: 'VIN', name: 'VIN_12V', net: 'rail-msi-12v', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 40 kOhm' },
          { pin: 'SW', name: 'PHASE_OUT', net: 'rail-vddcr-cpu', expectedVoltage: '1.20V', expectedDiodeDrop: '0.015V' }
        ],
        commonFailureModes: ['Đánh thủng cực High-side chập nguồn 12V_CPU', 'Chết ngắt pha làm máy sập nguồn khi chạy Benchmark nặng'],
        replacementTips: 'Thay thế bằng ISL99360 hoặc FDMF3035 tương thích footprint.',
        normalTempC: 56,
        faultTempC: 110
      },
      {
        id: 'PQ302',
        label: 'PQ302',
        kind: 'drmos',
        zone: 'zone-msi-vrm',
        description: 'IC DrMOS cấp nguồn cho pha phụ VDDCR_SOC.',
        partNumber: 'Intersil ISL99360',
        specs: '60A DrMOS, cấp nguồn nhân đồ họa tích hợp',
        pos3d: { x: -26, y: 0, z: -6, w: 5, d: 5, h: 1.1, color: '#0f172a' },
        pos2d: { x: 14, y: 30, w: 5, h: 5 },
        photoPos: { x: 89, y: 42, w: 8, h: 11 },
        photoNote: 'Khu vực DrMOS SOC (che bởi tản nhiệt VRM bên phải)',
        schematicPos: { x: 380, y: 260 },
        pins: [
          { pin: 'VIN', name: 'VIN_12V', net: 'rail-msi-12v', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V' },
          { pin: 'SW', name: 'PHASE_SOC', net: 'rail-vddcr-soc', expectedVoltage: '1.05V', expectedDiodeDrop: '0.035V' }
        ],
        commonFailureModes: ['Chập đường nguồn SOC làm quạt quay nhưng đèn EZ Debug LED dừng lại ở CPU hoặc VGA'],
        replacementTips: 'Đo kiểm kỹ đường SOC trước khi thay thế CPU mới.',
        normalTempC: 52,
        faultTempC: 100
      },
      {
        id: 'PL301',
        label: 'PL301',
        kind: 'inductor',
        zone: 'zone-msi-vrm',
        description: 'Cuộn cảm hợp kim Titanium Choke II dẫn dòng Vcore siêu bền.',
        partNumber: 'MSI-TITANIUM-CHOKE-R22',
        specs: '0.22uH, dòng bão hòa 60A',
        pos3d: { x: -16, y: 0, z: -14, w: 6, d: 6, h: 5, color: '#334155' },
        pos2d: { x: 22, y: 22, w: 5, h: 5 },
        photoPos: { x: 69, y: 22, w: 9, h: 9 },
        photoNote: 'Hàng cuộn cảm R22 nằm ngay dưới tản nhiệt VRM trên, tụ lọc 561 lộ ở viền dưới',
        schematicPos: { x: 480, y: 190 },
        pins: [
          { pin: '1', name: 'SW', net: 'rail-vddcr-cpu', expectedVoltage: '1.20V', expectedDiodeDrop: '0.015V' },
          { pin: '2', name: 'OUT', net: 'rail-vddcr-cpu', expectedVoltage: '1.20V', expectedDiodeDrop: '0.015V' }
        ],
        commonFailureModes: ['Bong chân mối hàn do nhiệt độ cao kéo dài'],
        replacementTips: 'Gia nhiệt đều bo mạch trước khi nhấc cuộn cảm.',
        normalTempC: 54,
        faultTempC: 85
      },
      {
        id: 'PCH1',
        label: 'PCH1',
        kind: 'chipset',
        zone: 'zone-amd-b550-pch',
        description: 'Chipset AMD B550 kết nối vi xử lý Ryzen qua đường liên kết PCIe 3.0 x4.',
        partNumber: '218-0891005 (AMD B550)',
        specs: 'BGA 7W TDP, hỗ trợ USB 3.2 Gen 2 và 6 cổng SATA',
        pos3d: { x: 26, y: 0, z: 20, w: 14, d: 14, h: 2, color: '#334155' },
        pos2d: { x: 68, y: 64, w: 16, h: 18 },
        photoPos: { x: 16, y: 64, w: 21, h: 27 },
        photoNote: 'Chipset B550 nằm dưới khối tản nhiệt nhôm TOMAHAWK',
        schematicPos: { x: 840, y: 460 },
        pins: [
          { pin: '1P05', name: 'VDD_1P05_PCH', net: 'rail-msi-5valw', expectedVoltage: '1.05V', expectedDiodeDrop: '0.280V', expectedResistance: '95 Ohm' },
          { pin: '3P3', name: 'VDD_3P3_PCH', net: 'rail-msi-5valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.380V', expectedResistance: '310 Ohm' }
        ],
        commonFailureModes: ['Cháy nổ do xông nguồn cổng USB ngoài hoặc cắm nhầm chân RGB 12V vào đầu ARGB 5V', 'Chập nội bộ PCH làm nóng bốc khói'],
        replacementTips: 'Thay chipset cần làm chân chì nhiệt độ chảy 183°C để hạn chế cong vênh mạch.',
        normalTempC: 46,
        faultTempC: 85
      },
      {
        id: 'U_BIOS',
        label: 'U_BIOS',
        kind: 'bios_chip',
        zone: 'zone-amd-b550-pch',
        description: 'IC nhớ SPI Flash chứa mã BIOS MSI Click BIOS 5 và hỗ trợ nút bấm Flash BIOS Button.',
        partNumber: 'Macronix MX25U25673G',
        specs: '256Mb (32MB), điện áp hoạt động 1.8V (Low Voltage SPI), SOP-8',
        pos3d: { x: 38, y: 0, z: 28, w: 4, d: 5, h: 1.2, color: '#09090b' },
        pos2d: { x: 82, y: 78, w: 5, h: 5 },
        schematicPos: { x: 980, y: 450 },
        pins: [
          { pin: '8', name: 'VCC_1V8', net: 'rail-msi-5valw', expectedVoltage: '1.80V', expectedDiodeDrop: '0.450V' },
          { pin: '1', name: 'CS#', net: 'rail-msi-5valw', expectedVoltage: '1.80V', expectedDiodeDrop: '0.610V' }
        ],
        commonFailureModes: ['Lỗi dữ liệu Flash ROM khiến bo mạch treo đèn LED CPU đỏ'],
        replacementTips: 'LƯU Ý: Đây là chip BIOS 1.8V, nếu nạp bằng máy RT809/CH341A phải dùng đế chuyển đổi 1.8V Adapter, cắm trực tiếp 3.3V sẽ cháy chip ngay!',
        normalTempC: 38,
        faultTempC: 60
      },
      {
        id: 'U_SIO',
        label: 'U_SIO',
        kind: 'super_io',
        zone: 'zone-msi-pcie-m2',
        description: 'IC Super I/O Nuvoton quản lý logic khởi động và 4 đèn báo lỗi EZ Debug LED.',
        partNumber: 'Nuvoton NCT6687D-M',
        specs: 'QFP-128, MSI Custom Super I/O Firmware',
        pos3d: { x: -36, y: 0, z: 22, w: 9, d: 9, h: 1.5, color: '#18181b' },
        pos2d: { x: 8, y: 68, w: 9, h: 9 },
        photoPos: { x: 22.8, y: 4.2, w: 5.5, h: 6.5 },
        photoNote: 'IC Nuvoton NCT6687D lộ rõ trực tiếp trên mặt mạch góc trên-trái',
        schematicPos: { x: 120, y: 480 },
        pins: [
          { pin: '3VSB', name: 'VCC_3VSB', net: 'rail-msi-5valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.480V' },
          { pin: 'PWRBTN', name: 'PWRBTN#', net: 'rail-msi-5valw', expectedVoltage: '3.30V', expectedDiodeDrop: '0.650V' }
        ],
        commonFailureModes: ['Hỏng mạch điều khiển đèn EZ Debug LED hoặc đứt đường tín hiệu cảm biến nhiệt CPU'],
        replacementTips: 'Kiểm tra đường trở xả 8.2k trước khi thay SIO.',
        normalTempC: 41,
        faultTempC: 75
      },
      {
        id: 'JATX24',
        label: 'JATX24',
        kind: 'atx_24pin',
        zone: 'zone-ddr4-bank',
        description: 'Đầu nối nguồn chính ATX 24 chân.',
        partNumber: 'ATX-24P-BLACK',
        specs: '24-Pin Standard ATX Socket',
        pos3d: { x: 44, y: 0, z: -10, w: 8, d: 26, h: 10, color: '#09090b' },
        pos2d: { x: 92, y: 14, w: 6, h: 28 },
        photoPos: { x: 56, y: 90.5, w: 16.5, h: 6.5 },
        schematicPos: { x: 80, y: 120 },
        pins: [
          { pin: '9', name: '5VSB', net: 'rail-msi-5valw', expectedVoltage: '5.05V', expectedDiodeDrop: '0.510V' },
          { pin: 'GND', name: 'COM_GND', net: 'rail-msi-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Oxi hóa chân tiếp xúc do ẩm mốc môi trường'],
        replacementTips: 'Vệ sinh và bôi mỡ silicon bảo vệ chống rỉ sét.',
        normalTempC: 34,
        faultTempC: 75
      },
      {
        id: 'JEPS8',
        label: 'JEPS8',
        kind: 'eps_8pin',
        zone: 'zone-msi-vrm',
        description: 'Cổng cấp nguồn CPU 8-pin + 4-pin phụ trợ.',
        partNumber: 'EPS-8P4P-COMBO',
        specs: '8+4 Pin 12V EPS Connector',
        pos3d: { x: -38, y: 0, z: -32, w: 10, d: 14, h: 9, color: '#09090b' },
        pos2d: { x: 8, y: 4, w: 12, h: 8 },
        photoPos: { x: 90.5, y: 24, w: 6, h: 7 },
        schematicPos: { x: 80, y: 240 },
        pins: [
          { pin: '12V', name: '12V_IN', net: 'rail-msi-12v', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V' }
        ],
        commonFailureModes: ['Nhiệt tải cao làm biến dạng chân nhựa nếu dùng nguồn noname dây dẫn mỏng'],
        replacementTips: 'Dùng mỏ hàn công suất cao thay thế chân cắm.',
        normalTempC: 36,
        faultTempC: 80
      },
      {
        id: 'DIMM_A2',
        label: 'DIMM_A2',
        kind: 'ram_slot',
        zone: 'zone-ddr4-bank',
        description: 'Khe cắm DDR4 kênh A chính, hỗ trợ cấu hình XMP.',
        partNumber: 'DDR4-SMT-A2',
        specs: '288 Pins DDR4 DIMM',
        pos3d: { x: 20, y: 0, z: -10, w: 4, d: 34, h: 7, color: '#09090b' },
        pos2d: { x: 74, y: 12, w: 4, h: 32 },
        photoPos: { x: 44.5, y: 76.2, w: 43.5, h: 2.8 },
        schematicPos: { x: 780, y: 140 },
        pins: [
          { pin: 'VDD', name: '1V2_RAM', net: 'rail-vddcr-soc', expectedVoltage: '1.20V', expectedDiodeDrop: '0.360V' }
        ],
        commonFailureModes: ['Bụi bẩn bám chân làm sáng đèn EZ Debug LED DRAM'],
        replacementTips: 'Rửa sạch bằng cồn Isopropyl 99% và sấy khô hoàn toàn.',
        normalTempC: 35,
        faultTempC: 60
      },
      {
        id: 'PCIE_1',
        label: 'PCIE_1',
        kind: 'pcie_slot',
        zone: 'zone-msi-pcie-m2',
        description: 'Khe cắm cạc đồ họa PCIe 4.0 x16 Steel Armor bọc kim loại.',
        partNumber: 'PCIE-GEN4-STEEL-ARMOR',
        specs: 'PCIe 4.0 x16, bọc giáp thép chịu lực gắn qua lỗ xuyên PCB',
        pos3d: { x: -8, y: 0, z: 12, w: 38, d: 4, h: 6, color: '#94a3b8' },
        pos2d: { x: 18, y: 56, w: 42, h: 4 },
        photoPos: { x: 36.2, y: 21.5, w: 4.2, h: 37.5 },
        schematicPos: { x: 740, y: 620 },
        pins: [
          { pin: '12V', name: '12V_BUS', net: 'rail-msi-12v', expectedVoltage: '12.00V', expectedDiodeDrop: '0.480V' }
        ],
        commonFailureModes: ['Mẻ vỡ đầu giáp bảo vệ do cố bẻ cạc màn hình khi chưa nhả chốt'],
        replacementTips: 'Hàn lại các chân tiếp địa xung quanh vỏ giáp.',
        normalTempC: 36,
        faultTempC: 68
      },
      {
        id: 'PU_5VALW',
        label: 'PU_5VALW',
        kind: 'pwm_ic',
        zone: 'zone-amd-b550-pch',
        description: 'IC hạ áp đồng bộ tạo nguồn 5V Standby ổn định.',
        partNumber: 'Richtek RT7291A',
        specs: 'TSOT-23-8, 6A Synchronous Step-Down Converter',
        pos3d: { x: 34, y: 0, z: 12, w: 3.5, d: 3.5, h: 1.0, color: '#111827' },
        pos2d: { x: 76, y: 52, w: 4, h: 4 },
        schematicPos: { x: 300, y: 440 },
        pins: [
          { pin: 'VIN', name: '5VSB_IN', net: 'rail-msi-5valw', expectedVoltage: '5.05V', expectedDiodeDrop: '0.510V' },
          { pin: 'VOUT', name: '5V_OUT', net: 'rail-msi-5valw', expectedVoltage: '5.00V', expectedDiodeDrop: '0.420V' }
        ],
        commonFailureModes: ['Nổ thủng lưng IC do xung điện lan truyền từ sạc điện thoại cắm cổng USB'],
        replacementTips: 'Thay đúng IC RT7291A hoặc TPS54331 cấu hình tương đương.',
        normalTempC: 46,
        faultTempC: 95
      }
    ],
    wires: [
      { id: 'w301', netId: 'rail-msi-12v', fromComponentId: 'JEPS8', fromPin: '12V', toComponentId: 'PQ301', toPin: 'VIN' },
      { id: 'w302', netId: 'rail-msi-12v', fromComponentId: 'JEPS8', fromPin: '12V', toComponentId: 'PQ302', toPin: 'VIN' },
      { id: 'w303', netId: 'rail-vddcr-cpu', fromComponentId: 'PQ301', fromPin: 'SW', toComponentId: 'PL301', toPin: '1' },
      { id: 'w304', netId: 'rail-vddcr-cpu', fromComponentId: 'PL301', fromPin: '2', toComponentId: 'CPU1', toPin: 'VDDCR_CPU' },
      { id: 'w305', netId: 'rail-vddcr-soc', fromComponentId: 'PQ302', fromPin: 'SW', toComponentId: 'CPU1', toPin: 'VDDCR_SOC' },
      { id: 'w306', netId: 'rail-msi-5valw', fromComponentId: 'PU_5VALW', fromPin: 'VOUT', toComponentId: 'U_SIO', toPin: '3VSB' }
    ]
  },

  // =========================================================================
  // 4. ASROCK H81M-DGS (Intel LGA1150 / Dòng H61-H81-B85 Kinh Điển)
  // =========================================================================
  {
    id: 'asrock-h81m-dgs',
    name: 'ASRock H81M-DGS (H61-H81-B85 Cổ Điển)',
    brand: 'ASRock',
    category: 'motherboard',
    generation: 'Intel LGA1150 (Haswell / Haswell Refresh Core 4th Gen)',
    formFactor: 'Micro-ATX (191mm x 170mm)',
    pcbColor: '#0a0a0c',
    pcbSize: { width: 75, depth: 68, thickness: 1.6 },
    powerSequenceId: 'seq-intel-legacy-h81',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (ISL95812 / NCT6776D / DH82H81)',
      missingDataNote:
        'Chưa có ảnh chụp thực tế bản quyền mở cho ASRock H81M-DGS nên phần Ảnh Thực Tế được để trống; Sơ đồ nguyên lý mô tả trình tự nguồn tham chiếu dựa trên nền tảng Intel Lynx Point H81.',
    },
    summary: 'Bo mạch chủ socket LGA1150 kinh điển trong các phòng net và máy văn phòng Việt Nam. Sử dụng dàn nguồn VRM 3 pha điều khiển bởi IC Intersil ISL95812, chipset DH82H81 Lynx Point, Super I/O Nuvoton NCT6776D, chip âm thanh/LAN Realtek và khối dao động thạch anh RTC 32.768kHz.',
    safetyWarning: 'BỆNH KINH ĐIỂN DÒNG H81: Mất nguồn 3V Pin CMOS CR2032 hoặc chết thạch anh 32.768kHz sẽ khiến mạch RTC tê liệt làm bo mạch hoàn toàn không kích được nguồn! Luôn kiểm tra pin CMOS và trở bẹ trước tiên.',
    zones: [
      {
        id: 'zone-h81-vrm',
        name: 'Dàn VRM VCORE 3 Pha Truyền Thống',
        description: '3 pha PWM dùng MOSFET Nikos chân hàn D-PAK / SO-8 và tụ lọc thể rắn 820uF 2.5V',
        color: '#dc2626',
        bounds2d: { x: 8, y: 12, w: 28, h: 36 }
      },
      {
        id: 'zone-socket-1150',
        name: 'Socket CPU LGA1150',
        description: 'Đế socket 1150 chân tiếp xúc cho chip Intel Haswell (i3-4150, i5-4460, Xeon E3-1231v3)',
        color: '#2563eb',
        bounds2d: { x: 38, y: 14, w: 26, h: 30 }
      },
      {
        id: 'zone-ddr3-slots',
        name: '2 Khe Cắm DDR3 & Nguồn 1.5V',
        description: '2 khe DDR3 1600MHz và mạch nguồn xung 1.5V RAM',
        color: '#16a34a',
        bounds2d: { x: 68, y: 10, w: 24, h: 38 }
      },
      {
        id: 'zone-pch-h81',
        name: 'Chipset Intel H81 & Mạch RTC 3V',
        description: 'PCH Intel DH82H81, khay pin CMOS CR2032, thạch anh ống 32.768kHz và BIOS DIP-8',
        color: '#9333ea',
        bounds2d: { x: 60, y: 56, w: 30, h: 34 }
      },
      {
        id: 'zone-sio-nct6776',
        name: 'Super I/O & Mạng Realtek LAN',
        description: 'IC Nuvoton NCT6776D điều khiển kích nguồn và IC Realtek RTL8111G mạng Gigabit',
        color: '#ea580c',
        bounds2d: { x: 8, y: 52, w: 26, h: 40 }
      }
    ],
    rails: [
      {
        id: 'rail-h81-12v',
        name: '12V_CPU',
        nominalVoltage: '+12.0V',
        category: 'main_power',
        color: '#ef4444',
        description: 'Nguồn 12V từ giắc cắm ATX 4-Pin cấp cho High-side MOSFET VRM',
        connectedComponents: ['JATX4', 'PQ401']
      },
      {
        id: 'rail-vccin-h81',
        name: 'VCCIN_1V8',
        nominalVoltage: '+1.78V',
        category: 'core_power',
        color: '#10b981',
        description: 'Điện áp đầu vào VCCIN cấp cho vi điều khiển nguồn FIVR tích hợp bên trong CPU Haswell',
        connectedComponents: ['PL401', 'PC401', 'CPU1']
      },
      {
        id: 'rail-h81-3vbat',
        name: 'VBAT_RTC',
        nominalVoltage: '+3.0V',
        category: 'standby',
        color: '#f59e0b',
        description: 'Điện áp 3V nuôi khối Real Time Clock từ pin cúc áo CR2032 và thạch anh',
        connectedComponents: ['BAT_CMOS', 'Y_RTC', 'PCH1']
      },
      {
        id: 'rail-h81-5vsb',
        name: '+5VSB',
        nominalVoltage: '+5.0V',
        category: 'standby',
        color: '#8b5cf6',
        description: 'Nguồn chờ 5V từ chân 9 cổng ATX 24 chân',
        connectedComponents: ['JATX24', 'U_SIO']
      },
      {
        id: 'rail-h81-gnd',
        name: 'GND',
        nominalVoltage: '0V',
        category: 'ground',
        color: '#475569',
        description: 'Mass chung toàn bo mạch',
        connectedComponents: ['JATX24', 'JATX4', 'CPU1', 'PQ402', 'PC401', 'PCH1', 'BAT_CMOS']
      }
    ],
    components: [
      {
        id: 'CPU1',
        label: 'CPU1',
        kind: 'cpu_socket',
        zone: 'zone-socket-1150',
        description: 'Socket CPU LGA1150 (Haswell) tích hợp bộ điều áp FIVR (Fully Integrated Voltage Regulator).',
        partNumber: 'LOTES-LGA1150',
        specs: '1150 pins LGA, VCCIN danh định 1.75V - 1.85V',
        pos3d: { x: 0, y: 0, z: -8, w: 18, d: 20, h: 3.5, color: '#475569' },
        pos2d: { x: 40, y: 16, w: 20, h: 24 },
        schematicPos: { x: 620, y: 220 },
        pins: [
          { pin: 'VCCIN', name: 'VCCIN_INPUT', net: 'rail-vccin-h81', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V', expectedResistance: '12 - 25 Ohm' },
          { pin: 'VSS', name: 'GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Chết bộ FIVR tích hợp bên trong CPU khiến đường VCCIN chập thẳng về mass (0.000V diode drop)',
          'Gãy chân socket khi tháo nắp bảo vệ bằng nhựa'
        ],
        replacementTips: 'Lắp CPU test giá rẻ (Pentium G3220/G3250) vào thử trước khi cắm chip Core i7 đắt tiền.',
        normalTempC: 45,
        faultTempC: 90
      },
      {
        id: 'PU401',
        label: 'PU401',
        kind: 'pwm_ic',
        zone: 'zone-h81-vrm',
        description: 'IC điều khiển PWM nguồn VCCIN Haswell 3 pha tích hợp Driver.',
        partNumber: 'Intersil ISL95812HRZ',
        specs: 'QFN-32, 1-3 Phase PWM Controller for Intel VR12.5/Haswell',
        pos3d: { x: -24, y: 0, z: -18, w: 5, d: 5, h: 1.0, color: '#1e293b' },
        pos2d: { x: 14, y: 16, w: 5, h: 5 },
        schematicPos: { x: 260, y: 200 },
        pins: [
          { pin: 'VDD', name: '5V_VCC', net: 'rail-h81-5vsb', expectedVoltage: '5.00V', expectedDiodeDrop: '0.510V' },
          { pin: 'UGATE1', name: 'HIGH_GATE', net: 'rail-h81-12v', expectedVoltage: '2.40V', expectedDiodeDrop: '0.620V' },
          { pin: 'LGATE1', name: 'LOW_GATE', net: 'rail-vccin-h81', expectedVoltage: '3.10V', expectedDiodeDrop: '0.610V' }
        ],
        commonFailureModes: ['Mất lệnh VR_ON từ SIO khiến IC không phát xung điều khiển MOSFET'],
        replacementTips: 'Có thể lấy từ xác main H81 Asus hoặc Gigabyte cùng dùng IC ISL95812.',
        normalTempC: 48,
        faultTempC: 85
      },
      {
        id: 'PQ401',
        label: 'PQ401',
        kind: 'mosfet',
        zone: 'zone-h81-vrm',
        description: 'MOSFET kênh N phân cực trên (High-side) cấp nguồn 12V cho pha 1.',
        partNumber: 'Nikos PZ1029 (PK616BA)',
        specs: 'N-Channel, 30V, 50A, TO-252 (D-PAK) / DFN, Rds(on) 8.5 mOhm',
        pos3d: { x: -22, y: 0, z: -10, w: 4.5, d: 4.5, h: 1.2, color: '#0f172a' },
        pos2d: { x: 16, y: 24, w: 4.5, h: 4.5 },
        schematicPos: { x: 380, y: 160 },
        pins: [
          { pin: 'D', name: 'DRAIN_12V', net: 'rail-h81-12v', expectedVoltage: '12.05V', expectedDiodeDrop: '0.480V', expectedResistance: '> 20 kOhm' },
          { pin: 'S', name: 'SOURCE_SW', net: 'rail-vccin-h81', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V' },
          { pin: 'G', name: 'GATE', net: 'rail-h81-12v', expectedVoltage: '2.40V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: [
          'Đánh thủng D-S làm 12V thông thẳng vào đường VCCIN gây nổ CPU Haswell',
          'Đo thang đo thông mạch chân D và S kêu liên tục'
        ],
        replacementTips: 'Thay bằng 09N03LA, K3918 hoặc Nikos PK616BA tương đương.',
        normalTempC: 60,
        faultTempC: 115
      },
      {
        id: 'PQ402',
        label: 'PQ402',
        kind: 'mosfet',
        zone: 'zone-h81-vrm',
        description: 'MOSFET kênh N phân cực dưới (Low-side) dập mass pha 1.',
        partNumber: 'Nikos PZ1018 (PK632BA)',
        specs: 'N-Channel, 30V, 80A, Rds(on) 4.2 mOhm',
        pos3d: { x: -22, y: 0, z: -4, w: 4.5, d: 4.5, h: 1.2, color: '#0f172a' },
        pos2d: { x: 16, y: 32, w: 4.5, h: 4.5 },
        schematicPos: { x: 380, y: 260 },
        pins: [
          { pin: 'D', name: 'DRAIN_SW', net: 'rail-vccin-h81', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V' },
          { pin: 'S', name: 'SOURCE_GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập D-S làm sụt áp VCCIN về mass, nguồn ATX sập ngay khi kích'],
        replacementTips: 'Thay bằng 06N03LA hoặc K3919.',
        normalTempC: 55,
        faultTempC: 105
      },
      {
        id: 'PL401',
        label: 'PL401',
        kind: 'inductor',
        zone: 'zone-h81-vrm',
        description: 'Cuộn cảm cuộn dây lõi ferit đúc R56.',
        partNumber: 'R56-POWER-INDUCTOR',
        specs: '0.56uH, 40A',
        pos3d: { x: -14, y: 0, z: -8, w: 5, d: 5, h: 4, color: '#334155' },
        pos2d: { x: 24, y: 26, w: 5, h: 5 },
        schematicPos: { x: 480, y: 210 },
        pins: [
          { pin: '1', name: 'SW', net: 'rail-h81-12v', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V' },
          { pin: '2', name: 'OUT', net: 'rail-vccin-h81', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V' }
        ],
        commonFailureModes: ['Bong chân chì do nhiệt'],
        replacementTips: 'Vuốt lại chân bằng thiếc có chì 63/37.',
        normalTempC: 52,
        faultTempC: 80
      },
      {
        id: 'PC401',
        label: 'PC401',
        kind: 'capacitor_solid',
        zone: 'zone-h81-vrm',
        description: 'Tụ rắn Nichicon nhôm dẫn điện lọc nguồn ngõ ra VCCIN.',
        partNumber: 'Nichicon LF 820uF 2.5V',
        specs: '820uF, 2.5V, Low ESR Solid Electrolytic',
        pos3d: { x: -8, y: 0, z: -8, w: 3.5, d: 3.5, h: 6, color: '#1e293b' },
        pos2d: { x: 30, y: 26, w: 4, h: 4.5 },
        schematicPos: { x: 550, y: 210 },
        pins: [
          { pin: '+', name: 'POS', net: 'rail-vccin-h81', expectedVoltage: '1.78V', expectedDiodeDrop: '0.045V' },
          { pin: '-', name: 'NEG', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Nổ thủng đít tụ hoặc chập tụ làm kéo sụt nguồn VCCIN'],
        replacementTips: 'Thay bằng tụ rắn 560uF - 820uF 2.5V hoặc 6.3V.',
        normalTempC: 45,
        faultTempC: 90
      },
      {
        id: 'PCH1',
        label: 'PCH1',
        kind: 'chipset',
        zone: 'zone-pch-h81',
        description: 'Chip cầu nam Intel DH82H81 Lynx Point kiến trúc 32nm.',
        partNumber: 'DH82H81 (SR13B / SR177)',
        specs: 'FCBGA659, TDP 4.1W',
        pos3d: { x: 22, y: 0, z: 18, w: 12, d: 12, h: 2, color: '#334155' },
        pos2d: { x: 68, y: 65, w: 14, h: 16 },
        schematicPos: { x: 820, y: 460 },
        pins: [
          { pin: 'RTCX1', name: 'RTC_X1', net: 'rail-h81-3vbat', expectedVoltage: '0.45V', expectedDiodeDrop: '0.620V', waveformHint: 'Xung hình sin 32.768kHz sạch' },
          { pin: 'VCC_RTC', name: 'VCC_RTC', net: 'rail-h81-3vbat', expectedVoltage: '3.00V', expectedDiodeDrop: '0.550V' }
        ],
        commonFailureModes: [
          'Chết khối RTC bên trong PCH làm bo mạch câm nín hoàn toàn không kích được nguồn',
          'Chập nguồn 1.05V PCH làm nóng bỏng tay khi vừa cắm nguồn 24-pin'
        ],
        replacementTips: 'Dùng máy đóng chip nhấc PCH cũ ra, bôi mỡ hàn làm sạch chân mạch và thay chip H81 mới.',
        normalTempC: 50,
        faultTempC: 90
      },
      {
        id: 'U_BIOS',
        label: 'U_BIOS',
        kind: 'bios_chip',
        zone: 'zone-pch-h81',
        description: 'Chip BIOS cắm chân DIP-8 hoặc dán SOIC-8 chứa vi mã ASRock Instant Flash.',
        partNumber: 'Winbond W25Q64FVSIG',
        specs: '64Mb (8MB), 3.3V SPI Flash, chân cắm DIP-8 có socket tiện tháo lắp',
        pos3d: { x: 30, y: 0, z: 26, w: 4, d: 6, h: 3, color: '#09090b' },
        pos2d: { x: 80, y: 78, w: 4, h: 6 },
        schematicPos: { x: 960, y: 450 },
        pins: [
          { pin: '8', name: 'VCC', net: 'rail-h81-5vsb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.480V' },
          { pin: '1', name: 'CS#', net: 'rail-h81-5vsb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Lỗi dữ liệu BIOS do virus hoặc pin CMOS hết điện lâu ngày làm sai lệch cấu hình'],
        replacementTips: 'Rút chip khỏi đế socket cắm vào máy nạp CH341A nạp lại file ROM gốc từ ASRock chỉ mất 2 phút.',
        normalTempC: 35,
        faultTempC: 55
      },
      {
        id: 'U_SIO',
        label: 'U_SIO',
        kind: 'super_io',
        zone: 'zone-sio-nct6776',
        description: 'IC Super I/O Nuvoton quản lý kích nguồn và cổng PS/2, COM.',
        partNumber: 'Nuvoton NCT6776D',
        specs: 'QFP-128, LPC I/O',
        pos3d: { x: -28, y: 0, z: 18, w: 8, d: 8, h: 1.4, color: '#18181b' },
        pos2d: { x: 12, y: 68, w: 8, h: 8 },
        schematicPos: { x: 140, y: 460 },
        pins: [
          { pin: '3VSB', name: '3VSB', net: 'rail-h81-5vsb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.480V' },
          { pin: 'PSON#', name: 'PSON#', net: 'rail-h81-5vsb', expectedVoltage: '0.05V / 5.0V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Chết đường kích nguồn chân 61/67 khiến bấm nút Power không có phản ứng'],
        replacementTips: 'Vuốt chân cẩn thận bằng mỏ hàn vát và thiếc mềm.',
        normalTempC: 40,
        faultTempC: 75
      },
      {
        id: 'Y_RTC',
        label: 'Y_RTC',
        kind: 'resistor',
        zone: 'zone-pch-h81',
        description: 'Thạch anh hình trụ ống (Cylinder Crystal) dao động chuẩn 32.768kHz cho khối thời gian thực RTC PCH.',
        partNumber: 'DT-26 32.768kHz',
        specs: 'Tần số 32.768kHz, điện dung tải 12.5pF, kích thước 2x6mm',
        pos3d: { x: 26, y: 0, z: 26, w: 2, d: 5, h: 2, color: '#94a3b8' },
        pos2d: { x: 74, y: 76, w: 2.5, h: 4 },
        schematicPos: { x: 740, y: 460 },
        pins: [
          { pin: '1', name: 'OSC_IN', net: 'rail-h81-3vbat', expectedVoltage: '0.45V', expectedDiodeDrop: '0.620V', waveformHint: 'Dao động sin 32.768kHz Vpp ~ 0.5V' },
          { pin: '2', name: 'OSC_OUT', net: 'rail-h81-3vbat', expectedVoltage: '0.45V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: [
          'Chết ngưng dao động thạch anh làm bo mạch hoàn toàn không thể kích được nguồn (bệnh đặc thù H61/H81)',
          'Sai tần số làm đồng hồ Windows chạy chậm hoặc đơ máy'
        ],
        replacementTips: 'Lấy từ xác mainboard bất kỳ (hầu hết main PC đều dùng thạch anh ống 32.768kHz).',
        normalTempC: 30,
        faultTempC: 45
      },
      {
        id: 'BAT_CMOS',
        label: 'BAT_CMOS',
        kind: 'connector',
        zone: 'zone-pch-h81',
        description: 'Đế cài pin cúc áo Lithium 3V CR2032 nuôi mạch nhớ CMOS SRAM.',
        partNumber: 'CR2032-SMD-HOLDER',
        specs: 'Khay pin đồng mạ niken đàn hồi giữ pin CR2032 3.0V',
        pos3d: { x: 18, y: 0, z: 26, w: 6, d: 6, h: 2.5, color: '#f8fafc' },
        pos2d: { x: 62, y: 76, w: 6, h: 6 },
        schematicPos: { x: 660, y: 460 },
        pins: [
          { pin: '+', name: '+3V_BAT', net: 'rail-h81-3vbat', expectedVoltage: '3.10V - 3.30V (Pin mới)', expectedDiodeDrop: '0.580V', expectedResistance: '> 500 kOhm' },
          { pin: '-', name: 'GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Pin CMOS tụt áp dưới 2.0V làm máy reset cài đặt BIOS ngày giờ và không kích được nguồn trên một số dòng ASRock/Giga',
          'Lưỡi gà tiếp xúc cực dương bị gãy hoặc cong méo mất tiếp xúc'
        ],
        replacementTips: 'Thay pin CR2032 Maxell/Panasonic chính hãng; kiểm tra diode kép D_BAT chống sạc ngược vào pin.',
        normalTempC: 28,
        faultTempC: 40
      },
      {
        id: 'U_LAN',
        label: 'U_LAN',
        kind: 'ic',
        zone: 'zone-sio-nct6776',
        description: 'IC điều khiển mạng Ethernet Gigabit Realtek RTL8111G.',
        partNumber: 'Realtek RTL8111G',
        specs: 'QFN-32, 10/100/1000M Gigabit Controller, PCIe interface',
        pos3d: { x: -34, y: 0, z: 4, w: 4.5, d: 4.5, h: 1.0, color: '#1e293b' },
        pos2d: { x: 6, y: 48, w: 5, h: 5 },
        schematicPos: { x: 140, y: 620 },
        pins: [
          { pin: 'VDD33', name: '3V3_LAN', net: 'rail-h81-5vsb', expectedVoltage: '3.30V', expectedDiodeDrop: '0.450V' },
          { pin: 'GND', name: 'GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: [
          'Sét đánh theo đường dây mạng Internet qua biến áp lọc LAN xông vào làm nổ thủng lưng IC LAN',
          'IC LAN bị chập kéo sụt áp nguồn 3.3V Standby làm bo mạch không bật được nguồn hoặc chip LAN nóng bỏng tay'
        ],
        replacementTips: 'Dùng mỏ khò nhấc bỏ IC LAN bị chập ra; máy vẫn kích nguồn và lên hình bình thường (gắn thêm USB LAN hoặc card PCIe LAN).',
        normalTempC: 42,
        faultTempC: 90
      },
      {
        id: 'JATX24',
        label: 'JATX24',
        kind: 'atx_24pin',
        zone: 'zone-ddr3-slots',
        description: 'Cổng cắm nguồn chính 24-Pin ATX.',
        partNumber: 'ATX-24P-WHITE',
        specs: '24-pin vertical socket',
        pos3d: { x: 34, y: 0, z: -10, w: 6, d: 24, h: 9, color: '#f8fafc' },
        pos2d: { x: 88, y: 14, w: 5, h: 26 },
        schematicPos: { x: 80, y: 120 },
        pins: [
          { pin: '9', name: '5VSB', net: 'rail-h81-5vsb', expectedVoltage: '5.00V', expectedDiodeDrop: '0.510V' },
          { pin: 'GND', name: 'GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Cháy chân 12V do cắm nguồn cỏ tải nặng'],
        replacementTips: 'Hàn câu dây đồng nếu đứt mạch in dưới chân jack.',
        normalTempC: 32,
        faultTempC: 75
      },
      {
        id: 'JATX4',
        label: 'JATX4',
        kind: 'connector',
        zone: 'zone-h81-vrm',
        description: 'Cổng cắm nguồn CPU 12V 4-Pin.',
        partNumber: 'ATX-4P-12V',
        specs: '4-Pin 12V CPU Power Socket',
        pos3d: { x: -30, y: 0, z: -28, w: 6, d: 6, h: 8, color: '#f8fafc' },
        pos2d: { x: 10, y: 6, w: 6, h: 6 },
        schematicPos: { x: 80, y: 220 },
        pins: [
          { pin: '12V', name: '12V_CPU', net: 'rail-h81-12v', expectedVoltage: '12.00V', expectedDiodeDrop: '0.480V' },
          { pin: 'GND', name: 'GND', net: 'rail-h81-gnd', expectedVoltage: '0.00V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập 12V do nổ MOSFET VRM'],
        replacementTips: 'Đo thang Ohm trước khi gắn nguồn tránh nổ nguồn ATX.',
        normalTempC: 34,
        faultTempC: 75
      }
    ],
    wires: [
      { id: 'w401', netId: 'rail-h81-12v', fromComponentId: 'JATX4', fromPin: '12V', toComponentId: 'PQ401', toPin: 'D' },
      { id: 'w402', netId: 'rail-vccin-h81', fromComponentId: 'PQ401', fromPin: 'S', toComponentId: 'PL401', toPin: '1' },
      { id: 'w403', netId: 'rail-vccin-h81', fromComponentId: 'PQ402', fromPin: 'D', toComponentId: 'PL401', toPin: '1' },
      { id: 'w404', netId: 'rail-vccin-h81', fromComponentId: 'PL401', fromPin: '2', toComponentId: 'PC401', toPin: '+' },
      { id: 'w405', netId: 'rail-vccin-h81', fromComponentId: 'PC401', fromPin: '+', toComponentId: 'CPU1', toPin: 'VCCIN' },
      { id: 'w406', netId: 'rail-h81-3vbat', fromComponentId: 'BAT_CMOS', fromPin: '+', toComponentId: 'PCH1', toPin: 'VCC_RTC' },
      { id: 'w407', netId: 'rail-h81-3vbat', fromComponentId: 'Y_RTC', fromPin: '1', toComponentId: 'PCH1', toPin: 'RTCX1' },
      { id: 'w408', netId: 'rail-h81-5vsb', fromComponentId: 'JATX24', fromPin: '9', toComponentId: 'U_SIO', toPin: '3VSB' }
    ]
  }
];
