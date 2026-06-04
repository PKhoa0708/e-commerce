<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../database/db.php';

// Chưa đăng nhập
if (!isset($_SESSION['user_id'])) {
    header("Location: /auth/login.php");
    exit();
}

$user_id = (int)$_SESSION['user_id'];

// Kiểm tra lại trạng thái tài khoản trong database
$user = $db->users->findOne(['numeric_id' => $user_id]);

// Không tìm thấy user -> đăng xuất luôn
if (!$user) {
    session_unset();
    session_destroy();
    header("Location: /auth/login.php?error=Tài khoản không tồn tại");
    exit();
}

// Nếu tài khoản bị khóa -> hủy session và đá về login
if ($user['status'] === 'blocked') {
    session_unset();
    session_destroy();
    header("Location: /auth/login.php?error=Tài khoản của bạn đã bị khóa");
    exit();
}

// Cập nhật lại session theo DB để tránh lệch dữ liệu
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
?>