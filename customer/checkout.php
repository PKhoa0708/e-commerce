<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";
require_once "../includes/header.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /customer/cart.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$mode = isset($_POST['mode']) ? trim($_POST['mode']) : 'cart';

// Thông tin user
$user = $db->users->findOne(['id' => $user_id]);

if (!$user) {
    header("Location: /customer/cart.php?error=" . urlencode("Không tìm thấy thông tin người dùng"));
    exit();
}

$items = [];
$subtotal = 0;

if ($mode === 'buy_now') {
    $product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
    $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;

    if ($product_id <= 0 || $quantity <= 0) {
        header("Location: /customer/products/index.php?error=" . urlencode("Dữ liệu mua ngay không hợp lệ"));
        exit();
    }

    $product = $db->products->findOne(['id' => $product_id]);

    if (!$product) {
        header("Location: /customer/products/index.php?error=" . urlencode("Không tìm thấy sản phẩm"));
        exit();
    }

    if ($product['status'] !== 'active') {
        header("Location: /customer/products/detail.php?id=" . $product_id . "&error=" . urlencode("Sản phẩm hiện không khả dụng"));
        exit();
    }

    if ($quantity > (int)$product['stock_quantity']) {
        header("Location: /customer/products/detail.php?id=" . $product_id . "&error=" . urlencode("Số lượng vượt quá tồn kho"));
        exit();
    }

    $line_subtotal = (float)$product['price'] * $quantity;
    $subtotal += $line_subtotal;

    $items[] = [
        'source' => 'buy_now',
        'cart_item_id' => 0,
        'product_id' => (int)$product['id'],
        'name' => $product['name'],
        'price' => (float)$product['price'],
        'quantity' => $quantity,
        'thumbnail' => $product['thumbnail'] ?? '',
        'subtotal' => $line_subtotal
    ];
} else {
    $selected_items = isset($_POST['selected_items']) ? $_POST['selected_items'] : [];

    if (empty($selected_items)) {
        header("Location: /customer/cart.php?error=" . urlencode("Vui lòng chọn ít nhất 1 sản phẩm"));
        exit();
    }

    $selected_ids = array_map('intval', $selected_items);
    $selected_ids = array_filter($selected_ids);

    if (empty($selected_ids)) {
        header("Location: /customer/cart.php?error=" . urlencode("Dữ liệu không hợp lệ"));
        exit();
    }

    $cart = $db->carts->findOne(['user_id' => $user_id]);

    if (!$cart) {
        header("Location: /customer/cart.php?error=" . urlencode("Không tìm thấy giỏ hàng"));
        exit();
    }

    $cart_id = (int)$cart['id'];

    $pipeline = [
        ['$match' => [
            'cart_id' => $cart_id,
            'id' => ['$in' => $selected_ids]
        ]],
        ['$lookup' => [
            'from' => 'products',
            'localField' => 'product_id',
            'foreignField' => 'id',
            'as' => 'product_info'
        ]],
        ['$unwind' => [
            'path' => '$product_info',
            'preserveNullAndEmptyArrays' => true
        ]],
        ['$project' => [
            'cart_item_id' => '$id',
            'quantity' => 1,
            'product_id' => '$product_info.id',
            'name' => '$product_info.name',
            'price' => '$product_info.price',
            'stock_quantity' => '$product_info.stock_quantity',
            'thumbnail' => '$product_info.thumbnail'
        ]],
        ['$sort' => ['cart_item_id' => -1]]
    ];

    $items = $db->cart_items->aggregate($pipeline)->toArray();

    foreach ($items as $idx => $row) {
        $items[$idx]['subtotal'] = (float)$row['price'] * (int)$row['quantity'];
        $items[$idx]['source'] = 'cart';
        $subtotal += $items[$idx]['subtotal'];
    }

    if (empty($items)) {
        header("Location: /customer/cart.php?error=" . urlencode("Không có sản phẩm hợp lệ để đặt hàng"));
        exit();
    }
}

$free_ship_threshold = 200000;
$shipping_fee = ($subtotal >= $free_ship_threshold) ? 0 : 30000;
$total_amount = $subtotal + $shipping_fee;
$needed_amount = max(0, $free_ship_threshold - $subtotal);
?>

