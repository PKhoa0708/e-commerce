<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

$staff_id = $_SESSION['user_id'];

$pipeline = [
    ['$match' => ['status' => 'open']],
    ['$lookup' => [
        'from' => 'users',
        'localField' => 'customer_id',
        'foreignField' => 'id',
        'as' => 'customer_info'
    ]],
    ['$unwind' => [
        'path' => '$customer_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$lookup' => [
        'from' => 'chat_messages',
        'let' => ['conv_id' => '$id'],
        'pipeline' => [
            ['$match' => ['$expr' => ['$eq' => ['$conversation_id', '$$conv_id']]]],
            ['$sort' => ['id' => -1]],
            ['$limit' => 1]
        ],
        'as' => 'last_msg_info'
    ]],
    ['$unwind' => [
        'path' => '$last_msg_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'customer_id' => 1,
        'staff_id' => 1,
        'status' => 1,
        'updated_at' => 1,
        'customer_name' => '$customer_info.full_name',
        'last_message' => '$last_msg_info.message'
    ]],
    ['$sort' => ['updated_at' => -1, 'id' => -1]]
];

$result = $db->chat_conversations->aggregate($pipeline)->toArray();
?>

<h2>Danh sách cuộc trò chuyện</h2>

<?php if (!empty($result)): ?>
    <table border="1" cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr style="background:#f2f2f2;">
            <th>ID</th>
            <th>Khách hàng</th>
            <th>Nhân viên phụ trách</th>
            <th>Tin nhắn gần nhất</th>
            <th>Hành động</th>
        </tr>

        <?php foreach ($result as $row): ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo htmlspecialchars($row['customer_name'] ?? ''); ?></td>
                <td>
                    <?php
                    if (!empty($row['staff_id'])) {
                        if ($row['staff_id'] == $staff_id) {
                            echo "Bạn";
                        } else {
                            echo "Đã có nhân viên khác nhận";
                        }
                    } else {
                        echo "Chưa có";
                    }
                    ?>
                </td>
                <td><?php echo !empty($row['last_message']) ? htmlspecialchars($row['last_message']) : 'Chưa có tin nhắn'; ?></td>
                <td>
                    <?php if (empty($row['staff_id'])): ?>
                        <a href="/staff/chat/assign.php?id=<?php echo $row['id']; ?>">Nhận chat</a> |
                    <?php endif; ?>
                    <a href="/staff/chat/detail.php?id=<?php echo $row['id']; ?>">Xem chat</a>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
<?php else: ?>
    <p>Chưa có cuộc trò chuyện nào.</p>
<?php endif; ?>

<?php require_once "../../includes/footer.php"; ?>