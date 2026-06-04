<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: /admin/users/index.php?error=ID không hợp lệ");
    exit();
}

$id = (int)$_GET['id'];

$user = $db->users->findOne(['id' => $id]);

if (!$user) {
    header("Location: /admin/users/index.php?error=Không tìm thấy tài khoản");
    exit();
}
?>

<h2>Cập nhật tài khoản</h2>

<?php if (isset($_GET['error'])): ?>
    <p style="color:red;"><?php echo htmlspecialchars($_GET['error']); ?></p>
<?php endif; ?>

<form action="/admin/users/update.php" method="POST">
    <input type="hidden" name="id" value="<?php echo $user['id']; ?>">

    <div style="margin-bottom:10px;">
        <label>Họ và tên</label><br>
        <input type="text" name="full_name" required value="<?php echo htmlspecialchars($user['full_name']); ?>" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Email</label><br>
        <input type="email" name="email" required value="<?php echo htmlspecialchars($user['email']); ?>" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Số điện thoại</label><br>
        <input type="text" name="phone" value="<?php echo htmlspecialchars($user['phone']); ?>" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Địa chỉ</label><br>
        <input type="text" name="address" value="<?php echo htmlspecialchars($user['address']); ?>" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Mật khẩu mới</label><br>
        <input type="password" name="password" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Vai trò</label><br>
        <select name="role" required style="width:350px; padding:8px;">
            <option value="customer" <?php echo ($user['role'] == 'customer') ? 'selected' : ''; ?>>Khách hàng</option>
            <option value="staff" <?php echo ($user['role'] == 'staff') ? 'selected' : ''; ?>>Nhân viên</option>
            <option value="admin" <?php echo ($user['role'] == 'admin') ? 'selected' : ''; ?>>Admin</option>
        </select>
    </div>

    <div style="margin-bottom:10px;">
        <label>Trạng thái</label><br>
        <select name="status" required style="width:350px; padding:8px;">
            <option value="active" <?php echo ($user['status'] == 'active') ? 'selected' : ''; ?>>Hoạt động</option>
            <option value="blocked" <?php echo ($user['status'] == 'blocked') ? 'selected' : ''; ?>>Khóa</option>
        </select>
    </div>

    <button type="submit" style="padding:10px 15px;">Cập nhật</button>
    <a href="/admin/users/index.php">Quay lại</a>
</form>

<?php require_once "../../includes/footer.php"; ?>