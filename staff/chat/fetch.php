<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$conversation_id = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : 0;
$staff_id = $_SESSION['user_id'];

$conversation = $db->chat_conversations->findOne(['id' => $conversation_id]);

if (!$conversation) {
    exit("Không có dữ liệu.");
}

if (!empty($conversation['staff_id']) && $conversation['staff_id'] != $staff_id) {
    exit("Cuộc trò chuyện này đã được nhân viên khác phụ trách.");
}

// Đánh dấu tin nhắn customer gửi cho staff là đã đọc
$db->chat_messages->updateMany(
    [
        'conversation_id' => $conversation_id,
        'sender_id' => ['$ne' => $staff_id],
        'is_read' => 0
    ],
    ['$set' => ['is_read' => 1]]
);

$pipeline = [
    ['$match' => ['conversation_id' => $conversation_id]],
    ['$lookup' => [
        'from' => 'users',
        'localField' => 'sender_id',
        'foreignField' => 'id',
        'as' => 'sender_info'
    ]],
    ['$unwind' => [
        'path' => '$sender_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'conversation_id' => 1,
        'sender_id' => 1,
        'message' => 1,
        'created_at' => 1,
        'full_name' => '$sender_info.full_name',
        'role' => '$sender_info.role'
    ]],
    ['$sort' => ['id' => 1]]
];

$messages = $db->chat_messages->aggregate($pipeline)->toArray();

if (empty($messages)) {
    echo "<p>Chưa có tin nhắn nào.</p>";
    exit();
}

foreach ($messages as $row) {
    $is_me = ($row['sender_id'] == $_SESSION['user_id']);

    echo '<div style="margin-bottom:10px; text-align:' . ($is_me ? 'right' : 'left') . ';">';
    echo '<div style="display:inline-block; max-width:70%; padding:10px; border-radius:8px; background:' . ($is_me ? '#d1e7dd' : '#e2e3e5') . ';">';
    echo '<strong>' . htmlspecialchars($row['full_name'] ?? '') . '</strong><br>';
    echo nl2br(htmlspecialchars($row['message'] ?? '')) . '<br>';
    echo '<small style="color:#666;">' . formatDate($row['created_at']) . '</small>';
    echo '</div>';
    echo '</div>';
}