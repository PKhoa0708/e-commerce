<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /customer/orders.php");
    exit();
}

$user_id = (int)$_SESSION['user_id'];
$order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : 0;
$cancel_reason = isset($_POST['cancel_reason']) ? trim($_POST['cancel_reason']) : '';

if ($order_id <= 0) {
    header("Location: /customer/orders.php?error=" . urlencode("ID đơn hàng không hợp lệ"));
    exit();
}

if ($cancel_reason === '') {
    header("Location: /customer/order_detail.php?id=" . $order_id . "&error=" . urlencode("Vui lòng nhập lý do hủy đơn"));
    exit();
}

try {
    $order = $db->orders->findOne(['id' => $order_id, 'user_id' => $user_id]);

    if (!$order) {
        throw new Exception("Không tìm thấy đơn hàng");
    }

    $allowed_cancel_status = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    if (!in_array($order['order_status'], $allowed_cancel_status)) {
        throw new Exception("Đơn hàng này không thể hủy vì đã chuyển sang giai đoạn giao hàng");
    }

    $order_items = $db->order_items->find(['order_id' => $order_id])->toArray();

    foreach ($order_items as $item) {
        $product_id = (int)$item['product_id'];
        $quantity = (int)$item['quantity'];

        $db->products->updateOne(
            ['id' => $product_id],
            ['$inc' => ['stock_quantity' => $quantity]]
        );
    }

    $new_payment_status = $order['payment_status'];
    $payment_note = 'Khách hàng đã hủy đơn';

    if ($order['payment_status'] === 'Đã thanh toán') {
        $new_payment_status = 'Hoàn tiền';
        $payment_note = 'Khách hàng đã hủy đơn, cần hoàn tiền';
    } else {
        $new_payment_status = 'Thất bại';
        $payment_note = 'Khách hàng đã hủy đơn';
    }

    $db->orders->updateOne(
        ['id' => $order_id],
        ['$set' => [
            'order_status' => 'Đã hủy',
            'payment_status' => $new_payment_status,
            'cancelled_by' => $user_id,
            'cancel_reason' => $cancel_reason,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]]
    );

    $payment = $db->payments->findOne(['order_id' => $order_id]);

    if ($payment) {
        $db->payments->updateOne(
            ['order_id' => $order_id],
            ['$set' => [
                'payment_status' => $new_payment_status,
                'note' => $payment_note,
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]]
        );
    }

    header("Location: /customer/order_detail.php?id=" . $order_id . "&success=" . urlencode("Hủy đơn hàng thành công"));
    exit();

} catch (Exception $e) {
    header("Location: /customer/order_detail.php?id=" . $order_id . "&error=" . urlencode($e->getMessage()));
    exit();
}