<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../database/db.php';

$header_user = null;
$header_avatar = '/uploads/default-avatar.png';

if (isset($_SESSION['user_id'])) {
    $header_user_id = (int)$_SESSION['user_id'];

    $header_user = $db->users->findOne(['numeric_id' => $header_user_id]);

    if ($header_user) {
        if (!empty($header_user['avatar'])) {
            $header_avatar = '/' . ltrim($header_user['avatar'], '/');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Lotte Mart</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            margin: 0;
            font-family: "Inter", sans-serif;
            background: #F6F8FC;
            color: #1F2937;
        }

        a {
            text-decoration: none;
        }

        .lotte-header {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: rgba(229, 57, 53, 0.96);
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
        }

        .lotte-header-inner {
            max-width: 1440px;
            margin: 0 auto;
            padding: 14px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }

        .lotte-header-left,
        .lotte-header-right {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .lotte-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            color: #fff;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: -0.3px;
            margin-right: 8px;
        }

        .lotte-brand-logo {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            background: rgba(255,255,255,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .lotte-nav-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 12px;
            color: #fff;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lotte-nav-link:hover {
            background: rgba(255,255,255,0.16);
            transform: translateY(-1px);
        }

        .lotte-nav-link:active {
            transform: translateY(0);
        }

        .lotte-nav-link.outline {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.18);
        }

        .lotte-nav-link.outline:hover {
            background: rgba(255,255,255,0.18);
            border-color: rgba(255,255,255,0.35);
        }

        .lotte-nav-link.solid {
            background: #fff;
            color: #E53935;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .lotte-nav-link.solid:hover {
            background: #fff;
            color: #E53935;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
            transform: translateY(-2px);
        }

        .lotte-nav-link.logout {
            background: rgba(0,0,0,0.15);
        }

        .lotte-header-icon-link {
            position: relative;
            width: 42px;
            height: 42px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            background: rgba(255,255,255,0.10);
            border: 1px solid rgba(255,255,255,0.16);
            font-size: 20px;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lotte-header-icon-link:hover {
            transform: translateY(-2px) scale(1.05);
            background: rgba(255,255,255,0.18);
            border-color: rgba(255,255,255,0.4);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .lotte-header-icon-link:active {
            transform: translateY(0) scale(0.95);
        }

        .lotte-badge {
            position: absolute;
            top: -6px;
            right: -7px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 999px;
            background: #FFC107;
            color: #111827;
            font-size: 10px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            border: 2px solid #E53935;
            animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
            0% { transform: scale(1); }
            50% { transform: scale(1.12); }
            100% { transform: scale(1); }
        }

        .lotte-account-wrap {
            position: relative;
        }

        .lotte-account-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.24);
            background: #fff;
            color: #333;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 0;
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lotte-account-btn:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }

        .lotte-account-btn:active {
            transform: translateY(0) scale(0.95);
        }

        .lotte-account-btn img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .lotte-account-menu {
            position: absolute;
            top: 56px;
            right: 0;
            width: 330px;
            background: #fff;
            color: #333;
            border-radius: 20px;
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.18);
            padding: 20px;
            z-index: 99999;
            border: 1px solid #E5E7EB;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px) scale(0.95);
            transform-origin: top right;
            transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
        }

        .lotte-account-menu.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        .lotte-account-profile {
            text-align: center;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #EEF2F7;
        }

        .lotte-account-profile img,
        .lotte-account-avatar-fallback {
            width: 78px;
            height: 78px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #F3F4F6;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F9FAFB;
            font-size: 34px;
        }

        .lotte-account-name {
            font-size: 18px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 4px;
        }

        .lotte-account-role {
            display: inline-flex;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(229,57,53,0.08);
            color: #E53935;
            font-size: 12px;
            font-weight: 700;
        }

        .lotte-account-info {
            display: grid;
            gap: 10px;
            margin-bottom: 18px;
        }

        .lotte-account-info-item {
            background: #F8FAFC;
            border: 1px solid #EEF2F7;
            border-radius: 14px;
            padding: 12px 14px;
        }

        .lotte-account-info-item .label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #6B7280;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .lotte-account-info-item .value {
            font-size: 14px;
            color: #111827;
            line-height: 1.5;
            word-break: break-word;
        }

        .lotte-account-actions {
            display: grid;
            gap: 10px;
        }

        .lotte-account-action {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 14px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 14px;
            transition: 0.25s ease;
        }

        .lotte-account-action.primary {
            background: #1565C0;
            color: #fff;
        }

        .lotte-account-action.primary:hover {
            background: #0f57ac;
        }

        .lotte-account-action.danger {
            background: #FEE2E2;
            color: #DC2626;
        }

        .lotte-account-action.danger:hover {
            background: #FECACA;
        }

        .lotte-page-content {
            padding: 20px;
        }

        @media (max-width: 768px) {
            .lotte-header-inner {
                padding: 12px 16px;
                gap: 12px;
                flex-wrap: wrap;
            }

            .lotte-header-left,
            .lotte-header-right {
                flex-wrap: wrap;
                gap: 10px;
            }

            .lotte-brand {
                font-size: 18px;
            }

            .lotte-brand-logo {
                width: 38px;
                height: 38px;
                font-size: 18px;
            }

            .lotte-nav-link {
                padding: 9px 12px;
                font-size: 13px;
            }

            .lotte-account-menu {
                width: min(330px, calc(100vw - 24px));
                right: 0;
            }
        }
    </style>
