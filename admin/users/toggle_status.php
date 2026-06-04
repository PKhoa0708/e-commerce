<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: /admin/users/index.php?error=ID không hợp lệ");
    exit();
}

$id = (int)$_GET['id'];

// Không cho admin tự khóa chính mình
if ($id == $_SESSION['user_id']) {
    header("Location: /admin/users/index.php?error=Bạn không thể tự khóa tài khoản của mình");
    exit();
}

$user = $db->users->findOne(['id' => $id]);

if (!$user) {
    header("Location: /admin/users/index.php?error=Không tìm thấy tài khoản");
    exit();
}

$new_status = ($user['status'] == 'active') ? 'blocked' : 'active';

try {
    $db->users->updateOne(['id' => $id], ['$set' => ['status' => $new_status, 'updated_at' => new MongoDB\BSON\UTCDateTime()]]);
    header("Location: /admin/users/index.php?success=Đổi trạng thái tài khoản thành công");
    exit();
} catch (Exception $e) {
    header("Location: /admin/users/index.php?error=Không thể cập nhật trạng thái");
    exit();
}