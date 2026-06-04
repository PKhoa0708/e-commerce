<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /customer/dashboard.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;
$action = isset($_POST['action']) ? trim($_POST['action']) : 'cart';

$detail_redirect = "/customer/products/detail.php?id=" . $product_id;
$dashboard_redirect = "/customer/dashboard.php";

function redirect_with_message($url, $type, $message) {
    header("Location: " . $url . (strpos($url, '?') !== false ? '&' : '?') . $type . "=" . urlencode($message));
    exit();
}

if ($product_id <= 0 || $quantity <= 0) {
    redirect_with_message($dashboard_redirect, 'error', 'Dữ liệu không hợp lệ');
}

// Kiểm tra sản phẩm có tồn tại, đang active, còn hàng
$product = $db->products->findOne(['id' => $product_id]);

if (!$product) {
    redirect_with_message($dashboard_redirect, 'error', 'Không tìm thấy sản phẩm');
}

if ($product['status'] !== 'active') {
    redirect_with_message($detail_redirect, 'error', 'Sản phẩm hiện không khả dụng');
}

if ((int)$product['stock_quantity'] < $quantity) {
    redirect_with_message($detail_redirect, 'error', 'Số lượng vượt quá tồn kho');
}

// Lấy cart
$cart = $db->carts->findOne(['user_id' => $user_id]);

if (!$cart) {
    // tạo cart nếu chưa có
    $cart_id = getNextId($db, 'carts');
    $db->carts->insertOne([
        'id' => $cart_id,
        'numeric_id' => $cart_id,
        'user_id' => $user_id
    ]);
} else {
    $cart_id = (int)$cart['id'];
}

// Kiểm tra sản phẩm đã có trong giỏ chưa
$cartItem = $db->cart_items->findOne(['cart_id' => $cart_id, 'product_id' => $product_id]);

if ($cartItem) {
    $new_quantity = (int)$cartItem['quantity'] + $quantity;

    if ($new_quantity > (int)$product['stock_quantity']) {
        redirect_with_message($detail_redirect, 'error', 'Tổng số lượng trong giỏ vượt quá tồn kho');
    }

    $db->cart_items->updateOne(
        ['id' => (int)$cartItem['id']],
        ['$set' => ['quantity' => $new_quantity]]
    );
} else {
    $item_id = getNextId($db, 'cart_items');
    $db->cart_items->insertOne([
        'id' => $item_id,
        'numeric_id' => $item_id,
        'cart_id' => $cart_id,
        'product_id' => $product_id,
        'quantity' => $quantity
    ]);
}

// Điều hướng theo action
if ($action === 'buy') {
    redirect_with_message("/customer/cart.php", 'success', 'Đã thêm sản phẩm, vui lòng tiếp tục mua hàng');
} else {
    redirect_with_message($detail_redirect, 'success', 'Đã thêm sản phẩm vào giỏ hàng');
}