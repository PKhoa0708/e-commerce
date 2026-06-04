<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit('invalid');
}

$conversation_id = (int)$_POST['conversation_id'];
$message = trim($_POST['message']);
$sender_id = $_SESSION['user_id'];

if ($conversation_id <= 0 || $message === '') {
    exit('invalid');
}

// staff chỉ gửi được khi conversation đã nhận hoặc đang trống
$conversation = $db->chat_conversations->findOne(['id' => $conversation_id]);

if (!$conversation) {
    exit('invalid');
}

// Nếu chưa có staff thì gán staff hiện tại
if (empty($conversation['staff_id'])) {
    $db->chat_conversations->updateOne(
        ['id' => $conversation_id, 'staff_id' => null],
        ['$set' => ['staff_id' => $sender_id]]
    );
} elseif ($conversation['staff_id'] != $sender_id) {
    exit('invalid');
}

// Thêm tin nhắn mới
$msg_id = getNextId($db, 'chat_messages');
$insertResult = $db->chat_messages->insertOne([
    'id' => $msg_id,
    'numeric_id' => $msg_id,
    'conversation_id' => $conversation_id,
    'sender_id' => $sender_id,
    'message' => $message,
    'is_read' => 0,
    'created_at' => new MongoDB\BSON\UTCDateTime()
]);

if ($insertResult->getInsertedCount() > 0) {
    // Cập nhật updated_at của conversation để đẩy lên đầu danh sách
    $db->chat_conversations->updateOne(
        ['id' => $conversation_id],
        ['$set' => ['updated_at' => new MongoDB\BSON\UTCDateTime()]]
    );
    echo "success";
} else {
    echo "error";
}