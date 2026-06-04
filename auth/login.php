<?php
require_once "../middleware/guest.php";
require_once "../includes/header.php";
?>

<style>
    .login-page {
        padding: 40px 0 70px;
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF7F7 100%);
        min-height: calc(100vh - 120px);
    }

    .login-container {
        max-width: 1180px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .login-grid {
        display: grid;
        grid-template-columns: 1fr 500px;
        gap: 28px;
        align-items: stretch;
    }

    .login-showcase {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 40px;
        min-height: 640px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.88)),
            url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .login-showcase::before {
        content: "";
        position: absolute;
        top: -80px;
        right: -80px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .login-showcase::after {
        content: "";
        position: absolute;
        bottom: -100px;
        left: -100px;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .login-showcase-content,
    .login-showcase-footer {
        position: relative;
        z-index: 1;
    }

    .login-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.16);
        border: 1px solid rgba(255,255,255,0.18);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 18px;
    }

    .login-showcase h1 {
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1.08;
        margin: 0 0 16px;
        font-weight: 800;
        letter-spacing: -0.8px;
        max-width: 560px;
    }

    .login-showcase p {
        margin: 0;
        max-width: 560px;
        color: rgba(255,255,255,0.92);
        font-size: 17px;
        line-height: 1.7;
    }

    .login-feature-list {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        max-width: 620px;
    }

    .login-feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.14);
        border: 1px solid rgba(255,255,255,0.14);
        backdrop-filter: blur(4px);
        font-size: 14px;
        font-weight: 600;
    }

    .login-feature-item span.icon {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background: rgba(255,255,255,0.18);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
    }

    .login-stat-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 28px;
    }

    .login-stat {
        background: rgba(255,255,255,0.14);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 20px;
        padding: 18px;
        backdrop-filter: blur(4px);
    }

    .login-stat strong {
        display: block;
        font-size: 26px;
        font-weight: 800;
        margin-bottom: 6px;
    }

    .login-stat span {
        font-size: 13px;
        color: rgba(255,255,255,0.9);
    }

    .login-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 28px;
        padding: 34px 30px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
        align-self: center;
    }

    .login-card-header {
        margin-bottom: 24px;
    }

    .login-card-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(229, 57, 53, 0.08);
        color: #E53935;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 14px;
    }

    .login-card h2 {
        margin: 0 0 10px;
        font-size: 30px;
        line-height: 1.2;
        color: #111827;
        font-weight: 800;
        letter-spacing: -0.4px;
    }

    .login-card-desc {
        margin: 0;
        color: #6B7280;
        font-size: 15px;
        line-height: 1.7;
    }

    .login-alert {
        padding: 14px 16px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        border: 1px solid transparent;
    }

    .login-alert.error {
        color: #B91C1C;
        background: #FEF2F2;
        border-color: #FECACA;
    }

    .login-alert.success {
        color: #166534;
        background: #F0FDF4;
        border-color: #BBF7D0;
    }

    .login-form {
        display: grid;
        gap: 18px;
    }

    .login-field {
        display: grid;
        gap: 8px;
    }

    .login-field label {
        font-size: 14px;
        font-weight: 700;
        color: #374151;
    }

    .login-input-wrap {
        position: relative;
    }

    .login-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        color: #9CA3AF;
        pointer-events: none;
    }

    .login-input {
        width: 100%;
        height: 52px;
        border: 1px solid #D1D5DB;
        border-radius: 16px;
        padding: 0 16px 0 44px;
        background: #FFFFFF;
        color: #111827;
        font-size: 15px;
        outline: none;
        transition: 0.25s ease;
    }

    .login-input:focus {
        border-color: #E53935;
        box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
    }

    .login-input::placeholder {
        color: #9CA3AF;
    }

    .login-submit {
        width: 100%;
        height: 54px;
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #E53935, #FF6B57);
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 14px 28px rgba(229, 57, 53, 0.24);
        transition: 0.25s ease;
        margin-top: 6px;
    }

    .login-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 34px rgba(229, 57, 53, 0.28);
    }

    .login-bottom {
        margin-top: 18px;
        text-align: center;
        font-size: 14px;
        color: #6B7280;
    }

    .login-bottom a {
        color: #E53935;
        font-weight: 700;
        text-decoration: none;
    }

    .login-bottom a:hover {
        text-decoration: underline;
    }

    @media (max-width: 1024px) {
        .login-grid {
            grid-template-columns: 1fr;
        }

        .login-showcase {
            min-height: auto;
            padding: 34px 26px;
        }

        .login-card {
            max-width: 620px;
            width: 100%;
            margin: 0 auto;
        }
    }

    @media (max-width: 640px) {
        .login-page {
            padding: 24px 0 50px;
        }

        .login-showcase {
            border-radius: 24px;
            padding: 26px 20px;
        }

        .login-feature-list,
        .login-stat-row {
            grid-template-columns: 1fr;
        }

        .login-card {
            padding: 24px 18px;
            border-radius: 24px;
        }

        .login-card h2 {
            font-size: 26px;
        }
    }
