<?php
session_start();
require_once "../database/db.php";

$email = $_POST['email'];
$password = $_POST['password'];

$user = $db->users->findOne(['email' => $email]);

if (!$user) {
    header("Location: /auth/login.php?error=Sai tài khoản");
    exit();
}

if ($user['password'] !== $password && !password_verify($password, $user['password'])) {
    header("Location: /auth/login.php?error=Sai mật khẩu");
    exit();
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['role'] = $user['role'];

if ($user['role'] == 'admin') {
    header("Location: /admin/dashboard.php");
} elseif ($user['role'] == 'staff') {
    header("Location: /staff/dashboard.php");
} else {
    header("Location: /customer/dashboard.php");
}
exit();