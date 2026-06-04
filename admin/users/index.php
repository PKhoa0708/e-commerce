<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

$result = $db->users->find([], ['sort' => ['id' => -1]]);
?>

<h2>Quản lý tài khoản người dùng</h2>

<?php if (isset($_GET['success'])): ?>
    <p style="color: green;"><?php echo htmlspecialchars($_GET['success']); ?></p>
<?php endif; ?>

<?php if (isset($_GET['error'])): ?>
    <p style="color: red;"><?php echo htmlspecialchars($_GET['error']); ?></p>
<?php endif; ?>

<div style="margin: 15px 0;">
    <a href="/admin/users/create.php" style="padding:10px 15px; background:blue; color:white; text-decoration:none;">
        + Thêm tài khoản
    </a>
    <a href="/admin/dashboard.php" style="padding:10px 15px; background:gray; color:white; text-decoration:none; margin-left:10px;">
        Quay lại
    </a>
</div>

<table border="1" cellpadding="10" cellspacing="0" width="100%">
    <tr style="background:#f2f2f2;">
        <th>ID</th>
        <th>Họ tên</th>
        <th>Email</th>
        <th>SĐT</th>
        <th>Vai trò</th>
        <th>Trạng thái</th>
        <th>Ngày tạo</th>
        <th>Hành động</th>
    </tr>

    <?php foreach ($result as $user): ?>
        <tr>
            <td><?php echo $user['id']; ?></td>
            <td><?php echo htmlspecialchars($user['full_name']); ?></td>
            <td><?php echo htmlspecialchars($user['email']); ?></td>
            <td><?php echo htmlspecialchars($user['phone']); ?></td>
            <td><?php echo htmlspecialchars($user['role']); ?></td>
            <td>
                <?php if ($user['status'] == 'active'): ?>
                    <span style="color:green;">Đang hoạt động</span>
                <?php else: ?>
                    <span style="color:red;">Đã khóa</span>
                <?php endif; ?>
            </td>
            <td><?php echo formatDate($user['created_at']); ?></td>
            <td>
                <a href="/admin/users/edit.php?id=<?php echo $user['id']; ?>">Sửa</a> |
                <a href="/admin/users/toggle_status.php?id=<?php echo $user['id']; ?>"
                   onclick="return confirm('Bạn có chắc muốn thay đổi trạng thái tài khoản này?');">
                    <?php echo $user['status'] == 'active' ? 'Khóa' : 'Mở khóa'; ?>
                </a>
            </td>
        </tr>
    <?php endforeach; ?>
</table>

<?php require_once "../../includes/footer.php"; ?>