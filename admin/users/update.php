<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: /admin/users/index.php");
    exit();
}

$id = (int)$_POST['id'];
$full_name = trim($_POST['full_name']);
$email = trim($_POST['email']);
$phone = trim($_POST['phone']);
$address = trim($_POST['address']);
$password = trim($_POST['password']);
$role = trim($_POST['role']);
$status = trim($_POST['status']);

if ($id <= 0 || $full_name == '' || $email == '' || $role == '' || $status == '') {
    header("Location: /admin/users/index.php?error=Dữ liệu không hợp lệ");
    exit();
}

// Check email trùng
$existing_user = $db->users->findOne(['email' => $email, 'id' => ['$ne' => $id]]);
if ($existing_user) {
    header("Location: /admin/users/edit.php?id=$id&error=Email đã tồn tại");
    exit();
}

$update_data = [
    'full_name' => $full_name,
    'email' => $email,
    'phone' => $phone,
    'address' => $address,
    'role' => $role,
    'status' => $status,
    'updated_at' => new MongoDB\BSON\UTCDateTime()
];

if ($password !== '') {
    $update_data['password'] = password_hash($password, PASSWORD_DEFAULT);
}

try {
    $db->users->updateOne(['id' => $id], ['$set' => $update_data]);
    header("Location: /admin/users/index.php?success=Cập nhật tài khoản thành công");
    exit();
} catch (Exception $e) {
    header("Location: /admin/users/edit.php?id=$id&error=" . urlencode("Cập nhật thất bại: " . $e->getMessage()));
    exit();
}