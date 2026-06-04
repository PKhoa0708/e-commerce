<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

$user_id = (int)$_SESSION['user_id'];

$status_filter = isset($_GET['status']) ? trim($_GET['status']) : '';
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

$filter = ['user_id' => $user_id];

if ($status_filter !== '') {
    $filter['order_status'] = $status_filter;
}

if ($keyword !== '') {
    $filter['$or'] = [
        ['order_code' => new MongoDB\BSON\Regex($keyword, 'i')],
        ['receiver_name' => new MongoDB\BSON\Regex($keyword, 'i')],
        ['receiver_phone' => new MongoDB\BSON\Regex($keyword, 'i')]
    ];
}

$orders = $db->orders->find($filter, ['sort' => ['id' => -1]])->toArray();

function format_money($amount) {
    return number_format((float)$amount, 0, ',', '.') . ' đ';
}

function get_status_color($status) {
    switch ($status) {
        case 'Chờ xác nhận':
            return '#fff3cd';
        case 'Đã xác nhận':
        case 'Đang chuẩn bị':
            return '#d1ecf1';
        case 'Đang giao':
            return '#cce5ff';
        case 'Đã giao':
        case 'Đã hoàn thành':
            return '#d4edda';
        case 'Đã hủy':
            return '#f8d7da';
        default:
            return '#eeeeee';
    }
}

