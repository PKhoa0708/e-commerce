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

if ($order_id <= 0) {
    header("Location: /staff/orders/index.php?error=" . urlencode("ID đơn hàng không hợp lệ"));
    exit();
}

$order = $db->orders->findOne(['id' => $order_id]);

if (!$order) {
    header("Location: /staff/orders/index.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

if ($order['order_status'] !== 'Chờ xác nhận') {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Chỉ có thể xác nhận đơn đang chờ xác nhận"));
    exit();
}

try {
    $db->orders->updateOne(
        ['id' => $order_id],
        ['$set' => ['order_status' => 'Đã xác nhận', 'updated_at' => new MongoDB\BSON\UTCDateTime()]]
    );
    header("Location: /staff/orders/detail.php?id=$order_id&success=" . urlencode("Đã xác nhận đơn hàng"));
    exit();
} catch (Exception $e) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Không thể xác nhận đơn hàng"));
    exit();
}