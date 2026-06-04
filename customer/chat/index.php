<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$customer_id = $_SESSION['user_id'];

// Tìm hội thoại đang mở của khách
$conversation = $db->chat_conversations->findOne(['customer_id' => $customer_id, 'status' => 'open']);

if ($conversation) {
    $conversation_id = $conversation['id'];
} else {
    $conversation_id = getNextId($db, 'chat_conversations');
    $db->chat_conversations->insertOne([
        'id' => $conversation_id,
        'numeric_id' => $conversation_id,
        'customer_id' => $customer_id,
        'staff_id' => null,
        'status' => 'open',
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ]);
}

// ĐÁNH DẤU ĐÃ ĐỌC NGAY TẠI ĐÂY, TRƯỚC KHI LOAD HEADER
$db->chat_messages->updateMany(
    [
        'conversation_id' => $conversation_id,
        'sender_id' => ['$ne' => $customer_id],
        'is_read' => 0
    ],
    ['$set' => ['is_read' => 1]]
);

require_once "../../includes/header.php";
?>

<h2>Chat với nhân viên bán hàng</h2>

<div style="border:1px solid #ccc; padding:15px; background:#fff; border-radius:6px;">
    <div id="chat-box" style="height:400px; overflow-y:auto; border:1px solid #ddd; padding:10px; margin-bottom:15px; background:#f9f9f9;">
        Đang tải tin nhắn...
    </div>

    <form id="chat-form">
        <input type="hidden" name="conversation_id" value="<?php echo $conversation_id; ?>">

        <div style="display:flex; gap:10px;">
            <input
                type="text"
                name="message"
                id="message"
                placeholder="Nhập tin nhắn..."
                required
                style="flex:1; padding:10px;"
            >
            <button type="submit" style="padding:10px 16px;">Gửi</button>
        </div>
    </form>
</div>

<script>
const conversationId = <?php echo $conversation_id; ?>;
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');

function loadMessages() {
    fetch('/customer/chat/fetch.php?conversation_id=' + conversationId)
        .then(response => response.text())
        .then(data => {
            chatBox.innerHTML = data;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(chatForm);

    fetch('/customer/chat/send.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === 'success') {
            messageInput.value = '';
            loadMessages();
        } else {
            alert('Gửi tin nhắn thất bại');
        }
    });
});

loadMessages();
setInterval(loadMessages, 3000);
</script>

<?php require_once "../../includes/footer.php"; ?>