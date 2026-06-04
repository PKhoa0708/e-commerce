<?php
require_once "../database/db.php";

$full_name = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$password = trim($_POST['password'] ?? '');
$confirm_password = trim($_POST['confirm_password'] ?? '');

// Validate rỗng
if ($full_name === '' || $email === '' || $phone === '' || $password === '' || $confirm_password === '') {
    header("Location: /auth/register.php?error=" . urlencode("Vui lòng nhập đầy đủ thông tin"));
    exit();
}

// Validate email: chỉ nhận @gmail.com
if (!preg_match('/^[A-Za-z0-9._%+-]+@gmail\.com$/', $email)) {
    header("Location: /auth/register.php?error=" . urlencode("Email phải có định dạng @gmail.com"));
    exit();
}

// Validate số điện thoại: 10 số, bắt đầu bằng 0
if (!preg_match('/^0[0-9]{9}$/', $phone)) {
    header("Location: /auth/register.php?error=" . urlencode("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0"));
    exit();
}

// Check mật khẩu trùng nhau
if ($password !== $confirm_password) {
    header("Location: /auth/register.php?error=" . urlencode("Mật khẩu nhập lại không khớp"));
    exit();
}

// Check email tồn tại
$user_by_email = $db->users->findOne(['email' => $email]);
if ($user_by_email) {
    header("Location: /auth/register.php?error=" . urlencode("Email đã tồn tại"));
    exit();
}

// Check số điện thoại tồn tại
$user_by_phone = $db->users->findOne(['phone' => $phone]);
if ($user_by_phone) {
    header("Location: /auth/register.php?error=" . urlencode("Số điện thoại đã tồn tại"));
    exit();
}

// Hash password
$hashed = password_hash($password, PASSWORD_DEFAULT);

try {
    // Lấy ID tự tăng cho User mới
    $user_id = getNextId($db, 'users');

    // Chèn User vào MongoDB
    $db->users->insertOne([
        'id' => $user_id,
        'numeric_id' => $user_id,
        'full_name' => $full_name,
        'email' => $email,
        'phone' => $phone,
        'password' => $hashed,
        'role' => 'customer',
        'status' => 'active',
        'address' => '',
        'avatar' => null,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    // Tạo giỏ hàng mới cho User
    $cart_id = getNextId($db, 'carts');
    $db->carts->insertOne([
        'id' => $cart_id,
        'numeric_id' => $cart_id,
        'user_id' => $user_id,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    header("Location: /auth/login.php?success=" . urlencode("Đăng ký thành công"));
    exit();
} catch (Exception $e) {
    header("Location: /auth/register.php?error=" . urlencode("Lỗi đăng ký: " . $e->getMessage()));
    exit();
}