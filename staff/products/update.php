<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /staff/products/index.php");
    exit();
}

$id = (int)$_POST['id'];
$name = trim($_POST['name']);
$category_id = (int)$_POST['category_id'];
$sku = trim($_POST['sku']);
$description = trim($_POST['description']);
$price = (float)$_POST['price'];
$stock_quantity = (int)$_POST['stock_quantity'];
$status = trim($_POST['status']);
$old_thumbnail = trim($_POST['old_thumbnail']);
$delete_current_image = isset($_POST['delete_current_image']) ? (int)$_POST['delete_current_image'] : 0;
$updated_by = $_SESSION['user_id'];

if ($id <= 0 || $name == '' || $category_id <= 0 || $price < 0 || $stock_quantity < 0 || $status == '') {
    header("Location: /staff/products/edit.php?id=$id&error=Dữ liệu không hợp lệ");
    exit();
}

// Kiểm tra SKU trùng
if ($sku != '') {
    $existing_product = $db->products->findOne(['sku' => $sku, 'id' => ['$ne' => $id]]);
    if ($existing_product) {
        header("Location: /staff/products/edit.php?id=$id&error=SKU đã tồn tại");
        exit();
    }
}

// Tạo slug
$slug = strtolower(trim($name));
$slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
$slug = trim($slug, '-');
$slug = $slug . '-' . time();

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

$thumbnail_path = $old_thumbnail;

// Upload các file mới
$new_uploaded_paths = [];

if (isset($_FILES['thumbnail_files']) && !empty($_FILES['thumbnail_files']['name'][0])) {
    $total_files = count($_FILES['thumbnail_files']['name']);

    for ($i = 0; $i < $total_files; $i++) {
        if ($_FILES['thumbnail_files']['error'][$i] == 0) {
            $single_file = [
                'name' => $_FILES['thumbnail_files']['name'][$i],
                'type' => $_FILES['thumbnail_files']['type'][$i],
                'tmp_name' => $_FILES['thumbnail_files']['tmp_name'][$i],
                'error' => $_FILES['thumbnail_files']['error'][$i],
                'size' => $_FILES['thumbnail_files']['size'][$i]
            ];

            $uploaded_path = uploadSingleImage($single_file);

            if ($uploaded_path === false) {
                header("Location: /staff/products/edit.php?id=$id&error=Có ảnh không hợp lệ hoặc vượt quá 2MB");
                exit();
            }

            if ($uploaded_path !== null) {
                $new_uploaded_paths[] = $uploaded_path;
            }
        }
    }
}

if ($delete_current_image === 1) {
    // Xóa file ảnh cũ nếu có
    if (!empty($old_thumbnail) && file_exists("../../" . $old_thumbnail)) {
        @unlink("../../" . $old_thumbnail);
    }

    // Xóa ảnh chính cũ trong product_images
    $db->product_images->deleteMany(['product_id' => $id, 'is_main' => 1]);

    // Nếu có ảnh mới thì lấy ảnh đầu làm ảnh chính
    if (!empty($new_uploaded_paths)) {
        $thumbnail_path = $new_uploaded_paths[0];

        $image_id = getNextId($db, 'product_images');
        $db->product_images->insertOne([
            'id' => $image_id,
            'numeric_id' => $image_id,
            'product_id' => $id,
            'image_path' => $thumbnail_path,
            'is_main' => 1,
            'created_at' => new MongoDB\BSON\UTCDateTime()
        ]);

        // Các ảnh còn lại là ảnh phụ
        for ($i = 1; $i < count($new_uploaded_paths); $i++) {
            $gallery_path = $new_uploaded_paths[$i];

            $image_id = getNextId($db, 'product_images');
            $db->product_images->insertOne([
                'id' => $image_id,
                'numeric_id' => $image_id,
                'product_id' => $id,
                'image_path' => $gallery_path,
                'is_main' => 0,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ]);
        }
    } else {
        $thumbnail_path = null;
    }
} else {
    // Không xóa ảnh hiện tại => giữ nguyên thumbnail cũ
    $thumbnail_path = $old_thumbnail;

    // Nếu có ảnh mới thì chỉ thêm như ảnh phụ
    foreach ($new_uploaded_paths as $gallery_path) {
        $image_id = getNextId($db, 'product_images');
        $db->product_images->insertOne([
            'id' => $image_id,
            'numeric_id' => $image_id,
            'product_id' => $id,
            'image_path' => $gallery_path,
            'is_main' => 0,
            'created_at' => new MongoDB\BSON\UTCDateTime()
        ]);
    }
}

// Update bảng products
try {
    $db->products->updateOne(
        ['id' => $id],
        ['$set' => [
            'category_id' => $category_id,
            'name' => $name,
            'slug' => $slug,
            'sku' => $sku,
            'description' => $description,
            'price' => $price,
            'stock_quantity' => $stock_quantity,
            'thumbnail' => $thumbnail_path,
            'status' => $status,
            'updated_by' => (int)$updated_by,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]]
    );

    header("Location: /staff/products/edit.php?id=$id&success=Cập nhật sản phẩm thành công");
    exit();
} catch (Exception $e) {
    header("Location: /staff/products/edit.php?id=$id&error=" . urlencode("Cập nhật thất bại: " . $e->getMessage()));
    exit();
}