<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff', 'admin'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$order_status = isset($_GET['order_status']) ? trim($_GET['order_status']) : '';
$payment_status = isset($_GET['payment_status']) ? trim($_GET['payment_status']) : '';

$filter = [];

if ($keyword !== '') {
    $filter['$or'] = [
        ['order_code' => ['$regex' => $keyword, '$options' => 'i']],
        ['receiver_name' => ['$regex' => $keyword, '$options' => 'i']],
        ['receiver_phone' => ['$regex' => $keyword, '$options' => 'i']]
    ];
}

if ($order_status !== '') {
    $filter['order_status'] = $order_status;
}

if ($payment_status !== '') {
    if ($payment_status === 'Chưa thanh toán') {
        $filter['$or'] = [
            ['payment_status' => ['$in' => ['Chưa thanh toán', 'Đang chờ', '', null]]],
            ['payment_status' => ['$exists' => false]]
        ];
    } else {
        $filter['payment_status'] = $payment_status;
    }
}

// Nếu cả keyword và payment_status đều dùng $or, ta gộp lại thành $and
if ($keyword !== '' && $payment_status === 'Chưa thanh toán') {
    $filter = [
        '$and' => [
            ['$or' => [
                ['order_code' => ['$regex' => $keyword, '$options' => 'i']],
                ['receiver_name' => ['$regex' => $keyword, '$options' => 'i']],
                ['receiver_phone' => ['$regex' => $keyword, '$options' => 'i']]
            ]],
            ['$or' => [
                ['payment_status' => ['$in' => ['Chưa thanh toán', 'Đang chờ', '', null]]],
                ['payment_status' => ['$exists' => false]]
            ]]
        ]
    ];
    if ($order_status !== '') {
        $filter['order_status'] = $order_status;
    }
}

$pipeline = [
    ['$match' => $filter],
    ['$lookup' => [
        'from' => 'users',
        'localField' => 'user_id',
        'foreignField' => 'id',
        'as' => 'user_info'
    ]],
    ['$unwind' => [
        'path' => '$user_info',
        'preserveNullAndEmptyArrays' => true
    ]],
    ['$project' => [
        'id' => 1,
        'order_code' => 1,
        'receiver_name' => 1,
        'receiver_phone' => 1,
        'payment_method' => 1,
        'payment_status' => 1,
        'order_status' => 1,
        'total_amount' => 1,
        'created_at' => 1,
        'customer_name' => '$user_info.full_name'
    ]],
    ['$sort' => ['id' => -1]]
];

$result = $db->orders->aggregate($pipeline)->toArray();

function format_money($amount) {
    return number_format((float)$amount, 0, ',', '.') . ' đ';
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
    <title>Quản lý đơn hàng</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { margin-bottom: 20px; }
        .top-actions { margin-bottom: 15px; }
        .filter-form {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .filter-form input, .filter-form select, .filter-form button {
            padding: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            vertical-align: top;
        }
        table th {
            background: #f5f5f5;
        }
        .btn {
            display: inline-block;
            padding: 6px 10px;
            text-decoration: none;
            border-radius: 4px;
            border: 1px solid #ccc;
            background: #f8f8f8;
            color: #000;
            margin-right: 5px;
        }
        .msg {
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .msg-success { background: #d4edda; color: #155724; }
        .msg-error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>

<h2>Quản lý đơn hàng</h2>

<div class="top-actions">
    <a class="btn" href="/staff/dashboard.php">← Quay lại dashboard</a>
</div>

<?php if (isset($_GET['success'])): ?>
    <div class="msg msg-success"><?php echo htmlspecialchars($_GET['success']); ?></div>
<?php endif; ?>

<?php if (isset($_GET['error'])): ?>
    <div class="msg msg-error"><?php echo htmlspecialchars($_GET['error']); ?></div>
<?php endif; ?>

<form method="GET" class="filter-form">
    <input type="text" name="keyword" placeholder="Tìm theo mã đơn, người nhận, SĐT"
           value="<?php echo htmlspecialchars($keyword); ?>">

    <select name="order_status">
        <option value="">-- Trạng thái đơn hàng --</option>
        <?php
        $order_statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hoàn thành', 'Đã hủy'];
        foreach ($order_statuses as $status):
        ?>
            <option value="<?php echo $status; ?>" <?php echo ($order_status === $status) ? 'selected' : ''; ?>>
                <?php echo $status; ?>
            </option>
        <?php endforeach; ?>
    </select>

    <select name="payment_status">
        <option value="">-- Trạng thái thanh toán --</option>
        <?php
        $payment_statuses = ['Chưa thanh toán', 'Đã thanh toán', 'Thất bại', 'Hoàn tiền'];
        foreach ($payment_statuses as $pstatus):
        ?>
            <option value="<?php echo $pstatus; ?>" <?php echo ($payment_status === $pstatus) ? 'selected' : ''; ?>>
                <?php echo $pstatus; ?>
            </option>
        <?php endforeach; ?>
    </select>

    <button type="submit">Lọc</button>
    <a class="btn" href="index.php">Reset</a>
</form>

<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Người nhận</th>
            <th>SĐT</th>
            <th>Thanh toán</th>
            <th>Trạng thái đơn</th>
            <th>Tổng tiền</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
        </tr>
    </thead>
    <tbody>
        <?php if (!empty($result)): ?>
            <?php foreach ($result as $row): ?>
                <tr>
                    <td><?php echo (int)$row['id']; ?></td>
                    <td><?php echo htmlspecialchars($row['order_code']); ?></td>
                    <td><?php echo htmlspecialchars($row['customer_name'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($row['receiver_name']); ?></td>
                    <td><?php echo htmlspecialchars($row['receiver_phone']); ?></td>
                    <td><?php echo htmlspecialchars(get_payment_text($row['payment_status'])); ?></td>
                    <td><?php echo htmlspecialchars($row['order_status']); ?></td>
                    <td><?php echo format_money($row['total_amount']); ?></td>
                    <td><?php echo formatDate($row['created_at']); ?></td>
                    <td>
                        <a class="btn" href="detail.php?id=<?php echo (int)$row['id']; ?>">Chi tiết</a>
                    </td>
                </tr>
            <?php endforeach; ?>
        <?php else: ?>
            <tr>
                <td colspan="10">Không có đơn hàng nào.</td>
            </tr>
        <?php endif; ?>
    </tbody>
</table>

</body>
</html>