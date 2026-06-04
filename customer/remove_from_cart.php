<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

$user_id = $_SESSION['user_id'];
$cart_item_id = isset($_GET['cart_item_id']) ? (int)$_GET['cart_item_id'] : 0;

if ($cart_item_id <= 0) {
    header("Location: /customer/cart.php?error=Dữ liệu không hợp lệ");
    exit();
}

// Kiểm tra cart item thuộc user hiện tại
$pipeline = [
    ['$match' => ['id' => $cart_item_id]],
    ['$lookup' => [
        'from' => 'carts',
        'localField' => 'cart_id',
        'foreignField' => 'id',
        'as' => 'cart_info'
    ]],
    ['$unwind' => [
        'path' => '$cart_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$match' => ['cart_info.user_id' => $user_id]],
    ['$project' => ['id' => 1]]
];

$items = $db->cart_items->aggregate($pipeline)->toArray();

if (empty($items)) {
    header("Location: /customer/cart.php?error=Không tìm thấy sản phẩm trong giỏ");
    exit();
}

$deleteResult = $db->cart_items->deleteOne(['id' => $cart_item_id]);

if ($deleteResult->getDeletedCount() > 0) {
    header("Location: /customer/cart.php?success=Đã xóa sản phẩm khỏi giỏ hàng");
    exit();
} else {
    header("Location: /customer/cart.php?error=Xóa thất bại");
    exit();
}