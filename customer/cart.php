<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";
require_once "../includes/header.php";

$user_id = $_SESSION['user_id'];

// Lấy cart của user
$cart = $db->carts->findOne(['user_id' => $user_id]);

if (!$cart) {
    ?>
    <style>
        .cart-page {
            background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
            min-height: calc(100vh - 120px);
            padding: 32px 0 70px;
        }
        .cart-page * { box-sizing: border-box; }
        .cart-page .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 16px;
        }
        .cart-empty-card {
            background: #fff;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
            padding: 36px 24px;
            text-align: center;
        }
        .cart-empty-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 18px;
            border-radius: 24px;
            background: #F3F4F6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
        }
        .cart-empty-title {
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 800;
            color: #111827;
        }
        .cart-empty-text {
            margin: 0 0 20px;
            color: #6B7280;
            font-size: 15px;
        }
        .cart-action-btn {
            min-height: 50px;
            padding: 0 18px;
            border-radius: 16px;
            border: 1px solid #E5E7EB;
            background: #fff;
            color: #374151;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: 0.25s ease;
        }
        .cart-action-btn:hover {
            background: #F3F4F6;
        }
    </style>

    <div class="cart-page">
        <div class="container">
            <div class="cart-empty-card">
                <div class="cart-empty-icon">🛒</div>
                <h2 class="cart-empty-title">Giỏ hàng của bạn</h2>
                <p class="cart-empty-text">Không tìm thấy giỏ hàng.</p>
                <div style="margin-top:15px;">
                    <button type="button" onclick="goBack()" class="cart-action-btn">Quay lại</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    function goBack() {
        if (document.referrer !== "") {
            window.history.back();
        } else {
            window.location.href = "/customer/products/index.php";
        }
    }
    </script>
    <?php
    require_once "../includes/footer.php";
    exit();
}

$cart_id = $cart['id'];

// Lấy sản phẩm trong giỏ
$pipeline = [
    ['$match' => ['cart_id' => (int)$cart_id]],
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
        'price' => '$product_info.price',
        'stock_quantity' => '$product_info.stock_quantity',
        'thumbnail' => '$product_info.thumbnail'
    ]],
    ['$sort' => ['cart_item_id' => -1]]
];

$cart_items = $db->cart_items->aggregate($pipeline)->toArray();
?>

