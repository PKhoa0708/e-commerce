<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$staff_id = $_SESSION['user_id'];

if ($id <= 0) {
    header("Location: /staff/chat/index.php");
    exit();
}

$db->chat_conversations->updateOne(
    ['id' => $id, 'staff_id' => null],
    ['$set' => ['staff_id' => $staff_id]]
);

header("Location: /staff/chat/detail.php?id=" . $id);
exit();