<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff', 'admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /staff/orders/index.php");
    exit();
}

$order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : 0;
$new_status = isset($_POST['order_status']) ? trim($_POST['order_status']) : '';

$allowed_statuses = ['Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hoàn thành', 'Đã hủy'];

if ($order_id <= 0 || $new_status === '') {
    header("Location: /staff/orders/index.php?error=" . urlencode("Dữ liệu không hợp lệ"));
    exit();
}

if (!in_array($new_status, $allowed_statuses)) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Trạng thái đơn hàng không hợp lệ"));
    exit();
}

$order = $db->orders->findOne(['id' => $order_id]);

if (!$order) {
    header("Location: /staff/orders/index.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

if ($order['order_status'] === 'Đã hủy') {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Đơn hàng đã hủy, không thể cập nhật"));
    exit();
}

if ($order['order_status'] === 'Đã hoàn thành') {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Đơn hàng đã hoàn thành, không thể cập nhật"));
    exit();
}

try {
    $db->orders->updateOne(
        ['id' => $order_id],
        ['$set' => ['order_status' => $new_status, 'updated_at' => new MongoDB\BSON\UTCDateTime()]]
    );
    header("Location: /staff/orders/detail.php?id=$order_id&success=" . urlencode("Đã cập nhật trạng thái đơn hàng"));
    exit();
} catch (Exception $e) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Không thể cập nhật trạng thái đơn hàng"));
    exit();
}