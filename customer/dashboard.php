<?php
require_once "../middleware/auth.php";

$allowed_roles = ['customer'];
require_once "../middleware/role.php";

require_once "../database/db.php";
require_once "../includes/header.php";

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;

$categories_result = $db->categories->find(['status' => 1], ['sort' => ['id' => -1]])->toArray();

$match = ['status' => 'active'];

if ($keyword !== '') {
    $match['name'] = new MongoDB\BSON\Regex($keyword, 'i');
}

if ($category_id > 0) {
    $match['category_id'] = $category_id;
}

$pipeline = [
    ['$match' => $match],
    ['$lookup' => [
        'from' => 'categories',
        'localField' => 'category_id',
        'foreignField' => 'id',
        'as' => 'category_info'
    ]],
    ['$unwind' => [
        'path' => '$category_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'name' => 1,
        'sku' => 1,
        'description' => 1,
        'price' => 1,
        'stock_quantity' => 1,
        'thumbnail' => 1,
        'status' => 1,
        'category_id' => 1,
        'created_at' => 1,
        'updated_at' => 1,
        'category_name' => '$category_info.name',
        'is_out_of_stock' => [
            '$cond' => [
                ['$eq' => ['$stock_quantity', 0]],
                1,
                0
            ]
        ]
    ]],
    ['$sort' => [
        'is_out_of_stock' => 1,
        'id' => -1
    ]]
];

$result = $db->products->aggregate($pipeline)->toArray();
?>

