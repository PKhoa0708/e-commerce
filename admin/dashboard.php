<?php
require_once "../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../middleware/role.php";
require_once "../includes/header.php";
?>

<div style="max-width:1200px; margin:30px auto; font-family:Arial, sans-serif;">
    <p style="font-size:16px; color:#444;">
        Xin chào, <strong><?php echo htmlspecialchars($_SESSION['full_name']); ?></strong>
    </p>

    <div style="margin-top:25px; display:flex; flex-wrap:wrap; gap:12px;">
        <a href="/admin/users/index.php"
           style="padding:12px 18px; background:green; color:white; text-decoration:none; border-radius:6px; display:inline-block;">
            Quản lý tài khoản
        </a>

        <a href="/admin/revenue_statistics.php"
           style="padding:12px 18px; background:#007bff; color:white; text-decoration:none; border-radius:6px; display:inline-block;">
            Thống kê doanh thu
        </a>
    </div>

    <div style="margin-top:30px; background:#fff; border:1px solid #ddd; border-radius:8px; padding:20px;">
        <h3 style="margin-top:0; color:#222;">Chức năng quản trị</h3>
        <ul style="line-height:1.8; color:#555; padding-left:20px; margin-bottom:0;">
            <li>Quản lý tài khoản người dùng</li>
            <li>Xem thống kê doanh thu theo ngày / tháng / năm</li>
            <li>Thống kê số lượng đơn hàng</li>
            <li>Thống kê sản phẩm bán chạy</li>
            <li>Thống kê trạng thái đơn hàng và thanh toán</li>
        </ul>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>