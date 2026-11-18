import { HardwareBoard } from '../../types/circuit';

export const PSU_BOARDS: HardwareBoard[] = [
  // =========================================================================
  // 1. CORSAIR RM750x (Active PFC + LLC Half-Bridge + SR 12V + Module DC-DC)
  // =========================================================================
  {
    id: 'corsair-rm750x',
    name: 'Corsair RM750x 750W 80 Plus Gold',
    brand: 'Corsair',
    category: 'psu',
    generation: '80+ Gold LLC Resonant + DC-DC (CWT Type 4)',
    formFactor: 'ATX 150mm Modular',
    pcbColor: '#1a1f2c',
    pcbSize: { width: 96, depth: 78, thickness: 2.2 },
    summary: 'Bộ nguồn Corsair RM750x chuẩn 80 PLUS Gold cao cấp. Sử dụng kiến trúc lọc EMI 2 cấp, Active PFC nâng áp 390VDC ổn định, mạch cộng hưởng Half-Bridge LLC sơ cấp hiệu suất cao, nắn đồng bộ SR (Synchronous Rectification) 12V và module VRM DC-DC con độc lập sinh áp 5V / 3.3V.',
    safetyWarning: 'CẢNH BÁO NGUY HIỂM ĐIỆN ÁP CAO (HIGH VOLTAGE 390VDC): Tụ hóa cao áp C_BULK1 lưu trữ điện áp 380V - 400VDC cực kỳ nguy hiểm, có thể gây điện giật tê liệt tim tử vong ngay cả khi đã rút phích cắm AC! BẮT BUỘC dùng điện trở công suất 1kΩ/10W hoặc bóng đèn tròn sợi đốt 220V/100W xả sạch điện áp trên tụ sơ cấp trước khi chạm vào bo mạch. Luôn cắm nguồn qua bóng đèn tải giả nối tiếp (Series Lamp Limiter) khi kích nguồn thử nghiệm.',
    powerSequenceId: 'seq-psu-llc-dcdc',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (CM6500UNX / CM6901X / WT7502)',
      missingDataNote:
        'Corsair / CWT không công bố Schematic & BoardView gốc dòng RM750x. Chưa có ảnh chụp thực tế bản quyền mở cho model này nên phần Ảnh Thực Tế được để trống.',
    },
    zones: [
      {
        id: 'zone-emi',
        name: 'Khu Vực Lọc Nhiễu EMI & Cầu Chỉnh Lưu AC',
        description: 'Tầng bảo vệ sơ cấp gồm cầu chì F1, biến trở chống sét MOV, cuộn lọc Common-Mode Choke và cầu đi-ốt nắn dòng AC 220V thành DC gợn sóng.',
        color: '#4f46e5',
        bounds2d: { x: 5, y: 5, w: 25, h: 42 }
      },
      {
        id: 'zone-pfc',
        name: 'Mạch Nâng Áp Active PFC (390VDC)',
        description: 'Tầng Active PFC gồm IC điều khiển PWM, cuộn cảm nâng áp to L_PFC, MOSFET công suất cao và SiC Diode nắn áp lên 390V nạp vào tụ lọc chính.',
        color: '#dc2626',
        bounds2d: { x: 32, y: 5, w: 34, h: 42 }
      },
      {
        id: 'zone-5vsb',
        name: 'Mạch Nguồn Cấp Trước 5VSB (Standby Flyback)',
        description: 'Nguồn xung Flyback công suất nhỏ độc lập luôn hoạt động khi cắm điện lưới AC để nuôi chip Super I/O, cấp nguồn 5VSB và nuôi IC dao động chính.',
        color: '#eab308',
        bounds2d: { x: 68, y: 5, w: 27, h: 42 }
      },
      {
        id: 'zone-llc',
        name: 'Mạch Chuyển Mạch Cộng Hưởng LLC Half-Bridge',
        description: 'Cặp MOSFET sơ cấp đóng cắt ở tần số cao điều chế cộng hưởng mềm ZVS (Zero Voltage Switching), dẫn dòng qua biến áp xung công suất chính.',
        color: '#0284c7',
        bounds2d: { x: 5, y: 50, w: 30, h: 45 }
      },
      {
        id: 'zone-sec-12v',
        name: 'Tầng Nắn Đồng Bộ SR 12V & Module DC-DC Con',
        description: 'MOSFET đồng bộ nắn điện áp thứ cấp ra đường 12V tinh sạch, sau đó module VRM DC-DC con hạ áp từ 12V xuống 5V và 3.3V độc lập chống lệch pha.',
        color: '#10b981',
        bounds2d: { x: 37, y: 50, w: 35, h: 45 }
      },
      {
        id: 'zone-protection',
        name: 'IC Giám Sát & Điều Khiển Bảo Vệ Thứ Cấp',
        description: 'IC Supervisor giám sát điện áp ngõ ra OVP, UVP, quá dòng OCP, quá tải SCP, nhận lệnh PS_ON# và phát cờ PWR_OK (Power Good) lên bo mạch chủ.',
        color: '#8b5cf6',
        bounds2d: { x: 74, y: 50, w: 21, h: 45 }
      }
    ],
    rails: [
      {
        id: 'AC_LINE',
        name: 'Điện Lưới AC 220V/115V',
        nominalVoltage: '220VAC',
        category: 'high_voltage',
        color: '#f59e0b',
        description: 'Điện áp xoay chiều cấp trực tiếp từ phích cắm vào cổng IEC320 qua cầu chì bảo vệ.',
        connectedComponents: ['F1', 'MOV1', 'BD1']
      },
      {
        id: 'HV_390V_PFC',
        name: 'Đường Cao Áp Sơ Cấp 390VDC (PFC Bus)',
        nominalVoltage: '390VDC',
        category: 'high_voltage',
        color: '#ef4444',
        description: 'Điện áp một chiều cao áp sau khi được tầng Active PFC nâng từ 310V lên 390V nạp đầy tụ chính.',
        connectedComponents: ['L_PFC', 'D_PFC1', 'C_BULK1', 'Q_LLC1', 'U_5VSB']
      },
      {
        id: '+5VSB',
        name: 'Điện Áp Cấp Trước 5V Standby',
        nominalVoltage: '5.1V',
        category: 'standby',
        color: '#eab308',
        description: 'Đường nguồn cấp trước liên tục nuôi chip quản lý nguồn bo mạch chủ khi máy tính đang tắt.',
        connectedComponents: ['T_5VSB', 'U_TL431', 'U_OPT1', 'J_ATX24']
      },
      {
        id: 'VCC_IC_15V',
        name: 'Điện Áp Nuôi IC Dao Động Sơ Cấp',
        nominalVoltage: '14.8V',
        category: 'main_power',
        color: '#06b6d4',
        description: 'Điện áp cấp từ cuộn dây phụ biến áp 5VSB qua opto mở để nuôi chip dao động PFC/LLC khi có lệnh kích nguồn.',
        connectedComponents: ['T_5VSB', 'U_PFC_LLC']
      },
      {
        id: '+12V_MAIN',
        name: 'Đường Nguồn Chính 12V Công Suất Lớn',
        nominalVoltage: '12.15V',
        category: 'main_power',
        color: '#10b981',
        description: 'Đường điện chính nuôi CPU và Card đồ họa, cấp nguồn đầu vào cho module VRM DC-DC.',
        connectedComponents: ['Q_SR12V', 'MOD_DCDC', 'U_SUP', 'J_ATX24']
      },
      {
        id: '+5V_DCDC',
        name: 'Đường Nguồn 5V Hạ Áp DC-DC',
        nominalVoltage: '5.05V',
        category: 'main_power',
        color: '#f97316',
        description: 'Đường nguồn 5V nuôi ổ cứng SSD/HDD và cổng USB được sinh ra từ module biến đổi độc lập.',
        connectedComponents: ['MOD_DCDC', 'U_SUP', 'J_ATX24']
      },
      {
        id: '+3V3_DCDC',
        name: 'Đường Nguồn 3.3V Hạ Áp DC-DC',
        nominalVoltage: '3.32V',
        category: 'main_power',
        color: '#ec4899',
        description: 'Đường nguồn 3.3V nuôi chipset và khe cắm PCIe sinh ra từ module biến đổi độc lập.',
        connectedComponents: ['MOD_DCDC', 'U_SUP', 'J_ATX24']
      },
      {
        id: 'PS_ON#',
        name: 'Tín Hiệu Lệnh Kích Nguồn (Chân 16 Dây Xanh Lá)',
        nominalVoltage: '3.3V - 5V',
        category: 'control_signal',
        color: '#a855f7',
        description: 'Tín hiệu điều khiển kích nguồn từ Mainboard, kéo mức thấp 0V (nối GND) để khởi động toàn bộ nguồn.',
        connectedComponents: ['J_ATX24', 'U_SUP', 'U_OPT1']
      },
      {
        id: 'PWR_OK',
        name: 'Tín Hiệu Nguồn Tốt Power Good (Chân 8 Dây Xám)',
        nominalVoltage: '5.0V',
        category: 'control_signal',
        color: '#84cc16',
        description: 'Tín hiệu phản hồi từ IC bảo vệ báo về CPU rằng toàn bộ các đường áp ngõ ra đã đạt chuẩn an toàn.',
        connectedComponents: ['U_SUP', 'J_ATX24']
      },
      {
        id: 'GND',
        name: 'Điểm Tiếp Địa Khung & Mass Thứ Cấp',
        nominalVoltage: '0.0V',
        category: 'ground',
        color: '#64748b',
        description: 'Điểm quy chiếu điện thế 0V chung của toàn bộ phía thứ cấp và vỏ máy.',
        connectedComponents: ['BD1', 'C_BULK1', 'J_ATX24', 'U_SUP', 'MOD_DCDC']
      }
    ],
    components: [
      {
        id: 'F1',
        label: 'F1',
        kind: 'fuse',
        zone: 'zone-emi',
        description: 'Cầu chì bảo vệ ngõ vào điện lưới AC chống chập nổ quá dòng.',
        partNumber: 'T10A 250V Ceramic Fuse',
        specs: '10A 250VAC ngắt chậm (Time-lag)',
        pos3d: { x: -38, y: 0, z: -28, w: 6, d: 14, h: 6, color: '#f3f4f6' },
        pos2d: { x: 8, y: 12, w: 5, h: 8 },
        schematicPos: { x: 100, y: 140 },
        pins: [
          { pin: '1', name: 'AC_L_IN', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL', expectedResistance: '0.1Ω' },
          { pin: '2', name: 'AC_L_OUT', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL', expectedResistance: '0.1Ω' }
        ],
        commonFailureModes: ['Đứt cầu chì cháy đen do chập cầu đi-ốt BD1 hoặc chập MOSFET nâng áp PFC Q_PFC1', 'Đứt ngầm do sốc sét'],
        replacementTips: 'Bắt buộc thay đúng cầu chì sứ 10A chịu dòng tức thời, tuyệt đối không đấu dây đồng trực tiếp vì sẽ phá hủy toàn bộ bo mạch khi có sự cố.',
        normalTempC: 32,
        faultTempC: 95
      },
      {
        id: 'MOV1',
        label: 'MOV1',
        kind: 'resistor',
        zone: 'zone-emi',
        description: 'Điện trở oxit kim loại dập xung sét và triệt tiêu quá áp ngõ vào AC.',
        partNumber: 'TVR 14D471K',
        specs: 'Điện áp kích hoạt 470V, dòng đỉnh 4500A',
        pos3d: { x: -33, y: 0, z: -28, w: 4, d: 8, h: 10, color: '#0284c7' },
        pos2d: { x: 15, y: 12, w: 4, h: 7 },
        schematicPos: { x: 160, y: 140 },
        pins: [
          { pin: '1', name: 'AC_LINE', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL', expectedResistance: '>1MΩ' },
          { pin: '2', name: 'AC_NEUTRAL', net: 'AC_LINE', expectedVoltage: '0VAC', expectedDiodeDrop: 'OL', expectedResistance: '>1MΩ' }
        ],
        commonFailureModes: ['Nổ vỡ bung vỏ do sét đánh trực tiếp vào lưới điện', 'Chập rỉ điện trở làm nhảy cầu dao chống giật gia đình'],
        replacementTips: 'Thay thế bằng biến trở 14D471K hoặc 10D471K. Kiểm tra lại cầu chì F1 sau khi thay.',
        normalTempC: 30,
        faultTempC: 130
      },
      {
        id: 'BD1',
        label: 'BD1',
        kind: 'bridge_rectifier',
        zone: 'zone-emi',
        description: 'Cầu đi-ốt nắn dòng toàn kỳ nắn AC 220V thành DC đỉnh 310V, gắn trên cánh tản nhiệt nhôm sơ cấp.',
        partNumber: 'GBU1506',
        specs: '600V 15A Glass Passivated',
        pos3d: { x: -24, y: 0, z: -26, w: 5, d: 20, h: 18, color: '#1f2937' },
        pos2d: { x: 22, y: 16, w: 7, h: 14 },
        schematicPos: { x: 230, y: 140 },
        pins: [
          { pin: '1', name: 'AC_IN1', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'AC_IN2', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'DC_PLUS', net: 'HV_390V_PFC', expectedVoltage: '310VDC (chưa PFC) / 390V (có PFC)', expectedDiodeDrop: '0.520V' },
          { pin: '4', name: 'DC_MINUS', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.520V' }
        ],
        commonFailureModes: ['Chập 1 hoặc 2 nhánh đi-ốt làm đo thông mạch giữa chân AC và DC', 'Nứt vỡ do chập tải sau cầu'],
        replacementTips: 'Bôi keo tản nhiệt cẩn thận và siết chặt ốc vào tản nhiệt nhôm. Có thể thay bằng GBU1508, GBU2506.',
        normalTempC: 48,
        faultTempC: 110
      },
      {
        id: 'L_PFC',
        label: 'L_PFC',
        kind: 'inductor',
        zone: 'zone-pfc',
        description: 'Cuộn cảm nâng áp Active PFC lõi xuyến Sendust quấn dây đồng tráng men kép chịu dòng đỉnh cao.',
        partNumber: 'PFC-CHOKE-RM750',
        specs: '180µH lõi Sendust tổn hao thấp',
        pos3d: { x: -10, y: 0, z: -24, w: 16, d: 16, h: 22, color: '#b45309' },
        pos2d: { x: 33, y: 14, w: 9, h: 16 },
        schematicPos: { x: 320, y: 140 },
        pins: [
          { pin: '1', name: 'IN', net: 'AC_LINE', expectedVoltage: '310VDC', expectedDiodeDrop: 'OL', expectedResistance: '0.05Ω' },
          { pin: '2', name: 'SW', net: 'HV_390V_PFC', expectedVoltage: '390VDC (Xung đỉnh)', expectedDiodeDrop: 'OL', expectedResistance: '0.05Ω', waveformHint: 'Xung răng cưa dao động đóng cắt 65-100kHz' }
        ],
        commonFailureModes: ['Chập các vòng dây bên trong làm giảm độ tự cảm dẫn đến nổ MOSFET PFC ngay khi bật máy', 'Bong mối hàn chân cuộn cảm'],
        replacementTips: 'Dùng đồng hồ đo LCR kiểm tra độ tự cảm. Nếu quấn lại cần đếm chính xác số vòng và chiều quấn.',
        normalTempC: 55,
        faultTempC: 120
      },
      {
        id: 'Q_PFC1',
        label: 'Q_PFC1',
        kind: 'mosfet',
        zone: 'zone-pfc',
        description: 'MOSFET công suất cao đóng cắt nâng áp mạch Active PFC lên 390VDC.',
        partNumber: 'Infineon IPW60R099CP',
        specs: 'CoolMOS N-Channel 650V 31A Rds(on)=0.099Ω',
        pos3d: { x: -10, y: 0, z: -8, w: 6, d: 14, h: 18, color: '#111827' },
        pos2d: { x: 44, y: 15, w: 6, h: 12 },
        schematicPos: { x: 410, y: 220 },
        pins: [
          { pin: '1', name: 'GATE', net: 'VCC_IC_15V', expectedVoltage: 'Xung lái 12V', expectedDiodeDrop: 'OL', waveformHint: 'Xung vuông PWM lái chân Gate' },
          { pin: '2', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.485V (S->D)' },
          { pin: '3', name: 'SOURCE', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập hoàn toàn 3 chân D-S-G đánh thủng cả trở dập xung cổng Gate', 'Nổ bung lưng IC khi quá nhiệt'],
        replacementTips: 'Khi MOSFET PFC nổ, BẮT BUỘC kiểm tra điện trở chân Gate (10Ω - 22Ω) và đi-ốt dập ngược bảo vệ IC lái.',
        normalTempC: 52,
        faultTempC: 125
      },
      {
        id: 'D_PFC1',
        label: 'D_PFC1',
        kind: 'diode',
        zone: 'zone-pfc',
        description: 'Đi-ốt nắn siêu nhanh Silicon Carbide (SiC) chặn dòng ngược và nạp năng lượng từ cuộn PFC vào tụ lọc chính.',
        partNumber: 'Cree C3D06060A',
        specs: 'SiC Schottky 600V 6A Zero Reverse Recovery',
        pos3d: { x: -10, y: 0, z: 2, w: 5, d: 10, h: 16, color: '#374151' },
        pos2d: { x: 52, y: 14, w: 5, h: 10 },
        schematicPos: { x: 480, y: 140 },
        pins: [
          { pin: 'A', name: 'ANODE', net: 'HV_390V_PFC', expectedVoltage: '390VDC (Xung)', expectedDiodeDrop: '0.850V' },
          { pin: 'K', name: 'CATHODE', net: 'HV_390V_PFC', expectedVoltage: '390VDC phẳng', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Đánh thủng chập 2 chiều Anode - Cathode làm sụt áp PFC và nổ cầu chì', 'Đứt mối tiếp xúc'],
        replacementTips: 'Bắt buộc thay bằng đi-ốt SiC Schottky 600V tốc độ cao phục hồi tức thời. Đi-ốt FR thông thường sẽ bị nổ do tổn hao đóng cắt.',
        normalTempC: 45,
        faultTempC: 110
      },
      {
        id: 'C_BULK1',
        label: 'C_BULK1',
        kind: 'capacitor_elec',
        zone: 'zone-pfc',
        description: 'Tụ hóa cao áp lọc chính sơ cấp của Nhật Bản chịu nhiệt 105°C lưu trữ năng lượng duy trì Hold-up time.',
        partNumber: 'Nippon Chemi-Con KMW Series',
        specs: '400V 560µF 105°C Low-ESR',
        pos3d: { x: 10, y: 0, z: -20, w: 22, d: 22, h: 32, color: '#1e3a8a' },
        pos2d: { x: 59, y: 12, w: 10, h: 20 },
        schematicPos: { x: 560, y: 140 },
        pins: [
          { pin: '+', name: 'HV_POS', net: 'HV_390V_PFC', expectedVoltage: '390VDC (Standby: 320VDC)', expectedDiodeDrop: 'OL', expectedResistance: 'Nạp phóng dần >500kΩ' },
          { pin: '-', name: 'HV_NEG', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Khô dung dịch điện phân làm tụ giảm dung lượng dẫn tới sụt nguồn khi máy tính tải nặng', 'Phồng đít tụ xì hóa chất gỉ chân'],
        replacementTips: 'Xả điện bằng tải bóng đèn trước khi tháo tụ! Thay thế tụ đúng điện áp chịu đựng ≥400V hoặc 450V và kích thước tương đương.',
        normalTempC: 40,
        faultTempC: 90
      },
      {
        id: 'U_5VSB',
        label: 'U_5VSB',
        kind: 'pwm_ic',
        zone: 'zone-5vsb',
        description: 'IC điều khiển xung nguồn cấp trước tích hợp sẵn MOSFET công suất cao 650V bên trong chip.',
        partNumber: 'OnSemi FSL106HR',
        specs: 'Green Mode Fairchild Power Switch (FPS) 650V',
        pos3d: { x: 28, y: 0, z: -25, w: 8, d: 10, h: 5, color: '#111827' },
        pos2d: { x: 74, y: 12, w: 6, h: 9 },
        schematicPos: { x: 700, y: 130 },
        pins: [
          { pin: '1', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' },
          { pin: '2', name: 'VCC', net: 'VCC_IC_15V', expectedVoltage: '12V - 15V', expectedDiodeDrop: '0.620V' },
          { pin: '3', name: 'FB', net: '+5VSB', expectedVoltage: '1.2V - 2.5V', expectedDiodeDrop: '0.710V' },
          { pin: '5', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '320V - 390VDC', expectedDiodeDrop: '0.510V' }
        ],
        commonFailureModes: ['Nổ thủng lưng IC do sét đánh hoặc quá dòng', 'Mất dao động dẫn tới mất hoàn toàn nguồn 5VSB (nguồn tê liệt)'],
        replacementTips: 'Kiểm tra kỹ đi-ốt nắn áp thứ cấp và tụ lọc ngõ ra 5VSB trước khi đóng IC mới.',
        normalTempC: 46,
        faultTempC: 115
      },
      {
        id: 'T_5VSB',
        label: 'T_5VSB',
        kind: 'transformer',
        zone: 'zone-5vsb',
        description: 'Biến áp xung cách ly cao tần nguồn cấp trước tạo điện áp 5VSB và cuộn phụ nuôi IC sơ cấp.',
        partNumber: 'TRANS-EE19-5VSB',
        specs: 'Cách ly điện thế 4000VAC sơ cấp - thứ cấp',
        pos3d: { x: 36, y: 0, z: -15, w: 14, d: 14, h: 16, color: '#78350f' },
        pos2d: { x: 82, y: 12, w: 8, h: 12 },
        schematicPos: { x: 790, y: 130 },
        pins: [
          { pin: '1', name: 'PRI_IN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'PRI_DRIVE', net: 'HV_390V_PFC', expectedVoltage: 'Xung dao động', expectedDiodeDrop: 'OL' },
          { pin: '5', name: 'SEC_5VSB', net: '+5VSB', expectedVoltage: '5.1VDC', expectedDiodeDrop: '0.280V (qua Schottky)' },
          { pin: '6', name: 'SEC_GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Đứt cuộn sơ cấp làm mất hoàn toàn nguồn phụ', 'Rò điện áp sơ cấp sang thứ cấp gây nguy hiểm giật điện'],
        replacementTips: 'Đo điện trở cuộn dây (thường chỉ vài Ohm). Nếu biến áp cháy khét cần quấn lại đúng số vòng dây.',
        normalTempC: 44,
        faultTempC: 105
      },
      {
        id: 'U_OPT1',
        label: 'U_OPT1',
        kind: 'optocoupler',
        zone: 'zone-5vsb',
        description: 'Opto quang cách ly tín hiệu hồi tiếp điện áp và lệnh kích nguồn qua ranh giới cách ly an toàn.',
        partNumber: 'Cosmo PC817C',
        specs: 'DIP-4 Optocoupler CTR 200-400% cách ly 5000V',
        pos3d: { x: 25, y: 0, z: -5, w: 5, d: 6, h: 4, color: '#1e293b' },
        pos2d: { x: 72, y: 26, w: 4, h: 6 },
        schematicPos: { x: 700, y: 220 },
        pins: [
          { pin: '1', name: 'ANODE', net: '+5VSB', expectedVoltage: '1.2V', expectedDiodeDrop: '1.050V (LED)' },
          { pin: '2', name: 'CATHODE', net: '+5VSB', expectedVoltage: '0.2V', expectedDiodeDrop: '0.000V' },
          { pin: '3', name: 'EMITTER', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' },
          { pin: '4', name: 'COLLECTOR', net: 'VCC_IC_15V', expectedVoltage: '2.5V (Chân FB IC)', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Rỉ LED quang làm sai lệch điện áp hồi tiếp khiến điện áp 5VSB dâng cao vọt lên 7-9V gây cháy bo mạch chủ', 'Đứt chân bóng quang'],
        replacementTips: 'Bệnh kinh điển khiến nguồn chập chờn: Luôn thay thử PC817 mới khi điện áp 5VSB bất thường.',
        normalTempC: 35,
        faultTempC: 85
      },
      {
        id: 'U_TL431',
        label: 'U_TL431',
        kind: 'tl431',
        zone: 'zone-5vsb',
        description: 'Đi-ốt tham chiếu điện áp chính xác 2.5V điều chỉnh độ ổn định của đường 5VSB.',
        partNumber: 'TI TL431ACLP',
        specs: 'Điện áp chuẩn 2.495V sai số 0.5% dạng TO-92',
        pos3d: { x: 30, y: 0, z: 2, w: 4, d: 4, h: 6, color: '#1e293b' },
        pos2d: { x: 80, y: 26, w: 4, h: 6 },
        schematicPos: { x: 790, y: 220 },
        pins: [
          { pin: '1', name: 'REF', net: '+5VSB', expectedVoltage: '2.50V chuẩn', expectedDiodeDrop: '0.680V' },
          { pin: '2', name: 'ANODE', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' },
          { pin: '3', name: 'CATHODE', net: '+5VSB', expectedVoltage: '3.8V', expectedDiodeDrop: '0.550V' }
        ],
        commonFailureModes: ['Trôi điện áp tham chiếu chân Ref làm đường 5VSB bị dâng áp hoặc sụt áp', 'Chập chân K-A'],
        replacementTips: 'Đo chính xác chân Ref phải đủ 2.50V. Có thể thay bằng TL431A, KA431.',
        normalTempC: 33,
        faultTempC: 80
      },
      {
        id: 'U_PFC_LLC',
        label: 'U_PFC_LLC',
        kind: 'pwm_ic',
        zone: 'zone-llc',
        description: 'IC điều khiển phức hợp quản lý đồng thời tầng Active PFC và bộ cộng hưởng LLC sơ cấp.',
        partNumber: 'Champion CM6901X',
        specs: 'SSOP-24 High Efficiency Resonant LLC + Synchronous Rectification Controller',
        pos3d: { x: -28, y: 0, z: 12, w: 10, d: 14, h: 3, color: '#0f172a' },
        pos2d: { x: 12, y: 58, w: 8, h: 10 },
        schematicPos: { x: 180, y: 440 },
        pins: [
          { pin: '1', name: 'VCC', net: 'VCC_IC_15V', expectedVoltage: '14.5V khi kích nguồn', expectedDiodeDrop: '0.680V' },
          { pin: '5', name: 'PFC_OUT', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái PFC 65kHz', expectedDiodeDrop: '0.590V', waveformHint: 'Xung lái tần số 65kHz' },
          { pin: '11', name: 'LLC_HI', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái nửa cầu trên', expectedDiodeDrop: '0.590V', waveformHint: 'Xung vuông đối xứng ZVS 90kHz' },
          { pin: '14', name: 'LLC_LO', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái nửa cầu dưới', expectedDiodeDrop: '0.590V', waveformHint: 'Xung vuông đối xứng ZVS 90kHz' },
          { pin: '20', name: 'GND', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Mất lệnh kích xung sơ cấp do mất nguồn nuôi VCC 15V', 'Chết ngõ ra lái High-Side khi MOSFET công suất bị đánh thủng'],
        replacementTips: 'Kiểm tra kỹ trở dập xung cổng Gate của MOSFET LLC trước khi thay IC CM6901 mới.',
        normalTempC: 45,
        faultTempC: 98
      },
      {
        id: 'Q_LLC1',
        label: 'Q_LLC1',
        kind: 'mosfet',
        zone: 'zone-llc',
        description: 'MOSFET chuyển mạch nửa cầu nhánh trên (High-Side) đóng cắt dòng năng lượng qua tụ cộng hưởng.',
        partNumber: 'Vishay SiHG20N50C',
        specs: 'Superjunction N-Channel 500V 20A Rds=0.22Ω',
        pos3d: { x: -16, y: 0, z: 8, w: 6, d: 14, h: 18, color: '#111827' },
        pos2d: { x: 22, y: 55, w: 5, h: 12 },
        schematicPos: { x: 300, y: 400 },
        pins: [
          { pin: '1', name: 'GATE', net: 'VCC_IC_15V', expectedVoltage: 'Xung kích ZVS', expectedDiodeDrop: 'OL', waveformHint: 'Xung ZVS mềm' },
          { pin: '2', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.490V' },
          { pin: '3', name: 'SOURCE', net: 'HV_390V_PFC', expectedVoltage: 'Điểm giữa nửa cầu (Switch Node)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập Drain-Source gây nổ cầu chì và sập nguồn bảo vệ', 'Thủng cách điện do quá áp'],
        replacementTips: 'Nên thay đồng bộ cả cặp Q_LLC1 và Q_LLC2 cùng loại và cùng lô sản xuất để đảm bảo cân bằng thời gian đóng cắt.',
        normalTempC: 48,
        faultTempC: 120
      },
      {
        id: 'Q_LLC2',
        label: 'Q_LLC2',
        kind: 'mosfet',
        zone: 'zone-llc',
        description: 'MOSFET chuyển mạch nửa cầu nhánh dưới (Low-Side) kết hợp cùng nhánh trên tạo dao động xoay chiều qua biến áp.',
        partNumber: 'Vishay SiHG20N50C',
        specs: 'Superjunction N-Channel 500V 20A Rds=0.22Ω',
        pos3d: { x: -16, y: 0, z: 22, w: 6, d: 14, h: 18, color: '#111827' },
        pos2d: { x: 22, y: 72, w: 5, h: 12 },
        schematicPos: { x: 300, y: 520 },
        pins: [
          { pin: '1', name: 'GATE', net: 'VCC_IC_15V', expectedVoltage: 'Xung kích ZVS', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: 'Điểm giữa nửa cầu', expectedDiodeDrop: '0.490V' },
          { pin: '3', name: 'SOURCE', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập D-S khi tụ cộng hưởng LLC bị rò hoặc biến áp chính chập vòng sơ cấp'],
        replacementTips: 'Bôi keo tản nhiệt và lót đệm cách điện mica/silicone chống phóng điện ra cánh tản nhiệt.',
        normalTempC: 48,
        faultTempC: 120
      },
      {
        id: 'T_MAIN',
        label: 'T_MAIN',
        kind: 'transformer',
        zone: 'zone-sec-12v',
        description: 'Biến áp xung công suất chính hạ áp từ 390VDC cao áp xuống đường xung 12V công suất cực lớn.',
        partNumber: 'ERL-39-RM750',
        specs: 'Biến áp xung cộng hưởng LLC 750W dây đồng lá tinh khiết',
        pos3d: { x: 0, y: 0, z: 16, w: 24, d: 24, h: 28, color: '#78350f' },
        pos2d: { x: 38, y: 58, w: 12, h: 18 },
        schematicPos: { x: 440, y: 460 },
        pins: [
          { pin: '1', name: 'PRI_A', net: 'HV_390V_PFC', expectedVoltage: 'Xung cao tần 390V', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'PRI_B', net: 'HV_390V_PFC', expectedVoltage: 'Qua tụ cộng hưởng LLC', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'SEC_12V_A', net: '+12V_MAIN', expectedVoltage: 'Xung 12V nắn SR', expectedDiodeDrop: '0.220V' },
          { pin: '4', name: 'SEC_12V_B', net: '+12V_MAIN', expectedVoltage: 'Xung 12V nắn SR', expectedDiodeDrop: '0.220V' },
          { pin: '5', name: 'SEC_GND', net: 'GND', expectedVoltage: '0V (Secondary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Rất hiếm khi cháy đứt, thỉnh thoảng nứt lõi ferrite do va đập cơ học làm phát tiếng rít rít'],
        replacementTips: 'Nếu biến áp phát tiếng rít chói tai, kiểm tra lại tụ cộng hưởng LLC hoặc vòng lặp hồi tiếp ổn áp.',
        normalTempC: 56,
        faultTempC: 110
      },
      {
        id: 'Q_SR12V',
        label: 'Q_SR12V',
        kind: 'mosfet',
        zone: 'zone-sec-12v',
        description: 'Dàn MOSFET nắn đồng bộ thay thế đi-ốt Schottky truyền thống để giảm thiểu tiêu hao nhiệt lượng cho đường 12V.',
        partNumber: 'Nexperia PSMN2R0-30YLD',
        specs: 'TrenchMOS N-Channel 30V 100A Rds=2.0mΩ LFPAK',
        pos3d: { x: 18, y: 0, z: 12, w: 8, d: 14, h: 8, color: '#1e293b' },
        pos2d: { x: 53, y: 56, w: 6, h: 10 },
        schematicPos: { x: 580, y: 460 },
        pins: [
          { pin: 'D', name: 'DRAIN', net: '+12V_MAIN', expectedVoltage: 'Xung nắn từ biến áp', expectedDiodeDrop: '0.450V' },
          { pin: 'S', name: 'SOURCE', net: '+12V_MAIN', expectedVoltage: '12.15VDC', expectedDiodeDrop: '0.000V' },
          { pin: 'G', name: 'GATE', net: '+12V_MAIN', expectedVoltage: 'Xung điều khiển SR', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Đánh thủng D-S làm chập đường 12V xuống GND khiến nguồn kích ngắt tức thì trong 0.1s'],
        replacementTips: 'Đo thang Diode hoặc đo Ohm giữa đường 12V và GND: nếu kêu bíp (0.000V) cần tách từng MOSFET nắn SR để tìm con chập.',
        normalTempC: 50,
        faultTempC: 120
      },
      {
        id: 'MOD_DCDC',
        label: 'MOD_DCDC',
        kind: 'ic',
        zone: 'zone-sec-12v',
        description: 'Module vỉ mạch con đứng hạ áp Buck đồng bộ từ 12V sinh ra đường 5V và 3.3V độc lập chịu tải cao.',
        partNumber: 'Anpec APW7073 VRM Module',
        specs: 'Dual Synchronous Buck Controller 5V 25A & 3.3V 25A',
        pos3d: { x: 26, y: 0, z: 22, w: 10, d: 24, h: 22, color: '#047857' },
        pos2d: { x: 62, y: 65, w: 9, h: 16 },
        schematicPos: { x: 720, y: 520 },
        pins: [
          { pin: 'IN', name: '+12V_IN', net: '+12V_MAIN', expectedVoltage: '12.15V', expectedDiodeDrop: '0.420V' },
          { pin: 'OUT5', name: '+5V_OUT', net: '+5V_DCDC', expectedVoltage: '5.05V', expectedDiodeDrop: '0.380V' },
          { pin: 'OUT3', name: '+3V3_OUT', net: '+3V3_DCDC', expectedVoltage: '3.32V', expectedDiodeDrop: '0.360V' },
          { pin: 'GND', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập MOSFET hạ áp nhánh trên làm thông thẳng áp 12V vào đường 5V hoặc 3.3V kích hoạt chip bảo vệ ngắt nguồn ngay', 'Khô tụ rắn lọc ngõ ra module'],
        replacementTips: 'Tháo rời module VRM ra ngoài bo mạch để kiểm tra nguội đo ôm trở kháng từng đường trước khi cấp điện thử.',
        normalTempC: 46,
        faultTempC: 105
      },
      {
        id: 'U_SUP',
        label: 'U_SUP',
        kind: 'super_io',
        zone: 'zone-protection',
        description: 'IC giám sát bảo vệ thứ cấp nhận diện quá áp OVP, thiếu áp UVP, quá tải OCP, chập tải SCP và tạo tín hiệu PG.',
        partNumber: 'Weltrend WT7527V',
        specs: 'Secondary Supervisor IC DIP-16 with Fault Protection & Delay Generator',
        pos3d: { x: 38, y: 0, z: 20, w: 10, d: 14, h: 4, color: '#1e293b' },
        pos2d: { x: 76, y: 66, w: 7, h: 12 },
        schematicPos: { x: 860, y: 560 },
        pins: [
          { pin: '1', name: 'PGI', net: '+12V_MAIN', expectedVoltage: '1.25V tham chiếu', expectedDiodeDrop: '0.710V' },
          { pin: '2', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' },
          { pin: '3', name: 'FPO#', net: 'PS_ON#', expectedVoltage: 'Mở opto kích nguồn sơ cấp', expectedDiodeDrop: '0.650V' },
          { pin: '4', name: 'PSON#', net: 'PS_ON#', expectedVoltage: 'Chờ: 3.3V - 5V, Bật: 0V', expectedDiodeDrop: '0.620V' },
          { pin: '8', name: 'PGO', net: 'PWR_OK', expectedVoltage: '5.0V (Sau 100-300ms)', expectedDiodeDrop: '0.680V' },
          { pin: '13', name: 'V12', net: '+12V_MAIN', expectedVoltage: '12.15V', expectedDiodeDrop: '0.550V' },
          { pin: '14', name: 'V5', net: '+5V_DCDC', expectedVoltage: '5.05V', expectedDiodeDrop: '0.520V' },
          { pin: '15', name: 'V33', net: '+3V3_DCDC', expectedVoltage: '3.32V', expectedDiodeDrop: '0.510V' }
        ],
        commonFailureModes: ['Hỏng cổng so sánh ngõ ra PGO làm nguồn chạy nhưng không có tín hiệu Power Good (Mainboard không khởi động CPU)', 'Khóa bảo vệ không cho kích nguồn do chập đường dò áp'],
        replacementTips: 'Đo chân 4 PSON# khi câu dây xanh lá xuống mass phải về đúng 0V. Nếu không về 0V là hỏng IC hoặc mạch kéo.',
        normalTempC: 38,
        faultTempC: 90
      },
      {
        id: 'J_ATX24',
        label: 'J_ATX24',
        kind: 'atx_24pin',
        zone: 'zone-protection',
        description: 'Đầu nối chân cắm chuẩn ATX 24-Pin kết nối với cáp cấp nguồn cho bo mạch chủ máy tính.',
        partNumber: 'Molex Mini-Fit Jr 24P',
        specs: '24-pin ATX Mainboard Connector 13A per pin',
        pos3d: { x: 44, y: 0, z: 24, w: 6, d: 24, h: 12, color: '#111827' },
        pos2d: { x: 88, y: 60, w: 8, h: 26 },
        schematicPos: { x: 1020, y: 480 },
        pins: [
          { pin: '4', name: '+5V', net: '+5V_DCDC', expectedVoltage: '5.05V', expectedDiodeDrop: '0.380V' },
          { pin: '8', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V khi chạy', expectedDiodeDrop: '0.680V' },
          { pin: '9', name: '+5VSB', net: '+5VSB', expectedVoltage: '5.1V liên tục', expectedDiodeDrop: '0.450V' },
          { pin: '10', name: '+12V', net: '+12V_MAIN', expectedVoltage: '12.15V', expectedDiodeDrop: '0.420V' },
          { pin: '11', name: '+12V', net: '+12V_MAIN', expectedVoltage: '12.15V', expectedDiodeDrop: '0.420V' },
          { pin: '16', name: 'PS_ON#', net: 'PS_ON#', expectedVoltage: '3.3V-5V (Kéo 0V bật)', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Cháy nám chân tiếp xúc 12V do tiếp xúc lỏng sinh nhiệt khi máy tính cày kéo VGA nặng', 'Oxy hóa chân đồng'],
        replacementTips: 'Dùng nhíp nắn lại cốt chân tiếp xúc hoặc bấm lại đầu cosse mạ vàng chuyên dụng để tránh chập chờn.',
        normalTempC: 35,
        faultTempC: 85
      }
    ],
    wires: [
      { id: 'w1', netId: 'AC_LINE', fromComponentId: 'F1', fromPin: '2', toComponentId: 'MOV1', toPin: '1' },
      { id: 'w2', netId: 'AC_LINE', fromComponentId: 'MOV1', fromPin: '1', toComponentId: 'BD1', toPin: '1' },
      { id: 'w3', netId: 'HV_390V_PFC', fromComponentId: 'BD1', fromPin: '3', toComponentId: 'L_PFC', toPin: '1' },
      { id: 'w4', netId: 'HV_390V_PFC', fromComponentId: 'L_PFC', fromPin: '2', toComponentId: 'Q_PFC1', toPin: '2' },
      { id: 'w5', netId: 'HV_390V_PFC', fromComponentId: 'L_PFC', fromPin: '2', toComponentId: 'D_PFC1', toPin: 'A' },
      { id: 'w6', netId: 'HV_390V_PFC', fromComponentId: 'D_PFC1', fromPin: 'K', toComponentId: 'C_BULK1', toPin: '+' },
      { id: 'w7', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'U_5VSB', toPin: '5' },
      { id: 'w8', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'Q_LLC1', toPin: '2' },
      { id: 'w9', netId: '+5VSB', fromComponentId: 'U_5VSB', fromPin: '3', toComponentId: 'T_5VSB', toPin: '1' },
      { id: 'w10', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '5', toComponentId: 'U_TL431', toPin: '1' },
      { id: 'w11', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '5', toComponentId: 'U_OPT1', toPin: '1' },
      { id: 'w12', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '5', toComponentId: 'J_ATX24', toPin: '9' },
      { id: 'w13', netId: 'VCC_IC_15V', fromComponentId: 'U_OPT1', fromPin: '4', toComponentId: 'U_PFC_LLC', toPin: '1' },
      { id: 'w14', netId: 'HV_390V_PFC', fromComponentId: 'Q_LLC1', fromPin: '3', toComponentId: 'Q_LLC2', toPin: '2' },
      { id: 'w15', netId: 'HV_390V_PFC', fromComponentId: 'Q_LLC1', fromPin: '3', toComponentId: 'T_MAIN', toPin: '1' },
      { id: 'w16', netId: '+12V_MAIN', fromComponentId: 'T_MAIN', fromPin: '3', toComponentId: 'Q_SR12V', toPin: 'D' },
      { id: 'w17', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'MOD_DCDC', toPin: 'IN' },
      { id: 'w18', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'U_SUP', toPin: '13' },
      { id: 'w19', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'J_ATX24', toPin: '10' },
      { id: 'w20', netId: '+5V_DCDC', fromComponentId: 'MOD_DCDC', fromPin: 'OUT5', toComponentId: 'U_SUP', toPin: '14' },
      { id: 'w21', netId: '+5V_DCDC', fromComponentId: 'MOD_DCDC', fromPin: 'OUT5', toComponentId: 'J_ATX24', toPin: '4' },
      { id: 'w22', netId: 'PS_ON#', fromComponentId: 'J_ATX24', fromPin: '16', toComponentId: 'U_SUP', toPin: '4' },
      { id: 'w23', netId: 'PWR_OK', fromComponentId: 'U_SUP', fromPin: '8', toComponentId: 'J_ATX24', toPin: '8' }
    ]
  },

  // =========================================================================
  // 2. SEASONIC FOCUS GX-650 (Full-Bridge LLC + Đồng Bộ Thứ Cấp + DC-DC)
  // =========================================================================
  {
    id: 'seasonic-focus-gx650',
    name: 'Seasonic Focus GX-650 650W 80 Plus Gold',
    brand: 'Seasonic',
    category: 'psu',
    generation: '80+ Gold Seasonic Focus Platform (Full-Bridge LLC)',
    formFactor: 'ATX 140mm Compact',
    pcbColor: '#1e293b',
    pcbSize: { width: 92, depth: 74, thickness: 2.0 },
    summary: 'Nền tảng Seasonic Focus GX huyền thoại với thiết kế mạch Full-Bridge LLC siêu gọn 140mm, độ ổn định điện áp chặt chẽ (Tight Voltage Regulation < 1.5%), 100% tụ điện Nhật Bản Rubycon/Nippon Chemi-Con và hệ thống bảo vệ đa tầng cao cấp.',
    safetyWarning: 'CẢNH BÁO CAO ÁP SƠ CẤP NGUY HIỂM: Tụ lọc sơ cấp tích trữ điện áp 380V - 400VDC. Tuyệt đối không cắm điện khi chưa đậy nắp hoặc chạm tay vào khu vực tản nhiệt sơ cấp. Bắt buộc dùng bóng đèn xả tụ trước khi dùng que đo kiểm tra linh kiện.',
    powerSequenceId: 'seq-psu-llc-dcdc',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (CM6500 / CM6901 / WT7527V)',
      missingDataNote:
        'Seasonic không công bố Schematic nội bộ dòng Focus GX-650. Chưa có ảnh chụp thực tế bản quyền mở cho model này nên phần Ảnh Thực Tế được để trống.',
    },
    zones: [
      {
        id: 'zone-emi',
        name: 'Tầng Lọc Nhiễu Lưới Điện AC & Cầu Nắn',
        description: 'Lọc nhiễu cao tần 2 tầng chuẩn công nghiệp với điện trở nhiệt NTC và Rơ-le Relay bypass chống tổn hao.',
        color: '#4f46e5',
        bounds2d: { x: 5, y: 5, w: 26, h: 42 }
      },
      {
        id: 'zone-pfc',
        name: 'Tầng Nâng Áp Active PFC',
        description: 'MOSFET Infineon công nghệ CoolMOS thế hệ mới kết hợp tụ lọc Rubycon 400V 470uF.',
        color: '#dc2626',
        bounds2d: { x: 33, y: 5, w: 33, h: 42 }
      },
      {
        id: 'zone-5vsb',
        name: 'Mạch Nguồn Phụ 5VSB Độc Lập',
        description: 'Mạch xung flyback tiết kiệm điện chuẩn ErP Lot 6 tiêu thụ < 0.5W ở chế độ chờ.',
        color: '#eab308',
        bounds2d: { x: 68, y: 5, w: 27, h: 42 }
      },
      {
        id: 'zone-llc',
        name: 'Bộ Dao Động Cộng Hưởng LLC Tần Số Cao',
        description: 'Cặp đôi điều khiển Champion Micro CM6901 tối ưu hóa hiệu suất nắn dòng không tổn hao ZVS.',
        color: '#0284c7',
        bounds2d: { x: 5, y: 50, w: 32, h: 45 }
      },
      {
        id: 'zone-sec-12v',
        name: 'Tầng Chỉnh Lưu Đồng Bộ 12V & Module DC-DC',
        description: 'MOSFET nắn dòng 12V bắt trực tiếp vào thanh đồng dẫn phụ và bo dựng DC-DC hạ áp 5V/3.3V.',
        color: '#10b981',
        bounds2d: { x: 39, y: 50, w: 34, h: 45 }
      },
      {
        id: 'zone-protection',
        name: 'Khu Vực Giám Sát Điện Áp & Đầu Ra ATX',
        description: 'IC bảo vệ Weltrend WT7527V kiểm soát OVP, UVP, OCP, SCP và cổng ra dây nguồn chuẩn ATX.',
        color: '#8b5cf6',
        bounds2d: { x: 75, y: 50, w: 20, h: 45 }
      }
    ],
    rails: [
      {
        id: 'AC_LINE',
        name: 'Điện Lưới AC 220V',
        nominalVoltage: '220VAC',
        category: 'high_voltage',
        color: '#f59e0b',
        description: 'Đường điện vào qua cầu chì và NTC giảm dòng nạp.',
        connectedComponents: ['F1', 'NTC1', 'BD1']
      },
      {
        id: 'HV_390V_PFC',
        name: 'Đường Cao Áp PFC 390VDC',
        nominalVoltage: '390VDC',
        category: 'high_voltage',
        color: '#ef4444',
        description: 'Điện áp DC ổn định cấp cho tầng cộng hưởng LLC và nguồn cấp trước.',
        connectedComponents: ['Q_PFC1', 'C_BULK1', 'Q_LLC1', 'U_5VSB']
      },
      {
        id: '+5VSB',
        name: 'Nguồn Cấp Trước 5VSB',
        nominalVoltage: '5.08V',
        category: 'standby',
        color: '#eab308',
        description: 'Đường nguồn cấp trước 5V duy trì liên tục.',
        connectedComponents: ['T_5VSB', 'U_OPT1', 'J_ATX24']
      },
      {
        id: '+12V_MAIN',
        name: 'Nguồn Chính 12V 54A',
        nominalVoltage: '12.18V',
        category: 'main_power',
        color: '#10b981',
        description: 'Đường 12V công suất lớn cấp cho CPU, VGA và bo DC-DC.',
        connectedComponents: ['Q_SR12V', 'MOD_DCDC', 'U_SUP', 'J_ATX24']
      },
      {
        id: 'PS_ON#',
        name: 'Lệnh Kích Nguồn PS_ON#',
        nominalVoltage: '3.3V',
        category: 'control_signal',
        color: '#a855f7',
        description: 'Chân kích nguồn kéo mass từ mainboard.',
        connectedComponents: ['J_ATX24', 'U_SUP', 'U_OPT1']
      },
      {
        id: 'PWR_OK',
        name: 'Tín Hiệu Power Good',
        nominalVoltage: '5.0V',
        category: 'control_signal',
        color: '#84cc16',
        description: 'Tín hiệu xác nhận nguồn ổn định.',
        connectedComponents: ['U_SUP', 'J_ATX24']
      },
      {
        id: 'GND',
        name: 'Mass Đất Chung',
        nominalVoltage: '0.0V',
        category: 'ground',
        color: '#64748b',
        description: 'Tiếp địa an toàn và mass ngõ ra thứ cấp.',
        connectedComponents: ['BD1', 'C_BULK1', 'J_ATX24', 'U_SUP']
      }
    ],
    components: [
      {
        id: 'F1',
        label: 'F1',
        kind: 'fuse',
        zone: 'zone-emi',
        description: 'Cầu chì ngắt mạch bảo vệ chống quá dòng ngõ vào AC.',
        partNumber: 'T10A 250V Pigtail',
        specs: '10A 250V bọc co nhiệt chống văng mảnh vỡ',
        pos3d: { x: -36, y: 0, z: -26, w: 5, d: 12, h: 5, color: '#f3f4f6' },
        pos2d: { x: 8, y: 14, w: 5, h: 8 },
        schematicPos: { x: 100, y: 140 },
        pins: [
          { pin: '1', name: 'AC_IN', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'AC_OUT', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Nổ đứt cầu chì do chập MOSFET PFC hoặc chập cầu đi-ốt'],
        replacementTips: 'Bắt buộc thay đúng cầu chì ngắt chậm T10A 250V.',
        normalTempC: 32,
        faultTempC: 100
      },
      {
        id: 'NTC1',
        label: 'NTC1',
        kind: 'resistor',
        zone: 'zone-emi',
        description: 'Điện trở nhiệt giảm dòng nạp xung kích ban đầu (Inrush Current) vào tụ điện.',
        partNumber: 'NTC 5D-15',
        specs: '5Ω trở kháng nguội, dòng định mức 6A',
        pos3d: { x: -30, y: 0, z: -26, w: 4, d: 8, h: 10, color: '#166534' },
        pos2d: { x: 15, y: 14, w: 4, h: 8 },
        schematicPos: { x: 160, y: 140 },
        pins: [
          { pin: '1', name: 'IN', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL', expectedResistance: '5.0Ω' },
          { pin: '2', name: 'OUT', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL', expectedResistance: '5.0Ω' }
        ],
        commonFailureModes: ['Nứt vỡ do rơ-le bypass hỏng không đóng tiếp điểm khiến NTC gánh toàn bộ dòng tải liên tục'],
        replacementTips: 'Kiểm tra tiếng tạch của Rơ-le sau khi kích nguồn khoảng 1 giây để xác nhận rơ-le đã đóng tắt NTC.',
        normalTempC: 45,
        faultTempC: 140
      },
      {
        id: 'BD1',
        label: 'BD1',
        kind: 'bridge_rectifier',
        zone: 'zone-emi',
        description: 'Cầu đi-ốt nắn dòng Shindengen cao cấp có độ sụt áp thấp.',
        partNumber: 'Shindengen LL25XB60',
        specs: '600V 25A cầu dẹp tản nhiệt nhôm',
        pos3d: { x: -22, y: 0, z: -24, w: 5, d: 18, h: 18, color: '#111827' },
        pos2d: { x: 22, y: 18, w: 6, h: 14 },
        schematicPos: { x: 230, y: 140 },
        pins: [
          { pin: '1', name: 'AC1', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'AC2', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'DC+', net: 'HV_390V_PFC', expectedVoltage: '310V - 390VDC', expectedDiodeDrop: '0.510V' },
          { pin: '4', name: 'DC-', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.510V' }
        ],
        commonFailureModes: ['Chập 1 trong 4 nhánh đi-ốt gây đứt cầu chì F1 tức khắc'],
        replacementTips: 'Bôi keo tản nhiệt và siết chắc vào tản nhiệt chung sơ cấp.',
        normalTempC: 45,
        faultTempC: 110
      },
      {
        id: 'Q_PFC1',
        label: 'Q_PFC1',
        kind: 'mosfet',
        zone: 'zone-pfc',
        description: 'MOSFET công suất cao cho tầng Active PFC của Infineon Đức.',
        partNumber: 'Infineon IPA60R180P7',
        specs: '650V 18A Rds=0.18Ω CoolMOS P7',
        pos3d: { x: -10, y: 0, z: -10, w: 6, d: 14, h: 18, color: '#1f2937' },
        pos2d: { x: 38, y: 16, w: 6, h: 12 },
        schematicPos: { x: 340, y: 190 },
        pins: [
          { pin: 'G', name: 'GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái 12V', expectedDiodeDrop: 'OL' },
          { pin: 'D', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.490V' },
          { pin: 'S', name: 'SOURCE', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập 3 cực D-G-S do quá áp hoặc xung kích dị thường'],
        replacementTips: 'Thay thế cần kiểm tra điện trở dập xung cổng Gate 10Ω và đi-ốt zener ghim áp chân G.',
        normalTempC: 50,
        faultTempC: 120
      },
      {
        id: 'C_BULK1',
        label: 'C_BULK1',
        kind: 'capacitor_elec',
        zone: 'zone-pfc',
        description: 'Tụ hóa cao áp chính hãng Rubycon Nhật Bản chịu nhiệt độ 105°C.',
        partNumber: 'Rubycon MXH Series',
        specs: '400V 470µF 105°C tuổi thọ 3000 giờ',
        pos3d: { x: 10, y: 0, z: -18, w: 20, d: 20, h: 30, color: '#0f172a' },
        pos2d: { x: 50, y: 14, w: 10, h: 18 },
        schematicPos: { x: 440, y: 140 },
        pins: [
          { pin: '+', name: 'HV+', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: 'OL' },
          { pin: '-', name: 'HV-', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Giảm dung lượng do lão hóa sau nhiều năm khiến nguồn không kích được khi gắn vào dàn PC nặng'],
        replacementTips: 'Bắt buộc xả tụ trước khi chạm tay vào! Dùng đồng hồ đo ESR kiểm tra độ nội trở của tụ.',
        normalTempC: 40,
        faultTempC: 90
      },
      {
        id: 'U_5VSB',
        label: 'U_5VSB',
        kind: 'pwm_ic',
        zone: 'zone-5vsb',
        description: 'IC nguồn cấp trước tích hợp bảo vệ quá tải và mạch khởi động mềm.',
        partNumber: 'EM8569',
        specs: 'DIP-7 Standby PWM Controller with 700V MOSFET',
        pos3d: { x: 28, y: 0, z: -22, w: 8, d: 10, h: 4, color: '#111827' },
        pos2d: { x: 72, y: 14, w: 6, h: 8 },
        schematicPos: { x: 620, y: 140 },
        pins: [
          { pin: '1', name: 'VCC', net: 'HV_390V_PFC', expectedVoltage: '14V', expectedDiodeDrop: '0.610V' },
          { pin: '4', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.510V' },
          { pin: '5', name: 'FB', net: '+5VSB', expectedVoltage: '1.8V', expectedDiodeDrop: '0.720V' }
        ],
        commonFailureModes: ['Nổ thủng lưng IC khi có sét đánh lan truyền qua đường điện lưới'],
        replacementTips: 'Kiểm tra biến áp xung T_5VSB xem có bị đen sạm cuộn sơ cấp hay không.',
        normalTempC: 44,
        faultTempC: 110
      },
      {
        id: 'T_5VSB',
        label: 'T_5VSB',
        kind: 'transformer',
        zone: 'zone-5vsb',
        description: 'Biến áp xung chuyển đổi điện áp 5VSB cách ly an toàn.',
        partNumber: 'TRANS-EE16-5VSB',
        specs: 'Biến áp xung ferrite E16 cách ly 3750V',
        pos3d: { x: 36, y: 0, z: -12, w: 12, d: 12, h: 14, color: '#78350f' },
        pos2d: { x: 80, y: 14, w: 8, h: 10 },
        schematicPos: { x: 720, y: 140 },
        pins: [
          { pin: '1', name: 'PRI', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'SEC_5V', net: '+5VSB', expectedVoltage: '5.08VDC', expectedDiodeDrop: '0.310V' }
        ],
        commonFailureModes: ['Đứt cuộn dây sơ cấp dẫn tới mất nguồn nuôi 5VSB'],
        replacementTips: 'Đo ôm cuộn sơ cấp (thường 2 - 4 Ohm) và cuộn thứ cấp (<0.5 Ohm).',
        normalTempC: 40,
        faultTempC: 95
      },
      {
        id: 'U_LLC',
        label: 'U_LLC',
        kind: 'pwm_ic',
        zone: 'zone-llc',
        description: 'IC điều chế xung cộng hưởng LLC sơ cấp tối ưu hóa chuyển mạch tại điểm điện áp bằng 0 (ZVS).',
        partNumber: 'Champion CM6901T6X',
        specs: 'Hi-Efficiency Resonant LLC & SR Controller',
        pos3d: { x: -26, y: 0, z: 14, w: 8, d: 12, h: 3, color: '#1e293b' },
        pos2d: { x: 12, y: 58, w: 8, h: 10 },
        schematicPos: { x: 180, y: 440 },
        pins: [
          { pin: '1', name: 'VCC', net: 'HV_390V_PFC', expectedVoltage: '14.5V khi kích', expectedDiodeDrop: '0.650V' },
          { pin: '8', name: 'OUT_A', net: 'HV_390V_PFC', expectedVoltage: 'Xung kích LLC', expectedDiodeDrop: '0.580V', waveformHint: 'Xung sin méo tần số 90-120kHz' },
          { pin: '12', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Mất dao động ra khiến mạch không đóng mở MOSFET LLC'],
        replacementTips: 'Đo nguồn nuôi chân VCC trước, kiểm tra opto cách ly tín hiệu mở nguồn.',
        normalTempC: 44,
        faultTempC: 95
      },
      {
        id: 'Q_LLC1',
        label: 'Q_LLC1',
        kind: 'mosfet',
        zone: 'zone-llc',
        description: 'MOSFET chuyển mạch cộng hưởng nhánh trên của biến áp chính.',
        partNumber: 'Champion GPT10N50ADG',
        specs: 'N-Channel 500V 10A Rds=0.38Ω Fast Recovery',
        pos3d: { x: -14, y: 0, z: 12, w: 6, d: 12, h: 16, color: '#111827' },
        pos2d: { x: 24, y: 58, w: 5, h: 12 },
        schematicPos: { x: 280, y: 440 },
        pins: [
          { pin: 'G', name: 'GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung LLC', expectedDiodeDrop: 'OL' },
          { pin: 'D', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.480V' },
          { pin: 'S', name: 'SOURCE', net: 'HV_390V_PFC', expectedVoltage: 'Switch Node', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập chân D-S làm nổ cầu chì và sụt điện áp PFC'],
        replacementTips: 'Bắt buộc thay cặp và kiểm tra tụ cộng hưởng nối tiếp với cuộn sơ cấp.',
        normalTempC: 48,
        faultTempC: 115
      },
      {
        id: 'T_MAIN',
        label: 'T_MAIN',
        kind: 'transformer',
        zone: 'zone-sec-12v',
        description: 'Biến áp xung công suất chính dạng nằm Seasonic PQ-35 hiệu suất cao.',
        partNumber: 'Seasonic PQ-35-650W',
        specs: 'Lõi Ferrite PQ độ tự cảm rò thấp 650W',
        pos3d: { x: 2, y: 0, z: 16, w: 22, d: 22, h: 26, color: '#78350f' },
        pos2d: { x: 38, y: 58, w: 12, h: 16 },
        schematicPos: { x: 420, y: 440 },
        pins: [
          { pin: 'PRI1', name: 'PRI_A', net: 'HV_390V_PFC', expectedVoltage: '390V Xung LLC', expectedDiodeDrop: 'OL' },
          { pin: 'SEC1', name: '12V_OUT', net: '+12V_MAIN', expectedVoltage: '12.18V', expectedDiodeDrop: '0.240V' }
        ],
        commonFailureModes: ['Gãy chân pin cơ học khi va đập mạnh làm đứt mối hàn ngầm dưới bo mạch'],
        replacementTips: 'Dùng kính lúp hoặc kính hiển vi soi kỹ mối hàn chân biến áp to dưới mặt đáy bo mạch.',
        normalTempC: 54,
        faultTempC: 105
      },
      {
        id: 'Q_SR12V',
        label: 'Q_SR12V',
        kind: 'mosfet',
        zone: 'zone-sec-12v',
        description: 'Dàn MOSFET nắn đồng bộ thứ cấp 12V gắn trên các thanh đồng đứng tản nhiệt đối lưu.',
        partNumber: 'NXP PSMN1R8-40YLC',
        specs: 'N-Channel 40V 100A Rds=1.8mΩ siêu nhỏ',
        pos3d: { x: 18, y: 0, z: 14, w: 8, d: 12, h: 8, color: '#1e293b' },
        pos2d: { x: 53, y: 58, w: 6, h: 10 },
        schematicPos: { x: 550, y: 440 },
        pins: [
          { pin: 'D', name: 'DRAIN', net: '+12V_MAIN', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.460V' },
          { pin: 'S', name: 'SOURCE', net: '+12V_MAIN', expectedVoltage: '12.18V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Đánh thủng D-S làm đường 12V thông thẳng mass 0Ω khiến nguồn tự khóa ngắt ngay'],
        replacementTips: 'Dùng mỏ hàn công suất lớn hoặc khò nhiệt để tháo thanh đồng vì diện tích tản nhiệt rất rộng.',
        normalTempC: 48,
        faultTempC: 115
      },
      {
        id: 'U_OPT1',
        label: 'U_OPT1',
        kind: 'optocoupler',
        zone: 'zone-5vsb',
        description: 'Opto cách ly hồi tiếp điều khiển điện áp nguồn cấp trước và lệnh kích hoạt nguồn chính.',
        partNumber: 'Cosmo 1010-817',
        specs: 'DIP-4 High Isolation 5000Vrms',
        pos3d: { x: 26, y: 0, z: -4, w: 4, d: 6, h: 4, color: '#1e293b' },
        pos2d: { x: 72, y: 26, w: 4, h: 6 },
        schematicPos: { x: 620, y: 240 },
        pins: [
          { pin: '1', name: 'A', net: '+5VSB', expectedVoltage: '1.2V', expectedDiodeDrop: '1.020V' },
          { pin: '3', name: 'C', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' },
          { pin: '4', name: 'E', net: 'PS_ON#', expectedVoltage: 'Lệnh mở VCC', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Suy hao độ nhạy quang CTR khiến điện áp ngõ ra bị gợn sóng hoặc sụt tải'],
        replacementTips: 'Thay bằng PC817C, EL817C hoặc TLP521.',
        normalTempC: 34,
        faultTempC: 80
      },
      {
        id: 'MOD_DCDC',
        label: 'MOD_DCDC',
        kind: 'ic',
        zone: 'zone-sec-12v',
        description: 'Module hạ áp DC-DC dạng bo cắm đứng biến đổi đường 12V ra 5V và 3.3V độc lập.',
        partNumber: 'Seasonic DC-DC VRM Daughterboard',
        specs: 'APW7159 Dual PWM Controller + Infineon Low-Rds MOSFETs',
        pos3d: { x: 26, y: 0, z: 22, w: 10, d: 22, h: 20, color: '#047857' },
        pos2d: { x: 63, y: 64, w: 8, h: 16 },
        schematicPos: { x: 680, y: 520 },
        pins: [
          { pin: '12V', name: 'VIN', net: '+12V_MAIN', expectedVoltage: '12.18V', expectedDiodeDrop: '0.420V' },
          { pin: '5V', name: 'VOUT_5V', net: '+5VSB', expectedVoltage: '5.04V', expectedDiodeDrop: '0.380V' },
          { pin: 'GND', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập MOSFET nhánh trên làm xông điện 12V vào đường 5V/3.3V gây cháy ổ cứng'],
        replacementTips: 'Kiểm tra kỹ MOSFET trở kháng trước khi cấp điện.',
        normalTempC: 45,
        faultTempC: 100
      },
      {
        id: 'U_SUP',
        label: 'U_SUP',
        kind: 'super_io',
        zone: 'zone-protection',
        description: 'IC bảo vệ và kiểm soát tín hiệu khởi động toàn diện.',
        partNumber: 'Weltrend WT7527V',
        specs: '16-Pin Dual Rail Supervisor',
        pos3d: { x: 36, y: 0, z: 18, w: 8, d: 12, h: 4, color: '#1e293b' },
        pos2d: { x: 74, y: 66, w: 7, h: 10 },
        schematicPos: { x: 820, y: 560 },
        pins: [
          { pin: 'PSON', name: 'PSON#', net: 'PS_ON#', expectedVoltage: '3.3V (0V khi chạy)', expectedDiodeDrop: '0.620V' },
          { pin: 'PG', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' },
          { pin: 'GND', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Hỏng chân nhận lệnh kích nguồn khiến nối dây xanh lá vào mass nhưng quạt không quay'],
        replacementTips: 'Kiểm tra đường mạch in từ giắc cắm ATX về chân IC xem có bị đứt do gỉ sét.',
        normalTempC: 38,
        faultTempC: 85
      },
      {
        id: 'J_ATX24',
        label: 'J_ATX24',
        kind: 'atx_24pin',
        zone: 'zone-protection',
        description: 'Đầu nối cáp nguồn chính 24-Pin ATX cắm lên bo mạch chủ.',
        partNumber: 'Molex 24-Pin Right Angle',
        specs: 'Chân cos mạ vàng chống oxy hóa',
        pos3d: { x: 42, y: 0, z: 22, w: 6, d: 22, h: 12, color: '#111827' },
        pos2d: { x: 86, y: 58, w: 9, h: 26 },
        schematicPos: { x: 980, y: 480 },
        pins: [
          { pin: '8', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' },
          { pin: '9', name: '+5VSB', net: '+5VSB', expectedVoltage: '5.08V', expectedDiodeDrop: '0.450V' },
          { pin: '10', name: '+12V', net: '+12V_MAIN', expectedVoltage: '12.18V', expectedDiodeDrop: '0.420V' },
          { pin: '16', name: 'PS_ON#', net: 'PS_ON#', expectedVoltage: '3.3V (0V chạy)', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Tiếp xúc lỏng lẻo làm tăng điện trở gây nóng chảy đầu nhựa giắc cắm'],
        replacementTips: 'Bấm lại đầu cos mới nếu thấy chân kim loại bị ố đen hoặc đổi màu tím nhiệt.',
        normalTempC: 35,
        faultTempC: 80
      }
    ],
    wires: [
      { id: 'sw1', netId: 'AC_LINE', fromComponentId: 'F1', fromPin: '2', toComponentId: 'NTC1', toPin: '1' },
      { id: 'sw2', netId: 'AC_LINE', fromComponentId: 'NTC1', fromPin: '2', toComponentId: 'BD1', toPin: '1' },
      { id: 'sw3', netId: 'HV_390V_PFC', fromComponentId: 'BD1', fromPin: '3', toComponentId: 'Q_PFC1', toPin: 'D' },
      { id: 'sw4', netId: 'HV_390V_PFC', fromComponentId: 'Q_PFC1', fromPin: 'D', toComponentId: 'C_BULK1', toPin: '+' },
      { id: 'sw5', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'U_5VSB', toPin: '4' },
      { id: 'sw6', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'Q_LLC1', toPin: 'D' },
      { id: 'sw7', netId: '+5VSB', fromComponentId: 'U_5VSB', fromPin: '5', toComponentId: 'T_5VSB', toPin: '1' },
      { id: 'sw8', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '3', toComponentId: 'U_OPT1', toPin: '1' },
      { id: 'sw9', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '3', toComponentId: 'J_ATX24', toPin: '9' },
      { id: 'sw10', netId: 'HV_390V_PFC', fromComponentId: 'Q_LLC1', fromPin: 'S', toComponentId: 'T_MAIN', toPin: 'PRI1' },
      { id: 'sw11', netId: '+12V_MAIN', fromComponentId: 'T_MAIN', fromPin: 'SEC1', toComponentId: 'Q_SR12V', toPin: 'D' },
      { id: 'sw12', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'MOD_DCDC', toPin: '12V' },
      { id: 'sw13', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'U_SUP', toPin: 'PSON' },
      { id: 'sw14', netId: '+12V_MAIN', fromComponentId: 'Q_SR12V', fromPin: 'S', toComponentId: 'J_ATX24', toPin: '10' },
      { id: 'sw15', netId: 'PS_ON#', fromComponentId: 'J_ATX24', fromPin: '16', toComponentId: 'U_SUP', toPin: 'PSON' },
      { id: 'sw16', netId: 'PWR_OK', fromComponentId: 'U_SUP', fromPin: 'PG', toComponentId: 'J_ATX24', toPin: '8' }
    ]
  },

  // =========================================================================
  // 3. COOLER MASTER MWE BRONZE 650 V2 (Active PFC + Forward / LLC + DC-DC)
  // =========================================================================
  {
    id: 'coolermaster-mwe-650',
    name: 'Cooler Master MWE Bronze 650 V2',
    brand: 'Cooler Master',
    category: 'psu',
    generation: '80+ Bronze MWE V2 (Dual Forward + DC-DC)',
    formFactor: 'ATX 140mm Standard',
    pcbColor: '#18181b',
    pcbSize: { width: 90, depth: 72, thickness: 1.8 },
    summary: 'Bộ nguồn quốc dân phân khúc phổ thông Cooler Master MWE 650 Bronze V2. Sử dụng mạch nâng áp Active PFC, sơ cấp Dual Forward hiệu suất tốt đạt chuẩn 80 Plus Bronze, chỉnh lưu thứ cấp Schottky và bo module VRM DC-DC con biến đổi 5V / 3.3V độc lập.',
    safetyWarning: 'CẢNH BÁO NGUY HIỂM CAO ÁP: Tụ hóa sơ cấp C_BULK1 tích điện 380VDC. Tuyệt đối không chạm tay vào cánh tản nhiệt sơ cấp khi đang cắm điện hoặc chưa xả tụ. Khi sửa chữa luôn sử dụng bóng đèn 60W-100W nối tiếp ngõ vào AC để bảo vệ.',
    powerSequenceId: 'seq-psu-llc-dcdc',
    supports3DSimulation: true,
    docsMeta: {
      schematicStatus: 'block_reference',
      schematicSourceLabel: 'Sơ đồ khối tham chiếu theo Datasheet IC (CM6800UX / EM8569 / ST9S429)',
      missingDataNote:
        'Cooler Master không công bố Schematic gốc dòng MWE Bronze V2. Chưa có ảnh chụp thực tế bản quyền mở cho model này nên phần Ảnh Thực Tế được để trống.',
    },
    zones: [
      {
        id: 'zone-emi',
        name: 'Mạch Lọc Nhiễu Lưới Điện AC & Chỉnh Lưu',
        description: 'Tầng lọc EMI với tụ X2, tụ Y và cầu nắn GBU1006 gắn trên thanh nhôm tản nhiệt sơ cấp.',
        color: '#4f46e5',
        bounds2d: { x: 5, y: 5, w: 26, h: 42 }
      },
      {
        id: 'zone-pfc',
        name: 'Mạch Nâng Áp Active PFC',
        description: 'IC tổ hợp CM6800UX điều khiển MOSFET nâng áp và nạp điện vào tụ lọc Elite 400V 390uF.',
        color: '#dc2626',
        bounds2d: { x: 33, y: 5, w: 33, h: 42 }
      },
      {
        id: 'zone-5vsb',
        name: 'Nguồn Xung Cấp Trước 5VSB',
        description: 'Mạch Flyback tạo điện áp 5V cấp trước nuôi bo mạch chủ ở chế độ chờ cắm điện.',
        color: '#eab308',
        bounds2d: { x: 68, y: 5, w: 27, h: 42 }
      },
      {
        id: 'zone-sec-12v',
        name: 'Chỉnh Lưu Schottky 12V & Module DC-DC Con',
        description: 'Đi-ốt Schottky công suất nắn dòng 12V kết hợp module VRM DC-DC con tạo áp 5V và 3.3V.',
        color: '#10b981',
        bounds2d: { x: 35, y: 50, w: 38, h: 45 }
      },
      {
        id: 'zone-protection',
        name: 'Giám Sát Bảo Vệ Thứ Cấp & Đầu Nối ATX',
        description: 'IC Sitronix ST9S313 kiểm soát ngắt nguồn OVP/UVP và phát cờ Power Good.',
        color: '#8b5cf6',
        bounds2d: { x: 75, y: 50, w: 20, h: 45 }
      }
    ],
    rails: [
      {
        id: 'AC_LINE',
        name: 'Lưới Điện AC 220V',
        nominalVoltage: '220VAC',
        category: 'high_voltage',
        color: '#f59e0b',
        description: 'Điện xoay chiều vào qua cầu chì ngắt mạch.',
        connectedComponents: ['F1', 'BD1']
      },
      {
        id: 'HV_390V_PFC',
        name: 'Điện Áp Cao Áp Sơ Cấp 380V-390V',
        nominalVoltage: '390VDC',
        category: 'high_voltage',
        color: '#ef4444',
        description: 'Đường cao áp sau tầng PFC cấp cho MOSFET công tắc chính và nguồn phụ.',
        connectedComponents: ['Q_PFC1', 'C_BULK1', 'Q_PWM1', 'U_5VSB']
      },
      {
        id: '+5VSB',
        name: 'Điện Áp Cấp Trước 5VSB',
        nominalVoltage: '5.1V',
        category: 'standby',
        color: '#eab308',
        description: 'Nguồn cấp trước liên tục nuôi chip I/O trên Mainboard.',
        connectedComponents: ['U_5VSB', 'C_5VSB_OUT', 'U_OPT1', 'J_ATX24']
      },
      {
        id: '+12V_MAIN',
        name: 'Đường Nguồn Chính 12V',
        nominalVoltage: '12.10V',
        category: 'main_power',
        color: '#10b981',
        description: 'Đường điện 12V nuôi toàn bộ hệ thống máy tính.',
        connectedComponents: ['D_12V_SCHOTTKY', 'MOD_DCDC', 'U_SUP', 'J_ATX24']
      },
      {
        id: 'PS_ON#',
        name: 'Tín Hiệu Kích Nguồn PS_ON#',
        nominalVoltage: '3.3V',
        category: 'control_signal',
        color: '#a855f7',
        description: 'Chân số 16 dây xanh lá kéo mass để khởi động nguồn.',
        connectedComponents: ['J_ATX24', 'U_SUP', 'U_OPT1']
      },
      {
        id: 'PWR_OK',
        name: 'Tín Hiệu Power Good',
        nominalVoltage: '5.0V',
        category: 'control_signal',
        color: '#84cc16',
        description: 'Báo hiệu điện áp các đường đã ổn định.',
        connectedComponents: ['U_SUP', 'J_ATX24']
      },
      {
        id: 'GND',
        name: 'Mass Khung Kim Loại',
        nominalVoltage: '0.0V',
        category: 'ground',
        color: '#64748b',
        description: 'Tiếp mass 0V chung.',
        connectedComponents: ['BD1', 'C_BULK1', 'J_ATX24', 'U_SUP']
      }
    ],
    components: [
      {
        id: 'F1',
        label: 'F1',
        kind: 'fuse',
        zone: 'zone-emi',
        description: 'Cầu chì bảo vệ ngõ vào điện lưới AC.',
        partNumber: 'T8A 250V',
        specs: '8A 250VAC ngắt chậm',
        pos3d: { x: -36, y: 0, z: -26, w: 5, d: 12, h: 5, color: '#f3f4f6' },
        pos2d: { x: 8, y: 14, w: 5, h: 8 },
        schematicPos: { x: 100, y: 140 },
        pins: [
          { pin: '1', name: 'L_IN', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'L_OUT', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Nổ đứt do chập MOSFET nâng áp PFC hoặc chập cầu đi-ốt'],
        replacementTips: 'Thay đúng cầu chì sứ 8A-10A ngắt chậm.',
        normalTempC: 32,
        faultTempC: 95
      },
      {
        id: 'BD1',
        label: 'BD1',
        kind: 'bridge_rectifier',
        zone: 'zone-emi',
        description: 'Cầu đi-ốt nắn toàn kỳ AC sang DC.',
        partNumber: 'GBU1006',
        specs: '600V 10A cầu nắn tích hợp',
        pos3d: { x: -24, y: 0, z: -24, w: 5, d: 18, h: 18, color: '#1f2937' },
        pos2d: { x: 20, y: 16, w: 6, h: 14 },
        schematicPos: { x: 200, y: 140 },
        pins: [
          { pin: 'AC1', name: 'AC_1', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: 'DC+', name: 'DC_POS', net: 'HV_390V_PFC', expectedVoltage: '310V - 390VDC', expectedDiodeDrop: '0.510V' },
          { pin: 'DC-', name: 'DC_NEG', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.510V' }
        ],
        commonFailureModes: ['Chập 1 trong các nhánh đi-ốt gây đứt cầu chì F1'],
        replacementTips: 'Bôi keo tản nhiệt vào mặt lưng tiếp xúc nhôm.',
        normalTempC: 46,
        faultTempC: 110
      },
      {
        id: 'U_COMBO',
        label: 'U_COMBO',
        kind: 'pwm_ic',
        zone: 'zone-pfc',
        description: 'IC dao động tổ hợp điều khiển đồng thời cả tầng Active PFC và tầng biến đổi PWM chính.',
        partNumber: 'Champion CM6800UX',
        specs: 'SOP-16 PFC/PWM Combo Controller danh tiếng',
        pos3d: { x: -16, y: 0, z: -8, w: 8, d: 10, h: 3, color: '#111827' },
        pos2d: { x: 34, y: 14, w: 7, h: 10 },
        schematicPos: { x: 300, y: 220 },
        pins: [
          { pin: 'VCC', name: 'VCC', net: 'HV_390V_PFC', expectedVoltage: '14V', expectedDiodeDrop: '0.640V' },
          { pin: 'PFC_OUT', name: 'PFC_GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái PFC', expectedDiodeDrop: '0.580V', waveformHint: 'Xung vuông PWM' },
          { pin: 'PWM_OUT', name: 'PWM_GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái PWM', expectedDiodeDrop: '0.580V', waveformHint: 'Xung vuông PWM' }
        ],
        commonFailureModes: ['Mất chân dao động ra cổng Gate khiến nguồn không có áp PFC hoặc không kích được nguồn chính'],
        replacementTips: 'Kiểm tra kỹ nguồn cấp VCC 14V và các điện trở mồi phân áp.',
        normalTempC: 44,
        faultTempC: 95
      },
      {
        id: 'Q_PFC1',
        label: 'Q_PFC1',
        kind: 'mosfet',
        zone: 'zone-pfc',
        description: 'MOSFET công suất nâng áp Active PFC.',
        partNumber: 'Magnachip MDP13N50',
        specs: '500V 13A N-Channel MOSFET',
        pos3d: { x: -6, y: 0, z: -10, w: 6, d: 14, h: 18, color: '#1e293b' },
        pos2d: { x: 44, y: 16, w: 6, h: 12 },
        schematicPos: { x: 400, y: 190 },
        pins: [
          { pin: 'G', name: 'GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung lái', expectedDiodeDrop: 'OL' },
          { pin: 'D', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.480V' },
          { pin: 'S', name: 'SOURCE', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Đánh thủng D-S nổ cầu chì F1 và làm đứt điện trở hồi tiếp chân S (Shunt Resistor)'],
        replacementTips: 'Bắt buộc kiểm tra điện trở dập xung cổng Gate và trở Shunt cảm biến dòng trước khi thay.',
        normalTempC: 50,
        faultTempC: 125
      },
      {
        id: 'C_BULK1',
        label: 'C_BULK1',
        kind: 'capacitor_elec',
        zone: 'zone-pfc',
        description: 'Tụ hóa lọc cao áp chính.',
        partNumber: 'Elite / Teapo 400V 390uF',
        specs: '400V 390µF 85°C/105°C',
        pos3d: { x: 10, y: 0, z: -18, w: 18, d: 18, h: 28, color: '#0f172a' },
        pos2d: { x: 54, y: 14, w: 9, h: 18 },
        schematicPos: { x: 500, y: 140 },
        pins: [
          { pin: '+', name: 'POS', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: 'OL' },
          { pin: '-', name: 'NEG', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Khô dung dịch làm sụt nguồn khi máy tính vào game nặng hoặc stress test'],
        replacementTips: 'Xả sạch điện áp trên tụ trước khi tháo gỡ! Nâng cấp lên tụ Nhật 105°C nếu có điều kiện.',
        normalTempC: 42,
        faultTempC: 85
      },
      {
        id: 'U_5VSB',
        label: 'U_5VSB',
        kind: 'pwm_ic',
        zone: 'zone-5vsb',
        description: 'IC nguồn cấp trước độc lập.',
        partNumber: 'FSL106HR DIP-8',
        specs: '650V Green Mode Power Switch',
        pos3d: { x: 28, y: 0, z: -20, w: 7, d: 9, h: 4, color: '#111827' },
        pos2d: { x: 74, y: 14, w: 6, h: 8 },
        schematicPos: { x: 660, y: 140 },
        pins: [
          { pin: 'DRAIN', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.510V' },
          { pin: 'VCC', name: 'VCC', net: 'HV_390V_PFC', expectedVoltage: '12V-15V', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Nổ IC do chập tải ngõ ra hoặc quá nhiệt'],
        replacementTips: 'Kiểm tra tụ lọc ngõ ra C_5VSB_OUT xem có bị phồng rộp làm quá tải IC.',
        normalTempC: 45,
        faultTempC: 110
      },
      {
        id: 'C_5VSB_OUT',
        label: 'C_5VSB_OUT',
        kind: 'capacitor_elec',
        zone: 'zone-5vsb',
        description: 'Tụ hóa lọc ngõ ra 5VSB.',
        partNumber: 'CapXon 10V 1000uF Low ESR',
        specs: '10V 1000µF 105°C',
        pos3d: { x: 36, y: 0, z: -10, w: 8, d: 8, h: 14, color: '#1e3a8a' },
        pos2d: { x: 82, y: 18, w: 5, h: 8 },
        schematicPos: { x: 760, y: 140 },
        pins: [
          { pin: '+', name: '+5V', net: '+5VSB', expectedVoltage: '5.1VDC', expectedDiodeDrop: '0.340V' },
          { pin: '-', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Phồng đít rỉ dầu làm mất 5VSB hoặc điện áp 5VSB bị gợn sóng nhiễu nặng'],
        replacementTips: 'Thay thế bằng tụ lọc chất lượng cao Nhật Bản 16V 1000uF hoặc 1500uF.',
        normalTempC: 40,
        faultTempC: 85
      },
      {
        id: 'Q_PWM1',
        label: 'Q_PWM1',
        kind: 'mosfet',
        zone: 'zone-pfc',
        description: 'MOSFET công tắc xung biến áp chính.',
        partNumber: 'CS18N50 500V 18A',
        specs: '500V 18A N-Channel MOSFET',
        pos3d: { x: -14, y: 0, z: 12, w: 6, d: 14, h: 18, color: '#111827' },
        pos2d: { x: 22, y: 58, w: 5, h: 12 },
        schematicPos: { x: 260, y: 440 },
        pins: [
          { pin: 'G', name: 'GATE', net: 'HV_390V_PFC', expectedVoltage: 'Xung kích', expectedDiodeDrop: 'OL' },
          { pin: 'D', name: 'DRAIN', net: 'HV_390V_PFC', expectedVoltage: '390VDC', expectedDiodeDrop: '0.480V' }
        ],
        commonFailureModes: ['Chập D-S làm nổ cầu chì'],
        replacementTips: 'Bôi keo tản nhiệt và lót tấm cách điện cẩn thận.',
        normalTempC: 50,
        faultTempC: 120
      },
      {
        id: 'T_MAIN',
        label: 'T_MAIN',
        kind: 'transformer',
        zone: 'zone-sec-12v',
        description: 'Biến áp xung chính biến đổi điện áp sơ cấp xuống 12V.',
        partNumber: 'TRANS-ER35-MWE',
        specs: 'Lõi Ferrite ER-35 650W',
        pos3d: { x: 2, y: 0, z: 16, w: 22, d: 22, h: 26, color: '#78350f' },
        pos2d: { x: 36, y: 58, w: 12, h: 16 },
        schematicPos: { x: 400, y: 440 },
        pins: [
          { pin: 'PRI', name: 'PRI', net: 'HV_390V_PFC', expectedVoltage: 'Xung cao tần', expectedDiodeDrop: 'OL' },
          { pin: 'SEC', name: 'SEC_12V', net: '+12V_MAIN', expectedVoltage: 'Xung 12V', expectedDiodeDrop: '0.240V' }
        ],
        commonFailureModes: ['Rất bền, hiếm khi hỏng hóc'],
        replacementTips: 'Kiểm tra mối hàn chân biến áp to dưới mặt bo.',
        normalTempC: 55,
        faultTempC: 105
      },
      {
        id: 'D_12V_SCHOTTKY',
        label: 'D_12V_SCHOTTKY',
        kind: 'diode',
        zone: 'zone-sec-12v',
        description: 'Cặp đi-ốt nắn kép Schottky chịu dòng cao gắn trên tản nhiệt nhôm thứ cấp.',
        partNumber: 'MBR30100PT',
        specs: 'Schottky Barrier 100V 30A Dual Diode TO-247',
        pos3d: { x: 18, y: 0, z: 14, w: 6, d: 14, h: 18, color: '#1f2937' },
        pos2d: { x: 52, y: 56, w: 6, h: 12 },
        schematicPos: { x: 530, y: 440 },
        pins: [
          { pin: 'A1', name: 'ANODE1', net: '+12V_MAIN', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.360V' },
          { pin: 'K', name: 'CATHODE', net: '+12V_MAIN', expectedVoltage: '12.10VDC', expectedDiodeDrop: '0.000V' },
          { pin: 'A2', name: 'ANODE2', net: '+12V_MAIN', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.360V' }
        ],
        commonFailureModes: ['Chập 1 trong 2 đi-ốt bên trong khiến đường 12V bị chập tải, nguồn kích ngắt ngay lập tức'],
        replacementTips: 'Đo thang Diode giữa chân giữa Cathode và 2 chân bên Anode: bình thường phải rơi vào khoảng 0.350V - 0.450V. Nếu 0.000V là chập.',
        normalTempC: 55,
        faultTempC: 130
      },
      {
        id: 'U_OPT1',
        label: 'U_OPT1',
        kind: 'optocoupler',
        zone: 'zone-5vsb',
        description: 'Opto quang cách ly tín hiệu hồi tiếp.',
        partNumber: 'EL817',
        specs: 'DIP-4 Optocoupler',
        pos3d: { x: 26, y: 0, z: -4, w: 4, d: 6, h: 4, color: '#1e293b' },
        pos2d: { x: 72, y: 26, w: 4, h: 6 },
        schematicPos: { x: 640, y: 240 },
        pins: [
          { pin: '1', name: 'A', net: '+5VSB', expectedVoltage: '1.2V', expectedDiodeDrop: '1.050V' },
          { pin: '4', name: 'C', net: 'PS_ON#', expectedVoltage: 'Hồi tiếp', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Suy giảm hệ số truyền quang làm điện áp ra chập chờn'],
        replacementTips: 'Thay thử opto PC817 mới khi điện áp hồi tiếp bị sai lệch.',
        normalTempC: 34,
        faultTempC: 80
      },
      {
        id: 'MOD_DCDC',
        label: 'MOD_DCDC',
        kind: 'ic',
        zone: 'zone-sec-12v',
        description: 'Module bo con chuyển đổi DC-DC hạ áp 12V ra 5V và 3.3V độc lập.',
        partNumber: 'DC-DC Module APW7073',
        specs: 'Module cắm đứng VRM',
        pos3d: { x: 26, y: 0, z: 22, w: 10, d: 22, h: 18, color: '#047857' },
        pos2d: { x: 62, y: 64, w: 8, h: 16 },
        schematicPos: { x: 660, y: 520 },
        pins: [
          { pin: 'IN', name: '12V_IN', net: '+12V_MAIN', expectedVoltage: '12.10V', expectedDiodeDrop: '0.420V' },
          { pin: 'OUT', name: '5V_OUT', net: '+5VSB', expectedVoltage: '5.05V', expectedDiodeDrop: '0.380V' }
        ],
        commonFailureModes: ['Chập MOSFET hạ áp hoặc khô tụ rắn lọc ngõ ra'],
        replacementTips: 'Tháo module ra ngoài để kiểm tra độc lập nếu nghi ngờ chập.',
        normalTempC: 45,
        faultTempC: 100
      },
      {
        id: 'U_SUP',
        label: 'U_SUP',
        kind: 'super_io',
        zone: 'zone-protection',
        description: 'IC bảo vệ và phát cờ Power Good.',
        partNumber: 'Sitronix ST9S313',
        specs: '14-Pin Protection IC',
        pos3d: { x: 36, y: 0, z: 18, w: 8, d: 12, h: 4, color: '#1e293b' },
        pos2d: { x: 74, y: 66, w: 7, h: 10 },
        schematicPos: { x: 800, y: 560 },
        pins: [
          { pin: 'PSON', name: 'PSON#', net: 'PS_ON#', expectedVoltage: '3.3V (0V chạy)', expectedDiodeDrop: '0.620V' },
          { pin: 'PG', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' }
        ],
        commonFailureModes: ['Hỏng cổng logic kích nguồn làm nguồn tê liệt'],
        replacementTips: 'Kiểm tra chân PSON và điện áp cấp vào chân VDD.',
        normalTempC: 38,
        faultTempC: 85
      },
      {
        id: 'J_ATX24',
        label: 'J_ATX24',
        kind: 'atx_24pin',
        zone: 'zone-protection',
        description: 'Giắc cắm nguồn 24-Pin ATX.',
        partNumber: 'ATX 24P Right-Angle',
        specs: 'Chuẩn chân cắm 24 chân',
        pos3d: { x: 42, y: 0, z: 22, w: 6, d: 22, h: 12, color: '#111827' },
        pos2d: { x: 86, y: 58, w: 9, h: 26 },
        schematicPos: { x: 960, y: 480 },
        pins: [
          { pin: '8', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' },
          { pin: '9', name: '+5VSB', net: '+5VSB', expectedVoltage: '5.1V', expectedDiodeDrop: '0.450V' },
          { pin: '10', name: '+12V', net: '+12V_MAIN', expectedVoltage: '12.10V', expectedDiodeDrop: '0.420V' },
          { pin: '16', name: 'PS_ON#', net: 'PS_ON#', expectedVoltage: '3.3V (0V chạy)', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Nóng chảy chân do máy tải nặng kéo dài'],
        replacementTips: 'Vệ sinh và nắn lại ngàm bấm chân tiếp xúc.',
        normalTempC: 35,
        faultTempC: 80
      }
    ],
    wires: [
      { id: 'cw1', netId: 'AC_LINE', fromComponentId: 'F1', fromPin: '2', toComponentId: 'BD1', toPin: 'AC1' },
      { id: 'cw2', netId: 'HV_390V_PFC', fromComponentId: 'BD1', fromPin: 'DC+', toComponentId: 'Q_PFC1', toPin: 'D' },
      { id: 'cw3', netId: 'HV_390V_PFC', fromComponentId: 'Q_PFC1', fromPin: 'D', toComponentId: 'C_BULK1', toPin: '+' },
      { id: 'cw4', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'U_5VSB', toPin: 'DRAIN' },
      { id: 'cw5', netId: 'HV_390V_PFC', fromComponentId: 'C_BULK1', fromPin: '+', toComponentId: 'Q_PWM1', toPin: 'D' },
      { id: 'cw6', netId: '+5VSB', fromComponentId: 'U_5VSB', fromPin: 'VCC', toComponentId: 'C_5VSB_OUT', toPin: '+' },
      { id: 'cw7', netId: '+5VSB', fromComponentId: 'C_5VSB_OUT', fromPin: '+', toComponentId: 'U_OPT1', toPin: '1' },
      { id: 'cw8', netId: '+5VSB', fromComponentId: 'C_5VSB_OUT', fromPin: '+', toComponentId: 'J_ATX24', toPin: '9' },
      { id: 'cw9', netId: 'HV_390V_PFC', fromComponentId: 'Q_PWM1', fromPin: 'D', toComponentId: 'T_MAIN', toPin: 'PRI' },
      { id: 'cw10', netId: '+12V_MAIN', fromComponentId: 'T_MAIN', fromPin: 'SEC', toComponentId: 'D_12V_SCHOTTKY', toPin: 'A1' },
      { id: 'cw11', netId: '+12V_MAIN', fromComponentId: 'D_12V_SCHOTTKY', fromPin: 'K', toComponentId: 'MOD_DCDC', toPin: 'IN' },
      { id: 'cw12', netId: '+12V_MAIN', fromComponentId: 'D_12V_SCHOTTKY', fromPin: 'K', toComponentId: 'U_SUP', toPin: 'PSON' },
      { id: 'cw13', netId: '+12V_MAIN', fromComponentId: 'D_12V_SCHOTTKY', fromPin: 'K', toComponentId: 'J_ATX24', toPin: '10' },
      { id: 'cw14', netId: 'PS_ON#', fromComponentId: 'J_ATX24', fromPin: '16', toComponentId: 'U_SUP', toPin: 'PSON' },
      { id: 'cw15', netId: 'PWR_OK', fromComponentId: 'U_SUP', fromPin: 'PG', toComponentId: 'J_ATX24', toPin: '8' }
    ]
  },

  // =========================================================================
  // 4. GENERIC ATX TL494 (Huntkey / AcBel / Golden Field BJT 13007/13009)
  // =========================================================================
  {
    id: 'generic-atx-tl494',
    name: 'Nguồn ATX Phổ Thông TL494 (Huntkey / AcBel / Golden Field)',
    brand: 'Huntkey / AcBel Generic',
    category: 'psu',
    generation: 'ATX Non-PFC / Passive PFC Legacy TL494 Topology',
    formFactor: 'ATX 140mm Standard Cáp Liền',
    pcbColor: '#854d0e',
    pcbSize: { width: 88, depth: 70, thickness: 1.6 },
    summary: 'Sơ đồ bộ nguồn máy tính ATX kinh điển sử dụng IC điều chế độ rộng xung TL494 (hoặc KA7500B), cặp bóng bán dẫn công suất lưỡng cực BJT NPN MJE13007 / 13009 mắc theo kiểu nửa cầu (Half-Bridge), mạch nắn lọc chung cuộn cảm từ tính (Group Regulation Choke) và IC so sánh bảo vệ LM339 / LP7510. Dòng nguồn phổ biến nhất tại các tiệm net và văn phòng Việt Nam.',
    safetyWarning: 'CẢNH BÁO NGUY HIỂM ĐIỆN GIẬT 310VDC: Hai tụ lọc cao áp C_HV1 & C_HV2 mắc nối tiếp tạo điểm giữa 155VDC, tích trữ điện thế lên tới 310VDC rất dễ gây giật chết người. Cánh tản nhiệt sơ cấp gắn BJT 13007 mang điện thế cao áp trực tiếp! Bắt buộc xả tụ và luôn cắm nối tiếp qua bóng đèn dây tóc 220V/60W khi thử kích nguồn.',
    powerSequenceId: 'seq-psu-tl494',
    supports3DSimulation: true,
    realPhoto: {
      imageUrl: './boards/atx-psu-tl494.jpg',
      sourceLabel: 'Wikimedia Commons — File:ATX power supply interior.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:ATX_power_supply_interior.jpg',
      license: 'Public Domain',
      author: 'Alan Liefting',
      viewNote:
        'Ảnh nội thất thực tế bộ nguồn ATX Half-Bridge kinh điển (A: Cầu nắn/Lọc EMI, B: Cặp tụ 200V, C: Biến áp chính, D: Cuộn cảm lọc chung, E: Tụ lọc ngõ ra). Một số IC DIP điều khiển bị che khuất bởi bó dây và cánh tản nhiệt.',
    },
    docsMeta: {
      schematicStatus: 'public_reference',
      schematicSourceLabel: 'Mạch Half-Bridge ATX phổ thông công khai (TL494 / KA7500B + LM339)',
    },
    zones: [
      {
        id: 'zone-emi',
        name: 'Tầng Chỉnh Lưu AC & Cặp Tụ Nối Tiếp Điểm Giữa',
        description: 'Cầu đi-ốt nắn dòng ngõ vào và cặp tụ hóa cao áp 200V mắc nối tiếp tạo điểm cân bằng 155V cho sơ đồ nửa cầu.',
        color: '#4f46e5',
        bounds2d: { x: 5, y: 5, w: 26, h: 42 },
        photoBounds: { x: 6, y: 12, w: 17, h: 60 }
      },
      {
        id: 'zone-5vsb',
        name: 'Mạch Nguồn Cấp Trước 5VSB (Transistor 2N60/C5027)',
        description: 'Mạch tự kích dao động nghẹt Flyback dùng bóng C5027 hoặc 2N60 tạo nguồn 5VSB nuôi chân 9 giắc 24-pin.',
        color: '#eab308',
        bounds2d: { x: 33, y: 5, w: 33, h: 42 },
        photoBounds: { x: 32, y: 12, w: 18, h: 20 }
      },
      {
        id: 'zone-pwm-sec',
        name: 'Mạch Điều Khiển Trung Tâm TL494 & Kích Lái Biến Áp Driver',
        description: 'IC kinh điển TL494 / KA7500B điều chế xung lái qua 2 bóng transistor đệm C945 và biến áp đảo pha kích 2 bóng công suất.',
        color: '#0284c7',
        bounds2d: { x: 68, y: 5, w: 27, h: 42 },
        photoBounds: { x: 28, y: 51, w: 28, h: 22 }
      },
      {
        id: 'zone-halfbridge',
        name: 'Cặp Bóng BJT Công Suất Nửa Cầu MJE13007/13009',
        description: 'Hai bóng BJT NPN công suất cao chịu áp 700V đóng cắt luân phiên nạp xả dòng điện qua biến áp xung chính EI-33.',
        color: '#dc2626',
        bounds2d: { x: 5, y: 50, w: 32, h: 45 },
        photoBounds: { x: 20, y: 11, w: 11, h: 42 }
      },
      {
        id: 'zone-sec-group',
        name: 'Chỉnh Lưu Thứ Cấp & Cuộn Cảm Lọc Chung Từ Tính',
        description: 'Các cặp đi-ốt kép Schottky nắn 12V, 5V, 3.3V đi qua cuộn cảm lõi xuyến lọc chung nhiều vòng dây.',
        color: '#10b981',
        bounds2d: { x: 39, y: 50, w: 34, h: 45 },
        photoBounds: { x: 31, y: 29, w: 42, h: 40 }
      },
      {
        id: 'zone-protection',
        name: 'Mạch Bảo Vệ LM339 & Giắc Ra ATX',
        description: 'IC so sánh khuếch đại thuật toán LM339 hoặc LP7510 giám sát bảo vệ và xuất cờ Power Good.',
        color: '#8b5cf6',
        bounds2d: { x: 75, y: 50, w: 20, h: 45 },
        photoBounds: { x: 66, y: 2, w: 29, h: 66 }
      }
    ],
    rails: [
      {
        id: 'AC_LINE',
        name: 'Điện Lưới AC 220V',
        nominalVoltage: '220VAC',
        category: 'high_voltage',
        color: '#f59e0b',
        description: 'Điện lưới vào qua cầu chì ống thủy tinh.',
        connectedComponents: ['F1', 'BD1']
      },
      {
        id: 'HV_310V_DC',
        name: 'Đường Cao Áp Sơ Cấp 310VDC (Non-PFC)',
        nominalVoltage: '310VDC',
        category: 'high_voltage',
        color: '#ef4444',
        description: 'Điện áp nắn trực tiếp từ lưới AC nạp vào cặp tụ 200V mắc nối tiếp.',
        connectedComponents: ['BD1', 'C_HV1', 'Q_5VSB', 'Q_SW1']
      },
      {
        id: '+5VSB',
        name: 'Đường Nguồn Cấp Trước 5VSB',
        nominalVoltage: '5.0V',
        category: 'standby',
        color: '#eab308',
        description: 'Đường nguồn cấp trước liên tục nuôi dây tím giắc ATX.',
        connectedComponents: ['T_5VSB', 'C_5VSB_EC', 'J_ATX24']
      },
      {
        id: 'VCC_TL494',
        name: 'Nguồn Nuôi IC TL494 (12V - 20V)',
        nominalVoltage: '14.0V',
        category: 'main_power',
        color: '#06b6d4',
        description: 'Nguồn nuôi chân 12 IC TL494 trích từ cuộn phụ biến áp 5VSB.',
        connectedComponents: ['T_5VSB', 'U_PWM']
      },
      {
        id: '+12V_OUT',
        name: 'Đường Điện Áp Chính 12V',
        nominalVoltage: '12.0V',
        category: 'main_power',
        color: '#10b981',
        description: 'Đường 12V nắn từ biến áp xung chính qua đi-ốt kép và cuộn lọc chung.',
        connectedComponents: ['D_12V', 'L_GROUP', 'C_OUT_12V', 'U_SUP', 'J_ATX24']
      },
      {
        id: '+5V_OUT',
        name: 'Đường Điện Áp Chính 5V',
        nominalVoltage: '5.0V',
        category: 'main_power',
        color: '#f97316',
        description: 'Đường 5V công suất lớn cấp cho bo mạch chủ và ổ đĩa.',
        connectedComponents: ['D_5V', 'L_GROUP', 'U_SUP', 'J_ATX24']
      },
      {
        id: 'PS_ON#',
        name: 'Chân Kích Nguồn (Dây Xanh Lá Chân 16)',
        nominalVoltage: '3.3V - 5.0V',
        category: 'control_signal',
        color: '#a855f7',
        description: 'Chân nhận lệnh kích nguồn từ Mainboard kéo mass 0V để chạy.',
        connectedComponents: ['J_ATX24', 'U_SUP', 'U_PWM']
      },
      {
        id: 'PWR_OK',
        name: 'Tín Hiệu Power Good (Dây Xám Chân 8)',
        nominalVoltage: '5.0V',
        category: 'control_signal',
        color: '#84cc16',
        description: 'Tín hiệu phản hồi nguồn tốt lên chân 8 giắc ATX.',
        connectedComponents: ['U_SUP', 'J_ATX24']
      },
      {
        id: 'GND',
        name: 'Mass Chung 0V',
        nominalVoltage: '0.0V',
        category: 'ground',
        color: '#64748b',
        description: 'Điểm nối đất chung thứ cấp.',
        connectedComponents: ['BD1', 'C_HV1', 'C_OUT_12V', 'J_ATX24', 'U_SUP']
      }
    ],
    components: [
      {
        id: 'F1',
        label: 'F1',
        kind: 'fuse',
        zone: 'zone-emi',
        description: 'Cầu chì ống thủy tinh bảo vệ ngõ vào AC chống chập nổ.',
        partNumber: 'F5A 250V Glass Tube',
        specs: '5A 250VAC ngắt nhanh',
        pos3d: { x: -36, y: 0, z: -26, w: 5, d: 12, h: 5, color: '#f3f4f6' },
        pos2d: { x: 8, y: 14, w: 5, h: 8 },
        photoPos: { x: 11, y: 57.5, w: 11, h: 5.5 },
        schematicPos: { x: 80, y: 140 },
        pins: [
          { pin: '1', name: 'AC_L_IN', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'AC_L_OUT', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Nổ đen ngòm bóng thủy tinh do chập cặp bóng 13007 hoặc nổ cầu đi-ốt'],
        replacementTips: 'Bắt buộc thay đúng cầu chì 5A. Tuyệt đối không câu tắt bằng sợi dây đồng to.',
        normalTempC: 30,
        faultTempC: 110
      },
      {
        id: 'BD1',
        label: 'BD1',
        kind: 'bridge_rectifier',
        zone: 'zone-emi',
        description: 'Cầu nắn dòng toàn kỳ hoặc 4 đi-ốt rời nắn AC thành DC 310V.',
        partNumber: 'KBL406',
        specs: '600V 4A cầu nắn dẹp',
        pos3d: { x: -24, y: 0, z: -24, w: 4, d: 14, h: 14, color: '#1f2937' },
        pos2d: { x: 20, y: 16, w: 6, h: 12 },
        photoPos: { x: 12.5, y: 42.5, w: 8, h: 6.5 },
        photoNote: 'Cầu đi-ốt nằm ngay phía sau cuộn lọc EMI (vị trí A)',
        schematicPos: { x: 170, y: 140 },
        pins: [
          { pin: '1', name: 'AC1', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'AC2', net: 'AC_LINE', expectedVoltage: '220VAC', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'DC+', net: 'HV_310V_DC', expectedVoltage: '310VDC', expectedDiodeDrop: '0.520V' },
          { pin: '4', name: 'DC-', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.520V' }
        ],
        commonFailureModes: ['Chập 1 hoặc 2 nhánh nắn dẫn tới nổ cầu chì ống F1 ngay khi vừa cắm điện'],
        replacementTips: 'Có thể thay bằng KBL608, RS407 hoặc 4 con 1N5408 mắc cầu.',
        normalTempC: 45,
        faultTempC: 110
      },
      {
        id: 'C_HV1',
        label: 'C_HV1',
        kind: 'capacitor_elec',
        zone: 'zone-emi',
        description: 'Cặp tụ hóa cao áp mắc nối tiếp tạo điểm chia điện áp giữa 155VDC cung cấp cho nửa cầu.',
        partNumber: 'Canicon / ChengX 200V 470uF',
        specs: '200V 470µF 85°C (Cặp đôi nối tiếp)',
        pos3d: { x: -8, y: 0, z: -20, w: 18, d: 18, h: 26, color: '#1e3a8a' },
        pos2d: { x: 30, y: 14, w: 8, h: 16 },
        photoPos: { x: 8, y: 14, w: 13.5, h: 28.5 },
        schematicPos: { x: 270, y: 140 },
        pins: [
          { pin: '+', name: 'POS', net: 'HV_310V_DC', expectedVoltage: '310VDC', expectedDiodeDrop: 'OL' },
          { pin: 'MID', name: 'MID_POINT', net: 'HV_310V_DC', expectedVoltage: '155VDC', expectedDiodeDrop: 'OL' },
          { pin: '-', name: 'NEG', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Lệch điện áp giữa 2 tụ (ví dụ 1 tụ 220V, 1 tụ 90V) do đứt trở cân bằng 150kΩ làm nổ bung tụ'],
        replacementTips: 'Bắt buộc đo kiểm tra 2 điện trở cân bằng (150kΩ - 220kΩ 1W) mắc song song với mỗi tụ.',
        normalTempC: 38,
        faultTempC: 90
      },
      {
        id: 'Q_5VSB',
        label: 'Q_5VSB',
        kind: 'mosfet',
        zone: 'zone-5vsb',
        description: 'Bóng công suất nguồn cấp trước (thường là BJT 2SC5027 hoặc MOSFET 2N60).',
        partNumber: '2SC5027 / 2N60',
        specs: '800V 3A BJT công suất cao',
        pos3d: { x: 14, y: 0, z: -22, w: 5, d: 10, h: 14, color: '#111827' },
        pos2d: { x: 44, y: 14, w: 5, h: 10 },
        photoPos: { x: 21, y: 38, w: 7, h: 12 },
        photoNote: 'Gắn trên thanh nhôm tản nhiệt sơ cấp',
        schematicPos: { x: 380, y: 140 },
        pins: [
          { pin: 'B', name: 'BASE', net: 'HV_310V_DC', expectedVoltage: '0.7V', expectedDiodeDrop: '0.680V' },
          { pin: 'C', name: 'COLLECTOR', net: 'HV_310V_DC', expectedVoltage: '310VDC', expectedDiodeDrop: '0.510V' },
          { pin: 'E', name: 'EMITTER', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập C-E do tụ hồi tiếp chân B bị khô làm dao động quá mạnh'],
        replacementTips: 'Luôn thay tụ điện hóa nhỏ 10uF/50V hoặc 2.2uF/50V tại chân B của C5027 khi sửa nguồn cấp trước.',
        normalTempC: 45,
        faultTempC: 120
      },
      {
        id: 'T_5VSB',
        label: 'T_5VSB',
        kind: 'transformer',
        zone: 'zone-5vsb',
        description: 'Biến áp xung cấp trước kích thước nhỏ EE-16.',
        partNumber: 'TRANS-EE16',
        specs: 'Biến áp xung 5VSB + Cuộn nuôi VCC TL494',
        pos3d: { x: 24, y: 0, z: -15, w: 12, d: 12, h: 14, color: '#78350f' },
        pos2d: { x: 54, y: 14, w: 7, h: 10 },
        photoPos: { x: 38.5, y: 14, w: 10, h: 15.5 },
        schematicPos: { x: 480, y: 140 },
        pins: [
          { pin: '1', name: 'PRI', net: 'HV_310V_DC', expectedVoltage: '310V Xung', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'SEC_5V', net: '+5VSB', expectedVoltage: '5.0VDC', expectedDiodeDrop: '0.320V' },
          { pin: '4', name: 'SEC_VCC', net: 'VCC_TL494', expectedVoltage: '14.0VDC', expectedDiodeDrop: '0.450V' }
        ],
        commonFailureModes: ['Đứt cuộn dây sơ cấp làm mất hoàn toàn nguồn phụ 5VSB'],
        replacementTips: 'Đo ôm cuộn sơ cấp (khoảng 3 - 6 Ohm).',
        normalTempC: 42,
        faultTempC: 95
      },
      {
        id: 'C_5VSB_EC',
        label: 'C_5VSB_EC',
        kind: 'capacitor_elec',
        zone: 'zone-5vsb',
        description: 'Tụ hóa lọc ngõ ra 5VSB (Pan bệnh kinh điển khiến vọt áp nổ mainboard).',
        partNumber: '10V 1000uF Electrolytic',
        specs: '10V 1000µF Low-ESR',
        pos3d: { x: 32, y: 0, z: -8, w: 8, d: 8, h: 12, color: '#1e3a8a' },
        pos2d: { x: 63, y: 16, w: 5, h: 8 },
        photoPos: { x: 61, y: 12, w: 6, h: 8 },
        schematicPos: { x: 570, y: 140 },
        pins: [
          { pin: '+', name: '5VSB_OUT', net: '+5VSB', expectedVoltage: '5.0V', expectedDiodeDrop: '0.350V' },
          { pin: '-', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Tụ phồng rộp khô dung dịch làm mất lọc hồi tiếp khiến áp 5VSB vọt lên 8V - 10V làm chết chip Super I/O và chip Nam Mainboard!'],
        replacementTips: 'Bệnh kinh điển nhất của nguồn Huntkey / AcBel cỏ: Thấy máy hỏng mainboard là phải đo ngay 5VSB! Bắt buộc thay tụ 16V 1500uF chất lượng tốt.',
        normalTempC: 38,
        faultTempC: 85
      },
      {
        id: 'U_PWM',
        label: 'U_PWM',
        kind: 'pwm_ic',
        zone: 'zone-pwm-sec',
        description: 'IC điều khiển độ rộng xung PWM kinh điển TL494 / KA7500B chân cắm DIP-16.',
        partNumber: 'Texas Instruments TL494CN / Fairchild KA7500B',
        specs: 'DIP-16 Voltage Mode PWM Controller with Dual Error Amplifiers',
        pos3d: { x: 26, y: 0, z: 8, w: 8, d: 16, h: 4, color: '#111827' },
        pos2d: { x: 74, y: 14, w: 8, h: 12 },
        schematicPos: { x: 700, y: 150 },
        pins: [
          { pin: '4', name: 'DTC', net: 'PS_ON#', expectedVoltage: 'Chờ: 3.5V (Khóa), Chạy: 0V (Mở xung)', expectedDiodeDrop: '0.620V' },
          { pin: '8', name: 'C1', net: 'VCC_TL494', expectedVoltage: 'Xung lái nửa chu kỳ A (50kHz)', expectedDiodeDrop: '0.580V', waveformHint: 'Xung vuông 50kHz biên độ 12V' },
          { pin: '11', name: 'C2', net: 'VCC_TL494', expectedVoltage: 'Xung lái nửa chu kỳ B (50kHz)', expectedDiodeDrop: '0.580V', waveformHint: 'Xung vuông 50kHz ngược pha' },
          { pin: '12', name: 'VCC', net: 'VCC_TL494', expectedVoltage: '14.0VDC', expectedDiodeDrop: '0.650V' },
          { pin: '14', name: 'REF', net: 'VCC_TL494', expectedVoltage: '5.0V chuẩn', expectedDiodeDrop: '0.710V' }
        ],
        commonFailureModes: ['Mất áp chuẩn 5V ở chân 14 REF làm toàn bộ IC ngừng làm việc', 'Chết ngõ ra C1/C2 không xuất xung kích lái'],
        replacementTips: 'Đo chân 12 có 14V và chân 14 phải có đúng 5.0V chuẩn. Có thể thay thế tương đương hoàn hảo giữa TL494 và KA7500.',
        normalTempC: 40,
        faultTempC: 90
      },
      {
        id: 'T_DRIVE',
        label: 'T_DRIVE',
        kind: 'transformer',
        zone: 'zone-pwm-sec',
        description: 'Biến áp kích lái cách ly Driver EE-16 truyền xung từ thứ cấp kích mở 2 bóng 13007 sơ cấp.',
        partNumber: 'TRANS-DRIVER-EE16',
        specs: 'Biến áp đảo pha kích lái cách ly 2 kênh BJT',
        pos3d: { x: 10, y: 0, z: 8, w: 10, d: 10, h: 12, color: '#78350f' },
        pos2d: { x: 60, y: 32, w: 6, h: 8 },
        photoPos: { x: 42, y: 52.5, w: 7.5, h: 7.5 },
        schematicPos: { x: 600, y: 280 },
        pins: [
          { pin: '1', name: 'PRI_A', net: 'VCC_TL494', expectedVoltage: 'Xung kích từ C945', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'SEC_B1', net: 'HV_310V_DC', expectedVoltage: 'Xung kích chân B bóng trên', expectedDiodeDrop: 'OL' },
          { pin: '5', name: 'SEC_B2', net: 'HV_310V_DC', expectedVoltage: 'Xung kích chân B bóng dưới', expectedDiodeDrop: 'OL' }
        ],
        commonFailureModes: ['Đứt mối hàn chân biến áp do rung chấn hoặc thiếc hàn bị ngậm xỉ'],
        replacementTips: 'Hàn lại chân biến áp driver trước khi kết luận hỏng mạch kích.',
        normalTempC: 36,
        faultTempC: 80
      },
      {
        id: 'Q_SW1',
        label: 'Q_SW1',
        kind: 'mosfet',
        zone: 'zone-halfbridge',
        description: 'Bóng BJT NPN công suất cao nửa cầu nhánh trên (High-Side).',
        partNumber: 'MJE13007 / MJE13009',
        specs: 'NPN Bipolar Power Transistor 700V 8A-12A TO-220',
        pos3d: { x: -16, y: 0, z: 12, w: 5, d: 12, h: 16, color: '#111827' },
        pos2d: { x: 18, y: 56, w: 5, h: 12 },
        photoPos: { x: 21, y: 12, w: 7, h: 13 },
        photoNote: 'Bắt vít trên thanh tản nhiệt nhôm sơ cấp',
        schematicPos: { x: 220, y: 420 },
        pins: [
          { pin: 'B', name: 'BASE', net: 'HV_310V_DC', expectedVoltage: 'Xung lái 0.7V', expectedDiodeDrop: '0.680V (B->E)' },
          { pin: 'C', name: 'COLLECTOR', net: 'HV_310V_DC', expectedVoltage: '310VDC', expectedDiodeDrop: '0.510V (B->C)' },
          { pin: 'E', name: 'EMITTER', net: 'HV_310V_DC', expectedVoltage: 'Điểm giữa biến áp (155V)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập C-E nổ toác lưng làm đứt cầu chì F1 và cháy đen điện trở kích chân B (thường là 1.5Ω - 2.2Ω) cùng đi-ốt 1N4148'],
        replacementTips: 'Bệnh kinh điển: Khi 13007 chết chập, BẮT BUỘC kiểm tra và thay thế trở chân B (2.2Ω), trở dập âm (2.7kΩ) và đi-ốt dập xung ngược 1N4148.',
        normalTempC: 52,
        faultTempC: 130
      },
      {
        id: 'Q_SW2',
        label: 'Q_SW2',
        kind: 'mosfet',
        zone: 'zone-halfbridge',
        description: 'Bóng BJT NPN công suất cao nửa cầu nhánh dưới (Low-Side).',
        partNumber: 'MJE13007 / MJE13009',
        specs: 'NPN Bipolar Power Transistor 700V 8A-12A TO-220',
        pos3d: { x: -16, y: 0, z: 26, w: 5, d: 12, h: 16, color: '#111827' },
        pos2d: { x: 18, y: 72, w: 5, h: 12 },
        photoPos: { x: 21, y: 26, w: 7, h: 12 },
        photoNote: 'Bắt vít trên thanh tản nhiệt nhôm sơ cấp',
        schematicPos: { x: 220, y: 540 },
        pins: [
          { pin: 'B', name: 'BASE', net: 'HV_310V_DC', expectedVoltage: 'Xung lái 0.7V', expectedDiodeDrop: '0.680V (B->E)' },
          { pin: 'C', name: 'COLLECTOR', net: 'HV_310V_DC', expectedVoltage: '155V (Điểm giữa)', expectedDiodeDrop: '0.510V (B->C)' },
          { pin: 'E', name: 'EMITTER', net: 'GND', expectedVoltage: '0V (Primary GND)', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Chập C-E kéo theo chết cả cặp Q_SW1 và Q_SW2'],
        replacementTips: 'Luôn thay cả cặp 13007/13009 cùng số hiệu. Lót miếng lót cách điện mica và bôi mỡ tản nhiệt kỹ.',
        normalTempC: 52,
        faultTempC: 130
      },
      {
        id: 'T_MAIN',
        label: 'T_MAIN',
        kind: 'transformer',
        zone: 'zone-sec-group',
        description: 'Biến áp xung công suất chính kích thước lớn chuẩn EI-33.',
        partNumber: 'TRANS-EI33',
        specs: 'Biến áp lõi Ferrite EI-33 công suất 350W-450W',
        pos3d: { x: 2, y: 0, z: 18, w: 22, d: 22, h: 26, color: '#78350f' },
        pos2d: { x: 34, y: 60, w: 12, h: 18 },
        photoPos: { x: 31.5, y: 30, w: 16.5, h: 21 },
        schematicPos: { x: 380, y: 480 },
        pins: [
          { pin: '1', name: 'PRI_A', net: 'HV_310V_DC', expectedVoltage: 'Xung nửa cầu 155V', expectedDiodeDrop: 'OL' },
          { pin: '2', name: 'PRI_B', net: 'HV_310V_DC', expectedVoltage: 'Qua tụ chặn 1uF/250V', expectedDiodeDrop: 'OL' },
          { pin: '3', name: 'SEC_12V', net: '+12V_OUT', expectedVoltage: 'Xung 12V', expectedDiodeDrop: '0.220V' },
          { pin: '4', name: 'SEC_5V', net: '+5V_OUT', expectedVoltage: 'Xung 5V', expectedDiodeDrop: '0.200V' },
          { pin: '5', name: 'GND', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Rất ít khi hỏng, đôi khi lỏng chân hàn to dưới mạch do nhiệt độ cao lâu ngày'],
        replacementTips: 'Gia nhiệt và thêm chì hàn mới vào các mối hàn chân biến áp to.',
        normalTempC: 58,
        faultTempC: 110
      },
      {
        id: 'D_12V',
        label: 'D_12V',
        kind: 'diode',
        zone: 'zone-sec-group',
        description: 'Đi-ốt kép nắn dòng siêu nhanh cho đường 12V gắn trên cánh tản nhiệt nhôm thứ cấp.',
        partNumber: 'F16C20C / F20C20C',
        specs: 'Fast Recovery Dual Diode 200V 16A-20A TO-220',
        pos3d: { x: 18, y: 0, z: 14, w: 5, d: 12, h: 16, color: '#1f2937' },
        pos2d: { x: 50, y: 56, w: 5, h: 12 },
        photoPos: { x: 50.5, y: 14, w: 7.5, h: 17 },
        photoNote: 'Bắt vít trên thanh tản nhiệt nhôm thứ cấp',
        schematicPos: { x: 510, y: 440 },
        pins: [
          { pin: 'A1', name: 'ANODE1', net: '+12V_OUT', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.480V' },
          { pin: 'K', name: 'CATHODE', net: '+12V_OUT', expectedVoltage: '12.0VDC', expectedDiodeDrop: '0.000V' },
          { pin: 'A2', name: 'ANODE2', net: '+12V_OUT', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.480V' }
        ],
        commonFailureModes: ['Chập 1 nhánh đi-ốt làm chập đường 12V xuống mass khiến nguồn tự ngắt trong 0.5s'],
        replacementTips: 'Đo thang Diode chân K ra 2 chân Anode. Nếu kim lên 0.000V là chập, tháo ra thay con mới.',
        normalTempC: 55,
        faultTempC: 125
      },
      {
        id: 'D_5V',
        label: 'D_5V',
        kind: 'diode',
        zone: 'zone-sec-group',
        description: 'Đi-ốt kép Schottky nắn dòng công suất cực lớn cho đường 5V.',
        partNumber: 'SBL3040PT / MBR3045PT',
        specs: 'Schottky Barrier 40V-45V 30A TO-247/TO-220',
        pos3d: { x: 18, y: 0, z: 26, w: 5, d: 12, h: 16, color: '#1f2937' },
        pos2d: { x: 50, y: 72, w: 5, h: 12 },
        photoPos: { x: 50.5, y: 33, w: 7.5, h: 17 },
        photoNote: 'Bắt vít trên thanh tản nhiệt nhôm thứ cấp',
        schematicPos: { x: 510, y: 560 },
        pins: [
          { pin: 'A1', name: 'ANODE1', net: '+5V_OUT', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.280V' },
          { pin: 'K', name: 'CATHODE', net: '+5V_OUT', expectedVoltage: '5.0VDC', expectedDiodeDrop: '0.000V' },
          { pin: 'A2', name: 'ANODE2', net: '+5V_OUT', expectedVoltage: 'Xung nắn', expectedDiodeDrop: '0.280V' }
        ],
        commonFailureModes: ['Rò rỉ hoặc chập đi-ốt Schottky do quá nhiệt'],
        replacementTips: 'Có thể thay thế bằng MBR3045, STPS3045, S30D40.',
        normalTempC: 52,
        faultTempC: 125
      },
      {
        id: 'L_GROUP',
        label: 'L_GROUP',
        kind: 'inductor',
        zone: 'zone-sec-group',
        description: 'Cuộn cảm lõi xuyến nắn lọc chung nhiều vòng dây cho cả đường 12V, 5V, 3.3V, -12V (Group Regulation Choke).',
        partNumber: 'TOROID-CHOKE-GROUP',
        specs: 'Lõi xuyến bột sắt từ tính quấn nhiều dây đồng',
        pos3d: { x: 26, y: 0, z: 20, w: 16, d: 16, h: 18, color: '#b45309' },
        pos2d: { x: 58, y: 64, w: 8, h: 14 },
        photoPos: { x: 60.5, y: 24.5, w: 10.5, h: 14.5 },
        schematicPos: { x: 630, y: 500 },
        pins: [
          { pin: '12V_IN', name: '12V_IN', net: '+12V_OUT', expectedVoltage: '12.0V Xung', expectedDiodeDrop: '0.050V' },
          { pin: '12V_OUT', name: '12V_OUT', net: '+12V_OUT', expectedVoltage: '12.0V Phẳng', expectedDiodeDrop: '0.000V' },
          { pin: '5V_IN', name: '5V_IN', net: '+5V_OUT', expectedVoltage: '5.0V Xung', expectedDiodeDrop: '0.050V' },
          { pin: '5V_OUT', name: '5V_OUT', net: '+5V_OUT', expectedVoltage: '5.0V Phẳng', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Cháy đen lớp sơn cách điện do quá tải làm chập các cuộn dây 12V và 5V với nhau'],
        replacementTips: 'Nếu cuộn cảm bị nóng sẫm màu biến tính cần tháo ra đếm lại số vòng để quấn lại dây đồng mới.',
        normalTempC: 55,
        faultTempC: 120
      },
      {
        id: 'C_OUT_12V',
        label: 'C_OUT_12V',
        kind: 'capacitor_elec',
        zone: 'zone-sec-group',
        description: 'Tụ hóa lọc phẳng gợn sóng ngõ ra đường 12V.',
        partNumber: '16V 1500uF Electrolytic',
        specs: '16V 1500µF 105°C',
        pos3d: { x: 34, y: 0, z: 12, w: 8, d: 8, h: 16, color: '#1e3a8a' },
        pos2d: { x: 68, y: 58, w: 5, h: 10 },
        photoPos: { x: 70.5, y: 24, w: 8, h: 11 },
        schematicPos: { x: 740, y: 460 },
        pins: [
          { pin: '+', name: 'POS', net: '+12V_OUT', expectedVoltage: '12.0V', expectedDiodeDrop: '0.420V' },
          { pin: '-', name: 'NEG', net: 'GND', expectedVoltage: '0V', expectedDiodeDrop: '0.000V' }
        ],
        commonFailureModes: ['Tụ phồng lưng hoặc xì đáy làm điện áp 12V bị sụt còn 10V khi cắm tải'],
        replacementTips: 'Bệnh rất hay gặp: Thay thế bằng tụ 16V hoặc 25V 1500uF-2200uF 105°C.',
        normalTempC: 42,
        faultTempC: 88
      },
      {
        id: 'U_SUP',
        label: 'U_SUP',
        kind: 'super_io',
        zone: 'zone-protection',
        description: 'IC so sánh khuếch đại thuật toán hoặc IC bảo vệ chuyên dụng LP7510 / LM339.',
        partNumber: 'TI LM339N / ESTi LP7510',
        specs: 'DIP-14 Quad Voltage Comparator / Supervisor',
        pos3d: { x: 36, y: 0, z: 22, w: 8, d: 14, h: 4, color: '#1e293b' },
        pos2d: { x: 76, y: 66, w: 7, h: 10 },
        schematicPos: { x: 840, y: 540 },
        pins: [
          { pin: 'PSON', name: 'PSON#', net: 'PS_ON#', expectedVoltage: '3.3V-5V (Kéo 0V bật)', expectedDiodeDrop: '0.620V' },
          { pin: 'PG', name: 'PWR_OK', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' },
          { pin: 'V12', name: 'V12_SENSE', net: '+12V_OUT', expectedVoltage: '12.0V', expectedDiodeDrop: '0.550V' }
        ],
        commonFailureModes: ['Hỏng tầng so sánh ngắt bảo vệ khiến quạt chỉ nhích một vòng rồi tắt hẳn'],
        replacementTips: 'Đo chân 4 của TL494 (chân DTC - Dead Time Control): khi kích nguồn chân này phải được kéo về 0V. Nếu vẫn ở mức cao >3V là IC bảo vệ đang khóa.',
        normalTempC: 38,
        faultTempC: 85
      },
      {
        id: 'J_ATX24',
        label: 'J_ATX24',
        kind: 'atx_24pin',
        zone: 'zone-protection',
        description: 'Bó dây cáp nguồn ATX 20+4 Pin nối trực tiếp từ bo mạch cấp cho máy tính.',
        partNumber: 'ATX 20+4 Pin Hardwired Harness',
        specs: 'Bó dây bọc lưới hoặc dây rời chuẩn màu quốc tế',
        pos3d: { x: 42, y: 0, z: 22, w: 6, d: 22, h: 12, color: '#111827' },
        pos2d: { x: 86, y: 58, w: 9, h: 26 },
        photoPos: { x: 78, y: 2, w: 16, h: 42 },
        photoNote: 'Bó dây cáp đầu ra ATX 20+4 pin đi qua lỗ thoát vỏ nguồn',
        schematicPos: { x: 980, y: 480 },
        pins: [
          { pin: '8', name: 'PWR_OK (Xám)', net: 'PWR_OK', expectedVoltage: '5.0V', expectedDiodeDrop: '0.680V' },
          { pin: '9', name: '+5VSB (Tím)', net: '+5VSB', expectedVoltage: '5.0V', expectedDiodeDrop: '0.450V' },
          { pin: '10', name: '+12V (Vàng)', net: '+12V_OUT', expectedVoltage: '12.0V', expectedDiodeDrop: '0.420V' },
          { pin: '16', name: 'PS_ON# (Xanh lá)', net: 'PS_ON#', expectedVoltage: '3.3V-5V (Kéo 0V bật)', expectedDiodeDrop: '0.620V' }
        ],
        commonFailureModes: ['Dây vàng 12V hoặc dây cam 3.3V bị oxy hóa xỉn đồng tăng nội trở'],
        replacementTips: 'Khi kích nguồn thử tại bàn thợ: Dùng một đoạn dây điện hoặc kẹp nhíp chập chân dây Xanh lá (chân 16) với bất kỳ chân dây Đen (GND) nào.',
        normalTempC: 32,
        faultTempC: 75
      }
    ],
    wires: [
      { id: 'gw1', netId: 'AC_LINE', fromComponentId: 'F1', fromPin: '2', toComponentId: 'BD1', toPin: '1' },
      { id: 'gw2', netId: 'HV_310V_DC', fromComponentId: 'BD1', fromPin: '3', toComponentId: 'C_HV1', toPin: '+' },
      { id: 'gw3', netId: 'HV_310V_DC', fromComponentId: 'C_HV1', fromPin: '+', toComponentId: 'Q_5VSB', toPin: 'C' },
      { id: 'gw4', netId: 'HV_310V_DC', fromComponentId: 'C_HV1', fromPin: '+', toComponentId: 'Q_SW1', toPin: 'C' },
      { id: 'gw5', netId: 'HV_310V_DC', fromComponentId: 'Q_5VSB', fromPin: 'E', toComponentId: 'T_5VSB', toPin: '1' },
      { id: 'gw6', netId: '+5VSB', fromComponentId: 'T_5VSB', fromPin: '3', toComponentId: 'C_5VSB_EC', toPin: '+' },
      { id: 'gw7', netId: '+5VSB', fromComponentId: 'C_5VSB_EC', fromPin: '+', toComponentId: 'J_ATX24', toPin: '9' },
      { id: 'gw8', netId: 'VCC_TL494', fromComponentId: 'T_5VSB', fromPin: '4', toComponentId: 'U_PWM', toPin: '12' },
      { id: 'gw9', netId: 'VCC_TL494', fromComponentId: 'U_PWM', fromPin: '8', toComponentId: 'T_DRIVE', toPin: '1' },
      { id: 'gw10', netId: 'HV_310V_DC', fromComponentId: 'T_DRIVE', fromPin: '3', toComponentId: 'Q_SW1', toPin: 'B' },
      { id: 'gw11', netId: 'HV_310V_DC', fromComponentId: 'T_DRIVE', fromPin: '5', toComponentId: 'Q_SW2', toPin: 'B' },
      { id: 'gw12', netId: 'HV_310V_DC', fromComponentId: 'Q_SW1', fromPin: 'E', toComponentId: 'Q_SW2', toPin: 'C' },
      { id: 'gw13', netId: 'HV_310V_DC', fromComponentId: 'Q_SW1', fromPin: 'E', toComponentId: 'T_MAIN', toPin: '1' },
      { id: 'gw14', netId: '+12V_OUT', fromComponentId: 'T_MAIN', fromPin: '3', toComponentId: 'D_12V', toPin: 'A1' },
      { id: 'gw15', netId: '+5V_OUT', fromComponentId: 'T_MAIN', fromPin: '4', toComponentId: 'D_5V', toPin: 'A1' },
      { id: 'gw16', netId: '+12V_OUT', fromComponentId: 'D_12V', fromPin: 'K', toComponentId: 'L_GROUP', toPin: '12V_IN' },
      { id: 'gw17', netId: '+5V_OUT', fromComponentId: 'D_5V', fromPin: 'K', toComponentId: 'L_GROUP', toPin: '5V_IN' },
      { id: 'gw18', netId: '+12V_OUT', fromComponentId: 'L_GROUP', fromPin: '12V_OUT', toComponentId: 'C_OUT_12V', toPin: '+' },
      { id: 'gw19', netId: '+12V_OUT', fromComponentId: 'C_OUT_12V', fromPin: '+', toComponentId: 'U_SUP', toPin: 'V12' },
      { id: 'gw20', netId: '+12V_OUT', fromComponentId: 'C_OUT_12V', fromPin: '+', toComponentId: 'J_ATX24', toPin: '10' },
      { id: 'gw21', netId: 'PS_ON#', fromComponentId: 'J_ATX24', fromPin: '16', toComponentId: 'U_SUP', toPin: 'PSON' },
      { id: 'gw22', netId: 'PS_ON#', fromComponentId: 'U_SUP', fromPin: 'PSON', toComponentId: 'U_PWM', toPin: '4' },
      { id: 'gw23', netId: 'PWR_OK', fromComponentId: 'U_SUP', fromPin: 'PG', toComponentId: 'J_ATX24', toPin: '8' }
    ]
  }
];
