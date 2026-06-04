<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

$user_id = (int)$_SESSION['user_id'];
$order_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($order_id <= 0) {
    header("Location: /customer/orders.php?error=" . urlencode("ID đơn hàng không hợp lệ"));
    exit();
}

$order = $db->orders->findOne(['id' => $order_id, 'user_id' => $user_id]);

if (!$order) {
    header("Location: /customer/orders.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

$order_items = $db->order_items->find(['order_id' => $order_id], ['sort' => ['id' => 1]])->toArray();

$payment = $db->payments->findOne(['order_id' => $order_id], ['sort' => ['id' => -1]]);

function format_money($amount) {
    return number_format((float)$amount, 0, ',', '.') . ' đ';
}

function can_customer_cancel($status) {
    $allowed = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    return in_array($status, $allowed);
}

function can_review_product($status) {
    $allowed = ['Đã giao', 'Đã hoàn thành'];
    return in_array($status, $allowed);
}

function get_payment_text($payment_status) {
    $payment_status = trim((string)$payment_status);

    if ($payment_status === '' || $payment_status === null) {
        return 'Chưa thanh toán';
    }

    if ($payment_status === 'Đang chờ') {
        return 'Chưa thanh toán';
    }

    return $payment_status;
}

function render_progress($status) {
    $steps = [
        'Chờ xác nhận',
        'Đã xác nhận',
        'Đang chuẩn bị',
        'Đang giao',
        'Đã giao',
        'Đã hoàn thành'
    ];

    if ($status === 'Đã hủy') {
        echo '<div class="progress-cancel-box">Đơn hàng đã bị hủy.</div>';
        return;
    }

    $currentIndex = array_search($status, $steps);

    echo '<div class="progress-steps">';
    foreach ($steps as $index => $step) {
        $active = ($currentIndex !== false && $index <= $currentIndex);
        $class = $active ? 'progress-step active' : 'progress-step';
        echo '<div class="' . $class . '">' . htmlspecialchars($step) . '</div>';
    }
    echo '</div>';
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Chi tiết đơn hàng</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Inter", sans-serif;
            background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
            color: #1F2937;
        }

        a {
            text-decoration: none;
        }

        .order-detail-page {
            max-width: 1280px;
            margin: 0 auto;
            padding: 32px 16px 60px;
        }

        .detail-hero {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            padding: 34px;
            margin-bottom: 24px;
            background:
                linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
                url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
            color: #fff;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        }

        .detail-hero::before {
            content: "";
            position: absolute;
            top: -70px;
            right: -70px;
            width: 210px;
            height: 210px;
            border-radius: 50%;
            background: rgba(255,255,255,0.10);
        }

        .detail-hero::after {
            content: "";
            position: absolute;
            left: -90px;
            bottom: -90px;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
        }

        .detail-hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 16px;
            flex-wrap: wrap;
        }

        .detail-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.18);
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 14px;
        }

        .detail-hero h1 {
            margin: 0 0 10px;
            font-size: clamp(28px, 4vw, 44px);
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -0.6px;
        }

        .detail-hero p {
            margin: 0;
            max-width: 680px;
            color: rgba(255,255,255,0.94);
            font-size: 16px;
            line-height: 1.7;
        }

        .back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 18px;
            border-radius: 14px;
            background: #fff;
            color: #E53935;
            font-weight: 800;
            box-shadow: 0 10px 24px rgba(0,0,0,0.10);
            transition: 0.25s ease;
            white-space: nowrap;
        }

        .back-btn:hover {
            transform: translateY(-1px);
        }

        .message {
            padding: 14px 16px;
            margin-bottom: 16px;
            border-radius: 18px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid transparent;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
        }

        .success {
            background: #F0FDF4;
            color: #166534;
            border-color: #BBF7D0;
        }

        .error {
            background: #FEF2F2;
            color: #B91C1C;
            border-color: #FECACA;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 22px;
            margin-bottom: 22px;
        }

        .section-card {
            background: #fff;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
            padding: 24px;
        }

        .section-title {
            margin: 0 0 16px;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
        }

        .info-list {
            display: grid;
            gap: 12px;
        }

        .info-item {
            background: #F8FAFC;
            border: 1px solid #EEF2F7;
            border-radius: 16px;
            padding: 14px 16px;
        }

        .info-item .label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.35px;
            margin-bottom: 6px;
        }

        .info-item .value {
            font-size: 14px;
            line-height: 1.6;
            color: #111827;
            word-break: break-word;
        }

        .progress-steps {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        .progress-step {
            padding: 10px 14px;
            border-radius: 999px;
            background: #E5E7EB;
            color: #374151;
            font-size: 13px;
            font-weight: 700;
            border: 1px solid #D1D5DB;
        }

        .progress-step.active {
            background: linear-gradient(135deg, #16A34A, #22C55E);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 12px 22px rgba(34, 197, 94, 0.20);
        }

        .progress-cancel-box {
            padding: 14px 16px;
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #B91C1C;
            border-radius: 16px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .status-note {
            margin-top: 10px;
            font-size: 14px;
            color: #4B5563;
        }

        .items-card,
        .payment-card,
        .cancel-card {
            background: #fff;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
            overflow: hidden;
            margin-bottom: 22px;
        }

        .card-head {
            padding: 22px 22px 0;
        }

        .card-title {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
        }

        .card-desc {
            margin: 0 0 18px;
            color: #6B7280;
            font-size: 14px;
        }

        .table-wrap {
            width: 100%;
            overflow-x: auto;
        }

        table {
            width: 100%;
            min-width: 850px;
            border-collapse: separate;
            border-spacing: 0;
        }

        thead th {
            background: #F8FAFC;
            color: #374151;
            font-size: 13px;
            font-weight: 800;
            text-align: left;
            padding: 16px 18px;
            border-bottom: 1px solid #E5E7EB;
            white-space: nowrap;
        }

        tbody td {
            padding: 18px;
            border-bottom: 1px solid #EEF2F7;
            vertical-align: top;
            font-size: 14px;
            color: #374151;
        }

        tbody tr:hover {
            background: #FCFCFD;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .product-name {
            font-weight: 700;
            color: #111827;
        }

        .money-text {
            font-weight: 800;
            color: #E53935;
        }

        .review-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 14px;
            border-radius: 12px;
            background: linear-gradient(135deg, #F59E0B, #FBBF24);
            color: #111827;
            font-weight: 800;
            font-size: 13px;
            box-shadow: 0 12px 22px rgba(245, 158, 11, 0.18);
            transition: 0.25s ease;
        }

        .review-btn:hover {
            transform: translateY(-1px);
        }

        .review-disabled {
            color: #9CA3AF;
            font-size: 13px;
            font-weight: 600;
        }

        .summary-box {
            padding: 0 22px 22px;
            display: grid;
            gap: 10px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            border-radius: 16px;
            background: #F8FAFC;
            border: 1px solid #EEF2F7;
            font-size: 14px;
        }

        .summary-row.total {
            background: #FFF1F1;
            border-color: #FDD5D5;
            font-weight: 800;
            color: #B91C1C;
        }

        .cancel-card {
            padding: 24px;
        }

        .cancel-desc {
            margin: 0 0 16px;
            color: #6B7280;
            font-size: 14px;
            line-height: 1.7;
        }

        .cancel-textarea {
            width: 100%;
            min-height: 130px;
            border: 1px solid #D1D5DB;
            border-radius: 16px;
            padding: 14px 16px;
            font-size: 14px;
            color: #111827;
            resize: vertical;
            outline: none;
            transition: 0.25s ease;
            font-family: "Inter", sans-serif;
        }

        .cancel-textarea:focus {
            border-color: #E53935;
            box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
        }

        .cancel-submit {
            margin-top: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 18px;
            border-radius: 14px;
            border: none;
            cursor: pointer;
            background: linear-gradient(135deg, #DC2626, #EF4444);
            color: #fff;
            font-weight: 800;
            box-shadow: 0 14px 28px rgba(220, 38, 38, 0.20);
            transition: 0.25s ease;
        }

        .cancel-submit:hover {
            transform: translateY(-1px);
        }

        .empty-row {
            text-align: center;
            color: #6B7280;
            font-weight: 600;
        }

        @media (max-width: 992px) {
            .detail-grid {
                grid-template-columns: 1fr;
            }

            .detail-hero {
                padding: 26px 20px;
                border-radius: 24px;
            }
        }
    </style>
</head>
<body>

<div class="order-detail-page">
    <section class="detail-hero">
        <div class="detail-hero-content">
            <div>
                <div class="detail-badge">🧾 Xem chi tiết đơn hàng</div>
                <h1>Chi tiết đơn hàng #<?php echo htmlspecialchars($order['order_code']); ?></h1>
                <p>
                    Kiểm tra tiến trình đơn hàng, thông tin giao hàng, sản phẩm đã đặt,
                    thanh toán và thực hiện các thao tác liên quan trực tiếp từ trang này.
                </p>
            </div>

            <a class="back-btn" href="/customer/orders.php">← Quay lại danh sách đơn hàng</a>
        </div>
    </section>

    <?php if (isset($_GET['success'])): ?>
        <div class="message success"><?php echo htmlspecialchars($_GET['success']); ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['error'])): ?>
        <div class="message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
    <?php endif; ?>

    <div class="detail-grid">
        <div class="section-card">
            <h2 class="section-title">Theo dõi trạng thái đơn hàng</h2>
            <?php render_progress($order['order_status']); ?>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">Trạng thái hiện tại</span>
                    <span class="value"><?php echo htmlspecialchars($order['order_status']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Trạng thái thanh toán</span>
                    <span class="value"><?php echo htmlspecialchars(get_payment_text($order['payment_status'])); ?></span>
                </div>
            </div>
            <div class="status-note">
                Trạng thái đơn hàng sẽ được cập nhật theo tiến trình xử lý thực tế của hệ thống.
            </div>
        </div>

        <div class="section-card">
            <h2 class="section-title">Thông tin giao hàng</h2>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">Người nhận</span>
                    <span class="value"><?php echo htmlspecialchars($order['receiver_name']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Số điện thoại</span>
                    <span class="value"><?php echo htmlspecialchars($order['receiver_phone']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Địa chỉ giao hàng</span>
                    <span class="value"><?php echo htmlspecialchars($order['shipping_address']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Ghi chú</span>
                    <span class="value"><?php echo htmlspecialchars($order['note']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Phương thức thanh toán</span>
                    <span class="value"><?php echo htmlspecialchars($order['payment_method']); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Ngày tạo</span>
                    <span class="value"><?php echo htmlspecialchars(formatDate($order['created_at'])); ?></span>
                </div>
                <div class="info-item">
                    <span class="label">Cập nhật</span>
                    <span class="value"><?php echo htmlspecialchars(formatDate($order['updated_at'])); ?></span>
                </div>

                <?php if (!empty($order['cancel_reason'])): ?>
                    <div class="info-item" style="background:#FEF2F2; border-color:#FECACA;">
                        <span class="label" style="color:#B91C1C;">Lý do hủy</span>
                        <span class="value" style="color:#991B1B;"><?php echo htmlspecialchars($order['cancel_reason']); ?></span>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="items-card">
        <div class="card-head">
            <h2 class="card-title">Sản phẩm trong đơn</h2>
            <p class="card-desc">Danh sách sản phẩm đã đặt và trạng thái đánh giá của từng sản phẩm.</p>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Tên sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                        <th>Đánh giá</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($order_items)): ?>
                        <?php foreach ($order_items as $item): ?>
                            <tr>
                                <td>
                                    <div class="product-name"><?php echo htmlspecialchars($item['product_name']); ?></div>
                                </td>
                                <td><span class="money-text"><?php echo format_money($item['product_price']); ?></span></td>
                                <td><?php echo (int)$item['quantity']; ?></td>
                                <td><span class="money-text"><?php echo format_money($item['subtotal']); ?></span></td>
                                <td>
                                    <?php if (can_review_product($order['order_status'])): ?>
                                        <a
                                            class="review-btn"
                                            href="/customer/review_product.php?order_id=<?php echo (int)$order['id']; ?>&product_id=<?php echo (int)$item['product_id']; ?>"
                                        >
                                            Đánh giá sản phẩm
                                        </a>
                                    <?php else: ?>
                                        <span class="review-disabled">Chưa thể đánh giá</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="5" class="empty-row">Không có sản phẩm nào trong đơn.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="summary-box">
            <div class="summary-row">
                <span>Tạm tính</span>
                <strong><?php echo format_money($order['subtotal']); ?></strong>
            </div>
            <div class="summary-row">
                <span>Phí vận chuyển</span>
                <strong><?php echo format_money($order['shipping_fee']); ?></strong>
            </div>
            <div class="summary-row total">
                <span>Tổng tiền</span>
                <strong><?php echo format_money($order['total_amount']); ?></strong>
            </div>
        </div>
    </div>

    <div class="payment-card">
        <div class="card-head">
            <h2 class="card-title">Thông tin thanh toán</h2>
            <p class="card-desc">Chi tiết giao dịch thanh toán liên quan đến đơn hàng này.</p>
        </div>

        <div style="padding: 0 22px 22px;">
            <?php if ($payment): ?>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">Phương thức</span>
                        <span class="value"><?php echo htmlspecialchars($payment['payment_method']); ?></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Số tiền</span>
                        <span class="value"><?php echo format_money($payment['amount']); ?></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Trạng thái</span>
                        <span class="value"><?php echo htmlspecialchars(get_payment_text($payment['payment_status'])); ?></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Ngày thanh toán</span>
                        <span class="value"><?php echo htmlspecialchars(formatDate($payment['paid_at'] ?? '')); ?></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Ghi chú</span>
                        <span class="value"><?php echo htmlspecialchars($payment['note']); ?></span>
                    </div>
                </div>
            <?php else: ?>
                <div class="info-item">
                    <span class="label">Thông báo</span>
                    <span class="value">Chưa có thông tin thanh toán.</span>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <?php if (can_customer_cancel($order['order_status'])): ?>
        <div class="cancel-card">
            <h2 class="section-title" style="margin-bottom:10px;">Hủy đơn hàng</h2>
            <p class="cancel-desc">
                Bạn chỉ nên hủy đơn hàng khi thật sự cần thiết. Sau khi hủy, hệ thống sẽ ghi nhận lý do để hỗ trợ xử lý tốt hơn.
            </p>

            <form method="POST" action="cancel_order.php" onsubmit="return confirm('Bạn có chắc muốn hủy đơn hàng này không?');">
                <input type="hidden" name="order_id" value="<?php echo (int)$order['id']; ?>">
                <textarea
                    name="cancel_reason"
                    rows="4"
                    placeholder="Nhập lý do hủy đơn hàng..."
                    required
                    class="cancel-textarea"
                ></textarea>
                <br>
                <button class="cancel-submit" type="submit">Hủy đơn hàng</button>
            </form>
        </div>
    <?php endif; ?>
</div>

</body>
</html>