</head>
<body>

<div class="lotte-header">
    <div class="lotte-header-inner">

        <!-- LEFT -->
        <div class="lotte-header-left">
            <a href="/customer/dashboard.php" class="lotte-brand">
                <span class="lotte-brand-logo">🛒</span>
                <span>Lotte Mart</span>
            </a>

            <?php if(isset($_SESSION['user_id'])): ?>
                <a href="/auth/logout.php" class="lotte-nav-link logout">
                    Đăng xuất
                </a>
            <?php else: ?>
                <a href="/auth/login.php" class="lotte-nav-link outline">
                    Đăng nhập
                </a>

                <a href="/auth/register.php" class="lotte-nav-link solid">
                    Đăng ký
                </a>
            <?php endif; ?>
        </div>

        <!-- RIGHT -->
        <div class="lotte-header-right">

            <?php
            $unread_chat_count = 0;

            if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
                $user_id = (int)$_SESSION['user_id'];
                $role = $_SESSION['role'];

                if ($role === 'customer') {
                    $pipeline = [
                        ['$match' => [
                            'sender_id' => ['$ne' => $user_id],
                            'is_read' => 0
                        ]],
                        ['$lookup' => [
                            'from' => 'chat_conversations',
                            'localField' => 'conversation_id',
                            'foreignField' => 'id',
                            'as' => 'conv'
                        ]],
                        ['$unwind' => '$conv'],
                        ['$match' => [
                            'conv.customer_id' => $user_id
                        ]],
                        ['$lookup' => [
                            'from' => 'users',
                            'localField' => 'sender_id',
                            'foreignField' => 'id',
                            'as' => 'sender'
                        ]],
                        ['$unwind' => '$sender'],
                        ['$match' => [
                            'sender.role' => 'staff'
                        ]],
                        ['$count' => 'total']
                    ];
                    $res = $db->chat_messages->aggregate($pipeline)->toArray();
                    $unread_chat_count = !empty($res) ? (int)$res[0]['total'] : 0;
                } elseif ($role === 'staff') {
                    $pipeline = [
                        ['$match' => [
                            'sender_id' => ['$ne' => $user_id],
                            'is_read' => 0
                        ]],
                        ['$lookup' => [
                            'from' => 'chat_conversations',
                            'localField' => 'conversation_id',
                            'foreignField' => 'id',
                            'as' => 'conv'
                        ]],
                        ['$unwind' => '$conv'],
                        ['$match' => [
                            '$or' => [
                                ['conv.staff_id' => $user_id],
                                ['conv.staff_id' => null]
                            ]
                        ]],
                        ['$lookup' => [
                            'from' => 'users',
                            'localField' => 'sender_id',
                            'foreignField' => 'id',
                            'as' => 'sender'
                        ]],
                        ['$unwind' => '$sender'],
                        ['$match' => [
                            'sender.role' => 'customer'
                        ]],
                        ['$count' => 'total']
                    ];
                    $res = $db->chat_messages->aggregate($pipeline)->toArray();
                    $unread_chat_count = !empty($res) ? (int)$res[0]['total'] : 0;
                }
            }
            ?>

            <!-- ACCOUNT ICON: chỉ hiện cho customer -->
            <?php if ($header_user && $header_user['role'] === 'customer'): ?>
                <div id="accountDropdown" class="lotte-account-wrap">
                    <button
                        type="button"
                        id="accountToggle"
                        class="lotte-account-btn"
                    >
                        <?php if (!empty($header_user['avatar'])): ?>
                            <img
                                src="<?php echo htmlspecialchars($header_avatar); ?>"
                                alt="Avatar"
                            >
                        <?php else: ?>
                            <span style="font-size:20px;">👤</span>
                        <?php endif; ?>
                    </button>

                    <div id="accountMenu" class="lotte-account-menu">
                        <div class="lotte-account-profile">
                            <?php if (!empty($header_user['avatar'])): ?>
                                <img
                                    src="<?php echo htmlspecialchars($header_avatar); ?>"
                                    alt="Avatar"
                                >
                            <?php else: ?>
                                <div class="lotte-account-avatar-fallback">👤</div>
                            <?php endif; ?>

                            <div class="lotte-account-name">
                                <?php echo htmlspecialchars($header_user['full_name']); ?>
                            </div>
                            <div class="lotte-account-role">
                                <?php echo htmlspecialchars($header_user['role']); ?>
                            </div>
                        </div>

                        <div class="lotte-account-info">
                            <div class="lotte-account-info-item">
                                <span class="label">Email</span>
                                <span class="value"><?php echo htmlspecialchars($header_user['email']); ?></span>
                            </div>

                            <div class="lotte-account-info-item">
                                <span class="label">Số điện thoại</span>
                                <span class="value"><?php echo htmlspecialchars($header_user['phone'] ?? ''); ?></span>
                            </div>

                            <div class="lotte-account-info-item">
                                <span class="label">Địa chỉ</span>
                                <span class="value"><?php echo htmlspecialchars($header_user['address'] ?? ''); ?></span>
                            </div>
                        </div>

                        <div class="lotte-account-actions">
                            <a
                                href="/customer/profile.php"
                                class="lotte-account-action primary"
                            >
                                Chỉnh sửa thông tin
                            </a>

                            <a
                                href="/auth/logout.php"
                                onclick="return confirm('Bạn có chắc muốn đăng xuất không?');"
                                class="lotte-account-action danger"
                            >
                                Đăng xuất
                            </a>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- CHAT -->
            <?php if(isset($_SESSION['user_id'])): ?>

                <?php if($_SESSION['role'] === 'customer'): ?>
                    <a href="/customer/chat/index.php" title="Chat" class="lotte-header-icon-link">
                        💬
                        <?php if ($unread_chat_count > 0): ?>
                            <span class="lotte-badge">
                                <?php echo $unread_chat_count; ?>
                            </span>
                        <?php endif; ?>
                    </a>
                <?php elseif($_SESSION['role'] === 'staff'): ?>
                    <a href="/staff/chat/index.php" title="Chat" class="lotte-header-icon-link">
                        💬
                        <?php if ($unread_chat_count > 0): ?>
                            <span class="lotte-badge">
                                <?php echo $unread_chat_count; ?>
                            </span>
                        <?php endif; ?>
                    </a>
                <?php else: ?>
                    <a href="/auth/login.php" title="Chat" class="lotte-header-icon-link">
                        💬
                    </a>
                <?php endif; ?>

            <?php else: ?>
                <a href="/auth/login.php" title="Chat" class="lotte-header-icon-link">
                    💬
                </a>
            <?php endif; ?>

            <!-- CART -->
            <a href="/customer/cart.php" title="Giỏ hàng" class="lotte-header-icon-link">
                🛒
                <?php
                $count = 0;

                if (isset($_SESSION['user_id'])) {
                    $user_id = (int)$_SESSION['user_id'];
                    $cart = $db->carts->findOne(['user_id' => $user_id]);
                    if ($cart) {
                        $cart_id = (int)$cart['id'];
                        $count = $db->cart_items->countDocuments(['cart_id' => $cart_id]);
                    }
                }

                if ($count > 0):
                ?>
                    <span class="lotte-badge">
                        <?php echo $count; ?>
                    </span>
                <?php endif; ?>
            </a>

        </div>
    </div>
</div>

<div class="lotte-page-content">

<?php if ($header_user && $header_user['role'] === 'customer'): ?>
<script>
    (function () {
        const toggle = document.getElementById('accountToggle');
        const menu = document.getElementById('accountMenu');
        const dropdown = document.getElementById('accountDropdown');

        if (toggle && menu && dropdown) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                menu.classList.toggle('active');
            });

            document.addEventListener('click', function (e) {
                if (!dropdown.contains(e.target)) {
                    menu.classList.remove('active');
                }
            });
        }
    })();
</script>
<?php endif; ?>