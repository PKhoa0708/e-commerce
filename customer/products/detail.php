<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: /customer/products/index.php");
    exit();
}

$id = (int)$_GET['id'];

$product = $db->products->findOne(['id' => $id, 'status' => 'active']);

if (!$product) {
    header("Location: /customer/products/index.php");
    exit();
}

$category = $db->categories->findOne(['id' => $product['category_id']]);
$product['category_name'] = $category ? $category['name'] : '';

$images = $db->product_images->find(
    ['product_id' => $id],
    ['sort' => ['is_main' => -1, 'id' => 1]]
)->toArray();

if (empty($images) && !empty($product['thumbnail'])) {
    $images[] = [
        'image_path' => $product['thumbnail'],
        'is_main' => 1
    ];
}

$main_image = "";
if (!empty($images)) {
    $main_image = "/" . $images[0]['image_path'];
}

$price = (float)$product['price'];
$stock_quantity = (int)$product['stock_quantity'];
?>

<style>
    .product-detail-page {
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
        min-height: calc(100vh - 120px);
        padding: 32px 0 70px;
    }

    .product-detail-page * {
        box-sizing: border-box;
    }

    .product-detail-page .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .product-hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 34px;
        margin-bottom: 24px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
            url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
        color: #fff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
    }

    .product-hero::before {
        content: "";
        position: absolute;
        top: -70px;
        right: -70px;
        width: 210px;
        height: 210px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .product-hero::after {
        content: "";
        position: absolute;
        left: -90px;
        bottom: -90px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .product-hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
    }

    .product-badge {
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

    .product-hero h1 {
        margin: 0 0 10px;
        font-size: clamp(28px, 4vw, 44px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.6px;
    }

    .product-hero p {
        margin: 0;
        max-width: 700px;
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
        text-decoration: none;
    }

    .back-btn:hover {
        transform: translateY(-1px);
    }

    .alert-box {
        margin-bottom: 16px;
        padding: 14px 16px;
        border-radius: 18px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid transparent;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
    }

    .alert-success {
        background: #F0FDF4;
        color: #166534;
        border-color: #BBF7D0;
    }

    .alert-error {
        background: #FEF2F2;
        color: #B91C1C;
        border-color: #FECACA;
    }

    .product-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
    }

    .gallery-card,
    .info-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 26px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        padding: 22px;
    }

    .main-image-wrap {
        border-radius: 22px;
        overflow: hidden;
        background: #F3F4F6;
        border: 1px solid #EEF2F7;
        margin-bottom: 16px;
    }

    .main-image {
        width: 100%;
        max-width: 100%;
        height: 460px;
        object-fit: cover;
        display: block;
    }

    .empty-main-image {
        width: 100%;
        height: 460px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6B7280;
        font-weight: 700;
        background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
    }

    .thumb-list {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .thumb-image {
        width: 86px;
        height: 86px;
        object-fit: cover;
        border-radius: 16px;
        border: 2px solid #E5E7EB;
        cursor: pointer;
        transition: 0.25s ease;
        background: #fff;
    }

    .thumb-image:hover {
        border-color: #E53935;
        transform: translateY(-2px);
    }

    .product-name {
        margin: 0 0 14px;
        font-size: 32px;
        line-height: 1.2;
        font-weight: 800;
        color: #111827;
        letter-spacing: -0.4px;
    }

    .info-grid {
        display: grid;
        gap: 12px;
        margin-bottom: 20px;
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
        font-size: 15px;
        line-height: 1.6;
        color: #111827;
        word-break: break-word;
    }

    .price-box {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 18px;
        background: linear-gradient(135deg, #FFF1F1, #FFF7ED);
        border: 1px solid #FDD5D5;
        color: #B91C1C;
        font-weight: 800;
        font-size: 24px;
        margin-bottom: 16px;
    }

    .stock-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 20px;
    }

    .stock-chip.in-stock {
        background: #ECFDF5;
        color: #047857;
        border: 1px solid #A7F3D0;
    }

    .stock-chip.out-stock {
        background: #FEF2F2;
        color: #B91C1C;
        border: 1px solid #FECACA;
    }

    .description-box {
        margin-top: 8px;
        border: 1px solid #E5E7EB;
        background: #FAFBFC;
        border-radius: 18px;
        padding: 18px;
        color: #374151;
        line-height: 1.8;
        font-size: 15px;
    }

    .actions-row {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        align-items: stretch;
        flex-wrap: wrap;
    }

    .action-btn,
    .icon-btn {
        border: none;
        cursor: pointer;
        transition: 0.25s ease;
        font-family: inherit;
    }

    .icon-btn {
        min-width: 56px;
        height: 56px;
        border-radius: 16px;
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        text-decoration: none;
    }

    .icon-btn:hover {
        transform: translateY(-1px);
        border-color: #E53935;
    }

    .action-btn {
        min-height: 56px;
        padding: 12px 18px;
        border-radius: 18px;
        font-weight: 800;
        font-size: 15px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-align: center;
    }

    .action-btn.cart {
        background: #1565C0;
        color: #fff;
        box-shadow: 0 14px 28px rgba(21, 101, 192, 0.20);
    }

    .action-btn.cart:hover {
        transform: translateY(-1px);
    }

    .action-btn.buy {
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
        flex-direction: column;
        min-width: 180px;
    }

    .action-btn.buy:hover {
        transform: translateY(-1px);
    }

    .action-btn.buy .sub {
        font-size: 13px;
        opacity: 0.95;
        font-weight: 700;
    }

    .popup-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        z-index: 9999;
        backdrop-filter: blur(4px);
        padding: 20px;
    }

    .popup-card {
        width: min(920px, 100%);
        max-height: 88vh;
        margin: 4vh auto 0;
        background: #fff;
        border-radius: 26px;
        box-shadow: 0 30px 70px rgba(15, 23, 42, 0.22);
        overflow: auto;
        position: relative;
        border: 1px solid #E5E7EB;
    }

    .popup-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        border: none;
        background: #F3F4F6;
        cursor: pointer;
        font-weight: 800;
        z-index: 2;
        transition: 0.25s ease;
    }

    .popup-close:hover {
        background: #E5E7EB;
    }

    .popup-inner {
        padding: 28px;
    }

    .popup-title {
        margin: 0;
        font-size: 28px;
        font-weight: 800;
        color: #111827;
    }

    .popup-grid {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 24px;
        margin-top: 22px;
        align-items: start;
    }

    .popup-image {
        width: 240px;
        height: 240px;
        object-fit: cover;
        border-radius: 20px;
        border: 1px solid #E5E7EB;
        background: #F3F4F6;
        display: block;
    }

    .popup-no-image {
        width: 240px;
        height: 240px;
        border-radius: 20px;
        border: 1px solid #E5E7EB;
        background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6B7280;
        font-weight: 700;
    }

    .popup-product-name {
        margin: 0 0 14px;
        font-size: 24px;
        font-weight: 800;
        color: #111827;
    }

    .popup-meta {
        display: grid;
        gap: 12px;
        margin-bottom: 18px;
    }

    .popup-meta-item {
        background: #F8FAFC;
        border: 1px solid #EEF2F7;
        border-radius: 14px;
        padding: 12px 14px;
        font-size: 14px;
        color: #374151;
    }

    .popup-meta-item strong {
        color: #111827;
    }

    .qty-section {
        margin-top: 18px;
    }

    .qty-title {
        font-size: 14px;
        font-weight: 800;
        color: #111827;
        margin-bottom: 10px;
    }

    .qty-control {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        padding: 10px;
        border-radius: 18px;
    }

    .qty-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        border: none;
        background: #fff;
        cursor: pointer;
        font-size: 18px;
        font-weight: 800;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
    }

    .qty-input {
        width: 78px;
        height: 40px;
        border: 1px solid #D1D5DB;
        border-radius: 12px;
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        outline: none;
    }

    .qty-input:focus {
        border-color: #E53935;
        box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
    }

    .popup-submit {
        margin-top: 24px;
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

    .popup-submit:hover {
        transform: translateY(-1px);
    }

    @media (max-width: 992px) {
        .product-main {
            grid-template-columns: 1fr;
        }

        .main-image,
        .empty-main-image {
            height: 360px;
        }

        .product-hero {
            padding: 26px 20px;
            border-radius: 24px;
        }

        .popup-grid {
            grid-template-columns: 1fr;
        }

        .popup-image,
        .popup-no-image {
            width: 100%;
            max-width: 280px;
            height: 280px;
        }
    }

    @media (max-width: 640px) {
        .actions-row {
            flex-direction: column;
        }

        .action-btn.buy,
        .action-btn.cart,
        .icon-btn {
            width: 100%;
        }

        .thumb-image {
            width: 74px;
            height: 74px;
        }
    }
</style>

<div class="product-detail-page">
    <div class="container">
        <section class="product-hero">
            <div class="product-hero-content">
                <div>
                    <div class="product-badge">🛍️ Chi tiết sản phẩm</div>
                    <h1><?php echo htmlspecialchars($product['name']); ?></h1>
                    <p>
                        Xem thông tin sản phẩm, hình ảnh, mô tả chi tiết và thực hiện mua ngay
                        hoặc thêm vào giỏ hàng chỉ với vài thao tác.
                    </p>
                </div>

                <a href="/customer/dashboard.php" class="back-btn">← Quay lại danh sách</a>
            </div>
        </section>

        <?php if (isset($_GET['success'])): ?>
            <div class="alert-box alert-success">
                <?php echo htmlspecialchars($_GET['success']); ?>
            </div>
        <?php endif; ?>

        <?php if (isset($_GET['error'])): ?>
            <div class="alert-box alert-error">
                <?php echo htmlspecialchars($_GET['error']); ?>
            </div>
        <?php endif; ?>

        <div class="product-main">
            <div class="gallery-card">
                <?php if (!empty($images)): ?>
                    <div class="main-image-wrap">
                        <img
                            id="main-product-image"
                            src="/<?php echo htmlspecialchars($images[0]['image_path']); ?>"
                            alt="<?php echo htmlspecialchars($product['name']); ?>"
                            class="main-image"
                        >
                    </div>

                    <div class="thumb-list">
                        <?php foreach ($images as $img): ?>
                            <img
                                src="/<?php echo htmlspecialchars($img['image_path']); ?>"
                                alt="Ảnh sản phẩm"
                                onclick="changeMainImage(this)"
                                class="thumb-image"
                            >
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <div class="empty-main-image">Không có ảnh</div>
                <?php endif; ?>
            </div>

            <div class="info-card">
                <h2 class="product-name"><?php echo htmlspecialchars($product['name']); ?></h2>

                <div class="price-box">
                    <?php echo number_format($product['price'], 0, ',', '.'); ?> đ
                </div>

                <?php if ($stock_quantity > 0): ?>
                    <div class="stock-chip in-stock">Còn hàng: <?php echo (int)$product['stock_quantity']; ?></div>
                <?php else: ?>
                    <div class="stock-chip out-stock">Đã hết hàng</div>
                <?php endif; ?>

                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Danh mục</span>
                        <span class="value"><?php echo htmlspecialchars($product['category_name']); ?></span>
                    </div>

                    <div class="info-item">
                        <span class="label">Mã sản phẩm</span>
                        <span class="value"><?php echo !empty($product['sku']) ? htmlspecialchars($product['sku']) : 'Chưa có'; ?></span>
                    </div>

                    <div class="info-item">
                        <span class="label">Tồn kho</span>
                        <span class="value"><?php echo (int)$product['stock_quantity']; ?></span>
                    </div>
                </div>

                <div>
                    <div class="label" style="font-size:14px;font-weight:800;color:#111827;margin-bottom:10px;">Mô tả sản phẩm</div>
                    <div class="description-box">
                        <?php echo nl2br(htmlspecialchars($product['description'])); ?>
                    </div>
                </div>

                <div class="actions-row">
                    <a href="/customer/chat/index.php" class="icon-btn" title="Chat hỗ trợ">💬</a>

                    <button type="button" onclick="openCartPopup()" class="action-btn cart">
                        🛒 Thêm vào giỏ hàng
                    </button>

                    <button type="button" onclick="openBuyPopup()" class="action-btn buy">
                        <span>Mua ngay</span>
                        <span class="sub"><?php echo number_format($product['price'], 0, ',', '.'); ?> đ</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="product-popup-overlay" class="popup-overlay">
    <div class="popup-card">
        <button type="button" onclick="closePopup()" class="popup-close">✕</button>

        <div class="popup-inner">
            <h3 id="popup-title" class="popup-title">Popup sản phẩm</h3>

            <div class="popup-grid">
                <div>
                    <?php if (!empty($main_image)): ?>
                        <img
                            id="popup-product-image"
                            src="<?php echo htmlspecialchars($main_image); ?>"
                            alt="<?php echo htmlspecialchars($product['name']); ?>"
                            class="popup-image"
                        >
                    <?php else: ?>
                        <div class="popup-no-image">Không có ảnh</div>
                    <?php endif; ?>
                </div>

                <div>
                    <h4 class="popup-product-name"><?php echo htmlspecialchars($product['name']); ?></h4>

                    <div class="popup-meta">
                        <div class="popup-meta-item">
                            <strong>Đơn giá:</strong>
                            <span id="unit-price-text"><?php echo number_format($price, 0, ',', '.'); ?> đ</span>
                        </div>

                        <div class="popup-meta-item">
                            <strong>Tổng tiền:</strong>
                            <span id="total-price-text"><?php echo number_format($price, 0, ',', '.'); ?> đ</span>
                        </div>

                        <div class="popup-meta-item">
                            <strong>Tồn kho:</strong> <?php echo $stock_quantity; ?>
                        </div>
                    </div>

                    <div class="qty-section">
                        <div class="qty-title">Số lượng</div>
                        <div class="qty-control">
                            <button type="button" onclick="decreaseQty()" class="qty-btn">-</button>

                            <input
                                type="number"
                                id="popup-quantity"
                                value="1"
                                min="1"
                                max="<?php echo $stock_quantity; ?>"
                                oninput="handleQuantityInput()"
                                class="qty-input"
                            >

                            <button type="button" onclick="increaseQty()" class="qty-btn">+</button>
                        </div>
                    </div>

                    <form method="POST" action="/customer/add_to_cart.php" id="product-action-form" style="margin-top:24px;">
                        <input type="hidden" name="product_id" value="<?php echo (int)$product['id']; ?>">
                        <input type="hidden" name="quantity" id="form-quantity" value="1">
                        <input type="hidden" name="mode" id="form-mode" value="cart">

                        <button type="submit" id="popup-submit-button" class="popup-submit">
                            Thêm vào giỏ hàng
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function changeMainImage(imgElement) {
    document.getElementById('main-product-image').src = imgElement.src;
    var popupImage = document.getElementById('popup-product-image');
    if (popupImage) {
        popupImage.src = imgElement.src;
    }
}

var productPrice = <?php echo json_encode($price); ?>;
var stockQuantity = <?php echo json_encode($stock_quantity); ?>;

function openCartPopup() {
    document.getElementById('product-popup-overlay').style.display = 'block';
    document.getElementById('popup-title').innerText = 'Thêm vào giỏ hàng';
    document.getElementById('popup-submit-button').innerText = 'Thêm vào giỏ hàng';
    document.getElementById('form-mode').value = 'cart';
    document.getElementById('product-action-form').action = '/customer/add_to_cart.php';
    resetPopupQuantity();
}

function openBuyPopup() {
    document.getElementById('product-popup-overlay').style.display = 'block';
    document.getElementById('popup-title').innerText = 'Mua ngay';
    document.getElementById('popup-submit-button').innerText = 'Mua ngay';
    document.getElementById('form-mode').value = 'buy_now';
    document.getElementById('product-action-form').action = '/customer/checkout.php';
    resetPopupQuantity();
}

function closePopup() {
    document.getElementById('product-popup-overlay').style.display = 'none';
}

function resetPopupQuantity() {
    document.getElementById('popup-quantity').value = 1;
    document.getElementById('form-quantity').value = 1;
    updateTotalPrice();
}

function increaseQty() {
    var qtyInput = document.getElementById('popup-quantity');
    var qty = parseInt(qtyInput.value) || 1;

    if (qty < stockQuantity) {
        qty++;
        qtyInput.value = qty;
        document.getElementById('form-quantity').value = qty;
        updateTotalPrice();
    }
}

function decreaseQty() {
    var qtyInput = document.getElementById('popup-quantity');
    var qty = parseInt(qtyInput.value) || 1;

    if (qty > 1) {
        qty--;
        qtyInput.value = qty;
        document.getElementById('form-quantity').value = qty;
        updateTotalPrice();
    }
}

function handleQuantityInput() {
    var qtyInput = document.getElementById('popup-quantity');
    var qty = parseInt(qtyInput.value);

    if (isNaN(qty) || qty < 1) {
        qty = 1;
    }

    if (qty > stockQuantity) {
        qty = stockQuantity;
    }

    qtyInput.value = qty;
    document.getElementById('form-quantity').value = qty;
    updateTotalPrice();
}

function updateTotalPrice() {
    var qty = parseInt(document.getElementById('popup-quantity').value) || 1;
    var total = qty * productPrice;
    document.getElementById('total-price-text').innerText = formatVND(total) + ' đ';
}

function formatVND(number) {
    return Number(number).toLocaleString('vi-VN');
}

document.getElementById('product-popup-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closePopup();
    }
});
</script>

<?php require_once "../../includes/footer.php"; ?>