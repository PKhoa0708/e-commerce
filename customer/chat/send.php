<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['customer'];
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

// kiểm tra conversation thuộc về khách hiện tại
$conversation = $db->chat_conversations->findOne([
    'id' => $conversation_id,
    'customer_id' => $sender_id
]);

if (!$conversation) {
    exit('invalid');
}

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