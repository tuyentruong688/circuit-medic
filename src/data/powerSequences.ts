import type { PowerSequenceSpec } from '../types/circuit';

export const POWER_SEQUENCES: PowerSequenceSpec[] = [
  {
    id: 'seq-intel-lga1700',
    title: 'Chuỗi kích nguồn Mainboard Intel 600/700 Series (LGA1700 - B660/B760/Z790)',
    category: 'motherboard',
    platform: 'Intel Alder Lake / Raptor Lake (LGA1700, Chipset B660/Z690/B760/Z790)',
    stages: [
      {
        order: 1,
        signalName: '+3V_RTC & RTCRST#',
        source: 'Pin CMOS CR2032 (3V) / Diode kép BAT54C',
        destination: 'Khối thời gian thực RTC bên trong PCH (Intel Chipset)',
        voltage: '3.0V - 3.3V',
        delayMs: '0',
        description: 'Điện áp nuôi mạch dao động thời gian thực RTC (thạch anh 32.768 kHz) và tín hiệu xóa RTC (RTCRST# và SRTCRST# phải ở mức cao >= 2.8V) nhằm kích hoạt logic standby.',
        failureSymptom: 'Mất xung dao động 32.768kHz, PCH treo khối thời gian thực, không nhận diện được trạng thái standby hoặc sai ngày giờ CMOS liên tục.'
      },
      {
        order: 2,
        signalName: '+3VALW / +5VALW (DeepSx / Standby Rails)',
        source: 'Nguồn ATX 5VSB qua IC hạ áp tuyến tính LDO hoặc IC Buck standby',
        destination: 'Super I/O (Nuvoton/ITE) & Đường PCH Standby (VCCST/VCCPRIM_3P3)',
        voltage: '+3.3V / +5.0V',
        delayMs: '10 - 20ms',
        description: 'Khối nguồn cấp trước (Always-on / Standby) sinh ra ngay khi cắm nguồn ATX. Đèn LED standby trên bo mạch chủ sáng báo hiệu hệ sinh thái standby hoạt động.',
        failureSymptom: 'Mainboard hoàn toàn mất nguồn phụ, không kích được nguồn, chập đường 3.3V Standby làm nóng rát IC LDO hoặc PCH.'
      },
      {
        order: 3,
        signalName: 'RSMRST# (Resume Reset)',
        source: 'Super I/O (SIO) hoặc IC quản lý nguồn Standby',
        destination: 'Chipset PCH (Tín hiệu báo khối Standby đã ổn định)',
        voltage: '3.3V (Mức cao logic)',
        delayMs: '20 - 50ms',
        description: 'SIO kiểm tra các mức điện áp standby đã chuẩn xác, sau đó nhả tín hiệu RSMRST# lên mức cao (3.3V) để đánh thức khối quản lý nguồn ACPI của PCH.',
        failureSymptom: 'RSMRST# bị giữ ở mức thấp 0V do SIO lỗi, mất nguồn 3VSB hoặc thạch anh SIO không dao động; mainboard tê liệt hoàn toàn khi bấm nút Power.'
      },
      {
        order: 4,
        signalName: 'PWRBTN# -> PCH_PWRBTN# (Power Button Transition)',
        source: 'Chân kích nguồn Front Panel -> Super I/O -> PCH',
        destination: 'PCH (Intel Chipset)',
        voltage: '3.3V -> 0V -> 3.3V (Xung sườn âm)',
        delayMs: '100ms (Xung bấm nút)',
        description: 'Khi kỹ thuật viên chập chân kích nguồn (Front Panel), SIO nhận xung hạ thấp xuống 0V rồi gửi tiếp tín hiệu PCH_PWRBTN# đến PCH để yêu cầu chuyển từ trạng thái S5/DeepSx sang S0.',
        failureSymptom: 'Chân kích nguồn không có điện áp 3.3V (mất trở kéo lên), hoặc có 3.3V nhưng chập không tụt áp; SIO không chuyển xung sang PCH.'
      },
      {
        order: 5,
        signalName: 'SLP_S4# & SLP_S3# (Suspend-to-RAM Exit)',
        source: 'PCH (Intel Chipset)',
        destination: 'Super I/O (SIO)',
        voltage: '3.3V (Mức cao)',
        delayMs: '5 - 10ms',
        description: 'PCH đồng ý thoát chế độ nghỉ S4/S3, nhả SLP_S4# và SLP_S3# (PM_SLP_S3#) từ 0V lên 3.3V báo cho SIO biết sẵn sàng mở các đường nguồn chính.',
        failureSymptom: 'PCH không nhả lệnh SLP_S3# do lỗi BIOS ME Region, hở chân socket LGA1700, chết PCH hoặc mất điều kiện kích nguồn (RTC/RSMRST#).'
      },
      {
        order: 6,
        signalName: 'PS_ON# (Power Supply Turn-On)',
        source: 'Super I/O (SIO)',
        destination: 'Chân 16 giắc ATX 24-Pin của bộ nguồn',
        voltage: '0V (Mức thấp chủ động - Active LOW)',
        delayMs: '2 - 5ms',
        description: 'Nhận được SLP_S3# mức cao, SIO kéo chân PS_ON# từ 3.3V/5V xuống Mass (0V) để lệnh cho bộ nguồn ATX mở các điện áp chính.',
        failureSymptom: 'Quạt nguồn không quay, SIO bị hỏng mạch Open-Drain kéo PS_ON# hoặc đường mạch bị đứt trở kéo/bảo vệ ESD.'
      },
      {
        order: 7,
        signalName: '+12V / +5V / +3.3V Main Rails',
        source: 'Bộ nguồn ATX qua giắc 24-Pin & EPS 8-Pin',
        destination: 'Toàn bộ mạch VRM, khe cắm RAM, PCIe, IC điều khiển trên bo mạch',
        voltage: '+12.0V, +5.0V, +3.3V',
        delayMs: '10 - 20ms',
        description: 'Các đường nguồn chính xuất hiện, quạt CPU bắt đầu quay, các mạch nguồn thứ cấp (VRM phụ) được chuẩn bị kích hoạt.',
        failureSymptom: 'Nguồn ATX kích ngắt ngay lập tức do chạm chập MOSFET nhánh 12V Vcore hoặc chạm các đường 5V/3.3V trên bo.'
      },
      {
        order: 8,
        signalName: 'VDD / VDDQ / VPP (DDR4 / DDR5 Memory Power)',
        source: 'Mạch VRM nguồn RAM (PWM buck hoặc PMIC onboard DDR5)',
        destination: 'Khe cắm RAM DDR4 (1.2V/2.5V VPP) hoặc DDR5 (1.1V VDD/VDDQ & 1.8V VPP)',
        voltage: 'DDR4: 1.2V / DDR5: 1.1V, VPP: 1.8V/2.5V',
        delayMs: '10 - 15ms',
        description: 'Nguồn cấp bộ nhớ RAM được kích hoạt. Với DDR5, bo mạch cấp đường 5V đến chân pin của khe RAM để PMIC trên thanh RAM tự biến đổi hạ áp.',
        failureSymptom: 'Mất áp nguồn RAM, lỗi phase RAM hoặc chạm tụ lọc; mainboard kích nguồn sáng đèn DRAM LED và không xuất hình.'
      },
      {
        order: 9,
        signalName: 'VR_ON & VCCIN_AUX / VCCIN_CORE (FIVR/DLVR)',
        source: 'SIO/PCH gửi VR_ON -> IC PWM Vcore (RAA229131/RT3628AE) điều khiển DrMOS',
        destination: 'Socket CPU LGA1700',
        voltage: 'VCCIN_AUX: 1.8V, Vcore: 0.8V - 1.35V (VID động)',
        delayMs: '15 - 30ms',
        description: 'Lệnh VR_ON cho phép IC dao động PWM phát xung lái các tầng DrMOS cấp nguồn Vcore, VCCIN_AUX và VCCGT cho vi xử lý Intel thế hệ 12/13/14.',
        failureSymptom: 'CPU lạnh ngắt, quạt quay liên tục không tắt nhưng không có nguồn CPU do hỏng IC PWM, chập DrMOS hoặc đứt tín hiệu EN/VR_ON.'
      },
      {
        order: 10,
        signalName: 'VR_READY / CPU_PWROK & PCH_PWROK',
        source: 'IC PWM Vcore & Mạch giám sát nguồn SIO',
        destination: 'PCH và CPU LGA1700',
        voltage: '3.3V / 1.05V (Mức cao)',
        delayMs: '10 - 20ms',
        description: 'IC PWM Vcore báo VR_READY khi nguồn CPU đã chuẩn xác. Bộ nguồn ATX đã có PG (Power Good) -> PCH_PWROK và SYS_PWROK đồng loạt đạt mức cao.',
        failureSymptom: 'Điện áp Vcore có đủ nhưng tín hiệu VR_READY không xuất ra chân IC PWM, hoặc mất PWR_OK từ nguồn ATX khiến hệ thống treo ở trạng thái chờ.'
      },
      {
        order: 11,
        signalName: 'PLTRST# (Platform Reset)',
        source: 'Chipset PCH (Intel)',
        destination: 'CPU, Khe cắm PCIe, M.2 NVMe, LAN, SIO',
        voltage: '3.3V (Mức cao)',
        delayMs: '1 - 5ms sau SYS_PWROK',
        description: 'PCH giải phóng lệnh Reset toàn hệ thống (Platform Reset chuyển từ 0V lên 3.3V). Đây là mốc quan trọng nhất đánh dấu toàn bộ phần cứng đã sẵn sàng vận hành.',
        failureSymptom: 'Mất áp reset PLTRST# (đo tại chân A11 khe PCIe hoặc chân SIO) giữ ở mức 0V; đèn CPU/DRAM sáng đứng, máy không khởi động.'
      },
      {
        order: 12,
        signalName: 'BIOS_POST & SPI Read (CPU Execution)',
        source: 'CPU gửi lệnh truy vấn qua bus SPI/eSPI',
        destination: 'Chip BIOS Winbond/Macronix 1.8V/3.3V (Chân CS#, CLK, DO, DI)',
        voltage: '1.8V / 3.3V (Xung dữ liệu cao tần)',
        delayMs: '5 - 50ms',
        description: 'CPU bắt đầu nạp mã khởi động đầu tiên từ BIOS (Reset Vector 0xFFFFFFF0h), giao tiếp qua chân CS# và CLK. Card test nhảy mã POST Code (từ 00 -> 15 -> C1/55 -> A2 -> 99/A0).',
        failureSymptom: 'Chân 1 (CS#) của BIOS đứng yên ở mức cao không có xung nhấp nháy, mainboard đứng mã POST 00 hoặc lặp chu kỳ reset 3 lần rồi tắt.'
      }
    ]
  },
  {
    id: 'seq-amd-am4',
    title: 'Chuỗi kích nguồn Mainboard AMD Socket AM4 (B450 / B550 / X570)',
    category: 'motherboard',
    platform: 'AMD Zen 2 / Zen 3 Architecture (Socket AM4, Chipset B450/B550/A320/X570)',
    stages: [
      {
        order: 1,
        signalName: '+3VSB_ALW & RTC',
        source: 'Nguồn ATX 5VSB qua IC hạ áp LDO standby & Pin CR2032',
        destination: 'Super I/O (ITE IT8686E / Nuvoton NCT6798D) & AMD Promontory Chipset / APU RTC',
        voltage: '+3.3V / +3.0V',
        delayMs: '0 - 10ms',
        description: 'Điện áp cấp trước duy trì khối quản lý nguồn của SIO và mạch đồng hồ thời gian thực RTC (32.768 kHz) của nền tảng AMD.',
        failureSymptom: 'Mất 3VSB Standby, LED đèn báo không sáng, chập tụ gốm trên đường 3VSB hoặc IC LDO hạ áp bị quá nhiệt cháy sém.'
      },
      {
        order: 2,
        signalName: 'RSMRST# (AMD S5 Reset)',
        source: 'Super I/O (SIO)',
        destination: 'AMD Chipset / SoC Processor',
        voltage: '3.3V (Mức cao)',
        delayMs: '15 - 30ms',
        description: 'Sau khi phát hiện nguồn cấp trước đã ổn định và mạch dao động hoạt động, SIO nhả RSMRST# lên 3.3V để đánh thức bộ xử lý trạng thái nguồn AMD.',
        failureSymptom: 'RSMRST# ở mức 0V khiến chipset AMD không nhận biết được lệnh kích nguồn từ nút Power, máy tê liệt.'
      },
      {
        order: 3,
        signalName: 'PWRBTN# -> SIO_PWRBTN#',
        source: 'Chân kích Power Switch -> Super I/O -> AMD SoC/FCH',
        destination: 'AMD Chipset / SoC',
        voltage: '3.3V -> 0V -> 3.3V',
        delayMs: '100ms (Xung kích)',
        description: 'Kỹ thuật viên kích nguồn, SIO nhận tín hiệu tụt áp và phát xung sườn âm tương ứng tới CPU AMD / Chipset FCH để đề nghị khởi động.',
        failureSymptom: 'Điện áp chân kích bị sụt áp còn dưới 1.5V do rò diode zener bảo vệ hoặc hỏng chân GPIO đầu vào của Super I/O.'
      },
      {
        order: 4,
        signalName: 'SLP_S5# & SLP_S3# (AMD Sleep Signals)',
        source: 'AMD SoC / Promontory FCH Chipset',
        destination: 'Super I/O',
        voltage: '3.3V (Mức cao)',
        delayMs: '5 - 15ms',
        description: 'Chipset AMD trả về các tín hiệu SLP_S5# và SLP_S3# đạt mức cao 3.3V nhằm cho phép SIO bật nguồn máy tính.',
        failureSymptom: 'Chipset không phản hồi SLP_S3# do lỗi Firmware AGESA trong BIOS, hở chân cắm socket AM4, hoặc đứt đường mạch liên kết.'
      },
      {
        order: 5,
        signalName: 'PSON# (Power Supply ON)',
        source: 'Super I/O',
        destination: 'Chân 16 giắc nguồn ATX 24-Pin',
        voltage: '0V (Active LOW)',
        delayMs: '2 - 5ms',
        description: 'SIO kéo PSON# về Mass (0V) để khởi động bộ nguồn ATX, quạt bắt đầu quay và cấp các điện áp chính +12V, +5V, +3.3V.',
        failureSymptom: 'Nguồn không chạy, hoặc nguồn kích xong ngắt ngay trong vòng 0.5s do đường dây 12V 4/8-pin CPU bị chập chạm mass.'
      },
      {
        order: 6,
        signalName: 'VDDCR_SOC & 1V8_AON',
        source: 'Mạch VRM 1.8V và VRM nguồn phụ SOC',
        destination: 'Socket AM4 (AMD APU/CPU SoC Controller)',
        voltage: '1.8V (1V8_AON), 0.95V - 1.1V (VDDCR_SOC)',
        delayMs: '10 - 20ms',
        description: 'Nguồn 1.8V luôn mở (1V8_AON) và nguồn SoC điều khiển giao tiếp bộ nhớ RAM, PCIe controller của vi xử lý AMD AM4 được cấp trước.',
        failureSymptom: 'Mất áp 1.8V làm CPU AMD không mở được khối giao tiếp nội bộ; máy không kích nguồn được hoặc kích nguồn quạt quay tít không nhận RAM.'
      },
      {
        order: 7,
        signalName: 'VDDP & VDDG (IF & Memory PHY Power)',
        source: 'IC ổn áp tuyến tính hoặc Buck Converter LDO',
        destination: 'Bộ điều khiển Infinity Fabric và PHY RAM của CPU AMD AM4',
        voltage: 'VDDP: 0.90V, VDDG: 0.95V - 1.05V',
        delayMs: '10 - 25ms',
        description: 'Cấp điện thế cho các bus giao tiếp tốc độ cao Infinity Fabric (IF) liên kết giữa các cụm Core Complex Dies (CCD) và I/O Die (IOD).',
        failureSymptom: 'Nguồn VDDP bị sụt áp làm máy dump màn hình xanh (BSOD), không thể chạy RAM ở xung nhịp XMP/DOCP cao hoặc không nhận khe PCIe 4.0.'
      },
      {
        order: 8,
        signalName: 'VDDCR_CPU (Core Vcore Power)',
        source: 'Hệ thống VRM chính (PWM RT3609BE / IR35201 + DrMOS / Dual N-Channel)',
        destination: 'Các nhân Zen Core bên trong CPU AM4',
        voltage: '0.9V - 1.45V (Theo giao thức SVI2/SVI3 VID)',
        delayMs: '20 - 40ms',
        description: 'Bộ điều khiển PWM Vcore nhận lệnh enable, phát xung điều khiển các phase nguồn cấp năng lượng chính cho các nhân xử lý của CPU.',
        failureSymptom: 'Mất Vcore CPU hoàn toàn do hỏng IC PWM RT3609, đứt trở cầu chì đường 12V cấp cho phase hoặc nổ tụ lọc gốm MLCC.'
      },
      {
        order: 9,
        signalName: 'PWROK (All Power Good to AMD CPU)',
        source: 'Mạch so áp giám sát & SIO',
        destination: 'Chân PWROK của CPU Socket AM4',
        voltage: '3.3V / 1.8V',
        delayMs: '10 - 30ms sau khi Vcore ổn định',
        description: 'Báo cho CPU biết toàn bộ hệ thống cấp điện (Vcore, SOC, VDDP, RAM, 1V8) đã đạt điện áp định mức và không còn gợn sóng nhiễu.',
        failureSymptom: 'Mất tín hiệu PWROK dẫn đến CPU AM4 không tiến hành xả lệnh Reset nội bộ, máy quạt quay bình thường nhưng đèn Debug CPU sáng đỏ.'
      },
      {
        order: 10,
        signalName: 'RESET# (LDT_RST# / PLTRST#) & AGESA POST',
        source: 'AMD SoC / Chipset',
        destination: 'Toàn hệ thống (PCIe, M.2, SIO, BIOS SPI)',
        voltage: '3.3V / 1.8V (Mức cao)',
        delayMs: '5 - 15ms',
        description: 'Tín hiệu Reset được xả, CPU bắt đầu nạp vi mã AGESA từ chip BIOS SPI (Winbond W25Q128/256) để kiểm tra RAM, VGA và nạp màn hình khởi động.',
        failureSymptom: 'Tín hiệu Reset bị treo ở mức thấp 0V do lỗi chip BIOS bị hỏng firmware, socket AM4 cong chân tiếp xúc hoặc lỗi đường truyền bus SPI.'
      }
    ]
  },
  {
    id: 'seq-intel-legacy-h81',
    title: 'Chuỗi kích nguồn Mainboard Intel H61 / H81 / B85 (LGA1155 / LGA1150)',
    category: 'motherboard',
    platform: 'Intel Haswell / Ivy Bridge (LGA1150 / LGA1155, Chipset H81/B85/H61)',
    stages: [
      {
        order: 1,
        signalName: '3V_BAT / RTCRST# & 32.768kHz RTC',
        source: 'Pin CMOS CR2032 qua trở 1k-10k & Diode BAT54',
        destination: 'Khối RTC trong Chipset PCH',
        voltage: '3.0V - 3.3V',
        delayMs: '0',
        description: 'Mạch pin RTC duy trì bộ nhớ CMOS và nuôi thạch anh dao động 32.768 kHz tại chân RTCX1/RTCX2 của chipset PCH.',
        failureSymptom: 'Mất xung dao động 32.768kHz hoặc chập tụ lọc đường RTCRST# làm chipset PCH không khởi tạo được mạch logic standby; mainboard cắm nguồn im lìm.'
      },
      {
        order: 2,
        signalName: '+3VSB / +5VSB & VCCDSX (Deep Sx)',
        source: 'Nguồn ATX 5VSB qua IC hạ áp tuyến tính 1117-3.3 hoặc RT9199',
        destination: 'Super I/O (ITE IT8728F / NCT5577D) & PCH VCC3_3',
        voltage: '3.3V / 5.0V',
        delayMs: '10ms',
        description: 'Nguồn cấp trước Always-On 3.3V cấp cho chân nguồn standby của SIO và Chipset PCH ngay khi cắm phích cắm điện vào nguồn.',
        failureSymptom: 'IC 1117 hoặc tụ gốm xung quanh bị chập kéo sụt áp 3VSB xuống dưới 1.8V, làm IC nóng bỏng tay và mất toàn bộ nguồn phụ.'
      },
      {
        order: 3,
        signalName: 'RSMRST# (Resume Reset to PCH)',
        source: 'Super I/O hoặc mạch trễ transistor',
        destination: 'Chân RSMRST# của Chipset PCH',
        voltage: '3.3V (Mức cao)',
        delayMs: '30 - 60ms',
        description: 'Tín hiệu báo điện áp nguồn phụ đã ổn định và mạch lọc nguồn đã đầy điện tích, giải phóng trạng thái Reset khối quản lý nguồn PCH.',
        failureSymptom: 'RSMRST# mất áp (0V) do đứt trở treo 8.2k/10k hoặc SIO bị hỏng chân xuất áp; chipset không bao giờ nhả các lệnh quản lý kích nguồn S3/S4.'
      },
      {
        order: 4,
        signalName: 'PWRBTN# -> PCH_PWRBTN#',
        source: 'Front Panel -> Super I/O -> Chipset PCH',
        destination: 'Chipset PCH',
        voltage: '3.3V -> 0V -> 3.3V (Sườn âm)',
        delayMs: '100ms',
        description: 'Kỹ thuật viên kích nguồn chập chân kích, SIO xử lý chống dội phím (debounce) rồi nhại lại xung mức thấp PCH_PWRBTN# gửi tới chipset PCH.',
        failureSymptom: 'Chân kích nguồn có 3.3V nhưng chập kích không thấy PCH_PWRBTN# tụt áp ở chân SIO ra chipset, hoặc đứt đường mạch ngầm.'
      },
      {
        order: 5,
        signalName: 'SLP_S3# (Sleep State S3)',
        source: 'Chipset PCH (H81/B85)',
        destination: 'Super I/O',
        voltage: '3.3V (Mức cao)',
        delayMs: '5 - 15ms',
        description: 'Chipset PCH nhận lệnh kích nguồn, nếu đủ điều kiện sẽ xuất lệnh SLP_S3# từ 0V vọt lên 3.3V để lệnh kích hoạt toàn bộ các mạch nguồn cấp chính.',
        failureSymptom: 'Pan kinh điển: SLP_S3# nháy lên 3.3V rồi sụt về 0V ngay (kích ngắt 0.5s), hoặc đứng im 0V do chết PCH, mất đường VCCRTC hoặc lỗi ME Firmware.'
      },
      {
        order: 6,
        signalName: 'PSON# -> Main Power Rails (+12V, +5V, +3.3V)',
        source: 'Super I/O -> Giắc ATX 24-Pin',
        destination: 'Bộ nguồn ATX',
        voltage: '0V (Chân PS_ON kéo Mass)',
        delayMs: '2 - 5ms',
        description: 'SIO nhận được SLP_S3# sẽ mở transistor kéo chân PS_ON# xuống Mass, khởi động quạt nguồn và cấp điện cho toàn bộ bo mạch.',
        failureSymptom: 'Transistor đảo lệnh PS_ON# bị dò hoặc hỏng trở hạn dòng; quạt nguồn không nhúc nhích dù SLP_S3# đã có.'
      },
      {
        order: 7,
        signalName: '1.5V_DDR (DDR3) / 1.05V_PCH / VTT_CPU',
        source: 'Mạch Buck Converter (RT8120 / UP1565P) & MOSFET Dual',
        destination: 'Khe cắm RAM DDR3, PCH Core và khối I/O của CPU',
        voltage: 'DDR3: 1.50V, VTT: 1.05V, PCH: 1.05V',
        delayMs: '15 - 25ms',
        description: 'Các mạch nguồn thứ cấp mở theo thứ tự: nguồn RAM 1.5V -> nguồn VTT/VCCIO 1.05V -> nguồn PCH 1.05V. Đây là điều kiện tiên quyết trước khi mở Vcore.',
        failureSymptom: 'Cháy IC RT8120 điều khiển nguồn RAM, mất nguồn 1.5V DDR hoặc mất nguồn 1.05V PCH khiến mạch bảo vệ ngắt xung kích hoặc máy không qua bước mở Vcore.'
      },
      {
        order: 8,
        signalName: 'VR_ON & Vcore (ISL95812 / NCP6151 / ISL95856)',
        source: 'IC PWM Vcore điều khiển các cặp MOSFET High/Low',
        destination: 'Socket CPU LGA1150 / LGA1155',
        voltage: 'H81/VCCIN: 1.75V - 1.8V (FIVR) / H61: 0.9V - 1.25V',
        delayMs: '20 - 40ms',
        description: 'Khi các nguồn thứ cấp báo đủ, lệnh EN/VR_ON được đưa tới IC dao động Vcore. IC phát xung PWM lái MOSFET cấp điện áp nuôi CPU.',
        failureSymptom: 'Mất áp Vcore: CPU không nóng; kiểm tra chân EN có áp 3.3V nhưng IC không dao động, hở chân socket CPU đứt tín hiệu VID.'
      },
      {
        order: 9,
        signalName: 'PCH_PWROK / CPU_PWROK & CPUBST# (RESET)',
        source: 'Mạch so áp PG / SIO & PCH',
        destination: 'CPU Socket LGA1150',
        voltage: '1.05V / 3.3V',
        delayMs: '5 - 10ms',
        description: 'PCH và CPU nhận tín hiệu báo các đường nguồn đã hoàn toàn chuẩn xác; PCH nhả xung Reset hệ thống cho vi xử lý.',
        failureSymptom: 'Nguồn Vcore có đầy đủ nhưng mất tín hiệu PWROK (do hỏng IC giám sát APW7073 hoặc trở phân áp), CPU không xả Reset, đèn card test không sáng chấm clock.'
      },
      {
        order: 10,
        signalName: 'PLTRST# & Frame POST Execution',
        source: 'Chipset PCH -> Toàn bo mạch',
        destination: 'PCIe slot, SIO, BIOS ROM SPI Winbond 25Q64',
        voltage: '3.3V (Mức cao)',
        delayMs: '5 - 20ms',
        description: 'Tín hiệu Platform Reset đạt 3.3V, CPU bắt đầu đọc chip BIOS SPI qua chân 1, 2, 5, 6 để khởi tạo phần cứng và xuất màn hình.',
        failureSymptom: 'Mainboard quạt quay tít nhưng treo reset (đo chân B16 khe PCI hoặc A11 PCIe mất 3.3V Reset); nạp lại BIOS không chuyển biến.'
      }
    ]
  },
  {
    id: 'seq-psu-llc-dcdc',
    title: 'Chuỗi khởi động Nguồn ATX Hiện Đại (Active PFC + Half-Bridge LLC + Đồng Bộ Hóa DC-DC)',
    category: 'psu',
    platform: 'Nguồn chuẩn 80 Plus Gold / Platinum (Topology: Active PFC + LLC Resonant + Synchronous Rectification + DC-DC 5V/3.3V)',
    stages: [
      {
        order: 1,
        signalName: 'AC Mains Input -> EMI Filter & Bridge Rectifier',
        source: 'Điện lưới 220VAC qua Giắc AC, Cầu chì, MOV, Cuộn lọc EMI',
        destination: 'Cầu Diode Chỉnh Lưu (Bridge Rectifier GBU/KBJ)',
        voltage: '220VAC -> ~310VDC (Đỉnh sóng sin)',
        delayMs: '0 - 5ms',
        description: 'Dòng điện AC 220V qua tầng lọc can nhiễu EMI 2 cấp, triệt tiêu xung sét qua Varistor (MOV), đi qua nhiệt điện trở NTC chống dòng khởi động và chỉnh lưu thành 310VDC trên tụ chính qua diode bypass.',
        failureSymptom: 'Cầu chì nổ đen kịt do chập cầu diode chỉnh lưu, chập MOSFET PFC hoặc tụ gốm cao áp bị đánh thủng xuyên giáp.'
      },
      {
        order: 2,
        signalName: '+5VSB Standby Converter (Flyback)',
        source: 'IC Nguồn Phụ Tích Hợp (TNY278PN / OB2358 / VIPer22A)',
        destination: 'Biến áp xung Standby -> Diode Schottky / Đồng bộ -> Chân 9 (Dây tím) giắc 24-Pin',
        voltage: '+5.0V - +5.15V',
        delayMs: '10 - 50ms',
        description: 'Mạch dao động Flyback biến đổi 310VDC thành +5VSB ổn định và cấp nguồn VCC phụ (12V-15V) tích trữ trên tụ cho IC điều khiển PFC/LLC.',
        failureSymptom: 'Mất hoàn toàn 5VSB (dây tím 0V) do chết IC nguồn phụ TNY278, đứt trở mồi (Startup Resistor 100k-470k) hoặc khô tụ lọc VCC.'
      },
      {
        order: 3,
        signalName: 'PS_ON# Assertion (Kéo Mass)',
        source: 'Mainboard (SIO) hoặc Kẹp nhíp thử nguồn (Chân 16 Dây xanh lá)',
        destination: 'IC Giám Sát Nguồn (Supervisor IC: WT7527 / PS223 / IN1S429)',
        voltage: '3.3V - 5.0V kéo về 0V (GND)',
        delayMs: '0ms (Khi bấm nút)',
        description: 'Khi kỹ thuật viên hoặc mainboard kích nguồn chập dây xanh lá PS_ON# xuống Mass, IC Supervisor phát hiện mức logic thấp và bắt đầu kích hoạt chuỗi mở nguồn chính.',
        failureSymptom: 'Dây xanh lá bị mất áp treo (không có 3.3V/5V) hoặc kẹp mass nhưng IC WT7527 không nhận diện do chập transistor kích.'
      },
      {
        order: 4,
        signalName: 'Optocoupler Drive & Relay Bypass NTC',
        source: 'IC Giám sát kích mở Transistor -> Optocoupler (PC817)',
        destination: 'Rơ-le bypass NTC & Chân VCC của IC điều khiển PFC/LLC (CM6800 / CM6901)',
        voltage: '12V - 15V VCC',
        delayMs: '5 - 15ms',
        description: 'Optocoupler cách ly truyền lệnh mở nguồn cao áp: Rơ-le nghe tiếng "tách" đóng chập chân nhiệt điện trở NTC để giảm tiêu hao nhiệt năng, đồng thời cấp VCC nuôi IC PFC/LLC.',
        failureSymptom: 'Không nghe tiếng rơ-le nhảy; Optocoupler PC817 bị đứt led phát hoặc rỉ quang trở bên trong, mất áp VCC nuôi IC dao động cao áp.'
      },
      {
        order: 5,
        signalName: 'Active PFC Boost Stage (Nâng áp 390VDC)',
        source: 'IC Dao động PFC (NCP1654 / Champion CM6500) lái MOSFET PFC',
        destination: 'Cuộn cảm PFC Boost -> Tụ hóa cao áp 400V-450V Nippon/Rubycon',
        voltage: '310VDC tăng vọt lên 385V - 400VDC',
        delayMs: '10 - 30ms',
        description: 'Mạch Boost PFC hoạt động, nâng điện áp từ 310VDC lên 390VDC chuẩn ổn định, triệt tiêu sóng hài và nâng cao hệ số công suất cos phi > 0.98.',
        failureSymptom: 'Điện áp trên tụ chính chỉ nằm ở 310VDC không dâng lên 390VDC; IC PFC bị ngắt bảo vệ UVLO hoặc chập diode nắn siêu nhanh Boost (SiC Diode).'
      },
      {
        order: 6,
        signalName: 'LLC Resonant Half/Full-Bridge & +12V Synchronous Rectification',
        source: 'IC Resonant LLC (CM6901 / UCC25600) lái cặp MOSFET LLC & Biến áp chính',
        destination: 'Tầng nắn đồng bộ MOSFET 12V bên thứ cấp (Secondary Synchronous Rectifier)',
        voltage: '+12.0V - +12.2V (Công suất lớn)',
        delayMs: '10 - 20ms',
        description: 'Mạch cộng hưởng LLC đóng cắt ở điện thế 0 (ZVS - Zero Voltage Switching) với hiệu suất cực cao (>94%), tạo ra đường điện áp duy nhất +12V công suất lớn.',
        failureSymptom: 'Nguồn kích ngắt tích tắc do chập MOSFET nắn đồng bộ 12V bên thứ cấp, chập tụ lọc polymer hoặc đứt tụ cộng hưởng cao áp nối tiếp cuộn sơ cấp.'
      },
      {
        order: 7,
        signalName: 'DC-DC Buck Converter (+5V & +3.3V Generation)',
        source: 'Module VRM DC-DC con (IC PWM APW7073 / UP3861 + MOSFET Dual)',
        destination: 'Dây đỏ (+5V) và Dây cam (+3.3V) giắc ATX 24-Pin',
        voltage: '+5.0V và +3.3V',
        delayMs: '5 - 10ms sau khi có 12V',
        description: 'Khác với nguồn cổ điển dùng biến áp chung, nguồn LLC hiện đại hạ áp từ đường +12V chính qua 2 cuộn cảm Buck độc lập để sinh ra +5V và +3.3V cực kỳ ổn định không bị lệch tải.',
        failureSymptom: 'Đường 12V có nhưng mất áp 5V hoặc 3.3V do chết IC PWM DC-DC hoặc chập tụ lọc thể rắn 6.3V trên module con.'
      },
      {
        order: 8,
        signalName: 'Voltage & Current Sensing Monitoring (OVP / UVP / OCP / SCP)',
        source: 'Các đường hồi tiếp +12V, +5V, +3.3V, -12V đưa vào IC Supervisor',
        destination: 'Chân kiểm tra Sense của WT7527 / GR8313',
        voltage: 'Tất cả các điện áp trong dải dung sai ±5%',
        delayMs: '50 - 100ms',
        description: 'IC bảo vệ liên tục giám sát quá áp (OVP), thấp áp (UVP), quá dòng (OCP) và ngắn mạch (SCP) trên từng đường điện thế đầu ra.',
        failureSymptom: 'Một đường nguồn bị sụt áp nhẹ hoặc dâng quá ngưỡng quy định (ví dụ 12V vọt lên 13.5V), IC Supervisor lập tức khóa lệnh kích nguồn để bảo vệ thiết bị.'
      },
      {
        order: 9,
        signalName: 'PWR_OK / Power Good Output (PG Signal)',
        source: 'IC Giám Sát Nguồn (Chân PGO)',
        destination: 'Dây xám (Chân 8 giắc 24-Pin) tới bo mạch chủ (Mainboard)',
        voltage: '+5.0V (Logic HIGH)',
        delayMs: '100ms - 500ms (Chuẩn ATX quy định)',
        description: 'Khi mọi điện thế đã hoàn toàn ổn định và duy trì chuẩn xác trên 100ms, IC Supervisor nhả chân PWR_OK từ 0V lên 5V báo bo mạch chủ bắt đầu hoạt động.',
        failureSymptom: 'Tất cả các mức điện áp 12V, 5V, 3.3V đo đủ nhưng dây xám PWR_OK vẫn là 0V; mainboard cắm vào quạt quay nhưng không bao giờ lên hình khởi động.'
      }
    ]
  },
  {
    id: 'seq-psu-tl494',
    title: 'Chuỗi khởi động Nguồn ATX Phổ Thông (TL494 / KA7500 Half-Bridge Push-Pull)',
    category: 'psu',
    platform: 'Nguồn ATX văn phòng truyền thống (Topology: Half-Bridge BJT MJE13007/13009 + Biến áp tự kích + IC TL494 / KA7500)',
    stages: [
      {
        order: 1,
        signalName: '220VAC -> Nắn Dòng Nhân Đôi / Cầu Diode -> Tụ Lọc 310VDC',
        source: 'Điện lưới qua Cầu chì -> NTC -> Cầu Diode 4 chân',
        destination: 'Cặp tụ lọc nguồn chính 200V mắc nối tiếp (Tạo điểm giữa 155VDC)',
        voltage: '~310VDC tổng (~155VDC mỗi tụ)',
        delayMs: '0 - 5ms',
        description: 'Điện áp 220VAC được nắn thành 310VDC tích trữ trên 2 tụ lọc lớn (330uF-680uF/200V mắc nối tiếp), tạo ra điểm Mass ảo (Center Tap) 155V cho sơ đồ Half-Bridge.',
        failureSymptom: 'Nổ cầu chì đứt dây dẫn, tụ lọc bị phù nổ hoặc 2 tụ bị lệch áp nghiêm trọng (một bên 220V, một bên 90V) do khô đứt trở cân bằng 150k-330k.'
      },
      {
        order: 2,
        signalName: 'Mạch Dao Động Tự Kích Standby (Transistor C945 / 13003 / 2N60)',
        source: 'Mạch nguồn phụ tự kích nghẹt (Blocking Oscillator)',
        destination: 'Biến áp xung phụ (Standby Transformer EE-16 / EE-19)',
        voltage: 'Tạo xung tự kích cao tần 50kHz - 100kHz',
        delayMs: '5 - 20ms',
        description: 'Điện trở mồi cấp dòng khởi động cho transistor công suất nhỏ tự kích dao động, biến áp xung phụ làm việc ngay khi cắm điện lưới.',
        failureSymptom: 'Nguồn phụ không dao động: kiểm tra đứt trở mồi (150k-560k), hỏng transistor mồi hoặc chập tụ hóa 10uF/50V ở chân B của sò công suất.'
      },
      {
        order: 3,
        signalName: '+5VSB Output & VCC Aux Power',
        source: 'Thứ cấp biến áp phụ qua Diode nắn -> IC ổn áp 7805',
        destination: 'Dây tím (+5VSB chân 9) & Chân VCC 12V nuôi IC TL494 & Driver biến áp đảo pha',
        voltage: '+5VSB (5.0V) và VCC Aux (~12V - 20V)',
        delayMs: '10 - 30ms',
        description: 'Biến áp phụ sinh ra đường 5VSB nuôi bo mạch chủ qua IC 7805, đồng thời sinh đường 12V-20V để chuẩn bị cấp nguồn nuôi cho IC TL494 và tầng kích biến áp cách ly.',
        failureSymptom: 'Đường 5VSB dâng áp vọt lên 8V-12V làm chết chip bán dẫn trên mainboard do khô tụ lọc chân feedback (pan kinh điển nguồn rẻ tiền khô tụ 10uF).'
      },
      {
        order: 4,
        signalName: 'PS_ON# (Dây Xanh Lá Kích Hoạt)',
        source: 'Mainboard hoặc Chập que đo chân 16 xuống Mass',
        destination: 'Mạch so sánh LM339 hoặc transistor đệm Q (C945)',
        voltage: '4.5V - 5.0V kéo về 0V',
        delayMs: '0ms',
        description: 'Khi chân PS_ON# được kéo xuống 0V, transistor xả điện tích chân 4 (Dead-Time Control - DTC) của IC TL494/KA7500 từ mức cao (>3.5V) tụt xuống 0V.',
        failureSymptom: 'Chân PS_ON kéo mass nhưng chân 4 của TL494 vẫn giữ ở mức cao trên 3.5V khiến bộ điều chế độ rộng xung bị khóa hoàn toàn, nguồn không chạy.'
      },
      {
        order: 5,
        signalName: 'TL494 PWM Oscillator & Driver Stage (C945 Push-Pull)',
        source: 'IC TL494 / KA7500 (Chân 8 & Chân 11 xuất xung lệch pha 180 độ)',
        destination: 'Cặp transistor lái đệm C945 -> Biến áp cách ly kích lái (Driver Transformer EE-16)',
        voltage: 'Xung vuông đối xứng tần số 30kHz - 50kHz',
        delayMs: '5 - 10ms',
        description: 'IC TL494 tạo 2 xung vuông đảo pha nhau qua chân 8 và 11, điều khiển 2 transistor C945 đóng cắt cuộn sơ cấp biến áp kích để lái cặp sò công suất lớn.',
        failureSymptom: 'Chết một trong hai transistor C945 lái biến áp đảo pha, mất xung tại chân B của sò công suất khiến nguồn không kích được hoặc nổ sò ngay khi mở tải.'
      },
      {
        order: 6,
        signalName: 'Half-Bridge Power Stage Switching (Cặp Sò BJT MJE13007/13009)',
        source: 'Cặp sò công suất BJT MJE13007/13009 (hoặc 2SC2625)',
        destination: 'Biến áp lực chính (Main Power Transformer EI-28 / EI-33)',
        voltage: 'Đóng cắt dòng điện 310VDC qua tụ lọc 1uF/250V và sơ cấp biến áp',
        delayMs: '2 - 5ms',
        description: 'Cặp BJT công suất cao đóng ngắt luân phiên theo cấu hình nửa cầu (Half-Bridge), đẩy kéo năng lượng qua cuộn sơ cấp biến áp lực chính.',
        failureSymptom: 'Chập chết nổ cặp sò BJT MJE13007 kéo theo đứt điện trở phân cực chân B (2.2 ôm - 10 ôm) và nổ cầu chì chính do chạm tải thứ cấp.'
      },
      {
        order: 7,
        signalName: 'Secondary Rectification & Filtering (+12V, +5V, +3.3V, -12V)',
        source: 'Các cuộn thứ cấp biến áp chính -> Cụm Diode Schottky đôi (SBL2040, SBL3040, F16C20)',
        destination: 'Cuộn cảm dây xuyến chung (Toroid Choke) & Tụ hóa lọc nguồn đầu ra',
        voltage: '+12V (Vàng), +5V (Đỏ), +3.3V (Cam, qua mạch từ tính Mag-Amp), -12V (Xanh dương)',
        delayMs: '5 - 15ms',
        description: 'Các Diode Schottky đôi nắn toàn kỳ dòng xung cao tần; cuộn cảm xuyến chung cân bằng từ thông chống lệch áp giữa đường 12V và 5V, nạp điện cho các dàn tụ hóa đầu ra.',
        failureSymptom: 'Phù hàng loạt tụ hóa đầu ra (1000uF - 2200uF) làm điện áp bị gợn sóng nhiễu cao khiến máy tính treo ngẫu nhiên hoặc tự khởi động lại.'
      },
      {
        order: 8,
        signalName: 'Power Good Output (PG - Dây Xám)',
        source: 'Mạch trễ transistor & IC so áp LM339 / TPS3510 / Chân Op-Amp thứ 2 TL494',
        destination: 'Dây xám (Chân 8 giắc 24-Pin ATX)',
        voltage: '+5.0V (Logic HIGH)',
        delayMs: '100ms - 400ms',
        description: 'Mạch so áp kiểm tra các đường +5V và +12V đã đủ biên độ, nạp điện cho tụ trễ để đưa tín hiệu PG lên mức cao 5V cho phép máy tính khởi động.',
        failureSymptom: 'Các đường nguồn đo đủ nhưng dây xám vẫn 0V do rỉ tụ trễ PG (thường là tụ 1uF-10uF/50V nối mass) hoặc chết transistor xuất áp PG.'
      }
    ]
  }
];
