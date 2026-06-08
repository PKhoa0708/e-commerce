SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `carts` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 3, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(2, 4, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(3, 5, '2026-03-21 08:35:07', '2026-03-21 08:35:07'),
(4, 6, '2026-03-21 09:02:38', '2026-03-21 09:02:38'),
(6, 8, '2026-03-22 11:38:17', '2026-03-22 11:38:17');

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `created_at`, `updated_at`) VALUES
(2, 1, 3, 1, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(3, 2, 4, 2, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(15, 3, 4, 2, '2026-03-26 14:39:00', '2026-03-26 14:39:11'),
(17, 3, 3, 1, '2026-03-26 14:45:16', '2026-03-26 14:45:16'),
(18, 3, 2, 1, '2026-03-26 14:45:47', '2026-03-26 14:45:47'),
(19, 3, 6, 1, '2026-03-26 14:45:55', '2026-03-26 14:45:55');

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name`, `description`, `status`, `created_at`) VALUES
(1, 'Rau củ', 'Các loại rau củ tươi sạch', 0, '2026-03-21 06:29:08'),
(2, 'Trái cây', 'Các loại trái cây nhập khẩu và nội địa', 0, '2026-03-21 06:29:08'),
(3, 'Đồ uống', 'Nước ngọt, sữa, nước ép', 0, '2026-03-21 06:29:08'),
(4, 'Thực phẩm khô', 'Mì gói, gạo, gia vị', 0, '2026-03-21 06:29:08'),
(5, 'Đồ gia dụng', 'Sản phẩm gia dụng cho gia đình', 0, '2026-03-21 06:29:08'),
(6, 'Thời trang & phụ kiện', 'Quần áo, giày dép, túi xách, đồng hồ, phụ kiện thời trang', 1, '2026-03-21 09:35:11'),
(7, 'Mỹ phẩm & chăm sóc cá nhân', 'Mỹ phẩm, sữa rửa mặt, dầu gội, kem dưỡng, đồ chăm sóc cơ thể', 1, '2026-03-21 09:35:11'),
(8, 'Đồ ăn vặt & thực phẩm khô', 'Bánh kẹo, snack, hạt, mì, thực phẩm đóng gói khô', 1, '2026-03-21 09:35:11'),
(9, 'Hàng tiêu dùng nhanh', 'Nước giặt, giấy vệ sinh, nước rửa chén, vật dụng thiết yếu hằng ngày', 1, '2026-03-21 09:35:11'),
(10, 'Phụ kiện công nghệ', 'Tai nghe, cáp sạc, chuột, bàn phím, pin dự phòng, phụ kiện điện tử', 1, '2026-03-21 09:35:11'),
(11, 'Văn phòng phẩm & đồ học tập', 'Bút, vở, giấy, thước, dụng cụ học tập và văn phòng', 1, '2026-03-21 09:35:11'),
(12, 'Đồ công nghệ', 'Điện thoại, laptop, máy tính bảng, thiết bị điện tử', 1, '2026-03-21 09:36:58');

CREATE TABLE `chat_conversations` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_conversations` (`id`, `customer_id`, `staff_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 5, 2, 'open', '2026-03-21 17:44:32', '2026-03-21 17:45:56'),
(2, 6, 2, 'open', '2026-03-22 08:28:25', '2026-03-26 15:46:35');

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_messages` (`id`, `conversation_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 5, 'alo babi', 1, '2026-03-21 17:45:27'),
(2, 1, 5, 'rep đê', 1, '2026-03-21 18:02:45'),
(3, 1, 5, '.', 1, '2026-03-21 18:08:35'),
(4, 1, 5, '.', 1, '2026-03-21 18:08:35'),
(5, 1, 5, '.', 1, '2026-03-21 18:08:36'),
(6, 1, 5, '.', 1, '2026-03-21 18:08:37'),
(7, 1, 2, 'hello', 1, '2026-03-21 18:08:52'),
(8, 1, 2, ',,,', 1, '2026-03-21 18:08:55'),
(9, 2, 6, 'hi', 1, '2026-03-22 08:28:28'),
(10, 1, 5, 'huuuu', 1, '2026-03-26 15:47:56');

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `favorites` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(2, 3, 3, '2026-03-21 06:29:08'),
(3, 4, 4, '2026-03-21 06:29:08');

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_code` varchar(50) NOT NULL,
  `receiver_name` varchar(100) NOT NULL,
  `receiver_phone` varchar(20) NOT NULL,
  `shipping_address` text NOT NULL,
  `note` text DEFAULT NULL,
  `payment_method` enum('COD','Chuyển khoản') NOT NULL DEFAULT 'COD',
  `payment_status` enum('Chưa thanh toán','Đã thanh toán','Đã hoàn tiền') NOT NULL DEFAULT 'Chưa thanh toán',
  `order_status` enum('Chờ xác nhận','Đã xác nhận','Đang chuẩn bị','Đang giao','Đã giao','Đã hoàn thành','Đã hủy') NOT NULL DEFAULT 'Chờ xác nhận',
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cancelled_by` int(11) DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` (`id`, `user_id`, `order_code`, `receiver_name`, `receiver_phone`, `shipping_address`, `note`, `payment_method`, `payment_status`, `order_status`, `subtotal`, `shipping_fee`, `total_amount`, `cancelled_by`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, 3, 'DH001', 'Nguyễn Văn A', '0900000003', 'Hà Nội', 'Giao giờ hành chính', 'COD', 'Chưa thanh toán', 'Chờ xác nhận', 135000.00, 15000.00, 150000.00, NULL, NULL, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(2, 4, 'DH002', 'Trần Thị B', '0900000004', '123 Lê Lợi, Đà Nẵng', '', 'COD', 'Đã thanh toán', 'Đã hoàn thành', 64000.00, 15000.00, 79000.00, NULL, NULL, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(3, 3, 'DH003', 'Nguyễn Văn A', '0900000003', 'Hà Nội', 'Khách yêu cầu hủy', 'COD', 'Chưa thanh toán', 'Đã hủy', 50000.00, 15000.00, 65000.00, 3, 'Khách đổi ý', '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(5, 5, 'DH1774124096', 'Nguyễn Văn A', '0111111111', 'zz', '', 'COD', '', 'Chờ xác nhận', 30000000.00, 15000.00, 30015000.00, NULL, NULL, '2026-03-21 20:14:56', '2026-03-21 20:14:56'),
(6, 5, 'DH1774124685', 'Nguyễn Văn A', '0111111111', 'cccc', '', 'COD', '', 'Chờ xác nhận', 10000000.00, 15000.00, 10015000.00, NULL, NULL, '2026-03-21 20:24:45', '2026-03-21 20:24:45'),
(7, 5, 'DH1774126299', 'Nguyễn Văn A', '0111111111', '11111', '', 'COD', '', 'Chờ xác nhận', 450000.00, 0.00, 450000.00, NULL, NULL, '2026-03-21 20:51:39', '2026-03-21 20:51:39'),
(8, 5, 'DH1774126334', 'Nguyễn Văn A', '0111111111', 'ccc', '', 'COD', '', 'Đã hoàn thành', 13500.00, 30000.00, 43500.00, NULL, NULL, '2026-03-21 20:52:14', '2026-03-22 10:47:02'),
(9, 5, 'DH1774127350', 'Nguyễn Văn A', '0111111111', 'zzz', '', 'COD', 'Đã thanh toán', 'Đã hoàn thành', 160000000.00, 0.00, 160000000.00, NULL, NULL, '2026-03-21 21:09:10', '2026-03-22 10:47:16'),
(10, 5, 'DH1774166831', 'Nguyễn Văn A', '0111111111', 'Số nhà xx, phường xx, thành phố xx', '', 'COD', '', 'Đã hủy', 1800000.00, 0.00, 1800000.00, 5, 'Đổi địa chỉ giao hàng', '2026-03-22 08:07:11', '2026-03-22 08:17:20'),
(11, 6, 'DH1774168164', 'Nguyễn Văn A', '0123456789', 'Số nhà yy, phường xx, thành phố yy', '', 'COD', '', 'Đã hoàn thành', 4500.00, 30000.00, 34500.00, NULL, NULL, '2026-03-22 08:29:24', '2026-03-22 10:46:35'),
(12, 6, 'DH1774168208', 'Nguyễn Văn A', '0123456789', 'xx', '', 'COD', 'Chưa thanh toán', 'Đã hủy', 32000.00, 30000.00, 62000.00, NULL, NULL, '2026-03-22 08:30:08', '2026-03-22 09:50:58'),
(13, 6, 'DH1774173157', 'Nguyễn Văn B', '012345678', '111111', '', 'COD', 'Đã thanh toán', 'Đã hoàn thành', 4500.00, 30000.00, 34500.00, NULL, NULL, '2026-03-22 09:52:37', '2026-03-24 15:53:20'),
(14, 5, 'DH1774183026', 'Nguyễn Văn A', '000000000', '1', '', 'COD', 'Chưa thanh toán', 'Đã xác nhận', 32000.00, 30000.00, 62000.00, NULL, NULL, '2026-03-22 12:37:06', '2026-03-24 15:56:24'),
(15, 5, 'DH1774183195', 'Nguyễn Văn A', '0234567891', 'zzzzz', '', 'COD', 'Chưa thanh toán', 'Chờ xác nhận', 32000.00, 30000.00, 62000.00, NULL, NULL, '2026-03-22 12:39:55', '2026-03-22 12:39:55'),
(16, 5, 'DH1774282779', 'Nguyễn Văn A', '0111111111', 'cc', '', 'COD', 'Chưa thanh toán', 'Chờ xác nhận', 32000.00, 30000.00, 62000.00, NULL, NULL, '2026-03-23 16:19:39', '2026-03-23 16:19:39'),
(17, 5, 'DH1774539850', 'Nguyễn Văn A', '0111111111', 'zzz', '', 'COD', 'Chưa thanh toán', 'Chờ xác nhận', 4500.00, 30000.00, 34500.00, NULL, NULL, '2026-03-26 15:44:10', '2026-03-26 15:44:10');

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `product_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `subtotal`, `created_at`) VALUES
(2, 1, 3, 'Táo Mỹ', 85000.00, 1, 85000.00, '2026-03-21 06:29:08'),
(3, 2, 4, 'Sữa tươi không đường', 32000.00, 2, 64000.00, '2026-03-21 06:29:08'),
(5, 5, 7, 'tivi', 10000000.00, 3, 30000000.00, '2026-03-21 20:14:56'),
(6, 6, 7, 'tivi', 10000000.00, 1, 10000000.00, '2026-03-21 20:24:45'),
(7, 7, 6, 'Nồi cơm điện mini', 450000.00, 1, 450000.00, '2026-03-21 20:51:39'),
(8, 8, 5, 'Mì Hảo Hảo', 4500.00, 3, 13500.00, '2026-03-21 20:52:14'),
(9, 9, 7, 'tivi', 10000000.00, 16, 160000000.00, '2026-03-21 21:09:10'),
(10, 10, 6, 'Nồi cơm điện mini', 450000.00, 4, 1800000.00, '2026-03-22 08:07:11'),
(11, 11, 5, 'Mì Hảo Hảo', 4500.00, 1, 4500.00, '2026-03-22 08:29:24'),
(12, 12, 4, 'Sữa tươi không đường', 32000.00, 1, 32000.00, '2026-03-22 08:30:08'),
(13, 13, 5, 'Mì Hảo Hảo', 4500.00, 1, 4500.00, '2026-03-22 09:52:37'),
(14, 14, 4, 'Sữa tươi không đường', 32000.00, 1, 32000.00, '2026-03-22 12:37:06'),
(15, 15, 4, 'Sữa tươi không đường', 32000.00, 1, 32000.00, '2026-03-22 12:39:55'),
(16, 16, 4, 'Sữa tươi không đường', 32000.00, 1, 32000.00, '2026-03-23 16:19:39'),
(17, 17, 5, 'Mì Hảo Hảo', 4500.00, 1, 4500.00, '2026-03-26 15:44:10');

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` enum('COD','Chuyển khoản') NOT NULL DEFAULT 'COD',
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('Đang chờ','Đã thanh toán','Thất bại','Đã hoàn tiền') NOT NULL DEFAULT 'Đang chờ',
  `paid_at` datetime DEFAULT NULL,
  `note` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` (`id`, `order_id`, `payment_method`, `amount`, `payment_status`, `paid_at`, `note`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'COD', 150000.00, 'Đang chờ', NULL, 'Chưa thu tiền', 2, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(2, 2, 'COD', 79000.00, 'Đã thanh toán', '2026-03-21 13:29:08', 'Đã thu tiền khi giao hàng', 2, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(3, 3, 'COD', 65000.00, 'Thất bại', NULL, 'Đơn hàng đã hủy', 2, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(4, 5, 'COD', 30015000.00, 'Đang chờ', NULL, 'Chưa thu tiền', NULL, '2026-03-21 20:14:56', '2026-03-21 20:14:56'),
(5, 6, 'COD', 10015000.00, 'Đang chờ', NULL, 'Chưa thu tiền', NULL, '2026-03-21 20:24:45', '2026-03-21 20:24:45'),
(6, 7, 'COD', 450000.00, 'Đang chờ', NULL, 'Chưa thu tiền', NULL, '2026-03-21 20:51:39', '2026-03-21 20:51:39'),
(7, 8, 'COD', 43500.00, 'Đang chờ', NULL, 'Chưa thu tiền', NULL, '2026-03-21 20:52:14', '2026-03-21 20:52:14'),
(8, 9, 'COD', 160000000.00, 'Đã thanh toán', '2026-03-22 00:39:56', '', 2, '2026-03-21 21:09:10', '2026-03-21 23:39:56'),
(9, 10, 'COD', 1800000.00, 'Thất bại', NULL, 'Khách hàng đã hủy đơn', NULL, '2026-03-22 08:07:11', '2026-03-22 08:17:20'),
(10, 11, 'COD', 34500.00, 'Thất bại', NULL, '', 2, '2026-03-22 08:29:24', '2026-03-22 08:55:02'),
(11, 12, 'COD', 62000.00, '', '2026-03-22 10:33:32', '', 2, '2026-03-22 08:30:08', '2026-03-22 09:50:58'),
(12, 13, 'COD', 34500.00, 'Đã thanh toán', '2026-03-24 16:53:20', '', 2, '2026-03-22 09:52:37', '2026-03-24 15:53:20'),
(13, 14, 'COD', 62000.00, '', NULL, 'Chưa thanh toán', NULL, '2026-03-22 12:37:06', '2026-03-22 12:37:06'),
(14, 15, 'COD', 62000.00, '', NULL, 'Chưa thanh toán', NULL, '2026-03-22 12:39:55', '2026-03-22 12:39:55'),
(15, 16, 'COD', 62000.00, '', NULL, 'Chưa thanh toán', NULL, '2026-03-23 16:19:39', '2026-03-23 16:19:39'),
(16, 17, 'COD', 34500.00, '', NULL, 'Chưa thanh toán', NULL, '2026-03-26 15:44:10', '2026-03-26 15:44:10');

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(200) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `thumbnail` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `sku`, `description`, `price`, `stock_quantity`, `thumbnail`, `is_featured`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(2, 12, 'Bắp cải xanh', 'b-p-c-i-xanh-1774281946', 'SP002', 'Bắp cải xanh tươi ngon mỗi ngày', 18000.00, 80, 'uploads/products/1774281946_8030.jpg', 0, 'active', 2, 2, '2026-03-21 06:29:08', '2026-03-23 16:05:46'),
(3, 12, 'Táo Mỹ', 't-o-m-1774281906', 'SP003', 'Táo Mỹ nhập khẩu giòn ngọt', 85000.00, 50, 'uploads/products/1774281906_8393.jpg', 1, 'active', 2, 2, '2026-03-21 06:29:08', '2026-03-23 16:05:06'),
(4, 12, 'Sữa tươi không đường', 's-a-t-i-kh-ng-ng-1774281846', 'SP004', 'Sữa tươi hộp 1 lít', 32000.00, 116, 'uploads/products/1774281846_5089.webp', 0, 'active', 2, 2, '2026-03-21 06:29:08', '2026-03-23 16:19:39'),
(5, 12, 'Mì Hảo Hảo', 'm-h-o-h-o-1774281778', 'SP005', 'Mì ăn liền tiện lợi', 4500.00, 294, NULL, 0, 'active', 2, 2, '2026-03-21 06:29:08', '2026-03-26 15:44:10'),
(6, 12, 'Nồi cơm điện mini', 'n-i-c-m-i-n-mini-1774281712', 'SP006', 'Nồi cơm điện dung tích nhỏ', 450000.00, 19, '', 0, 'active', 2, 2, '2026-03-21 06:29:08', '2026-03-23 16:01:52'),
(7, 12, 'tivi', 'tivi-1774366688', 'tivi-001', 'Bền đến lúc hỏng', 10000000.00, 0, 'uploads/products/1774086999_2646.png', 0, 'active', 2, 2, '2026-03-21 09:37:36', '2026-03-24 15:38:08');

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `is_main`, `created_at`) VALUES
(7, 7, 'uploads/products/1774086999_2646.png', 1, '2026-03-21 09:56:39'),
(8, 7, 'uploads/products/1774086999_5558.png', 0, '2026-03-21 09:56:39'),
(9, 7, 'uploads/products/1774087661_1413.png', 0, '2026-03-21 10:07:41'),
(10, 7, 'uploads/products/1774087661_9677.png', 0, '2026-03-21 10:07:41'),
(11, 6, 'uploads/products/1774281712_8962.webp', 0, '2026-03-23 16:01:52'),
(12, 5, 'uploads/products/1774281768_4535.jpg', 0, '2026-03-23 16:02:48'),
(13, 4, 'uploads/products/1774281846_5089.webp', 1, '2026-03-23 16:04:06'),
(14, 3, 'uploads/products/1774281906_8393.jpg', 1, '2026-03-23 16:05:06'),
(15, 2, 'uploads/products/1774281946_8030.jpg', 1, '2026-03-23 16:05:46');

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

INSERT INTO `reviews` (`id`, `user_id`, `product_id`, `order_id`, `rating`, `comment`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 4, 2, 5, 'Sản phẩm tốt, giao hàng nhanh', 1, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(2, 5, 7, 9, 5, '10đ không có nhưng', 1, '2026-03-22 00:19:40', '2026-03-22 00:19:40');

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `role` enum('customer','staff','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','blocked') NOT NULL DEFAULT 'active',
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password`, `address`, `role`, `status`, `avatar`, `created_at`, `updated_at`) VALUES
(1, 'Quản trị viên', 'admin@gmail.com', '0900000001', '123456', 'TP.HCM', 'admin', 'active', NULL, '2026-03-21 06:29:08', '2026-03-21 08:37:36'),
(2, 'Nhân viên bán hàng', 'nhanvien@gmail.com', '0900000002', '111111', 'TP.HCM', 'staff', 'active', NULL, '2026-03-21 06:29:08', '2026-03-21 09:17:35'),
(3, 'Nguyễn Văn A', 'customer1@gmail.com', '0900000003', '123456', 'Hà Nội', 'customer', 'active', NULL, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(4, 'Trần Thị B', 'customer2@gmail.com', '0900000004', '123456', '123 Lê Lợi, Đà Nẵng', 'customer', 'active', NULL, '2026-03-21 06:29:08', '2026-03-21 06:29:08'),
(5, 'Nguyễn Văn A', 'nguyenvana@gmail.com', '0111111111', '$2y$10$en9/JuyxADk8YhSGs6xhxOyJgIc4j9tRB9mPlz2Qi3hM49ohX3yR2', '', 'customer', 'active', 'uploads/avatars/avatar_5_1774166534.png', '2026-03-21 08:35:07', '2026-03-22 08:02:14'),
(6, 'Nguyễn Văn B', 'nguyenvanb@gmail.com', '0123456789', '$2y$10$Vqr1asyVBR7xtUrid7obV.5u2NIxYcj5itEJ1kIoYSRejHNoXJIPq', '', 'customer', 'active', NULL, '2026-03-21 09:02:38', '2026-03-22 09:54:39'),
(8, 'zzzx', 'zz@gmail.com', '0000000000', '$2y$10$Z87f6xczimJzgfY6GPh7fe/V2RyPMKoD1dbiHmBY6TG101zr1SUaC', '', 'customer', 'active', NULL, '2026-03-22 11:38:17', '2026-03-26 14:14:26');

ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart_product` (`cart_id`,`product_id`),
  ADD KEY `fk_cart_items_product` (`product_id`);

ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_chat_conversations_customer` (`customer_id`),
  ADD KEY `fk_chat_conversations_staff` (`staff_id`);

ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_chat_messages_conversation` (`conversation_id`),
  ADD KEY `fk_chat_messages_sender` (`sender_id`);

ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`product_id`),
  ADD KEY `fk_favorites_product` (`product_id`);

ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `fk_orders_cancelled_by` (`cancelled_by`),
  ADD KEY `idx_orders_user_id` (`user_id`),
  ADD KEY `idx_orders_order_status` (`order_status`),
  ADD KEY `idx_orders_payment_status` (`payment_status`);

ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`),
  ADD KEY `fk_order_items_product` (`product_id`);

ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_order` (`order_id`),
  ADD KEY `fk_payments_updated_by` (`updated_by`);

ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `fk_products_created_by` (`created_by`),
  ADD KEY `fk_products_updated_by` (`updated_by`),
  ADD KEY `idx_products_name` (`name`),
  ADD KEY `idx_products_status` (`status`),
  ADD KEY `idx_products_category_id` (`category_id`);

ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_images_product` (`product_id`);

ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review_per_order_product_user` (`user_id`,`product_id`,`order_id`),
  ADD KEY `fk_reviews_order` (`order_id`),
  ADD KEY `idx_reviews_product_id` (`product_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`);

ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

ALTER TABLE `chat_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
 TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `fk_chat_conversations_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_conversations_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payments_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
