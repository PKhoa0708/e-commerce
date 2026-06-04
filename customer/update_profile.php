<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

$user_id = (int)$_SESSION['user_id'];

$user = $db->users->findOne(['id' => $user_id]);

if (!$user) {
    header("Location: /customer/dashboard.php?error=" . urlencode("Không tìm thấy tài khoản"));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
    $phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
    $address = isset($_POST['address']) ? trim($_POST['address']) : '';
    $current_avatar = $user['avatar'];
    $new_avatar_path = $current_avatar;

    if ($full_name === '') {
        header("Location: /customer/update_profile.php?error=" . urlencode("Vui lòng nhập họ tên"));
        exit();
    }

    if ($phone !== '' && !preg_match('/^[0-9+\-\s]{8,20}$/', $phone)) {
        header("Location: /customer/update_profile.php?error=" . urlencode("Số điện thoại không hợp lệ"));
        exit();
    }

    if (mb_strlen($address) > 255) {
        header("Location: /customer/update_profile.php?error=" . urlencode("Địa chỉ tối đa 255 ký tự"));
        exit();
    }

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            header("Location: /customer/update_profile.php?error=" . urlencode("Upload ảnh thất bại"));
            exit();
        }

        $allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        $file_type = mime_content_type($_FILES['avatar']['tmp_name']);

        if (!in_array($file_type, $allowed_types)) {
            header("Location: /customer/update_profile.php?error=" . urlencode("Chỉ chấp nhận ảnh JPG, PNG, WEBP"));
            exit();
        }

        if ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
            header("Location: /customer/update_profile.php?error=" . urlencode("Ảnh đại diện tối đa 2MB"));
            exit();
        }

        $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $user_id . '_' . time() . '.' . strtolower($ext);
        $upload_dir = "../uploads/avatars/";

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $target_path = $upload_dir . $filename;
        if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $target_path)) {
            header("Location: /customer/update_profile.php?error=" . urlencode("Không thể lưu ảnh đại diện"));
            exit();
        }

        $new_avatar_path = "uploads/avatars/" . $filename;
    }

    $updateResult = $db->users->updateOne(
        ['id' => $user_id],
        ['$set' => [
            'full_name' => $full_name,
            'phone' => $phone,
            'address' => $address,
            'avatar' => $new_avatar_path,
            'updated_at' => new MongoDB\BSON\UTCDateTime()
        ]]
    );

    if ($updateResult->getMatchedCount() > 0) {
        $_SESSION['full_name'] = $full_name;
        header("Location: /customer/profile.php?success=" . urlencode("Cập nhật thông tin thành công"));
        exit();
    } else {
        header("Location: /customer/update_profile.php?error=" . urlencode("Không thể cập nhật thông tin"));
        exit();
    }
}

