<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";
require_once "../includes/header.php";

$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$user_id = $_SESSION['user_id'];

if ($order_id <= 0) {
    header("Location: /customer/cart.php?error=" . urlencode("Mã đơn hàng không hợp lệ"));
    exit();
}

$order = $db->orders->findOne(['id' => $order_id, 'user_id' => $user_id]);

if (!$order) {
    header("Location: /customer/cart.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

$order_items = $db->order_items->find(['order_id' => $order_id], ['sort' => ['id' => 1]])->toArray();
?>

<style>
    .success-page {
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
        min-height: calc(100vh - 120px);
        padding: 32px 0 70px;
    }

    .success-page * {
        box-sizing: border-box;
    }

    .success-page .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .success-hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 34px;
        margin-bottom: 24px;
        background:
            linear-gradient(135deg, rgba(22, 163, 74, 0.94), rgba(34, 197, 94, 0.84)),
            url('https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
        color: #fff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
    }

    .success-hero::before {
        content: "";
        position: absolute;
        top: -70px;
        right: -70px;
        width: 210px;
        height: 210px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .success-hero::after {
        content: "";
        position: absolute;
        left: -90px;
        bottom: -90px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .success-hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
    }

    .success-badge {
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

    .success-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(30px, 4vw, 44px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.6px;
    }

    .success-hero p {
        margin: 0;
        max-width: 760px;
        color: rgba(255,255,255,0.94);
        font-size: 16px;
        line-height: 1.7;
    }

    .hero-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        border-radius: 14px;
        background: #fff;
        color: #15803D;
        font-weight: 800;
        box-shadow: 0 10px 24px rgba(0,0,0,0.10);
        white-space: nowrap;
    }

    .success-layout {
        display: grid;
        grid-template-columns: 1fr 0.95fr;
        gap: 24px;
        align-items: start;
    }

    .success-left,
    .success-right {
        display: grid;
        gap: 22px;
    }

    .success-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        overflow: hidden;
    }

    .success-card-head {
        padding: 22px 22px 0;
    }

    .success-card-title {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 800;
        color: #111827;
    }

    .success-card-desc {
        margin: 0 0 18px;
        color: #6B7280;
        font-size: 14px;
        line-height: 1.7;
    }

    .info-grid {
        padding: 0 22px 22px;
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

    .order-items-list {
        padding: 0 22px 22px;
        display: grid;
        gap: 14px;
    }

    .order-item {
        display: grid;
        gap: 10px;
        padding: 18px;
        border-radius: 18px;
        background: #F8FAFC;
        border: 1px solid #EEF2F7;
    }

    .order-item-name {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: #111827;
        line-height: 1.5;
    }

    .order-item-meta {
        display: grid;
        gap: 6px;
        color: #4B5563;
        font-size: 14px;
    }

    .order-item-meta strong {
        color: #111827;
    }

    .money-text {
        color: #E53935;
        font-weight: 800;
    }

    .summary-box {
        padding: 0 22px 22px;
        display: grid;
        gap: 12px;
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
        color: #374151;
    }

    .summary-row strong {
        color: #111827;
    }

    .summary-row.total {
        background: #ECFDF5;
        border-color: #A7F3D0;
        color: #047857;
        font-weight: 800;
    }

    .summary-row.total strong {
        color: #047857;
        font-size: 18px;
    }

    .actions-card {
        padding: 22px;
    }

    .actions-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .action-link {
        min-height: 52px;
        padding: 0 18px;
        border-radius: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 15px;
        font-weight: 800;
        transition: 0.25s ease;
    }

    .action-link.primary {
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
    }

    .action-link.primary:hover {
        transform: translateY(-1px);
    }

    .action-link.secondary {
        background: #F3F4F6;
        color: #374151;
        border: 1px solid #E5E7EB;
    }

    .action-link.secondary:hover {
        background: #E5E7EB;
    }

    .empty-box {
        padding: 22px;
        color: #6B7280;
        font-size: 15px;
    }

    @media (max-width: 992px) {
        .success-layout {
            grid-template-columns: 1fr;
        }

        .success-hero {
            padding: 26px 20px;
            border-radius: 24px;
        }
    }

    @media (max-width: 640px) {
        .actions-row {
            flex-direction: column;
        }

        .action-link {
            width: 100%;
        }
    }
</style>

<div class="success-page">
    <div class="container">
        <section class="success-hero">
            <div class="success-hero-content">
                <div>
                    <div class="success-badge">✅ Đặt hàng thành công</div>
                    <h1>Cảm ơn bạn đã đặt hàng tại Lotte Mart</h1>
                    <p>
                        Đơn hàng của bạn đã được ghi nhận thành công. Bạn có thể kiểm tra lại thông tin đơn hàng,
                        sản phẩm đã đặt và tiếp tục mua sắm ngay từ trang này.
                    </p>
                </div>

                <div class="hero-chip">
                    Mã đơn: <?php echo htmlspecialchars($order['order_code']); ?>
                </div>
            </div>
        </section>

        <div class="success-layout">
            <div class="success-left">
                <div class="success-card">
                    <div class="success-card-head">
                        <h2 class="success-card-title">Thông tin đơn hàng</h2>
                        <p class="success-card-desc">Chi tiết người nhận, giao hàng, thanh toán và trạng thái đơn hàng.</p>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Mã đơn hàng</span>
                            <span class="value"><?php echo htmlspecialchars($order['order_code']); ?></span>
                        </div>

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
                            <span class="value"><?php echo nl2br(htmlspecialchars($order['shipping_address'])); ?></span>
                        </div>

                        <div class="info-item">
                            <span class="label">Phương thức thanh toán</span>
                            <span class="value"><?php echo htmlspecialchars($order['payment_method']); ?></span>
                        </div>

                        <div class="info-item">
                            <span class="label">Trạng thái thanh toán</span>
                            <span class="value"><?php echo htmlspecialchars($order['payment_status']); ?></span>
                        </div>

                        <div class="info-item">
                            <span class="label">Trạng thái đơn hàng</span>
                            <span class="value"><?php echo htmlspecialchars($order['order_status']); ?></span>
                        </div>

                        <div class="info-item">
                            <span class="label">Ngày tạo</span>
                            <span class="value"><?php echo htmlspecialchars(formatDate($order['created_at'])); ?></span>
                        </div>
                    </div>
                </div>

                <div class="success-card">
                    <div class="success-card-head">
                        <h2 class="success-card-title">Sản phẩm đã đặt</h2>
                        <p class="success-card-desc">Danh sách sản phẩm nằm trong đơn hàng của bạn.</p>
                    </div>

                    <?php if (!empty($order_items)): ?>
                        <div class="order-items-list">
                            <?php foreach ($order_items as $item): ?>
                                <div class="order-item">
                                    <h3 class="order-item-name"><?php echo htmlspecialchars($item['product_name']); ?></h3>

                                    <div class="order-item-meta">
                                        <div>Đơn giá: <span class="money-text"><?php echo number_format($item['product_price'], 0, ',', '.'); ?> đ</span></div>
                                        <div>Số lượng: <strong><?php echo (int)$item['quantity']; ?></strong></div>
                                        <div>Thành tiền: <span class="money-text"><?php echo number_format($item['subtotal'], 0, ',', '.'); ?> đ</span></div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="empty-box">Không có sản phẩm trong đơn hàng.</div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="success-right">
                <div class="success-card">
                    <div class="success-card-head">
                        <h2 class="success-card-title">Tóm tắt thanh toán</h2>
                        <p class="success-card-desc">Tổng hợp chi phí của đơn hàng vừa tạo.</p>
                    </div>

                    <div class="summary-box">
                        <div class="summary-row">
                            <span>Tạm tính</span>
                            <strong><?php echo number_format($order['subtotal'], 0, ',', '.'); ?> đ</strong>
                        </div>

                        <div class="summary-row">
                            <span>Phí vận chuyển</span>
                            <strong><?php echo number_format($order['shipping_fee'], 0, ',', '.'); ?> đ</strong>
                        </div>

                        <div class="summary-row total">
                            <span>Tổng thanh toán</span>
                            <strong><?php echo number_format($order['total_amount'], 0, ',', '.'); ?> đ</strong>
                        </div>
                    </div>
                </div>

                <div class="success-card actions-card">
                    <div class="success-card-head" style="padding:0; margin-bottom:18px;">
                        <h2 class="success-card-title">Thao tác tiếp theo</h2>
                        <p class="success-card-desc">Bạn có thể tiếp tục mua sắm hoặc quay lại giỏ hàng.</p>
                    </div>

                    <div class="actions-row">
                        <a href="/customer/dashboard.php" class="action-link primary">
                            Tiếp tục mua hàng
                        </a>

                        <a href="/customer/cart.php" class="action-link secondary">
                            Về giỏ hàng
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>