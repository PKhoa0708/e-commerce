const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, getNextId, formatDate } = require('../database/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Apply auth and role middleware to all staff routes
router.use(authMiddleware);
router.use(roleMiddleware(['staff']));

// ==============================
// MULTER CONFIG FOR PRODUCT IMAGES
// ==============================
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const newName = Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000) + ext;
        cb(null, newName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng ảnh không được hỗ trợ'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// ==============================
// STAFF DASHBOARD
// ==============================
router.get('/dashboard', async (req, res) => {
    try {
        res.render('staff/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// ==============================
// PRODUCTS MANAGEMENT
// ==============================

// GET /staff/products - Product list
router.get('/products', async (req, res) => {
    try {
        const db = getDb();
        const pipeline = [
            { $lookup: {
                from: 'categories',
                localField: 'category_id',
                foreignField: 'id',
                as: 'category_info'
            }},
            { $unwind: {
                path: '$category_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1,
                name: 1,
                category_id: 1,
                price: 1,
                stock_quantity: 1,
                status: 1,
                thumbnail: 1,
                category_name: '$category_info.name'
            }},
            { $sort: { id: -1 } }
        ];
        const products = await db.collection('products').aggregate(pipeline).toArray();

        // Fetch images for each product
        for (let product of products) {
            const images_result = await db.collection('product_images').find(
                { product_id: Number(product.id) },
                { sort: { is_main: -1, id: 1 } }
            ).toArray();

            let images = images_result.map(img => img.image_path);
            if (images.length === 0 && product.thumbnail) {
                images.push(product.thumbnail);
            }
            product.images = images;
        }

        res.render('staff/products/index', { products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// GET /staff/products/create - Create product form
router.get('/products/create', async (req, res) => {
    try {
        const db = getDb();
        const categories = await db.collection('categories').find(
            { status: 1 },
            { sort: { id: -1 } }
        ).toArray();
        res.render('staff/products/create', { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// POST /staff/products/store - Store new product
router.post('/products/store', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
]), async (req, res) => {
    try {
        const db = getDb();
        const { name, category_id, sku, description, price, stock_quantity, status } = req.body;

        // Validation
        if (!name || !name.trim() || !category_id || Number(category_id) <= 0 || Number(price) < 0 || Number(stock_quantity) < 0 || !status) {
            return res.redirect('/staff/products/create?error=' + encodeURIComponent('Vui lòng nhập đầy đủ và hợp lệ'));
        }

        // Check SKU uniqueness
        if (sku && sku.trim()) {
            const existing = await db.collection('products').findOne({ sku: sku.trim() });
            if (existing) {
                return res.redirect('/staff/products/create?error=' + encodeURIComponent('SKU đã tồn tại'));
            }
        }

        // Generate slug
        let slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
        slug = slug + '-' + Date.now();

        // Handle thumbnail upload
        let thumbnail_path = null;
        if (req.files && req.files['thumbnail'] && req.files['thumbnail'].length > 0) {
            thumbnail_path = 'uploads/products/' + req.files['thumbnail'][0].filename;
        }

        // Get next product ID
        const product_id = await getNextId('products');

        // Insert product
        await db.collection('products').insertOne({
            id: product_id,
            numeric_id: product_id,
            category_id: Number(category_id),
            name: name.trim(),
            slug,
            sku: (sku || '').trim(),
            description: (description || '').trim(),
            price: Number(price),
            stock_quantity: Number(stock_quantity),
            thumbnail: thumbnail_path,
            status: status.trim(),
            is_featured: 0,
            created_by: Number(req.session.user_id),
            updated_by: Number(req.session.user_id),
            created_at: new Date(),
            updated_at: new Date()
        });

        // Save thumbnail to product_images
        if (thumbnail_path) {
            const image_id = await getNextId('product_images');
            await db.collection('product_images').insertOne({
                id: image_id,
                numeric_id: image_id,
                product_id: product_id,
                image_path: thumbnail_path,
                is_main: 1,
                created_at: new Date()
            });
        }

        // Handle gallery images
        if (req.files && req.files['gallery_images']) {
            for (const file of req.files['gallery_images']) {
                const gallery_path = 'uploads/products/' + file.filename;
                const img_id = await getNextId('product_images');
                await db.collection('product_images').insertOne({
                    id: img_id,
                    numeric_id: img_id,
                    product_id: product_id,
                    image_path: gallery_path,
                    is_main: 0,
                    created_at: new Date()
                });
            }
        }

        res.redirect('/staff/products?success=' + encodeURIComponent('Thêm sản phẩm thành công'));
    } catch (err) {
        console.error(err);
        res.redirect('/staff/products/create?error=' + encodeURIComponent('Thêm sản phẩm thất bại: ' + err.message));
    }
});

// GET /staff/products/edit - Edit product form
router.get('/products/edit', async (req, res) => {
    try {
        const db = getDb();
        const id = Number(req.query.id);

        if (!id || id <= 0) {
            return res.redirect('/staff/products?error=' + encodeURIComponent('ID không hợp lệ'));
        }

        const product = await db.collection('products').findOne({ id });
        if (!product) {
            return res.redirect('/staff/products?error=' + encodeURIComponent('Không tìm thấy sản phẩm'));
        }

        const categories = await db.collection('categories').find(
            { status: 1 },
            { sort: { id: -1 } }
        ).toArray();

        res.render('staff/products/edit', { product, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// POST /staff/products/update - Update product
router.post('/products/update', upload.fields([
    { name: 'thumbnail_files', maxCount: 10 }
]), async (req, res) => {
    try {
        const db = getDb();
        const { id, name, category_id, sku, description, price, stock_quantity, status, old_thumbnail, delete_current_image } = req.body;
        const productId = Number(id);

        if (productId <= 0 || !name || !name.trim() || Number(category_id) <= 0 || Number(price) < 0 || Number(stock_quantity) < 0 || !status) {
            return res.redirect(`/staff/products/edit?id=${productId}&error=` + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        // Check SKU uniqueness (exclude current product)
        if (sku && sku.trim()) {
            const existing = await db.collection('products').findOne({ sku: sku.trim(), id: { $ne: productId } });
            if (existing) {
                return res.redirect(`/staff/products/edit?id=${productId}&error=` + encodeURIComponent('SKU đã tồn tại'));
            }
        }

        // Generate slug
        let slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
        slug = slug + '-' + Date.now();

        // Process uploaded files
        const new_uploaded_paths = [];
        if (req.files && req.files['thumbnail_files']) {
            for (const file of req.files['thumbnail_files']) {
                new_uploaded_paths.push('uploads/products/' + file.filename);
            }
        }

        let thumbnail_path = old_thumbnail || null;
        const shouldDelete = Number(delete_current_image) === 1;

        if (shouldDelete) {
            // Delete old thumbnail file
            if (old_thumbnail) {
                const oldPath = path.join(__dirname, '..', old_thumbnail);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Delete main image records from product_images
            await db.collection('product_images').deleteMany({ product_id: productId, is_main: 1 });

            if (new_uploaded_paths.length > 0) {
                // First new image becomes the main thumbnail
                thumbnail_path = new_uploaded_paths[0];

                const main_img_id = await getNextId('product_images');
                await db.collection('product_images').insertOne({
                    id: main_img_id,
                    numeric_id: main_img_id,
                    product_id: productId,
                    image_path: thumbnail_path,
                    is_main: 1,
                    created_at: new Date()
                });

                // Rest become gallery images
                for (let i = 1; i < new_uploaded_paths.length; i++) {
                    const gallery_id = await getNextId('product_images');
                    await db.collection('product_images').insertOne({
                        id: gallery_id,
                        numeric_id: gallery_id,
                        product_id: productId,
                        image_path: new_uploaded_paths[i],
                        is_main: 0,
                        created_at: new Date()
                    });
                }
            } else {
                thumbnail_path = null;
            }
        } else {
            // Keep old thumbnail, add new images as gallery
            for (const gallery_path of new_uploaded_paths) {
                const gallery_id = await getNextId('product_images');
                await db.collection('product_images').insertOne({
                    id: gallery_id,
                    numeric_id: gallery_id,
                    product_id: productId,
                    image_path: gallery_path,
                    is_main: 0,
                    created_at: new Date()
                });
            }
        }

        // Update product document
        await db.collection('products').updateOne(
            { id: productId },
            { $set: {
                category_id: Number(category_id),
                name: name.trim(),
                slug,
                sku: (sku || '').trim(),
                description: (description || '').trim(),
                price: Number(price),
                stock_quantity: Number(stock_quantity),
                thumbnail: thumbnail_path,
                status: status.trim(),
                updated_by: Number(req.session.user_id),
                updated_at: new Date()
            }}
        );

        res.redirect(`/staff/products/edit?id=${productId}&success=` + encodeURIComponent('Cập nhật sản phẩm thành công'));
    } catch (err) {
        console.error(err);
        const productId = Number(req.body.id) || 0;
        res.redirect(`/staff/products/edit?id=${productId}&error=` + encodeURIComponent('Cập nhật thất bại: ' + err.message));
    }
});

// GET /staff/products/delete - Delete product
router.get('/products/delete', async (req, res) => {
    try {
        const db = getDb();
        const id = Number(req.query.id);

        if (!id || id <= 0) {
            return res.redirect('/staff/products?error=' + encodeURIComponent('ID không hợp lệ'));
        }

        const product = await db.collection('products').findOne({ id });
        if (!product) {
            return res.redirect('/staff/products?error=' + encodeURIComponent('Không tìm thấy sản phẩm'));
        }

        // Delete all product images (files + records)
        const images = await db.collection('product_images').find({ product_id: id }).toArray();
        for (const img of images) {
            if (img.image_path) {
                const imgPath = path.join(__dirname, '..', img.image_path);
                if (fs.existsSync(imgPath)) {
                    try { fs.unlinkSync(imgPath); } catch(e) {}
                }
            }
        }
        await db.collection('product_images').deleteMany({ product_id: id });

        // Delete the product
        await db.collection('products').deleteOne({ id });

        // Delete thumbnail file
        if (product.thumbnail) {
            const thumbPath = path.join(__dirname, '..', product.thumbnail);
            if (fs.existsSync(thumbPath)) {
                try { fs.unlinkSync(thumbPath); } catch(e) {}
            }
        }

        res.redirect('/staff/products?success=' + encodeURIComponent('Xóa sản phẩm thành công'));
    } catch (err) {
        console.error(err);
        res.redirect('/staff/products?error=' + encodeURIComponent('Xóa sản phẩm thất bại: ' + err.message));
    }
});

// ==============================
// ORDERS MANAGEMENT
// ==============================

// GET /staff/orders - Order list with filters
router.get('/orders', async (req, res) => {
    try {
        const db = getDb();
        const keyword = (req.query.keyword || '').trim();
        const order_status = (req.query.order_status || '').trim();
        const payment_status = (req.query.payment_status || '').trim();

        let filter = {};

        if (keyword && payment_status === 'Chưa thanh toán') {
            // Both keyword and "Chưa thanh toán" use $or, combine with $and
            filter = {
                $and: [
                    { $or: [
                        { order_code: { $regex: keyword, $options: 'i' } },
                        { receiver_name: { $regex: keyword, $options: 'i' } },
                        { receiver_phone: { $regex: keyword, $options: 'i' } }
                    ]},
                    { $or: [
                        { payment_status: { $in: ['Chưa thanh toán', 'Đang chờ', '', null] } },
                        { payment_status: { $exists: false } }
                    ]}
                ]
            };
            if (order_status) {
                filter.order_status = order_status;
            }
        } else {
            if (keyword) {
                filter.$or = [
                    { order_code: { $regex: keyword, $options: 'i' } },
                    { receiver_name: { $regex: keyword, $options: 'i' } },
                    { receiver_phone: { $regex: keyword, $options: 'i' } }
                ];
            }
            if (order_status) {
                filter.order_status = order_status;
            }
            if (payment_status) {
                if (payment_status === 'Chưa thanh toán') {
                    filter.$or = [
                        { payment_status: { $in: ['Chưa thanh toán', 'Đang chờ', '', null] } },
                        { payment_status: { $exists: false } }
                    ];
                } else {
                    filter.payment_status = payment_status;
                }
            }
        }

        const pipeline = [
            { $match: filter },
            { $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: 'id',
                as: 'user_info'
            }},
            { $unwind: {
                path: '$user_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1,
                order_code: 1,
                receiver_name: 1,
                receiver_phone: 1,
                payment_method: 1,
                payment_status: 1,
                order_status: 1,
                total_amount: 1,
                created_at: 1,
                customer_name: '$user_info.full_name'
            }},
            { $sort: { id: -1 } }
        ];

        const orders = await db.collection('orders').aggregate(pipeline).toArray();

        res.render('staff/orders/index', {
            orders,
            keyword,
            order_status,
            payment_status
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// GET /staff/orders/detail - Order detail
router.get('/orders/detail', async (req, res) => {
    try {
        const db = getDb();
        const order_id = Number(req.query.id);

        if (!order_id || order_id <= 0) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('ID đơn hàng không hợp lệ'));
        }

        // Fetch order with user info
        const pipeline_order = [
            { $match: { id: order_id } },
            { $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: 'id',
                as: 'user_info'
            }},
            { $unwind: {
                path: '$user_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1, order_code: 1, user_id: 1,
                receiver_name: 1, receiver_phone: 1,
                shipping_address: 1, note: 1,
                payment_method: 1, payment_status: 1,
                order_status: 1, subtotal: 1,
                shipping_fee: 1, total_amount: 1,
                cancel_reason: 1, created_at: 1, updated_at: 1,
                customer_name: '$user_info.full_name',
                customer_email: '$user_info.email'
            }}
        ];

        const order_res = await db.collection('orders').aggregate(pipeline_order).toArray();
        const order = order_res[0] || null;

        if (!order) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        // Fetch order items
        const items = await db.collection('order_items').find(
            { order_id },
            { sort: { id: 1 } }
        ).toArray();

        // Fetch payment info
        const pipeline_payment = [
            { $match: { order_id } },
            { $lookup: {
                from: 'users',
                localField: 'updated_by',
                foreignField: 'id',
                as: 'user_info'
            }},
            { $unwind: {
                path: '$user_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1, order_id: 1, payment_method: 1,
                amount: 1, payment_status: 1, paid_at: 1,
                note: 1, updated_by: 1, created_at: 1, updated_at: 1,
                updated_by_name: '$user_info.full_name'
            }},
            { $sort: { id: -1 } },
            { $limit: 1 }
        ];

        const payment_res = await db.collection('payments').aggregate(pipeline_payment).toArray();
        const payment = payment_res[0] || null;

        // Determine current payment status
        function getPaymentText(ps) {
            ps = (ps || '').toString().trim();
            if (!ps || ps === 'Đang chờ' || ps === 'Thất bại' || ps === 'Hoàn tiền') return 'Chưa thanh toán';
            return ps;
        }

        let current_payment_status = 'Chưa thanh toán';
        if (payment && payment.payment_status) {
            current_payment_status = getPaymentText(payment.payment_status);
        } else {
            current_payment_status = getPaymentText(order.payment_status);
        }

        res.render('staff/orders/detail', {
            order,
            items,
            payment,
            current_payment_status
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// POST /staff/orders/confirm - Confirm order
router.post('/orders/confirm', async (req, res) => {
    try {
        const db = getDb();
        const order_id = Number(req.body.order_id);

        if (!order_id || order_id <= 0) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('ID đơn hàng không hợp lệ'));
        }

        const order = await db.collection('orders').findOne({ id: order_id });
        if (!order) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        if (order.order_status !== 'Chờ xác nhận') {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Chỉ có thể xác nhận đơn đang chờ xác nhận'));
        }

        await db.collection('orders').updateOne(
            { id: order_id },
            { $set: { order_status: 'Đã xác nhận', updated_at: new Date() } }
        );

        res.redirect(`/staff/orders/detail?id=${order_id}&success=` + encodeURIComponent('Đã xác nhận đơn hàng'));
    } catch (err) {
        console.error(err);
        res.redirect(`/staff/orders/detail?id=${req.body.order_id}&error=` + encodeURIComponent('Không thể xác nhận đơn hàng'));
    }
});

// POST /staff/orders/cancel - Cancel order
router.post('/orders/cancel', async (req, res) => {
    const order_id = Number(req.body.order_id);
    try {
        const db = getDb();
        const cancel_reason = (req.body.cancel_reason || '').trim();
        const staff_id = Number(req.session.user_id);

        if (!order_id || order_id <= 0) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('ID đơn hàng không hợp lệ'));
        }

        if (!cancel_reason) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Vui lòng nhập lý do hủy đơn'));
        }

        const order = await db.collection('orders').findOne({ id: order_id });
        if (!order) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        const allowed = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
        if (!allowed.includes(order.order_status)) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Không thể hủy đơn hàng ở trạng thái hiện tại'));
        }

        // Restore stock quantity
        const items = await db.collection('order_items').find({ order_id }).toArray();
        for (const item of items) {
            await db.collection('products').updateOne(
                { id: Number(item.product_id) },
                { $inc: { stock_quantity: Number(item.quantity) } }
            );
        }

        // Determine new payment status
        let new_payment_status = order.payment_status;
        let payment_note = 'Đơn hàng đã hủy';
        if (order.payment_status === 'Đã thanh toán') {
            new_payment_status = 'Hoàn tiền';
            payment_note = 'Đơn hàng đã hủy, cần hoàn tiền';
        } else {
            new_payment_status = 'Thất bại';
        }

        // Update order
        await db.collection('orders').updateOne(
            { id: order_id },
            { $set: {
                order_status: 'Đã hủy',
                payment_status: new_payment_status,
                cancelled_by: staff_id,
                cancel_reason,
                updated_at: new Date()
            }}
        );

        // Update payment
        await db.collection('payments').updateOne(
            { order_id },
            { $set: {
                payment_status: new_payment_status,
                note: payment_note,
                updated_by: staff_id,
                updated_at: new Date()
            }},
            { upsert: true }
        );

        res.redirect(`/staff/orders/detail?id=${order_id}&success=` + encodeURIComponent('Đã hủy đơn hàng'));
    } catch (err) {
        console.error(err);
        res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent(err.message));
    }
});

// POST /staff/orders/update-status - Update order status
router.post('/orders/update-status', async (req, res) => {
    const order_id = Number(req.body.order_id);
    try {
        const db = getDb();
        const new_status = (req.body.order_status || '').trim();

        const allowed = ['Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hoàn thành', 'Đã hủy'];

        if (!order_id || order_id <= 0 || !new_status) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        if (!allowed.includes(new_status)) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Trạng thái đơn hàng không hợp lệ'));
        }

        const order = await db.collection('orders').findOne({ id: order_id });
        if (!order) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        if (order.order_status === 'Đã hủy') {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Đơn hàng đã hủy, không thể cập nhật'));
        }

        if (order.order_status === 'Đã hoàn thành') {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Đơn hàng đã hoàn thành, không thể cập nhật'));
        }

        await db.collection('orders').updateOne(
            { id: order_id },
            { $set: { order_status: new_status, updated_at: new Date() } }
        );

        res.redirect(`/staff/orders/detail?id=${order_id}&success=` + encodeURIComponent('Đã cập nhật trạng thái đơn hàng'));
    } catch (err) {
        console.error(err);
        res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Không thể cập nhật trạng thái đơn hàng'));
    }
});

// POST /staff/orders/update-payment - Update payment status
router.post('/orders/update-payment', async (req, res) => {
    const order_id = Number(req.body.order_id);
    try {
        const db = getDb();
        const payment_status = (req.body.payment_status || '').trim();
        const note = (req.body.note || '').trim();
        const staff_id = Number(req.session.user_id);

        const allowed = ['Chưa thanh toán', 'Đã thanh toán', 'Thất bại', 'Hoàn tiền'];

        if (!order_id || order_id <= 0 || !payment_status) {
            return res.redirect('/staff/orders?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        if (!allowed.includes(payment_status)) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Trạng thái thanh toán không hợp lệ'));
        }

        const order = await db.collection('orders').findOne({ id: order_id });
        if (!order) {
            return res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        // Update order's payment_status
        await db.collection('orders').updateOne(
            { id: order_id },
            { $set: { payment_status, updated_at: new Date() } }
        );

        // Update payments collection
        const payment_updates = {
            payment_status,
            note,
            updated_by: staff_id,
            updated_at: new Date()
        };

        if (payment_status === 'Đã thanh toán') {
            payment_updates.paid_at = new Date();
        }

        await db.collection('payments').updateOne(
            { order_id },
            { $set: payment_updates },
            { upsert: true }
        );

        res.redirect(`/staff/orders/detail?id=${order_id}&success=` + encodeURIComponent('Đã cập nhật trạng thái thanh toán'));
    } catch (err) {
        console.error(err);
        res.redirect(`/staff/orders/detail?id=${order_id}&error=` + encodeURIComponent(err.message));
    }
});

// ==============================
// CHAT MANAGEMENT
// ==============================

// GET /staff/chat - Chat conversation list
router.get('/chat', async (req, res) => {
    try {
        const db = getDb();
        const staff_id = req.session.user_id;

        const pipeline = [
            { $match: { status: 'open' } },
            { $lookup: {
                from: 'users',
                localField: 'customer_id',
                foreignField: 'id',
                as: 'customer_info'
            }},
            { $unwind: {
                path: '$customer_info',
                preserveNullAndEmptyArrays: true
            }},
            { $lookup: {
                from: 'chat_messages',
                let: { conv_id: '$id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$conversation_id', '$$conv_id'] } } },
                    { $sort: { id: -1 } },
                    { $limit: 1 }
                ],
                as: 'last_msg_info'
            }},
            { $unwind: {
                path: '$last_msg_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1,
                customer_id: 1,
                staff_id: 1,
                status: 1,
                updated_at: 1,
                customer_name: '$customer_info.full_name',
                last_message: '$last_msg_info.message'
            }},
            { $sort: { updated_at: -1, id: -1 } }
        ];

        const conversations = await db.collection('chat_conversations').aggregate(pipeline).toArray();

        res.render('staff/chat/index', { conversations, staff_id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// GET /staff/chat/detail - Chat detail page
router.get('/chat/detail', async (req, res) => {
    try {
        const db = getDb();
        const conversation_id = Number(req.query.id);
        const staff_id = req.session.user_id;

        if (!conversation_id || conversation_id <= 0) {
            return res.redirect('/staff/chat');
        }

        const conversation = await db.collection('chat_conversations').findOne({ id: conversation_id });
        if (!conversation) {
            return res.redirect('/staff/chat');
        }

        // Get customer info
        const customer = await db.collection('users').findOne({ id: conversation.customer_id });
        conversation.customer_name = customer ? customer.full_name : '';

        // Auto-assign if no staff assigned
        if (!conversation.staff_id) {
            await db.collection('chat_conversations').updateOne(
                { id: conversation_id, staff_id: null },
                { $set: { staff_id } }
            );
            conversation.staff_id = staff_id;
        } else if (Number(conversation.staff_id) !== Number(staff_id)) {
            return res.render('staff/chat/access_denied', { conversation_id });
        }

        // Mark messages as read
        await db.collection('chat_messages').updateMany(
            {
                conversation_id,
                sender_id: { $ne: staff_id },
                is_read: 0
            },
            { $set: { is_read: 1 } }
        );

        res.render('staff/chat/detail', { conversation, conversation_id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
});

// GET /staff/chat/fetch - Fetch messages API (returns HTML)
router.get('/chat/fetch', async (req, res) => {
    try {
        const db = getDb();
        const conversation_id = Number(req.query.conversation_id);
        const staff_id = req.session.user_id;

        const conversation = await db.collection('chat_conversations').findOne({ id: conversation_id });
        if (!conversation) {
            return res.send('Không có dữ liệu.');
        }

        if (conversation.staff_id && Number(conversation.staff_id) !== Number(staff_id)) {
            return res.send('Cuộc trò chuyện này đã được nhân viên khác phụ trách.');
        }

        // Mark customer messages as read
        await db.collection('chat_messages').updateMany(
            {
                conversation_id,
                sender_id: { $ne: staff_id },
                is_read: 0
            },
            { $set: { is_read: 1 } }
        );

        const pipeline = [
            { $match: { conversation_id } },
            { $lookup: {
                from: 'users',
                localField: 'sender_id',
                foreignField: 'id',
                as: 'sender_info'
            }},
            { $unwind: {
                path: '$sender_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1,
                conversation_id: 1,
                sender_id: 1,
                message: 1,
                created_at: 1,
                full_name: '$sender_info.full_name',
                role: '$sender_info.role'
            }},
            { $sort: { id: 1 } }
        ];

        const messages = await db.collection('chat_messages').aggregate(pipeline).toArray();

        if (messages.length === 0) {
            return res.send('<p>Chưa có tin nhắn nào.</p>');
        }

        let html = '';
        for (const row of messages) {
            const is_me = (Number(row.sender_id) === Number(staff_id));
            const align = is_me ? 'right' : 'left';
            const bg = is_me ? '#d1e7dd' : '#e2e3e5';
            const name = row.full_name || '';
            const msg = (row.message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            const date = formatDate(row.created_at);

            html += `<div style="margin-bottom:10px; text-align:${align};">`;
            html += `<div style="display:inline-block; max-width:70%; padding:10px; border-radius:8px; background:${bg};">`;
            html += `<strong>${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong><br>`;
            html += `${msg}<br>`;
            html += `<small style="color:#666;">${date}</small>`;
            html += `</div></div>`;
        }

        res.send(html);
    } catch (err) {
        console.error(err);
        res.send('<p style="color:red;">Không tải được tin nhắn.</p>');
    }
});

// POST /staff/chat/send - Send message API
router.post('/chat/send', async (req, res) => {
    try {
        const db = getDb();
        const conversation_id = Number(req.body.conversation_id);
        const message = (req.body.message || '').trim();
        const sender_id = req.session.user_id;

        if (!conversation_id || conversation_id <= 0 || !message) {
            return res.send('invalid');
        }

        const conversation = await db.collection('chat_conversations').findOne({ id: conversation_id });
        if (!conversation) {
            return res.send('invalid');
        }

        // Auto-assign if no staff
        if (!conversation.staff_id) {
            await db.collection('chat_conversations').updateOne(
                { id: conversation_id, staff_id: null },
                { $set: { staff_id: sender_id } }
            );
        } else if (Number(conversation.staff_id) !== Number(sender_id)) {
            return res.send('invalid');
        }

        // Insert message
        const msg_id = await getNextId('chat_messages');
        const insertResult = await db.collection('chat_messages').insertOne({
            id: msg_id,
            numeric_id: msg_id,
            conversation_id,
            sender_id,
            message,
            is_read: 0,
            created_at: new Date()
        });

        if (insertResult.insertedId) {
            // Update conversation timestamp
            await db.collection('chat_conversations').updateOne(
                { id: conversation_id },
                { $set: { updated_at: new Date() } }
            );
            res.send('success');
        } else {
            res.send('error');
        }
    } catch (err) {
        console.error(err);
        res.send('error');
    }
});

// GET /staff/chat/assign - Assign chat to staff
router.get('/chat/assign', async (req, res) => {
    try {
        const db = getDb();
        const id = Number(req.query.id);
        const staff_id = req.session.user_id;

        if (!id || id <= 0) {
            return res.redirect('/staff/chat');
        }

        await db.collection('chat_conversations').updateOne(
            { id, staff_id: null },
            { $set: { staff_id } }
        );

        res.redirect('/staff/chat/detail?id=' + id);
    } catch (err) {
        console.error(err);
        res.redirect('/staff/chat');
    }
});

module.exports = router;
