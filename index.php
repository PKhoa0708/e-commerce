<?php
require_once "includes/header.php";

$siteName = "Lotte Sales System";

$introCards = [
    [
        "icon" => "fa-box-open",
        "title" => "Quản lý sản phẩm",
        "desc" => "Thêm, sửa, phân loại và tìm kiếm sản phẩm nhanh chóng, chính xác."
    ],
    [
        "icon" => "fa-warehouse",
        "title" => "Quản lý kho",
        "desc" => "Kiểm soát tồn kho, nhập hàng, xuất hàng và cảnh báo số lượng thấp."
    ],
    [
        "icon" => "fa-receipt",
        "title" => "Đơn hàng",
        "desc" => "Theo dõi hóa đơn, đơn bán, trạng thái xử lý và lịch sử giao dịch."
    ],
    [
        "icon" => "fa-chart-line",
        "title" => "Báo cáo doanh thu",
        "desc" => "Xem thống kê trực quan về doanh thu, hiệu suất và tình hình kinh doanh."
    ]
];

$features = [
    [
        "icon" => "fa-barcode",
        "title" => "Quản lý sản phẩm",
        "desc" => "Quản lý danh sách sản phẩm, giá bán, tồn kho và danh mục."
    ],
    [
        "icon" => "fa-cart-shopping",
        "title" => "Quản lý đơn hàng",
        "desc" => "Xử lý đơn bán hàng nhanh, rõ ràng và giảm sai sót trong vận hành."
    ],
    [
        "icon" => "fa-users",
        "title" => "Quản lý khách hàng",
        "desc" => "Lưu thông tin khách hàng, lịch sử mua hàng và chăm sóc tốt hơn."
    ],
    [
        "icon" => "fa-user-tie",
        "title" => "Quản lý nhân viên",
        "desc" => "Theo dõi vai trò, quyền hạn và hiệu suất làm việc của nhân viên."
    ],
    [
        "icon" => "fa-file-invoice-dollar",
        "title" => "Báo cáo doanh thu",
        "desc" => "Phân tích số liệu bán hàng bằng biểu đồ và thống kê trực quan."
    ],
    [
        "icon" => "fa-triangle-exclamation",
        "title" => "Cảnh báo tồn kho",
        "desc" => "Nhận cảnh báo khi sản phẩm sắp hết hàng để xử lý kịp thời."
    ]
];

$modules = [
    ["icon" => "fa-box", "title" => "Sản phẩm", "desc" => "Quản lý danh sách hàng hóa."],
    ["icon" => "fa-layer-group", "title" => "Danh mục", "desc" => "Phân loại sản phẩm khoa học."],
    ["icon" => "fa-warehouse", "title" => "Kho hàng", "desc" => "Nhập, xuất và kiểm soát tồn kho."],
    ["icon" => "fa-bag-shopping", "title" => "Đơn hàng", "desc" => "Theo dõi hóa đơn bán hàng."],
    ["icon" => "fa-users", "title" => "Khách hàng", "desc" => "Lưu lịch sử và thông tin khách."],
    ["icon" => "fa-user-group", "title" => "Nhân viên", "desc" => "Quản lý tài khoản và phân quyền."],
    ["icon" => "fa-truck", "title" => "Nhà cung cấp", "desc" => "Quản lý nguồn nhập hàng ổn định."],
    ["icon" => "fa-chart-pie", "title" => "Báo cáo", "desc" => "Tổng hợp doanh thu và hiệu quả."]
];

$stats = [
    ["number" => "12,000+", "label" => "Đơn hàng đã xử lý", "icon" => "fa-cart-flatbed"],
    ["number" => "3,000+", "label" => "Sản phẩm được quản lý", "icon" => "fa-boxes-stacked"],
    ["number" => "98%", "label" => "Hiệu suất vận hành", "icon" => "fa-gauge-high"],
    ["number" => "24/7", "label" => "Hỗ trợ hoạt động", "icon" => "fa-headset"]
];

