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
$cancel_reason = isset($_POST['cancel_reason']) ? trim($_POST['cancel_reason']) : '';
$staff_id = (int)$_SESSION['user_id'];

if ($order_id <= 0) {
    header("Location: /staff/orders/index.php?error=" . urlencode("ID đơn hàng không hợp lệ"));
    exit();
}

if ($cancel_reason === '') {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode("Vui lòng nhập lý do hủy đơn"));
    exit();
}

try {
    $order = $db->orders->findOne(['id' => $order_id]);

    if (!$order) {
        throw new Exception("Không tìm thấy đơn hàng");
    }

    $allowed_statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    if (!in_array($order['order_status'], $allowed_statuses)) {
        throw new Exception("Không thể hủy đơn hàng ở trạng thái hiện tại");
    }

    // Phục hồi số lượng tồn kho của các sản phẩm bằng toán tử $inc
    $items = $db->order_items->find(['order_id' => $order_id])->toArray();
    foreach ($items as $item) {
        $product_id = (int)$item['product_id'];
        $quantity = (int)$item['quantity'];

        $db->products->updateOne(
            ['id' => $product_id],
            ['$inc' => ['stock_quantity' => $quantity]]
        );
    }

    $new_payment_status = $order['payment_status'];
    $payment_note = 'Đơn hàng đã hủy';

    if ($order['payment_status'] === 'Đã thanh toán') {
        $new_payment_status = 'Hoàn tiền';
        $payment_note = 'Đơn hàng đã hủy, cần hoàn tiền';
    } else {
        $new_payment_status = 'Thất bại';
        $payment_note = 'Đơn hàng đã hủy';
    }

    // Cập nhật đơn hàng
    $db->orders->updateOne(
        ['id' => $order_id],
        ['$set' => [
            'order_status' => 'Đã hủy',
            'payment_status' => $new_payment_status,
            'cancelled_by' => $staff_id,
            'cancel_reason' => $cancel_reason,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]]
    );

    // Cập nhật payment tương ứng
    $db->payments->updateOne(
        ['order_id' => $order_id],
        ['$set' => [
            'payment_status' => $new_payment_status,
            'note' => $payment_note,
            'updated_by' => $staff_id,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]],
        ['upsert' => true]
    );

    header("Location: /staff/orders/detail.php?id=$order_id&success=" . urlencode("Đã hủy đơn hàng"));
    exit();

} catch (Exception $e) {
    header("Location: /staff/orders/detail.php?id=$order_id&error=" . urlencode($e->getMessage()));
    exit();
}