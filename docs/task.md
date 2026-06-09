# Danh sách công việc triển khai Trang chủ & Danh mục Sản phẩm (Home Page & Catalog)

- [x] Cấu hình Backend, Database Seeding & API
    - [x] Tạo file seed dữ liệu `/backend/config/seedProducts.js`
    - [x] Cập nhật `/backend/server.js` để tự động chạy seeding và liên kết route sản phẩm
    - [x] Viết bộ điều khiển `/backend/controllers/productController.js` (lấy danh sách sản phẩm)
    - [x] Viết bộ định tuyến `/backend/routes/productRoutes.js`
- [x] Triển khai Frontend & Custom Slider
    - [x] Xây dựng màn hình `/frontend/src/pages/Home.jsx` hoàn chỉnh (Header, Slider Banner động tự thiết kế, Lưới sản phẩm)
    - [x] Cập nhật bộ định tuyến `/frontend/src/routes/AppRoutes.jsx` để nhúng trang `Home`
- [x] Kiểm thử & Xác nhận
    - [x] Kiểm tra cơ sở dữ liệu MongoDB chứa dữ liệu sản phẩm mẫu đã seeded
    - [x] Kiểm tra API `GET /api/products` qua trình duyệt/Fetch
    - [x] Kiểm thử giao diện trang chủ hoạt động mượt mà (chuyển slide autoplay, vuốt lướt, chuyển trang chi tiết sản phẩm)
