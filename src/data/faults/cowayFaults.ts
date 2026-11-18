import type { FaultCase } from '../../types/circuit';

export const COWAY_FAULTS: FaultCase[] = [
  // =========================================================================
  // NHÓM 1: MÁY LỌC KHÔNG KHÍ COWAY (AP-1512HH / AP-1008CH / AP-1009CH)
  // =========================================================================

  // Pan 1: Mất nguồn mặt điều khiển dù đủ +5V/+15V (IC Reset KIA7032AP)
  {
    id: 'coway-fault-001',
    boardId: 'coway-air-ap1512hh',
    category: 'appliance',
    brandTag: 'Coway (AP-1512HH / AP-1008CH)',
    title: 'Mất nguồn mặt điều khiển hoàn toàn dù đủ +5VDC — Lỗi kinh điển IC Reset KIA7032AP (U_RST)',
    symptom:
      'Cắm điện máy lọc khí Coway AP-1512HH / AP-1008CH im lìm không sáng đèn nào, bấm nút Power không lên, đo nguồn cấp lên bo khiển vẫn có đủ +5VDC và +15VDC. Bệnh đặc sản hay gặp sau 2–4 năm cắm điện 24/7.',
    severity: 'high',
    affectedZones: ['zone-coway-air-mcu', 'zone-coway-air-smps'],
    suspectComponentIds: ['U_RST', 'U_MCU_AIR', 'U_SMPS1'],
    affectedRails: ['+5V_MCU', 'RESET_MCU', '+15V_DRV'],
    rootCauses: [
      'IC giám sát điện áp Reset KIA7032AP / KIA7042AP (U_RST vỏ 3 chân TO-92) bị rò hoặc chết ngõ ra, ghim chặt chân OUT xuống dưới 1V làm vi điều khiển U_MCU_AIR bị giữ ở trạng thái Reset vĩnh viễn.',
      'Tụ gốm 104 (100nF) lọc nhiễu trên đường RESET_MCU bị rò điện xuống GND.',
      'Hoặc khối nguồn xung U_SMPS1 sụt áp khiến +5V chỉ còn dưới 3.2V làm KIA7032AP ngắt reset đúng chức năng bảo vệ.',
    ],
    quickFixSummary:
      'Đo đủ +5.0V tại chân VCC của U_RST rồi đo chân 1 (OUT): nếu OUT tụt ở 0V–0.8V trong khi VCC đủ 5V thì 95% chết IC Reset KIA7032AP. Thay KIA7032AP mới (lưu ý đúng thứ tự chân OUT-VCC-GND).',
    steps: [
      {
        id: 'step-coway1-1',
        stepNumber: 1,
        title: 'Đo kiểm tra đường nguồn logic +5V_MCU cấp lên bo điều khiển',
        instruction:
          'Cắm điện qua ổ an toàn (chỉ chạm vào que đo bọc cách điện). Đặt đồng hồ thang DC 20V, que đen vào GND_SEC, que đỏ vào chân 2 (VCC) của U_RST hoặc tụ lọc +5V_MCU.',
        targetComponentId: 'U_RST',
        targetNetId: '+5V_MCU',
        measureMode: 'voltage',
        expectedValue: '4.85V - 5.15VDC',
        passNextStepId: 'step-coway1-2',
        failDiagnosis:
          'Mất +5V hoặc áp chỉ còn nhấp nháy 1V–3V -> Lỗi nằm ở khối nguồn xung sơ/thứ cấp U_SMPS1 hoặc chập trên đường 5V.',
        failSuspectComponents: ['U_SMPS1', 'U_OPTO1'],
        repairAction: 'Kiểm tra cầu chì F_AC1, tụ lọc đầu ra 5V và IC nguồn xung U_SMPS1.',
      },
      {
        id: 'step-coway1-2',
        stepNumber: 2,
        title: 'Đo áp chân 1 (OUT / RESET_MCU) của IC giám sát KIA7032AP',
        instruction:
          'Khi đường +5V_MCU đã đủ 5V ổn định, đo điện áp DC tại chân 1 (OUT) của U_RST nối tới chân Reset vi điều khiển.',
        targetComponentId: 'U_RST',
        targetNetId: 'RESET_MCU',
        measureMode: 'voltage',
        expectedValue: '4.7V - 5.1VDC',
        passNextStepId: 'step-coway1-3',
        failDiagnosis:
          'Chân OUT bị kéo xuống 0V–0.9V dù VCC đủ 5V! Đây là pan kinh điển chết IC Reset KIA7032AP (hoặc rò tụ 104 chân Reset).',
        failSuspectComponents: ['U_RST'],
        repairAction:
          'Hút bỏ U_RST (KIA7032AP), kiểm tra tụ gốm lọc chân Reset rồi thay KIA7032AP mới đúng chiều chân. Máy sẽ lên đèn ngay lập tức.',
      },
      {
        id: 'step-coway1-3',
        stepNumber: 3,
        title: 'Đo trở kháng đường +5V và kiểm tra thạch anh MCU nếu RESET vẫn đủ 5V',
        instruction:
          'Rút điện, đo trở kháng đường +5V_MCU xuống GND_SEC và kiểm tra xung/tần số thạch anh gốm cạnh U_MCU_AIR.',
        targetComponentId: 'U_MCU_AIR',
        targetNetId: '+5V_MCU',
        measureMode: 'resistance',
        expectedValue: '800Ω - 50000Ω',
        passNextStepId: 'resolved',
        failDiagnosis: 'Trở kháng <30Ω chứng tỏ bản thân vi điều khiển U_MCU_AIR hoặc tụ 5V bị chập nội.',
        failSuspectComponents: ['U_MCU_AIR'],
        repairAction: 'Dùng nguồn dòng nhỏ dò tụ rò trên nhánh 5V; nếu MCU nóng rát khi cấp 5V thì cần thay bo điều khiển.',
      },
    ],
  },

  // Pan 2: Công tắc từ cửa trước (Reed Switch / mất nam châm nắp)
  {
    id: 'coway-fault-002',
    boardId: 'coway-air-ap1512hh',
    category: 'appliance',
    brandTag: 'Coway (AP-1512HH / AP-1008CH)',
    title: 'Có đèn nguồn nhưng quạt không chạy hoặc nháy đèn — Hỏng công tắc từ cửa trước SW_DOOR / rơi nam châm',
    symptom:
      'Cắm điện thấy đèn nguồn và phím cảm ứng vẫn lên sáng, bấm tăng tốc quạt thì máy đứng im hoặc đèn báo nhấp nháy ngắt bảo vệ (thường xảy ra ngay sau khi khách tự mở nắp thay/vệ sinh màng lọc HEPA).',
    severity: 'low',
    affectedZones: ['zone-coway-air-bldc', 'zone-coway-air-mcu'],
    suspectComponentIds: ['SW_DOOR', 'U_MCU_AIR'],
    affectedRails: ['DOOR_SW_SIG', '+5V_MCU'],
    rootCauses: [
      'Rơi mất viên nam châm vĩnh cửu gắn ở mặt sau nắp nhựa trước khi khách vệ sinh máy.',
      'Công tắc từ thủy tinh (Reed Switch SW_DOOR) bị kẹt hở lá đồng hoặc đứt dây giắc dẫn xuống bo.',
      'Công tắc hành trình cơ (ở một số đời AP-1008CH/1009CH) bị oxy hóa tăng tiếp xúc điện trở.',
    ],
    quickFixSummary:
      'Đặt thử một viên nam châm lên vị trí công tắc từ trên thân máy hoặc đo thông mạch dây SW_DOOR khi đậy nắp. Thay Reed Switch mới hoặc gắn lại nam châm vào mặt nạ nhựa.',
    steps: [
      {
        id: 'step-coway2-1',
        stepNumber: 1,
        title: 'Kiểm tra trạng thái điện áp đường DOOR_SW_SIG khi đóng và mở mặt nạ',
        instruction:
          'Đậy kín nắp mặt trước (hoặc áp nam châm thử vào điểm SW_DOOR trên khung máy). Đo áp DC tại chân tín hiệu của giắc SW_DOOR so với GND_SEC.',
        targetComponentId: 'SW_DOOR',
        targetNetId: 'DOOR_SW_SIG',
        measureMode: 'voltage',
        expectedValue: '0.0V - 0.3VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Tín hiệu DOOR_SW_SIG vẫn treo ở mức cao ~4.8V–5.0V dù đã đóng nắp -> Công tắc từ SW_DOOR chưa đóng (mất nam châm nắp hoặc hỏng Reed Switch).',
        failSuspectComponents: ['SW_DOOR'],
        repairAction:
          'Kiểm tra hốc gắn nam châm sau mặt nạ trước; nếu mất nam châm hãy dán bổ sung nam châm Neodymium đúng vị trí.',
      },
      {
        id: 'step-coway2-2',
        stepNumber: 2,
        title: 'Đo nguội thông mạch công tắc từ SW_DOOR khi áp nam châm trực tiếp',
        instruction:
          'Rút điện, rút giắc SW_DOOR khỏi bo. Đo thang điện trở 2 chân giắc trong khi đưa nam châm áp sát trực tiếp vào bóng từ SW_DOOR.',
        targetComponentId: 'SW_DOOR',
        targetNetId: 'DOOR_SW_SIG',
        measureMode: 'resistance',
        expectedValue: '0.0Ω - 2.0Ω',
        passNextStepId: 'step-coway2-3',
        failDiagnosis:
          'Áp nam châm sát bóng thủy tinh nhưng đồng hồ vẫn báo OL hoặc nhảy điện trở hàng trăm Ohm -> Bóng Reed Switch SW_DOOR bị hỏng/nứt.',
        failSuspectComponents: ['SW_DOOR'],
        repairAction: 'Thay công tắc từ Reed Switch 2 chân mới và cố định chắc bằng keo nến/silicon.',
      },
      {
        id: 'step-coway2-3',
        stepNumber: 3,
        title: 'Kiểm tra điện trở kéo lên Pull-up từ +5V về đường DOOR_SW_SIG',
        instruction:
          'Cắm lại dây, đo áp hở mạch khi mở nắp trước: chân SW_DOOR phải có điện áp chờ +5V qua trở Pull-up.',
        targetComponentId: 'U_MCU_AIR',
        targetNetId: '+5V_MCU',
        measureMode: 'voltage',
        expectedValue: '4.5V - 5.1VDC',
        passNextStepId: 'resolved',
        failDiagnosis: 'Đứt trở Pull-up hoặc đứt mạch từ giắc SW_DOOR về chân GPIO của U_MCU_AIR.',
        failSuspectComponents: ['U_MCU_AIR', 'SW_DOOR'],
        repairAction: 'Dò lại đường mạch nối từ giắc SW_DOOR về chân MCU.',
      },
    ],
  },

  // Pan 3: Quạt BLDC không quay / nháy toàn bộ đèn tốc độ
  {
    id: 'coway-fault-003',
    boardId: 'coway-air-ap1512hh',
    category: 'appliance',
    brandTag: 'Coway (AP-1512HH / AP-1516D)',
    title: 'Quạt BLDC không quay hoặc giật nhẹ rồi nháy báo lỗi — Mất xung FG, sụt +15V hoặc hỏng mạch trong motor CN_MOTOR',
    symptom:
      'Bật máy đèn tốc độ 1-2-3 sáng bình thường nhưng quạt không quay (hoặc nhích quay 1–2 giây rồi dừng hẳn và toàn bộ hàng LED tốc độ chớp nháy liên tục báo lỗi động cơ).',
    postCode: 'BLDC Nháy Lỗi',
    severity: 'critical_hv',
    affectedZones: ['zone-coway-air-bldc', 'zone-coway-air-smps'],
    suspectComponentIds: ['CN_MOTOR', 'C_HV310', 'U_SMPS1', 'U_MCU_AIR'],
    affectedRails: ['HV_310V_BUS', '+15V_DRV', 'BLDC_VSP_FG'],
    rootCauses: [
      'Cắm/rút sống giắc CN_MOTOR khi tụ C_HV310 vẫn còn tích 310VDC làm đánh thủng IC công suất đúc bên trong motor quạt BLDC.',
      'Khô tụ lọc +15V_DRV hoặc tụ chính C_HV310 làm mất nguồn phụ nuôi tầng driver bên trong quạt.',
      'Đứt trở/mất tín hiệu điều tốc VSP (Pin 5) hoặc mất xung hồi tiếp tốc độ Hall FG (Pin 6) đưa về MCU -> MCU tưởng kẹt cánh quạt nên ngắt bảo vệ.',
    ],
    quickFixSummary:
      'RÚT ĐIỆN XẢ TỤ C_HV310! Đo nguội chập chân 1-3 (310V) và chân 4-3 (+15V) trên giắc motor quạt trước. Sau đó đo đủ +310VDC (Pin 1), +15VDC (Pin 4), VSP 1.8-5.2V (Pin 5) và xung FG ~2.5V (Pin 6).',
    steps: [
      {
        id: 'step-coway3-1',
        stepNumber: 1,
        title: 'Đo nguội kiểm tra chạm chập cuộn/IC bên trong motor quạt BLDC (Rút giắc)',
        instruction:
          'RÚT PHÍCH ĐIỆN và XẢ TỤ C_HV310 về <10V. Rút giắc quạt CN_MOTOR ra khỏi bo công suất, đo điện trở trên đầu giắc dây phía MOTOR giữa chân 4 (+15V) và chân 3 (GND).',
        targetComponentId: 'CN_MOTOR',
        targetNetId: '+15V_DRV',
        measureMode: 'resistance',
        expectedValue: '1000Ω - 50000Ω',
        passNextStepId: 'step-coway3-2',
        failDiagnosis:
          'Trở kháng chân +15V xuống GND phía dây motor chỉ còn vài Ohm hoặc 0Ω -> IC driver đúc trong bầu quạt BLDC đã chết chập! Nếu cố cắm sẽ kéo sập nguồn +15V trên bo.',
        failSuspectComponents: ['CN_MOTOR'],
        repairAction: 'Thay cụm động cơ quạt BLDC mới (hoặc thay IC điều khiển công suất nếu là loại motor tháo vỏ được).',
      },
      {
        id: 'step-coway3-2',
        stepNumber: 2,
        title: 'Kiểm tra đủ áp +310VDC (Pin 1) và +15VDC (Pin 4) trên bo cấp ra CN_MOTOR',
        instruction:
          'Cắm điện và bật nút Power cho máy chạy. CẨN THẬN CAO ÁP 310VDC! Đo chân 4 (+15V) so với chân 3 (GND) trên giắc CN_MOTOR trước, sau đó đo chân 1 (VM) thang DC 1000V.',
        targetComponentId: 'CN_MOTOR',
        targetNetId: '+15V_DRV',
        measureMode: 'voltage',
        expectedValue: '14.5V - 15.5VDC',
        passNextStepId: 'step-coway3-3',
        failDiagnosis:
          'Mất hoặc sụt đường +15V_DRV còn <11V khiến IC trong quạt BLDC khóa UVLO không khởi động.',
        failSuspectComponents: ['U_SMPS1', 'U_OPTO1', 'C_HV310'],
        repairAction: 'Thay tụ lọc ngõ ra +15V và kiểm tra cầu diode/biến áp cấp nhánh 15V từ nguồn U_SMPS1.',
      },
      {
        id: 'step-coway3-3',
        stepNumber: 3,
        title: 'Đo điện áp lệnh điều tốc VSP (Pin 5 CN_MOTOR) khi bấm đổi tốc độ 1-2-3',
        instruction:
          'Giữ que đen ở chân 3 (GND), đặt que đỏ vào chân 5 (VSP). Bấm nút chuyển qua lại giữa mức quạt 1, 2, 3 và quan sát sự thay đổi điện áp DC.',
        targetComponentId: 'CN_MOTOR',
        targetNetId: 'BLDC_VSP_FG',
        measureMode: 'voltage',
        expectedValue: '1.8V - 5.5VDC',
        passNextStepId: 'step-coway3-4',
        failDiagnosis:
          'Áp VSP luôn bằng 0V dù công tắc cửa SW_DOOR đã đóng -> Đứt cáp nối bo khiển xuống bo công suất hoặc chết transistor đệm VSP.',
        failSuspectComponents: ['U_MCU_AIR', 'CN_MOTOR'],
        repairAction: 'Kiểm tra dây bẹ liên kết 2 bo và mạch khuếch đại PWM->DC sang chân VSP.',
      },
      {
        id: 'step-coway3-4',
        stepNumber: 4,
        title: 'Kiểm tra xung hồi tiếp tốc độ Hall FG (Pin 6 CN_MOTOR)',
        instruction:
          'Khi quạt nhích quay lúc khởi động, đo chân 6 (FG) bằng đồng hồ DC (hoặc máy hiện sóng xem xung vuông 0-5V). Dùng tay xoay nhẹ cánh quạt lúc đã cấp 15V xem chân FG có nhấp nháy xung không.',
        targetComponentId: 'CN_MOTOR',
        targetNetId: 'BLDC_VSP_FG',
        measureMode: 'voltage',
        expectedValue: '2.0V - 3.0VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Quạt có đủ 310V, 15V, VSP và quay được nhưng chân FG giữ chết ở 0V hoặc 5V không đổi -> Mất tín hiệu FG về MCU gây ngắt báo lỗi sau 2 giây.',
        failSuspectComponents: ['CN_MOTOR', 'U_MCU_AIR'],
        repairAction: 'Kiểm tra trở Pull-up 10kΩ lên 5V của đường FG và thay cụm quạt BLDC nếu cảm biến Hall bên trong quạt đã hỏng.',
      },
    ],
  },

  // Pan 4: Đèn AQI luôn báo Đỏ rực không đổi màu (Cảm biến bụi CN_DUST)
  {
    id: 'coway-fault-004',
    boardId: 'coway-air-ap1512hh',
    category: 'appliance',
    brandTag: 'Coway (AP-1512HH / AP-1008CH / AP-1009CH)',
    title: 'Đèn chất lượng không khí (AQI) treo Đỏ/Tím liên tục, chế độ Auto chạy hết công suất — Lỗi cảm biến bụi CN_DUST',
    symptom:
      'Phòng sạch sẽ hoặc vừa hút bụi xong nhưng vòng LED AQI luôn sáng màu Đỏ/Tím báo ô nhiễm nặng suốt nhiều giờ; bật chế độ Auto là quạt gào rú tốc độ tối đa không hạ số.',
    postCode: 'AQI Đỏ Mãi',
    severity: 'medium',
    affectedZones: ['zone-coway-air-mcu'],
    suspectComponentIds: ['CN_DUST', 'U_MCU_AIR'],
    affectedRails: ['+5V_MCU', 'DUST_OUT_ADC'],
    rootCauses: [
      'Bụi mịn và lông tơ bám bít thấu kính LED phát/phototransistor thu hồng ngoại bên trong hộp cảm biến bụi hông máy.',
      'Chết điện trở nhiệt sưởi tạo luồng khí đối lưu hoặc quạt nhỏ bên trong hộp cảm biến bụi khiến bụi đọng chết bên trong.',
      'Hỏng mạch khuếch đại/lão hóa tụ hóa nhỏ trên bo cảm biến bụi khiến chân OUT luôn xuất >2.5V dù không có bụi.',
    ],
    quickFixSummary:
      'Mở nắp bảo trì bên hông vệ sinh 2 thấu kính mắt quang bằng tăm bông; đo áp chân 1 VCC (+5V) và chân 3 OUT tại giắc CN_DUST (không khí sạch phải đạt 0.5V–0.9V).',
    steps: [
      {
        id: 'step-coway4-1',
        stepNumber: 1,
        title: 'Đo nguồn nuôi +5V_MCU tại giắc cảm biến bụi CN_DUST',
        instruction:
          'Mở máy đo điện áp DC giữa chân VCC (chân 1) và GND của giắc CN_DUST.',
        targetComponentId: 'CN_DUST',
        targetNetId: '+5V_MCU',
        measureMode: 'voltage',
        expectedValue: '4.85V - 5.15VDC',
        passNextStepId: 'step-coway4-2',
        failDiagnosis: 'Mất nguồn +5V cấp cho cảm biến bụi (đứt dây cáp 4 sợi hoặc đứt cuộn lọc L).',
        failSuspectComponents: ['CN_DUST'],
        repairAction: 'Kiểm tra dây cáp nối và trở/cuộn cảm lọc nguồn cho CN_DUST.',
      },
      {
        id: 'step-coway4-2',
        stepNumber: 2,
        title: 'Đo tín hiệu ngõ ra analog VOUT_ADC tại chân 3 giắc CN_DUST trong phòng sạch',
        instruction:
          'Vệ sinh sạch thấu kính quang, để máy ở nơi không khí sạch 2 phút rồi đo áp DC chân OUT (chân 3) so với GND.',
        targetComponentId: 'CN_DUST',
        targetNetId: 'DUST_OUT_ADC',
        measureMode: 'voltage',
        expectedValue: '0.45V - 0.95VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Đã thổi sạch bụi nhưng áp VOUT vẫn treo cao >2.4V (hoặc sát 4.8V) -> Hỏng LED hồng ngoại, rò tụ điện phân bên trong cụm cảm biến bụi hoặc kẹt bụi sâu trong buồng tối.',
        failSuspectComponents: ['CN_DUST'],
        repairAction:
          'Tháo rã cụm cảm biến bụi kiểm tra tụ lọc SMD & điện trở nhiệt sưởi, hoặc thay cụm Optical Dust Sensor mới rồi chỉnh biến trở VR (nếu có) về ngưỡng ~0.6V lúc không khí sạch.',
      },
    ],
  },

  // Pan 5: Cắm nhầm điện 220V trên Coway bản Mỹ/nội địa 110V-120V
  {
    id: 'coway-fault-005',
    boardId: 'coway-air-ap1512hh',
    category: 'appliance',
    brandTag: 'Coway Bản Mỹ / Nội Địa 110V (AP-1512HH US)',
    title: 'Nổ cầu chì F_AC1 & vỡ tụ chống sét ZNR1 do cắm nhầm điện 220VAC vào máy Coway bản Mỹ 120V',
    symptom:
      'Máy xách tay Mỹ / Hàn / Nhật dùng điện 110V–120V bị cắm thẳng vào ổ 220V Việt Nam gây tiếng nổ tách bên trong, khét mùi nhựa cháy, tối đen không lên nguồn.',
    severity: 'critical_hv',
    affectedZones: ['zone-coway-air-emi', 'zone-coway-air-smps'],
    suspectComponentIds: ['F_AC1', 'ZNR1', 'C_HV310', 'U_SMPS1'],
    affectedRails: ['AC_IN_220V', 'HV_310V_BUS'],
    rootCauses: [
      'Varistor ZNR1 (14D271K chịu áp <175VAC) đánh thủng ngắn mạch khi gặp điện áp 220VAC đỉnh 310V để tự sát cứu mạch, kéo đứt cầu chì F_AC1.',
      'Nếu cầu chì chậm ngắt, xung 310VDC vượt quá mức chịu đựng của tụ lọc chính C_HV310 loại 200V–250V làm phù/xì tụ và chết IC nguồn U_SMPS1.',
    ],
    quickFixSummary:
      'Nhổ bỏ ZNR1 bị nổ vỡ, đo tụ lọc chính C_HV310 (thường tụ 200V/250V trên bản US) và cầu diode/U_SMPS1. Thay đúng Varistor 270V + cầu chì T3.15A (nếu khách vẫn dùng đổi nguồn 110V) và thử qua bóng đèn 60W.',
    steps: [
      {
        id: 'step-coway5-1',
        stepNumber: 1,
        title: 'Đo thông mạch cầu chì đầu vào F_AC1 và quan sát tụ bảo vệ ZNR1',
        instruction:
          'RÚT PHÍCH ĐIỆN. Quan sát bằng mắt thường xem ZNR1 có bị nổ vỡ, ám muội đen không; đo điện trở 2 đầu cầu chì F_AC1.',
        targetComponentId: 'F_AC1',
        targetNetId: 'AC_IN_220V',
        measureMode: 'resistance',
        expectedValue: '0.0Ω - 0.5Ω',
        passNextStepId: 'step-coway5-2',
        failDiagnosis: 'Cầu chì F_AC1 đã đứt (OL) sau khi ZNR1 dẫn dòng ngắn mạch bảo vệ quá áp.',
        failSuspectComponents: ['F_AC1', 'ZNR1'],
        repairAction: 'Nhổ bỏ ZNR1 cháy nổ ra khỏi bo mạch trước khi cấp điện test.',
      },
      {
        id: 'step-coway5-2',
        stepNumber: 2,
        title: 'Kiểm tra chập Varistor ZNR1 và cầu Diode chỉnh lưu',
        instruction:
          'Sau khi nhổ ZNR1, đo thang Diode 2 đầu tụ lọc chính C_HV310 và 4 nhánh cầu diode xem có bị chập 0Ω không.',
        targetComponentId: 'ZNR1',
        targetNetId: 'AC_IN_220V',
        measureMode: 'resistance',
        expectedValue: '100000Ω - 20000000Ω',
        passNextStepId: 'step-coway5-3',
        failDiagnosis: 'Mạch sau ZNR1 bị chập do cầu diode hoặc IC nguồn xung U_SMPS1 chết theo.',
        failSuspectComponents: ['ZNR1', 'U_SMPS1'],
        repairAction: 'Tháo kiểm tra cầu diode chỉnh lưu và nhấc chân D của U_SMPS1 nếu đo thấy chạm.',
      },
      {
        id: 'step-coway5-3',
        stepNumber: 3,
        title: 'Kiểm tra điện áp chịu đựng & độ phồng tụ lọc chính C_HV310',
        instruction:
          'Đọc chỉ số điện áp ghi trên thân tụ C_HV310 (bản 110V thường ghi 200V/250V). Kiểm tra tụ có phù đít, rỉ dung dịch hay sụt dung lượng không.',
        targetComponentId: 'C_HV310',
        targetNetId: 'HV_310V_BUS',
        measureMode: 'resistance',
        expectedValue: '50000Ω - 5000000Ω',
        passNextStepId: 'resolved',
        failDiagnosis: 'Tụ lọc chính 200V bị xì hoặc đánh thủng rò dòng lớn sau sự cố cắm nhầm 220V.',
        failSuspectComponents: ['C_HV310', 'U_SMPS1'],
        repairAction:
          'Thay tụ lọc chính mới, lắp lại Varistor 14D271K + cầu chì, cắm test qua bộ đổi nguồn 110VAC kèm bóng đèn sợi đốt 60W bảo vệ.',
      },
    ],
  },

  // =========================================================================
  // NHÓM 2: MÁY LỌC NƯỚC NÓNG LẠNH RO COWAY (CHP-264L / CHP-18AR / CHP-671R)
  // =========================================================================

  // Pan 6: Mất nguồn toàn máy lọc nước Coway CHP
  {
    id: 'coway-fault-006',
    boardId: 'coway-water-chp264l',
    category: 'appliance',
    brandTag: 'Coway (CHP-264L / CHP-18AR / CHP-671R)',
    title: 'Máy lọc nước Coway mất nguồn toàn bộ (tối hết LED mặt trước) — Nổ IC SMPS U_SMPS_CHP hoặc chập tải 24V',
    symptom:
      'Máy lọc nước Coway Neo Plus / Villaem tắt ngấm hoàn toàn đèn báo Nóng/Lạnh/Mực nước, không có tiếng bơm RO chạy, không lấy được nước bằng nút cảm ứng (dù ổ điện 220VAC vẫn có điện).',
    severity: 'critical_hv',
    affectedZones: ['zone-chp-smps', 'zone-chp-24v-ro'],
    suspectComponentIds: ['F_CHP1', 'U_SMPS_CHP', 'C_24V_OUT'],
    affectedRails: ['AC_220V_CHP', 'HV_310V_CHP', '+24V_RO', '+5V_MICOM'],
    rootCauses: [
      'Đứt cầu chì F_CHP1 và nổ IC nguồn xung U_SMPS_CHP (TOP258 / STR-W6052S) do xung sét điện lưới hoặc kẹt bơm RO kéo quá tải.',
      'Chết chập diode Schottky thứ cấp hoặc tụ lọc nguồn +24V / +12V làm IC SMPS ngắt bảo vệ quá dòng Hiccup.',
      'Cắm nhầm áp hoặc nước tràn từ khay lọc lọt vào hộp mạch gây chạm chập sơ cấp.',
    ],
    quickFixSummary:
      'Rút giắc tải bơm RO CN_PUMP_VALVE và dây bầu nóng/lạnh để test bo độc lập! Kiểm tra cầu chì F_CHP1, đo đủ ~310VDC trên tụ chính, kiểm tra chạm mass đường +24V/+12V/+5V trước khi thay IC U_SMPS_CHP.',
    steps: [
      {
        id: 'step-coway6-1',
        stepNumber: 1,
        title: 'Đo thông mạch cầu chì đầu vào F_CHP1 và kiểm tra thanh đốt không rò vỏ',
        instruction:
          'RÚT PHÍCH ĐIỆN, khóa van nước. Rút giắc bầu đun nóng và Block máy nén để cô lập tải 220V. Đo thông mạch 2 đầu cầu chì F_CHP1.',
        targetComponentId: 'F_CHP1',
        targetNetId: 'AC_220V_CHP',
        measureMode: 'resistance',
        expectedValue: '0.0Ω - 0.5Ω',
        passNextStepId: 'step-coway6-2',
        failDiagnosis: 'Cầu chì F_CHP1 bị đứt hoặc cháy đen do ngắn mạch tầng sơ cấp nguồn xung.',
        failSuspectComponents: ['F_CHP1', 'U_SMPS_CHP'],
        repairAction: 'Kiểm tra Varistor MOV, cầu diode và chân Drain-Source của U_SMPS_CHP trước khi thay cầu chì mới.',
      },
      {
        id: 'step-coway6-2',
        stepNumber: 2,
        title: 'Đo nguội trở kháng các nhánh thứ cấp +24V_RO và +5V_MICOM',
        instruction:
          'Đặt thang Diode (que đen Mass GND_CHP, que đỏ hoặc ngược lại tùy cực diode) kiểm tra đường +24V trên tụ C_24V_OUT xem có chập mass không.',
        targetComponentId: 'C_24V_OUT',
        targetNetId: '+24V_RO',
        measureMode: 'diode',
        expectedValue: '0.35V - 0.65V',
        passNextStepId: 'step-coway6-3',
        failDiagnosis:
          'Đường +24V hoặc +12V bị chập 0.00V xuống mass -> Thủ phạm thường là Diode Schottky nắn thứ cấp bị thủng hoặc tụ C_24V_OUT / IC ULN2003 chập.',
        failSuspectComponents: ['C_24V_OUT', 'U_DRV_ULN'],
        repairAction: 'Cách ly diode nắn thứ cấp +24V và IC U_DRV_ULN để tìm điểm chập trước khi đóng điện.',
      },
      {
        id: 'step-coway6-3',
        stepNumber: 3,
        title: 'Cấp điện test áp ngõ ra tại U_SMPS_CHP qua bóng đèn 60W',
        instruction:
          'Khi các đường thứ cấp không chập, cắm điện qua bóng đèn sợi đốt 60W. Đo áp DC tại chân +24V và nhánh +5V nuôi Micom.',
        targetComponentId: 'U_SMPS_CHP',
        targetNetId: '+24V_RO',
        measureMode: 'voltage',
        expectedValue: '23.0V - 24.8VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Có 310VDC sơ cấp nhưng ngõ ra 24V/12V/5V bằng 0V hoặc nhấp nháy -> Hỏng IC nguồn xung U_SMPS_CHP, đứt điện trở mồi hoặc hỏng opto PC817.',
        failSuspectComponents: ['U_SMPS_CHP', 'C_24V_OUT'],
        repairAction: 'Thay IC U_SMPS_CHP kèm opto hồi tiếp PC817, TL431 và tụ hóa nhỏ cạnh chân VCC IC nguồn.',
      },
    ],
  },

  // Pan 7: Đèn sáng nhưng không bơm lọc nước RO / sụt áp 24V
  {
    id: 'coway-fault-007',
    boardId: 'coway-water-chp264l',
    category: 'appliance',
    brandTag: 'Coway (CHP-264L Neo Plus / CHP-18AR)',
    title: 'Đèn vẫn sáng nhưng không chạy bơm tăng áp RO / không mở van cấp nước — Phù tụ C_24V_OUT hoặc chết ULN2003A',
    symptom:
      'Bảng đèn mặt trước vẫn sáng bình thường, nước ở vòi chảy yếu dần rồi tịt do bình chứa cạn mà không nghe tiếng bơm RO chạy (hoặc mỗi lần máy đóng bơm/van thì đèn LED chớp tắt khởi động lại).',
    severity: 'medium',
    affectedZones: ['zone-chp-24v-ro', 'zone-chp-smps'],
    suspectComponentIds: ['C_24V_OUT', 'U_DRV_ULN', 'CN_PUMP_VALVE'],
    affectedRails: ['+24V_RO', '+12V_RLY'],
    rootCauses: [
      'Tụ hóa lọc nguồn +24V C_24V_OUT (1000µF/35V) bị khô hoặc phù đầu -> Đường 24V bị sụt áp xuống còn <14V ngay khi đóng tải bơm/van.',
      'Chết cổng transistor Darlington tương ứng trong IC đệm U_DRV_ULN (ULN2003A) nên có lệnh 5V từ MCU nhưng không cấp dòng cho van/bơm.',
      'Hỏng cuộn dây van điện từ cấp nước (đứt hoặc chập) hoặc kẹt đầu bơm tăng áp RO.',
    ],
    quickFixSummary:
      'Đo đường +24V_RO ngay lúc máy bắt đầu gọi bơm/van; nếu sụt tụt dưới 20V hãy thay tụ C_24V_OUT 1000µF-2200µF/35V. Nếu +24V vẫn vững, kiểm tra chân IN/OUT của IC ULN2003A và cuộn van từ.',
    steps: [
      {
        id: 'step-coway7-1',
        stepNumber: 1,
        title: 'Đo sụt áp đường +24V_RO trên tụ lọc C_24V_OUT khi đóng tải bơm/van',
        instruction:
          'Đặt que đo DC vào hai chân tụ C_24V_OUT, mở vòi lấy nước hoặc kích trạng thái lọc để bơm/van bắt đầu hoạt động và theo dõi giá trị điện áp.',
        targetComponentId: 'C_24V_OUT',
        targetNetId: '+24V_RO',
        measureMode: 'voltage',
        expectedValue: '23.2V - 24.5VDC',
        passNextStepId: 'step-coway7-2',
        failDiagnosis:
          'Không tải có ~24V nhưng hễ đóng van/bơm là tụt xuống 12V–18V làm nháy đèn -> Tụ C_24V_OUT đã khô/phù mất khả năng giữ dòng, hoặc bơm RO kẹt nặng.',
        failSuspectComponents: ['C_24V_OUT', 'CN_PUMP_VALVE'],
        repairAction: 'Rút giắc bơm RO thử lại với bóng tải 24V; thay mới tụ C_24V_OUT loại 1000µF-2200µF / 35V 105°C.',
      },
      {
        id: 'step-coway7-2',
        stepNumber: 2,
        title: 'Kiểm tra ngõ ra kênh đóng bơm/van trên IC đệm U_DRV_ULN (ULN2003A)',
        instruction:
          'Khi chân IN (bên chân 1-7 của ULN2003) có lệnh +4.5V–5V từ Micom, đo chân OUT tương ứng (chân 10-16) so với GND_CHP.',
        targetComponentId: 'U_DRV_ULN',
        targetNetId: '+24V_RO',
        measureMode: 'voltage',
        expectedValue: '0.4V - 1.2VDC',
        passNextStepId: 'step-coway7-3',
        failDiagnosis:
          'Chân IN đã có lệnh 5V nhưng chân OUT vẫn treo ở 24V không kéo xuống mass -> Kênh Darlington trong ULN2003A bị đứt hỏng.',
        failSuspectComponents: ['U_DRV_ULN'],
        repairAction: 'Thay IC ULN2003AN / ULN2003ADR mới (nhớ kiểm tra cuộn van/relay nối vào chân đó không bị chập trước khi hàn IC mới).',
      },
      {
        id: 'step-coway7-3',
        stepNumber: 3,
        title: 'Đo kiểm tra điện trở cuộn dây van điện từ 24V tại CN_PUMP_VALVE',
        instruction:
          'Rút điện, rút giắc van điện từ Feed Valve / Flush Valve trên CN_PUMP_VALVE và đo điện trở 2 dây cuộn coil.',
        targetComponentId: 'CN_PUMP_VALVE',
        targetNetId: '+24V_RO',
        measureMode: 'resistance',
        expectedValue: '70Ω - 160Ω',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Cuộn van từ báo OL (đứt dây ngầm bên trong) hoặc chỉ còn vài Ohm (chập vòng dây làm cháy ULN2003).',
        failSuspectComponents: ['CN_PUMP_VALVE', 'U_DRV_ULN'],
        repairAction: 'Thay van điện từ RO 24VDC mới.',
      },
    ],
  },

  // Pan 8: Nước không nóng hoặc nháy đèn LED Nóng
  {
    id: 'coway-fault-008',
    boardId: 'coway-water-chp264l',
    category: 'appliance',
    brandTag: 'Coway (CHP-264L / CHP-18AR / CHP-260N)',
    title: 'Nước nóng nguội lạnh hoặc nháy đèn báo lỗi nhiệt Nóng — Nhảy rơ-le Bimetal, cháy Relay RLY_HEATER hoặc lỗi NTC 10kΩ',
    symptom:
      'Bật công tắc Nước Nóng sau lưng máy nhưng đợi 30 phút vòi nóng vẫn chỉ ra nước nguội (hoặc đèn báo Hot trên mặt máy nhấp nháy liên tục khóa chế độ đun).',
    postCode: 'Hot/Cold Blink',
    severity: 'high',
    affectedZones: ['zone-chp-ac-load', 'zone-chp-mcu-sens'],
    suspectComponentIds: ['RLY_HEATER', 'CN_NTC_HOT', 'U_DRV_ULN'],
    affectedRails: ['NTC_HOT_SIG', 'AC_220V_CHP', '+12V_RLY'],
    rootCauses: [
      'Cảm biến nhiệt bầu nóng CN_NTC_HOT (10kΩ @ 25°C) bị đứt dây hoặc rò nước sai trị số làm Micom nháy đèn lỗi Nóng và khóa không đóng Relay.',
      'Nhảy rơ-le nhiệt an toàn Bimetal áp trên vỏ bầu đun nóng (do đun khi chưa xả air/thiếu nước trong bầu nóng hoặc đóng cặn canxi).',
      'Cháy rỗ hoặc hở tiếp điểm COM-NO của Relay công suất RLY_HEATER trên bo mạch (cuộn hút vẫn nhảy tách tách nhưng không ra 220VAC).',
    ],
    quickFixSummary:
      'Kiểm tra trước công tắc Hot Power phía sau máy & nước đã chảy đầy ra vòi nóng chưa; đo cảm biến CN_NTC_HOT (8-12kΩ ở 25°C), kiểm tra rơ-le Bimetal trên bầu đun và tiếp điểm 220VAC của RLY_HEATER.',
    steps: [
      {
        id: 'step-coway8-1',
        stepNumber: 1,
        title: 'Đo nguội điện trở cảm biến nhiệt bầu nóng CN_NTC_HOT',
        instruction:
          'RÚT PHÍCH ĐIỆN. Rút giắc CN_NTC_HOT khỏi bo mạch, đo điện trở 2 chân đầu dò NTC ở nhiệt độ nước nguội (~25°C).',
        targetComponentId: 'CN_NTC_HOT',
        targetNetId: 'NTC_HOT_SIG',
        measureMode: 'resistance',
        expectedValue: '8000Ω - 12500Ω',
        passNextStepId: 'step-coway8-2',
        failDiagnosis:
          'Đầu dò đo ra OL (đứt dây ngầm) hoặc <500Ω lúc nước đang nguội (chập/ngấm nước) -> Bo Micom khóa đun và nháy đèn Hot.',
        failSuspectComponents: ['CN_NTC_HOT'],
        repairAction: 'Thay cảm biến NTC 10kΩ đúng chuẩn (kèm tra keo tản nhiệt vào hốc bầu nóng).',
      },
      {
        id: 'step-coway8-2',
        stepNumber: 2,
        title: 'Kiểm tra điện trở vòng thanh nhiệt bầu nóng nối tiếp rơ-le Bimetal',
        instruction:
          'Rút 2 đầu giắc dây cấp vào thanh đốt bầu nóng. Đo điện trở xuyên qua thanh nhiệt và rơ-le Bimetal bảo vệ gắn trên vỏ bầu đun.',
        targetComponentId: 'CN_NTC_HOT',
        targetNetId: 'AC_220V_CHP',
        measureMode: 'resistance',
        expectedValue: '85Ω - 160Ω',
        passNextStepId: 'step-coway8-3',
        failDiagnosis:
          'Đo 2 cực bầu đun bị OL (hở mạch hoàn toàn): Nhảy rơ-le nhiệt Bimetal chống cạn (nhấn nút Reset nhỏ giữa lưng nếu là loại Manual Reset, hoặc thay Bimetal/đứt dây mayso thanh đốt).',
        failSuspectComponents: ['CN_NTC_HOT', 'RLY_HEATER'],
        repairAction: 'Xả đầy nước ra vòi nóng trước khi nhấn nút Reset Bimetal (hoặc thay rơ-le nhiệt Bimetal 95°C-105°C mới).',
      },
      {
        id: 'step-coway8-3',
        stepNumber: 3,
        title: 'Kiểm tra cuộn hút 12V và tiếp điểm đóng cắt AC của Relay RLY_HEATER',
        instruction:
          'Đảm bảo công tắc Hot sau lưng máy đang BẬT. Đo điện áp DC hai đầu cuộn hút RLY_HEATER xem có đủ 12V không, rồi đo ngõ ra 220VAC từ RLY_HEATER ra thanh đốt.',
        targetComponentId: 'RLY_HEATER',
        targetNetId: '+12V_RLY',
        measureMode: 'voltage',
        expectedValue: '11.2V - 12.6VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Cuộn hút không có 12V dù NTC tốt (hỏng ULN2003 / mất +12V_RLY); hoặc cuộn hút đã có 12V mà ngõ ra thanh đốt không có 220VAC -> Cháy rỗ tiếp điểm Relay RLY_HEATER.',
        failSuspectComponents: ['RLY_HEATER', 'U_DRV_ULN'],
        repairAction: 'Thay thế Relay công suất RLY_HEATER loại 12VDC 16A/250VAC chất lượng cao (ví dụ Omron G2RL).',
      },
    ],
  },

  // Pan 9: Đóng băng đá kín bầu lạnh (hoặc không lạnh) CHP-264L
  {
    id: 'coway-fault-009',
    boardId: 'coway-water-chp264l',
    category: 'appliance',
    brandTag: 'Coway (CHP-264L Neo Plus / CHP-18AR Villaem)',
    title: 'Bầu lạnh đóng băng đông đá làm tắc vòi nước lạnh (hoặc mất lạnh) — Sai trị số CN_NTC_COLD hoặc dính Relay RLY_COMP',
    symptom:
      'Vòi nước lạnh nhỏ giọt rồi tắc tịt không ra nước dù bình chứa vẫn đầy (sờ bầu lạnh thấy đóng cục đá cứng ngắt, Block máy nén chạy suốt không nghỉ); hoặc ngược lại máy nén không chạy khiến nước không mát.',
    postCode: 'Hot/Cold Blink',
    severity: 'high',
    affectedZones: ['zone-chp-mcu-sens', 'zone-chp-ac-load'],
    suspectComponentIds: ['CN_NTC_COLD', 'RLY_COMP', 'U_DRV_ULN'],
    affectedRails: ['NTC_COLD_SIG', 'AC_220V_CHP', '+12V_RLY'],
    rootCauses: [
      'PAN ĐẶC SẢN COWAY: Cảm biến NTC bầu lạnh CN_NTC_COLD bị ngấm hơi nước rò điện, làm điện trở ở 0°C–4°C giảm nhầm xuống ~10kΩ (khiến MCU tưởng nước đang ấm 25°C và ra lệnh cho Block chạy mãi đóng đá bầu lạnh!).',
      'Tiếp điểm Relay máy nén RLY_COMP bị hàn dính chặt (COM-NO luôn 0Ω), cấp 220VAC thẳng cho Block dù MCU đã ngắt lệnh 12V.',
      'Nếu không lạnh: Đứt cảm biến NTC, kẹt trễ hoặc cháy tiếp điểm RLY_COMP, hoặc hỏng tụ/rơ-le khởi động PTC trên thân Block.',
    ],
    quickFixSummary:
      'Rút phích để rã đông tự nhiên! Tháo giắc CN_NTC_COLD ngâm đầu dò vào ly nước đá 0°C đo phải lên được ~28kΩ–33kΩ (nếu chỉ <18kΩ là hỏng NTC gây đóng đá!). Đồng thời đo nguội tiếp điểm COM-NO của RLY_COMP không được dính 0Ω.',
    steps: [
      {
        id: 'step-coway9-1',
        stepNumber: 1,
        title: 'Đo nguội tiếp điểm COM-NO của Relay Block RLY_COMP xem có bị dính không',
        instruction:
          'RÚT PHÍCH ĐIỆN HOÀN TOÀN. Đo thông mạch/điện trở giữa chân COM và chân NO (tiếp điểm thường hở) của Relay RLY_COMP.',
        targetComponentId: 'RLY_COMP',
        targetNetId: 'AC_220V_CHP',
        measureMode: 'resistance',
        expectedValue: '1000000Ω - 20000000Ω',
        passNextStepId: 'step-coway9-2',
        failDiagnosis:
          'Đo ra 0.0Ω thông mạch ngay cả khi đã rút điện -> Tiếp điểm Relay RLY_COMP bị hàn dính chặt, khiến Block máy nén chạy không ngừng đóng đá bầu lạnh!',
        failSuspectComponents: ['RLY_COMP'],
        repairAction: 'Thay Relay RLY_COMP mới (12VDC 10A-16A 250VAC) để mạch ngắt Block hoạt động bình thường.',
      },
      {
        id: 'step-coway9-2',
        stepNumber: 2,
        title: 'Test cảm biến CN_NTC_COLD ở nhiệt độ phòng (~25°C) và trong nước đá (~0°C)',
        instruction:
          'Rút giắc CN_NTC_COLD khỏi bo. Đo ở 25°C phải đạt ~10kΩ; sau đó nhúng đầu dò vào cốc nước đá đang tan (0°C) trong 2 phút và đo lại điện trở.',
        targetComponentId: 'CN_NTC_COLD',
        targetNetId: 'NTC_COLD_SIG',
        measureMode: 'resistance',
        expectedValue: '26000Ω - 34000Ω',
        passNextStepId: 'step-coway9-3',
        failDiagnosis:
          'Nhúng nước đá 0°C mà điện trở chỉ loanh quanh 6kΩ–16kΩ (hoặc nhảy loạn/OL) -> Đầu dò NTC lạnh đã bị ẩm rò sai trị số, đánh lừa MCU chạy Block đóng băng bầu lạnh!',
        failSuspectComponents: ['CN_NTC_COLD'],
        repairAction: 'Thay cảm biến NTC 10kΩ (B=3435K hoặc 3950K chuẩn theo model) loại bọc inox chống thấm tuyệt đối.',
      },
      {
        id: 'step-coway9-3',
        stepNumber: 3,
        title: 'Đo áp chân tín hiệu NTC_COLD_SIG trên bo (nước lạnh 4°C - 8°C)',
        instruction:
          'Cắm lại cảm biến, cấp điện kiểm tra áp ADC tại chân tín hiệu của giắc CN_NTC_COLD và kiểm tra cuộn hút 12V của RLY_COMP (lưu ý Block có trễ bảo vệ 3-5 phút sau khi bật công tắc Cold).',
        targetComponentId: 'RLY_COMP',
        targetNetId: '+12V_RLY',
        measureMode: 'voltage',
        expectedValue: '11.2V - 12.6VDC',
        passNextStepId: 'resolved',
        failDiagnosis: 'NTC chuẩn nhưng quá 5 phút sau khi bật Cold vẫn không có 12V đóng RLY_COMP -> Hỏng ULN2003 hoặc chết cuộn hút RLY_COMP.',
        failSuspectComponents: ['U_DRV_ULN', 'RLY_COMP'],
        repairAction: 'Đo kiểm tra cổng tương ứng trên U_DRV_ULN và cuộn hút ~360Ω của RLY_COMP.',
      },
    ],
  },

  // Pan 10: Báo lỗi tràn nước / ngắt cấp hoặc bơm chạy tràn bình (Phao CN_WATER_LVL)
  {
    id: 'coway-fault-010',
    boardId: 'coway-water-chp264l',
    category: 'appliance',
    brandTag: 'Coway (CHP-264L / CHP-18AR / CHP-671R)',
    title: 'Báo lỗi tràn nước kêu bíp khóa van hoặc bơm RO chạy không ngắt — Lỗi phao từ / cảm biến đáy CN_WATER_LVL',
    symptom:
      'Máy liên tục kêu bíp và nhấp nháy đèn khóa van nước cấp dù sàn khô (nghi báo giả chống tràn), hoặc ngược lại bình tinh khiết đã đầy tràn lên lỗ thoát khí mà bơm tăng áp RO vẫn chạy ầm ầm không chịu ngắt.',
    severity: 'medium',
    affectedZones: ['zone-chp-mcu-sens', 'zone-chp-24v-ro'],
    suspectComponentIds: ['CN_WATER_LVL', 'CN_PUMP_VALVE'],
    affectedRails: ['LEVEL_SW_SIG', '+5V_MICOM'],
    rootCauses: [
      'Đầu dò chống tràn (Leak Sensor) ở đáy khay máy bị rỉ nước từ cút nối nhanh RO hoặc tụ ẩm muối khoáng làm chập 2 thanh tiếp xúc.',
      'Phao từ (Float Reed Switch) trong bình chứa bị cặn canxi hoặc rong rêu làm kẹt nam châm phao, không hạ/lên theo mực nước.',
      'Chuột cắn đứt dây phao hoặc oxy hóa giắc CN_WATER_LVL bên hông bình chứa.',
    ],
    quickFixSummary:
      'Kiểm tra và lau khô hoàn toàn khay đáy + vệ sinh thanh cảm biến rò nước Leak Sensor; đo chuyển mạch 0Ω <-> OL của phao từ trên nắp bình chứa tại CN_WATER_LVL.',
    steps: [
      {
        id: 'step-coway10-1',
        stepNumber: 1,
        title: 'Đo điện áp chân LEAK (chống tràn đáy máy) tại giắc CN_WATER_LVL',
        instruction:
          'Mở nắp hông máy quan sát khay đáy xem có rỉ nước không. Đo điện áp DC chân cảm biến chống tràn LEAK trên bo mạch so với GND_CHP.',
        targetComponentId: 'CN_WATER_LVL',
        targetNetId: 'LEVEL_SW_SIG',
        measureMode: 'voltage',
        expectedValue: '4.6V - 5.1VDC',
        passNextStepId: 'step-coway10-2',
        failDiagnosis:
          'Áp chân LEAK bị tụt xuống dưới 2.5V dù khay đáy chỉ hơi ẩm -> 2 cực cảm biến rò nước đang dẫn điện kích hoạt khóa van an toàn!',
        failSuspectComponents: ['CN_WATER_LVL'],
        repairAction: 'Tìm chỗ rỉ nước ở cút nối lõi lọc RO, lau khô đáy máy và đánh sạch gỉ sét/muối trên miếng đồng Leak Sensor.',
      },
      {
        id: 'step-coway10-2',
        stepNumber: 2,
        title: 'Kiểm tra đóng/ngắt phao từ mực nước cao trong bình chứa',
        instruction:
          'Rút điện, rút giắc phao mực nước trên CN_WATER_LVL. Dùng tay nhấc nhẹ cục phao trong bình lên vị trí đầy rồi thả xuống, đo điện trở thông mạch 2 đầu dây phao.',
        targetComponentId: 'CN_WATER_LVL',
        targetNetId: 'LEVEL_SW_SIG',
        measureMode: 'resistance',
        expectedValue: '0.0Ω - 2.0Ω',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Nhấc/thả phao mà đồng hồ luôn giữ chết một trạng thái (luôn OL hoặc luôn 0Ω không đổi) -> Kẹt cơ phao từ hoặc chết bóng thủy tinh Reed Switch trong ống phao.',
        failSuspectComponents: ['CN_WATER_LVL'],
        repairAction: 'Tháo cụm phao nắp bình chứa ngâm rửa cặn canxi; thay mới ống phao cảm biến mực nước nếu Reed Switch kẹt hỏng.',
      },
    ],
  },

  // =========================================================================
  // NHÓM 3: NẮP BỒN CẦU THÔNG MINH COWAY BIDET (BA-07 / BA-13 / BAS22-A)
  // =========================================================================

  // Pan 11: Nước rửa không ấm hoặc quá nhiệt (Triac BTA16 & Zero-Cross Opto)
  {
    id: 'coway-fault-011',
    boardId: 'coway-bidet-ba13',
    category: 'appliance',
    brandTag: 'Coway Bidet (BA-07 / BA-13 / BAS22-A)',
    title: 'Nước rửa Bidet lạnh ngắt hoặc đun quá nhiệt nháy đèn lỗi — Hỏng Triac BTA16 (Q_TRIAC_WTR) hoặc Opto Zero-Cross',
    symptom:
      'Vòi phun nước bình thường nhưng nước rửa lạnh buốt dù đã chỉnh mức nhiệt cao nhất (hoặc ngược lại nước nóng bỏng rát rồi đèn nguồn nhấp nháy, nhảy ELCB/đứt cầu chì nhiệt bầu đun).',
    severity: 'critical_hv',
    affectedZones: ['zone-bidet-triac', 'zone-bidet-power'],
    suspectComponentIds: ['Q_TRIAC_WTR', 'U_ZC_OPTO', 'CN_WTR_NTC', 'F_BIDET1'],
    affectedRails: ['AC_220V_BIDET', 'ZC_SYNC_PULSE', '+5V_BIDET_MCU'],
    rootCauses: [
      'Chập mối nối MT1-MT2 của Triac BTA16-600B (Q_TRIAC_WTR) làm thanh nhiệt đun sôi liên tục không ngắt -> Nhảy cầu chì nhiệt F_BIDET1.',
      'Chết Opto-Triac MOC3063 hoặc hỏng Opto dò điểm 0 Zero-Cross U_ZC_OPTO (PC814) -> MCU mất xung đồng bộ 100Hz nên khóa không mở Triac (nước lạnh hoàn toàn).',
      'Kẹt công tắc phao bầu đun hoặc sai trị số cảm biến nhiệt nước CN_WTR_NTC.',
    ],
    quickFixSummary:
      'CẢNH BÁO RÒ ĐIỆN: Thử qua ELCB chống giật! Kiểm tra nguội thanh nhiệt & cầu chì nhiệt bầu đun, đo chập MT1-MT2 của Triac Q_TRIAC_WTR (nhớ thay đúng BTA lưng cách điện!), kiểm tra xung 100Hz tại U_ZC_OPTO.',
    steps: [
      {
        id: 'step-coway11-1',
        stepNumber: 1,
        title: 'Đo kiểm tra chập Triac đun nước Q_TRIAC_WTR (MT1 - MT2)',
        instruction:
          'RÚT PHÍCH ĐIỆN. Cạo nhẹ lớp keo bảo vệ tại 3 chân Triac BTA16-600B. Đo thang trở kháng giữa chân 1 (MT1) và chân 2 (MT2).',
        targetComponentId: 'Q_TRIAC_WTR',
        targetNetId: 'AC_220V_BIDET',
        measureMode: 'resistance',
        expectedValue: '1000000Ω - 20000000Ω',
        passNextStepId: 'step-coway11-2',
        failDiagnosis:
          'MT1 và MT2 thông mạch 0Ω–20Ω -> Triac Q_TRIAC_WTR bị đánh thủng ngắn mạch gây đun nước quá nhiệt liên tục.',
        failSuspectComponents: ['Q_TRIAC_WTR', 'F_BIDET1'],
        repairAction:
          'Thay thế đúng mã Triac cách ly lưng BTA16-600B (tuyệt đối KHÔNG dùng BTB16) kèm kiểm tra Opto-Triac MOC3063.',
      },
      {
        id: 'step-coway11-2',
        stepNumber: 2,
        title: 'Đo thanh nhiệt bầu đun và cầu chì nhiệt nối tiếp trên dây tải',
        instruction:
          'Rút 2 giắc dây to cắm từ bo mạch ra bầu đun nước nóng, đo điện trở qua thanh đốt và cầu chì nhiệt 135°C.',
        targetComponentId: 'F_BIDET1',
        targetNetId: 'AC_220V_BIDET',
        measureMode: 'resistance',
        expectedValue: '30Ω - 65Ω',
        passNextStepId: 'step-coway11-3',
        failDiagnosis: 'Đo ra OL -> Đứt cầu chì nhiệt Thermal Fuse gắn thành bầu đun hoặc cháy đứt thanh đốt.',
        failSuspectComponents: ['F_BIDET1'],
        repairAction: 'Thay đúng cầu chì nhiệt Thermal Fuse mới kẹp chặt vào thành bầu đun.',
      },
      {
        id: 'step-coway11-3',
        stepNumber: 3,
        title: 'Kiểm tra tín hiệu đồng bộ Zero-Cross 100Hz tại chân 4 của U_ZC_OPTO',
        instruction:
          'Cắm điện qua ổ ELCB an toàn. Đo điện áp DC trung bình (hoặc xung 100Hz bằng Oscilloscope) tại chân 4 của Opto PC814 so với GND_BIDET.',
        targetComponentId: 'U_ZC_OPTO',
        targetNetId: 'ZC_SYNC_PULSE',
        measureMode: 'voltage',
        expectedValue: '2.2V - 4.5VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Chân 4 treo cứng ở 5.0V hoặc 0V không có xung 100Hz -> Đứt điện trở mồi 47kΩ-100kΩ từ AC 220V hoặc chết Opto U_ZC_OPTO khiến MCU khóa hoàn toàn Triac đun nước.',
        failSuspectComponents: ['U_ZC_OPTO'],
        repairAction: 'Kiểm tra 2 điện trở hạn dòng AC ngõ vào và thay mới Opto hai chiều PC814 / LTV-814.',
      },
    ],
  },

  // Pan 12: Không thò vòi / liệt phím / hỏng cảm biến ngồi & ăn mòn keo potting
  {
    id: 'coway-fault-012',
    boardId: 'coway-bidet-ba13',
    category: 'appliance',
    brandTag: 'Coway Bidet (BA-07 / BA-13 / BAS22-A)',
    title: 'Vòi rửa không thò ra khi bấm nút hoặc liệt phím hông — Lỗi Seat Sensor bản lề, ULN2003 hoặc ẩm mục mạch keo',
    symptom:
      'Ngồi lên nắp và nhấn nút Wash/Bidet nhưng vòi rửa đứng im không thò ra phun nước (hoặc nhấn phím lúc ăn lúc không, sưởi bệ mất tác dụng sau nhiều năm dùng trong nhà tắm ẩm).',
    severity: 'medium',
    affectedZones: ['zone-bidet-nozzle', 'zone-bidet-sensors'],
    suspectComponentIds: ['CN_SEAT_KEY', 'U_STEP_DRV', 'CN_NOZZLE_VALVE'],
    affectedRails: ['SEAT_OCCUPIED', '+12V_ACTUATOR', '+5V_BIDET_MCU'],
    rootCauses: [
      'Đứt ngầm sợi dây đồng cảm biến người ngồi Seat Sensor (hoặc dây sưởi bệ ngồi) tại cổ trục bản lề do đóng/mở nắp hàng nghìn lần -> MCU hiểu nhầm không có người ngồi nên khóa chức năng rửa.',
      'Hơi ẩm nhà tắm ngấm qua khe nứt lớp keo đổ Urethane gây oxy hóa đứt mạch chân IC lái motor bước U_STEP_DRV (ULN2003ADR) hoặc oxy hóa nút bấm bảng phím.',
      'Đứt một cuộn pha trong motor bước 5 dây đẩy vòi rửa hoặc kẹt cứng cặn canxi cơ khí.',
    ],
    quickFixSummary:
      'Kiểm tra trạng thái chuyển áp SEAT_OCCUPIED (5V -> 0V) khi ngồi/đè tay lên bệ; đo điện trở 4 cuộn dây motor bước (45Ω–120Ω) tại CN_NOZZLE_VALVE và cạo keo kiểm tra ẩm mốc quanh IC U_STEP_DRV.',
    steps: [
      {
        id: 'step-coway12-1',
        stepNumber: 1,
        title: 'Kiểm tra tín hiệu cảm biến người ngồi SEAT_OCCUPIED tại giắc CN_SEAT_KEY',
        instruction:
          'Cắm điện, đặt đồng hồ DC đo chân tín hiệu Seat Sensor trên giắc CN_SEAT_KEY. Quan sát mức áp lúc bệ trống và lúc dùng tay đè chặt lên vùng cảm biến trên nắp ngồi.',
        targetComponentId: 'CN_SEAT_KEY',
        targetNetId: 'SEAT_OCCUPIED',
        measureMode: 'voltage',
        expectedValue: '0.0V - 0.5VDC',
        passNextStepId: 'step-coway12-2',
        failDiagnosis:
          'Dù đã đè tay lên bệ ngồi nhưng chân SEAT_OCCUPIED vẫn treo ở ~5.0V (không chuyển trạng thái) -> Đứt dây cảm biến ngồi ở khớp bản lề bệ hoặc hỏng công tắc/sensor bệ.',
        failSuspectComponents: ['CN_SEAT_KEY'],
        repairAction: 'Tháo trục bản lề bệ ngồi nối lại dây cảm biến bị gập đứt bằng dây silicon mềm dẻo và bọc ống gen co nhiệt kín nước.',
      },
      {
        id: 'step-coway12-2',
        stepNumber: 2,
        title: 'Kiểm tra nguồn +12V_ACTUATOR và 4 cuộn dây motor bước CN_NOZZLE_VALVE',
        instruction:
          'Rút điện, rút giắc motor bước 5 dây của vòi rửa. Đo điện trở từ dây chung (+) sang lần lượt 4 dây pha còn lại.',
        targetComponentId: 'CN_NOZZLE_VALVE',
        targetNetId: '+12V_ACTUATOR',
        measureMode: 'resistance',
        expectedValue: '45Ω - 120Ω',
        passNextStepId: 'step-coway12-3',
        failDiagnosis: 'Một hoặc nhiều cuộn pha motor bước báo OL (đứt dây ngầm hoặc cháy cuộn) -> Motor vòi chỉ rung không thò ra được.',
        failSuspectComponents: ['CN_NOZZLE_VALVE'],
        repairAction: 'Thay motor bước cụm vòi rửa hoặc sửa đứt dây gần giắc.',
      },
      {
        id: 'step-coway12-3',
        stepNumber: 3,
        title: 'Kiểm tra ăn mòn mạch & ngõ ra IC lái ULN2003ADR (U_STEP_DRV)',
        instruction:
          'Quan sát dưới kính lúp khu vực chân IC U_STEP_DRV và bảng phím bên hông xem có vết mốc xanh/trắng do ẩm ngấm dưới lớp keo không. Đo áp +12V ở chân 9 (COM) của U_STEP_DRV.',
        targetComponentId: 'U_STEP_DRV',
        targetNetId: '+12V_ACTUATOR',
        measureMode: 'voltage',
        expectedValue: '11.4V - 12.6VDC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Mất +12V tại chân COM của ULN2003 hoặc chân mạch bị mục đứt đồng do ngấm ẩm.',
        failSuspectComponents: ['U_STEP_DRV', 'CN_SEAT_KEY'],
        repairAction: 'Bóc nhẹ keo vùng mốc ẩm, rửa cồn IPA 99%, câu lại mạch đứt, thay ULN2003ADR / phím bấm mới và phủ lại keo chống ẩm Silicone conformal coating.',
      },
    ],
  },
];
