import { FaultCase } from '../../types/circuit';

/**
 * MOTHERBOARD_FAULTS - Tuyển tập 12 pan bệnh thực chiến chuyên sâu trên Bo mạch chủ (Motherboard PC)
 * Đồng bộ chính xác 100% với các định danh zone.id, rail.id, component.id của từng bo mạch trong DESKTOP_MOTHERBOARDS:
 * - 'asus-rog-b760f' (ASUS ROG Strix B760-F Gaming WiFi)
 * - 'gigabyte-b660m-ds3h' (Gigabyte B660M DS3H DDR4)
 * - 'msi-b550-tomahawk' (MSI MAG B550 Tomahawk)
 * - 'asrock-h81m-dgs' (ASRock H81M-DGS)
 */
export const MOTHERBOARD_FAULTS: FaultCase[] = [
  // =========================================================================
  // PAN 1: Chạm chập nguồn 12V VRM CPU
  // =========================================================================
  {
    id: 'mb-fault-01-vrm-short-12v',
    boardId: 'asus-rog-b760f',
    category: 'motherboard',
    brandTag: 'ASUS',
    title: 'Chạm chập đường nguồn 12V VRM CPU (Kích nguồn quạt nhích rồi ngắt bảo vệ)',
    symptom:
      'Kích nguồn quạt CPU chỉ nhích nhẹ 1 góc nhỏ (khoảng 0.5 giây) rồi lịm tắt hoàn toàn, bộ nguồn ATX lập tức ngắt rơ-le bảo vệ OCP/SCP. Rút cổng nguồn phụ EPS 8-pin 12V CPU ra kích thì quạt quay liên tục nhưng mainboard không lên hình.',
    postCode: 'No Power / OCP',
    severity: 'high',
    affectedZones: ['zone-vrm-vcore', 'zone-cpu-socket'],
    suspectComponentIds: ['PQ101', 'PQ102', 'PC101', 'PU101', 'JEPS8'],
    affectedRails: ['rail-12v-eps', 'rail-vccin-core', 'rail-gnd'],
    rootCauses: [
      'MOSFET vế trên (High-side DrMOS ISL99390 PQ101) bị đánh thủng nối tắt Drain - Source, dẫn thẳng điện áp 12V_EPS xuống cuộn cảm pha.',
      'Tụ lọc gốm nhiều lớp (MLCC) PC101 nằm sát lưng socket CPU bị sốc áp hoặc nứt nhiệt làm chập thẳng đường 12V_EPS xuống Mass.',
      'IC điều khiển PWM PU101 hỏng khối Driver tích hợp làm xông áp kích mở liên tục cả 2 vế MOSFET gây hiện tượng Shoot-Through làm nổ linh kiện.'
    ],
    quickFixSummary:
      'Đo thang Diode tại giắc EPS 8-pin về GND thấy thông mạch (~0.001V). Tháo tản nhiệt VRM, kẹp dòng 1.2V / 3A vào đường 12V để bắt nhiệt linh kiện bốc khói hoặc đo từng cặp D-S của DrMOS/MOSFET High-side; thay thế DrMOS lỗi và tụ lọc.',
    steps: [
      {
        id: 'mb-01-step-1',
        stepNumber: 1,
        title: 'Đo kiểm tra tổng trở giắc cắm nguồn phụ EPS 8-pin (JEPS8)',
        instruction:
          'Rút dây nguồn ATX ra khỏi mainboard. Bật đồng hồ vạn năng về thang đo Diode / Thông mạch (hoặc thang Ω). Đặt que đỏ vào Mass (khung sắt cổng I/O hoặc ốc bắt main), que đen chạm lần lượt vào 4 chân mang cực dương 12V của giắc EPS 8-pin JEPS8.',
        targetComponentId: 'JEPS8',
        targetNetId: 'rail-12v-eps',
        measureMode: 'diode',
        expectedValue: '> 0.450V (hoặc > 1kΩ ở thang đo điện trở)',
        passNextStepId: 'mb-01-step-2',
        failDiagnosis:
          'Đồng hồ kêu bíp liên tục, giá trị diode hiển thị 0.000V - 0.004V (gần như 0 Ohm). Đường nguồn 12V_EPS cấp cho dàn VRM CPU đã bị chập thẳng xuống Mass (GND).',
        failSuspectComponents: ['PQ101', 'PQ102', 'PC101'],
        repairAction:
          'Dừng ngay việc cố gắng cắm nguồn kích ép. Cách ly giắc EPS 8-pin và chuẩn bị tháo toàn bộ tản nhiệt nhôm khối VRM để kiểm tra từng pha nguồn.'
      },
      {
        id: 'mb-01-step-2',
        stepNumber: 2,
        title: 'Xác định pha nguồn VRM bị chập bằng phương pháp đo trở kháng chân Drain-Source',
        instruction:
          'Tháo cụm tản nhiệt VRM. Đặt thang đo Diode, đo giữa chân Drain (nối 12V) và chân Source (hoặc Phase Pin nối với cuộn cảm PL101) của từng con DrMOS/MOSFET High-side PQ101, PQ102.',
        targetComponentId: 'PQ101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'diode',
        expectedValue: '0.420V - 0.550V (chiều thuận diode nội)',
        passNextStepId: 'mb-01-step-3',
        failDiagnosis:
          'Phát hiện DrMOS/MOSFET PQ101 tại pha 1 có điện trở D-S bằng 0.001V ở cả hai chiều que đo. Con MOSFET này đã bị đánh thủng hoàn toàn tiếp giáp bán dẫn.',
        failSuspectComponents: ['PQ101'],
        repairAction:
          'Bôi mỡ trợ hàn (Flux), dùng máy khò nhiệt độ 380°C kết hợp mỏ hàn nhiệt công suất cao để gắp bỏ DrMOS / MOSFET PQ101 ra khỏi bo mạch.'
      },
      {
        id: 'mb-01-step-3',
        stepNumber: 3,
        title: 'Đo lại trở kháng đường 12V_EPS sau khi đã gỡ bỏ linh kiện nghi ngờ',
        instruction:
          'Chờ bo mạch nguội xuống nhiệt độ phòng. Dùng đồng hồ đo lại thang Diode tại giắc EPS 8-pin JEPS8 về Mass.',
        targetComponentId: 'JEPS8',
        targetNetId: 'rail-12v-eps',
        measureMode: 'diode',
        expectedValue: '0.450V - 0.550V (Hết chập)',
        passNextStepId: 'mb-01-step-4',
        failDiagnosis:
          'Đường 12V vẫn tiếp tục báo chập (0.002V). Điều này chứng minh vẫn còn tụ gốm MLCC PC101 mắc song song bị thủng hoặc thêm 1 con DrMOS khác bị chập kéo theo.',
        failSuspectComponents: ['PC101', 'PU101'],
        repairAction:
          'Dùng máy cấp nguồn kẹp dòng 1.2V giới hạn dòng 3A vào đường 12V_EPS, quét cồn Isopropyl Alcohol (IPA) lên dàn tụ lọc PC101 để quan sát tụ nào sôi cồn bốc hơi đầu tiên, sau đó gỡ bỏ.'
      },
      {
        id: 'mb-01-step-4',
        stepNumber: 4,
        title: 'Hàn linh kiện mới chuẩn thông số và kiểm tra điện áp VCCIN_CORE xuất ra',
        instruction:
          'Vệ sinh sạch pad chì, hàn linh kiện mới (DrMOS SiC639 hoặc ISL99390 đúng chiều pin 1). Lắp CPU tải giả hoặc gắn CPU kiểm tra, cắm nguồn và đo điện áp tại đầu cuộn cảm PL101.',
        targetComponentId: 'PL101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'voltage',
        expectedValue: '1.05V - 1.25V DC',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Pha nguồn không sinh áp hoặc áp vọt cao bất thường do IC điều khiển PWM PU101 bị hỏng chân điều khiển Gate Drive.',
        failSuspectComponents: ['PU101'],
        repairAction:
          'Kiểm tra và thay thế IC dao động đa pha PWM PU101. Sau khi đủ áp VCCIN, lắp tản nhiệt cẩn thận và test tải nặng.'
      }
    ]
  },

  // =========================================================================
  // PAN 2: Mất nguồn cấp trước Standby (Gigabyte B660M DS3H)
  // =========================================================================
  {
    id: 'mb-fault-02-standby-3valw-5valw-dead',
    boardId: 'gigabyte-b660m-ds3h',
    category: 'motherboard',
    brandTag: 'Gigabyte',
    title: 'Mất nguồn cấp trước Standby (Bo mạch Gigabyte mất hoàn toàn phản ứng kích nguồn)',
    symptom:
      'Cắm dây nguồn ATX 24-pin, đèn LED báo nguồn chờ trên bo mạch không sáng. Bấm nút kích nguồn (Power Switch) hoàn toàn không có phản ứng, quạt không nhích. Đo tại chân Power Switch (PW_SW) chỉ có 0V (hoặc < 0.5V) thay vì 3.3V chuẩn.',
    postCode: 'No Power / Dead',
    severity: 'high',
    affectedZones: ['zone-sio-ite', 'zone-pch-b660'],
    suspectComponentIds: ['JATX24', 'U_SIO', 'Q_RSMRST', 'PCH1'],
    affectedRails: ['rail-5vsb-gb', 'rail-rsmrst-gb', 'rail-gnd-gb'],
    rootCauses: [
      'Chập tải ngậm sau đường nguồn cấp trước: Chip Super I/O (U_SIO ITE IT8686E) bị ăn dòng, chết chập nội bộ kéo sụt toàn bộ nguồn cấp trước.',
      'Transistor bảo vệ đường Standby hoặc trở cầu chì đường 5VSB từ giắc JATX24 bị đứt hở mạch.',
      'Chip cầu nam PCH1 bị chập đường nguồn nuôi Standby nội bộ (VCCDSW3_3).'
    ],
    quickFixSummary:
      'Kiểm tra điện áp 5VSB tại chân 9 giắc JATX24 (đạt 5.0V). Đo thang Diode chân nguồn cấp trước của U_SIO về Mass; nếu chập 0.005V tiến hành cách ly hoặc thay thế chip Super I/O U_SIO.',
    steps: [
      {
        id: 'mb-02-step-1',
        stepNumber: 1,
        title: 'Kiểm tra điện áp cấp nguồn chờ 5VSB từ bộ nguồn vào bo mạch',
        instruction:
          'Cắm dây nguồn ATX 24-pin. Đặt đồng hồ thang đo DC Volt. Đặt que đen ở Mass, que đỏ đo vào chân số 9 (Dây màu tím - 5VSB) trên giắc cắm JATX24.',
        targetComponentId: 'JATX24',
        targetNetId: 'rail-5vsb-gb',
        measureMode: 'voltage',
        expectedValue: '5.0V - 5.15V DC',
        passNextStepId: 'mb-02-step-2',
        failDiagnosis:
          'Điện áp 5VSB bị sụt xuống dưới 4.0V hoặc bằng 0V. Bộ nguồn ATX bị sụt nguồn phụ hoặc đường 5VSB trên bo mạch bị chập tải nặng.',
        failSuspectComponents: ['JATX24', 'U_SIO'],
        repairAction:
          'Thử đổi bộ nguồn ATX test khác. Nếu vẫn sụt áp, dùng thang Diode đo đường 5VSB trên bo mạch xem có chập tụ bảo vệ ESD ngõ vào hay không.'
      },
      {
        id: 'mb-02-step-2',
        stepNumber: 2,
        title: 'Đo điện áp chân nuôi Standby cấp vào Super I/O U_SIO',
        instruction:
          'Đo điện áp DC tại chân nguồn Standby (VCC3_SB) của chip Super I/O U_SIO (ITE IT8686E).',
        targetComponentId: 'U_SIO',
        targetNetId: 'rail-5vsb-gb',
        measureMode: 'voltage',
        expectedValue: '3.3V ± 0.1V DC',
        passNextStepId: 'mb-02-step-3',
        failDiagnosis:
          'Mất hoàn toàn điện áp cấp vào U_SIO (đo được 0V hoặc sụt còn 0.7V). Đường nguồn nuôi chip SIO bị chập tải hoặc hở mạch trở đệm.',
        failSuspectComponents: ['U_SIO', 'PCH1'],
        repairAction:
          'Rút nguồn điện AC. Chuyển đồng hồ sang thang đo Diode để kiểm tra độ sụt áp chân nguồn U_SIO về Mass.'
      },
      {
        id: 'mb-02-step-3',
        stepNumber: 3,
        title: 'Xác định chập chip Super I/O bằng thang Diode',
        instruction:
          'Đo thang Diode giữa chân nguồn Standby của U_SIO với Mass.',
        targetComponentId: 'U_SIO',
        targetNetId: 'rail-gnd-gb',
        measureMode: 'diode',
        expectedValue: '0.350V - 0.500V',
        passNextStepId: 'mb-02-step-4',
        failDiagnosis:
          'Đồng hồ đo được 0.005V (chập Mass). Sờ tay lên lưng chip Super I/O (IT8686E) thấy ấm/nóng ran dù chưa bật máy.',
        failSuspectComponents: ['U_SIO'],
        repairAction:
          'Dùng mỏ khò nhấc chip Super I/O U_SIO ra khỏi bo mạch, đo lại tổng trở đường nguồn xem đã dâng trở kháng lên chuẩn hay chưa.'
      },
      {
        id: 'mb-02-step-4',
        stepNumber: 4,
        title: 'Hàn chip Super I/O U_SIO mới và đo lại áp chân kích nguồn',
        instruction:
          'Hàn chip Super I/O mới IT8686E. Cắm nguồn và đo điện áp tại chân Front Panel Power-SW.',
        targetComponentId: 'U_SIO',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: '3.3V DC tại chân kích nguồn PW_SW',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Vẫn mất điện áp chân kích nguồn do đứt trở treo áp Pull-up 10kΩ hoặc transistor Q_RSMRST bị rò rỉ.',
        failSuspectComponents: ['Q_RSMRST', 'U_SIO'],
        repairAction:
          'Dò lại đường mạch từ chân Front Panel Power Switch về chip Super I/O, kiểm tra transistor Q_RSMRST.'
      }
    ]
  },

  // =========================================================================
  // PAN 3: Mất lệnh RSMRST# từ Super I/O lên PCH (Bệnh kinh điển Gigabyte)
  // =========================================================================
  {
    id: 'mb-fault-03-rsmrst-missing-gigabyte-asus',
    boardId: 'gigabyte-b660m-ds3h',
    category: 'motherboard',
    brandTag: 'Gigabyte',
    title: 'Mất tín hiệu Reset nguồn phụ RSMRST# (Super I/O không báo cho PCH cho phép kích nguồn)',
    symptom:
      'Bo mạch cắm nguồn có đủ nguồn phụ, đèn LED trang trí sáng. Chân Power-ON có 3.3V chuẩn, chạm chập chân kích nguồn thì điện áp tụt xuống 0V nhưng buông tay ra quạt vẫn đứng im không quay, chân lệnh mở nguồn không chịu kéo kích mở nguồn chính.',
    postCode: 'No Trigger',
    severity: 'medium',
    affectedZones: ['zone-sio-ite', 'zone-pch-b660'],
    suspectComponentIds: ['Q_RSMRST', 'U_SIO', 'PCH1', 'U_BIOS'],
    affectedRails: ['rail-5vsb-gb', 'rail-rsmrst-gb', 'rail-gnd-gb'],
    rootCauses: [
      'Transistor dập mass 3 chân Q_RSMRST (mạch bảo vệ cảm biến nhiệt/quá áp trên Gigabyte) bị rò rỉ chân C-E kéo tuột áp RSMRST# xuống dưới 0.8V (chuẩn phải là 3.3V).',
      'Chip Super I/O (ITE IT8686E) bị lỗi logic nội, nhận được lệnh kích PWRBTN# từ người dùng nhưng không xuất lệnh RSMRST# sang Chipset PCH.',
      'Trở kéo treo áp đường RSMRST# bị mục chân hoặc tăng trị số do ẩm mốc môi trường.'
    ],
    quickFixSummary:
      'Đo điện áp tại chân tín hiệu RSMRST# gửi vào chip cầu nam PCH (hoặc chân C của transistor Q_RSMRST). Nếu thấy điện áp lơ lửng 0.5V - 1.2V thay vì 3.3V, tiến hành gắp bỏ transistor Q_RSMRST; nếu vẫn mất áp, kiểm tra trở treo 3.3V hoặc thay chip Super I/O U_SIO.',
    steps: [
      {
        id: 'mb-03-step-1',
        stepNumber: 1,
        title: 'Kiểm tra tín hiệu chân kích nguồn PWRBTN# vào chip Super I/O',
        instruction:
          'Cắm nguồn ATX. Đặt đồng hồ thang DC Volt đo chân Front Panel Power-SW hoặc chân kích nguồn tương ứng trên chip Super I/O U_SIO. Quan sát mức áp khi nhả nút và khi ấn giữ nút kích nguồn.',
        targetComponentId: 'U_SIO',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: 'Khi nhả: 3.3V; Khi chập kích nguồn: 0V',
        passNextStepId: 'mb-03-step-2',
        failDiagnosis:
          'Chân kích nguồn không đạt 3.3V hoặc chập kích nguồn nhưng điện áp không hạ về 0V (do đứt đường mạch hoặc chập tụ gốm chống dội phím).',
        failSuspectComponents: ['U_SIO'],
        repairAction:
          'Kiểm tra tụ gốm chống dội phím mắc song song với nút kích nguồn, thay thế nếu bị rò.'
      },
      {
        id: 'mb-03-step-2',
        stepNumber: 2,
        title: 'Đo điện áp tín hiệu Resume Reset (RSMRST#) cấp cho PCH',
        instruction:
          'Đo điện áp DC tại chân cực C của transistor bảo vệ Q_RSMRST hoặc chân xuất lệnh RSMRST# của chip Super I/O đi sang Chipset PCH1.',
        targetComponentId: 'Q_RSMRST',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: '3.3V DC (mức logic High)',
        passNextStepId: 'mb-03-step-3',
        failDiagnosis:
          'Tín hiệu RSMRST# chỉ đo được 0V hoặc 0.6V - 1.1V. Chipset PCH hiểu rằng nguồn phụ đang lỗi nên khóa chặt chế độ Sleep S3/S4/S5, từ chối phát lệnh kích nguồn.',
        failSuspectComponents: ['Q_RSMRST', 'U_SIO'],
        repairAction:
          'Dùng mỏ hàn nhấc bỏ tạm thời transistor dập mass Q_RSMRST ra khỏi bo mạch, sau đó đo lại điện áp tại pad cực C.'
      },
      {
        id: 'mb-03-step-3',
        stepNumber: 3,
        title: 'Kiểm tra phản hồi lệnh đánh thức từ Chipset PCH sau khi phục hồi RSMRST#',
        instruction:
          'Sau khi phục hồi đường RSMRST# đạt 3.3V, kích nguồn và đo phản hồi từ PCH1 sang Super I/O U_SIO.',
        targetComponentId: 'PCH1',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: 'Bình thường: 0V; Khi kích nguồn: Nhảy lên 3.3V',
        passNextStepId: 'mb-03-step-4',
        failDiagnosis:
          'RSMRST# đã có 3.3V nhưng khi bấm kích nguồn PCH1 vẫn trơ trơ không chịu xuất lệnh kích nguồn.',
        failSuspectComponents: ['PCH1', 'U_BIOS'],
        repairAction:
          'Nạp lại file BIOS gốc sạch (Clear ME) vì PCH cần giao tiếp SPI với BIOS để load cấu hình quản lý nguồn.'
      },
      {
        id: 'mb-03-step-4',
        stepNumber: 4,
        title: 'Kiểm tra lệnh kéo mass chân kích mở nguồn chính PS_ON# trên giắc JATX24',
        instruction:
          'Đo chân số 16 (Dây xanh lá - PS_ON#) trên giắc JATX24 khi kích nguồn.',
        targetComponentId: 'JATX24',
        targetNetId: 'rail-5vsb-gb',
        measureMode: 'voltage',
        expectedValue: 'Hạ từ ~4.5V xuống 0.0V DC (kéo mass)',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Super I/O không chịu kéo chân PS_ON# xuống mass do hỏng tầng ngõ ra Open-Drain của chip Super I/O.',
        failSuspectComponents: ['U_SIO'],
        repairAction:
          'Thay thế chip Super I/O U_SIO (ITE IT8686E) bằng chip cùng mã tương đương.'
      }
    ]
  },

  // =========================================================================
  // PAN 4: Mất nguồn VCCIN_CORE / VCore CPU, POST code 00
  // =========================================================================
  {
    id: 'mb-fault-04-vcore-missing-post-00',
    boardId: 'asus-rog-b760f',
    category: 'motherboard',
    brandTag: 'ASUS',
    title: 'Mất điện áp VCCIN_CORE / VCore CPU, Card test báo POST Code 00 (Quạt quay nhưng không boot)',
    symptom:
      'Kích nguồn quạt quay đều liên tục, đèn báo lỗi CPU Q-LED trên bo mạch sáng đỏ đứng yên, cắm card test hiển thị mã POST Code 00 (hoặc FF/D0). CPU hoàn toàn mát lạnh không sinh nhiệt sau 5 phút bật máy.',
    postCode: '00',
    severity: 'high',
    affectedZones: ['zone-vrm-vcore', 'zone-cpu-socket'],
    suspectComponentIds: ['PU101', 'PQ101', 'PL101', 'U_SIO', 'CPU1'],
    affectedRails: ['rail-12v-eps', 'rail-vccin-core', 'rail-vcc1p8'],
    rootCauses: [
      'Mất lệnh cho phép mở nguồn VR_ON gửi từ Super I/O / PCH đến chân Enable của IC điều khiển PWM PU101.',
      'Mất nguồn nuôi chính VCC cấp vào chân nuôi của IC điều khiển PWM PU101 do đứt trở cầu chì.',
      'IC điều khiển PWM (RAA229131) bị lỗi nội, hỏng chân giao tiếp SVID Bus với socket CPU LGA1700.'
    ],
    quickFixSummary:
      'Đo nguồn nuôi 5V/12V tại chân VCC của IC PWM PU101. Đo chân Enable (VR_ON) đạt ~3.3V. Kiểm tra chân VCC1P8 đã có trước đó chưa. Nếu đủ điều kiện mở mà cuộn cảm PL101 vẫn 0V, thay IC dao động PWM PU101.',
    steps: [
      {
        id: 'mb-04-step-1',
        stepNumber: 1,
        title: 'Đo điện áp tại các cuộn cảm pha nguồn VCCIN_CORE (PL101)',
        instruction:
          'Kích nguồn cho bo mạch chạy. Đặt đồng hồ thang DC Volt que đen chạm mass que đỏ đặt vào chân cuộn cảm PL101 phía nối vào tụ lọc đầu ra.',
        targetComponentId: 'PL101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'voltage',
        expectedValue: '1.05V - 1.25V DC (tùy thế hệ CPU cắm vào)',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Cuộn cảm hoàn toàn mất áp (đo được 0.00V). CPU không được cấp năng lượng nên không thể thực thi lệnh nạp vi mã đầu tiên.',
        failSuspectComponents: ['PU101', 'PQ101'],
        repairAction:
          'Chuyển sang kiểm tra điều kiện hoạt động của IC điều khiển PWM đa pha PU101.'
      },
      {
        id: 'mb-04-step-2',
        stepNumber: 2,
        title: 'Đo nguồn nuôi và điện áp phụ trợ VCC1P8 cấp vào khối điều khiển',
        instruction:
          'Đo chân cấp nguồn phụ VCC1P8 và tín hiệu kích hoạt cấp vào IC điều khiển PWM PU101.',
        targetComponentId: 'PU101',
        targetNetId: 'rail-vcc1p8',
        measureMode: 'voltage',
        expectedValue: '1.80V DC tại đường VCC1P8',
        passNextStepId: 'mb-04-step-3',
        failDiagnosis:
          'Mất áp đường VCC1P8 (0V) hoặc sụt giảm nặng khiến IC PWM PU101 không thể khởi tạo.',
        failSuspectComponents: ['U_SIO', 'PU_3V5V'],
        repairAction:
          'Khôi phục đường nguồn phụ VCC1P8 trước khi kiểm tra tiếp IC PWM.'
      },
      {
        id: 'mb-04-step-3',
        stepNumber: 3,
        title: 'Kiểm tra xung giao tiếp SVID Bus giữa CPU và IC PWM',
        instruction:
          'Đặt que đo máy hiện sóng (Oscilloscope) thang đo 1V/div tại chân SVD (Serial Data) và SVC (Serial Clock) kết nối giữa socket CPU1 và IC PWM PU101 trong 2 giây đầu tiên khi vừa kích nguồn.',
        targetComponentId: 'PU101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'oscilloscope',
        expectedValue: 'Có các gói xung vuông biên độ 1.05V trao đổi dữ liệu số',
        passNextStepId: 'mb-04-step-4',
        failDiagnosis:
          'Đường SVID im lìm mức thấp 0V hoặc treo cứng 1.05V không có xung sóng. CPU chưa nhận diện được chân socket hoặc đứt trở kéo áp SVID.',
        failSuspectComponents: ['CPU1', 'PU101'],
        repairAction:
          'Kiểm tra lại tiếp xúc chân socket CPU, vệ sinh pad mạ vàng CPU và đo trở kéo trên đường SVID.'
      },
      {
        id: 'mb-04-step-4',
        stepNumber: 4,
        title: 'Thay thế IC dao động đa pha PWM PU101',
        instruction:
          'Khi có đủ nguồn nuôi, MOSFET không chập mà IC PWM vẫn không xuất xung PWM lái các pha, thay thế IC PU101.',
        targetComponentId: 'PU101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'voltage',
        expectedValue: '1.10V DC ổn định tại ngõ ra cuộn cảm',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Vẫn không có áp do đường hồi tiếp Current Sense bị hở mạch.',
        failSuspectComponents: ['PU101'],
        repairAction:
          'Đo thông mạch từng cặp chân cảm biến dòng từ cuộn cảm về IC PWM PU101.'
      }
    ]
  },

  // =========================================================================
  // PAN 5: Lỗi nhận RAM, đèn DRAM sáng vàng, POST code 55 / C1
  // =========================================================================
  {
    id: 'mb-fault-05-dram-post-55-c1-pmic-failure',
    boardId: 'asus-rog-b760f',
    category: 'motherboard',
    brandTag: 'ASUS',
    title: 'Lỗi không nhận RAM DDR5, đèn DRAM Q-LED sáng vàng cam, POST Code 55 / C1',
    symptom:
      'Kích nguồn máy quạt quay, đèn báo lỗi DRAM Q-LED trên bo mạch sáng đèn vàng cam đứng yên, card test dừng ở mã 55 ("Memory not installed") hoặc C1. Đã thử vệ sinh chân RAM và cắm thanh RAM tốt khác vẫn bị hiện tượng tương tự.',
    postCode: '55 / C1',
    severity: 'medium',
    affectedZones: ['zone-ram-bank', 'zone-cpu-socket'],
    suspectComponentIds: ['DIMM_A2', 'CPU1', 'PU_3V5V', 'JATX24'],
    affectedRails: ['rail-vddq-ddr5', 'rail-3valw', 'rail-gnd'],
    rootCauses: [
      'Mất nguồn cấp 5V/12V dẫn lên chân IC PMIC tích hợp trên lưng thanh RAM DDR5 qua khe cắm DIMM_A2.',
      'Cong gãy chân pin bên trong socket CPU1 (LGA1700) làm đứt các đường tín hiệu bus dữ liệu bộ nhớ DDR5 kênh A hoặc kênh B.',
      'Bụi bẩn hoặc rỉ sét oxy hóa chân tiếp xúc lá đồng bên trong khe cắm DIMM_A2.'
    ],
    quickFixSummary:
      'Đo điện áp tại chân cấp nguồn khe cắm RAM DIMM_A2 (nguồn chính VDDQ_DDR5 1.10V và nguồn phụ). Đo trở kháng các chân tín hiệu bus dữ liệu về socket CPU1. Dùng kính hiển vi soi kỹ chân socket CPU để nắn lại chân cong.',
    steps: [
      {
        id: 'mb-05-step-1',
        stepNumber: 1,
        title: 'Đo điện áp nguồn bus dữ liệu bộ nhớ VDDQ_DDR5 tại khe cắm RAM',
        instruction:
          'Cắm nguồn và bật máy. Đặt đồng hồ thang DC Volt, đo tại chân tụ lọc sát khe cắm RAM DIMM_A2.',
        targetComponentId: 'DIMM_A2',
        targetNetId: 'rail-vddq-ddr5',
        measureMode: 'voltage',
        expectedValue: '1.10V DC (DDR5 VDDQ)',
        passNextStepId: 'mb-05-step-2',
        failDiagnosis:
          'Điện áp nguồn RAM đo được 0V hoặc chỉ có 0.3V do mất nguồn cấp vào khe RAM.',
        failSuspectComponents: ['PU_3V5V', 'DIMM_A2'],
        repairAction:
          'Kiểm tra đường cấp nguồn từ giắc JATX24 sang khu vực khe cắm RAM.'
      },
      {
        id: 'mb-05-step-2',
        stepNumber: 2,
        title: 'Đo điện áp đường quản lý SPD qua đường Standby 3VALW',
        instruction:
          'Đo chân cấp nguồn nuôi chip SPD trên khe RAM DIMM_A2 từ đường rail-3valw.',
        targetComponentId: 'DIMM_A2',
        targetNetId: 'rail-3valw',
        measureMode: 'voltage',
        expectedValue: '3.3V DC',
        passNextStepId: 'mb-05-step-3',
        failDiagnosis:
          'Mất áp chân SPD (0V) khiến CPU không thể đọc thông số từ chip ROM trên thanh RAM.',
        failSuspectComponents: ['DIMM_A2', 'U_SIO'],
        repairAction:
          'Kiểm tra trở kéo treo áp từ đường rail-3valw lên đường SPD nối vào khe RAM.'
      },
      {
        id: 'mb-05-step-3',
        stepNumber: 3,
        title: 'Kiểm tra tiếp xúc socket CPU1 bằng kính hiển vi',
        instruction:
          'Tháo CPU1, dùng kính hiển vi soi khu vực các chân pin điều khiển bus bộ nhớ DDR5 trên socket LGA1700.',
        targetComponentId: 'CPU1',
        targetNetId: 'rail-vddq-ddr5',
        measureMode: 'visual',
        expectedValue: 'Tất cả 1700 chân socket thẳng hàng, không có chân nào bị quặp hoặc thụt sâu',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Phát hiện 2 chân pin góc kênh RAM A bị nghiêng gập làm mất kết nối data/clock tới khe RAM.',
        failSuspectComponents: ['CPU1', 'DIMM_A2'],
        repairAction:
          'Dùng kim nha khoa nắn lại chân pin cong nhẹ nhàng hoặc vệ sinh lại chân khe RAM.'
      }
    ]
  },

  // =========================================================================
  // PAN 6: Lỗi BIOS SPI corrupt / Flashback
  // =========================================================================
  {
    id: 'mb-fault-06-bios-corruption-loop-flashback',
    boardId: 'asus-rog-b760f',
    category: 'motherboard',
    brandTag: 'ASUS',
    title: 'Lỗi hỏng ROM BIOS SPI (Tự khởi động lại tuần hoàn 10-15s, mất hình, nháy đèn Flashback)',
    symptom:
      'Bấm nút nguồn quạt quay được 10 đến 15 giây thì tự sập tắt rồi tự động khởi động lại lặp vô tận (boot loop). Đèn debug Q-LED nhảy từ CPU sang DRAM rồi sập ngắt. Màn hình hoàn toàn không hiển thị tín hiệu, bàn phím không sáng đèn NumLock.',
    postCode: 'Loop / 15',
    severity: 'medium',
    affectedZones: ['zone-pch-south', 'zone-io-sio'],
    suspectComponentIds: ['U_BIOS', 'PCH1', 'U_SIO'],
    affectedRails: ['rail-3valw', 'rail-rsmrst', 'rail-slp-s3'],
    rootCauses: [
      'Nội dung vi mã firmware trong chip Flash SPI Winbond 256Mb U_BIOS bị lỗi phân vùng Intel ME (Management Engine) sau khi cúp điện đột ngột trong lúc cập nhật BIOS.',
      'Bản thân chip IC Flash ROM U_BIOS bị hỏng cell nhớ (bad block) hoặc đứt chân tiếp xúc hàn trên bo mạch.',
      'Trở phân áp chân CS# (Chip Select) bị rỉ sét làm chip BIOS không phản hồi giao tiếp đọc ghi với chip cầu nam PCH1.'
    ],
    quickFixSummary:
      'Đo chân số 8 (VCC) IC BIOS U_BIOS đạt 3.3V (rail-3valw). Sử dụng tính năng USB BIOS Flashback (cắm USB định dạng FAT32 chứa file ROM đổi tên chuẩn) để nạp lại firmware không cần CPU; nếu không được, dùng máy nạp RT809H nạp trực tiếp file Clear ME vào IC.',
    steps: [
      {
        id: 'mb-06-step-1',
        stepNumber: 1,
        title: 'Kiểm tra nguồn cấp VCC cho IC Flash BIOS U_BIOS',
        instruction:
          'Cắm nguồn ATX. Đặt đồng hồ thang DC Volt, đo tại chân số 8 (VCC) của IC BIOS SPI U_BIOS.',
        targetComponentId: 'U_BIOS',
        targetNetId: 'rail-3valw',
        measureMode: 'voltage',
        expectedValue: '3.3V DC',
        passNextStepId: 'mb-06-step-2',
        failDiagnosis:
          'Chân số 8 mất nguồn (0V). Chip BIOS không thể khởi động.',
        failSuspectComponents: ['U_BIOS', 'PU_3V5V'],
        repairAction:
          'Kiểm tra điện trở cầu chì hoặc cuộn cảm ferrite lọc nguồn cấp cho IC BIOS.'
      },
      {
        id: 'mb-06-step-2',
        stepNumber: 2,
        title: 'Đo xung giao tiếp đọc dữ liệu SPI Bus bằng máy hiện sóng',
        instruction:
          'Đặt que đo máy hiện sóng vào chân 1 (CS#) và chân 6 (CLK) của U_BIOS ngay khi vừa bật nguồn.',
        targetComponentId: 'U_BIOS',
        targetNetId: 'rail-3valw',
        measureMode: 'oscilloscope',
        expectedValue: 'Xuất hiện chùm xung nhọn giao tiếp đọc liên tục biên độ 3.3V trong 5-8 giây đầu',
        passNextStepId: 'mb-06-step-3',
        failDiagnosis:
          'Xung đọc chỉ nháy đúng 1 nhịp ngắn 0.2s rồi tắt ngúm hoặc không có xung nào. PCH không đọc được dữ liệu khởi động từ BIOS.',
        failSuspectComponents: ['U_BIOS', 'PCH1'],
        repairAction:
          'Thực hiện quy trình cứu hộ BIOS qua tính năng Flashback hoặc nạp lại bằng máy nạp ROM ngoài.'
      },
      {
        id: 'mb-06-step-3',
        stepNumber: 3,
        title: 'Thực hiện nạp lại Firmware BIOS chuẩn bằng tính năng USB BIOS Flashback',
        instruction:
          'Tải file BIOS từ trang chủ ASUS, đổi tên file theo chuẩn BIOSRenamer. Copy vào USB chuẩn FAT32, cắm vào cổng USB Flashback chuyên dụng. Nhấn giữ nút BIOS Flashback 3 giây cho đèn LED bắt đầu nhấp nháy.',
        targetComponentId: 'U_BIOS',
        targetNetId: 'rail-3valw',
        measureMode: 'visual',
        expectedValue: 'Đèn Flashback nhấp nháy tăng tốc trong 3-5 phút rồi tắt hẳn (Báo nạp thành công)',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Đèn Flashback chỉ sáng đứng yên hoặc nháy 5 lần rồi tắt ngắt. IC BIOS bị lỗi bad sector vật lý hoặc USB không nhận.',
        failSuspectComponents: ['U_BIOS'],
        repairAction:
          'Tháo IC BIOS U_BIOS ra khỏi mạch, dùng máy nạp RT809H xóa trắng và nạp file BIOS sạch (Clear ME). Nếu máy nạp báo Verify Error, thay thế IC Winbond mới.'
      }
    ]
  },

  // =========================================================================
  // PAN 7: Chập IC LAN Realtek gây sụt nguồn Standby (ASRock H81M-DGS)
  // =========================================================================
  {
    id: 'mb-fault-07-lan-usb-esd-short-hot-pch',
    boardId: 'asrock-h81m-dgs',
    category: 'motherboard',
    brandTag: 'ASRock',
    title: 'Chập IC LAN Realtek RTL8111G (Sụt nguồn cấp trước 5VSB/3V, chip cầu nam PCH nóng ran)',
    symptom:
      'Chỉ cần cắm giắc nguồn ATX vào (chưa hề bật máy), chip cầu nam PCH1 hoặc IC mạng LAN U_LAN đã nóng ran bỏng tay. Đèn 5VSB có nhưng chân kích nguồn đo chỉ được 1.2V - 1.8V (sụt áp nặng). Mainboard hoàn toàn không kích được nguồn.',
    postCode: 'No Power',
    severity: 'high',
    affectedZones: ['zone-pch-h81', 'zone-sio-nct6776'],
    suspectComponentIds: ['U_LAN', 'PCH1', 'U_SIO', 'JATX24'],
    affectedRails: ['rail-h81-5vsb', 'rail-h81-gnd', 'rail-h81-3vbat'],
    rootCauses: [
      'Sét đánh lan truyền qua đường dây mạng RJ45 làm đánh thủng IC LAN Realtek RTL8111G (U_LAN).',
      'IC LAN bị chập thông chân VDD cấp trước xuống chân Mass, kéo sụt nguồn cấp trước chung khiến chip cầu nam PCH1 chịu dòng xông quá tải phát nhiệt cực cao.'
    ],
    quickFixSummary:
      'Đo thang Diode tại tụ lọc nguồn chân IC LAN U_LAN về Mass (thấy 0.003V chập thẳng). Bôi cồn IPA để định vị linh kiện bốc khói nhiệt đầu tiên. Dùng máy khò gắp bỏ IC LAN U_LAN ra khỏi bo mạch là mainboard kích nguồn bình thường.',
    steps: [
      {
        id: 'mb-07-step-1',
        stepNumber: 1,
        title: 'Đo điện trở / độ sụt áp Diode đường nguồn nuôi IC mạng LAN U_LAN',
        instruction:
          'Rút nguồn điện AC. Đặt đồng hồ thang đo Diode, đo tại tụ lọc gốm ngay cạnh IC LAN U_LAN (RTL8111G) về Mass.',
        targetComponentId: 'U_LAN',
        targetNetId: 'rail-h81-5vsb',
        measureMode: 'diode',
        expectedValue: '0.400V - 0.550V',
        passNextStepId: 'mb-07-step-2',
        failDiagnosis:
          'Đồng hồ đo được 0.002V - 0.006V (chập thẳng về GND). IC mạng LAN đã bị sét đánh thủng tiếp giáp.',
        failSuspectComponents: ['U_LAN'],
        repairAction:
          'Bôi mỡ hàn (Flux), dùng máy khò 370°C khò nhấc hoàn toàn IC LAN U_LAN ra khỏi bo mạch.'
      },
      {
        id: 'mb-07-step-2',
        stepNumber: 2,
        title: 'Kiểm tra chân nguồn Standby cấp vào Super I/O U_SIO',
        instruction:
          'Đo thang Diode chân nguồn Standby của chip Super I/O U_SIO (NCT6776D) về Mass.',
        targetComponentId: 'U_SIO',
        targetNetId: 'rail-h81-5vsb',
        measureMode: 'diode',
        expectedValue: '0.450V - 0.550V',
        passNextStepId: 'mb-07-step-3',
        failDiagnosis:
          'Chân nguồn U_SIO vẫn bị chập sau khi gỡ LAN.',
        failSuspectComponents: ['U_SIO', 'JATX24'],
        repairAction:
          'Kiểm tra tiếp xúc giắc cắm JATX24 và tụ dán lọc đường nguồn standby.'
      },
      {
        id: 'mb-07-step-3',
        stepNumber: 3,
        title: 'Đo lại độ sụt áp đường nguồn cấp trước sau khi cách ly linh kiện lỗi',
        instruction:
          'Đo lại thang Diode đường rail-h81-5vsb về Mass tại giắc cắm JATX24.',
        targetComponentId: 'JATX24',
        targetNetId: 'rail-h81-5vsb',
        measureMode: 'diode',
        expectedValue: '0.380V - 0.480V (Hết chập)',
        passNextStepId: 'mb-07-step-4',
        failDiagnosis:
          'Vẫn chập 0.003V và chip cầu nam PCH1 vẫn nóng ran khi cắm nguồn. Rất tiếc dòng xung sét đã đánh thủng khối PHY tích hợp trong PCH1.',
        failSuspectComponents: ['PCH1'],
        repairAction:
          'Cần đóng lại hoặc thay chip cầu nam PCH1 trên máy hàn BGA chuyên dụng.'
      },
      {
        id: 'mb-07-step-4',
        stepNumber: 4,
        title: 'Cắm nguồn kiểm tra nhiệt độ PCH1 và test kích nguồn',
        instruction:
          'Cắm dây nguồn ATX 24-pin. Sờ tay lên chip PCH1 xem có còn nóng bất thường ở chế độ chờ không, sau đó kích nguồn kiểm tra quạt quay và xuất hình.',
        targetComponentId: 'PCH1',
        targetNetId: 'rail-h81-5vsb',
        measureMode: 'voltage',
        expectedValue: 'Nhiệt độ PCH mát (~35°C), kích nguồn lên hình xuất BIOS bình thường',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Main kích được nhưng mất mạng LAN do chưa hàn bù IC LAN mới.',
        failSuspectComponents: ['U_LAN'],
        repairAction:
          'Hàn IC LAN Realtek mới cùng mã (RTL8111G) hoặc tư vấn khách hàng sử dụng card mạng LAN PCIe rời / USB WiFi.'
      }
    ]
  },

  // =========================================================================
  // PAN 8: Lỗi mạch RTC 32.768kHz / sụt áp CMOS (ASRock H81M-DGS)
  // =========================================================================
  {
    id: 'mb-fault-08-rtc-cmos-battery-drain-h81',
    boardId: 'asrock-h81m-dgs',
    category: 'motherboard',
    brandTag: 'ASRock',
    title: 'Lỗi mạch dao động RTC 32.768kHz và tụ CMOS (Bo mạch H81 tự kích nguồn, không lưu giờ)',
    symptom:
      'Cắm dây nguồn vào máy tính tự kích nguồn quạt quay một lúc rồi tắt, bấm nút kích lúc được lúc không. Máy khởi động luôn dừng lại ở màn hình đen bắt ấn F1 để thiết lập lại ngày giờ ("CMOS Checksum Bad"). Pin CMOS thay mới chỉ chạy được 2 đến 3 ngày là hết sạch điện áp (đo pin chỉ còn dưới 1.0V).',
    postCode: 'RTC Error / 00 chập chờn',
    severity: 'low',
    affectedZones: ['zone-pch-h81'],
    suspectComponentIds: ['Y_RTC', 'BAT_CMOS', 'PCH1'],
    affectedRails: ['rail-h81-3vbat', 'rail-h81-gnd'],
    rootCauses: [
      'Pin CMOS CR2032 bị tụt áp dưới 2.5V; tụ lọc gốm dán mắc song song với thạch anh RTC bị rỉ sét làm rò rỉ dòng tiêu thụ pin xuống Mass.',
      'Thạch anh dao động hình trụ Y_RTC 32.768kHz bị già hóa, lệch tần số hoặc chết đứt mạch dao động khiến khối RTC nội bên trong PCH1 không phát xung thời gian thực.',
      'Trở hạn dòng đường RTCRST# bị mục đứt làm chip cầu nam PCH luôn ở trạng thái reset khối RTC.'
    ],
    quickFixSummary:
      'Thay pin CMOS CR2032 mới (đạt 3.1V - 3.3V). Đo điện áp chân thạch anh Y_RTC (đạt ~0.3V - 0.5V DC, có sóng hình sin 32.768kHz trên máy hiện sóng). Gỡ bỏ tụ gốm rò rỉ gần thạch anh và thay thạch anh ống 32.768kHz mới.',
    steps: [
      {
        id: 'mb-08-step-1',
        stepNumber: 1,
        title: 'Đo điện áp pin nuôi bộ nhớ CMOS (BAT_CMOS)',
        instruction:
          'Không cắm điện nguồn. Đặt đồng hồ thang DC Volt, đo điện áp giữa cực dương khay pin BAT_CMOS và Mass bo mạch.',
        targetComponentId: 'BAT_CMOS',
        targetNetId: 'rail-h81-3vbat',
        measureMode: 'voltage',
        expectedValue: '3.0V - 3.3V DC',
        passNextStepId: 'mb-08-step-2',
        failDiagnosis:
          'Điện áp pin dưới 2.6V hoặc bằng 0V. Mạch RTC không có nguồn duy trì nội dung bộ nhớ RAM CMOS khi ngắt điện lưới.',
        failSuspectComponents: ['BAT_CMOS'],
        repairAction:
          'Lắp pin CR2032 mới chất lượng tốt. Nếu pin mới lắp vào bị tụt nhanh sau vài giờ, chuyển bước tiếp theo để kiểm tra tụ rò.'
      },
      {
        id: 'mb-08-step-2',
        stepNumber: 2,
        title: 'Đo kiểm tra điện áp đường RTCRST# cấp cho PCH1',
        instruction:
          'Đo điện áp DC tại đường tín hiệu RTCRST# gần thạch anh RTC dẫn vào chip cầu nam PCH1.',
        targetComponentId: 'PCH1',
        targetNetId: 'rail-h81-3vbat',
        measureMode: 'voltage',
        expectedValue: '2.8V - 3.2V DC',
        passNextStepId: 'mb-08-step-3',
        failDiagnosis:
          'Đo được 0V - 1.2V do jumper Clear CMOS cắm sai chân hoặc điện trở phân áp bị rỉ mục.',
        failSuspectComponents: ['PCH1'],
        repairAction:
          'Kiểm tra lại vị trí jumper CLR_CMOS và thay trở phân áp nếu bị tăng trị số.'
      },
      {
        id: 'mb-08-step-3',
        stepNumber: 3,
        title: 'Đo xung dao động của thạch anh thời gian thực Y_RTC 32.768kHz',
        instruction:
          'Dùng que đo máy hiện sóng (chế độ que x10), đo tại 2 chân của thạch anh trụ tròn Y_RTC.',
        targetComponentId: 'Y_RTC',
        targetNetId: 'rail-h81-3vbat',
        measureMode: 'oscilloscope',
        expectedValue: 'Sóng hình sin tần số chuẩn 32.768kHz, biên độ ~0.4V - 0.8Vpp',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Không có dao động (đường thẳng 0V) hoặc sóng bị méo dạng khiến khối logic trong PCH không đếm nhịp.',
        failSuspectComponents: ['Y_RTC'],
        repairAction:
          'Thay thế thạch anh dao động hình ống Y_RTC 32.768kHz mới lấy từ xác bo mạch chủ khác.'
      }
    ]
  },

  // =========================================================================
  // PAN 9: Mất xung PLTRST# (Platform Reset) dù đủ nguồn (Gigabyte B660M DS3H)
  // =========================================================================
  {
    id: 'mb-fault-09-pltrst-missing-no-display',
    boardId: 'gigabyte-b660m-ds3h',
    category: 'motherboard',
    brandTag: 'Gigabyte',
    title: 'Mất tín hiệu Reset toàn hệ thống PLTRST# (Nguồn đủ tất cả các mức nhưng không xuất hình)',
    symptom:
      'Kích nguồn quạt quay đều, CPU ấm nóng bình thường. Đo đạc tất cả các mức nguồn: 12V, 5V, 3.3V, VCore, VDD_DDR4 đều đầy đủ chuẩn xác. Tuy nhiên card test không nhảy code, đèn báo Reset trên card test sáng mờ hoặc tắt lịm, màn hình đen hoàn toàn không xuất hình.',
    postCode: 'Reset Dead / No Post',
    severity: 'high',
    affectedZones: ['zone-pch-b660', 'zone-sio-ite'],
    suspectComponentIds: ['PCH1', 'U_SIO', 'U_BIOS', 'CPU1'],
    affectedRails: ['rail-rsmrst-gb', 'rail-5vsb-gb', 'rail-vcore-gb'],
    rootCauses: [
      'Chipset PCH1 chưa nhận được tín hiệu Power Good từ Super I/O U_SIO, nên PCH không chịu mở cổng phát xung Platform Reset.',
      'Mất tín hiệu báo nguồn RAM tốt từ IC PU_DDR đưa về PCH hoặc CPU socket.',
      'Lỗi phân vùng Intel ME (Management Engine) trong chip ROM BIOS U_BIOS khiến PCH bị treo trong quá trình khởi tạo cấu hình phần cứng.'
    ],
    quickFixSummary:
      'Đo tín hiệu PLTRST# tại chân A15 của khe cắm PCIe (chuẩn phải nhảy từ 0V lên 3.3V sau khi kích nguồn ~1-2 giây). Nếu mất áp 3.3V, kiểm tra tín hiệu PWROK từ Super I/O U_SIO và nạp lại BIOS sạch chuẩn (Clear ME) bằng máy nạp ROM.',
    steps: [
      {
        id: 'mb-09-step-1',
        stepNumber: 1,
        title: 'Đo kiểm tra tín hiệu Platform Reset tại chân A15 của khe cắm PCIE_1',
        instruction:
          'Kích nguồn cho bo mạch chạy. Đặt đồng hồ thang DC Volt que đen chạm mass que đỏ đặt vào chân A15 trên khe cắm card đồ họa rời PCIE_1.',
        targetComponentId: 'PCIE_1',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: '3.3V DC (mức logic High)',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Chân A15 chỉ đo được 0V. Toàn bộ các vi mạch trên bo mạch bị giữ chặt ở trạng thái Reset, không thể thực thi chương trình khởi động.',
        failSuspectComponents: ['PCH1', 'U_SIO'],
        repairAction:
          'Chuyển sang kiểm tra các điều kiện để PCH sinh xung Reset ở các bước tiếp theo.'
      },
      {
        id: 'mb-09-step-2',
        stepNumber: 2,
        title: 'Đo tín hiệu Power Good gửi về Chipset PCH1',
        instruction:
          'Đo điện áp DC tại điểm tín hiệu Power Good kết nối giữa Super I/O U_SIO và chip cầu nam PCH1.',
        targetComponentId: 'PCH1',
        targetNetId: 'rail-rsmrst-gb',
        measureMode: 'voltage',
        expectedValue: '3.3V DC',
        passNextStepId: 'mb-09-step-3',
        failDiagnosis:
          'Mất tín hiệu Power Good (0V). Chip PCH hiểu rằng hệ thống nguồn chính chưa ổn định nên khóa lệnh reset.',
        failSuspectComponents: ['U_SIO', 'JATX24'],
        repairAction:
          'Kiểm tra đường tín hiệu Power Good từ giắc nguồn JATX24 và chip Super I/O U_SIO.'
      },
      {
        id: 'mb-09-step-3',
        stepNumber: 3,
        title: 'Nạp lại bản ROM BIOS có phân vùng Intel ME sạch (Clean ME Region)',
        instruction:
          'Gỡ IC Flash BIOS U_BIOS, dùng máy nạp RT809H nạp bản dump BIOS chuẩn đã được xử lý Clear ME.',
        targetComponentId: 'U_BIOS',
        targetNetId: 'rail-5vsb-gb',
        measureMode: 'visual',
        expectedValue: 'Sau khi nạp BIOS sạch, kích nguồn máy nhảy POST code liên tục và xuất hình',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Đã có đủ Power Good và nạp BIOS sạch nhưng chân Reset vẫn trơ 0V do chip cầu nam PCH1 bị bong bi hoặc đứt mạch nội.',
        failSuspectComponents: ['PCH1'],
        repairAction:
          'Tiến hành hấp nhiệt hoặc tháo đóng làm lại chân bi (reballing) chip cầu nam PCH1.'
      }
    ]
  },

  // =========================================================================
  // PAN 10: Mất xuất hình khe PCIe x16, POST code D6 / VGA LED (MSI B550)
  // =========================================================================
  {
    id: 'mb-fault-10-pcie-x16-vga-post-d6',
    boardId: 'msi-b550-tomahawk',
    category: 'motherboard',
    brandTag: 'MSI',
    title: 'Mất xuất hình khe PCIe x16, đèn VGA EZ Debug sáng, POST Code D6 (Máy đã nhận phím NumLock)',
    symptom:
      'Kích nguồn máy tính vẫn khởi động vào hệ điều hành Windows bình thường (bấm phím NumLock/CapsLock trên bàn phím đèn LED vẫn bật tắt bình thường, cắm loa nghe tiếng chuông khởi động Windows), nhưng màn hình cắm vào card đồ họa rời ở khe PCIe x16 tối đen không có tín hiệu. Đèn VGA Debug LED trên bo mạch sáng trắng.',
    postCode: 'D6',
    severity: 'medium',
    affectedZones: ['zone-msi-pcie-m2', 'zone-am4-socket'],
    suspectComponentIds: ['PCIE_1', 'CPU1', 'PCH1'],
    affectedRails: ['rail-msi-12v', 'rail-msi-gnd'],
    rootCauses: [
      'Mất nguồn cấp phụ 12V tại khe cắm PCIE_1 (chân B1, B2, B3) do đứt cầu chì hoặc hỏng transistor chuyển mạch nguồn.',
      'Dàn tụ gốm dán cách ly vi sai (PCIe AC Coupling Capacitors 100nF) trên các làn PCIe Lanes bị bong tróc chân hoặc nứt vỡ do cắm card màn hình nặng cong bo mạch.',
      'Chân tiếp xúc trong khe cắm PCIE_1 bị oxy hóa, hoặc cong vênh chân socket CPU AMD AM4 làm mất các làn PCIe nối trực tiếp từ CPU1.'
    ],
    quickFixSummary:
      'Đo nguồn 12V tại các chân đầu của khe cắm PCIE_1. Đo tổng trở thang Diode của 16 cặp làn tín hiệu vi sai TX/RX (đều nhau ~0.450V). Dùng kính lúp kiểm tra dàn tụ dán 100nF trên bo mạch và hàn lại tụ bị vỡ.',
    steps: [
      {
        id: 'mb-10-step-1',
        stepNumber: 1,
        title: 'Đo điện áp cấp nguồn tại các chân chuẩn trên khe cắm PCIE_1',
        instruction:
          'Kích nguồn cho máy chạy. Đặt đồng hồ thang DC Volt, đo tại chân B1/B2/B3 (chân cấp +12V) trên khe cắm PCIE_1.',
        targetComponentId: 'PCIE_1',
        targetNetId: 'rail-msi-12v',
        measureMode: 'voltage',
        expectedValue: '12.0V DC',
        passNextStepId: 'mb-10-step-2',
        failDiagnosis:
          'Mất nguồn 12V cấp vào khe PCIe. Card đồ họa rời không được cấp nguồn ban đầu để kích hoạt mạch xử lý.',
        failSuspectComponents: ['PCIE_1'],
        repairAction:
          'Kiểm tra trở cầu chì 0Ω gần khe cắm PCIe dẫn nguồn từ đường rail-msi-12v sang.'
      },
      {
        id: 'mb-10-step-2',
        stepNumber: 2,
        title: 'Đo kiểm tra độ sụt áp Diode của các cặp tín hiệu vi sai PCIe Lanes',
        instruction:
          'Rút nguồn điện AC. Đặt đồng hồ thang đo Diode que đỏ chạm mass que đen đo lần lượt các chân tín hiệu thu phát vi sai trên khe PCIE_1.',
        targetComponentId: 'PCIE_1',
        targetNetId: 'rail-msi-gnd',
        measureMode: 'diode',
        expectedValue: '0.420V - 0.480V đồng đều giữa tất cả các cặp làn',
        passNextStepId: 'mb-10-step-3',
        failDiagnosis:
          'Có một hoặc nhiều chân báo hở mạch (OL - vô cùng). Tín hiệu đường truyền dữ liệu đồ họa tốc độ cao bị ngắt quãng.',
        failSuspectComponents: ['PCIE_1', 'CPU1'],
        repairAction:
          'Soi kính hiển vi kiểm tra dãy tụ ghép AC Coupling (tụ gốm dán 100nF) nằm giữa khe PCIE_1 và socket CPU1 xem có tụ nào bị vỡ góc không.'
      },
      {
        id: 'mb-10-step-3',
        stepNumber: 3,
        title: 'Thay thế tụ ghép vi sai và vệ sinh chân tiếp xúc socket CPU1',
        instruction:
          'Hàn lại các tụ gốm 100nF bị hỏng. Tháo CPU1, dùng dung dịch vệ sinh làm sạch các chân socket CPU và chân lá đồng bên trong khe PCIE_1.',
        targetComponentId: 'CPU1',
        targetNetId: 'rail-msi-gnd',
        measureMode: 'visual',
        expectedValue: 'Sau khi vệ sinh và hàn tụ, đo lại diode các chân đều nhau, cắm card xuất hình mượt mà',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Vẫn không nhận card ở khe x16 dù tụ và khe tốt, cắm xuống khe x4 (do chipset quản lý) lại nhận.',
        failSuspectComponents: ['CPU1'],
        repairAction:
          'Thử nghiệm với CPU AMD Ryzen khác vì khối PCIe Root Controller tích hợp bên trong con chip CPU1 đã bị sốc điện làm chết cổng.'
      }
    ]
  },

  // =========================================================================
  // PAN 11: Bệnh đặc trưng AMD AM4: Chết khối VDDCR_SOC (MSI B550)
  // =========================================================================
  {
    id: 'mb-fault-11-amd-am4-soc-1v8-aon-failure',
    boardId: 'msi-b550-tomahawk',
    category: 'motherboard',
    brandTag: 'MSI',
    title: 'Bệnh đặc thù AMD AM4: Chập nguồn VDDCR_SOC (Treo đèn CPU/DRAM trên MSI B550)',
    symptom:
      'Bo mạch chủ AMD Socket AM4 (MSI MAG B550 Tomahawk) kích nguồn quạt quay tối đa công suất, đèn EZ Debug LED dừng lại ở đèn CPU hoặc DRAM rồi đứng yên mãi mãi. Đo cuộn cảm VDDCR_CPU có 1.1V nhưng cuộn cảm VDDCR_SOC mất áp hoặc chỉ ra 0.2V, MOSFET nhánh SOC PQ302 ấm nóng bất thường.',
    postCode: 'CPU Init Hang / 00',
    severity: 'high',
    affectedZones: ['zone-msi-vrm', 'zone-am4-socket'],
    suspectComponentIds: ['PQ302', 'PU301', 'CPU1', 'PL301'],
    affectedRails: ['rail-vddcr-soc', 'rail-vddcr-cpu', 'rail-msi-12v'],
    rootCauses: [
      'Pha nguồn VDDCR_SOC (cấp nguồn cho khối Memory Controller, I/O Die và PCIe tích hợp của vi xử lý AMD Ryzen) bị đánh thủng MOSFET Low-side hoặc High-side PQ302.',
      'IC điều khiển PWM PU301 bị hỏng khối Driver điều khiển nhánh nguồn SOC.',
      'Sốc điện áp SOC (do ép xung RAM) làm đánh thủng trực tiếp khối I/O Die bên trong con chip CPU AMD Ryzen.'
    ],
    quickFixSummary:
      'Tháo CPU Ryzen ra khỏi socket. Đo thang Diode cuộn cảm VDDCR_SOC về Mass (khi không có CPU phải > 0.400V, nếu = 0.002V là chập MOSFET PQ302). Thay thế MOSFET/DrMOS nhánh SOC PQ302 và kiểm tra lại áp trước khi lắp lại CPU.',
    steps: [
      {
        id: 'mb-11-step-1',
        stepNumber: 1,
        title: 'Đo điện áp cuộn cảm nguồn VDDCR_SOC khi đang bật máy',
        instruction:
          'Kích nguồn bo mạch. Đặt đồng hồ thang DC Volt, đo tại đầu cuộn cảm cấp nguồn cho nhánh SOC PL301.',
        targetComponentId: 'PL301',
        targetNetId: 'rail-vddcr-soc',
        measureMode: 'voltage',
        expectedValue: '0.95V - 1.10V DC',
        passNextStepId: 'mb-11-step-2',
        failDiagnosis:
          'Cuộn cảm SOC mất áp hoàn toàn (0V) hoặc chỉ có 0.2V lơ lửng. Khối điều khiển bộ nhớ của CPU không có nguồn hoạt động khiến hệ thống treo ngay từ bước khởi tạo đầu tiên.',
        failSuspectComponents: ['PQ302', 'PU301'],
        repairAction:
          'Tắt máy rút nguồn, tháo rời CPU ra khỏi socket để đo trở kháng cách ly linh kiện.'
      },
      {
        id: 'mb-11-step-2',
        stepNumber: 2,
        title: 'Đo trở kháng cuộn cảm VDDCR_SOC về Mass khi không gắn CPU',
        instruction:
          'Rút CPU ra khỏi socket AM4. Đặt đồng hồ thang Diode / Ohm que đỏ chạm Mass que đen chạm vào chân MOSFET PQ302.',
        targetComponentId: 'PQ302',
        targetNetId: 'rail-vddcr-soc',
        measureMode: 'diode',
        expectedValue: '> 0.350V (hoặc > 500Ω khi đo thang Ohm)',
        passNextStepId: 'mb-11-step-3',
        failDiagnosis:
          'Đồng hồ báo thông mạch 0.001V (chập Mass). MOSFET hoặc DrMOS nhánh SOC PQ302 đã bị đánh thủng nối tắt.',
        failSuspectComponents: ['PQ302'],
        repairAction:
          'Dùng mỏ khò gắp bỏ MOSFET / DrMOS PQ302 bị chập ra khỏi mạch, vệ sinh pad mạch.'
      },
      {
        id: 'mb-11-step-3',
        stepNumber: 3,
        title: 'Kiểm tra đường nguồn cấp 12V chính vào IC PWM PU301',
        instruction:
          'Cắm nguồn và đo điện áp tại chân ngõ vào VIN của IC điều khiển PWM PU301 từ đường rail-msi-12v.',
        targetComponentId: 'PU301',
        targetNetId: 'rail-msi-12v',
        measureMode: 'voltage',
        expectedValue: '12.0V DC',
        passNextStepId: 'mb-11-step-4',
        failDiagnosis:
          'Điện áp cấp vào IC PWM bị mất hoặc sụt áp do đứt trở cầu chì.',
        failSuspectComponents: ['PU301'],
        repairAction:
          'Kiểm tra trở cầu chì 2.2Ω cấp nguồn cho IC PWM PU301.'
      },
      {
        id: 'mb-11-step-4',
        stepNumber: 4,
        title: 'Đóng linh kiện mới và chạy kiểm tra điện áp SOC an toàn',
        instruction:
          'Hàn MOSFET PQ302 mới. Bật nguồn đo kiểm tra điện áp SOC xuất ra chuẩn 1.05V trước khi cắm lại CPU AMD Ryzen.',
        targetComponentId: 'PQ302',
        targetNetId: 'rail-vddcr-soc',
        measureMode: 'voltage',
        expectedValue: '1.05V DC ổn định, không gợn sóng',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Nguồn SOC đã chuẩn nhưng cắm CPU vào vẫn treo đèn CPU do CPU Ryzen cũ đã bị chết I/O Die từ đợt sốc áp trước.',
        failSuspectComponents: ['CPU1'],
        repairAction:
          'Thử nghiệm với một CPU Ryzen khác đã được kiểm tra tốt.'
      }
    ]
  },

  // =========================================================================
  // PAN 12: Sập nguồn đột ngột khi tải nặng (OCP VRM do khô tụ lọc)
  // =========================================================================
  {
    id: 'mb-fault-12-vrm-ocp-crash-under-load',
    boardId: 'asus-rog-b760f',
    category: 'motherboard',
    brandTag: 'ASUS',
    title: 'Sập nguồn hoặc đơ máy tức thì khi vào tải nặng (Lỗi mạch hồi tiếp OCP/Current Sense hoặc khô tụ lọc VRM)',
    symptom:
      'Máy tính ở chế độ chờ (Idle) hoặc lướt web xem phim nhẹ nhàng thì chạy cả ngày bình thường rất ổn định. Nhưng hễ mở game nặng 3D, phần mềm render đồ họa hoặc chạy bài kiểm tra AIDA64 / Prime95 Stress Test ăn tải CPU cao là máy lập tức sập tắt ngúm tự khởi động lại, hoặc quạt hú 100% rồi màn hình mất tín hiệu.',
    postCode: 'Crash Under Load',
    severity: 'medium',
    affectedZones: ['zone-vrm-vcore'],
    suspectComponentIds: ['PC101', 'PU101', 'PQ101', 'PL101'],
    affectedRails: ['rail-vccin-core', 'rail-12v-eps'],
    rootCauses: [
      'Dàn tụ rắn Polymer lọc nguồn đầu ra VCore PC101 hoặc tụ gốm MLCC mặt sau socket bị khô dung lượng, tăng nội trở ESR khiến gợn sóng điện áp (Ripple Voltage) vọt cao vượt ngưỡng chịu đựng của CPU khi ăn dòng lớn.',
      'Cặp điện trở lấy mẫu dòng điện (Current Sense Resistors CSP/CSN) kết nối từ cuộn cảm pha về IC PWM PU101 bị tăng trị số hoặc sai lệch thông số, khiến IC PWM hiểu nhầm mạch đang quá dòng và kích hoạt chế độ bảo vệ quá tải OCP (Over Current Protection) giả tạo.',
      'Keo tản nhiệt dàn DrMOS/VRM bị khô chai cứng khiến nhiệt độ DrMOS vượt quá 115°C kích hoạt bảo vệ quá nhiệt OTP (Over Temperature Protection).'
    ],
    quickFixSummary:
      'Dùng máy đo chuyên dụng kiểm tra dung lượng và nội trở ESR tụ lọc CPU PC101 (thay các tụ có ESR > 0.05Ω). Đo cặp trở lấy mẫu dòng CSP/CSN (thường có trị số 1.0Ω đến 2.2Ω). Vệ sinh thay pad tản nhiệt dẫn nhiệt cao cấp cho dàn DrMOS VRM.',
    steps: [
      {
        id: 'mb-12-step-1',
        stepNumber: 1,
        title: 'Kiểm tra gợn sóng điện áp (Ripple Voltage) của nguồn VCore CPU dưới tải bằng máy hiện sóng',
        instruction:
          'Kẹp que đo máy hiện sóng (bật chế độ AC Coupling, thang 20mV/div) tại chân dương của tụ lọc PC101 sát lưng socket CPU. Cho máy chạy tăng dần tải bằng phần mềm Cinebench/AIDA64.',
        targetComponentId: 'PC101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'oscilloscope',
        expectedValue: 'Gợn sóng nhấp nhô nhỏ hơn 40mVpp',
        passNextStepId: 'mb-12-step-2',
        failDiagnosis:
          'Gợn sóng điện áp vọt lên tới 150mV - 250mVpp ngay khi vừa tải nặng. Dàn tụ lọc đã mất hoàn toàn khả năng san phẳng xung nhọn cao tần.',
        failSuspectComponents: ['PC101'],
        repairAction:
          'Tiến hành thay thế tụ rắn Polymer lọc nguồn đầu ra quanh socket CPU PC101 bằng tụ mới có thông số Ultra Low ESR.'
      },
      {
        id: 'mb-12-step-2',
        stepNumber: 2,
        title: 'Đo kiểm tra các điện trở mạch lấy mẫu cảm biến dòng OCP (Current Sense)',
        instruction:
          'Tắt máy rút nguồn. Dùng đồng hồ thang đo điện trở chính xác, đo các cặp trở phân áp dán (thường mã 1R0 hoặc 2R2, tương đương 1.0Ω đến 2.2Ω) nối từ 2 đầu cuộn cảm pha về chân CS của IC PWM PU101.',
        targetComponentId: 'PU101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'resistance',
        expectedValue: '1.0Ω - 2.2Ω chuẩn xác theo trị số ghi trên thân',
        passNextStepId: 'mb-12-step-3',
        failDiagnosis:
          'Phát hiện có điện trở bị tăng trị số lên 15Ω - 50Ω do quá nhiệt lâu ngày. Điện áp rơi trên điện trở tăng cao khiến IC PWM ngắt mạch bảo vệ OCP sai lệch.',
        failSuspectComponents: ['PU101'],
        repairAction:
          'Thay thế điện trở dán chuẩn kích thước 0402 / 0603 đúng trị số ohm ban đầu.'
      },
      {
        id: 'mb-12-step-3',
        stepNumber: 3,
        title: 'Kiểm tra tản nhiệt và nhiệt độ thực tế của dàn DrMOS VRM (OTP Check)',
        instruction:
          'Tháo tản nhiệt nhôm VRM kiểm tra miếng đệm tản nhiệt (Thermal Pad). Thay pad tản nhiệt loại 12.8 W/mK có độ dày chuẩn (thường 1.0mm hoặc 1.5mm). Dùng súng bắn nhiệt hồng ngoại quan sát nhiệt độ DrMOS khi chạy tải 100% trong 15 phút.',
        targetComponentId: 'PQ101',
        targetNetId: 'rail-vccin-core',
        measureMode: 'visual',
        expectedValue: 'Nhiệt độ DrMOS duy trì ổn định dưới 80°C khi full load',
        passNextStepId: 'resolved',
        failDiagnosis:
          'Nhiệt độ một pha vọt lên trên 110°C trong khi các pha khác chỉ 50°C do pha đó bị gánh dòng lệch pha hoặc mất xung PWM các pha lân cận.',
        failSuspectComponents: ['PU101', 'PQ101'],
        repairAction:
          'Kiểm tra lại tín hiệu điều khiển cân bằng pha từ IC PWM PU101, thay thế DrMOS bị quá nhiệt.'
      }
    ]
  }
];
