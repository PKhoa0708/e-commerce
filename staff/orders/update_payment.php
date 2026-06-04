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
$payment_status = isset($_POST['payment_status']) ? trim($_POST['payment_status']) : '';
$note = isset($_POST['note']) ? trim($_POST['note']) : '';
$staff_id = (int)$_SESSION['user_id'];

$allowed_statuses = ['Chưa thanh toán', 'Đã thanh toán', 'Thất bại', 'Hoàn tiền'];

if ($order_id <= 0 || $payment_status === '') {
    header("Location: /staff/orders/index.php?error=" . urlencode("Dữ liệu không hợp lệ"));
    exit();
}

if (!in_array($payment_status, $allowed_statuses)) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Trạng thái thanh toán không hợp lệ"));
    exit();
}

$paid_at = null;
if ($payment_status === 'Đã thanh toán') {
    $paid_at = new MongoDB\BSON\UTCDateTime();
}

try {
    $order = $db->orders->findOne(['id' => $order_id]);

    if (!$order) {
        throw new Exception("Không tìm thấy đơn hàng");
    }

    $db->orders->updateOne(
        ['id' => $order_id],
        ['$set' => ['payment_status' => $payment_status, 'updated_at' => new MongoDB\BSON\UTCDateTime()]]
    );

    $payment_updates = [
        'payment_status' => $payment_status,
        'note' => $note,
        'updated_by' => $staff_id,
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ];

    if ($paid_at !== null) {
        $payment_updates['paid_at'] = $paid_at;
    }

    $db->payments->updateOne(
        ['order_id' => $order_id],
        ['$set' => $payment_updates],
        ['upsert' => true]
    );

    header("Location: /staff/orders/detail.php?id=$order_id&success=" . urlencode("Đã cập nhật trạng thái thanh toán"));
    exit();

} catch (Exception $e) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode($e->getMessage()));
    exit();
}