$benefits = [
    "Tiết kiệm thời gian trong quản lý bán hàng hằng ngày.",
    "Giảm sai sót khi xử lý đơn hàng và kiểm kho.",
    "Giao diện dễ dùng cho cả quản trị viên và nhân viên.",
    "Theo dõi doanh thu, hiệu quả kinh doanh một cách trực quan.",
    "Dễ mở rộng thêm chức năng trong quá trình phát triển hệ thống."
];

$testimonials = [
    [
        "name" => "Nguyễn Văn Minh",
        "role" => "Quản lý cửa hàng",
        "text" => "Giao diện rõ ràng, dễ dùng và rất phù hợp để quản lý bán hàng trong môi trường siêu thị."
    ],
    [
        "name" => "Trần Thị Lan",
        "role" => "Nhân viên thu ngân",
        "text" => "Hệ thống giúp thao tác nhanh hơn, giảm nhầm lẫn khi xử lý hóa đơn và sản phẩm."
    ],
    [
        "name" => "Phạm Quốc Huy",
        "role" => "Nhân viên kho",
        "text" => "Việc theo dõi nhập xuất tồn kho dễ hơn nhiều, đặc biệt là phần cảnh báo số lượng thấp."
    ]
];

$isLoggedIn = isset($_SESSION['user_id']);
$userRole = $_SESSION['role'] ?? null;
$userName = $_SESSION['full_name'] ?? $_SESSION['username'] ?? 'Người dùng';

$dashboardLink = '#';
if ($isLoggedIn) {
    if ($userRole === 'admin') {
        $dashboardLink = 'admin/dashboard.php';
    } elseif ($userRole === 'staff') {
        $dashboardLink = 'staff/dashboard.php';
    } else {
        $dashboardLink = 'customer/dashboard.php';
    }
}
?>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

