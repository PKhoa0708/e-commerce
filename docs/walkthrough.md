# Báo Cáo Nghiệm Thu Hệ Thống UrbanCart (UrbanCart Walkthrough)

Tính năng **Xác thực (Auth)**, **Trang chủ & Danh mục Sản phẩm (Home Page Catalog & Banner Slider)** và **Lọc Danh mục động (Category Filtering)** cho hệ thống thương mại điện tử **UrbanCart** đã được xây dựng thành công trọn vẹn từ Frontend, API Backend đến cơ sở dữ liệu MongoDB.

---

## 📸 Video & Hình Ảnh Thực Tế Hệ Thống

### 1. Video hoạt động thực tế của tính năng Lọc Danh mục Sản phẩm
Dưới đây là video ghi lại quá trình robot tự động kiểm thử (Browser Subagent) thao tác kiểm tra các nhãn danh mục trên thẻ sản phẩm, nhấp chọn bộ lọc "Giày dép" và "Phụ kiện" để kiểm tra tính năng lọc sản phẩm động:

![Category Filter Walkthrough](C:/Users/khoa.pham1/.gemini/antigravity-ide/brain/faeb2f31-e19c-4d69-a396-848057f20833/category_filter_test_1780994905737.webp)

### 2. Video hoạt động của Banner Slider & Lưới sản phẩm ban đầu
Robot tự động kiểm thử cuộn trang và trượt Banner Slider trên trang chủ:

![Home Page Walkthrough](C:/Users/khoa.pham1/.gemini/antigravity-ide/brain/faeb2f31-e19c-4d69-a396-848057f20833/home_page_test_1780994450683.webp)

---

## 🛠️ Các Thành Phần Đã Xây Dựng & Cập Nhật

### 1. Hiển thị danh mục trên từng sản phẩm (Product Card Category Label)
- Cập nhật [Home.jsx](file:///C:/New%20folder/frontend/src/pages/Home.jsx): Thêm một thẻ text hiển thị tên danh mục chữ in hoa màu cam đặc trưng (`#e47937`) nổi bật nằm ngay trên tiêu đề của mỗi thẻ sản phẩm. Điều này giúp giao diện chuyên nghiệp và rõ ràng hơn.

### 2. Logic Lọc Sản phẩm Động theo Danh mục (Dynamic Category Filtering)
- Cập nhật React state `activeCategory` trong [Home.jsx](file:///C:/New%20folder/frontend/src/pages/Home.jsx) với giá trị mặc định là `"Tất cả"`.
- Liên kết các nút danh mục bộ lọc nhanh ở thanh ngang bao gồm: **Tất cả**, **Thời trang**, **Giày dép**, **Phụ kiện**.
- Khi người dùng nhấp chọn một danh mục:
  - Cập nhật màu sắc nút bấm thành nền cam chữ trắng nổi bật, các nút còn lại có nền trắng viền xám nhạt tinh tế.
  - Tự động kích hoạt bộ lọc ở Frontend: Lọc danh sách sản phẩm lấy về từ API khớp với danh mục được chọn (hỗ trợ kiểm tra linh hoạt, ví dụ danh mục *"Thời trang"* sẽ khớp với các sản phẩm có danh mục *"Thời trang Nam"* trong Database).
- Phối hợp mượt mà với ô tìm kiếm trên Header: Cho phép người dùng vừa gõ tìm kiếm vừa bấm lọc danh mục cùng lúc.

---

## 🧪 Kết Quả Kiểm Thử Hệ Thống

Bộ kiểm thử tự động của trình duyệt đã thực hiện kiểm tra 3 tình huống lọc danh mục và cho kết quả chính xác 100%:
1. **Mặc định (Tất cả):** Hiển thị toàn bộ 10 sản phẩm mẫu được seeded trong MongoDB.
2. **Khi chọn "Giày dép":** Lưới sản phẩm lập tức cập nhật chỉ hiển thị **Giày Sneakers Trắng Đô Thị** (danh mục trong DB: *Giày dép*).
3. **Khi chọn "Phụ kiện":** Lưới sản phẩm cập nhật chỉ hiển thị đúng 4 sản phẩm phụ kiện: *Balo laptop*, *Mũ lưỡi trai*, *Kính mát phi công*, và *Đồng hồ thông minh*.
