<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /staff/products/index.php");
    exit();
}

$name = trim($_POST['name']);
$category_id = (int)$_POST['category_id'];
$sku = trim($_POST['sku']);
$description = trim($_POST['description']);
$price = (float)$_POST['price'];
$stock_quantity = (int)$_POST['stock_quantity'];
$status = trim($_POST['status']);
$created_by = $_SESSION['user_id'];
$updated_by = $_SESSION['user_id'];

if ($name == '' || $category_id <= 0 || $price < 0 || $stock_quantity < 0 || $status == '') {
    header("Location: /staff/products/create.php?error=Vui lòng nhập đầy đủ và hợp lệ");
    exit();
}

// Kiểm tra SKU nếu có nhập
if ($sku != '') {
    $existing_product = $db->products->findOne(['sku' => $sku]);
    if ($existing_product) {
        header("Location: /staff/products/create.php?error=SKU đã tồn tại");
        exit();
    }
}

// Tạo slug đơn giản
$slug = strtolower(trim($name));
$slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
$slug = trim($slug, '-');
$slug = $slug . '-' . time();

$thumbnail_path = null;

// Hàm upload 1 ảnh
function uploadSingleImage($file, $upload_dir_relative = "uploads/products/", $upload_dir_real = "../../uploads/products/")
{
    if (!isset($file) || $file['error'] != 0) {
        return null;
    }

    $file_name = $file['name'];
    $tmp_name = $file['tmp_name'];
    $file_size = $file['size'];

    $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($ext, $allowed_ext)) {
        return false;
    }

    if ($file_size > 2 * 1024 * 1024) {
        return false;
    }

    if (!is_dir($upload_dir_real)) {
        mkdir($upload_dir_real, 0777, true);
    }

    $new_file_name = time() . '_' . rand(1000, 9999) . '.' . $ext;
    $upload_path = $upload_dir_real . $new_file_name;

    if (move_uploaded_file($tmp_name, $upload_path)) {
        return $upload_dir_relative . $new_file_name;
    }

    return false;
}

// Upload thumbnail
if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] == 0) {
    $thumbnail_path = uploadSingleImage($_FILES['thumbnail']);

    if ($thumbnail_path === false) {
        header("Location: /staff/products/create.php?error=Ảnh thumbnail không hợp lệ hoặc upload thất bại");
        exit();
    }
}

try {
    // Lấy ID tự tăng cho sản phẩm mới
    $product_id = getNextId($db, 'products');

    // Lưu sản phẩm vào MongoDB
    $db->products->insertOne([
        'id' => $product_id,
        'numeric_id' => $product_id,
        'category_id' => $category_id,
        'name' => $name,
        'slug' => $slug,
        'sku' => $sku,
        'description' => $description,
        'price' => $price,
        'stock_quantity' => $stock_quantity,
        'thumbnail' => $thumbnail_path,
        'status' => $status,
        'is_featured' => 0,
        'created_by' => (int)$created_by,
        'updated_by' => (int)$updated_by,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    // Lưu thumbnail vào product_images luôn nếu có
    if (!empty($thumbnail_path)) {
        $image_id = getNextId($db, 'product_images');
        $db->product_images->insertOne([
            'id' => $image_id,
            'numeric_id' => $image_id,
            'product_id' => $product_id,
            'image_path' => $thumbnail_path,
            'is_main' => 1,
            'created_at' => new MongoDB\BSON\UTCDateTime()
        ]);
    }

    // Upload nhiều ảnh phụ
    if (isset($_FILES['gallery_images']) && !empty($_FILES['gallery_images']['name'][0])) {
        $total_files = count($_FILES['gallery_images']['name']);

        for ($i = 0; $i < $total_files; $i++) {
            if ($_FILES['gallery_images']['error'][$i] == 0) {
                $single_file = [
                    'name' => $_FILES['gallery_images']['name'][$i],
                    'type' => $_FILES['gallery_images']['type'][$i],
                    'tmp_name' => $_FILES['gallery_images']['tmp_name'][$i],
                    'error' => $_FILES['gallery_images']['error'][$i],
                    'size' => $_FILES['gallery_images']['size'][$i]
                ];

                $gallery_path = uploadSingleImage($single_file);

                if ($gallery_path !== false && $gallery_path !== null) {
                    $image_id = getNextId($db, 'product_images');
                    $db->product_images->insertOne([
                        'id' => $image_id,
                        'numeric_id' => $image_id,
                        'product_id' => $product_id,
                        'image_path' => $gallery_path,
                        'is_main' => 0,
                        'created_at' => new MongoDB\BSON\UTCDateTime()
                    ]);
                }
            }
        }
    }

    header("Location: /staff/products/index.php?success=Thêm sản phẩm thành công");
    exit();
} catch (Exception $e) {
    header("Location: /staff/products/create.php?error=" . urlencode("Thêm sản phẩm thất bại: " . $e->getMessage()));
    exit();
}