<style>
    .cart-page {
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
        min-height: calc(100vh - 120px);
        padding: 32px 0 70px;
    }

    .cart-page * {
        box-sizing: border-box;
    }

    .cart-page .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .cart-hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 34px;
        margin-bottom: 24px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
            url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
        color: #fff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
    }

    .cart-hero::before {
        content: "";
        position: absolute;
        top: -70px;
        right: -70px;
        width: 210px;
        height: 210px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .cart-hero::after {
        content: "";
        position: absolute;
        left: -90px;
        bottom: -90px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .cart-hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
    }

    .cart-badge {
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

    .cart-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 4vw, 44px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.6px;
    }

    .cart-hero p {
        margin: 0;
        max-width: 760px;
        color: rgba(255,255,255,0.94);
        font-size: 16px;
        line-height: 1.7;
    }

    .cart-back-link {
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
        text-decoration: none;
    }

    .cart-back-link:hover {
        transform: translateY(-1px);
    }

    .cart-message {
        margin-bottom: 16px;
        padding: 14px 16px;
        border-radius: 18px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid transparent;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
    }

    .cart-message.success {
        background: #F0FDF4;
        color: #166534;
        border-color: #BBF7D0;
    }

    .cart-message.error {
        background: #FEF2F2;
        color: #B91C1C;
        border-color: #FECACA;
    }

    .cart-layout {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 24px;
        align-items: start;
    }

    .cart-left,
    .cart-right {
        display: grid;
        gap: 22px;
    }

    .cart-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        overflow: hidden;
    }

    .cart-card-head {
        padding: 22px 22px 0;
    }

    .cart-card-title {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 800;
        color: #111827;
    }

    .cart-card-desc {
        margin: 0 0 18px;
        color: #6B7280;
        font-size: 14px;
        line-height: 1.7;
    }

    .cart-items-list {
        padding: 0 22px 22px;
        display: grid;
        gap: 14px;
    }

    .cart-item {
        display: grid;
        grid-template-columns: auto 100px 1fr auto auto auto;
        gap: 16px;
        align-items: center;
        padding: 16px;
        border-radius: 18px;
        background: #F8FAFC;
        border: 1px solid #EEF2F7;
    }

    .round-check {
        width: 22px;
        height: 22px;
        appearance: none;
        -webkit-appearance: none;
        border: 2px solid #999;
        border-radius: 50%;
        cursor: pointer;
        background: #fff;
        position: relative;
        outline: none;
        transition: 0.2s ease;
    }

    .round-check:checked {
        border-color: #e60012;
    }

    .round-check:checked::after {
        content: "";
        width: 10px;
        height: 10px;
        background: #e60012;
        border-radius: 50%;
        position: absolute;
        top: 4px;
        left: 4px;
    }

    .cart-thumb {
        width: 92px;
        height: 92px;
        border-radius: 16px;
        object-fit: cover;
        border: 1px solid #E5E7EB;
        background: #fff;
    }

    .cart-noimg {
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
        text-align: center;
        padding: 8px;
    }

    .cart-price {
        font-size: 18px;
        font-weight: 800;
        color: #E53935;
        min-width: 130px;
    }

    .qty-control {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #fff;
        border: 1px solid #E5E7EB;
        padding: 8px;
        border-radius: 16px;
    }

    .qty-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 12px;
        background: #F3F4F6;
        cursor: pointer;
        font-size: 18px;
        font-weight: 800;
        transition: 0.2s ease;
    }

    .qty-btn:hover {
        background: #E5E7EB;
    }

    .qty-value {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        font-weight: 800;
        color: #111827;
    }

    .cart-subtotal {
        min-width: 170px;
        font-size: 15px;
        color: #374151;
    }

    .cart-subtotal strong {
        color: #111827;
    }

    .cart-remove {
        min-height: 46px;
        padding: 0 14px;
        border-radius: 14px;
        border: 1px solid #FECACA;
        background: #FEF2F2;
        color: #B91C1C;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: 0.25s ease;
        white-space: nowrap;
    }

    .cart-remove:hover {
        background: #FEE2E2;
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

    .freeship-message {
        margin: 14px 0 0;
        padding: 14px 16px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.6;
        background: #FFF7ED;
        color: #C2410C;
        border: 1px solid #FED7AA;
        min-height: 52px;
    }

    .cart-submit-btn {
        margin-top: 18px;
        width: 100%;
        min-height: 52px;
        padding: 0 18px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
        transition: 0.25s ease;
    }

    .cart-submit-btn:hover {
        transform: translateY(-1px);
    }

    .cart-empty-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        padding: 36px 24px;
        text-align: center;
    }

    .cart-empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 18px;
        border-radius: 24px;
        background: #F3F4F6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 34px;
    }

    .cart-empty-title {
        margin: 0 0 10px;
        font-size: 28px;
        font-weight: 800;
        color: #111827;
    }

    .cart-empty-text {
        margin: 0;
        color: #6B7280;
        font-size: 15px;
    }

    @media (max-width: 1100px) {
        .cart-layout {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 900px) {
        .cart-item {
            grid-template-columns: 1fr;
            justify-items: start;
        }

        .cart-price,
        .cart-subtotal {
            min-width: unset;
        }

        .cart-thumb,
        .cart-noimg {
            width: 120px;
            height: 120px;
        }
    }

    @media (max-width: 640px) {
        .cart-hero {
            padding: 26px 20px;
            border-radius: 24px;
        }
    }
</style>

<div class="cart-page">
    <div class="container">
        <section class="cart-hero">
            <div class="cart-hero-content">
                <div>
                    <div class="cart-badge">🛒 Giỏ hàng của bạn</div>
                    <h1>Kiểm tra sản phẩm trước khi thanh toán</h1>
                    <p>
                        Chọn sản phẩm muốn đặt, cập nhật số lượng linh hoạt và xem tổng thanh toán
                        theo thời gian thực trước khi xác nhận đơn hàng.
                    </p>
                </div>

                <a href="dashboard.php" class="cart-back-link">← Quay lại mua sắm</a>
            </div>
        </section>

        <?php if (isset($_GET['success'])): ?>
            <div class="cart-message success"><?php echo htmlspecialchars($_GET['success']); ?></div>
        <?php endif; ?>

        <?php if (isset($_GET['error'])): ?>
            <div class="cart-message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
        <?php endif; ?>

        <?php if (!empty($cart_items)): ?>
            <form method="POST" action="/customer/checkout.php" id="cart-form" class="cart-layout">
                <div class="cart-left">
                    <div class="cart-card">
                        <div class="cart-card-head">
                            <h2 class="cart-card-title">Sản phẩm trong giỏ</h2>
                            <p class="cart-card-desc">
                                Chọn những sản phẩm bạn muốn thanh toán và cập nhật số lượng trực tiếp trong giỏ hàng.
                            </p>
                        </div>

                        <div class="cart-items-list">
                            <?php foreach ($cart_items as $item): ?>
                                <?php $subtotal = (float)$item['price'] * (int)$item['quantity']; ?>

                                <div class="cart-item">
                                    <div>
                                        <input
                                            type="checkbox"
                                            name="selected_items[]"
                                            value="<?php echo (int)$item['cart_item_id']; ?>"
                                            class="cart-item-checkbox round-check"
                                            data-cart-item-id="<?php echo (int)$item['cart_item_id']; ?>"
                                            data-price="<?php echo (float)$item['price']; ?>"
                                            data-quantity="<?php echo (int)$item['quantity']; ?>"
                                        >
                                    </div>

                                    <div>
                                        <?php if (!empty($item['thumbnail'])): ?>
                                            <img
                                                src="/<?php echo htmlspecialchars($item['thumbnail']); ?>"
                                                alt="Ảnh sản phẩm"
                                                class="cart-thumb"
                                            >
                                        <?php else: ?>
                                            <div class="cart-noimg">No image</div>
                                        <?php endif; ?>
                                    </div>

                                    <div class="cart-price">
                                        <?php echo number_format($item['price'], 0, ',', '.'); ?> đ
                                    </div>

                                    <div class="qty-control">
                                        <button
                                            type="button"
                                            onclick="changeQuantity(<?php echo (int)$item['cart_item_id']; ?>, 'decrease')"
                                            class="qty-btn"
                                        >-</button>

                                        <span
                                            id="qty-<?php echo (int)$item['cart_item_id']; ?>"
                                            class="qty-value"
                                        >
                                            <?php echo (int)$item['quantity']; ?>
                                        </span>

                                        <button
                                            type="button"
                                            onclick="changeQuantity(<?php echo (int)$item['cart_item_id']; ?>, 'increase')"
                                            class="qty-btn"
                                        >+</button>
                                    </div>

                                  

                                    <div>
                                        <a
                                            href="/customer/remove_from_cart.php?cart_item_id=<?php echo (int)$item['cart_item_id']; ?>"
                                            onclick="return confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?');"
                                            class="cart-remove"
                                        >
                                            Xóa sản phẩm
                                        </a>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <div class="cart-right">
                    <div class="cart-card">
                        <div class="cart-card-head">
                            <h2 class="cart-card-title">Tóm tắt thanh toán</h2>
                            <p class="cart-card-desc">
                                Tổng tiền sẽ được tính theo các sản phẩm bạn đã chọn trong giỏ hàng.
                            </p>
                        </div>

                        <div class="summary-content">
                            <div class="summary-rows">
                                <div class="summary-row">
                                    <span>Tạm tính</span>
                                    <strong id="selected-subtotal">0 đ</strong>
                                </div>

                                <div class="summary-row">
                                    <span>Phí vận chuyển</span>
                                    <strong id="shipping-fee">0 đ</strong>
                                </div>

                                <div class="summary-row total">
                                    <span>Tổng thanh toán</span>
                                    <strong id="selected-total">0 đ</strong>
                                </div>
                            </div>

                            <div id="freeship-message" class="freeship-message"></div>

                            <button type="submit" class="cart-submit-btn">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        <?php else: ?>
            <div class="cart-empty-card">
                <div class="cart-empty-icon">🧺</div>
                <h2 class="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
                <p class="cart-empty-text">
                    Hãy quay lại trang sản phẩm để chọn những món hàng phù hợp cho đơn hàng của bạn.
                </p>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
const FREE_SHIP_THRESHOLD = 200000;
const DEFAULT_SHIPPING_FEE = 30000;

function formatVND(number) {
    return Number(number).toLocaleString('vi-VN') + ' đ';
}

function calculateShipping(subtotal) {
    if (subtotal <= 0) {
        return {
            shippingFee: 0,
            total: 0,
            message: ''
        };
    }

    if (subtotal >= FREE_SHIP_THRESHOLD) {
        return {
            shippingFee: 0,
            total: subtotal,
            message: 'Đơn hàng trên 200.000đ được miễn phí vận chuyển.'
        };
    }

    const needed = FREE_SHIP_THRESHOLD - subtotal;

    return {
        shippingFee: DEFAULT_SHIPPING_FEE,
        total: subtotal + DEFAULT_SHIPPING_FEE,
        message: 'Bạn cần mua thêm ' + formatVND(needed) + ' để được freeship.'
        };
}

function updateSelectedTotal() {
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    let subtotal = 0;

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            const price = parseFloat(checkbox.getAttribute('data-price')) || 0;
            const quantity = parseInt(checkbox.getAttribute('data-quantity')) || 0;
            subtotal += price * quantity;
        }
    });

    const shippingData = calculateShipping(subtotal);

    document.getElementById('selected-subtotal').innerText = formatVND(subtotal);
    document.getElementById('shipping-fee').innerText = formatVND(shippingData.shippingFee);
    document.getElementById('selected-total').innerText = formatVND(shippingData.total);
    document.getElementById('freeship-message').innerText = shippingData.message;

    const freeshipBox = document.getElementById('freeship-message');
    if (subtotal <= 0) {
        freeshipBox.className = 'freeship-message';
    } else if (shippingData.shippingFee === 0) {
        freeshipBox.className = 'freeship-message';
        freeshipBox.style.background = '#ECFDF5';
        freeshipBox.style.color = '#047857';
        freeshipBox.style.borderColor = '#A7F3D0';
    } else {
        freeshipBox.className = 'freeship-message';
        freeshipBox.style.background = '#FFF7ED';
        freeshipBox.style.color = '#C2410C';
        freeshipBox.style.borderColor = '#FED7AA';
    }
}

