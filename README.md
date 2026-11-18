# CircuitMedic — Trạm Chẩn Đoán & Sửa Chữa Mainboard PC / VGA / Nguồn ATX / Bo Nhúng

**CircuitMedic** là ứng dụng web tĩnh (100% Static Web App, chạy hoàn toàn trên trình duyệt, không cần backend hay trả phí API) được thiết kế với **2 chế độ giao diện Sáng / Tối dịu mắt (Nordic Slate & Daylight Lab)** dành cho kỹ thuật viên sửa chữa phần cứng máy tính, card đồ họa rời, bộ nguồn ATX và bo mạch nhúng Open Hardware.

### Điểm mới trên phiên bản v1.2
- **12 Bo Mạch Thuộc 4 Phân Loại**: Nhúng & SBC (`Arduino Uno Rev3`, `Raspberry Pi Pico`, `Raspberry Pi 4 Model B`), Card Đồ Họa (`NVIDIA GeForce GTX 1080 Ti Reference PG611`), 4 Mainboard Desktop (`ASUS ROG Strix B760-F`, `Gigabyte B660M DS3H`, `MSI MAG B550 Tomahawk`, `ASRock H81M-DGS`) và 4 Nguồn ATX (`Corsair RM750x`, `Seasonic Focus GX-650`, `Cooler Master MWE 650 V2`, `Nguồn ATX TL494`).
- **6 Ảnh Thực Tế PCB Xác Thực (Wikimedia Commons)**: Khoanh vùng trực tiếp linh kiện, vẽ đường dò thông mạch Airwire và tích hợp **kính lúp soi mạch 2.5×** trên ảnh chụp thật; hỗ trợ tải ảnh & dán ảnh từ Clipboard (`Ctrl+V`).
- **Minh Bạch Tư Liệu & Để Trống Trung Thực**: Phân biệt rõ *Schematic chính thức*, *Sơ đồ khối tham chiếu IC*, và tự động **để trống** ảnh chụp / Schematic / mô phỏng 3D khi hãng bảo mật NDA hoặc chưa có nguồn bản quyền mở.
- **Bố Cục Thoáng & Dịu Mắt**: Sơ đồ nguyên lý hỗ trợ nền **Giấy Trắng PDF**, thanh công cụ 3D neo cố định không che khuất mô hình, Workbench đồng bộ không trùng thanh lọc.

---

## Tính năng nổi bật

1. **Workbench Song Song (Dual Split-View)**
   - Hiển thị đồng bộ **Sơ đồ nguyên lý (Schematic)** bên trái và **Mô phỏng 3D / BoardView ảnh chụp** bên phải.
   - Nhấp vào bất kỳ MOSFET, IC PWM, cuộn cảm hay đường nguồn nào trên sơ đồ sẽ lập tức đồng bộ highlight và điều hướng camera đến đúng vị trí linh kiện đó ở chế độ 3D / 2D.
2. **Quét & Nhận Diện Bo Mạch (Board Scanner)**
   - Tải ảnh chụp thực tế hoặc dùng camera để khoanh vùng khu vực VRM, chipset, tụ phồng, mạch sơ cấp/thứ cấp và đối chiếu nhanh với bo mạch mẫu.
3. **Sơ Đồ Nguyên Lý Tương Tác (Interactive Schematic)**
   - Dò đường mạch nguồn (`+12V`, `+5VSB`, `+VCORE`, `390VDC_PFC`, `PSON#`, `PWR_OK`...), hiển thị chân đo và luồng tín hiệu.
4. **Mô Phỏng 3D & Camera Nhiệt FLIR (Three.js 60fps)**
   - Dựng hình 3D đa lớp PCB, linh kiện chuẩn công nghiệp (DrMOS, cuộn cảm R22/Toroid, tụ rắn/tụ lọc nguồn chính, biến áp xung, optocoupler...), hiệu ứng dòng điện chạy theo đường mạch, tách lớp Exploded View và chế độ **Camera Nhiệt (Thermal IR)** làm nổi bật điểm nóng khi chập mạch.
5. **BoardView Ảnh Chụp & Điểm Đo (Photo BoardView)**
   - Bản đồ 2D top-down với các phân vùng chức năng và thông số đo nguội (Diode Mode), đo trở kháng, đo áp chuẩn.
6. **Chẩn Đoán Pan Bệnh Từng Bước & Chuỗi Kích Nguồn (Power Sequence)**
   - Hướng dẫn dò lỗi từng bước cho các pan kinh điển: kích ngắt, mất `VCORE`, mất `5VSB`, sập áp PFC, nổ cầu chì sơ cấp, không xuất `PWR_OK`... kèm bảng tra cứu linh kiện & trình tự kích nguồn Intel / AMD / ATX PSU.

---

## Chạy thử trên máy cá nhân (Local Development)

Yêu cầu: **Node.js 18+** (khuyến nghị Node 20).

```bash
npm install
npm run dev
```

Build bản tĩnh để kiểm tra trước khi deploy:

```bash
npm run build
npm run preview
```

---

## Triển khai miễn phí 100% trên Internet (Free Static Hosting)

Ứng dụng cấu hình sẵn `base: './'` trong `vite.config.ts`, tương thích hoàn toàn với mọi nền tảng lưu trữ tĩnh miễn phí:

### 1. GitHub Pages (Tự động qua GitHub Actions)
- Repository đã tích hợp sẵn workflow `.github/workflows/deploy.yml`.
- Đẩy code lên nhánh `main` trên GitHub.
- Vào **Settings → Pages → Source**, chọn **GitHub Actions**.
- Sau ~1 phút, trang web sẽ chạy trực tuyến miễn phí tại `https://<ten-tai-khoan>.github.io/<ten-repo>/`.

### 2. Cloudflare Pages (Miễn phí không giới hạn băng thông)
- Kết nối repo GitHub trên [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages → Create → Pages**.
- Cấu hình build:
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`

### 3. Vercel (1-Click Deploy)
- File `vercel.json` đã được cấu hình sẵn SPA rewrite.
- Kết nối repo trên [vercel.com](https://vercel.com) hoặc chạy lệnh `npx vercel --prod`.

### 4. Netlify
- Kéo thả thư mục `dist/` sau khi chạy `npm run build` vào [app.netlify.com/drop](https://app.netlify.com/drop), hoặc kết nối Git với Build command `npm run build` và Publish directory `dist`.

---

## Lưu ý an toàn điện tử
Khi thao tác thực tế trên **Nguồn ATX (PSU)** khu vực sơ cấp (cầu chì, cầu diode, tụ lọc chính `C_BULK`, MOSFET PFC), điện áp DC có thể đạt **310V – 400VDC** và tụ vẫn tích điện ngay cả khi đã rút phích cắm. Luôn xả tụ qua bóng đèn sợi đốt / điện trở công suất và sử dụng biến áp cách ly trước khi đo đạc trực tiếp.
