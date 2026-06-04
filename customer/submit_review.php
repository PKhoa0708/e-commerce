<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /customer/orders.php");
    exit();
}

$user_id = (int)$_SESSION['user_id'];
$order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : 0;
$product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
$comment = isset($_POST['comment']) ? trim($_POST['comment']) : '';

if ($order_id <= 0 || $product_id <= 0) {
    header("Location: /customer/orders.php?error=" . urlencode("Dữ liệu không hợp lệ"));
    exit();
}

if ($rating < 1 || $rating > 5) {
    header("Location: /customer/review_product.php?order_id=" . $order_id . "&product_id=" . $product_id . "&error=" . urlencode("Số sao phải từ 1 đến 5"));
    exit();
}

if ($comment === '') {
    header("Location: /customer/review_product.php?order_id=" . $order_id . "&product_id=" . $product_id . "&error=" . urlencode("Vui lòng nhập nội dung đánh giá"));
    exit();
}

if (mb_strlen($comment) > 1000) {
    header("Location: /customer/review_product.php?order_id=" . $order_id . "&product_id=" . $product_id . "&error=" . urlencode("Nội dung đánh giá tối đa 1000 ký tự"));
    exit();
}

try {
    /*
    |----------------------------------------------------------
    | Kiểm tra đơn hàng hợp lệ và thuộc user hiện tại
    |----------------------------------------------------------
    */
    $order = $db->orders->findOne(['id' => $order_id, 'user_id' => $user_id]);

    if (!$order) {
        throw new Exception("Không tìm thấy đơn hàng");
    }

    $allowed_review_status = ['Đã giao', 'Đã hoàn thành'];
    if (!in_array($order['order_status'], $allowed_review_status)) {
        throw new Exception("Chỉ được đánh giá khi đơn hàng đã giao hoặc hoàn thành");
    }

    /*
    |----------------------------------------------------------
    | Kiểm tra sản phẩm thuộc đơn hàng
    |----------------------------------------------------------
    */
    $product = $db->order_items->findOne(['order_id' => $order_id, 'product_id' => $product_id]);

    if (!$product) {
        throw new Exception("Sản phẩm không thuộc đơn hàng này");
    }

    /*
    |----------------------------------------------------------
    | Kiểm tra đã review chưa
    |----------------------------------------------------------
    */
    $existing_review = $db->reviews->findOne([
        'user_id' => $user_id,
        'order_id' => $order_id,
        'product_id' => $product_id
    ]);

    if ($existing_review) {
        throw new Exception("Bạn đã đánh giá sản phẩm này rồi");
    }

    /*
    |----------------------------------------------------------
    | Lưu đánh giá
    |----------------------------------------------------------
    */
    $review_id = getNextId($db, 'reviews');
    $insertResult = $db->reviews->insertOne([
        'id' => $review_id,
        'numeric_id' => $review_id,
        'user_id' => $user_id,
        'product_id' => $product_id,
        'order_id' => $order_id,
        'rating' => $rating,
        'comment' => $comment,
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    if ($insertResult->getInsertedCount() <= 0) {
        throw new Exception("Không thể lưu đánh giá");
    }

    header("Location: /customer/review_product.php?order_id=" . $order_id . "&product_id=" . $product_id . "&success=" . urlencode("Đánh giá sản phẩm thành công"));
    exit();

} catch (Exception $e) {
    header("Location: /customer/review_product.php?order_id=" . $order_id . "&product_id=" . $product_id . "&error=" . urlencode($e->getMessage()));
    exit();
}