</style>

<div class="login-page">
    <div class="login-container">
        <div class="login-grid">
            <div class="login-showcase">
                <div class="login-showcase-content">
                    <div class="login-badge">🔐 Đăng nhập hệ thống</div>
                    <h1>Chào mừng bạn quay lại với Lotte Mart</h1>
                    <p>
                        Đăng nhập để tiếp tục mua sắm, quản lý đơn hàng, theo dõi giỏ hàng
                        và trải nghiệm hệ thống bán hàng hiện đại, trực quan và dễ sử dụng.
                    </p>

                    <div class="login-feature-list">
                        <div class="login-feature-item">
                            <span class="icon">🛍️</span>
                            <span>Truy cập nhanh vào tài khoản của bạn</span>
                        </div>
                        <div class="login-feature-item">
                            <span class="icon">📦</span>
                            <span>Theo dõi đơn hàng và lịch sử mua sắm</span>
                        </div>
                        <div class="login-feature-item">
                            <span class="icon">💬</span>
                            <span>Chat hỗ trợ với nhân viên khi cần</span>
                        </div>
                        <div class="login-feature-item">
                            <span class="icon">⚡</span>
                            <span>Thao tác nhanh, giao diện dễ sử dụng</span>
                        </div>
                    </div>
                </div>

                <div class="login-showcase-footer">
                    <div class="login-stat-row">
                        <div class="login-stat">
                            <strong>12K+</strong>
                            <span>Đơn hàng đã xử lý</span>
                        </div>
                        <div class="login-stat">
                            <strong>3K+</strong>
                            <span>Sản phẩm đang quản lý</span>
                        </div>
                        <div class="login-stat">
                            <strong>24/7</strong>
                            <span>Hỗ trợ hoạt động</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="login-card">
                <div class="login-card-header">
                    <div class="login-card-badge">Đăng nhập tài khoản</div>
                    <h2>Đăng nhập vào hệ thống</h2>
                    <p class="login-card-desc">
                        Nhập email và mật khẩu để truy cập tài khoản của bạn.
                    </p>
                </div>

                <?php if (isset($_GET['error'])): ?>
                    <div class="login-alert error">
                        <?php echo htmlspecialchars($_GET['error']); ?>
                    </div>
                <?php endif; ?>

                <?php if (isset($_GET['success'])): ?>
                    <div class="login-alert success">
                        <?php echo htmlspecialchars($_GET['success']); ?>
                    </div>
                <?php endif; ?>

                <form action="/auth/login_process.php" method="POST" class="login-form">
                    <div class="login-field">
                        <label>Email</label>
                        <div class="login-input-wrap">
                            <span class="login-input-icon">✉️</span>
                            <input
                                type="email"
                                name="email"
                                required
                                class="login-input"
                                placeholder="Nhập email của bạn"
                            >
                        </div>
                    </div>

                    <div class="login-field">
                        <label>Mật khẩu</label>
                        <div class="login-input-wrap">
                            <span class="login-input-icon">🔒</span>
                            <input
                                type="password"
                                name="password"
                                required
                                class="login-input"
                                placeholder="Nhập mật khẩu"
                            >
                        </div>
                    </div>

                    <button type="submit" class="login-submit">
                        Đăng nhập
                    </button>
                </form>

                <div class="login-bottom">
                    Chưa có tài khoản?
                    <a href="/auth/register.php">Đăng ký</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>