document.querySelectorAll('.cart-item-checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('change', updateSelectedTotal);
});

function changeQuantity(cartItemId, action) {
    const formData = new FormData();
    formData.append('cart_item_id', cartItemId);
    formData.append('action', action);

    fetch('/customer/update_cart.php', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (!data.success) {
            alert(data.message);
            return;
        }

        const qtyElement = document.getElementById('qty-' + cartItemId);
        const subtotalElement = document.getElementById('subtotal-' + cartItemId);
        const checkbox = document.querySelector('.cart-item-checkbox[data-cart-item-id="' + cartItemId + '"]');

        if (qtyElement) {
            qtyElement.innerText = data.quantity;
        }

        if (subtotalElement) {
            subtotalElement.innerText = formatVND(data.subtotal);
        }

        if (checkbox) {
            checkbox.setAttribute('data-quantity', data.quantity);
        }

        updateSelectedTotal();
    })
    .catch(function() {
        alert('Có lỗi xảy ra khi cập nhật số lượng');
    });
}

function goBack() {
    if (document.referrer !== "") {
        window.history.back();
    } else {
        window.location.href = "/customer/products/index.php";
    }
}

document.getElementById('cart-form')?.addEventListener('submit', function(e) {
    const checked = document.querySelectorAll('.cart-item-checkbox:checked');
    if (checked.length === 0) {
        e.preventDefault();
        alert('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng');
    }
});

// khởi tạo
updateSelectedTotal();
</script>

<?php require_once "../includes/footer.php"; ?>