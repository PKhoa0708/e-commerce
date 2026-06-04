<?php
require_once "../middleware/guest.php";
require_once "../includes/header.php";
?>

<style>
    .register-page {
        padding: 40px 0 70px;
        background: linear-gradient(180deg, #F6F8FC 0%, #FFF7F7 100%);
        min-height: calc(100vh - 120px);
    }

    .register-container {
        max-width: 1180px;
        margin: 0 auto;
        padding: 0 16px;
    }

    .register-grid {
        display: grid;
        grid-template-columns: 1fr 520px;
        gap: 28px;
        align-items: stretch;
    }

    .register-showcase {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 40px;
        min-height: 680px;
        background:
            linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.88)),
            url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .register-showcase::before {
        content: "";
        position: absolute;
        top: -80px;
        right: -80px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: rgba(255,255,255,0.10);
    }

    .register-showcase::after {
        content: "";
        position: absolute;
        bottom: -100px;
        left: -100px;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
    }

    .register-showcase-content,
    .register-showcase-footer {
        position: relative;
        z-index: 1;
    }

    .register-badge {
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

    .register-showcase h1 {
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1.08;
        margin: 0 0 16px;
        font-weight: 800;
        letter-spacing: -0.8px;
        max-width: 560px;
    }

    .register-showcase p {
        margin: 0;
        max-width: 560px;
        color: rgba(255,255,255,0.92);
        font-size: 17px;
        line-height: 1.7;
    }

    .register-feature-list {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        max-width: 620px;
    }

    .register-feature-item {
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

    .register-feature-item span.icon {
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

    .register-stat-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 28px;
    }

    .register-stat {
        background: rgba(255,255,255,0.14);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 20px;
        padding: 18px;
        backdrop-filter: blur(4px);
    }

    .register-stat strong {
        display: block;
        font-size: 26px;
        font-weight: 800;
        margin-bottom: 6px;
    }

    .register-stat span {
        font-size: 13px;
        color: rgba(255,255,255,0.9);
    }

    .register-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 28px;
        padding: 34px 30px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
        align-self: center;
    }

    .register-card-header {
        margin-bottom: 24px;
    }

    .register-card-badge {
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

    .register-card h2 {
        margin: 0 0 10px;
        font-size: 30px;
        line-height: 1.2;
        color: #111827;
        font-weight: 800;
        letter-spacing: -0.4px;
    }

    .register-card-desc {
        margin: 0;
        color: #6B7280;
        font-size: 15px;
        line-height: 1.7;
    }

    .register-alert {
        padding: 14px 16px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        border: 1px solid transparent;
    }

    .register-alert.error {
        color: #B91C1C;
        background: #FEF2F2;
        border-color: #FECACA;
    }

    .register-alert.success {
        color: #166534;
        background: #F0FDF4;
        border-color: #BBF7D0;
    }

    .register-form {
        display: grid;
        gap: 18px;
    }

    .register-field {
        display: grid;
        gap: 8px;
    }

    .register-field label {
        font-size: 14px;
        font-weight: 700;
        color: #374151;
    }

    .register-input-wrap {
        position: relative;
    }

    .register-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        color: #9CA3AF;
        pointer-events: none;
    }

    .register-input {
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

    .register-input:focus {
        border-color: #E53935;
        box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
    }

    .register-input::placeholder {
        color: #9CA3AF;
    }

    .register-helper {
        font-size: 12px;
        color: #6B7280;
        margin-top: 2px;
        line-height: 1.5;
    }

    .register-submit {
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

    .register-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 34px rgba(229, 57, 53, 0.28);
    }

    .register-bottom {
        margin-top: 18px;
        text-align: center;
        font-size: 14px;
        color: #6B7280;
    }

    .register-bottom a {
        color: #E53935;
        font-weight: 700;
        text-decoration: none;
    }

    .register-bottom a:hover {
        text-decoration: underline;
    }

    @media (max-width: 1024px) {
        .register-grid {
            grid-template-columns: 1fr;
        }

        .register-showcase {
            min-height: auto;
            padding: 34px 26px;
        }

        .register-card {
            max-width: 620px;
            width: 100%;
            margin: 0 auto;
        }
    }

    @media (max-width: 640px) {
        .register-page {
            padding: 24px 0 50px;
        }

        .register-showcase {
            border-radius: 24px;
            padding: 26px 20px;
        }

        .register-feature-list,
        .register-stat-row {
            grid-template-columns: 1fr;
        }

        .register-card {
            padding: 24px 18px;
            border-radius: 24px;
        }

        .register-card h2 {
            font-size: 26px;
        }
    }
</style>

<div class="register-page">
    <div class="register-container">
        <div class="register-grid">
            <div class="register-showcase">
                <div class="register-showcase-content">
                    <div class="register-badge">✨ Nền tảng quản lý bán hàng hiện đại</div>
                    <h1>Tạo tài khoản để bắt đầu với hệ thống Lotte Mart</h1>
                    <p>
                        Đăng ký tài khoản khách hàng để mua sắm nhanh hơn, quản lý đơn hàng dễ hơn,
                        theo dõi giỏ hàng thuận tiện và trải nghiệm hệ thống bán hàng hiện đại, trực quan.
                    </p>

                    <div class="register-feature-list">
                        <div class="register-feature-item">
                            <span class="icon">🛒</span>
                            <span>Mua sắm và đặt hàng nhanh chóng</span>
                        </div>
                        <div class="register-feature-item">
                            <span class="icon">📦</span>
                            <span>Theo dõi đơn hàng dễ dàng</span>
                        </div>
                        <div class="register-feature-item">
                            <span class="icon">💬</span>
                            <span>Hỗ trợ chat cùng nhân viên</span>
                        </div>
                        <div class="register-feature-item">
                            <span class="icon">⭐</span>
                            <span>Lưu sản phẩm và đánh giá tiện lợi</span>
                        </div>
                    </div>
                </div>

                <div class="register-showcase-footer">
                    <div class="register-stat-row">
                        <div class="register-stat">
                            <strong>12K+</strong>
                            <span>Đơn hàng đã xử lý</span>
                        </div>
                        <div class="register-stat">
                            <strong>3K+</strong>
                            <span>Sản phẩm đang quản lý</span>
                        </div>
                        <div class="register-stat">
                            <strong>24/7</strong>
                            <span>Hỗ trợ hoạt động</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="register-card">
                <div class="register-card-header">
                    <div class="register-card-badge">Đăng ký tài khoản</div>
                    <h2>Chào mừng bạn đến với Lotte Mart</h2>
                    <p class="register-card-desc">
                        Điền đầy đủ thông tin bên dưới để tạo tài khoản mới.
                    </p>
                </div>

                <?php if (isset($_GET['error'])): ?>
                    <div class="register-alert error">
                        <?php echo htmlspecialchars($_GET['error']); ?>
                    </div>
                <?php endif; ?>

                <?php if (isset($_GET['success'])): ?>
                    <div class="register-alert success">
                        <?php echo htmlspecialchars($_GET['success']); ?>
                    </div>
                <?php endif; ?>

                <form action="/auth/register_process.php" method="POST" class="register-form">
                    <div class="register-field">
                        <label>Họ và tên</label>
                        <div class="register-input-wrap">
                            <span class="register-input-icon">👤</span>
                            <input
                                type="text"
                                name="full_name"
                                required
                                class="register-input"
                                placeholder="Nhập họ và tên của bạn"
                            >
                        </div>
                    </div>

                    <div class="register-field">
                        <label>Email</label>
                        <div class="register-input-wrap">
                            <span class="register-input-icon">✉️</span>
                            <input
                                type="email"
                                name="email"
                                required
                                pattern="^[A-Za-z0-9._%+-]+@gmail\.com$"
            
                                placeholder="example@gmail.com"
                                class="register-input"
                            >
                        </div>
            
                    </div>

                    <div class="register-field">
                        <label>Số điện thoại</label>
                        <div class="register-input-wrap">
                            <span class="register-input-icon">📞</span>
                            <input
                                type="text"
                                name="phone"
                                required
                                pattern="^0[0-9]{9}$"
                                maxlength="10"
                                placeholder="0912345678"
                                class="register-input"
                            >
                        </div>
                        
                    </div>

                    <div class="register-field">
                        <label>Mật khẩu</label>
                        <div class="register-input-wrap">
                            <span class="register-input-icon">🔒</span>
                            <input
                                type="password"
                                name="password"
                                required
                                minlength="6"
                                placeholder="Nhập mật khẩu"
                                class="register-input"
                            >
                        </div>
                    </div>

                    <div class="register-field">
                        <label>Nhập lại mật khẩu</label>
                        <div class="register-input-wrap">
                            <span class="register-input-icon">🔐</span>
                            <input
                                type="password"
                                name="confirm_password"
                                required
                                minlength="6"
                                placeholder="Nhập lại mật khẩu"
                                class="register-input"
                            >
                        </div>
                    </div>

                    <button type="submit" class="register-submit">
                        Đăng ký tài khoản
                    </button>
                </form>

                <div class="register-bottom">
                    Đã có tài khoản?
                    <a href="/auth/login.php">Đăng nhập</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once "../includes/footer.php"; ?>