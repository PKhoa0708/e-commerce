<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] == 'admin') {
        header("Location: /admin/dashboard.php");
    } elseif ($_SESSION['role'] == 'staff') {
        header("Location: /staff/dashboard.php");
    } else {
        header("Location: /customer/dashboard.php");
    }
    exit();
}
?>