function get_payment_text($payment_status) {
    $payment_status = trim((string)$payment_status);

    if ($payment_status === '' || $payment_status === null) {
        return 'Chưa thanh toán';
    }

    if ($payment_status === 'Đang chờ') {
        return 'Chưa thanh toán';
    }

    return $payment_status;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đơn hàng của tôi</title>
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

        .orders-page {
            max-width: 1280px;
            margin: 0 auto;
            padding: 32px 16px 60px;
        }

        .orders-hero {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            padding: 34px;
            margin-bottom: 24px;
            background:
                linear-gradient(135deg, rgba(229, 57, 53, 0.94), rgba(255, 179, 0, 0.84)),
                url('https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat;
            color: #fff;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        }

        .orders-hero::before {
            content: "";
            position: absolute;
            top: -70px;
            right: -70px;
            width: 210px;
            height: 210px;
            border-radius: 50%;
            background: rgba(255,255,255,0.10);
        }

        .orders-hero::after {
            content: "";
            position: absolute;
            left: -90px;
            bottom: -90px;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
        }

        .orders-hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 16px;
            flex-wrap: wrap;
        }

        .orders-badge {
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

        .orders-hero h1 {
            margin: 0 0 10px;
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -0.6px;
        }

        .orders-hero p {
            margin: 0;
            max-width: 660px;
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
            margin-bottom: 16px;
            border-radius: 18px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid transparent;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
        }

        .success {
            background: #F0FDF4;
            color: #166534;
            border-color: #BBF7D0;
        }

        .error {
            background: #FEF2F2;
            color: #B91C1C;
            border-color: #FECACA;
        }

        .filter-card,
        .table-card {
            background: #fff;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .filter-card {
            padding: 22px;
            margin-bottom: 22px;
        }

        .filter-header {
            margin-bottom: 18px;
        }

        .filter-title {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
        }

        .filter-desc {
            margin: 0;
            color: #6B7280;
            font-size: 14px;
        }

        .filter-form {
            display: grid;
            grid-template-columns: 1.5fr 1fr auto auto;
            gap: 12px;
        }

        .form-input,
        .form-select {
            width: 100%;
            height: 50px;
            border: 1px solid #D1D5DB;
            border-radius: 16px;
            padding: 0 14px;
            font-size: 14px;
            color: #111827;
            outline: none;
            background: #fff;
            transition: 0.25s ease;
        }

        .form-input:focus,
        .form-select:focus {
            border-color: #E53935;
            box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.10);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 50px;
            padding: 0 18px;
            border-radius: 16px;
            font-weight: 700;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: 0.25s ease;
            white-space: nowrap;
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
            background: #6B7280;
            color: #fff;
        }

        .btn-secondary:hover {
            background: #4B5563;
        }

        .table-card {
            overflow: hidden;
        }

        .table-head {
            padding: 22px 22px 0;
        }

        .table-title {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
        }

        .table-desc {
            margin: 0 0 18px;
            color: #6B7280;
            font-size: 14px;
        }

        .table-wrap {
            width: 100%;
            overflow-x: auto;
        }

        table {
            width: 100%;
            min-width: 980px;
            border-collapse: separate;
            border-spacing: 0;
        }

        thead th {
            background: #F8FAFC;
            color: #374151;
            font-size: 13px;
            font-weight: 800;
            text-align: left;
            padding: 16px 18px;
            border-bottom: 1px solid #E5E7EB;
            white-space: nowrap;
        }

        tbody td {
            padding: 18px;
            border-bottom: 1px solid #EEF2F7;
            vertical-align: top;
            font-size: 14px;
            color: #374151;
        }

        tbody tr:hover {
            background: #FCFCFD;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .order-code {
            font-weight: 800;
            color: #111827;
        }

        .order-text-strong {
            color: #111827;
            font-weight: 600;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 800;
            color: #1F2937;
        }

        .payment-chip {
            display: inline-flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 999px;
            background: #F3F4F6;
            color: #374151;
            font-size: 12px;
            font-weight: 700;
        }

        .price-text {
            color: #E53935;
            font-weight: 800;
            font-size: 15px;
        }

        .date-text {
            color: #6B7280;
            font-size: 13px;
            line-height: 1.6;
        }

        .detail-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 14px;
            background: linear-gradient(135deg, #1565C0, #2B7FFF);
            color: #fff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 13px;
            box-shadow: 0 12px 22px rgba(21, 101, 192, 0.18);
            transition: 0.25s ease;
        }

        .detail-btn:hover {
            transform: translateY(-1px);
        }

        .empty-state {
            padding: 42px 24px;
            text-align: center;
        }

        .empty-icon {
            width: 78px;
            height: 78px;
            margin: 0 auto 18px;
            border-radius: 24px;
            background: #F3F4F6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
        }

        .empty-title {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
        }

        .empty-text {
            margin: 0;
            color: #6B7280;
            font-size: 15px;
        }

        @media (max-width: 900px) {
            .filter-form {
                grid-template-columns: 1fr;
            }

            .orders-hero {
                padding: 26px 20px;
                border-radius: 24px;
            }
        }
    </style>
</head>
<body>

<div class="orders-page">
    <section class="orders-hero">
        <div class="orders-hero-content">
            <div>
                <div class="orders-badge">📦 Quản lý đơn hàng khách hàng</div>
                <h1>Đơn hàng của tôi</h1>
                <p>
                    Theo dõi tình trạng đơn hàng, kiểm tra thanh toán, tìm kiếm nhanh theo mã đơn
                    hoặc người nhận và xem chi tiết từng đơn hàng một cách trực quan.
                </p>
            </div>

            <a href="dashboard.php" class="hero-back-btn">← Quay lại mua sắm</a>
        </div>
    </section>

    <?php if (isset($_GET['success'])): ?>
        <div class="message success"><?php echo htmlspecialchars($_GET['success']); ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['error'])): ?>
        <div class="message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
    <?php endif; ?>

    <div class="filter-card">
        <div class="filter-header">
            <h2 class="filter-title">Bộ lọc đơn hàng</h2>
            <p class="filter-desc">Lọc nhanh theo trạng thái hoặc tìm kiếm theo mã đơn, người nhận và số điện thoại.</p>
        </div>

        <form method="GET" class="filter-form">
            <input
                type="text"
                name="keyword"
                class="form-input"
                placeholder="Tìm mã đơn, người nhận, số điện thoại"
                value="<?php echo htmlspecialchars($keyword); ?>"
            >

            <select name="status" class="form-select">
                <option value="">-- Tất cả trạng thái --</option>
                <?php
                $statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hoàn thành', 'Đã hủy'];
                foreach ($statuses as $status):
                ?>
                    <option value="<?php echo $status; ?>" <?php echo ($status_filter === $status) ? 'selected' : ''; ?>>
                        <?php echo $status; ?>
                    </option>
                <?php endforeach; ?>
            </select>

            <button type="submit" class="btn btn-primary">Lọc đơn hàng</button>
            <a href="orders.php" class="btn btn-secondary">Reset</a>
        </form>
    </div>

    <div class="table-card">
        <div class="table-head">
            <h2 class="table-title">Danh sách đơn hàng</h2>
            <p class="table-desc">Tất cả đơn hàng đã đặt của bạn được hiển thị tại đây.</p>
        </div>

        <?php if (!empty($orders)): ?>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Người nhận</th>
                            <th>SĐT</th>
                            <th>Thanh toán</th>
                            <th>Trạng thái đơn</th>
                            <th>Tổng tiền</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($orders as $row): ?>
                            <tr>
                                <td>
                                    <div class="order-code"><?php echo htmlspecialchars($row['order_code']); ?></div>
                                </td>
                                <td>
                                    <div class="order-text-strong"><?php echo htmlspecialchars($row['receiver_name']); ?></div>
                                </td>
                                <td><?php echo htmlspecialchars($row['receiver_phone']); ?></td>
                                <td>
                                    <span class="payment-chip">
                                        <?php echo htmlspecialchars(get_payment_text($row['payment_status'])); ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" style="background: <?php echo get_status_color($row['order_status']); ?>;">
                                        <?php echo htmlspecialchars($row['order_status']); ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="price-text"><?php echo format_money($row['total_amount']); ?></span>
                                </td>
                                <td>
                                    <span class="date-text"><?php echo htmlspecialchars(formatDate($row['created_at'])); ?></span>
                                </td>
                                <td>
                                    <a class="detail-btn" href="order_detail.php?id=<?php echo (int)$row['id']; ?>">
                                        Xem chi tiết
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <div class="empty-icon">🧾</div>
                <h3 class="empty-title">Bạn chưa có đơn hàng nào</h3>
                <p class="empty-text">
                    Hãy quay lại trang sản phẩm để chọn món hàng phù hợp và tạo đơn hàng đầu tiên của bạn.
                </p>
            </div>
        <?php endif; ?>
    </div>
</div>

</body>
</html>