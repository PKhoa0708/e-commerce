<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff', 'admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$order_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($order_id <= 0) {
    header("Location: /staff/orders/index.php?error=" . urlencode("ID đơn hàng không hợp lệ"));
    exit();
}

$pipeline_order = [
    ['$match' => ['id' => $order_id]],
    ['$lookup' => [
        'from' => 'users',
        'localField' => 'user_id',
        'foreignField' => 'id',
        'as' => 'user_info'
    ]],
    ['$unwind' => [
        'path' => '$user_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'order_code' => 1,
        'user_id' => 1,
        'receiver_name' => 1,
        'receiver_phone' => 1,
        'shipping_address' => 1,
        'note' => 1,
        'payment_method' => 1,
        'payment_status' => 1,
        'order_status' => 1,
        'subtotal' => 1,
        'shipping_fee' => 1,
        'total_amount' => 1,
        'cancel_reason' => 1,
        'created_at' => 1,
        'updated_at' => 1,
        'customer_name' => '$user_info.full_name',
        'customer_email' => '$user_info.email'
    ]]
];
$order_res = $db->orders->aggregate($pipeline_order)->toArray();
$order = $order_res[0] ?? null;

if (!$order) {
    header("Location: /staff/orders/index.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

$item_result = $db->order_items->find(['order_id' => $order_id], ['sort' => ['id' => 1]])->toArray();

$pipeline_payment = [
    ['$match' => ['order_id' => $order_id]],
    ['$lookup' => [
        'from' => 'users',
        'localField' => 'updated_by',
        'foreignField' => 'id',
        'as' => 'user_info'
    ]],
    ['$unwind' => [
        'path' => '$user_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'order_id' => 1,
        'payment_method' => 1,
        'amount' => 1,
        'payment_status' => 1,
        'paid_at' => 1,
        'note' => 1,
        'updated_by' => 1,
        'created_at' => 1,
        'updated_at' => 1,
        'updated_by_name' => '$user_info.full_name'
    ]],
    ['$sort' => ['id' => -1]],
    ['$limit' => 1]
];
$payment_res = $db->payments->aggregate($pipeline_payment)->toArray();
$payment = $payment_res[0] ?? null;


function format_money($amount) {
    return number_format((float)$amount, 0, ',', '.') . ' đ';
}

function can_cancel_order($status) {
    $allowed = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    return in_array($status, $allowed);
}

function can_confirm_order($status) {
    return $status === 'Chờ xác nhận';
}

function get_payment_text($payment_status) {
    $payment_status = trim((string)$payment_status);

    if ($payment_status === '' || $payment_status === null) {
        return 'Chưa thanh toán';
    }

    if ($payment_status === 'Đang chờ') {
        return 'Chưa thanh toán';
    }

    if ($payment_status === 'Thất bại' || $payment_status === 'Hoàn tiền') {
        return 'Chưa thanh toán';
    }

    return $payment_status;
}

$current_payment_status = 'Chưa thanh toán';

if ($payment && !empty($payment['payment_status'])) {
    $current_payment_status = get_payment_text($payment['payment_status']);
} else {
    $current_payment_status = get_payment_text($order['payment_status']);
}

$order_status_options = ['Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hoàn thành', 'Đã hủy'];
$payment_status_options = ['Chưa thanh toán', 'Đã thanh toán'];
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Chi tiết đơn hàng</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2, h3 { margin-bottom: 10px; }
        .btn {
            display: inline-block;
            padding: 8px 12px;
            text-decoration: none;
            border: 1px solid #ccc;
            background: #f5f5f5;
            color: #000;
            border-radius: 4px;
            margin-right: 8px;
        }
        .section {
            margin-bottom: 25px;
            padding: 15px;
            background: #fafafa;
            border: 1px solid #ddd;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
        }
        table th {
            background: #f3f3f3;
        }
        .form-inline {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
            margin-top: 10px;
        }
        .form-inline input, .form-inline select, .form-inline textarea, .form-inline button {
            padding: 8px;
        }
        .msg {
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .msg-success { background: #d4edda; color: #155724; }
        .msg-error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>

<h2>Chi tiết đơn hàng #<?php echo htmlspecialchars($order['order_code']); ?></h2>

<a class="btn" href="/staff/orders/index.php">← Quay lại danh sách</a>

<?php if (isset($_GET['success'])): ?>
    <div class="msg msg-success"><?php echo htmlspecialchars($_GET['success']); ?></div>
<?php endif; ?>

<?php if (isset($_GET['error'])): ?>
    <div class="msg msg-error"><?php echo htmlspecialchars($_GET['error']); ?></div>
<?php endif; ?>

<div class="section">
    <h3>Thông tin đơn hàng</h3>
    <p><strong>Mã đơn:</strong> <?php echo htmlspecialchars($order['order_code']); ?></p>
    <p><strong>Khách hàng:</strong> <?php echo htmlspecialchars($order['customer_name'] ?? ''); ?></p>
    <p><strong>Email khách:</strong> <?php echo htmlspecialchars($order['customer_email'] ?? ''); ?></p>
    <p><strong>Người nhận:</strong> <?php echo htmlspecialchars($order['receiver_name']); ?></p>
    <p><strong>Số điện thoại:</strong> <?php echo htmlspecialchars($order['receiver_phone']); ?></p>
    <p><strong>Địa chỉ giao hàng:</strong> <?php echo htmlspecialchars($order['shipping_address']); ?></p>
    <p><strong>Ghi chú:</strong> <?php echo htmlspecialchars($order['note']); ?></p>
    <p><strong>Phương thức thanh toán:</strong> <?php echo htmlspecialchars($order['payment_method']); ?></p>
    <p><strong>Trạng thái thanh toán:</strong> <?php echo htmlspecialchars($current_payment_status); ?></p>
    <p><strong>Trạng thái đơn hàng:</strong> <?php echo htmlspecialchars($order['order_status']); ?></p>
    <p><strong>Tạm tính:</strong> <?php echo format_money($order['subtotal']); ?></p>
    <p><strong>Phí ship:</strong> <?php echo format_money($order['shipping_fee']); ?></p>
    <p><strong>Tổng tiền:</strong> <?php echo format_money($order['total_amount']); ?></p>
    <p><strong>Ngày tạo:</strong> <?php echo formatDate($order['created_at']); ?></p>
    <p><strong>Cập nhật lần cuối:</strong> <?php echo formatDate($order['updated_at']); ?></p>

    <?php if (!empty($order['cancel_reason'])): ?>
        <p><strong>Lý do hủy:</strong> <?php echo htmlspecialchars($order['cancel_reason']); ?></p>
    <?php endif; ?>
</div>

<div class="section">
    <h3>Sản phẩm trong đơn</h3>
    <table>
        <thead>
            <tr>
                <th>Tên sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            <?php if (!empty($item_result)): ?>
                <?php foreach ($item_result as $item): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($item['product_name']); ?></td>
                        <td><?php echo format_money($item['product_price']); ?></td>
                        <td><?php echo (int)$item['quantity']; ?></td>
                        <td><?php echo format_money($item['subtotal']); ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="4">Không có sản phẩm.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<div class="section">
    <h3>Thanh toán</h3>
    <?php if ($payment): ?>
        <p><strong>Phương thức:</strong> <?php echo htmlspecialchars($payment['payment_method']); ?></p>
        <p><strong>Số tiền:</strong> <?php echo format_money($payment['amount']); ?></p>
        <p><strong>Trạng thái:</strong> <?php echo htmlspecialchars($current_payment_status); ?></p>
        <p><strong>Ngày thanh toán:</strong> <?php echo formatDate($payment['paid_at'] ?? null); ?></p>
        <p><strong>Ghi chú:</strong> <?php echo htmlspecialchars($payment['note']); ?></p>
        <p><strong>Người cập nhật:</strong> <?php echo htmlspecialchars($payment['updated_by_name'] ?? ''); ?></p>
    <?php else: ?>
        <p>Chưa có bản ghi thanh toán.</p>
    <?php endif; ?>

    <form class="form-inline" method="POST" action="update_payment.php">
        <input type="hidden" name="order_id" value="<?php echo (int)$order['id']; ?>">
        <select name="payment_status" required>
            <?php foreach ($payment_status_options as $status): ?>
                <option value="<?php echo $status; ?>" <?php echo ($current_payment_status === $status) ? 'selected' : ''; ?>>
                    <?php echo $status; ?>
                </option>
            <?php endforeach; ?>
        </select>
        <input type="text" name="note" placeholder="Ghi chú thanh toán">
        <button type="submit">Cập nhật thanh toán</button>
    </form>
</div>

<div class="section">
    <h3>Thao tác đơn hàng</h3>

    <?php if (can_confirm_order($order['order_status'])): ?>
        <form method="POST" action="confirm.php" style="display:inline-block; margin-bottom:10px;">
            <input type="hidden" name="order_id" value="<?php echo (int)$order['id']; ?>">
            <button type="submit">Xác nhận đơn hàng</button>
        </form>
    <?php endif; ?>

    <form class="form-inline" method="POST" action="update_status.php">
        <input type="hidden" name="order_id" value="<?php echo (int)$order['id']; ?>">
        <select name="order_status" required>
            <?php foreach ($order_status_options as $status): ?>
                <option value="<?php echo $status; ?>" <?php echo ($order['order_status'] === $status) ? 'selected' : ''; ?>>
                    <?php echo $status; ?>
                </option>
            <?php endforeach; ?>
        </select>
        <button type="submit">Cập nhật trạng thái đơn</button>
    </form>

    <?php if (can_cancel_order($order['order_status'])): ?>
        <form method="POST" action="cancel.php" style="margin-top:15px;">
            <input type="hidden" name="order_id" value="<?php echo (int)$order['id']; ?>">
            <textarea name="cancel_reason" rows="3" cols="50" placeholder="Nhập lý do hủy đơn" required></textarea><br>
            <button type="submit" onclick="return confirm('Bạn có chắc muốn hủy đơn hàng này không?');">Hủy đơn hàng</button>
        </form>
    <?php endif; ?>
</div>

</body>
</html>