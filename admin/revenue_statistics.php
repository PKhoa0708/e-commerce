<?php
require_once "../middleware/auth.php";
$allowed_roles = ['admin'];
require_once "../middleware/role.php";
require_once "../database/db.php";
require_once "../includes/header.php";

function e($str)
{
    return htmlspecialchars((string)$str, ENT_QUOTES, 'UTF-8');
}

function formatCurrency($amount)
{
    return number_format((float)$amount, 0, ',', '.') . ' đ';
}

function getFilterLabel($type, $value)
{
    if ($type === 'day') {
        return 'Theo ngày: ' . $value;
    }

    if ($type === 'month') {
        return 'Theo tháng: ' . $value;
    }

    if ($type === 'year') {
        return 'Theo năm: ' . $value;
    }

    return 'Tất cả thời gian';
}

function buildMongoDateMatch($type, $dateValue)
{
    try {
        if ($type === 'day' && !empty($dateValue)) {
            $start = new DateTime($dateValue . ' 00:00:00', new DateTimeZone('Asia/Ho_Chi_Minh'));
            $end = new DateTime($dateValue . ' 23:59:59', new DateTimeZone('Asia/Ho_Chi_Minh'));
        } elseif ($type === 'month' && !empty($dateValue)) {
            $start = new DateTime($dateValue . '-01 00:00:00', new DateTimeZone('Asia/Ho_Chi_Minh'));
            $end = (clone $start)->modify('last day of this month 23:59:59');
        } elseif ($type === 'year' && !empty($dateValue)) {
            $start = new DateTime($dateValue . '-01-01 00:00:00', new DateTimeZone('Asia/Ho_Chi_Minh'));
            $end = new DateTime($dateValue . '-12-31 23:59:59', new DateTimeZone('Asia/Ho_Chi_Minh'));
        } else {
            return [];
        }
        return [
            'created_at' => [
                '$gte' => new MongoDB\BSON\UTCDateTime($start->getTimestamp() * 1000),
                '$lte' => new MongoDB\BSON\UTCDateTime($end->getTimestamp() * 1000)
            ]
        ];
    } catch (Exception $e) {
        return [];
    }
}

$filterType = $_GET['filter_type'] ?? 'day';
$filterValue = $_GET['filter_value'] ?? date('Y-m-d');

$allowedFilterTypes = ['day', 'month', 'year'];
if (!in_array($filterType, $allowedFilterTypes, true)) {
    $filterType = 'day';
}

if ($filterType === 'day' && empty($filterValue)) {
    $filterValue = date('Y-m-d');
}
if ($filterType === 'month' && empty($filterValue)) {
    $filterValue = date('Y-m');
}
if ($filterType === 'year' && empty($filterValue)) {
    $filterValue = date('Y');
}

$dateMatch = buildMongoDateMatch($filterType, $filterValue);

// Thống kê tổng hợp (Summary Data)
$summaryPipeline = [
    ['$match' => $dateMatch],
    ['$group' => [
        '_id' => null,
        'total_orders' => ['$sum' => 1],
        'total_revenue' => [
            '$sum' => [
                '$cond' => [
                    'if' => ['$in' => ['$order_status', ['Đã hoàn thành', 'completed']]],
                    'then' => '$total_amount',
                    'else' => 0
                ]
            ]
        ],
        'completed_orders' => [
            '$sum' => [
                '$cond' => [
                    'if' => ['$in' => ['$order_status', ['Đã hoàn thành', 'completed']]],
                    'then' => 1,
                    'else' => 0
                ]
            ]
        ],
        'cancelled_orders' => [
            '$sum' => [
                '$cond' => [
                    'if' => ['$in' => ['$order_status', ['Đã hủy', 'cancelled', 'canceled']]],
                    'then' => 1,
                    'else' => 0
                ]
            ]
        ]
    ]]
];

$summaryResult = $db->orders->aggregate($summaryPipeline)->toArray();
$summaryData = $summaryResult[0] ?? [
    'total_orders' => 0,
    'total_revenue' => 0.0,
    'completed_orders' => 0,
    'cancelled_orders' => 0
];

