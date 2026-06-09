# Kế hoạch Triển khai Màn hình Trang chủ & Danh mục Sản phẩm (UrbanCart Home & Catalog)

Bản kế hoạch này mô tả các bước chi tiết để xây dựng trang chủ thương mại điện tử UrbanCart, bao gồm:
1. Tạo cơ sở dữ liệu sản phẩm mẫu (Seed data).
2. Xây dựng API Backend lấy danh sách sản phẩm.
3. Thiết kế giao diện Frontend React + Tailwind CSS cho trang chủ (`Home.jsx`), bao gồm cả Header, Banner Slider động tự thiết kế và lưới sản phẩm (Product Grid).

---

## Các thay đổi đề xuất (Proposed Changes)

### 1. Database & Backend API

#### [NEW] seedProducts.js (backend/config/seedProducts.js)
- Tạo một module chứa 8-10 sản phẩm mẫu (dummy products) chất lượng cao bao gồm đầy đủ các trường: `name`, `description`, `price`, `category`, `images` (sử dụng link ảnh Unsplash chất lượng cao ổn định), `variants` (`sizes`, `colors`), `stockQuantity`, và `rating`.
- Viết logic kiểm tra: nếu Collection `products` đang rỗng, tự động chèn dữ liệu mẫu này vào.

#### [MODIFY] server.js (backend/server.js)
- Import và thực thi hàm `seedProducts` ngay sau khi kết nối cơ sở dữ liệu thành công.
- Đăng ký bộ định tuyến sản phẩm mới tại `/api/products`.

#### [NEW] productController.js (backend/controllers/productController.js)
- Viết logic điều khiển `getProducts`:
  - Truy vấn tất cả sản phẩm từ Collection `products` trong MongoDB và trả về dưới dạng JSON cho Frontend.

#### [NEW] productRoutes.js (backend/routes/productRoutes.js)
- Định nghĩa định tuyến: `GET /api/products` -> `getProducts` controller.

---

### 2. Frontend Homepage & Banner Slider

#### [NEW] Home.jsx (frontend/src/pages/Home.jsx)
Xây dựng giao diện Trang chủ hoàn chỉnh, đồng bộ 100% về phong cách thiết kế:
1. **Header**:
   - Logo UrbanCart SVG (giống trang Đăng nhập/Đăng ký).
   - Thanh tìm kiếm (Search Bar) bo góc tròn phong cách tối giản.
   - Biểu tượng Giỏ hàng hiển thị huy hiệu (badge) số lượng sản phẩm.
2. **Khu vực Banner Slider động (Custom Touch Slider)**:
   - Tích hợp 5 banner mua sắm đô thị (sử dụng các link ảnh Unsplash đẹp phối hợp tone màu Cam - Xanh Navy của UrbanCart).
   - Thiết kế thuật toán chuyển ảnh động bằng React state:
     - Tự động chuyển ảnh sau mỗi 4 giây (Autoplay) sử dụng `setInterval`.
     - Tự động tạm dừng chuyển khi người dùng rê chuột vào hoặc chạm giữ trên di động (`onMouseEnter`/`onTouchStart`).
     - Hỗ trợ vuốt màn hình (Swipe/Touch) trên di động (`onTouchStart`, `onTouchEnd`) và kéo chuột trên máy tính (`onMouseDown`, `onMouseUp`, `onMouseLeave`) để chuyển slide mượt mà.
     - Có 2 nút mũi tên trái/phải ẩn/hiện tinh tế trên Desktop.
     - Dải chấm tròn nhỏ (Pagination Dots) biểu diễn vị trí ảnh hiện tại.
3. **Lưới sản phẩm (Product Grid)**:
   - Lấy dữ liệu sản phẩm từ API Backend `/api/products` qua Fetch API.
   - Hiển thị danh sách sản phẩm dạng thẻ Card bo góc tinh tế, ảnh sản phẩm chất lượng cao, tên sản phẩm, giá tiền màu cam và xếp hạng sao.
   - Khi bấm vào thẻ sản phẩm, điều hướng sang route `/product/:id`.

#### [MODIFY] AppRoutes.jsx (frontend/src/routes/AppRoutes.jsx)
- Thay thế component placeholder `HomeSkeleton` bằng trang `Home` mới xây dựng.

---

## Kế hoạch Kiểm thử & Nghiệm thu (Verification Plan)

### 1. Kiểm tra Backend & Database Seeding
- Khởi động server (sử dụng concurrently qua `npm run dev`).
- Kiểm tra log terminal để đảm bảo kết nối MongoDB thành công và log seeding sản phẩm chạy thành công nếu DB trống.
- Mở MongoDB Compass để xác nhận 8-10 sản phẩm mẫu được chèn thành công trong collection `products`.
- Thử nghiệm gọi API `http://localhost:5000/api/products` xem có trả về danh sách sản phẩm đầy đủ hay không.

### 2. Kiểm tra Frontend & Slider
- Mở trình duyệt tại `http://localhost:5173/`.
- Kiểm tra hiển thị của Slider:
  - Tự động lướt slide sau mỗi 4 giây.
  - Tạm dừng autoplay khi rê chuột vào hoặc nhấn giữ.
  - Bấm mũi tên trái/phải và dấu chấm tròn ở dưới xem slide có chuyển chính xác không.
  - Vuốt trên di động và kéo chuột trên máy tính để lướt slide.
- Kiểm tra hiển thị của Lưới sản phẩm:
  - Danh sách sản phẩm được load chính xác từ API Backend.
  - Bố cục responsive hoàn chỉnh (lưới hiển thị 1-2 cột trên mobile, 3-4 cột trên máy tính).
  - Bấm vào một sản phẩm xem có điều hướng chính xác về trang chi tiết sản phẩm dạng skeleton `/product/:id` hay không.
