<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: /staff/products/index.php?error=ID không hợp lệ");
    exit();
}

$id = (int)$_GET['id'];

$product = $db->products->findOne(['id' => $id]);

if (!$product) {
    header("Location: /staff/products/index.php?error=Không tìm thấy sản phẩm");
    exit();
}

try {
    // Lấy danh sách toàn bộ ảnh phụ của sản phẩm để xóa file vật lý
    $images = $db->product_images->find(['product_id' => $id]);
    foreach ($images as $img) {
        if (!empty($img['image_path']) && file_exists("../../" . $img['image_path'])) {
            @unlink("../../" . $img['image_path']);
        }
    }
    // Xóa bản ghi trong collection product_images
    $db->product_images->deleteMany(['product_id' => $id]);

    // Xóa sản phẩm trong collection products
    $db->products->deleteOne(['id' => $id]);

    // Xóa file thumbnail chính
    if (!empty($product['thumbnail']) && file_exists("../../" . $product['thumbnail'])) {
        @unlink("../../" . $product['thumbnail']);
    }

    header("Location: /staff/products/index.php?success=Xóa sản phẩm thành công");
    exit();
} catch (Exception $e) {
    header("Location: /staff/products/index.php?error=" . urlencode("Xóa sản phẩm thất bại: " . $e->getMessage()));
    exit();
}