$totalOrders = (int)($summaryData['total_orders'] ?? 0);
$totalRevenue = (float)($summaryData['total_revenue'] ?? 0);
$completedOrders = (int)($summaryData['completed_orders'] ?? 0);
$cancelledOrders = (int)($summaryData['cancelled_orders'] ?? 0);

// Thống kê trạng thái đơn hàng (Order status)
$statusPipeline = [
    ['$match' => $dateMatch],
    ['$group' => [
        '_id' => '$order_status',
        'total' => ['$sum' => 1]
    ]],
    ['$project' => [
        'order_status' => '$_id',
        'total' => 1,
        '_id' => 0
    ]],
    ['$sort' => [
        'total' => -1,
        'order_status' => 1
    ]]
];
$orderStatuses = $db->orders->aggregate($statusPipeline)->toArray();

// Thống kê trạng thái thanh toán (Payment status)
$paymentPipeline = [
    ['$match' => $dateMatch],
    ['$group' => [
        '_id' => '$payment_status',
        'total' => ['$sum' => 1]
    ]],
    ['$project' => [
        'payment_status' => '$_id',
        'total' => 1,
        '_id' => 0
    ]],
    ['$sort' => [
        'total' => -1,
        'payment_status' => 1
    ]]
];
$paymentStatuses = $db->orders->aggregate($paymentPipeline)->toArray();
$paymentMessage = '';

// Top 10 sản phẩm bán chạy
$bestSellingPipeline = [
    ['$lookup' => [
        'from' => 'orders',
        'localField' => 'order_id',
        'foreignField' => 'id',
        'as' => 'order_info'
    ]],
    ['$unwind' => '$order_info'],
    // Tạo filter khớp với match range của orders
    ['$match' => array_merge(
        array_combine(
            array_map(function($k) { return 'order_info.' . $k; }, array_keys($dateMatch)),
            array_values($dateMatch)
        ),
        ['order_info.order_status' => ['$in' => ['Đã hoàn thành', 'completed']]]
    )],
    ['$group' => [
        '_id' => [
            'product_id' => '$product_id',
            'product_name' => '$product_name'
        ],
        'total_sold' => ['$sum' => '$quantity'],
        'total_sales_amount' => ['$sum' => ['$multiply' => ['$quantity', '$product_price']]]
    ]],
    ['$project' => [
        'product_id' => '$_id.product_id',
        'product_name' => '$_id.product_name',
        'total_sold' => 1,
        'total_sales_amount' => 1,
        '_id' => 0
    ]],
    ['$sort' => [
        'total_sold' => -1,
        'total_sales_amount' => -1
    ]],
    ['$limit' => 10]
];
$bestSellingProducts = $db->order_items->aggregate($bestSellingPipeline)->toArray();

// Doanh thu theo mốc thời gian
if ($filterType === 'day') {
    $timeUnitExpr = ['$hour' => ['date' => '$created_at', 'timezone' => 'Asia/Ho_Chi_Minh']];
    $revenueByTimeLabel = 'Giờ';
} elseif ($filterType === 'month') {
    $timeUnitExpr = ['$dayOfMonth' => ['date' => '$created_at', 'timezone' => 'Asia/Ho_Chi_Minh']];
    $revenueByTimeLabel = 'Ngày';
} else {
    $timeUnitExpr = ['$month' => ['date' => '$created_at', 'timezone' => 'Asia/Ho_Chi_Minh']];
    $revenueByTimeLabel = 'Tháng';
}

$timePipeline = [
    ['$match' => $dateMatch],
    ['$group' => [
        '_id' => $timeUnitExpr,
        'total_orders' => ['$sum' => 1],
        'revenue' => [
            '$sum' => [
                '$cond' => [
                    'if' => ['$in' => ['$order_status', ['Đã hoàn thành', 'completed']]],
                    'then' => '$total_amount',
                    'else' => 0
                ]
            ]
        ]
    ]],
    ['$project' => [
        'time_unit' => '$_id',
        'total_orders' => 1,
        'revenue' => 1,
        '_id' => 0
    ]],
    ['$sort' => ['time_unit' => 1]]
];
$revenueByTime = $db->orders->aggregate($timePipeline)->toArray();