$has_avatar = !empty($user['avatar']);
$avatar = $has_avatar ? '/' . ltrim($user['avatar'], '/') : '';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Cập nhật thông tin tài khoản</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Inter", sans-serif;
            background: linear-gradient(180deg, #F6F8FC 0%, #FFF8F8 100%);
            color: #1F2937;
        }

        a {
            text-decoration: none;
        }

        .update-profile-page {
            max-width: 1180px;
            margin: 0 auto;
            padding: 32px 16px 60px;
        }

        .update-hero {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            padding: 34px;
            margin-bottom: 24px;
            background:
                linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
                url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
            color: #fff;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        }

        .update-hero::before {
            content: "";
            position: absolute;
            top: -70px;
            right: -70px;
            width: 210px;
            height: 210px;
            border-radius: 50%;
            background: rgba(255,255,255,0.10);
        }

        .update-hero::after {
            content: "";
            position: absolute;
            left: -90px;
            bottom: -90px;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
        }

        .update-hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 16px;
            flex-wrap: wrap;
        }

        .update-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            border: 1px solid rgba(255,255,255,0.18);
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 14px;
        }

        .update-hero h1 {
            margin: 0 0 10px;
            font-size: clamp(30px, 4vw, 44px);
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -0.6px;
        }

        .update-hero p {
            margin: 0;
            max-width: 760px;
            color: rgba(255,255,255,0.94);
            font-size: 16px;
            line-height: 1.7;
        }

        .hero-back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 18px;
            border-radius: 14px;
            background: #fff;
            color: #E53935;
            font-weight: 800;
            box-shadow: 0 10px 24px rgba(0,0,0,0.10);
            transition: 0.25s ease;
            white-space: nowrap;
        }

        .hero-back-btn:hover {
            transform: translateY(-1px);
        }

        .message {
            padding: 14px 16px;
            border-radius: 18px;
            margin-bottom: 16px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid transparent;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
        }

        .error {
            background: #FEF2F2;
            color: #B91C1C;
            border-color: #FECACA;
        }

        .update-layout {
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 24px;
            align-items: start;
        }

        .profile-preview,
        .form-card {
            background: #fff;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .profile-preview {
            padding: 28px 24px;
            text-align: center;
        }

        .avatar-box {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            overflow: hidden;
            background: #EEF2F7;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
            border: 4px solid #F8FAFC;
            box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
        }

        .avatar-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .avatar-default {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .preview-name {
            margin: 0 0 8px;
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            line-height: 1.3;
        }

        .preview-role {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(229, 57, 53, 0.08);
            color: #E53935;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 18px;
        }

        .preview-note {
            margin: 0;
            color: #6B7280;
            font-size: 14px;
            line-height: 1.7;
        }

        .form-card {
            overflow: hidden;
        }

        .form-head {
            padding: 24px 24px 0;
        }

        .form-title {
            margin: 0 0 6px;
            font-size: 26px;
            font-weight: 800;
            color: #111827;
        }

        .form-desc {
            margin: 0 0 20px;
            color: #6B7280;
            font-size: 14px;
            line-height: 1.7;
        }

        .form-content {
            padding: 0 24px 24px;
        }

        .avatar-upload-box {
            margin-bottom: 24px;
            padding: 18px;
            border-radius: 20px;
            background: #F8FAFC;
            border: 1px solid #EEF2F7;
            text-align: center;
        }

        .change-avatar-label {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 16px;
            background: linear-gradient(135deg, #1565C0, #2B7FFF);
            color: #fff;
            border-radius: 14px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 800;
            transition: 0.25s ease;
            box-shadow: 0 14px 28px rgba(21, 101, 192, 0.20);
        }

        .change-avatar-label:hover {
            transform: translateY(-1px);
        }

        #avatar {
            display: none;
        }

        .file-note {
            margin-top: 10px;
            font-size: 13px;
            color: #6B7280;
        }

        #selectedFileName {
            margin-top: 10px;
            font-size: 13px;
            color: #111827;
            font-weight: 600;
            word-break: break-word;
        }

        .form-grid {
            display: grid;
            gap: 16px;
        }

        .form-group {
            display: grid;
            gap: 8px;
        }

        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: #374151;
        }

        .form-input,
        .form-textarea {
            width: 100%;
            border: 1px solid #D1D5DB;
            border-radius: 16px;
            background: #fff;
            color: #111827;
            font-size: 15px;
            outline: none;
            transition: 0.25s ease;
            font-family: inherit;
        }

        .form-input {
            height: 52px;
            padding: 0 14px;
        }

        .form-textarea {
            min-height: 120px;
            padding: 14px;
            resize: vertical;
        }

        .form-input:focus,
        .form-textarea:focus {
            border-color: #E53935;
            box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
        }

        .form-input[disabled] {
            background: #F3F4F6;
            color: #6B7280;
            cursor: not-allowed;
        }

        .form-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 18px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 52px;
            padding: 0 18px;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: 0.25s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #E53935, #FF6B57);
            color: #fff;
            box-shadow: 0 14px 28px rgba(229, 57, 53, 0.22);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #F3F4F6;
            color: #374151;
            border: 1px solid #E5E7EB;
        }

        .btn-secondary:hover {
            background: #E5E7EB;
        }

        @media (max-width: 992px) {
            .update-layout {
                grid-template-columns: 1fr;
            }

            .update-hero {
                padding: 26px 20px;
                border-radius: 24px;
            }
        }

        @media (max-width: 640px) {
            .form-actions {
                flex-direction: column;
            }

            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>

<div class="update-profile-page">
    <section class="update-hero">
        <div class="update-hero-content">
            <div>
                <div class="update-badge">✏️ Cập nhật hồ sơ</div>
                <h1>Chỉnh sửa thông tin tài khoản</h1>
                <p>
                    Cập nhật họ tên, số điện thoại, địa chỉ và ảnh đại diện để việc mua sắm
                    và giao hàng trong hệ thống được chính xác, thuận tiện hơn.
                </p>
            </div>

            <a class="hero-back-btn" href="/customer/profile.php">← Quay lại tài khoản</a>
        </div>
    </section>

    <?php if (isset($_GET['error'])): ?>
        <div class="message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
    <?php endif; ?>

    <div class="update-layout">
        <aside class="profile-preview">
            <div class="avatar-box" id="avatarPreviewBox">
                <?php if ($has_avatar): ?>
                    <img src="<?php echo htmlspecialchars($avatar); ?>" alt="Avatar" id="avatarPreview">
                <?php else: ?>
                    <div class="avatar-default" id="avatarDefault">
                        <svg viewBox="0 0 24 24" fill="#65676B" width="88" height="88" aria-hidden="true">
                            <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z"/>
                        </svg>
                    </div>
                    <img src="" alt="Avatar Preview" id="avatarPreview" style="display:none;">
                <?php endif; ?>
            </div>

            <h2 class="preview-name"><?php echo htmlspecialchars($user['full_name']); ?></h2>
            <div class="preview-role">Khách hàng</div>
            <p class="preview-note">
                Hồ sơ rõ ràng và đầy đủ sẽ giúp quá trình nhận hàng và hỗ trợ khách hàng diễn ra nhanh hơn.
            </p>
        </aside>

        <section class="form-card">
            <div class="form-head">
                <h2 class="form-title">Biểu mẫu cập nhật thông tin</h2>
                <p class="form-desc">
                    Vui lòng kiểm tra kỹ trước khi lưu thay đổi.
                </p>
            </div>

            <div class="form-content">
                <form method="POST" enctype="multipart/form-data">
                    <div class="avatar-upload-box">
                        <label for="avatar" class="change-avatar-label">Thay đổi ảnh đại diện</label>
                        <input type="file" name="avatar" id="avatar" accept=".jpg,.jpeg,.png,.webp">
                        <div class="file-note">Chấp nhận JPG, PNG, WEBP. Kích thước tối đa 2MB.</div>
                        <div id="selectedFileName"></div>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label for="full_name">Họ tên</label>
                            <input
                                type="text"
                                name="full_name"
                                id="full_name"
                                value="<?php echo htmlspecialchars($user['full_name']); ?>"
                                required
                                class="form-input"
                            >
                        </div>

                        <div class="form-group">
                            <label for="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value="<?php echo htmlspecialchars($user['email']); ?>"
                                disabled
                                class="form-input"
                            >
                        </div>

                        <div class="form-group">
                            <label for="phone">Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                id="phone"
                                value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>"
                                class="form-input"
                            >
                        </div>

                        <div class="form-group">
                            <label for="address">Địa chỉ</label>
                            <textarea
                                name="address"
                                id="address"
                                rows="4"
                                class="form-textarea"
                            ><?php echo htmlspecialchars($user['address'] ?? ''); ?></textarea>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
                        <a class="btn btn-secondary" href="/customer/profile.php">Hủy</a>
                    </div>
                </form>
            </div>
        </section>
    </div>
</div>

<script>
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarDefault = document.getElementById('avatarDefault');
    const selectedFileName = document.getElementById('selectedFileName');

    avatarInput.addEventListener('change', function () {
        const file = this.files[0];

        if (!file) {
            selectedFileName.textContent = '';
            return;
        }

        selectedFileName.textContent = 'Đã chọn: ' + file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
            if (avatarDefault) {
                avatarDefault.style.display = 'none';
            }
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
</script>

</body>
</html>