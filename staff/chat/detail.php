<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$conversation_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$staff_id = $_SESSION['user_id'];

if ($conversation_id <= 0) {
    header("Location: /staff/chat/index.php");
    exit();
}

// Lấy thông tin hội thoại
$conversation = $db->chat_conversations->findOne(['id' => $conversation_id]);

if (!$conversation) {
    header("Location: /staff/chat/index.php");
    exit();
}

// Lấy thông tin khách hàng
$customer = $db->users->findOne(['id' => $conversation['customer_id']]);
$conversation['customer_name'] = $customer ? $customer['full_name'] : '';

// Nếu chưa có staff phụ trách thì tự nhận
if (empty($conversation['staff_id'])) {
    $db->chat_conversations->updateOne(
        ['id' => $conversation_id, 'staff_id' => null],
        ['$set' => ['staff_id' => $staff_id]]
    );
    $conversation['staff_id'] = $staff_id;
} else {
    if ((int)$conversation['staff_id'] !== (int)$staff_id) {
        require_once "../../includes/header.php";
        echo "<p style='color:red;'>Cuộc trò chuyện này đã được nhân viên khác phụ trách.</p>";
        echo "<p><a href='/staff/chat/index.php'>Quay lại danh sách chat</a></p>";
        require_once "../../includes/footer.php";
        exit();
    }
}

// ĐÁNH DẤU ĐÃ ĐỌC NGAY TẠI ĐÂY, TRƯỚC KHI LOAD HEADER
$db->chat_messages->updateMany(
    [
        'conversation_id' => $conversation_id,
        'sender_id' => ['$ne' => $staff_id],
        'is_read' => 0
    ],
    ['$set' => ['is_read' => 1]]
);

require_once "../../includes/header.php";
?>

<h2>Chat với khách hàng: <?php echo htmlspecialchars($conversation['customer_name']); ?></h2>

<div style="margin-bottom:15px;">
    <a href="/staff/chat/index.php" style="padding:8px 12px; background:gray; color:white; text-decoration:none;">
        Quay lại
    </a>
</div>

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
const conversationId = <?php echo (int)$conversation_id; ?>;
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');

function loadMessages() {
    fetch('/staff/chat/fetch.php?conversation_id=' + conversationId)
        .then(response => response.text())
        .then(data => {
            chatBox.innerHTML = data;
            chatBox.scrollTop = chatBox.scrollHeight;
        })
        .catch(error => {
            chatBox.innerHTML = '<p style="color:red;">Không tải được tin nhắn.</p>';
            console.error(error);
        });
}

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(chatForm);

    fetch('/staff/chat/send.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === 'success') {
            messageInput.value = '';
            loadMessages();
        } else {
            alert('Gửi tin nhắn thất bại: ' + data);
        }
    })
    .catch(error => {
        alert('Có lỗi khi gửi tin nhắn');
        console.error(error);
    });
});

loadMessages();
setInterval(loadMessages, 3000);
</script>

<?php require_once "../../includes/footer.php"; ?>