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

mysqli_begin_transaction($conn);

try {
    $order_sql = "SELECT id, user_id, order_status, payment_status
                  FROM orders
                  WHERE id = ? AND user_id = ?
                  LIMIT 1
                  FOR UPDATE";
    $order_stmt = mysqli_prepare($conn, $order_sql);
    mysqli_stmt_bind_param($order_stmt, "ii", $order_id, $user_id);
    mysqli_stmt_execute($order_stmt);
    $order_result = mysqli_stmt_get_result($order_stmt);

    if (!$order_result || mysqli_num_rows($order_result) !== 1) {
        throw new Exception("Không tìm thấy đơn hàng");
    }

    $order = mysqli_fetch_assoc($order_result);

    $allowed_cancel_status = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    if (!in_array($order['order_status'], $allowed_cancel_status)) {
        throw new Exception("Đơn hàng này không thể hủy vì đã chuyển sang giai đoạn giao hàng");
    }

    $items_sql = "SELECT product_id, quantity
                  FROM order_items
                  WHERE order_id = ?";
    $items_stmt = mysqli_prepare($conn, $items_sql);
    mysqli_stmt_bind_param($items_stmt, "i", $order_id);
    mysqli_stmt_execute($items_stmt);
    $items_result = mysqli_stmt_get_result($items_stmt);

    while ($item = mysqli_fetch_assoc($items_result)) {
        $product_id = (int)$item['product_id'];
        $quantity = (int)$item['quantity'];

        $restore_sql = "UPDATE products
                        SET stock_quantity = stock_quantity + ?
                        WHERE id = ?";
        $restore_stmt = mysqli_prepare($conn, $restore_sql);
        mysqli_stmt_bind_param($restore_stmt, "ii", $quantity, $product_id);
        mysqli_stmt_execute($restore_stmt);
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

    $update_order_sql = "UPDATE orders
                         SET order_status = 'Đã hủy',
                             payment_status = ?,
                             cancelled_by = ?,
                             cancel_reason = ?,
                             updated_at = NOW()
                         WHERE id = ?";
    $update_order_stmt = mysqli_prepare($conn, $update_order_sql);
    mysqli_stmt_bind_param($update_order_stmt, "sisi", $new_payment_status, $user_id, $cancel_reason, $order_id);
    mysqli_stmt_execute($update_order_stmt);

    $check_payment_sql = "SELECT id FROM payments WHERE order_id = ? LIMIT 1";
    $check_payment_stmt = mysqli_prepare($conn, $check_payment_sql);
    mysqli_stmt_bind_param($check_payment_stmt, "i", $order_id);
    mysqli_stmt_execute($check_payment_stmt);
    $check_payment_result = mysqli_stmt_get_result($check_payment_stmt);

    if ($check_payment_result && mysqli_num_rows($check_payment_result) === 1) {
        $update_payment_sql = "UPDATE payments
                               SET payment_status = ?,
                                   note = ?,
                                   updated_at = NOW()
                               WHERE order_id = ?";
        $update_payment_stmt = mysqli_prepare($conn, $update_payment_sql);
        mysqli_stmt_bind_param($update_payment_stmt, "ssi", $new_payment_status, $payment_note, $order_id);
        mysqli_stmt_execute($update_payment_stmt);
    }

    mysqli_commit($conn);

    header("Location: /customer/order_detail.php?id=" . $order_id . "&success=" . urlencode("Hủy đơn hàng thành công"));
    exit();

} catch (Exception $e) {
    mysqli_rollback($conn);
    header("Location: /customer/order_detail.php?id=" . $order_id . "&error=" . urlencode($e->getMessage()));
    exit();
}