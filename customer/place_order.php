<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /customer/cart.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$mode = isset($_POST['mode']) ? trim($_POST['mode']) : 'cart';

$recipient_name = isset($_POST['recipient_name']) ? trim($_POST['recipient_name']) : '';
$recipient_phone = isset($_POST['recipient_phone']) ? trim($_POST['recipient_phone']) : '';
$shipping_address = isset($_POST['shipping_address']) ? trim($_POST['shipping_address']) : '';
$payment_method = isset($_POST['payment_method']) ? trim($_POST['payment_method']) : '';

$allowed_payment_methods = ['cod', 'bank_transfer', 'momo'];

if ($recipient_name === '') {
    header("Location: /customer/cart.php?error=" . urlencode("Vui lòng nhập họ tên người nhận"));
    exit();
}

if ($recipient_phone === '') {
    header("Location: /customer/cart.php?error=" . urlencode("Vui lòng nhập số điện thoại người nhận"));
    exit();
}

if ($shipping_address === '') {
    header("Location: /customer/cart.php?error=" . urlencode("Vui lòng nhập địa chỉ giao hàng"));
    exit();
}

if (!in_array($payment_method, $allowed_payment_methods)) {
    header("Location: /customer/cart.php?error=" . urlencode("Phương thức thanh toán không hợp lệ"));
    exit();
}

try {
    $items = [];
    $subtotal = 0;
    $cart_id = 0;

    if ($mode === 'buy_now') {
        $product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
        $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;

        if ($product_id <= 0 || $quantity <= 0) {
            throw new Exception("Dữ liệu mua ngay không hợp lệ");
        }

        $product = $db->products->findOne(['id' => $product_id]);

        if (!$product) {
            throw new Exception("Không tìm thấy sản phẩm");
        }

        if ($product['status'] !== 'active') {
            throw new Exception("Sản phẩm hiện không còn khả dụng");
        }

        if ($quantity > (int)$product['stock_quantity']) {
            throw new Exception("Số lượng vượt quá tồn kho");
        }

        $line_total = (float)$product['price'] * $quantity;
        $subtotal += $line_total;

        $items[] = [
            'source' => 'buy_now',
            'cart_item_id' => 0,
            'product_id' => (int)$product['id'],
            'name' => $product['name'],
            'price' => (float)$product['price'],
            'quantity' => $quantity,
            'line_total' => $line_total
        ];
    } else {
        $selected_items = isset($_POST['selected_items']) ? $_POST['selected_items'] : [];

        if (empty($selected_items)) {
            throw new Exception("Vui lòng chọn sản phẩm để đặt hàng");
        }

        $selected_ids = array_map('intval', $selected_items);
        $selected_ids = array_filter($selected_ids);

        if (empty($selected_ids)) {
            throw new Exception("Dữ liệu sản phẩm không hợp lệ");
        }

        $cart = $db->carts->findOne(['user_id' => $user_id]);

        if (!$cart) {
            throw new Exception("Không tìm thấy giỏ hàng");
        }

        $cart_id = (int)$cart['id'];

        $pipeline = [
            ['$match' => [
                'cart_id' => $cart_id,
                'id' => ['$in' => $selected_ids]
            ]],
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
                'cart_item_id' => '$id',
                'quantity' => 1,
                'product_id' => '$product_info.id',
                'name' => '$product_info.name',
                'price' => '$product_info.price',
                'stock_quantity' => '$product_info.stock_quantity',
                'status' => '$product_info.status'
            ]],
            ['$sort' => ['cart_item_id' => -1]]
        ];

        $selected_items_db = $db->cart_items->aggregate($pipeline)->toArray();

        foreach ($selected_items_db as $row) {
            if (($row['status'] ?? '') !== 'active') {
                throw new Exception("Có sản phẩm hiện không còn khả dụng");
            }

            if ((int)$row['quantity'] > (int)$row['stock_quantity']) {
                throw new Exception("Có sản phẩm vượt quá tồn kho");
            }

            $line_total = (float)$row['price'] * (int)$row['quantity'];
            $items[] = [
                'source' => 'cart',
                'cart_item_id' => (int)$row['cart_item_id'],
                'product_id' => (int)$row['product_id'],
                'name' => $row['name'],
                'price' => (float)$row['price'],
                'quantity' => (int)$row['quantity'],
                'line_total' => $line_total
            ];
            $subtotal += $line_total;
        }

        if (empty($items)) {
            throw new Exception("Không có sản phẩm hợp lệ để đặt hàng");
        }
    }

    $free_ship_threshold = 200000;
    $shipping_fee = ($subtotal >= $free_ship_threshold) ? 0 : 30000;
    $total_amount = $subtotal + $shipping_fee;

    $order_code = 'DH' . time();
    $note = '';
    $payment_status = 'Chưa thanh toán';
    $order_status = 'Chờ xác nhận';

    $order_id = getNextId($db, 'orders');

    $db->orders->insertOne([
        'id' => $order_id,
        'numeric_id' => $order_id,
        'user_id' => $user_id,
        'order_code' => $order_code,
        'receiver_name' => $recipient_name,
        'receiver_phone' => $recipient_phone,
        'shipping_address' => $shipping_address,
        'note' => $note,
        'payment_method' => $payment_method,
        'payment_status' => $payment_status,
        'order_status' => $order_status,
        'subtotal' => $subtotal,
        'shipping_fee' => $shipping_fee,
        'total_amount' => $total_amount,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    foreach ($items as $item) {
        $product_id = (int)$item['product_id'];
        $product_name = $item['name'];
        $product_price = (float)$item['price'];
        $quantity = (int)$item['quantity'];
        $item_subtotal = (float)$item['line_total'];
        $cart_item_id = isset($item['cart_item_id']) ? (int)$item['cart_item_id'] : 0;

        $order_item_id = getNextId($db, 'order_items');
        $db->order_items->insertOne([
            'id' => $order_item_id,
            'numeric_id' => $order_item_id,
            'order_id' => $order_id,
            'product_id' => $product_id,
            'product_name' => $product_name,
            'product_price' => $product_price,
            'quantity' => $quantity,
            'subtotal' => $item_subtotal
        ]);

        $updateResult = $db->products->updateOne(
            ['id' => $product_id, 'stock_quantity' => ['$gte' => $quantity]],
            ['$inc' => ['stock_quantity' => -$quantity]]
        );

        if ($updateResult->getModifiedCount() <= 0) {
            throw new Exception("Không thể cập nhật tồn kho sản phẩm");
        }

        if ($mode === 'cart' && $cart_item_id > 0 && $cart_id > 0) {
            $db->cart_items->deleteOne(['id' => $cart_item_id, 'cart_id' => $cart_id]);
        }
    }

    $paid_at = null;
    $payment_note = 'Chưa thanh toán';

    $payment_id = getNextId($db, 'payments');
    $db->payments->insertOne([
        'id' => $payment_id,
        'numeric_id' => $payment_id,
        'order_id' => $order_id,
        'payment_method' => $payment_method,
        'amount' => $total_amount,
        'payment_status' => $payment_status,
        'paid_at' => $paid_at,
        'note' => $payment_note,
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    header("Location: /customer/order_success.php?order_id=" . $order_id);
    exit();

} catch (Exception $e) {
    if ($mode === 'buy_now') {
        $product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
        header("Location: /customer/products/detail.php?id=" . $product_id . "&error=" . urlencode($e->getMessage()));
    } else {
        header("Location: /customer/cart.php?error=" . urlencode($e->getMessage()));
    }
    exit();
}