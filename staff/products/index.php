<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

$pipeline = [
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
        'category_id' => 1,
        'price' => 1,
        'stock_quantity' => 1,
        'status' => 1,
        'thumbnail' => 1,
        'category_name' => '$category_info.name'
    ]],
    ['$sort' => ['id' => -1]]
];
$result = $db->products->aggregate($pipeline);
?>

<style>
.staff-products-page {
    background: #F6F8FC;
    min-height: calc(100vh - 120px);
    padding: 30px 0 60px;
}

.container {
    max-width: 1280px;
    margin: auto;
    padding: 0 16px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 10px;
}

.page-title {
    font-size: 28px;
    font-weight: 800;
}

.page-actions a {
    padding: 10px 16px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
}

.btn-primary {
    background: linear-gradient(135deg, #E53935, #FF6B57);
    color: white;
}

.btn-secondary {
    background: #E5E7EB;
    color: #333;
}

/* MESSAGE */
.message {
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 15px;
    font-weight: 500;
}

.success { background:#e6fffa; color:#047857; }
.error { background:#ffeaea; color:#dc2626; }

/* TABLE */
.table-card {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
}

th {
    background: #F9FAFB;
    text-align: left;
    padding: 14px;
    font-size: 14px;
}

td {
    padding: 14px;
    border-top: 1px solid #eee;
    vertical-align: top;
}

tr:hover {
    background: #fafafa;
}

/* IMAGE */
.product-images {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.product-images img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}

/* STATUS */
.status-active {
    color: #16a34a;
    font-weight: 600;
}

.status-hidden {
    color: #dc2626;
    font-weight: 600;
}

/* ACTION */
.action-links a {
    margin-right: 8px;
    text-decoration: none;
    font-weight: 600;
}

.action-links a.edit { color: #2563eb; }
.action-links a.delete { color: #dc2626; }

/* MORE IMG */
.more-img {
    width:60px;
    height:60px;
    background:#f1f1f1;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:8px;
    font-size:13px;
}
</style>

<div class="staff-products-page">
<div class="container">

    <div class="page-header">
        <div class="page-title">📦 Quản lý sản phẩm</div>

        <div class="page-actions">
            <a href="/staff/products/create.php" class="btn-primary">+ Thêm sản phẩm</a>
            <a href="/staff/dashboard.php" class="btn-secondary">Quay lại</a>
        </div>
    </div>

    <?php if (isset($_GET['success'])): ?>
        <div class="message success"><?php echo htmlspecialchars($_GET['success']); ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['error'])): ?>
        <div class="message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
    <?php endif; ?>

    <div class="table-card">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Ảnh</th>
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                </tr>
            </thead>

            <tbody>
            <?php foreach ($result as $product): ?>
                <?php
                $product_id = (int)$product['id'];

                $images_result = $db->product_images->find(
                    ['product_id' => $product_id],
                    ['sort' => ['is_main' => -1, 'id' => 1]]
                );

                $images = [];
                foreach ($images_result as $img) {
                    $images[] = $img['image_path'];
                }

                if (empty($images) && !empty($product['thumbnail'])) {
                    $images[] = $product['thumbnail'];
                }

                $max_preview = 4;
                ?>

                <tr>
                    <td><?php echo $product['id']; ?></td>

                    <td>
                        <div class="product-images">
                            <?php for ($i = 0; $i < min($max_preview, count($images)); $i++): ?>
                                <img src="/<?php echo htmlspecialchars($images[$i]); ?>">
                            <?php endfor; ?>

                            <?php if (count($images) > $max_preview): ?>
                                <div class="more-img">
                                    +<?php echo count($images) - $max_preview; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </td>

                    <td><strong><?php echo htmlspecialchars($product['name']); ?></strong></td>
                    <td><?php echo htmlspecialchars($product['category_name'] ?? ''); ?></td>
                    <td><?php echo number_format($product['price'], 0, ',', '.'); ?> đ</td>
                    <td><?php echo $product['stock_quantity']; ?></td>

                    <td>
                        <?php if ($product['status'] == 'active'): ?>
                            <span class="status-active">Hiển thị</span>
                        <?php else: ?>
                            <span class="status-hidden">Ẩn</span>
                        <?php endif; ?>
                    </td>
                    <td class="action-links">
                        <a href="/staff/products/edit.php?id=<?php echo $product['id']; ?>" class="edit">Sửa</a>
                        <a href="/staff/products/delete.php?id=<?php echo $product['id']; ?>"
                           class="delete"
                           onclick="return confirm('Bạn có chắc muốn xóa sản phẩm này?');">
                            Xóa
                        </a>
                    </td>
                </tr>

            <?php endforeach; ?>
            </tbody>
        </table>
    </div>

</div>
</div>

<?php require_once "../../includes/footer.php"; ?>