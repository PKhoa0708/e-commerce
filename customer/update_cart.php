<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Phương thức không hợp lệ'
    ]);
    exit();
}

$user_id = $_SESSION['user_id'];
$cart_item_id = isset($_POST['cart_item_id']) ? (int)$_POST['cart_item_id'] : 0;
$action = isset($_POST['action']) ? trim($_POST['action']) : '';

if ($cart_item_id <= 0 || !in_array($action, ['increase', 'decrease'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Dữ liệu không hợp lệ'
    ]);
    exit();
}

// Kiểm tra cart item có thuộc về user hiện tại không
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
        'id' => 1,
        'quantity' => 1,
        'price' => '$product_info.price',
        'stock_quantity' => '$product_info.stock_quantity'
    ]]
];

$items = $db->cart_items->aggregate($pipeline)->toArray();

if (empty($items)) {
    echo json_encode([
        'success' => false,
        'message' => 'Không tìm thấy sản phẩm trong giỏ'
    ]);
    exit();
}

$item = $items[0];

$current_quantity = (int)$item['quantity'];
$stock_quantity = (int)$item['stock_quantity'];
$price = (float)$item['price'];

$new_quantity = $current_quantity;

if ($action === 'increase') {
    $new_quantity = $current_quantity + 1;

    if ($new_quantity > $stock_quantity) {
        echo json_encode([
            'success' => false,
            'message' => 'Số lượng vượt quá tồn kho'
        ]);
        exit();
    }
}

if ($action === 'decrease') {
    $new_quantity = $current_quantity - 1;

    if ($new_quantity < 1) {
        $new_quantity = 1;
    }
}

$db->cart_items->updateOne(
    ['id' => $cart_item_id],
    ['$set' => ['quantity' => $new_quantity]]
);

echo json_encode([
    'success' => true,
    'message' => 'Cập nhật số lượng thành công',
    'cart_item_id' => $cart_item_id,
    'quantity' => $new_quantity,
    'price' => $price,
    'subtotal' => $price * $new_quantity
]);
exit();