$revenueChartLabels = [];
$revenueChartData = [];
foreach ($revenueByTime as $item) {
    if ($filterType === 'day') {
        $revenueChartLabels[] = str_pad($item['time_unit'], 2, '0', STR_PAD_LEFT) . ':00';
    } elseif ($filterType === 'month') {
        $revenueChartLabels[] = 'Ngày ' . $item['time_unit'];
    } else {
        $revenueChartLabels[] = 'Tháng ' . $item['time_unit'];
    }
    $revenueChartData[] = (float)$item['revenue'];
}

$orderStatusLabels = [];
$orderStatusData = [];
foreach ($orderStatuses as $item) {
    $orderStatusLabels[] = $item['order_status'];
    $orderStatusData[] = (int)$item['total'];
}

$paymentStatusLabels = [];
$paymentStatusData = [];
foreach ($paymentStatuses as $item) {
    $paymentStatusLabels[] = $item['payment_status'];
    $paymentStatusData[] = (int)$item['total'];
}
?>

<div style="width:1200px; max-width:95%; margin:30px auto; font-family:Arial, sans-serif;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <div>
            <h2 style="margin:0; color:#222;">Thống kê doanh thu</h2>
            <p style="margin:8px 0 0; color:#666;">
                Bộ lọc hiện tại: <strong><?php echo e(getFilterLabel($filterType, $filterValue)); ?></strong>
            </p>
        </div>
        <div>
            <a href="/admin/dashboard.php" style="text-decoration:none; background:#555; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block;">
                ← Quay lại dashboard
            </a>
        </div>
    </div>

    <div style="background:#fff; border:1px solid #ddd; border-radius:10px; padding:20px; margin-bottom:20px;">
        <form method="GET" action="" style="display:flex; gap:12px; align-items:end; flex-wrap:wrap;">
            <div>
                <label style="display:block; margin-bottom:6px; font-weight:bold;">Kiểu thống kê</label>
                <select name="filter_type" onchange="updateFilterInput()" style="padding:10px; min-width:160px; border:1px solid #ccc; border-radius:6px;">
                    <option value="day" <?php echo ($filterType === 'day') ? 'selected' : ''; ?>>Theo ngày</option>
                    <option value="month" <?php echo ($filterType === 'month') ? 'selected' : ''; ?>>Theo tháng</option>
                    <option value="year" <?php echo ($filterType === 'year') ? 'selected' : ''; ?>>Theo năm</option>
                </select>
            </div>

            <div id="filter-input-wrapper">
                <label style="display:block; margin-bottom:6px; font-weight:bold;">Giá trị</label>
                <?php if ($filterType === 'day'): ?>
                    <input type="date" name="filter_value" value="<?php echo e($filterValue); ?>" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                <?php elseif ($filterType === 'month'): ?>
                    <input type="month" name="filter_value" value="<?php echo e($filterValue); ?>" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                <?php else: ?>
                    <input type="number" name="filter_value" value="<?php echo e($filterValue); ?>" min="2000" max="2100" style="padding:10px; border:1px solid #ccc; border-radius:6px; width:140px;">
                <?php endif; ?>
            </div>

            <div>
                <button type="submit" style="padding:10px 18px; background:#007bff; color:#fff; border:none; border-radius:6px; cursor:pointer;">
                    Xem thống kê
                </button>
            </div>
        </form>
    </div>

    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:20px;">
        <div style="background:#fff; border:1px solid #ddd; padding:18px; border-radius:10px;">
            <div style="font-size:14px; color:#777; margin-bottom:8px;">Tổng số đơn hàng</div>
            <div style="font-size:28px; font-weight:bold; color:#222;"><?php echo $totalOrders; ?></div>
        </div>

        <div style="background:#fff; border:1px solid #ddd; padding:18px; border-radius:10px;">
            <div style="font-size:14px; color:#777; margin-bottom:8px;">Doanh thu</div>
            <div style="font-size:28px; font-weight:bold; color:#28a745;"><?php echo formatCurrency($totalRevenue); ?></div>
            <div style="font-size:12px; color:#888; margin-top:6px;">Chỉ tính đơn hoàn thành</div>
        </div>

        <div style="background:#fff; border:1px solid #ddd; padding:18px; border-radius:10px;">
            <div style="font-size:14px; color:#777; margin-bottom:8px;">Đơn hoàn thành</div>
            <div style="font-size:28px; font-weight:bold; color:#17a2b8;"><?php echo $completedOrders; ?></div>
        </div>

        <div style="background:#fff; border:1px solid #ddd; padding:18px; border-radius:10px;">
            <div style="font-size:14px; color:#777; margin-bottom:8px;">Đơn đã hủy</div>
            <div style="font-size:28px; font-weight:bold; color:#dc3545;"><?php echo $cancelledOrders; ?></div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px; margin-bottom:20px;">
        <div style="background:#fff; border:1px solid #ddd; padding:20px; border-radius:10px;">
            <h3 style="margin-top:0;">Biểu đồ doanh thu</h3>
            <div style="margin-bottom:20px;">
                <canvas id="revenueChart" height="120"></canvas>
            </div>

            <h3 style="margin-top:0;">Doanh thu theo mốc thời gian</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f0f2f5;">
                            <th style="padding:12px; border:1px solid #ddd; text-align:left;"><?php echo e($revenueByTimeLabel); ?></th>
                            <th style="padding:12px; border:1px solid #ddd; text-align:right;">Số đơn</th>
                            <th style="padding:12px; border:1px solid #ddd; text-align:right;">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (!empty($revenueByTime)): ?>
                            <?php foreach ($revenueByTime as $row): ?>
                                <tr>
                                    <td style="padding:12px; border:1px solid #ddd;"><?php echo e($row['time_unit']); ?></td>
                                    <td style="padding:12px; border:1px solid #ddd; text-align:right;"><?php echo (int)$row['total_orders']; ?></td>
                                    <td style="padding:12px; border:1px solid #ddd; text-align:right; color:#28a745; font-weight:bold;"><?php echo formatCurrency($row['revenue']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="3" style="padding:14px; border:1px solid #ddd; text-align:center; color:#777;">Không có dữ liệu.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display:grid; gap:20px;">
            <div style="background:#fff; border:1px solid #ddd; padding:20px; border-radius:10px;">
                <h3 style="margin-top:0;">Trạng thái đơn hàng</h3>
                <div style="margin-bottom:20px;">
                    <canvas id="orderStatusChart" height="180"></canvas>
                </div>

                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f0f2f5;">
                            <th style="padding:10px; border:1px solid #ddd; text-align:left;">Trạng thái</th>
                            <th style="padding:10px; border:1px solid #ddd; text-align:right;">Số lượng</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (!empty($orderStatuses)): ?>
                            <?php foreach ($orderStatuses as $row): ?>
                                <tr>
                                    <td style="padding:10px; border:1px solid #ddd;"><?php echo e($row['order_status']); ?></td>
                                    <td style="padding:10px; border:1px solid #ddd; text-align:right;"><?php echo (int)$row['total']; ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="2" style="padding:14px; border:1px solid #ddd; text-align:center; color:#777;">Không có dữ liệu.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <div style="background:#fff; border:1px solid #ddd; padding:20px; border-radius:10px;">
                <h3 style="margin-top:0;">Trạng thái thanh toán</h3>

                <?php if (!empty($paymentMessage)): ?>
                    <div style="padding:12px; background:#fff3cd; color:#856404; border:1px solid #ffeeba; border-radius:6px; line-height:1.5;">
                        <?php echo e($paymentMessage); ?>
                    </div>
                <?php else: ?>
                    <div style="margin-bottom:20px;">
                        <canvas id="paymentStatusChart" height="180"></canvas>
                    </div>

                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f0f2f5;">
                                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Thanh toán</th>
                                <th style="padding:10px; border:1px solid #ddd; text-align:right;">Số lượng</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (!empty($paymentStatuses)): ?>
                                <?php foreach ($paymentStatuses as $row): ?>
                                    <tr>
                                        <td style="padding:10px; border:1px solid #ddd;"><?php echo e($row['payment_status']); ?></td>
                                        <td style="padding:10px; border:1px solid #ddd; text-align:right;"><?php echo (int)$row['total']; ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="2" style="padding:14px; border:1px solid #ddd; text-align:center; color:#777;">Không có dữ liệu.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div style="background:#fff; border:1px solid #ddd; padding:20px; border-radius:10px;">
        <h3 style="margin-top:0;">Top 10 sản phẩm bán chạy</h3>

        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:#f0f2f5;">
                    <th style="padding:12px; border:1px solid #ddd; text-align:left;">Sản phẩm</th>
                    <th style="padding:12px; border:1px solid #ddd; text-align:right;">Đã bán</th>
                    <th style="padding:12px; border:1px solid #ddd; text-align:right;">Doanh số</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($bestSellingProducts)): ?>
                    <?php foreach ($bestSellingProducts as $row): ?>
                        <tr>
                            <td style="padding:12px; border:1px solid #ddd;"><?php echo e($row['product_name']); ?></td>
                            <td style="padding:12px; border:1px solid #ddd; text-align:right;"><?php echo (int)$row['total_sold']; ?></td>
                            <td style="padding:12px; border:1px solid #ddd; text-align:right;"><?php echo formatCurrency($row['total_sales_amount']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="3" style="padding:14px; border:1px solid #ddd; text-align:center; color:#777;">Không có dữ liệu.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    function updateFilterInput() {
        var type = document.querySelector('select[name="filter_type"]').value;
        var wrapper = document.getElementById('filter-input-wrapper');
        var today = "<?php echo date('Y-m-d'); ?>";
        var currentMonth = "<?php echo date('Y-m'); ?>";
        var currentYear = "<?php echo date('Y'); ?>";

        var html = '<label style="display:block; margin-bottom:6px; font-weight:bold;">Giá trị</label>';

        if (type === 'day') {
            html += '<input type="date" name="filter_value" value="' + today + '" style="padding:10px; border:1px solid #ccc; border-radius:6px;">';
        } else if (type === 'month') {
            html += '<input type="month" name="filter_value" value="' + currentMonth + '" style="padding:10px; border:1px solid #ccc; border-radius:6px;">';
        } else {
            html += '<input type="number" name="filter_value" value="' + currentYear + '" min="2000" max="2100" style="padding:10px; border:1px solid #ccc; border-radius:6px; width:140px;">';
        }

        wrapper.innerHTML = html;
    }

    const revenueLabels = <?php echo json_encode($revenueChartLabels, JSON_UNESCAPED_UNICODE); ?>;
    const revenueData = <?php echo json_encode($revenueChartData); ?>;
    const orderStatusLabels = <?php echo json_encode($orderStatusLabels, JSON_UNESCAPED_UNICODE); ?>;
    const orderStatusData = <?php echo json_encode($orderStatusData); ?>;
    const paymentStatusLabels = <?php echo json_encode($paymentStatusLabels, JSON_UNESCAPED_UNICODE); ?>;
    const paymentStatusData = <?php echo json_encode($paymentStatusData); ?>;

    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas && revenueLabels.length > 0) {
        new Chart(revenueCanvas, {
            type: 'bar',
            data: {
                labels: revenueLabels,
                datasets: [{
                    label: 'Doanh thu',
                    data: revenueData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const orderStatusCanvas = document.getElementById('orderStatusChart');
    if (orderStatusCanvas && orderStatusLabels.length > 0) {
        new Chart(orderStatusCanvas, {
            type: 'pie',
            data: {
                labels: orderStatusLabels,
                datasets: [{
                    data: orderStatusData,
                    backgroundColor: [
                        '#36A2EB',
                        '#4BC0C0',
                        '#FFCE56',
                        '#FF6384',
                        '#9966FF',
                        '#FF9F40',
                        '#8BC34A'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    const paymentStatusCanvas = document.getElementById('paymentStatusChart');
    if (paymentStatusCanvas && paymentStatusLabels.length > 0) {
        new Chart(paymentStatusCanvas, {
            type: 'doughnut',
            data: {
                labels: paymentStatusLabels,
                datasets: [{
                    data: paymentStatusData,
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107',
                        '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
</script>

<?php require_once "../includes/footer.php"; ?>