<style>
    .customer-dashboard {
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF9F9 100%);
        min-height: calc(100vh - 120px);
        padding: 32px 0 70px;
    }

    .customer-dashboard * {
        box-sizing: border-box;
    }

    .customer-dashboard .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .customer-dashboard .hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 36px;
        margin-bottom: 28px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.92), rgba(255, 179, 0, 0.84)),
            url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
        color: #fff;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
    }

    .customer-dashboard .hero::before {
        content: "";
        position: absolute;
        top: -60px;
        right: -60px;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .customer-dashboard .hero::after {
        content: "";
        position: absolute;
        bottom: -80px;
        left: -80px;
        width: 240px;
        height: 240px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .customer-dashboard .hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-end;
        flex-wrap: wrap;
    }

    .customer-dashboard .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.16);
        border: 1px solid rgba(255,255,255,0.18);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 16px;
    }

    .customer-dashboard .hero h1 {
        margin: 0 0 10px;
        font-size: clamp(30px, 4vw, 46px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.6px;
    }

    .customer-dashboard .hero p {
        margin: 0;
        max-width: 650px;
        color: rgba(255,255,255,0.94);
        font-size: 16px;
        line-height: 1.7;
    }

    .customer-dashboard .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .customer-dashboard .hero-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 18px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
        transition: 0.25s ease;
        border: 1px solid transparent;
    }

    .customer-dashboard .hero-btn.primary {
        background: #fff;
        color: #E53935;
        box-shadow: 0 10px 24px rgba(0,0,0,0.10);
    }

    .customer-dashboard .hero-btn.primary:hover {
        transform: translateY(-1px);
    }

    .customer-dashboard .hero-btn.soft {
        background: rgba(255,255,255,0.12);
        color: #fff;
        border-color: rgba(255,255,255,0.18);
    }

    .customer-dashboard .hero-btn.soft:hover {
        background: rgba(255,255,255,0.18);
    }

    .customer-dashboard .layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 24px;
        align-items: start;
    }

    .customer-dashboard .sidebar-card,
    .customer-dashboard .content-card,
    .customer-dashboard .search-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .customer-dashboard .sidebar-card {
        padding: 22px;
        position: sticky;
        top: 95px;
    }

    .customer-dashboard .sidebar-title {
        margin: 0 0 18px;
        font-size: 20px;
        font-weight: 800;
        color: #111827;
    }

    .customer-dashboard .category-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .customer-dashboard .category-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-radius: 14px;
        text-decoration: none;
        background: #F8FAFC;
        color: #374151;
        border: 1px solid #EEF2F7;
        font-weight: 600;
        transition: 0.25s ease;
    }

    .customer-dashboard .category-link:hover {
        border-color: #E53935;
        color: #E53935;
        transform: translateX(2px);
    }

    .customer-dashboard .category-link.active {
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
    }

    .customer-dashboard .content-area {
        display: grid;
        gap: 20px;
    }

    .customer-dashboard .search-card {
        padding: 22px;
    }

    .customer-dashboard .search-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }

    .customer-dashboard .search-title {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        color: #111827;
    }

    .customer-dashboard .search-desc {
        margin: 6px 0 0;
        color: #6B7280;
        font-size: 14px;
    }

    .customer-dashboard .orders-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 14px;
        text-decoration: none;
        background: rgba(21, 101, 192, 0.08);
        color: #1565C0;
        font-weight: 700;
        transition: 0.25s ease;
        white-space: nowrap;
    }

    .customer-dashboard .orders-link:hover {
        background: rgba(21, 101, 192, 0.14);
    }

    .customer-dashboard .search-form {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
    }

    .customer-dashboard .search-input-wrap {
        position: relative;
    }

    .customer-dashboard .search-icon {
        position: absolute;
        top: 50%;
        left: 14px;
        transform: translateY(-50%);
        color: #9CA3AF;
        font-size: 15px;
        pointer-events: none;
    }

    .customer-dashboard .search-input {
        width: 100%;
        height: 50px;
        border: 1px solid #D1D5DB;
        border-radius: 16px;
        padding: 0 14px 0 42px;
        font-size: 15px;
        color: #111827;
        outline: none;
        transition: 0.25s ease;
        background: #fff;
    }

    .customer-dashboard .search-input:focus {
        border-color: #E53935;
        box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
    }

    .customer-dashboard .btn {
        height: 50px;
        padding: 0 18px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: 0.25s ease;
        white-space: nowrap;
    }

    .customer-dashboard .btn-primary {
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
    }

    .customer-dashboard .btn-primary:hover {
        transform: translateY(-1px);
    }

    .customer-dashboard .btn-secondary {
        background: #6B7280;
        color: #fff;
    }

    .customer-dashboard .btn-secondary:hover {
        background: #4B5563;
    }

    .customer-dashboard .products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .customer-dashboard .products-title {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        color: #111827;
    }

    .customer-dashboard .products-subtitle {
        margin: 6px 0 0;
        color: #6B7280;
        font-size: 14px;
    }

    .customer-dashboard .product-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 22px;
    }

    .customer-dashboard .product-card {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        padding: 16px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        transition: 0.28s ease;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .customer-dashboard .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 24px 50px rgba(15, 23, 42, 0.10);
    }

    .customer-dashboard .product-image-wrap {
        position: relative;
        margin-bottom: 14px;
        border-radius: 18px;
        overflow: hidden;
        background: #F3F4F6;
    }

    .customer-dashboard .product-image {
        width: 100%;
        height: 220px;
        object-fit: cover;
        display: block;
    }

    .customer-dashboard .no-image {
        width: 100%;
        height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6B7280;
        font-weight: 600;
        background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
    }

    .customer-dashboard .stock-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 7px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 8px 18px rgba(0,0,0,0.08);
    }

    .customer-dashboard .stock-badge.in-stock {
        background: #ECFDF5;
        color: #047857;
    }

    .customer-dashboard .stock-badge.out-stock {
        background: #FEF2F2;
        color: #B91C1C;
    }

    .customer-dashboard .product-name {
        margin: 0 0 10px;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.4;
        color: #111827;
        min-height: 50px;
    }

    .customer-dashboard .product-meta {
        display: grid;
        gap: 8px;
        margin-bottom: 14px;
    }

    .customer-dashboard .product-meta-item {
        font-size: 14px;
        color: #4B5563;
        line-height: 1.5;
    }

    .customer-dashboard .product-meta-item strong {
        color: #111827;
    }

    .customer-dashboard .rating-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 14px;
        color: #4B5563;
    }

    .customer-dashboard .rating-value {
        color: #F59E0B;
        font-weight: 800;
    }

    .customer-dashboard .rating-divider {
        color: #D1D5DB;
    }

    .customer-dashboard .product-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding-top: 14px;
    }

    .customer-dashboard .price-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: 14px;
        text-decoration: none;
        background: linear-gradient(135deg, #1565C0, #2B7FFF);
        color: #fff;
        font-weight: 800;
        box-shadow: 0 12px 22px rgba(21, 101, 192, 0.20);
        transition: 0.25s ease;
    }

    .customer-dashboard .price-btn:hover {
        transform: translateY(-1px);
    }

    .customer-dashboard .sold-chip {
        padding: 9px 12px;
        border-radius: 12px;
        background: #F8FAFC;
        color: #374151;
        font-size: 13px;
        font-weight: 700;
        border: 1px solid #EEF2F7;
    }

    .customer-dashboard .out-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: 14px;
        background: #9CA3AF;
        color: #fff;
        font-weight: 800;
    }

    .customer-dashboard .empty-state {
        background: #fff;
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        padding: 36px 24px;
        text-align: center;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .customer-dashboard .empty-icon {
        width: 72px;
        height: 72px;
        border-radius: 22px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F3F4F6;
        font-size: 30px;
    }

    .customer-dashboard .empty-title {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 800;
        color: #111827;
    }

    .customer-dashboard .empty-text {
        margin: 0;
        color: #6B7280;
        font-size: 15px;
    }

    @media (max-width: 1200px) {
        .customer-dashboard .product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    @media (max-width: 992px) {
        .customer-dashboard .layout {
            grid-template-columns: 1fr;
        }

        .customer-dashboard .sidebar-card {
            position: static;
        }

        .customer-dashboard .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 768px) {
        .customer-dashboard .hero {
            padding: 26px 20px;
            border-radius: 24px;
        }

        .customer-dashboard .search-form {
            grid-template-columns: 1fr;
        }

        .customer-dashboard .product-grid {
            grid-template-columns: 1fr;
        }

        .customer-dashboard .products-header,
        .customer-dashboard .search-top {
            align-items: flex-start;
        }
    }
</style>

<div class="customer-dashboard">
    <div class="container">
        <section class="hero">
            <div class="hero-content">
                <div>
                    <div class="hero-badge">🛍️ Khu vực mua sắm khách hàng</div>
                    <h1>Khám phá sản phẩm tại Lotte Mart</h1>
                    <p>
                        Tìm kiếm sản phẩm theo danh mục, xem thông tin chi tiết, theo dõi đơn hàng
                        và trải nghiệm giao diện mua sắm hiện đại, trực quan và dễ sử dụng.
                    </p>
                </div>

                <div class="hero-actions">
                    <a href="/customer/orders.php" class="hero-btn primary">📦 Đơn hàng của tôi</a>
                    <a href="/customer/cart.php" class="hero-btn soft">🛒 Xem giỏ hàng</a>
                </div>
            </div>
        </section>

        <div class="layout">
            <aside class="sidebar-card">
                <h3 class="sidebar-title">Danh mục sản phẩm</h3>

                <div class="category-list">
                    <a
                        href="/customer/dashboard.php"
                        class="category-link <?php echo ($category_id == 0 ? 'active' : ''); ?>"
                    >
                        <span>Tất cả sản phẩm</span>
                        <span>→</span>
                    </a>

                    <?php foreach ($categories_result as $category): ?>
                        <a
                            href="/customer/dashboard.php?category_id=<?php echo $category['id']; ?>"
                            class="category-link <?php echo ($category_id == $category['id'] ? 'active' : ''); ?>"
                        >
                            <span><?php echo htmlspecialchars($category['name']); ?></span>
                            <span>→</span>
                        </a>
                    <?php endforeach; ?>
                </div>
            </aside>

            <section class="content-area">
                <div class="search-card">
                    <div class="search-top">
                        <div>
                            <h2 class="search-title">Tìm kiếm sản phẩm</h2>
                            <p class="search-desc">Lọc nhanh theo tên sản phẩm hoặc danh mục đang chọn.</p>
                        </div>

                        <a href="/customer/orders.php" class="orders-link">📋 Đơn hàng của tôi</a>
                    </div>

                    <form method="GET" action="/customer/dashboard.php" class="search-form">
                        <div class="search-input-wrap">
                            <span class="search-icon">🔎</span>
                            <input
                                type="text"
                                name="keyword"
                                placeholder="Tìm sản phẩm theo tên..."
                                value="<?php echo htmlspecialchars($keyword); ?>"
                                class="search-input"
                            >
                        </div>

                        <input type="hidden" name="category_id" value="<?php echo $category_id; ?>">

                        <button type="submit" class="btn btn-primary">Tìm kiếm</button>

                        <a href="/customer/dashboard.php" class="btn btn-secondary">Làm mới</a>
                    </form>
                </div>

                <div class="products-header">
                    <div>
                        <h2 class="products-title">Sản phẩm đang có</h2>
                        
                    </div>
                </div>

                <?php if (count($result) > 0): ?>
                    <div class="product-grid">
                        <?php foreach ($result as $product): ?>
                            <?php
                            $product_id = (int)$product['id'];

                            // Lấy ảnh của sản phẩm
                            $img_doc = $db->product_images->findOne(
                                ['product_id' => $product_id],
                                ['sort' => ['is_main' => -1, 'id' => 1]]
                            );

                            $image = null;
                            if ($img_doc) {
                                $image = $img_doc['image_path'];
                            } elseif (!empty($product['thumbnail'])) {
                                $image = $product['thumbnail'];
                            }

                            $rating_avg = 0;
                            $review_count = 0;

                            $rating_pipeline = [
                                ['$match' => ['product_id' => $product_id]],
                                ['$group' => [
                                    '_id' => null,
                                    'avg_rating' => ['$avg' => '$rating'],
                                    'total_reviews' => ['$sum' => 1]
                                ]]
                            ];
                            $rating_res = $db->reviews->aggregate($rating_pipeline)->toArray();
                            if (!empty($rating_res)) {
                                $rating_avg = isset($rating_res[0]['avg_rating']) ? round((float)$rating_res[0]['avg_rating'], 1) : 0;
                                $review_count = (int)$rating_res[0]['total_reviews'];
                            }

                            $sold_quantity = 0;

                            $sold_pipeline = [
                                ['$match' => ['product_id' => $product_id]],
                                ['$lookup' => [
                                    'from' => 'orders',
                                    'localField' => 'order_id',
                                    'foreignField' => 'id',
                                    'as' => 'order_info'
                                ]],
                                ['$unwind' => '$order_info'],
                                ['$match' => ['order_info.order_status' => 'Đã hoàn thành']],
                                ['$group' => [
                                    '_id' => null,
                                    'total_sold' => ['$sum' => '$quantity']
                                ]]
                            ];
                            $sold_res = $db->order_items->aggregate($sold_pipeline)->toArray();
                            if (!empty($sold_res)) {
                                $sold_quantity = (int)$sold_res[0]['total_sold'];
                            }
                            ?>

                            <div class="product-card">
                                <div class="product-image-wrap">
                                    <?php if (!empty($image)): ?>
                                        <img
                                            src="/<?php echo htmlspecialchars($image); ?>"
                                            alt="<?php echo htmlspecialchars($product['name']); ?>"
                                            class="product-image"
                                        >
                                    <?php else: ?>
                                        <div class="no-image">Không có ảnh</div>
                                    <?php endif; ?>

                                    <?php if ((int)$product['stock_quantity'] > 0): ?>
                                        <div class="stock-badge in-stock">Còn hàng</div>
                                    <?php else: ?>
                                        <div class="stock-badge out-stock">Hết hàng</div>
                                    <?php endif; ?>
                                </div>

                                <h3 class="product-name">
                                    <?php echo htmlspecialchars($product['name']); ?>
                                </h3>

                                <div class="product-meta">
                                    <div class="product-meta-item">
                                        <strong>Danh mục:</strong> <?php echo htmlspecialchars($product['category_name']); ?>
                                    </div>

                                    <?php if ($review_count > 0): ?>
                                        <div class="rating-row">
                                            <span class="rating-value">★ <?php echo number_format($rating_avg, 1); ?></span>
                                            
                                            <span class="rating-divider">|</span>
                                            <span>Đã bán: <?php echo $sold_quantity; ?></span>
                                        </div>
                                    <?php else: ?>
                                        <div class="product-meta-item">
                                            <strong>Đã bán:</strong> <?php echo $sold_quantity; ?>
                                        </div>
                                    <?php endif; ?>

                                    <?php if ((int)$product['stock_quantity'] > 0): ?>
                                        <div class="product-meta-item">
                                            <strong>Tồn kho:</strong> <?php echo (int)$product['stock_quantity']; ?>
                                        </div>
                                    <?php else: ?>
                                        <div class="product-meta-item" style="color:#B91C1C; font-weight:700;">
                                            Đã hết hàng
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <div class="product-footer">
                                    <div class="sold-chip">Đã bán: <?php echo $sold_quantity; ?></div>

                                    <?php if ((int)$product['stock_quantity'] > 0): ?>
                                        <a
                                            href="/customer/products/detail.php?id=<?php echo $product['id']; ?>"
                                            class="price-btn"
                                        >
                                            <?php echo number_format($product['price'], 0, ',', '.'); ?> đ
                                        </a>
                                    <?php else: ?>
                                        <div class="out-btn">Hết hàng</div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3 class="empty-title">Không tìm thấy sản phẩm nào</h3>
                        <p class="empty-text">
                            Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem thêm sản phẩm.
                        </p>
                    </div>
                <?php endif; ?>
            </section>
        </div>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>