<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

$categories = $db->categories->find(['status' => 1], ['sort' => ['id' => -1]]);
?>

<h2>Thêm sản phẩm</h2>

<?php if (isset($_GET['error'])): ?>
    <p style="color:red;"><?php echo htmlspecialchars($_GET['error']); ?></p>
<?php endif; ?>

<form action="/staff/products/store.php" method="POST" enctype="multipart/form-data">
    <div style="margin-bottom:10px;">
        <label>Tên sản phẩm</label><br>
        <input type="text" name="name" required style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Danh mục</label><br>
        <select name="category_id" required style="width:400px; padding:8px;">
            <option value="">-- Chọn danh mục --</option>
            <?php foreach ($categories as $cat): ?>
                <option value="<?php echo $cat['id']; ?>">
                    <?php echo htmlspecialchars($cat['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div style="margin-bottom:10px;">
        <label>SKU</label><br>
        <input type="text" name="sku" style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Mô tả</label><br>
        <textarea name="description" rows="5" style="width:400px; padding:8px;"></textarea>
    </div>

    <div style="margin-bottom:10px;">
        <label>Giá</label><br>
        <input type="number" name="price" min="0" required style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Số lượng tồn kho</label><br>
        <input type="number" name="stock_quantity" min="0" required style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Ảnh thumbnail (ảnh chính)</label><br>
        <input type="file" name="thumbnail" accept="image/*">
    </div>

    <div style="margin-bottom:10px;">
        <label>Ảnh phụ (có thể chọn nhiều ảnh)</label><br>
        <input type="file" name="gallery_images[]" accept="image/*" multiple>
    </div>

    <div style="margin-bottom:10px;">
        <label>Trạng thái</label><br>
        <select name="status" required style="width:400px; padding:8px;">
            <option value="active">Hiển thị</option>
            <option value="inactive">Ẩn</option>
        </select>
    </div>

    <button type="submit" style="padding:10px 15px;">Lưu sản phẩm</button>
    <a href="/staff/products/index.php">Quay lại</a>
</form>

<?php require_once "../../includes/footer.php"; ?>