<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../../middleware/role.php";
require_once "../../includes/header.php";
?>

<h2>Thêm tài khoản mới</h2>

<?php if (isset($_GET['error'])): ?>
    <p style="color:red;"><?php echo htmlspecialchars($_GET['error']); ?></p>
<?php endif; ?>

<form action="/admin/users/store.php" method="POST">
    <div style="margin-bottom:10px;">
        <label>Họ và tên</label><br>
        <input type="text" name="full_name" required style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Email</label><br>
        <input type="email" name="email" required style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Số điện thoại</label><br>
        <input type="text" name="phone" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Địa chỉ</label><br>
        <input type="text" name="address" style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Mật khẩu</label><br>
        <input type="password" name="password" required style="width:350px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Vai trò</label><br>
        <select name="role" required style="width:350px; padding:8px;">
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
            <option value="admin">Admin</option>
        </select>
    </div>

    <div style="margin-bottom:10px;">
        <label>Trạng thái</label><br>
        <select name="status" required style="width:350px; padding:8px;">
            <option value="active">Hoạt động</option>
            <option value="blocked">Khóa</option>
        </select>
    </div>

    <button type="submit" style="padding:10px 15px;">Lưu</button>
    <a href="/admin/users/index.php">Quay lại</a>
</form>

<?php require_once "../../includes/footer.php"; ?>