import type { FaultCase } from '../../types/circuit';

export const PSU_FAULTS: FaultCase[] = [
  // -------------------------------------------------------------------------
  // Case 1: Nổ cầu chì F1 + chạm cầu Diode BD1 & MOSFET Active PFC Q_PFC1
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-001',
    boardId: 'all_psu',
    category: 'psu',
    brandTag: 'Tất cả PSU / Corsair / Seasonic',
    title: 'Nổ cầu chì chính F1, chập cầu Diode BD1 và MOSFET Active PFC Q_PFC1',
    symptom: 'Cắm điện nguồn không có tín hiệu, aptomat nhà nhảy hoặc nghe tiếng nổ tách, cầu chì F1 bị đen muội than, dây tím +5VSB mất hoàn toàn (0V).',
    severity: 'critical_hv',
    affectedZones: ['zone-emi', 'zone-pfc'],
    suspectComponentIds: ['F1', 'BD1', 'Q_PFC1', 'C_BULK1'],
    affectedRails: ['AC_LINE', 'HV_390V_PFC', '+5VSB'],
    rootCauses: [
      'Sét đánh hoặc sốc điện áp lưới AC làm đánh thủng cầu Diode BD1.',
      'MOSFET tầng Boost PFC Q_PFC1 bị đánh thủng D-S do quá áp hoặc quá nhiệt lâu ngày làm chập trực tiếp nguồn DC sau cầu diode xuống GND.',
      'Dòng ngắn mạch cực đại làm nổ đứt cầu chì gốm F1 (10A/250V) bảo vệ đầu vào.'
    ],
    quickFixSummary: 'CẢNH BÁO AN TOÀN CAO ÁP! Tuyệt đối KHÔNG thay cầu chì rồi cắm điện trực tiếp! Bắt buộc xả tụ C_BULK1, thay thế Q_PFC1, BD1, F1. Khi test cắm nguồn qua bóng đèn sợi đốt 60W-100W nối tiếp chống nổ.',
    steps: [
      {
        id: 'step-psu1-1',
        stepNumber: 1,
        title: 'Kiểm tra nguội cầu chì ngõ vào F1 bằng thang đo thông mạch',
        instruction: 'RÚT PHÍCH ĐIỆN AC. Để đồng hồ ở thang đo thông mạch/điện trở. Đặt hai que đo vào 2 đầu cầu chì F1.',
        targetComponentId: 'F1',
        targetNetId: 'AC_LINE',
        measureMode: 'resistance',
        expectedValue: 'Cầu chì F1: ~0.0 Ω (thông mạch).',
        passNextStepId: 'step-psu1-2',
        failDiagnosis: 'Cầu chì F1 đứt (OL) do quá dòng ngắn mạch cực lớn.',
        failSuspectComponents: ['F1', 'BD1'],
        repairAction: 'Chưa vội thay F1 mới cho đến khi kiểm tra triệt để tải phía sau cầu diode.'
      },
      {
        id: 'step-psu1-2',
        stepNumber: 2,
        title: 'Đo kiểm tra cầu Diode chỉnh lưu chính BD1',
        instruction: 'Chuyển đồng hồ sang thang đo Diode. Đo kiểm tra 4 tiếp giáp PN của cầu Diode BD1: Que đỏ vào 2 chân AC, que đen vào chân (+); sau đó que đỏ vào chân (-), que đen vào 2 chân AC.',
        targetComponentId: 'BD1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'diode',
        expectedValue: '0.450V - 0.550V ở chiều thuận; Vô cùng (OL) ở chiều ngược.',
        passNextStepId: 'step-psu1-3',
        failDiagnosis: 'Cầu Diode BD1 bị đánh thủng ngắn mạch (đo ra 0.000V hoặc kêu bíp ở cả hai chiều).',
        failSuspectComponents: ['BD1'],
        repairAction: 'Thay cầu diode BD1 loại tương đương hoặc dòng áp cao hơn (GBU1506 / GBU2506, 15A-25A 600V).'
      },
      {
        id: 'step-psu1-3',
        stepNumber: 3,
        title: 'Đo kiểm tra MOSFET Active PFC Q_PFC1',
        instruction: 'Đo thang Diode giữa chân D (Drain) và S (Source) của MOSFET Q_PFC1.',
        targetComponentId: 'Q_PFC1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'diode',
        expectedValue: 'D-S: Chiều thuận body diode 0.45V - 0.52V, ngược OL.',
        passNextStepId: 'step-psu1-4',
        failDiagnosis: 'MOSFET Q_PFC1 bị thông DS (0.000V) hoặc nổ vỡ lưng chập cực D xuống S.',
        failSuspectComponents: ['Q_PFC1', 'C_BULK1'],
        repairAction: 'Nhổ Q_PFC1 ra ngoài. Kiểm tra trở kích Gate (thường 4.7Ω - 10Ω) trước khi hàn linh kiện mới.'
      },
      {
        id: 'step-psu1-4',
        stepNumber: 4,
        title: 'Quy trình cắm test an toàn qua bóng đèn sợi đốt 60W-100W',
        instruction: 'Hàn cầu chì mới F1. Nối tiếp một bóng đèn sợi đốt 220V 60W-100W vào dây nóng AC (L). Cắm điện quan sát trạng thái bóng đèn: Đèn chỉ được lóe sáng một tích tắc rồi tắt lịm hẳn.',
        targetComponentId: 'F1',
        targetNetId: 'AC_LINE',
        measureMode: 'visual',
        expectedValue: 'Bóng đèn lóe sáng nạp tụ chính rồi tắt hoàn toàn. Đo dây tím +5VSB có đúng 5.0V - 5.1V.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Bóng đèn sáng rực liên tục chứng tỏ sơ cấp vẫn còn điểm chạm chập nặng (tụ chính C_BULK1 hoặc IC nguồn phụ).',
        failSuspectComponents: ['C_BULK1', 'U_5VSB'],
        repairAction: 'Ngắt điện ngay lập tức, dùng trở tải 4.7kΩ 5W xả sạch điện tích tụ C_BULK1 và tiếp tục rà soát sơ cấp.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 2: Mất nguồn cấp trước +5VSB (Dây tím 0V) do chết IC U_5VSB hoặc đứt trở mồi
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-002',
    boardId: 'seasonic-focus-gx650',
    category: 'psu',
    brandTag: 'Seasonic / Corsair',
    title: 'Mất nguồn cấp trước +5VSB (Dây tím 0V) do hỏng IC nguồn phụ U_5VSB hoặc đứt trở mồi',
    symptom: 'Cắm nguồn AC nhưng dây tím (+5VSB) bằng 0V, dây xanh lá (PS_ON#) không có áp kích (0V), quạt không nhích, PC hoàn toàn mất nguồn phụ không thể kích khởi động.',
    severity: 'high',
    affectedZones: ['zone-5vsb'],
    suspectComponentIds: ['U_5VSB', 'T_5VSB', 'U_OPT1'],
    affectedRails: ['+5VSB', 'HV_390V_PFC'],
    rootCauses: [
      'IC dao động nguồn phụ EM8569C / TNY278PN bị chập chân Drain xuống Source hoặc nổ thân IC.',
      'Điện trở mồi (Startup Resistor) cấp nguồn khởi động cho chân VCC IC bị tăng trị số hoặc đứt hẳn.',
      'Biến áp xung T_5VSB bị đứt cuộn sơ cấp hoặc hỏng mạch hồi tiếp Optocoupler U_OPT1.'
    ],
    quickFixSummary: 'Đo kiểm tra điện áp 310V tại chân Drain của U_5VSB, kiểm tra trở mồi và cuộn sơ cấp T_5VSB. Thay IC U_5VSB và Optocoupler U_OPT1.',
    steps: [
      {
        id: 'step-psu2-1',
        stepNumber: 1,
        title: 'Kiểm tra điện áp cao áp DC trên tụ lọc chính C_BULK1',
        instruction: 'CẢNH BÁO CAO ÁP 310VDC! Cắm điện AC. Chuyển đồng hồ sang thang DC 1000V, đặt que đo vào 2 chân tụ C_BULK1.',
        targetComponentId: 'C_BULK1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'voltage',
        expectedValue: '305VDC - 325VDC (chế độ Standby chưa kích PFC).',
        passNextStepId: 'step-psu2-2',
        failDiagnosis: 'Không có 310VDC trên tụ chính: Hở cầu chì F1 hoặc hỏng cầu nắn BD1.',
        failSuspectComponents: ['F1', 'BD1'],
        repairAction: 'Rút điện, kiểm tra cầu chì ngõ vào F1 và cầu diode nắn dòng BD1.'
      },
      {
        id: 'step-psu2-2',
        stepNumber: 2,
        title: 'Đo điện áp DC cấp vào chân Drain của IC nguồn cấp trước U_5VSB',
        instruction: 'Que đen vào mass sơ cấp (cực âm tụ C_BULK1), que đỏ vào chân D (Drain) của IC U_5VSB.',
        targetComponentId: 'U_5VSB',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'voltage',
        expectedValue: '~310VDC.',
        passNextStepId: 'step-psu2-3',
        failDiagnosis: 'Mất áp 310V tại chân Drain: Đứt cuộn sơ cấp biến áp xung T_5VSB.',
        failSuspectComponents: ['U_5VSB', 'T_5VSB'],
        repairAction: 'Kiểm tra thông mạch cuộn sơ cấp biến áp xung T_5VSB và đường mạch in dẫn từ dương tụ chính.'
      },
      {
        id: 'step-psu2-3',
        stepNumber: 3,
        title: 'Đo kiểm tra chân VCC / BP và điện trở mồi khởi động',
        instruction: 'Đo điện áp tại chân VCC hoặc Bypass của IC U_5VSB so với mass sơ cấp.',
        targetComponentId: 'U_5VSB',
        targetNetId: '+5VSB',
        measureMode: 'voltage',
        expectedValue: '5.8V - 6.2V DC ổn định tại chân Bypass/VCC.',
        passNextStepId: 'step-psu2-4',
        failDiagnosis: 'Áp VCC nhấp nháy liên tục 0V-4V hoặc bằng 0V do IC chết dao động.',
        failSuspectComponents: ['U_5VSB'],
        repairAction: 'Thay thế IC nguồn phụ U_5VSB kèm tụ hóa dập xung hồi tiếp.'
      },
      {
        id: 'step-psu2-4',
        stepNumber: 4,
        title: 'Đo kiểm tra Optocoupler U_OPT1 hồi tiếp đường 5VSB',
        instruction: 'Đo thang Diode tại chân 1-2 của Optocoupler U_OPT1 kiểm tra diode phát quang hồi tiếp.',
        targetComponentId: 'U_OPT1',
        targetNetId: '+5VSB',
        measureMode: 'diode',
        expectedValue: '1.05V - 1.15V chiều thuận, chiều ngược vô cùng OL.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Optocoupler U_OPT1 bị đứt hoặc chập dẫn đến nguồn 5VSB mất hồi tiếp bảo vệ ngắt.',
        failSuspectComponents: ['U_OPT1', 'T_5VSB'],
        repairAction: 'Thay Optocoupler U_OPT1 (PC817) mới.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 3: Có +5VSB nhưng sụt áp khi có tải / máy tính kích nguồn lúc lên lúc không
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-003',
    boardId: 'corsair-rm750x',
    category: 'psu',
    brandTag: 'Corsair / Cooler Master',
    title: 'Có +5VSB nhưng sụt áp khi tải nhẹ, kích nguồn chập chờn do lỗi mạch lọc 5VSB',
    symptom: 'Đo dây tím không tải có 5.1V, nhưng khi cắm mainboard hoặc cấp tải giả 1A thì tụt xuống dưới 4.2V khiến mainboard reset liên tục, đèn nguồn nhấp nháy, kích nguồn lúc được lúc không.',
    severity: 'medium',
    affectedZones: ['zone-5vsb', 'zone-sec-12v'],
    suspectComponentIds: ['U_5VSB', 'T_5VSB', 'U_OPT1', 'U_TL431'],
    affectedRails: ['+5VSB'],
    rootCauses: [
      'Tụ lọc ngõ ra biến áp T_5VSB bị khô điện dịch, ESR tăng cao làm mất khả năng nén gợn và giữ áp khi dòng tải tăng.',
      'IC tham chiếu U_TL431 hoặc Optocoupler U_OPT1 bị trôi trị số phân áp lấy mẫu hồi tiếp.'
    ],
    quickFixSummary: 'Kiểm tra sụt áp đường +5VSB, thay tụ lọc thứ cấp 5VSB và thay cặp linh kiện hồi tiếp U_TL431 + U_OPT1.',
    steps: [
      {
        id: 'step-psu3-1',
        stepNumber: 1,
        title: 'Đo sụt áp đường +5VSB khi cấp tải giả',
        instruction: 'Cắm điện nguồn. Mắc một điện trở công suất 5Ω 10W (tạo dòng tải 1A) giữa dây tím (+5VSB) và mass GND. Đo điện áp DC trên hai đầu trở tải.',
        targetComponentId: 'T_5VSB',
        targetNetId: '+5VSB',
        measureMode: 'voltage',
        expectedValue: '4.95V - 5.15VDC (không được sụt quá 5%).',
        passNextStepId: 'step-psu3-2',
        failDiagnosis: 'Điện áp sụt mạnh xuống 3.8V - 4.3V khi kéo tải 1A chứng tỏ nội trở mạch lọc tăng cao.',
        failSuspectComponents: ['U_5VSB', 'T_5VSB'],
        repairAction: 'Kiểm tra mạch nắn thứ cấp biến áp T_5VSB.'
      },
      {
        id: 'step-psu3-2',
        stepNumber: 2,
        title: 'Đo kiểm tra điện áp chuẩn tại chân Ref của IC U_TL431',
        instruction: 'Đo điện áp DC tại chân Reference của U_TL431 so với mass thứ cấp.',
        targetComponentId: 'U_TL431',
        targetNetId: '+5VSB',
        measureMode: 'voltage',
        expectedValue: '2.49V - 2.51V DC chuẩn xác.',
        passNextStepId: 'step-psu3-3',
        failDiagnosis: 'Điện áp chân Ref bị sai lệch làm IC nguồn cấp trước không điều chỉnh được chu kỳ xung.',
        failSuspectComponents: ['U_TL431', 'U_OPT1'],
        repairAction: 'Thay thế IC ổn áp bù sai lệch U_TL431 mới.'
      },
      {
        id: 'step-psu3-3',
        stepNumber: 3,
        title: 'Kiểm tra Optocoupler hồi tiếp U_OPT1',
        instruction: 'Đo kiểm tra tiếp giáp chân 1-2 và chân 3-4 của Optocoupler U_OPT1.',
        targetComponentId: 'U_OPT1',
        targetNetId: '+5VSB',
        measureMode: 'diode',
        expectedValue: 'Chân 1-2 thuận 1.1V, ngược OL. Chân 3-4 không rò (OL cả hai chiều).',
        passNextStepId: 'resolved',
        failDiagnosis: 'Transistor quang chân 3-4 bị rò rỉ dẫn sai lệch tín hiệu hồi tiếp.',
        failSuspectComponents: ['U_OPT1', 'U_TL431'],
        repairAction: 'Thay Optocoupler PC817 (U_OPT1) chính hãng.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 4: Chập dây xanh lá (PS_ON#) quạt nhích nhẹ nửa vòng rồi ngắt lịm
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-004',
    boardId: 'coolermaster-mwe-650',
    category: 'psu',
    brandTag: 'Cooler Master / Seasonic',
    title: 'Kích nguồn dây xanh lá (PS_ON#) quạt giật nhẹ nửa vòng rồi ngắt lịm do chập thứ cấp +12V',
    symptom: 'Đấu tắt dây xanh lá (PS_ON#) xuống dây đen (GND), quạt làm mát nhích quay nửa vòng rồi lịm tắt ngay lập tức; phải rút điện xả hết tụ rồi cắm lại mới lặp lại hiện tượng.',
    severity: 'high',
    affectedZones: ['zone-sec-12v', 'zone-protection'],
    suspectComponentIds: ['D_12V_SCHOTTKY', 'U_SUP', 'MOD_DCDC'],
    affectedRails: ['+12V_MAIN', 'PS_ON#'],
    rootCauses: [
      'Diode kép Schottky D_12V_SCHOTTKY bị đánh thủng Anode-Cathode thành 0 ohm.',
      'Module VRM DC-DC con MOD_DCDC bị chập ngắn mạch đầu vào 12V.',
      'IC giám sát bảo vệ U_SUP phát hiện dòng quá tải SCP/OCP ngắt lệnh bảo vệ ngay trong 10ms.'
    ],
    quickFixSummary: 'Đo thang diode dây vàng +12V ra mass. Nhổ tản nhiệt thứ cấp kiểm tra Diode Schottky D_12V_SCHOTTKY và module DC-DC con.',
    steps: [
      {
        id: 'step-psu4-1',
        stepNumber: 1,
        title: 'Đo nguội thang Diode giữa đường +12V_MAIN và GND',
        instruction: 'RÚT HOÀN TOÀN ĐIỆN NGUỒN. Đặt que đỏ vào GND và que đen vào đường +12V_MAIN tại đầu cắm 24-pin ATX.',
        targetComponentId: 'D_12V_SCHOTTKY',
        targetNetId: '+12V_MAIN',
        measureMode: 'diode',
        expectedValue: '0.350V - 0.450V (điện áp rơi Diode Schottky).',
        passNextStepId: 'step-psu4-2',
        failDiagnosis: 'Đo được 0.000V - 0.010V (kêu bíp thông mạch) chứng tỏ đường +12V đã bị chạm chập trực tiếp xuống mass.',
        failSuspectComponents: ['D_12V_SCHOTTKY'],
        repairAction: 'Chuẩn bị tháo tản nhiệt thứ cấp để cách ly Diode Schottky D_12V_SCHOTTKY.'
      },
      {
        id: 'step-psu4-2',
        stepNumber: 2,
        title: 'Cách ly và đo Diode Schottky D_12V_SCHOTTKY',
        instruction: 'Hút thiếc nhấc Diode đôi D_12V_SCHOTTKY ra khỏi bo mạch, đo kiểm tra 2 nhánh Diode bên trong.',
        targetComponentId: 'D_12V_SCHOTTKY',
        targetNetId: '+12V_MAIN',
        measureMode: 'diode',
        expectedValue: 'Chân Anode vào Cathode thuận 0.35V - 0.45V, chiều ngược vô cùng OL.',
        passNextStepId: 'step-psu4-3',
        failDiagnosis: 'Phát hiện một nhánh Diode bị đánh thủng 0Ω.',
        failSuspectComponents: ['D_12V_SCHOTTKY'],
        repairAction: 'Thay Diode Schottky công suất cao mới (ví dụ SBL3040PT / MBR3045PT).'
      },
      {
        id: 'step-psu4-3',
        stepNumber: 3,
        title: 'Kiểm tra ngõ vào 12V của Module DC-DC con MOD_DCDC',
        instruction: 'Sau khi nhấc Diode Schottky, đo kiểm tra ngõ vào 12V của module con MOD_DCDC.',
        targetComponentId: 'MOD_DCDC',
        targetNetId: '+12V_MAIN',
        measureMode: 'resistance',
        expectedValue: 'Trở kháng nạp tụ tăng dần (>500Ω đến vài kΩ).',
        passNextStepId: 'step-psu4-4',
        failDiagnosis: 'Ngõ vào module DC-DC chập 0Ω do hỏng MOSFET Buck bên trong.',
        failSuspectComponents: ['MOD_DCDC'],
        repairAction: 'Tháo kiểm tra module VRM DC-DC con.'
      },
      {
        id: 'step-psu4-4',
        stepNumber: 4,
        title: 'Kích nguồn test sau khi thay thế linh kiện',
        instruction: 'Cắm điện qua bóng đèn bảo vệ, nối tắt chân PS_ON# xuống GND.',
        targetComponentId: 'U_SUP',
        targetNetId: 'PS_ON#',
        measureMode: 'voltage',
        expectedValue: 'Quạt quay đều êm ái, đường +12V_MAIN đạt chuẩn +12.0V - +12.2V DC.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Quạt vẫn ngắt do IC giám sát U_SUP hỏng khối bảo vệ.',
        failSuspectComponents: ['U_SUP'],
        repairAction: 'Thay IC giám sát U_SUP.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 5: Active PFC không nâng áp (tụ lọc chính chỉ đạt 310VDC thay vì 390VDC)
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-005',
    boardId: 'corsair-rm750x',
    category: 'psu',
    brandTag: 'Corsair / Seasonic',
    title: 'Mạch Active PFC không nâng áp (tụ lọc chỉ đạt 310VDC thay vì 390VDC), LLC không thể kích hoạt',
    symptom: 'Nguồn có 5VSB, khi chập PS_ON quạt quay yếu rồi tắt hoặc relay đóng tách nhưng không ra các mức áp chính 12V/5V/3.3V. Đo trên tụ lọc chính C_BULK1 chỉ có ~310VDC (áp nắn thẳng từ 220VAC).',
    severity: 'critical_hv',
    affectedZones: ['zone-pfc', 'zone-llc'],
    suspectComponentIds: ['C_BULK1', 'Q_PFC1', 'D_PFC1', 'U_PFC_LLC'],
    affectedRails: ['HV_390V_PFC', 'AC_LINE', 'VCC_IC_15V'],
    rootCauses: [
      'IC điều khiển Combo PFC/LLC U_PFC_LLC mất nguồn VCC hoặc hỏng khối tạo dao động PFC Boost.',
      'Cụm điện trở dải cao hồi tiếp phân áp PFC_FB về IC bị đứt hoặc tăng trị số.',
      'MOSFET tầng Boost PFC Q_PFC1 không nhận được xung kích từ chân GATE IC dao động.'
    ],
    quickFixSummary: 'CẨN THẬN CAO ÁP 310V-400VDC! Đo VCC IC PFC_LLC, kiểm tra dải điện trở cầu phân áp lấy mẫu áp cao PFC_FB từ cực dương tụ C_BULK1 về chân hồi tiếp IC.',
    steps: [
      {
        id: 'step-psu5-1',
        stepNumber: 1,
        title: 'Đo điện áp DC hai đầu tụ lọc chính C_BULK1 khi kích mở nguồn',
        instruction: 'CẢNH BÁO NGUY HIỂM CAO ÁP 400VDC! Kẹp sẵn 2 que đo đồng hồ thang DC 1000V vào hai cực tụ C_BULK1. Cắm điện và kích PS_ON# xuống GND.',
        targetComponentId: 'C_BULK1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'voltage',
        expectedValue: '385VDC - 395VDC khi kích nguồn (tăng từ mức 310VDC ban đầu).',
        passNextStepId: 'resolved',
        failDiagnosis: 'Điện áp giữ nguyên ở mức ~310VDC không hề tăng vọt lên ~390VDC -> Mạch Boost PFC hoàn toàn không hoạt động.',
        failSuspectComponents: ['U_PFC_LLC', 'Q_PFC1'],
        repairAction: 'Tiến hành đo kiểm tra nguồn nuôi VCC và mạch lấy mẫu hồi tiếp của IC U_PFC_LLC.'
      },
      {
        id: 'step-psu5-2',
        stepNumber: 2,
        title: 'Đo điện áp VCC cấp cho IC điều khiển U_PFC_LLC',
        instruction: 'Đo điện áp DC trên đường VCC_IC_15V cấp cho IC dao động U_PFC_LLC so với mass sơ cấp sau khi kích nguồn.',
        targetComponentId: 'U_PFC_LLC',
        targetNetId: 'VCC_IC_15V',
        measureMode: 'voltage',
        expectedValue: '14.0VDC - 15.5VDC ổn định.',
        passNextStepId: 'step-psu5-3',
        failDiagnosis: 'Mất áp VCC (0V) hoặc áp dao động nhấp nháy 6V-9V dưới ngưỡng khởi động UVLO của IC.',
        failSuspectComponents: ['U_PFC_LLC', 'U_OPT1'],
        repairAction: 'Kiểm tra mạch cấp nguồn VCC từ cuộn phụ biến áp T_5VSB qua Optocoupler mở lệnh kích.'
      },
      {
        id: 'step-psu5-3',
        stepNumber: 3,
        title: 'Kiểm tra dải điện trở lấy mẫu hồi tiếp PFC Feedback',
        instruction: 'RÚT ĐIỆN VÀ XẢ TỤ CHÍNH. Đo chuỗi điện trở nối từ cực dương tụ C_BULK1 về chân hồi tiếp PFC của IC U_PFC_LLC.',
        targetComponentId: 'U_PFC_LLC',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'resistance',
        expectedValue: 'Tổng trở kháng chuỗi đúng theo thiết kế (3.3MΩ - 4.7MΩ).',
        passNextStepId: 'step-psu5-4',
        failDiagnosis: 'Điện trở dải cao bị đứt hẳn (OL) khiến chân FB nhận sai điện áp.',
        failSuspectComponents: ['U_PFC_LLC'],
        repairAction: 'Thay thế điện trở chính xác loại chuyên dụng điện áp cao SMD.'
      },
      {
        id: 'step-psu5-4',
        stepNumber: 4,
        title: 'Kiểm tra xung kích Gate tại chân kích MOSFET Q_PFC1',
        instruction: 'Sử dụng máy hiện sóng kết nối qua biến áp cách ly an toàn. Đo xung kích PWM tại chân G của MOSFET Q_PFC1.',
        targetComponentId: 'Q_PFC1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'oscilloscope',
        expectedValue: 'Xung vuông biên độ 10V - 12V, tần số dao động 65kHz - 100kHz.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Có VCC và FB chuẩn nhưng chân Gate không xuất xung -> IC điều khiển U_PFC_LLC bị hỏng.',
        failSuspectComponents: ['U_PFC_LLC', 'Q_PFC1'],
        repairAction: 'Thay IC điều khiển combo PFC/LLC U_PFC_LLC.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 6: Có đủ +12V, +5V, +3.3V nhưng mất tín hiệu PWR_OK (Dây xám = 0V)
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-006',
    boardId: 'seasonic-focus-gx650',
    category: 'psu',
    brandTag: 'Seasonic / Corsair',
    title: 'Có đủ +12V, +5V, +3.3V nhưng mất tín hiệu Power Good (Dây xám PWR_OK = 0V) máy tính không boot',
    symptom: 'Nguồn kích chạy quạt quay bình thường, đo đường +12V_MAIN đủ 12.1V, các đường 5V và 3.3V đủ chuẩn, nhưng cắm mainboard quạt CPU quay mà không lên hình, đo dây xám (PWR_OK) luôn ở mức thấp 0V.',
    severity: 'medium',
    affectedZones: ['zone-protection', 'zone-sec-12v'],
    suspectComponentIds: ['U_SUP', 'U_OPT1', 'J_ATX24'],
    affectedRails: ['PWR_OK', '+12V_MAIN', '+5VSB'],
    rootCauses: [
      'IC giám sát nguồn U_SUP bị lỗi mạch trễ phát tín hiệu PG hoặc hỏng tầng transistor ngõ ra chân PWR_OK.',
      'Một đường điện áp có độ gợn nhiễu quá lớn khiến IC không cho phép bật PWR_OK.',
      'Tụ trễ chân PG bị chập hoặc rò điện làm triệt tiêu thời gian trễ chuẩn.'
    ],
    quickFixSummary: 'Kiểm tra điện áp các đường phụ, kiểm tra tụ định thời PG và thay IC Supervisor bảo vệ thứ cấp U_SUP.',
    steps: [
      {
        id: 'step-psu6-1',
        stepNumber: 1,
        title: 'Đo kiểm tra các đường điện áp ngõ ra tại giắc cắm J_ATX24',
        instruction: 'Kích nguồn hoạt động. Đo điện áp đường +12V_MAIN và +5VSB tại đầu cắm J_ATX24 so với GND.',
        targetComponentId: 'J_ATX24',
        targetNetId: '+12V_MAIN',
        measureMode: 'voltage',
        expectedValue: '+12V_MAIN: 11.8V - 12.2V; +5VSB: 5.0V - 5.15V.',
        passNextStepId: 'step-psu6-2',
        failDiagnosis: 'Điện áp ngõ ra bị thiếu hoặc sụt áp bất thường.',
        failSuspectComponents: ['U_SUP'],
        repairAction: 'Kiểm tra đường nắn dòng thứ cấp.'
      },
      {
        id: 'step-psu6-2',
        stepNumber: 2,
        title: 'Đo điện áp tại chân ngõ ra PWR_OK của IC giám sát U_SUP',
        instruction: 'Đo điện áp DC tại chân PWR_OK của IC U_SUP so với GND.',
        targetComponentId: 'U_SUP',
        targetNetId: 'PWR_OK',
        measureMode: 'voltage',
        expectedValue: 'PWR_OK = 4.8V - 5.1V (mức cao logic).',
        passNextStepId: 'step-psu6-3',
        failDiagnosis: 'Các đường nguồn đủ chuẩn nhưng chân PWR_OK vẫn bị kéo ghim xuống 0V.',
        failSuspectComponents: ['U_SUP'],
        repairAction: 'Thay thế IC giám sát U_SUP.'
      },
      {
        id: 'step-psu6-3',
        stepNumber: 3,
        title: 'Kiểm tra điện trở Pull-up kéo lên của tín hiệu PWR_OK',
        instruction: 'Ngắt điện đo điện trở giữa đường PWR_OK và đường 5V.',
        targetComponentId: 'U_SUP',
        targetNetId: 'PWR_OK',
        measureMode: 'resistance',
        expectedValue: 'Điện trở kéo lên khoảng 1kΩ - 4.7kΩ; không bị chập xuống mass.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Tụ dập nhiễu SMD chân PWR_OK bị đánh thủng ngắn mạch dập thẳng tín hiệu xuống mass.',
        failSuspectComponents: ['U_SUP'],
        repairAction: 'Loại bỏ tụ chập SMD và thay thế trở kéo lên mới.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 7: Hỏng bo con DC-DC (MOD_DCDC) trên nguồn Gold/Bronze: Mất áp +5V hoặc +3.3V
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-007',
    boardId: 'coolermaster-mwe-650',
    category: 'psu',
    brandTag: 'Cooler Master / Corsair',
    title: 'Hỏng module VRM DC-DC (MOD_DCDC) trên nguồn Gold/Bronze: Mất áp +5V hoặc +3.3V ngắt UVP',
    symptom: 'Kích nguồn quạt giật rồi ngắt. Đo nguội kiểm tra ngõ ra phát hiện ngõ vào/ngõ ra của module con MOD_DCDC bị chập mass 0 ohm, kích nguồn chỉ có +12V còn 5V/3.3V = 0V.',
    severity: 'high',
    affectedZones: ['zone-sec-12v', 'zone-protection'],
    suspectComponentIds: ['MOD_DCDC', 'U_SUP'],
    affectedRails: ['+12V_MAIN', 'PS_ON#', '+5VSB'],
    rootCauses: [
      'MOSFET đồng bộ hạ áp (Buck MOSFET) trên bo mạch con DC-DC MOD_DCDC bị đánh thủng D-S.',
      'IC điều khiển PWM trên module MOD_DCDC bị chập chân cấp nguồn.',
      'Tụ rắn ngõ ra của module MOD_DCDC bị đánh thủng ngắn mạch do nhiệt độ cao.'
    ],
    quickFixSummary: 'Tháo module con DC-DC MOD_DCDC ra khỏi bo chính, kiểm tra từng cặp MOSFET Buck và IC điều khiển. Thay thế linh kiện hỏng hoặc thay cả cụm module DC-DC.',
    steps: [
      {
        id: 'step-psu7-1',
        stepNumber: 1,
        title: 'Đo thang trở kháng/diode tại đầu vào 12V của MOD_DCDC ra GND',
        instruction: 'Để đồng hồ thang đo Diode/thông mạch. Đặt que đỏ vào GND, que đen vào chân In +12V_MAIN của module MOD_DCDC.',
        targetComponentId: 'MOD_DCDC',
        targetNetId: '+12V_MAIN',
        measureMode: 'diode',
        expectedValue: '0.350V - 0.480V.',
        passNextStepId: 'step-psu7-2',
        failDiagnosis: 'Đo ra 0.001V (kêu bíp chập mass hoàn toàn) trên module DC-DC con.',
        failSuspectComponents: ['MOD_DCDC'],
        repairAction: 'Xác định module con MOD_DCDC là thủ phạm gây ngắn mạch làm nhảy bảo vệ SCP.'
      },
      {
        id: 'step-psu7-2',
        stepNumber: 2,
        title: 'Tháo module con MOD_DCDC và đo kiểm tra dàn MOSFET Buck hạ áp',
        instruction: 'Hút sạch mối chì chân cắm liên kết bo con MOD_DCDC với bo mạch mẹ. Đo từng MOSFET trên bo con.',
        targetComponentId: 'MOD_DCDC',
        targetNetId: '+12V_MAIN',
        measureMode: 'diode',
        expectedValue: 'Các MOSFET hạ áp kênh N có tiếp giáp D-S bình thường (thuận 0.45V, ngược OL).',
        passNextStepId: 'step-psu7-3',
        failDiagnosis: 'MOSFET Low-Side hoặc High-Side bị nổ chập chân D sang S.',
        failSuspectComponents: ['MOD_DCDC'],
        repairAction: 'Khò nhổ bỏ MOSFET chập và thay con tương đương.'
      },
      {
        id: 'step-psu7-3',
        stepNumber: 3,
        title: 'Kiểm tra trở kháng chân cấp nguồn của IC PWM trên module MOD_DCDC',
        instruction: 'Đo kiểm tra trở kháng chân VCC của IC PWM DC-DC so với mass.',
        targetComponentId: 'MOD_DCDC',
        targetNetId: '+12V_MAIN',
        measureMode: 'resistance',
        expectedValue: 'Trở kháng chân VCC > 10kΩ so với mass.',
        passNextStepId: 'step-psu7-4',
        failDiagnosis: 'IC PWM bị chập chân VCC xuống GND kéo theo chết MOSFET.',
        failSuspectComponents: ['MOD_DCDC'],
        repairAction: 'Hàn thay thế IC PWM mới trên module con.'
      },
      {
        id: 'step-psu7-4',
        stepNumber: 4,
        title: 'Cấp điện test áp ngõ ra bo con sau khi hàn phục hồi',
        instruction: 'Hàn module MOD_DCDC trở lại bo chính. Kích nguồn đo áp tại các đường ngõ ra.',
        targetComponentId: 'MOD_DCDC',
        targetNetId: '+12V_MAIN',
        measureMode: 'voltage',
        expectedValue: 'Đường 5V đạt 5.05VDC, đường 3.3V đạt 3.32VDC ổn định chuẩn xác.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Áp ra bị lệch quá 10% do sai lệch cầu phân áp hồi tiếp FB.',
        failSuspectComponents: ['MOD_DCDC', 'U_SUP'],
        repairAction: 'Kiểm tra các điện trở lấy mẫu chính xác 1% tại chân FB của IC PWM.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 8: Hỏng mạch hồi tiếp Optocoupler U_OPT1 và TL431: Điện áp 5VSB/12V vọt cao kích OVP
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-008',
    boardId: 'all_psu',
    category: 'psu',
    brandTag: 'Tất cả PSU / Huntkey / Acbel / FSP',
    title: 'Hỏng mạch hồi tiếp Optocoupler U_OPT1 và TL431: Điện áp 5VSB/12V vọt cao kích hoạt OVP',
    symptom: 'Nguồn cắm điện đo dây tím vọt lên 7V - 11V làm cháy thiết bị cắm cổng USB hoặc kích nguồn nghe tiếng rít lớn rồi ngắt do bảo vệ quá áp (OVP) khóa cứng.',
    severity: 'critical_hv',
    affectedZones: ['zone-5vsb', 'zone-protection'],
    suspectComponentIds: ['U_OPT1', 'U_TL431', 'U_5VSB'],
    affectedRails: ['+5VSB', '+12V_MAIN'],
    rootCauses: [
      'IC so quang cách ly Optocoupler U_OPT1 bị đứt LED phát quang bên sơ cấp hoặc rò transistor cảm quang bên thứ cấp.',
      'IC tham chiếu điện áp Shunt Regulator U_TL431 bị hỏng hoặc điện trở cầu phân áp lấy mẫu bị tăng trị số.',
      'Mạch vòng hồi tiếp kín (Closed Loop Feedback) bị hở khiến IC PWM đẩy độ rộng xung Duty Cycle lên mức cực đại.'
    ],
    quickFixSummary: 'Cực kỳ nguy hiểm cho mainboard! Cần thay thế ngay đồng thời cặp đôi linh kiện hồi tiếp: Optocoupler U_OPT1 và IC U_TL431 kèm kiểm tra lại các điện trở phân áp SMD xung quanh.',
    steps: [
      {
        id: 'step-psu8-1',
        stepNumber: 1,
        title: 'Đo kiểm tra diode phát quang nội tại của Optocoupler U_OPT1',
        instruction: 'RÚT PHÍCH ĐIỆN. Để đồng hồ thang đo Diode. Đặt que đỏ vào chân 1 (Anode) và que đen vào chân 2 (Cathode) của U_OPT1.',
        targetComponentId: 'U_OPT1',
        targetNetId: '+5VSB',
        measureMode: 'diode',
        expectedValue: '1.050V - 1.200V chiều thuận; Chiều ngược hiển thị vô cùng (OL).',
        passNextStepId: 'step-psu8-2',
        failDiagnosis: 'Chân 1-2 đứt mạch (OL cả 2 chiều) hoặc bị đánh thủng 0.000V.',
        failSuspectComponents: ['U_OPT1'],
        repairAction: 'Hút thiếc tháo IC Optocoupler U_OPT1 ra khỏi bo mạch.'
      },
      {
        id: 'step-psu8-2',
        stepNumber: 2,
        title: 'Đo kiểm tra transistor cảm quang chân 3-4 của U_OPT1',
        instruction: 'Đo thang trở kháng/diode giữa chân 3 (Emitter) và chân 4 (Collector) của U_OPT1 khi chưa có dòng kích chân 1-2.',
        targetComponentId: 'U_OPT1',
        targetNetId: '+5VSB',
        measureMode: 'resistance',
        expectedValue: 'Điện trở vô cùng (OL / >20MΩ) ở cả hai chiều đo que.',
        passNextStepId: 'step-psu8-3',
        failDiagnosis: 'Chân 3-4 bị rò rỉ dẫn điện khiến IC nguồn sơ cấp hiểu sai trạng thái tải.',
        failSuspectComponents: ['U_OPT1'],
        repairAction: 'Thay ngay Optocoupler U_OPT1 mới chính hãng.'
      },
      {
        id: 'step-psu8-3',
        stepNumber: 3,
        title: 'Kiểm tra IC tạo điện áp chuẩn Shunt Regulator U_TL431',
        instruction: 'Đo thang Diode giữa các chân Reference (Ref), Anode (A) và Cathode (K) của IC U_TL431.',
        targetComponentId: 'U_TL431',
        targetNetId: '+5VSB',
        measureMode: 'diode',
        expectedValue: 'Giữa A và K có tiếp giáp diode bảo vệ nội (thuận ~0.65V, ngược OL).',
        passNextStepId: 'step-psu8-4',
        failDiagnosis: 'U_TL431 bị đánh thủng ngắn mạch chân Ref sang Anode hoặc hở đứt chân K.',
        failSuspectComponents: ['U_TL431'],
        repairAction: 'Thay thế IC U_TL431 mới chính xác.'
      },
      {
        id: 'step-psu8-4',
        stepNumber: 4,
        title: 'Đo kiểm tra chuỗi trở lấy mẫu phân áp chân Ref của U_TL431',
        instruction: 'Đo điện trở hai con trở phân áp mắc từ đường +5VSB xuống chân Ref và từ chân Ref xuống GND.',
        targetComponentId: 'U_TL431',
        targetNetId: '+5VSB',
        measureMode: 'resistance',
        expectedValue: 'Trị số đúng với thông số chuẩn (thường chia 5V về 2.5V tại chân Ref).',
        passNextStepId: 'resolved',
        failDiagnosis: 'Trở nối đất tăng trị số làm điện áp chân Ref thấp hơn 2.5V khiến nguồn boost áp ngõ ra lên cực đại.',
        failSuspectComponents: ['U_TL431', 'U_OPT1'],
        repairAction: 'Thay điện trở sai số 1% để đảm bảo điện áp ngõ ra chuẩn xác 5.00V.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 9: Nguồn phổ thông TL494 nổ cặp sò công suất MJE13007/13009 và khô tụ 200V
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-009',
    boardId: 'generic-atx-tl494',
    category: 'psu',
    brandTag: 'Generic ATX / Huntkey / Golden Field',
    title: 'Nguồn phổ thông TL494 nổ cặp sò BJT công suất MJE13007/13009 và khô cặp tụ cao áp 200V',
    symptom: 'Nguồn không chạy, cầu chì nổ đen, đo thang trở kháng phát hiện cặp Transistor công suất dạng Half-Bridge (Q_SW1, Q_SW2) bị thông mạch chập B-C-E, cặp tụ lọc chính 200V C_HV1 bị phù đầu.',
    severity: 'critical_hv',
    affectedZones: ['zone-halfbridge', 'zone-pwm-sec'],
    suspectComponentIds: ['Q_SW1', 'Q_SW2', 'F1', 'BD1', 'C_HV1', 'U_PWM'],
    affectedRails: ['AC_LINE', 'HV_310V_DC', 'VCC_TL494'],
    rootCauses: [
      'Cặp tụ hóa lọc nguồn cao áp 200V C_HV1 (mắc nối tiếp tạo điện áp giữa 155V/310V) bị khô kiệt dung lượng, làm mất cân bằng điện áp điểm giữa và xung đột biến đánh nổ sò.',
      'Cặp Transistor BJT công suất NPN Q_SW1, Q_SW2 bị đánh thủng mối nối Collector-Emitter do quá dòng hoặc quá nhiệt.',
      'Cặp diode bảo vệ ngược song song CE và các điện trở kích chân Base bị nổ đứt theo.'
    ],
    quickFixSummary: 'Thay cặp BJT công suất Q_SW1, Q_SW2 (MJE13009/13007), thay cặp tụ cao áp C_HV1 mới, thay trở kích chân Base (2.2Ω), kiểm tra biến áp kích T_DRIVE và IC U_PWM (TL494/KA7500).',
    steps: [
      {
        id: 'step-psu9-1',
        stepNumber: 1,
        title: 'Xả điện và đo nguội BJT công suất chính Q_SW1',
        instruction: 'CẢNH BÁO CAO ÁP 310VDC! Dùng trở tải 4.7kΩ xả sạch hai tụ C_HV1. Chuyển đồng hồ sang thang Diode, đo các mối tiếp giáp B-C, B-E và C-E của Q_SW1.',
        targetComponentId: 'Q_SW1',
        targetNetId: 'HV_310V_DC',
        measureMode: 'diode',
        expectedValue: 'B-C: 0.55V - 0.65V, B-E: 0.60V - 0.70V, C-E: Vô cùng (OL).',
        passNextStepId: 'step-psu9-2',
        failDiagnosis: 'Transistor Q_SW1 bị thủng C-E thành 0.000V (chập thông mạch hoàn toàn).',
        failSuspectComponents: ['Q_SW1', 'Q_SW2'],
        repairAction: 'Hút thiếc tháo thanh tản nhiệt sơ cấp cùng cặp BJT ra khỏi bo mạch.'
      },
      {
        id: 'step-psu9-2',
        stepNumber: 2,
        title: 'Đo kiểm tra Transistor công suất nhánh dưới Q_SW2',
        instruction: 'Đo thang Diode các mối nối B-C, B-E, C-E của BJT Q_SW2.',
        targetComponentId: 'Q_SW2',
        targetNetId: 'HV_310V_DC',
        measureMode: 'diode',
        expectedValue: 'B-C: 0.55V - 0.65V, B-E: 0.60V - 0.70V, C-E: Vô cùng (OL).',
        passNextStepId: 'step-psu9-3',
        failDiagnosis: 'Q_SW2 bị đánh thủng ngắn mạch C-E theo con thứ nhất.',
        failSuspectComponents: ['Q_SW1', 'Q_SW2'],
        repairAction: 'Bắt buộc thay đồng bộ cả 2 con BJT công suất Q_SW1 và Q_SW2.'
      },
      {
        id: 'step-psu9-3',
        stepNumber: 3,
        title: 'Kiểm tra cặp tụ hóa cao áp C_HV1 lọc nguồn nắn nửa cầu (Half-Bridge)',
        instruction: 'Tháo hai quả tụ hóa cao áp chính C_HV1 đo kiểm tra dung lượng và kiểm tra hai điện trở xả cân bằng.',
        targetComponentId: 'C_HV1',
        targetNetId: 'HV_310V_DC',
        measureMode: 'resistance',
        expectedValue: 'Dung lượng 2 tụ phải đều nhau (sai lệch < 5%), hai trở cân bằng áp có trị số bằng nhau.',
        passNextStepId: 'step-psu9-4',
        failDiagnosis: 'Một trong hai tụ bị phồng hoặc tụt dung lượng chỉ còn vài chục uF gây lệch tâm áp đánh nổ sò.',
        failSuspectComponents: ['C_HV1'],
        repairAction: 'Thay mới đồng bộ cả cặp tụ cao áp C_HV1 mới.'
      },
      {
        id: 'step-psu9-4',
        stepNumber: 4,
        title: 'Kiểm tra dao động từ IC PWM U_PWM qua biến áp lái T_DRIVE',
        instruction: 'Cấp điện phụ ngoài vào chân VCC của IC U_PWM (TL494). Dùng máy hiện sóng kiểm tra 2 chân đầu ra Collector kích lái.',
        targetComponentId: 'U_PWM',
        targetNetId: 'VCC_TL494',
        measureMode: 'oscilloscope',
        expectedValue: 'Hai xung vuông lệch pha 180 độ đối xứng hoàn hảo, tần số ~30kHz - 50kHz.',
        passNextStepId: 'resolved',
        failDiagnosis: 'Mất một trong hai xung hoặc xung bị méo dạng do hỏng tầng kích lái T_DRIVE.',
        failSuspectComponents: ['U_PWM', 'T_DRIVE'],
        repairAction: 'Thay IC U_PWM (TL494 / KA7500) hoặc transistor đệm lái xung.'
      }
    ]
  },

  // -------------------------------------------------------------------------
  // Case 10: Nguồn Seasonic/Corsair tự tắt khi vào game nặng
  // -------------------------------------------------------------------------
  {
    id: 'psu-fault-010',
    boardId: 'seasonic-focus-gx650',
    category: 'psu',
    brandTag: 'Seasonic / Corsair',
    title: 'Nguồn tự sập ngắt điện khi tải nặng / vào Game do sụt dung lượng tụ lọc chính C_BULK1 hoặc relay NTC',
    symptom: 'Bật máy lướt web, văn phòng bình thường, nhưng hễ vào Game 3D nặng hoặc chạy Stress Test FurMark/Cinebench là nguồn nghe tiếng tách của relay rồi cúp toàn bộ nguồn, máy tính tắt ngấm.',
    severity: 'high',
    affectedZones: ['zone-pfc', 'zone-emi', 'zone-protection'],
    suspectComponentIds: ['C_BULK1', 'NTC1', 'U_SUP'],
    affectedRails: ['HV_390V_PFC', '+12V_MAIN', 'AC_LINE'],
    rootCauses: [
      'Tụ lọc chính Bulk Capacitor C_BULK1 bị giảm dung lượng nghiêm trọng (từ 470uF tụt còn dưới 200uF) làm điện áp DC bus bị võng sụt mạnh khi công suất kéo đỉnh, kích hoạt bảo vệ Brownout / UVP.',
      'Tiếp điểm bypass điện trở nhiệt NTC1 không đóng hoặc tiếp điểm bị cháy rỗ, dòng tải cao chạy qua NTC1 làm sụt áp trầm trọng và quá nhiệt.',
      'Cảm biến nhiệt độ OTP thứ cấp báo sai kích IC giám sát U_SUP ngắt nguồn.'
    ],
    quickFixSummary: 'Tháo tụ lọc chính C_BULK1 đo dung lượng thực tế bằng đồng hồ LCR; kiểm tra điện trở nhiệt hạn dòng NTC1 và IC giám sát U_SUP.',
    steps: [
      {
        id: 'step-psu10-1',
        stepNumber: 1,
        title: 'Theo dõi điện áp DC bus trên tụ C_BULK1 khi chuyển từ tải nhẹ sang kéo tải nặng',
        instruction: 'CẢNH BÁO CAO ÁP 400VDC! Kẹp chắc que đo đồng hồ DC 1000V vào hai cực tụ C_BULK1. Cho máy tính chạy stress test card đồ họa và CPU.',
        targetComponentId: 'C_BULK1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'voltage',
        expectedValue: 'Duy trì ổn định từ 385VDC đến 395VDC (không được sụt giảm quá 10V khi tải tăng vọt).',
        passNextStepId: 'step-psu10-2',
        failDiagnosis: 'Điện áp tụt đột ngột xuống dưới 340VDC ngay khi card đồ họa ăn dòng -> Nguồn kích hoạt ngắt bảo vệ điện áp thấp UVP.',
        failSuspectComponents: ['C_BULK1'],
        repairAction: 'Hút thiếc tháo tụ C_BULK1 kiểm tra dung lượng định mức.'
      },
      {
        id: 'step-psu10-2',
        stepNumber: 2,
        title: 'Đo kiểm tra dung lượng (uF) và nội trở ESR của tụ lọc chính C_BULK1',
        instruction: 'Rút nguồn, xả điện tụ. Dùng đồng hồ đo LCR chuyên dụng đo thông số của tụ chính C_BULK1 (ví dụ 470uF / 450V 105°C).',
        targetComponentId: 'C_BULK1',
        targetNetId: 'HV_390V_PFC',
        measureMode: 'resistance',
        expectedValue: 'Dung lượng đo được ≥ 440uF (sai số trong vòng 10%), ESR < 0.15Ω.',
        passNextStepId: 'step-psu10-3',
        failDiagnosis: 'Tụ bị chai khô, dung lượng chỉ còn 150uF - 250uF, ESR tăng gấp nhiều lần.',
        failSuspectComponents: ['C_BULK1'],
        repairAction: 'Thay tụ lọc chính mới đúng kích thước và dải nhiệt độ (Nichicon / Nippon Chemi-Con 105°C).'
      },
      {
        id: 'step-psu10-3',
        stepNumber: 3,
        title: 'Kiểm tra điện trở nhiệt hạn dòng khởi động NTC1',
        instruction: 'Đo điện trở nguội của NTC1 khi nhiệt độ phòng ~25°C.',
        targetComponentId: 'NTC1',
        targetNetId: 'AC_LINE',
        measureMode: 'resistance',
        expectedValue: '5Ω - 10Ω ở nhiệt độ phòng, giảm dần về <1Ω khi ấm lên.',
        passNextStepId: 'step-psu10-4',
        failDiagnosis: 'NTC1 bị nứt vỡ hoặc trở kháng tăng vọt lên >100Ω cản trở dòng điện AC nạp nguồn.',
        failSuspectComponents: ['NTC1'],
        repairAction: 'Thay điện trở nhiệt NTC1 loại 5D-15 / 10D-15 mới.'
      },
      {
        id: 'step-psu10-4',
        stepNumber: 4,
        title: 'Kiểm tra tín hiệu bảo vệ trên IC giám sát U_SUP',
        instruction: 'Đo điện áp các chân bảo vệ của IC U_SUP khi máy tính hoạt động ở mức tải 80%.',
        targetComponentId: 'U_SUP',
        targetNetId: '+12V_MAIN',
        measureMode: 'voltage',
        expectedValue: 'Các mức áp nằm an toàn trong dải danh định, chân FPO# giữ ở mức thấp 0V (cho phép chạy).',
        passNextStepId: 'resolved',
        failDiagnosis: 'IC U_SUP bị trôi ngưỡng bảo vệ nhiệt/dòng gây ngắt nguồn sớm.',
        failSuspectComponents: ['U_SUP'],
        repairAction: 'Thay thế IC giám sát U_SUP và vệ sinh tra dầu quạt tản nhiệt.'
      }
    ]
  }
];