<style>
    .checkout-page {
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
        min-height: calc(100vh - 120px);
        padding: 32px 0 70px;
    }

    .checkout-page * {
        box-sizing: border-box;
    }

    .checkout-page .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .checkout-hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 34px;
        margin-bottom: 24px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
            url('https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
        color: #fff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
    }

    .checkout-hero::before {
        content: "";
        position: absolute;
        top: -70px;
        right: -70px;
        width: 210px;
        height: 210px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .checkout-hero::after {
        content: "";
        position: absolute;
        left: -90px;
        bottom: -90px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .checkout-hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
    }

    .checkout-badge {
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

    .checkout-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 4vw, 44px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.6px;
    }

    .checkout-hero p {
        margin: 0;
        max-width: 720px;
        color: rgba(255,255,255,0.94);
        font-size: 16px;
        line-height: 1.7;
    }

    .checkout-back-btn {
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
        border: none;
        cursor: pointer;
    }

    .checkout-back-btn:hover {
        transform: translateY(-1px);
    }

    .checkout-form {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 24px;
        align-items: start;
    }

    .checkout-left,
    .checkout-right {
        display: grid;
        gap: 22px;
    }

    .checkout-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        overflow: hidden;
    }

    .checkout-card-head {
        padding: 22px 22px 0;
    }

    .checkout-card-title {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 800;
        color: #111827;
    }

    .checkout-card-desc {
        margin: 0 0 18px;
        color: #6B7280;
        font-size: 14px;
        line-height: 1.7;
    }

    .selected-products {
        padding: 0 22px 22px;
        display: grid;
        gap: 14px;
    }

    .checkout-product-item {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 16px;
        border-radius: 18px;
        background: #F8FAFC;
        border: 1px solid #EEF2F7;
    }

    .checkout-product-thumb {
        width: 92px;
        height: 92px;
        border-radius: 16px;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid #E5E7EB;
        background: #fff;
    }

    .checkout-product-noimg {
        width: 92px;
        height: 92px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6B7280;
        font-size: 13px;
        font-weight: 700;
        background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
        border: 1px solid #E5E7EB;
        flex-shrink: 0;
        text-align: center;
        padding: 8px;
    }

    .checkout-product-info {
        flex: 1;
        min-width: 0;
    }

    .checkout-product-name {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 800;
        color: #111827;
        line-height: 1.5;
    }

    .checkout-product-meta {
        display: grid;
        gap: 5px;
        color: #4B5563;
        font-size: 14px;
    }

    .checkout-money {
        color: #E53935;
        font-weight: 800;
    }

    .shipping-content {
        padding: 0 22px 22px;
    }

    .form-grid {
        display: grid;
        gap: 16px;
    }

    .form-field {
        display: grid;
        gap: 8px;
    }

    .form-field label {
        font-size: 14px;
        font-weight: 700;
        color: #374151;
    }

    .form-input,
    .form-select,
    .form-textarea {
        width: 100%;
        border: 1px solid #D1D5DB;
        border-radius: 16px;
        background: #fff;
        color: #111827;
        font-size: 15px;
        outline: none;
        transition: 0.25s ease;
        font-family: inherit;
    }

    .form-input,
    .form-select {
        height: 52px;
        padding: 0 14px;
    }

    .form-textarea {
        min-height: 120px;
        padding: 14px;
        resize: vertical;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
        border-color: #E53935;
        box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
    }

    .summary-content {
        padding: 0 22px 22px;
    }

    .summary-rows {
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
        background: #FFF1F1;
        border-color: #FDD5D5;
        color: #B91C1C;
        font-weight: 800;
    }

    .summary-row.total strong {
        color: #B91C1C;
        font-size: 18px;
    }

    .summary-note {
        margin-top: 14px;
        padding: 14px 16px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.6;
        border: 1px solid transparent;
    }

    .summary-note.free {
        background: #ECFDF5;
        color: #047857;
        border-color: #A7F3D0;
    }

    .summary-note.warning {
        background: #FFF7ED;
        color: #C2410C;
        border-color: #FED7AA;
    }

    .checkout-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 20px;
    }

    .checkout-btn {
        min-height: 52px;
        padding: 0 18px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        font-size: 15px;
        font-weight: 800;
        transition: 0.25s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .checkout-btn.primary {
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
        flex: 1;
    }

    .checkout-btn.primary:hover {
        transform: translateY(-1px);
    }

    .checkout-btn.secondary {
        background: #F3F4F6;
        color: #374151;
        border: 1px solid #E5E7EB;
    }

    .checkout-btn.secondary:hover {
        background: #E5E7EB;
    }

    @media (max-width: 992px) {
        .checkout-form {
            grid-template-columns: 1fr;
        }

        .checkout-hero {
            padding: 26px 20px;
            border-radius: 24px;
        }
    }

    @media (max-width: 640px) {
        .checkout-product-item {
            flex-direction: column;
            align-items: flex-start;
        }

        .checkout-product-thumb,
        .checkout-product-noimg {
            width: 100%;
            max-width: 160px;
            height: 160px;
        }

        .checkout-actions {
            flex-direction: column;
        }

        .checkout-btn.primary,
        .checkout-btn.secondary {
            width: 100%;
            flex: unset;
        }
    }
</style>

<div class="checkout-page">
    <div class="container">
        <section class="checkout-hero">
            <div class="checkout-hero-content">
                <div>
                    <div class="checkout-badge">🧾 Xác nhận đơn hàng</div>
                    <h1>Kiểm tra thông tin trước khi đặt hàng</h1>
                    <p>
                        Xem lại sản phẩm đã chọn, điền thông tin giao hàng và xác nhận phương thức thanh toán
                        trước khi hoàn tất đơn hàng của bạn.
                    </p>
                </div>

                <button type="button" class="checkout-back-btn" onclick="window.history.back();">
                    ← Quay lại
                </button>
            </div>
        </section>

        <form method="POST" action="/customer/place_order.php" class="checkout-form">
            <input type="hidden" name="mode" value="<?php echo htmlspecialchars($mode); ?>">

            <?php if ($mode === 'buy_now'): ?>
                <input type="hidden" name="product_id" value="<?php echo (int)$items[0]['product_id']; ?>">
                <input type="hidden" name="quantity" value="<?php echo (int)$items[0]['quantity']; ?>">
            <?php else: ?>
                <?php foreach ($items as $item): ?>
                    <input type="hidden" name="selected_items[]" value="<?php echo (int)$item['cart_item_id']; ?>">
                <?php endforeach; ?>
            <?php endif; ?>

            <div class="checkout-left">
                <div class="checkout-card">
                    <div class="checkout-card-head">
                        <h2 class="checkout-card-title">Sản phẩm đã chọn</h2>
                        <p class="checkout-card-desc">Kiểm tra lại số lượng, đơn giá và thành tiền của từng sản phẩm.</p>
                    </div>

                    <div class="selected-products">
                        <?php foreach ($items as $item): ?>
                            <div class="checkout-product-item">
                                <?php if (!empty($item['thumbnail'])): ?>
                                    <img
                                        src="/<?php echo htmlspecialchars($item['thumbnail']); ?>"
                                        alt="<?php echo htmlspecialchars($item['name']); ?>"
                                        class="checkout-product-thumb"
                                    >
                                <?php else: ?>
                                    <div class="checkout-product-noimg">No image</div>
                                <?php endif; ?>

                                <div class="checkout-product-info">
                                    <h3 class="checkout-product-name"><?php echo htmlspecialchars($item['name']); ?></h3>

                                    <div class="checkout-product-meta">
                                        <div>Đơn giá: <span class="checkout-money"><?php echo number_format($item['price'], 0, ',', '.'); ?> đ</span></div>
                                        <div>Số lượng: <strong><?php echo (int)$item['quantity']; ?></strong></div>
                                        <div>Thành tiền: <span class="checkout-money"><?php echo number_format($item['subtotal'], 0, ',', '.'); ?> đ</span></div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="checkout-card">
                    <div class="checkout-card-head">
                        <h2 class="checkout-card-title">Thông tin giao hàng</h2>
                        <p class="checkout-card-desc">Điền đầy đủ thông tin để hệ thống giao hàng chính xác hơn.</p>
                    </div>

                    <div class="shipping-content">
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Họ tên</label>
                                <input
                                    type="text"
                                    name="recipient_name"
                                    value="<?php echo htmlspecialchars($user['full_name']); ?>"
                                    required
                                    class="form-input"
                                >
                            </div>

                            <div class="form-field">
                                <label>Số điện thoại</label>
                                <input
                                    type="text"
                                    name="recipient_phone"
                                    value="<?php echo htmlspecialchars($user['phone']); ?>"
                                    required
                                    class="form-input"
                                >
                            </div>

                            <div class="form-field">
                                <label>Địa chỉ</label>
                                <textarea
                                    name="shipping_address"
                                    required
                                    class="form-textarea"
                                ><?php echo htmlspecialchars($user['address'] ?? ''); ?></textarea>
                            </div>

                            <div class="form-field">
                                <label>Phương thức thanh toán</label>
                                <select name="payment_method" required class="form-select">
                                    <option value="">-- Chọn phương thức thanh toán --</option>
                                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="checkout-right">
                <div class="checkout-card">
                    <div class="checkout-card-head">
                        <h2 class="checkout-card-title">Tóm tắt thanh toán</h2>
                        <p class="checkout-card-desc">Tổng hợp chi phí đơn hàng trước khi xác nhận.</p>
                    </div>

                    <div class="summary-content">
                        <div class="summary-rows">
                            <div class="summary-row">
                                <span>Tạm tính</span>
                                <strong><?php echo number_format($subtotal, 0, ',', '.'); ?> đ</strong>
                            </div>

                            <div class="summary-row">
                                <span>Phí vận chuyển</span>
                                <strong><?php echo number_format($shipping_fee, 0, ',', '.'); ?> đ</strong>
                            </div>

                            <div class="summary-row total">
                                <span>Tổng tiền</span>
                                <strong><?php echo number_format($total_amount, 0, ',', '.'); ?> đ</strong>
                            </div>
                        </div>

                        <?php if ($shipping_fee == 0): ?>
                            <div class="summary-note free">
                                Đơn hàng của bạn được miễn phí vận chuyển.
                            </div>
                        <?php else: ?>
                            <div class="summary-note warning">
                                Bạn cần mua thêm <?php echo number_format($needed_amount, 0, ',', '.'); ?> đ để được freeship.
                            </div>
                        <?php endif; ?>

                        <div class="checkout-actions">
                            <button type="button" class="checkout-btn secondary" onclick="window.history.back();">
                                Quay lại
                            </button>
                            <button type="submit" class="checkout-btn primary">
                                Đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>