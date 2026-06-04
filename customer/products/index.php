<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

$filter = ['status' => 'active'];
if ($keyword !== '') {
    $filter['name'] = new MongoDB\BSON\Regex($keyword, 'i');
}

$pipeline = [
    ['$match' => $filter],
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
        'price' => 1,
        'stock_quantity' => 1,
        'thumbnail' => 1,
        'status' => 1,
        'category_name' => '$category_info.name'
    ]],
    ['$sort' => ['id' => -1]]
];

$products = $db->products->aggregate($pipeline)->toArray();
?>

<h2>Danh sách sản phẩm</h2>

<form method="GET" action="/customer/products/index.php" style="margin:15px 0;">
    <input
        type="text"
        name="keyword"
        placeholder="Nhập tên sản phẩm..."
        value="<?php echo htmlspecialchars($keyword); ?>"
        style="width:300px; padding:8px;"
    >
    <button type="submit" style="padding:8px 12px;">Tìm kiếm</button>
    <a href="/customer/products/index.php" style="padding:8px 12px; background:gray; color:white; text-decoration:none;">Làm mới</a>
</form>

<?php if (!empty($products)): ?>
    <div style="display:flex; flex-wrap:wrap; gap:20px;">
        <?php foreach ($products as $product): ?>
            <?php
            $product_id = (int)$product['id'];

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
            ?>

            <div style="width:240px; border:1px solid #ccc; padding:15px; border-radius:6px; background:#fff;">
                <div style="text-align:center; margin-bottom:10px;">
                    <?php if (!empty($image)): ?>
                        <img
                            src="/<?php echo htmlspecialchars($image); ?>"
                            style="width:180px; height:180px; object-fit:cover;"
                        >
                    <?php else: ?>
                        <div style="width:180px; height:180px; background:#eee; display:flex; align-items:center; justify-content:center; margin:0 auto;">
                            Không có ảnh
                        </div>
                    <?php endif; ?>
                </div>

                <h3 style="font-size:18px; margin-bottom:8px;">
                    <?php echo htmlspecialchars($product['name']); ?>
                </h3>

                <p><strong>Danh mục:</strong> <?php echo htmlspecialchars($product['category_name'] ?? ''); ?></p>
                <p><strong>Giá:</strong> <?php echo number_format($product['price'], 0, ',', '.'); ?> đ</p>
                <p><strong>Tồn kho:</strong> <?php echo (int)$product['stock_quantity']; ?></p>

                <div style="margin-top:12px;">
                    <a
                        href="/customer/products/detail.php?id=<?php echo $product['id']; ?>"
                        style="padding:8px 12px; background:blue; color:white; text-decoration:none;"
                    >
                        Xem chi tiết
                    </a>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php else: ?>
    <p>Không tìm thấy sản phẩm nào.</p>
<?php endif; ?>

<?php require_once "../../includes/footer.php"; ?>