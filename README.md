# 🌾 Cozy Farm RPG Online (Nông Trại Vui Vẻ & Đạo Tặc)

Game nông trại 2D thời gian thực mang phong cách ấm áp (Cozy Avatar TeaMobi Aesthetic), chạy trực tiếp trên nền tảng Web với đồ họa pixel tươi sáng, cơ chế chăm sóc cây trồng sống động, chế độ tự do sắp xếp bố cục trang trại và bộ điều khiển cảm ứng dành riêng cho Mobile.

---

## ✨ Điểm Nổi Bật Của Trò Chơi

- **🌻 Khu Vườn Nông Trại Chuẩn Tỉ Lệ Avatar**: 16 ô đất nhỏ gọn (46x33px) liền kề nhau, có hàng rào gỗ bao quanh, cây táo trĩu quả, cối xay gió, đàn gà mẹ gà con mổ thóc, chú bò sữa nhai cỏ và ao cá với vịt bơi lội sóng nước lăn tăn.
- **🌱 Hệ Thống Nông Nghiệp Thời Gian Thực**:
  - ⛏️ **Cuốc đất** xới tơi xốp.
  - 💧 **Tưới nước** giữ ẩm cho đất.
  - 🌾 **Gieo hạt**: Lúa mì, Củ cải, Cà rốt, Dâu tây.
  - ⏳ **Chu kỳ sinh trưởng**: Mầm cây -> Phát triển -> Chín rộ (`✨Chín`).
  - 🧺 **Thu hoạch**: Tích lũy nông sản, nhận Vàng và điểm kinh nghiệm (EXP).
- **🧑‍🌾 Chọn Nhân Vật & Đăng Ký**: Lựa chọn Nông Dân Nam hoặc Nông Dân Nữ với hình ảnh động (Sprite Animations) chuyển động mượt mà.
- **🛠️ Tự Do Sắp Xếp Trang Trại (Farm Layout Customization)**:
  - Bật chế độ sắp xếp bằng phím **`B`** hoặc nút **🛠️**.
  - Kéo thả tự do: Nhà chính, Chuồng bò (bò tự bám theo), Chuồng gà (gà con tự đi theo), Ao cá, Giếng nước, Thùng giao hàng, Chó canh nhà và **toàn bộ cụm 16 ô đất**.
  - Tự động bắt dính tọa độ (10px Grid Snap), phân lớp chiều sâu (Y-depth sorting) và lưu trực tiếp vào database.
- **📱 Hỗ Trợ Đầy Đủ Cho Mobile & Tablet**:
  - Tự động nhận diện thiết bị di động.
  - **Phím điều hướng ảo (Virtual D-Pad)** vuốt trượt 8 hướng mượt mà.
  - **Nút Thao Tác Nông Trại Lớn** tự động đổi icon theo nông cụ/hạt giống đang chọn và phát sáng khi đứng gần ô đất chín.
  - **Nút Chạy Nhanh (Sprint Mode)** tiện lợi.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js, Express.js, WebAssembly SQLite (`sql.js`), JSON Web Token (JWT), bcryptjs.
- **Frontend**: HTML5, Vanilla CSS Glassmorphism, Phaser 3 Game Engine (Arcade Physics, TileSprite, Tweens, Particles).
- **Database**: SQLite WebAssembly hỗ trợ ACID, Indexing và lưu trữ JSON layout bền vững.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Game

### 1. Cài đặt Dependencies:
```bash
npm install
```

### 2. Khởi chạy máy chủ:
```bash
npm start
# Hoặc: node server/src/app.js
```

### 3. Trải nghiệm game:
Mở trình duyệt và truy cập:
```
http://localhost:3005
```

---

## 🎮 Phím Tắt Điều Khiển

| Phím | Hành Động |
|---|---|
| **W, A, S, D** hoặc **Phím Mũi Tên** | Di chuyển nhân vật nông dân |
| **Shift** (hoặc nút **🏃**) | Chạy nhanh (Sprint) |
| **Space** hoặc **E** (hoặc nút **⚡**) | Thao tác trên ô đất gần nhất |
| **Phím 1 - 6** | Chọn nhanh nông cụ / hạt giống trên Hotbar |
| **B** (hoặc nút **🛠️**) | Bật / Tắt chế độ Sắp Xếp Bố Cục Trang Trại |
| **M** (hoặc nút **🎮**) | Bật / Tắt Phím Ảo Điều Khiển Cho Mobile |
| **I** (hoặc nút **🎒**) | Mở Túi Đồ & Kho Nông Sản |

---

## 📜 Giấy Phép
Dự án được xây dựng phục vụ học tập, giải trí và phát triển game cộng đồng.