<style>
    :root{
        --primary:#E53935;
        --secondary:#FFB300;
        --accent:#1565C0;
        --bg:#F6F8FC;
        --card:#FFFFFF;
        --text:#1F2937;
        --muted:#6B7280;
        --border:#E5E7EB;
        --shadow:0 10px 30px rgba(15, 23, 42, 0.07);
        --shadow-hover:0 18px 40px rgba(15, 23, 42, 0.10);
        --radius:20px;
        --container:1200px;
    }

    *{
        box-sizing:border-box;
    }

    body{
        font-family:"Inter", sans-serif;
        background:var(--bg);
        color:var(--text);
    }

    .lotte-home *{
        margin:0;
        padding:0;
    }

    .lotte-home a{
        text-decoration:none;
        color:inherit;
    }

    .lotte-home .container{
        width:min(var(--container), calc(100% - 32px));
        margin:0 auto;
    }

    .lotte-home .section{
        padding:80px 0;
    }

    .lotte-home .section-header{
        text-align:center;
        margin-bottom:48px;
    }

    .lotte-home .section-badge{
        display:inline-block;
        padding:8px 14px;
        border-radius:999px;
        background:rgba(229,57,53,.08);
        color:var(--primary);
        font-size:13px;
        font-weight:700;
        margin-bottom:14px;
    }

    .lotte-home .section-title{
        font-size:clamp(28px, 4vw, 40px);
        line-height:1.2;
        font-weight:800;
        margin-bottom:12px;
    }

    .lotte-home .section-desc{
        max-width:700px;
        margin:0 auto;
        color:var(--muted);
        font-size:16px;
    }

    .lotte-home .hero{
        padding:56px 0 88px;
        position:relative;
        overflow:hidden;
    }

    .lotte-home .hero::before{
        content:"";
        position:absolute;
        inset:-120px auto auto -120px;
        width:320px;
        height:320px;
        background:radial-gradient(circle, rgba(229,57,53,.18), transparent 70%);
        z-index:0;
    }

    .lotte-home .hero::after{
        content:"";
        position:absolute;
        right:-120px;
        bottom:-140px;
        width:420px;
        height:420px;
        background:radial-gradient(circle, rgba(255,179,0,.16), transparent 70%);
        z-index:0;
    }

    .lotte-home .hero-grid{
        display:grid;
        grid-template-columns:1.05fr .95fr;
        align-items:center;
        gap:42px;
        position:relative;
        z-index:1;
    }

    .lotte-home .hero-content h1{
        font-size:clamp(36px, 5vw, 58px);
        line-height:1.08;
        font-weight:800;
        letter-spacing:-1px;
        margin-bottom:20px;
    }

    .lotte-home .hero-content p{
        color:var(--muted);
        font-size:18px;
        max-width:610px;
        margin-bottom:28px;
    }

    .lotte-home .hero-actions{
        display:flex;
        flex-wrap:wrap;
        gap:14px;
        margin-bottom:30px;
    }

    .lotte-home .hero-points{
        display:grid;
        grid-template-columns:repeat(2, minmax(0,1fr));
        gap:14px;
        max-width:560px;
    }

    .lotte-home .hero-point{
        display:flex;
        align-items:center;
        gap:12px;
        background:rgba(255,255,255,.8);
        border:1px solid rgba(229,231,235,.7);
        border-radius:16px;
        padding:14px 16px;
    }

    .lotte-home .hero-point i{
        color:var(--primary);
    }

    .lotte-home .btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:10px;
        padding:13px 22px;
        border-radius:14px;
        font-weight:700;
        border:1px solid transparent;
        transition:.28s ease;
        cursor:pointer;
        white-space:nowrap;
    }

    .lotte-home .btn-primary{
        background:var(--primary);
        color:#fff;
        box-shadow:0 10px 22px rgba(229,57,53,.22);
    }

    .lotte-home .btn-primary:hover{
        transform:translateY(-2px);
        box-shadow:0 16px 30px rgba(229,57,53,.28);
    }

    .lotte-home .btn-outline{
        border-color:var(--border);
        background:#fff;
        color:var(--text);
    }

    .lotte-home .btn-outline:hover{
        border-color:var(--primary);
        color:var(--primary);
    }

    .lotte-home .btn-soft{
        background:rgba(21,101,192,.08);
        color:var(--accent);
    }

    .lotte-home .btn-soft:hover{
        background:rgba(21,101,192,.14);
    }

    .lotte-home .hero-visual{
        position:relative;
    }

    .lotte-home .dashboard-mockup{
        background:linear-gradient(180deg, #ffffff, #fdfdfd);
        border:1px solid rgba(229,231,235,.9);
        border-radius:28px;
        box-shadow:0 25px 60px rgba(15,23,42,.12);
        overflow:hidden;
    }

    .lotte-home .mock-top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:18px 20px;
        border-bottom:1px solid var(--border);
        background:#fff;
    }

    .lotte-home .mock-dots{
        display:flex;
        gap:8px;
    }

    .lotte-home .mock-dots span{
        width:10px;
        height:10px;
        border-radius:50%;
        display:block;
        background:#d1d5db;
    }

    .lotte-home .mock-dots span:first-child{ background:#ef4444; }
    .lotte-home .mock-dots span:nth-child(2){ background:#f59e0b; }
    .lotte-home .mock-dots span:nth-child(3){ background:#10b981; }

    .lotte-home .mock-body{
        display:grid;
        grid-template-columns:220px 1fr;
        min-height:460px;
    }

    .lotte-home .mock-sidebar{
        background:#162031;
        color:#dbeafe;
        padding:24px 18px;
    }

    .lotte-home .mock-sidebar .brand{
        font-weight:800;
        font-size:18px;
        color:#fff;
        margin-bottom:26px;
    }

    .lotte-home .mock-side-item{
        display:flex;
        align-items:center;
        gap:12px;
        padding:12px 14px;
        border-radius:14px;
        color:#d1d5db;
        margin-bottom:10px;
    }

    .lotte-home .mock-side-item.active{
        background:rgba(43,127,255,.18);
        color:#fff;
    }

    .lotte-home .mock-main{
        background:#f8fafc;
        padding:24px;
    }

    .lotte-home .mock-stats{
        display:grid;
        grid-template-columns:repeat(3, 1fr);
        gap:14px;
        margin-bottom:16px;
    }

    .lotte-home .mock-stat{
        background:#fff;
        border-radius:18px;
        padding:16px;
        border:1px solid #edf2f7;
        box-shadow:0 8px 18px rgba(15,23,42,.05);
    }

    .lotte-home .mock-stat .small{
        color:var(--muted);
        font-size:13px;
        margin-bottom:8px;
    }

    .lotte-home .mock-stat .big{
        font-weight:800;
        font-size:24px;
    }

    .lotte-home .mock-panels{
        display:grid;
        grid-template-columns:1.2fr .8fr;
        gap:14px;
    }

    .lotte-home .mock-panel{
        background:#fff;
        border-radius:18px;
        padding:16px;
        border:1px solid #edf2f7;
        min-height:190px;
    }

    .lotte-home .chart-bars{
        display:flex;
        align-items:flex-end;
        gap:14px;
        height:120px;
        margin-top:14px;
    }

    .lotte-home .chart-bars span{
        display:block;
        width:28px;
        border-radius:12px 12px 6px 6px;
        background:linear-gradient(180deg, #ff8a65, var(--primary));
    }

    .lotte-home .mini-list{
        display:flex;
        flex-direction:column;
        gap:12px;
        margin-top:12px;
    }

    .lotte-home .mini-item{
        display:flex;
        justify-content:space-between;
        align-items:center;
        background:#f8fafc;
        padding:12px;
        border-radius:12px;
    }

    .lotte-home .floating-card{
        position:absolute;
        background:#fff;
        border:1px solid rgba(229,231,235,.8);
        border-radius:18px;
        box-shadow:var(--shadow);
        padding:14px 16px;
        min-width:180px;
    }

    .lotte-home .floating-card .label{
        color:var(--muted);
        font-size:13px;
        margin-bottom:6px;
    }

    .lotte-home .floating-card .value{
        font-weight:800;
        font-size:24px;
    }

    .lotte-home .floating-card.one{
        left:-18px;
        bottom:48px;
    }

    .lotte-home .floating-card.two{
        right:-12px;
        top:70px;
    }

    .lotte-home .grid-4{
        display:grid;
        grid-template-columns:repeat(4, 1fr);
        gap:24px;
    }

    .lotte-home .grid-3{
        display:grid;
        grid-template-columns:repeat(3, 1fr);
        gap:24px;
    }

    .lotte-home .grid-auto{
        display:grid;
        grid-template-columns:repeat(4, 1fr);
        gap:24px;
    }

    .lotte-home .card{
        background:var(--card);
        border:1px solid #eef1f5;
        border-radius:var(--radius);
        padding:24px;
        box-shadow:var(--shadow);
        transition:.28s ease;
    }

    .lotte-home .card:hover{
        transform:translateY(-4px);
        box-shadow:var(--shadow-hover);
    }

    .lotte-home .icon-box{
        width:56px;
        height:56px;
        border-radius:16px;
        display:grid;
        place-items:center;
        font-size:22px;
        margin-bottom:18px;
        background:linear-gradient(135deg, rgba(229,57,53,.14), rgba(255,179,0,.18));
        color:var(--primary);
    }

    .lotte-home .card h3{
        font-size:20px;
        margin-bottom:10px;
    }

    .lotte-home .card p{
        color:var(--muted);
        font-size:15px;
    }

    .lotte-home .feature-link{
        display:inline-flex;
        align-items:center;
        gap:8px;
        margin-top:16px;
        color:var(--primary);
        font-weight:700;
        font-size:14px;
    }

    .lotte-home .module-card{
        text-align:center;
        padding:26px 20px;
    }

    .lotte-home .module-card .icon-box{
        margin:0 auto 16px;
    }

    .lotte-home .stats-icon{
        width:54px;
        height:54px;
        border-radius:16px;
        display:grid;
        place-items:center;
        color:#fff;
        background:linear-gradient(135deg, var(--accent), #4f8df2);
        margin-bottom:16px;
        font-size:22px;
    }

    .lotte-home .stats-number{
        font-size:34px;
        font-weight:800;
        line-height:1.1;
        margin-bottom:6px;
    }

    .lotte-home .stats-label{
        color:var(--muted);
    }

    .lotte-home .benefits-box{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:28px;
        align-items:center;
    }

    .lotte-home .benefit-visual{
        position:relative;
        min-height:440px;
        border-radius:28px;
        overflow:hidden;
        background:
            linear-gradient(140deg, rgba(229,57,53,.90), rgba(255,179,0,.85)),
            url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
        box-shadow:var(--shadow-hover);
    }

    .lotte-home .benefit-overlay{
        position:absolute;
        inset:auto 22px 22px 22px;
        background:rgba(255,255,255,.94);
        border-radius:22px;
        padding:22px;
        box-shadow:var(--shadow);
    }

    .lotte-home .benefit-overlay h3{
        font-size:24px;
        margin-bottom:8px;
    }

    .lotte-home .benefit-list{
        display:flex;
        flex-direction:column;
        gap:18px;
    }

    .lotte-home .benefit-item{
        display:flex;
        gap:14px;
        align-items:flex-start;
        background:#fff;
        border:1px solid #eef1f5;
        border-radius:18px;
        padding:18px;
        box-shadow:var(--shadow);
    }

    .lotte-home .benefit-item i{
        margin-top:3px;
        color:var(--secondary);
        font-size:18px;
    }

    .lotte-home .testimonials{
        display:grid;
        grid-template-columns:repeat(3, 1fr);
        gap:24px;
    }

    .lotte-home .testimonial-top{
        display:flex;
        align-items:center;
        gap:14px;
        margin-bottom:14px;
    }

    .lotte-home .avatar{
        width:56px;
        height:56px;
        border-radius:50%;
        display:grid;
        place-items:center;
        background:linear-gradient(135deg, var(--primary), #ff8a65);
        color:#fff;
        font-weight:800;
        font-size:20px;
    }

    .lotte-home .testimonial-role{
        color:var(--muted);
        font-size:14px;
    }

    .lotte-home .stars{
        color:#f59e0b;
        margin-top:16px;
        display:flex;
        gap:4px;
    }

    .lotte-home .cta-box{
        background:linear-gradient(135deg, #fff1f1, #fff8eb);
        border:1px solid #fde3df;
        border-radius:32px;
        box-shadow:var(--shadow);
        padding:56px 32px;
        text-align:center;
    }

    .lotte-home .cta-box h2{
        font-size:clamp(28px, 4vw, 42px);
        margin-bottom:12px;
    }

    .lotte-home .cta-box p{
        max-width:740px;
        margin:0 auto 24px;
        color:var(--muted);
    }

    .lotte-home .cta-actions{
        display:flex;
        justify-content:center;
        flex-wrap:wrap;
        gap:14px;
    }

    .lotte-home .role-box{
        display:inline-flex;
        align-items:center;
        gap:10px;
        padding:10px 16px;
        border-radius:999px;
        background:#fff;
        border:1px solid var(--border);
        color:var(--muted);
        margin-bottom:18px;
        box-shadow:var(--shadow);
        font-weight:600;
    }

    .lotte-home .reveal{
        opacity:0;
        transform:translateY(22px);
        transition:all .7s ease;
    }

    .lotte-home .reveal.active{
        opacity:1;
        transform:translateY(0);
    }

    @media (max-width: 1100px){
        .lotte-home .hero-grid,
        .lotte-home .benefits-box,
        .lotte-home .grid-4,
        .lotte-home .grid-auto,
        .lotte-home .testimonials,
        .lotte-home .grid-3{
            grid-template-columns:repeat(2, 1fr);
        }

        .lotte-home .hero-grid,
        .lotte-home .benefits-box{
            grid-template-columns:1fr;
        }

        .lotte-home .hero-visual{
            order:-1;
        }
    }

    @media (max-width: 768px){
        .lotte-home .mock-body,
        .lotte-home .mock-stats,
        .lotte-home .mock-panels,
        .lotte-home .hero-points,
        .lotte-home .grid-4,
        .lotte-home .grid-3,
        .lotte-home .grid-auto,
        .lotte-home .testimonials{
            grid-template-columns:1fr;
        }

        .lotte-home .mock-sidebar{
            display:none;
        }

        .lotte-home .floating-card{
            position:static;
            margin-top:14px;
        }

        .lotte-home .section{
            padding:60px 0;
        }
    }
</style>

<div class="lotte-home">
    <main>
        <section class="hero" id="home">
            <div class="container">
                <div class="hero-grid">
                    <div class="hero-content reveal">
                        <span class="section-badge">Nền tảng quản lý bán hàng hiện đại</span>

                        <?php if($isLoggedIn): ?>
                            <div class="role-box">
                                <i class="fa-solid fa-user"></i>
                                Xin chào, <?php echo htmlspecialchars($userName); ?> -
                                Vai trò: <strong><?php echo htmlspecialchars($userRole); ?></strong>
                            </div>
                        <?php endif; ?>

                        <h1>Lotte Sales System</h1>
                        <p>
                            Quản lý sản phẩm, kho hàng, đơn hàng, khách hàng và doanh thu trên một nền tảng hiện đại,
                            trực quan, dễ sử dụng và phù hợp cho môi trường siêu thị.
                        </p>

                        <div class="hero-actions">
                            <?php if($isLoggedIn): ?>
                                <a href="<?php echo $dashboardLink; ?>" class="btn btn-primary">
                                    <i class="fa-solid fa-gauge"></i> Vào trang quản lý
                                </a>

                                <?php if($userRole === 'customer'): ?>
                                    <a href="customer/products/index.php" class="btn btn-outline">
                                        <i class="fa-solid fa-bag-shopping"></i> Xem sản phẩm
                                    </a>
                                    <a href="customer/orders.php" class="btn btn-soft">
                                        <i class="fa-solid fa-box"></i> Đơn hàng của tôi
                                    </a>
                                <?php endif; ?>
                            <?php else: ?>
                                <a href="auth/login.php" class="btn btn-primary">
                                    <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập ngay
                                </a>
                                <a href="auth/register.php" class="btn btn-outline">
                                    <i class="fa-solid fa-user-plus"></i> Đăng ký tài khoản
                                </a>
                                <a href="#features" class="btn btn-soft">
                                    <i class="fa-solid fa-arrow-down"></i> Xem tính năng
                                </a>
                            <?php endif; ?>
                        </div>

                        <div class="hero-points">
                            <div class="hero-point">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>Quản lý tập trung trên một giao diện</span>
                            </div>
                            <div class="hero-point">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>Dễ sử dụng cho nhân viên và quản lý</span>
                            </div>
                            <div class="hero-point">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>Hỗ trợ theo dõi tồn kho chính xác</span>
                            </div>
                            <div class="hero-point">
                                <i class="fa-solid fa-circle-check"></i>
                                <span>Thống kê doanh thu trực quan</span>
                            </div>
                        </div>
                    </div>

                    <div class="hero-visual reveal">
                        <div class="dashboard-mockup">
                            <div class="mock-top">
                                <div class="mock-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <strong>Dashboard tổng quan</strong>
                            </div>

                            <div class="mock-body">
                                <aside class="mock-sidebar">
                                    <div class="brand">Lotte Admin</div>
                                    <div class="mock-side-item active"><i class="fa-solid fa-house"></i> Tổng quan</div>
                                    <div class="mock-side-item"><i class="fa-solid fa-box"></i> Sản phẩm</div>
                                    <div class="mock-side-item"><i class="fa-solid fa-warehouse"></i> Kho hàng</div>
                                    <div class="mock-side-item"><i class="fa-solid fa-bag-shopping"></i> Đơn hàng</div>
                                    <div class="mock-side-item"><i class="fa-solid fa-users"></i> Khách hàng</div>
                                    <div class="mock-side-item"><i class="fa-solid fa-chart-simple"></i> Báo cáo</div>
                                </aside>

                                <div class="mock-main">
                                    <div class="mock-stats">
                                        <div class="mock-stat">
                                            <div class="small">Doanh thu hôm nay</div>
                                            <div class="big">56.8M</div>
                                        </div>
                                        <div class="mock-stat">
                                            <div class="small">Đơn hàng</div>
                                            <div class="big">124</div>
                                        </div>
                                        <div class="mock-stat">
                                            <div class="small">Sản phẩm bán chạy</div>
                                            <div class="big">42</div>
                                        </div>
                                    </div>

                                    <div class="mock-panels">
                                        <div class="mock-panel">
                                            <strong>Biểu đồ doanh thu</strong>
                                            <div class="chart-bars">
                                                <span style="height:52px;"></span>
                                                <span style="height:88px;"></span>
                                                <span style="height:70px;"></span>
                                                <span style="height:112px;"></span>
                                                <span style="height:94px;"></span>
                                                <span style="height:120px;"></span>
                                            </div>
                                        </div>
                                        <div class="mock-panel">
                                            <strong>Đơn gần đây</strong>
                                            <div class="mini-list">
                                                <div class="mini-item"><span>#DH1025</span><strong>Đã thanh toán</strong></div>
                                                <div class="mini-item"><span>#DH1026</span><strong>Đang xử lý</strong></div>
                                                <div class="mini-item"><span>#DH1027</span><strong>Hoàn thành</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="floating-card one">
                            <div class="label">Tồn kho ổn định</div>
                            <div class="value">1,532</div>
                        </div>

                        <div class="floating-card two">
                            <div class="label">Đơn hàng hôm nay</div>
                            <div class="value">124+</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section" id="intro">
            <div class="container">
                <div class="section-header reveal">
                    <span class="section-badge">Giới thiệu nhanh</span>
                    <h2 class="section-title">Các chức năng cốt lõi của hệ thống</h2>
                    <p class="section-desc">
                        Giao diện được tổ chức rõ ràng, tập trung vào những nghiệp vụ quan trọng nhất trong quản lý bán hàng siêu thị.
                    </p>
                </div>

                <div class="grid-4">
                    <?php foreach ($introCards as $item): ?>
                        <div class="card reveal">
                            <div class="icon-box"><i class="fa-solid <?php echo $item['icon']; ?>"></i></div>
                            <h3><?php echo $item['title']; ?></h3>
                            <p><?php echo $item['desc']; ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="section" id="features">
            <div class="container">
                <div class="section-header reveal">
                    <span class="section-badge">Tính năng nổi bật</span>
                    <h2 class="section-title">Thiết kế hướng đến vận hành nhanh và chính xác</h2>
                    <p class="section-desc">
                        Hệ thống cung cấp các tính năng quan trọng giúp cửa hàng, siêu thị và người quản lý kiểm soát hoạt động hiệu quả hơn.
                    </p>
                </div>

                <div class="grid-3">
                    <?php foreach ($features as $feature): ?>
                        <div class="card reveal">
                            <div class="icon-box"><i class="fa-solid <?php echo $feature['icon']; ?>"></i></div>
                            <h3><?php echo $feature['title']; ?></h3>
                            <p><?php echo $feature['desc']; ?></p>
                            <a href="<?php echo $isLoggedIn ? $dashboardLink : 'auth/login.php'; ?>" class="feature-link">
                                Xem thêm <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="section" id="modules">
            <div class="container">
                <div class="section-header reveal">
                    <span class="section-badge">Các module hệ thống</span>
                    <h2 class="section-title">Bao quát đầy đủ quy trình quản lý bán hàng</h2>
                    <p class="section-desc">
                        Từ quản lý sản phẩm đến báo cáo kinh doanh, mọi module đều được thiết kế trực quan và dễ thao tác.
                    </p>
                </div>

                <div class="grid-auto">
                    <?php foreach ($modules as $module): ?>
                        <div class="card module-card reveal">
                            <div class="icon-box"><i class="fa-solid <?php echo $module['icon']; ?>"></i></div>
                            <h3><?php echo $module['title']; ?></h3>
                            <p><?php echo $module['desc']; ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="section" id="stats">
            <div class="container">
                <div class="section-header reveal">
                    <span class="section-badge">Thống kê mô phỏng</span>
                    <h2 class="section-title">Số liệu trực quan, tạo cảm giác chuyên nghiệp</h2>
                    <p class="section-desc">
                        Đây là phần hiển thị dữ liệu minh họa giúp người dùng hình dung rõ hơn về khả năng quản lý của hệ thống.
                    </p>
                </div>

                <div class="grid-4">
                    <?php foreach ($stats as $stat): ?>
                        <div class="card reveal">
                            <div class="stats-icon"><i class="fa-solid <?php echo $stat['icon']; ?>"></i></div>
                            <div class="stats-number"><?php echo $stat['number']; ?></div>
                            <div class="stats-label"><?php echo $stat['label']; ?></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="section" id="benefits">
            <div class="container">
                <div class="benefits-box">
                    <div class="benefit-visual reveal">
                        <div class="benefit-overlay">
                            <h3>Giải pháp phù hợp cho môi trường siêu thị</h3>
                            <p style="color: var(--muted);">
                                Thiết kế trực quan, dễ sử dụng và hỗ trợ tốt cho công việc bán hàng, kiểm kho và theo dõi hiệu quả kinh doanh.
                            </p>
                        </div>
                    </div>

                    <div class="reveal">
                        <span class="section-badge">Lợi ích sử dụng</span>
                        <h2 class="section-title" style="text-align:left; margin-bottom:18px;">
                            Tối ưu quy trình quản lý bán hàng một cách rõ ràng
                        </h2>
                        <p class="section-desc" style="text-align:left; margin:0 0 26px; max-width:100%;">
                            Giao diện landing page này không chỉ đẹp mà còn dễ triển khai thành hệ thống thật bằng PHP, HTML, CSS và JavaScript.
                        </p>

                        <div class="benefit-list">
                            <?php foreach ($benefits as $benefit): ?>
                                <div class="benefit-item">
                                    <i class="fa-solid fa-circle-check"></i>
                                    <div><?php echo $benefit; ?></div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section" id="testimonials">
            <div class="container">
                <div class="section-header reveal">
                    <span class="section-badge">Đánh giá người dùng</span>
                    <h2 class="section-title">Phản hồi tích cực từ người dùng mô phỏng</h2>
                    <p class="section-desc">
                        Một vài nhận xét minh họa để tăng cảm giác tin cậy và chuyên nghiệp cho giao diện trang chủ.
                    </p>
                </div>

                <div class="testimonials">
                    <?php foreach ($testimonials as $person): ?>
                        <div class="card reveal">
                            <div class="testimonial-top">
                                <div class="avatar"><?php echo mb_substr($person['name'], 0, 1, 'UTF-8'); ?></div>
                                <div>
                                    <h3 style="font-size:18px; margin-bottom:4px;"><?php echo $person['name']; ?></h3>
                                    <div class="testimonial-role"><?php echo $person['role']; ?></div>
                                </div>
                            </div>

                            <p><?php echo $person['text']; ?></p>

                            <div class="stars">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="section" id="cta">
            <div class="container">
                <div class="cta-box reveal">
                    <h2><?php echo $isLoggedIn ? 'Sẵn sàng tiếp tục làm việc?' : 'Sẵn sàng sử dụng hệ thống quản lý bán hàng?'; ?></h2>
                    <p>
                        <?php if($isLoggedIn): ?>
                            Truy cập nhanh khu vực làm việc của bạn để quản lý bán hàng, sản phẩm, đơn hàng và theo dõi hoạt động hệ thống.
                        <?php else: ?>
                            Đăng nhập hoặc tạo tài khoản để bắt đầu trải nghiệm nền tảng quản lý bán hàng hiện đại, trực quan và dễ mở rộng cho siêu thị Lotte.
                        <?php endif; ?>
                    </p>
                    <div class="cta-actions">
                        <?php if($isLoggedIn): ?>
                            <a href="<?php echo $dashboardLink; ?>" class="btn btn-primary">
                                <i class="fa-solid fa-gauge"></i> Vào dashboard
                            </a>
                        <?php else: ?>
                            <a href="auth/login.php" class="btn btn-primary">
                                <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập
                            </a>
                            <a href="auth/register.php" class="btn btn-outline">
                                <i class="fa-solid fa-user-plus"></i> Đăng ký
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </section>
    </main>
</div>

<script>
    const reveals = document.querySelectorAll('.lotte-home .reveal');

    const revealOnScroll = () => {
        reveals.forEach(item => {
            const top = item.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (top < windowHeight - 80) {
                item.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);
</script>

<?php require_once "includes/footer.php"; ?>