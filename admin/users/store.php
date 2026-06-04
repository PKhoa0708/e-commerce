<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /admin/users/index.php");
    exit();
}

$full_name = trim($_POST['full_name']);
$email = trim($_POST['email']);
$phone = trim($_POST['phone']);
$address = trim($_POST['address']);
$password = trim($_POST['password']);
$role = trim($_POST['role']);
$status = trim($_POST['status']);

if ($full_name == '' || $email == '' || $password == '' || $role == '' || $status == '') {
    header("Location: /admin/users/create.php?error=Vui lòng nhập đầy đủ thông tin bắt buộc");
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header("Location: /admin/users/create.php?error=Email không hợp lệ");
    exit();
}

// Check email tồn tại
$existing_user = $db->users->findOne(['email' => $email]);
if ($existing_user) {
    header("Location: /admin/users/create.php?error=Email đã tồn tại");
    exit();
}

$hashed_password = password_hash($password, PASSWORD_DEFAULT);

try {
    $new_user_id = getNextId($db, 'users');
    $db->users->insertOne([
        'id' => $new_user_id,
        'numeric_id' => $new_user_id,
        'full_name' => $full_name,
        'email' => $email,
        'phone' => $phone,
        'password' => $hashed_password,
        'address' => $address,
        'role' => $role,
        'status' => $status,
        'avatar' => null,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    if ($role === 'customer') {
        $cart_id = getNextId($db, 'carts');
        $db->carts->insertOne([
            'id' => $cart_id,
            'numeric_id' => $cart_id,
            'user_id' => $new_user_id,
            'created_at' => new MongoDB\BSON\UTCDateTime(),
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]);
    }

    header("Location: /admin/users/index.php?success=Thêm tài khoản thành công");
    exit();
} catch (Exception $e) {
    header("Location: /admin/users/create.php?error=" . urlencode("Thêm tài khoản thất bại: " . $e->getMessage()));
    exit();
}