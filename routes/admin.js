const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb, getNextId, formatDate } = require('../database/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Apply auth and role middleware to all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// ==============================
// ADMIN DASHBOARD
// ==============================
router.get('/dashboard', async (req, res) => {
    try {
        res.render('admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// ==============================
// REVENUE STATISTICS
// ==============================
router.get('/revenue', async (req, res) => {
    try {
        const db = getDb();
        const filterType = req.query.filter_type || 'day';
        let filterValue = req.query.filter_value || '';

        const allowedFilterTypes = ['day', 'month', 'year'];
        const validFilterType = allowedFilterTypes.includes(filterType) ? filterType : 'day';

        // Set default filter values
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        if (validFilterType === 'day' && !filterValue) {
            filterValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        }
        if (validFilterType === 'month' && !filterValue) {
            filterValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
        }
        if (validFilterType === 'year' && !filterValue) {
            filterValue = `${now.getFullYear()}`;
        }

        // Build date match filter
        let dateMatch = {};
        try {
            if (validFilterType === 'day' && filterValue) {
                const start = new Date(filterValue + 'T00:00:00+07:00');
                const end = new Date(filterValue + 'T23:59:59+07:00');
                dateMatch = { created_at: { $gte: start, $lte: end } };
            } else if (validFilterType === 'month' && filterValue) {
                const start = new Date(filterValue + '-01T00:00:00+07:00');
                const endMonth = new Date(start);
                endMonth.setMonth(endMonth.getMonth() + 1);
                endMonth.setDate(0); // last day of month
                const end = new Date(`${endMonth.getFullYear()}-${pad(endMonth.getMonth() + 1)}-${pad(endMonth.getDate())}T23:59:59+07:00`);
                dateMatch = { created_at: { $gte: start, $lte: end } };
            } else if (validFilterType === 'year' && filterValue) {
                const start = new Date(filterValue + '-01-01T00:00:00+07:00');
                const end = new Date(filterValue + '-12-31T23:59:59+07:00');
                dateMatch = { created_at: { $gte: start, $lte: end } };
            }
        } catch (e) {
            dateMatch = {};
        }

        // Summary statistics
        const summaryPipeline = [
            { $match: dateMatch },
            { $group: {
                _id: null,
                total_orders: { $sum: 1 },
                total_revenue: {
                    $sum: {
                        $cond: {
                            if: { $in: ['$order_status', ['Đã hoàn thành', 'completed']] },
                            then: '$total_amount',
                            else: 0
                        }
                    }
                },
                completed_orders: {
                    $sum: {
                        $cond: {
                            if: { $in: ['$order_status', ['Đã hoàn thành', 'completed']] },
                            then: 1,
                            else: 0
                        }
                    }
                },
                cancelled_orders: {
                    $sum: {
                        $cond: {
                            if: { $in: ['$order_status', ['Đã hủy', 'cancelled', 'canceled']] },
                            then: 1,
                            else: 0
                        }
                    }
                }
            }}
        ];

        const summaryResult = await db.collection('orders').aggregate(summaryPipeline).toArray();
        const summaryData = summaryResult[0] || {
            total_orders: 0,
            total_revenue: 0,
            completed_orders: 0,
            cancelled_orders: 0
        };

        // Order status statistics
        const statusPipeline = [
            { $match: dateMatch },
            { $group: { _id: '$order_status', total: { $sum: 1 } } },
            { $project: { order_status: '$_id', total: 1, _id: 0 } },
            { $sort: { total: -1, order_status: 1 } }
        ];
        const orderStatuses = await db.collection('orders').aggregate(statusPipeline).toArray();

        // Payment status statistics
        const paymentPipeline = [
            { $match: dateMatch },
            { $group: { _id: '$payment_status', total: { $sum: 1 } } },
            { $project: { payment_status: '$_id', total: 1, _id: 0 } },
            { $sort: { total: -1, payment_status: 1 } }
        ];
        const paymentStatuses = await db.collection('orders').aggregate(paymentPipeline).toArray();

        // Top 10 best-selling products
        const dateMatchForItems = {};
        if (dateMatch.created_at) {
            dateMatchForItems['order_info.created_at'] = dateMatch.created_at;
        }

        const bestSellingPipeline = [
            { $lookup: {
                from: 'orders',
                localField: 'order_id',
                foreignField: 'id',
                as: 'order_info'
            }},
            { $unwind: '$order_info' },
            { $match: {
                ...dateMatchForItems,
                'order_info.order_status': { $in: ['Đã hoàn thành', 'completed'] }
            }},
            { $group: {
                _id: { product_id: '$product_id', product_name: '$product_name' },
                total_sold: { $sum: '$quantity' },
                total_sales_amount: { $sum: { $multiply: ['$quantity', '$product_price'] } }
            }},
            { $project: {
                product_id: '$_id.product_id',
                product_name: '$_id.product_name',
                total_sold: 1,
                total_sales_amount: 1,
                _id: 0
            }},
            { $sort: { total_sold: -1, total_sales_amount: -1 } },
            { $limit: 10 }
        ];
        const bestSellingProducts = await db.collection('order_items').aggregate(bestSellingPipeline).toArray();

        // Revenue by time unit
        let timeUnitExpr;
        let revenueByTimeLabel;
        if (validFilterType === 'day') {
            timeUnitExpr = { $hour: { date: '$created_at', timezone: 'Asia/Ho_Chi_Minh' } };
            revenueByTimeLabel = 'Giờ';
        } else if (validFilterType === 'month') {
            timeUnitExpr = { $dayOfMonth: { date: '$created_at', timezone: 'Asia/Ho_Chi_Minh' } };
            revenueByTimeLabel = 'Ngày';
        } else {
            timeUnitExpr = { $month: { date: '$created_at', timezone: 'Asia/Ho_Chi_Minh' } };
            revenueByTimeLabel = 'Tháng';
        }

        const timePipeline = [
            { $match: dateMatch },
            { $group: {
                _id: timeUnitExpr,
                total_orders: { $sum: 1 },
                revenue: {
                    $sum: {
                        $cond: {
                            if: { $in: ['$order_status', ['Đã hoàn thành', 'completed']] },
                            then: '$total_amount',
                            else: 0
                        }
                    }
                }
            }},
            { $project: { time_unit: '$_id', total_orders: 1, revenue: 1, _id: 0 } },
            { $sort: { time_unit: 1 } }
        ];
        const revenueByTime = await db.collection('orders').aggregate(timePipeline).toArray();

        // Prepare chart data
        const revenueChartLabels = [];
        const revenueChartData = [];
        for (const item of revenueByTime) {
            if (validFilterType === 'day') {
                revenueChartLabels.push(String(item.time_unit).padStart(2, '0') + ':00');
            } else if (validFilterType === 'month') {
                revenueChartLabels.push('Ngày ' + item.time_unit);
            } else {
                revenueChartLabels.push('Tháng ' + item.time_unit);
            }
            revenueChartData.push(Number(item.revenue) || 0);
        }

        const orderStatusLabels = orderStatuses.map(s => s.order_status);
        const orderStatusData = orderStatuses.map(s => Number(s.total));
        const paymentStatusLabels = paymentStatuses.map(s => s.payment_status);
        const paymentStatusData = paymentStatuses.map(s => Number(s.total));

        // Get filter label
        function getFilterLabel(type, value) {
            if (type === 'day') return 'Theo ngày: ' + value;
            if (type === 'month') return 'Theo tháng: ' + value;
            if (type === 'year') return 'Theo năm: ' + value;
            return 'Tất cả thời gian';
        }

        // Get today/month/year for JS
        const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const currentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
        const currentYear = `${now.getFullYear()}`;

        res.render('admin/revenue_statistics', {
            filterType: validFilterType,
            filterValue,
            filterLabel: getFilterLabel(validFilterType, filterValue),
            summaryData,
            orderStatuses,
            paymentStatuses,
            bestSellingProducts,
            revenueByTime,
            revenueByTimeLabel,
            revenueChartLabels: JSON.stringify(revenueChartLabels),
            revenueChartData: JSON.stringify(revenueChartData),
            orderStatusLabels: JSON.stringify(orderStatusLabels),
            orderStatusData: JSON.stringify(orderStatusData),
            paymentStatusLabels: JSON.stringify(paymentStatusLabels),
            paymentStatusData: JSON.stringify(paymentStatusData),
            today,
            currentMonth,
            currentYear
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// ==============================
// USER MANAGEMENT
// ==============================

// GET /admin/users - User list
router.get('/users', async (req, res) => {
    try {
        const db = getDb();
        const users = await db.collection('users').find({}, { sort: { id: -1 } }).toArray();
        res.render('admin/users/index', { users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// GET /admin/users/create - Create user form
router.get('/users/create', async (req, res) => {
    try {
        res.render('admin/users/create');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// POST /admin/users/store - Store new user
router.post('/users/store', async (req, res) => {
    try {
        const db = getDb();
        const { full_name, email, phone, address, password, role, status } = req.body;

        if (!full_name || !full_name.trim() || !email || !email.trim() || !password || !password.trim() || !role || !status) {
            return res.redirect('/admin/users/create?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin bắt buộc'));
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.redirect('/admin/users/create?error=' + encodeURIComponent('Email không hợp lệ'));
        }

        // Check existing email
        const existing = await db.collection('users').findOne({ email: email.trim() });
        if (existing) {
            return res.redirect('/admin/users/create?error=' + encodeURIComponent('Email đã tồn tại'));
        }

        const hashed_password = await bcrypt.hash(password.trim(), 10);
        const new_user_id = await getNextId('users');

        await db.collection('users').insertOne({
            id: new_user_id,
            numeric_id: new_user_id,
            full_name: full_name.trim(),
            email: email.trim(),
            phone: (phone || '').trim(),
            password: hashed_password,
            address: (address || '').trim(),
            role: role.trim(),
            status: status.trim(),
            avatar: null,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Create cart for customer
        if (role.trim() === 'customer') {
            const cart_id = await getNextId('carts');
            await db.collection('carts').insertOne({
                id: cart_id,
                numeric_id: cart_id,
                user_id: new_user_id,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        res.redirect('/admin/users?success=' + encodeURIComponent('Thêm tài khoản thành công'));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/users/create?error=' + encodeURIComponent('Thêm tài khoản thất bại: ' + err.message));
    }
});

// GET /admin/users/edit - Edit user form
router.get('/users/edit', async (req, res) => {
    try {
        const db = getDb();
        const id = Number(req.query.id);

        if (!id || id <= 0) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('ID không hợp lệ'));
        }

        const user = await db.collection('users').findOne({ id });
        if (!user) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('Không tìm thấy tài khoản'));
        }

        res.render('admin/users/edit', { user: user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// POST /admin/users/update - Update user
router.post('/users/update', async (req, res) => {
    try {
        const db = getDb();
        const { id, full_name, email, phone, address, password, role, status } = req.body;
        const userId = Number(id);

        if (userId <= 0 || !full_name || !full_name.trim() || !email || !email.trim() || !role || !status) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        // Check email uniqueness
        const existing = await db.collection('users').findOne({ email: email.trim(), id: { $ne: userId } });
        if (existing) {
            return res.redirect(`/admin/users/edit?id=${userId}&error=` + encodeURIComponent('Email đã tồn tại'));
        }

        const update_data = {
            full_name: full_name.trim(),
            email: email.trim(),
            phone: (phone || '').trim(),
            address: (address || '').trim(),
            role: role.trim(),
            status: status.trim(),
            updated_at: new Date()
        };

        if (password && password.trim()) {
            update_data.password = await bcrypt.hash(password.trim(), 10);
        }

        await db.collection('users').updateOne({ id: userId }, { $set: update_data });

        res.redirect('/admin/users?success=' + encodeURIComponent('Cập nhật tài khoản thành công'));
    } catch (err) {
        console.error(err);
        const userId = Number(req.body.id) || 0;
        res.redirect(`/admin/users/edit?id=${userId}&error=` + encodeURIComponent('Cập nhật thất bại: ' + err.message));
    }
});

// GET /admin/users/toggle-status - Toggle user active/blocked
router.get('/users/toggle-status', async (req, res) => {
    try {
        const db = getDb();
        const id = Number(req.query.id);

        if (!id || id <= 0) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('ID không hợp lệ'));
        }

        // Admin cannot block themselves
        if (id === Number(req.session.user_id)) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('Bạn không thể tự khóa tài khoản của mình'));
        }

        const user = await db.collection('users').findOne({ id });
        if (!user) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('Không tìm thấy tài khoản'));
        }

        const new_status = (user.status === 'active') ? 'blocked' : 'active';

        await db.collection('users').updateOne(
            { id },
            { $set: { status: new_status, updated_at: new Date() } }
        );

        res.redirect('/admin/users?success=' + encodeURIComponent('Đổi trạng thái tài khoản thành công'));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/users?error=' + encodeURIComponent('Không thể cập nhật trạng thái'));
    }
});

module.exports = router;
