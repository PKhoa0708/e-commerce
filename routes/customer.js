const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getDb, getNextId } = require('../database/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Apply auth and customer role check to all customer routes
router.use(authMiddleware);
router.use(roleMiddleware(['customer']));

// Configure multer storage for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar_${req.session.user_id}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP'));
        }
    }
});

// GET /customer/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const category_id = Number(req.query.category_id || 0);

        const db = getDb();

        // Get categories list
        const categories = await db.collection('categories')
            .find({ status: 1 })
            .sort({ id: -1 })
            .toArray();

        // Build product search criteria
        const match = { status: 'active' };
        if (keyword !== '') {
            match.name = new RegExp(keyword, 'i');
        }
        if (category_id > 0) {
            match.category_id = category_id;
        }

        const pipeline = [
            { $match: match },
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
                sku: 1,
                description: 1,
                price: 1,
                stock_quantity: 1,
                thumbnail: 1,
                status: 1,
                category_id: 1,
                created_at: 1,
                updated_at: 1,
                category_name: '$category_info.name',
                is_out_of_stock: {
                    $cond: [
                        { $eq: ['$stock_quantity', 0] },
                        1,
                        0
                    ]
                }
            }},
            { $sort: {
                is_out_of_stock: 1,
                id: -1
            }}
        ];

        const products = await db.collection('products').aggregate(pipeline).toArray();

        res.render('customer/dashboard', {
            categories,
            products,
            keyword,
            category_id
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/profile
router.get('/profile', async (req, res) => {
    try {
        const db = getDb();
        const user = await db.collection('users').findOne({ id: req.session.user_id });
        if (!user) {
            return res.redirect('/customer/dashboard?error=' + encodeURIComponent('Không tìm thấy thông tin tài khoản'));
        }

        res.render('customer/profile', {
            user,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/profile/edit
router.get('/profile/edit', async (req, res) => {
    try {
        const db = getDb();
        const user = await db.collection('users').findOne({ id: req.session.user_id });
        if (!user) {
            return res.redirect('/customer/dashboard?error=' + encodeURIComponent('Không tìm thấy thông tin tài khoản'));
        }

        res.render('customer/update_profile', {
            user,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/profile/edit
router.post('/profile/edit', (req, res) => {
    upload.single('avatar')(req, res, async function (err) {
        if (err) {
            return res.redirect('/customer/profile/edit?error=' + encodeURIComponent(err.message));
        }

        try {
            const full_name = (req.body.full_name || '').trim();
            const phone = (req.body.phone || '').trim();
            const address = (req.body.address || '').trim();

            const db = getDb();
            const user = await db.collection('users').findOne({ id: req.session.user_id });
            if (!user) {
                return res.redirect('/customer/dashboard?error=' + encodeURIComponent('Không tìm thấy tài khoản'));
            }

            if (full_name === '') {
                return res.redirect('/customer/profile/edit?error=' + encodeURIComponent('Vui lòng nhập họ tên'));
            }

            const phoneRegex = /^[0-9+\-\s]{8,20}$/;
            if (phone !== '' && !phoneRegex.test(phone)) {
                return res.redirect('/customer/profile/edit?error=' + encodeURIComponent('Số điện thoại không hợp lệ'));
            }

            if (address.length > 255) {
                return res.redirect('/customer/profile/edit?error=' + encodeURIComponent('Địa chỉ tối đa 255 ký tự'));
            }

            let avatarPath = user.avatar;
            if (req.file) {
                avatarPath = 'uploads/avatars/' + req.file.filename;
            }

            const updateResult = await db.collection('users').updateOne(
                { id: req.session.user_id },
                { $set: {
                    full_name: full_name,
                    phone: phone,
                    address: address,
                    avatar: avatarPath,
                    updated_at: new Date()
                }}
            );

            if (updateResult.matchedCount > 0) {
                req.session.full_name = full_name;
                return res.redirect('/customer/profile?success=' + encodeURIComponent('Cập nhật thông tin thành công'));
            } else {
                return res.redirect('/customer/profile/edit?error=' + encodeURIComponent('Không thể cập nhật thông tin'));
            }
        } catch (dbErr) {
            console.error(dbErr);
            return res.redirect('/customer/profile/edit?error=' + encodeURIComponent('Lỗi hệ thống: ' + dbErr.message));
        }
    });
});


// GET /customer/products
router.get('/products', async (req, res) => {
    try {
        const keyword = (req.query.keyword || '').trim();
        const db = getDb();
        
        const filter = { status: 'active' };
        if (keyword !== '') {
            filter.name = new RegExp(keyword, 'i');
        }

        const pipeline = [
            { $match: filter },
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
                price: 1,
                stock_quantity: 1,
                thumbnail: 1,
                status: 1,
                category_name: '$category_info.name'
            }},
            { $sort: { id: -1 } }
        ];

        const products = await db.collection('products').aggregate(pipeline).toArray();

        res.render('customer/products/index', {
            products,
            keyword,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/products/detail
router.get('/products/detail', async (req, res) => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id)) {
            return res.redirect('/customer/products');
        }

        const db = getDb();
        const product = await db.collection('products').findOne({ id: id, status: 'active' });

        if (!product) {
            return res.redirect('/customer/products');
        }

        const category = await db.collection('categories').findOne({ id: product.category_id });
        product.category_name = category ? category.name : '';

        const images = await db.collection('product_images')
            .find({ product_id: id })
            .sort({ is_main: -1, id: 1 })
            .toArray();

        if (images.length === 0 && product.thumbnail) {
            images.push({
                image_path: product.thumbnail,
                is_main: 1
            });
        }

        res.render('customer/products/detail', {
            product,
            images,
            price: Number(product.price),
            stock_quantity: Number(product.stock_quantity),
            success: req.query.success || null,
            error: req.query.error || null,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});


// GET /customer/cart
router.get('/cart', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const db = getDb();
        
        // Find or create cart for user
        let cart = await db.collection('carts').findOne({ user_id: user_id });
        if (!cart) {
            const cart_id = await getNextId('carts');
            cart = {
                id: cart_id,
                numeric_id: cart_id,
                user_id: user_id
            };
            await db.collection('carts').insertOne(cart);
        }

        const pipeline = [
            { $match: { cart_id: Number(cart.id) } },
            { $lookup: {
                from: 'products',
                localField: 'product_id',
                foreignField: 'id',
                as: 'product_info'
            }},
            { $unwind: {
                path: '$product_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                cart_item_id: '$id',
                quantity: 1,
                product_id: '$product_info.id',
                price: '$product_info.price',
                stock_quantity: '$product_info.stock_quantity',
                thumbnail: '$product_info.thumbnail'
            }},
            { $sort: { cart_item_id: -1 } }
        ];

        const cart_items = await db.collection('cart_items').aggregate(pipeline).toArray();

        res.render('customer/cart', {
            cart_items,
            success: req.query.success || null,
            error: req.query.error || null,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/cart/add
router.post('/cart/add', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const product_id = Number(req.body.product_id || 0);
        const quantity = Number(req.body.quantity || 1);
        const action = (req.body.action || 'cart').trim();
        const mode = (req.body.mode || '').trim();
        
        const isBuyNow = mode === 'buy_now' || action === 'buy';

        const detail_redirect = `/customer/products/detail?id=${product_id}`;
        const dashboard_redirect = `/customer/dashboard`;

        if (product_id <= 0 || quantity <= 0) {
            return res.redirect(dashboard_redirect + '?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        const db = getDb();
        const product = await db.collection('products').findOne({ id: product_id });

        if (!product) {
            return res.redirect(dashboard_redirect + '?error=' + encodeURIComponent('Không tìm thấy sản phẩm'));
        }

        if (product.status !== 'active') {
            return res.redirect(detail_redirect + '&error=' + encodeURIComponent('Sản phẩm hiện không khả dụng'));
        }

        if (Number(product.stock_quantity) < quantity) {
            return res.redirect(detail_redirect + '&error=' + encodeURIComponent('Số lượng vượt quá tồn kho'));
        }

        // Get cart
        let cart = await db.collection('carts').findOne({ user_id: user_id });
        let cart_id;
        if (!cart) {
            cart_id = await getNextId('carts');
            await db.collection('carts').insertOne({
                id: cart_id,
                numeric_id: cart_id,
                user_id: user_id
            });
        } else {
            cart_id = Number(cart.id);
        }

        // Check if item already in cart
        const cartItem = await db.collection('cart_items').findOne({ cart_id: cart_id, product_id: product_id });

        if (cartItem) {
            const new_quantity = Number(cartItem.quantity) + quantity;

            if (new_quantity > Number(product.stock_quantity)) {
                return res.redirect(detail_redirect + '&error=' + encodeURIComponent('Tổng số lượng trong giỏ vượt quá tồn kho'));
            }

            await db.collection('cart_items').updateOne(
                { id: Number(cartItem.id) },
                { $set: { quantity: new_quantity } }
            );
        } else {
            const item_id = await getNextId('cart_items');
            await db.collection('cart_items').insertOne({
                id: item_id,
                numeric_id: item_id,
                cart_id: cart_id,
                product_id: product_id,
                quantity: quantity
            });
        }

        if (isBuyNow) {
            return res.redirect('/customer/cart?success=' + encodeURIComponent('Đã thêm sản phẩm, vui lòng tiếp tục mua hàng'));
        } else {
            return res.redirect(detail_redirect + '&success=' + encodeURIComponent('Đã thêm sản phẩm vào giỏ hàng'));
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/cart/update (ajax update quantity)
router.post('/cart/update', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const cart_item_id = Number(req.body.cart_item_id || 0);
        const action = (req.body.action || '').trim();

        if (cart_item_id <= 0 || !['increase', 'decrease'].includes(action)) {
            return res.json({
                success: false,
                message: 'Dữ liệu không hợp lệ'
            });
        }

        const db = getDb();
        
        // Find cart item and ensure it belongs to the active user's cart
        const pipeline = [
            { $match: { id: cart_item_id } },
            { $lookup: {
                from: 'carts',
                localField: 'cart_id',
                foreignField: 'id',
                as: 'cart_info'
            }},
            { $unwind: {
                path: '$cart_info',
                preserveNullAndEmptyArrays: true
            }},
            { $match: { 'cart_info.user_id': user_id } },
            { $lookup: {
                from: 'products',
                localField: 'product_id',
                foreignField: 'id',
                as: 'product_info'
            }},
            { $unwind: {
                path: '$product_info',
                preserveNullAndEmptyArrays: true
            }},
            { $project: {
                id: 1,
                quantity: 1,
                price: '$product_info.price',
                stock_quantity: '$product_info.stock_quantity'
            }}
        ];

        const items = await db.collection('cart_items').aggregate(pipeline).toArray();

        if (items.length === 0) {
            return res.json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ'
            });
        }

        const item = items[0];
        const current_quantity = Number(item.quantity);
        const stock_quantity = Number(item.stock_quantity);
        const price = Number(item.price);

        let new_quantity = current_quantity;

        if (action === 'increase') {
            new_quantity = current_quantity + 1;
            if (new_quantity > stock_quantity) {
                return res.json({
                    success: false,
                    message: 'Số lượng vượt quá tồn kho'
                });
            }
        } else if (action === 'decrease') {
            new_quantity = current_quantity - 1;
            if (new_quantity < 1) {
                new_quantity = 1;
            }
        }

        await db.collection('cart_items').updateOne(
            { id: cart_item_id },
            { $set: { quantity: new_quantity } }
        );

        return res.json({
            success: true,
            message: 'Cập nhật số lượng thành công',
            cart_item_id: cart_item_id,
            quantity: new_quantity,
            price: price,
            subtotal: price * new_quantity
        });
    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: 'Lỗi hệ thống: ' + err.message
        });
    }
});

// GET /customer/cart/remove
router.get('/cart/remove', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const cart_item_id = Number(req.query.cart_item_id || 0);

        if (cart_item_id <= 0) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        const db = getDb();

        // Check if item belongs to the user
        const pipeline = [
            { $match: { id: cart_item_id } },
            { $lookup: {
                from: 'carts',
                localField: 'cart_id',
                foreignField: 'id',
                as: 'cart_info'
            }},
            { $unwind: {
                path: '$cart_info',
                preserveNullAndEmptyArrays: true
            }},
            { $match: { 'cart_info.user_id': user_id } },
            { $project: { id: 1 } }
        ];

        const items = await db.collection('cart_items').aggregate(pipeline).toArray();

        if (items.length === 0) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Không tìm thấy sản phẩm trong giỏ'));
        }

        const deleteResult = await db.collection('cart_items').deleteOne({ id: cart_item_id });

        if (deleteResult.deletedCount > 0) {
            return res.redirect('/customer/cart?success=' + encodeURIComponent('Đã xóa sản phẩm khỏi giỏ hàng'));
        } else {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Xóa thất bại'));
        }
    } catch (err) {
        console.error(err);
        return res.redirect('/customer/cart?error=' + encodeURIComponent('Lỗi hệ thống: ' + err.message));
    }
});

// POST /customer/checkout
router.post('/checkout', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const mode = (req.body.mode || 'cart').trim();
        const db = getDb();

        const user = await db.collection('users').findOne({ id: user_id });
        if (!user) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Không tìm thấy thông tin người dùng'));
        }

        let items = [];
        let subtotal = 0;

        if (mode === 'buy_now') {
            const product_id = Number(req.body.product_id || 0);
            const quantity = Number(req.body.quantity || 1);

            if (product_id <= 0 || quantity <= 0) {
                return res.redirect('/customer/products?error=' + encodeURIComponent('Dữ liệu mua ngay không hợp lệ'));
            }

            const product = await db.collection('products').findOne({ id: product_id });
            if (!product) {
                return res.redirect('/customer/products?error=' + encodeURIComponent('Không tìm thấy sản phẩm'));
            }

            if (product.status !== 'active') {
                return res.redirect(`/customer/products/detail?id=${product_id}&error=` + encodeURIComponent('Sản phẩm hiện không khả dụng'));
            }

            if (quantity > Number(product.stock_quantity)) {
                return res.redirect(`/customer/products/detail?id=${product_id}&error=` + encodeURIComponent('Số lượng vượt quá tồn kho'));
            }

            const line_subtotal = Number(product.price) * quantity;
            subtotal += line_subtotal;

            items.push({
                source: 'buy_now',
                cart_item_id: 0,
                product_id: Number(product.id),
                name: product.name,
                price: Number(product.price),
                quantity: quantity,
                thumbnail: product.thumbnail || '',
                subtotal: line_subtotal
            });
        } else {
            // Cart checkout
            let selected_items = req.body.selected_items || req.body['selected_items[]'] || [];
            if (!Array.isArray(selected_items)) {
                selected_items = [selected_items];
            }

            if (selected_items.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Vui lòng chọn ít nhất 1 sản phẩm'));
            }

            const selected_ids = selected_items.map(Number).filter(id => !isNaN(id) && id > 0);

            if (selected_ids.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
            }

            const cart = await db.collection('carts').findOne({ user_id: user_id });
            if (!cart) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Không tìm thấy giỏ hàng'));
            }

            const cart_id = Number(cart.id);

            const pipeline = [
                { $match: {
                    cart_id: cart_id,
                    id: { $in: selected_ids }
                }},
                { $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'id',
                    as: 'product_info'
                }},
                { $unwind: {
                    path: '$product_info',
                    preserveNullAndEmptyArrays: true
                }},
                { $project: {
                    cart_item_id: '$id',
                    quantity: 1,
                    product_id: '$product_info.id',
                    name: '$product_info.name',
                    price: '$product_info.price',
                    stock_quantity: '$product_info.stock_quantity',
                    thumbnail: '$product_info.thumbnail'
                }},
                { $sort: { cart_item_id: -1 } }
            ];

            const dbItems = await db.collection('cart_items').aggregate(pipeline).toArray();

            for (let row of dbItems) {
                const line_subtotal = Number(row.price) * Number(row.quantity);
                items.push({
                    source: 'cart',
                    cart_item_id: Number(row.cart_item_id),
                    product_id: Number(row.product_id),
                    name: row.name,
                    price: Number(row.price),
                    quantity: Number(row.quantity),
                    thumbnail: row.thumbnail || '',
                    subtotal: line_subtotal
                });
                subtotal += line_subtotal;
            }

            if (items.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Không có sản phẩm hợp lệ để đặt hàng'));
            }
        }

        const free_ship_threshold = 200000;
        const shipping_fee = (subtotal >= free_ship_threshold) ? 0 : 30000;
        const total_amount = subtotal + shipping_fee;
        const needed_amount = Math.max(0, free_ship_threshold - subtotal);

        res.render('customer/checkout', {
            mode,
            items,
            user,
            subtotal,
            shipping_fee,
            total_amount,
            needed_amount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/place-order
router.post('/place-order', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const mode = (req.body.mode || 'cart').trim();

        const recipient_name = (req.body.recipient_name || '').trim();
        const recipient_phone = (req.body.recipient_phone || '').trim();
        const shipping_address = (req.body.shipping_address || '').trim();
        const payment_method = (req.body.payment_method || '').trim();

        const allowed_payment_methods = ['cod', 'bank_transfer', 'momo'];

        if (recipient_name === '') {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Vui lòng nhập họ tên người nhận'));
        }
        if (recipient_phone === '') {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Vui lòng nhập số điện thoại người nhận'));
        }
        if (shipping_address === '') {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Vui lòng nhập địa chỉ giao hàng'));
        }
        if (!allowed_payment_methods.includes(payment_method)) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Phương thức thanh toán không hợp lệ'));
        }

        const db = getDb();
        let items = [];
        let subtotal = 0;
        let cart_id = 0;

        if (mode === 'buy_now') {
            const product_id = Number(req.body.product_id || 0);
            const quantity = Number(req.body.quantity || 1);

            if (product_id <= 0 || quantity <= 0) {
                return res.redirect('/customer/products?error=' + encodeURIComponent('Dữ liệu mua ngay không hợp lệ'));
            }

            const product = await db.collection('products').findOne({ id: product_id });
            if (!product) {
                return res.redirect('/customer/products?error=' + encodeURIComponent('Không tìm thấy sản phẩm'));
            }

            if (product.status !== 'active') {
                return res.redirect(`/customer/products/detail?id=${product_id}&error=` + encodeURIComponent('Sản phẩm hiện không còn khả dụng'));
            }

            if (quantity > Number(product.stock_quantity)) {
                return res.redirect(`/customer/products/detail?id=${product_id}&error=` + encodeURIComponent('Số lượng vượt quá tồn kho'));
            }

            const line_total = Number(product.price) * quantity;
            subtotal += line_total;

            items.push({
                source: 'buy_now',
                cart_item_id: 0,
                product_id: Number(product.id),
                name: product.name,
                price: Number(product.price),
                quantity: quantity,
                line_total: line_total
            });
        } else {
            // Cart mode
            let selected_items = req.body['selected_items[]'] || req.body.selected_items || [];
            if (!Array.isArray(selected_items)) {
                selected_items = [selected_items];
            }

            if (selected_items.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Vui lòng chọn sản phẩm để đặt hàng'));
            }

            const selected_ids = selected_items.map(Number).filter(id => !isNaN(id) && id > 0);

            if (selected_ids.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Dữ liệu sản phẩm không hợp lệ'));
            }

            const cart = await db.collection('carts').findOne({ user_id: user_id });
            if (!cart) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Không tìm thấy giỏ hàng'));
            }

            cart_id = Number(cart.id);

            const pipeline = [
                { $match: {
                    cart_id: cart_id,
                    id: { $in: selected_ids }
                }},
                { $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'id',
                    as: 'product_info'
                }},
                { $unwind: {
                    path: '$product_info',
                    preserveNullAndEmptyArrays: true
                }},
                { $project: {
                    cart_item_id: '$id',
                    quantity: 1,
                    product_id: '$product_info.id',
                    name: '$product_info.name',
                    price: '$product_info.price',
                    stock_quantity: '$product_info.stock_quantity',
                    status: '$product_info.status'
                }},
                { $sort: { cart_item_id: -1 } }
            ];

            const dbItems = await db.collection('cart_items').aggregate(pipeline).toArray();

            for (let row of dbItems) {
                if (row.status !== 'active') {
                    return res.redirect('/customer/cart?error=' + encodeURIComponent('Có sản phẩm hiện không còn khả dụng'));
                }

                if (Number(row.quantity) > Number(row.stock_quantity)) {
                    return res.redirect('/customer/cart?error=' + encodeURIComponent('Có sản phẩm vượt quá tồn kho'));
                }

                const line_total = Number(row.price) * Number(row.quantity);
                items.push({
                    source: 'cart',
                    cart_item_id: Number(row.cart_item_id),
                    product_id: Number(row.product_id),
                    name: row.name,
                    price: Number(row.price),
                    quantity: Number(row.quantity),
                    line_total: line_total
                });
                subtotal += line_total;
            }

            if (items.length === 0) {
                return res.redirect('/customer/cart?error=' + encodeURIComponent('Không có sản phẩm hợp lệ để đặt hàng'));
            }
        }

        const free_ship_threshold = 200000;
        const shipping_fee = (subtotal >= free_ship_threshold) ? 0 : 30000;
        const total_amount = subtotal + shipping_fee;

        const order_code = 'DH' + Math.floor(Date.now() / 1000);
        const order_id = await getNextId('orders');

        await db.collection('orders').insertOne({
            id: order_id,
            numeric_id: order_id,
            user_id: user_id,
            order_code: order_code,
            receiver_name: recipient_name,
            receiver_phone: recipient_phone,
            shipping_address: shipping_address,
            note: '',
            payment_method: payment_method,
            payment_status: 'Chưa thanh toán',
            order_status: 'Chờ xác nhận',
            subtotal: subtotal,
            shipping_fee: shipping_fee,
            total_amount: total_amount,
            created_at: new Date(),
            updated_at: new Date()
        });

        for (let item of items) {
            const order_item_id = await getNextId('order_items');
            await db.collection('order_items').insertOne({
                id: order_item_id,
                numeric_id: order_item_id,
                order_id: order_id,
                product_id: item.product_id,
                product_name: item.name,
                product_price: item.price,
                quantity: item.quantity,
                subtotal: item.line_total
            });

            // Update product stock
            const updateResult = await db.collection('products').updateOne(
                { id: item.product_id, stock_quantity: { $gte: item.quantity } },
                { $inc: { stock_quantity: -item.quantity } }
            );

            if (updateResult.modifiedCount <= 0) {
                throw new Error("Không thể cập nhật tồn kho sản phẩm ID: " + item.product_id);
            }

            // Remove from cart if item source is cart
            if (mode === 'cart' && item.cart_item_id > 0 && cart_id > 0) {
                await db.collection('cart_items').deleteOne({ id: item.cart_item_id, cart_id: cart_id });
            }
        }

        // Create payment record
        const payment_id = await getNextId('payments');
        await db.collection('payments').insertOne({
            id: payment_id,
            numeric_id: payment_id,
            order_id: order_id,
            payment_method: payment_method,
            amount: total_amount,
            payment_status: 'Chưa thanh toán',
            paid_at: null,
            note: 'Chưa thanh toán',
            created_at: new Date()
        });

        return res.redirect(`/customer/order-success?order_id=${order_id}`);
    } catch (err) {
        console.error(err);
        if (mode === 'buy_now') {
            const product_id = Number(req.body.product_id || 0);
            return res.redirect(`/customer/products/detail?id=${product_id}&error=` + encodeURIComponent(err.message));
        } else {
            return res.redirect('/customer/cart?error=' + encodeURIComponent(err.message));
        }
    }
});

// GET /customer/order-success
router.get('/order-success', async (req, res) => {
    try {
        const order_id = Number(req.query.order_id || 0);
        const user_id = req.session.user_id;

        if (order_id <= 0) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Mã đơn hàng không hợp lệ'));
        }

        const db = getDb();
        const order = await db.collection('orders').findOne({ id: order_id, user_id: user_id });

        if (!order) {
            return res.redirect('/customer/cart?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        const order_items = await db.collection('order_items')
            .find({ order_id: order_id })
            .sort({ id: 1 })
            .toArray();

        res.render('customer/order_success', {
            order,
            order_items,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/orders
router.get('/orders', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const status_filter = (req.query.status || '').trim();
        const keyword = (req.query.keyword || '').trim();

        const db = getDb();
        const filter = { user_id: user_id };

        if (status_filter !== '') {
            filter.order_status = status_filter;
        }

        if (keyword !== '') {
            filter.$or = [
                { order_code: new RegExp(keyword, 'i') },
                { receiver_name: new RegExp(keyword, 'i') },
                { receiver_phone: new RegExp(keyword, 'i') }
            ];
        }

        const orders = await db.collection('orders')
            .find(filter)
            .sort({ id: -1 })
            .toArray();

        res.render('customer/orders', {
            orders,
            status_filter,
            keyword,
            success: req.query.success || null,
            error: req.query.error || null,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/orders/detail
router.get('/orders/detail', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const order_id = Number(req.query.id || 0);

        if (order_id <= 0) {
            return res.redirect('/customer/orders?error=' + encodeURIComponent('ID đơn hàng không hợp lệ'));
        }

        const db = getDb();
        const order = await db.collection('orders').findOne({ id: order_id, user_id: user_id });

        if (!order) {
            return res.redirect('/customer/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        const order_items = await db.collection('order_items')
            .find({ order_id: order_id })
            .sort({ id: 1 })
            .toArray();

        const payment = await db.collection('payments')
            .findOne({ order_id: order_id }, { sort: { id: -1 } });

        res.render('customer/order_detail', {
            order,
            order_items,
            payment,
            success: req.query.success || null,
            error: req.query.error || null,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/orders/cancel
router.post('/orders/cancel', async (req, res) => {
    let order_id = 0;
    try {
        const user_id = req.session.user_id;
        order_id = Number(req.body.order_id || 0);
        const cancel_reason = (req.body.cancel_reason || '').trim();

        if (order_id <= 0) {
            return res.redirect('/customer/orders?error=' + encodeURIComponent('ID đơn hàng không hợp lệ'));
        }

        if (cancel_reason === '') {
            return res.redirect(`/customer/orders/detail?id=${order_id}&error=` + encodeURIComponent('Vui lòng nhập lý do hủy đơn'));
        }

        const db = getDb();
        const order = await db.collection('orders').findOne({ id: order_id, user_id: user_id });

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        const allowed_cancel_status = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
        if (!allowed_cancel_status.includes(order.order_status)) {
            throw new Error('Đơn hàng này không thể hủy vì đã chuyển sang giai đoạn giao hàng');
        }

        const order_items = await db.collection('order_items').find({ order_id: order_id }).toArray();

        for (let item of order_items) {
            const product_id = Number(item.product_id);
            const quantity = Number(item.quantity);

            await db.collection('products').updateOne(
                { id: product_id },
                { $inc: { stock_quantity: quantity } }
            );
        }

        let new_payment_status = order.payment_status;
        let payment_note = 'Khách hàng đã hủy đơn';

        if (order.payment_status === 'Đã thanh toán') {
            new_payment_status = 'Hoàn tiền';
            payment_note = 'Khách hàng đã hủy đơn, cần hoàn tiền';
        } else {
            new_payment_status = 'Thất bại';
            payment_note = 'Khách hàng đã hủy đơn';
        }

        await db.collection('orders').updateOne(
            { id: order_id },
            { $set: {
                order_status: 'Đã hủy',
                payment_status: new_payment_status,
                cancelled_by: user_id,
                cancel_reason: cancel_reason,
                updated_at: new Date()
            }}
        );

        const payment = await db.collection('payments').findOne({ order_id: order_id });
        if (payment) {
            await db.collection('payments').updateOne(
                { order_id: order_id },
                { $set: {
                    payment_status: new_payment_status,
                    note: payment_note,
                    updated_at: new Date()
                }}
            );
        }

        return res.redirect(`/customer/orders/detail?id=${order_id}&success=` + encodeURIComponent('Hủy đơn hàng thành công'));
    } catch (err) {
        console.error(err);
        return res.redirect(`/customer/orders/detail?id=${order_id}&error=` + encodeURIComponent(err.message));
    }
});

// GET /customer/review
router.get('/review', async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const order_id = Number(req.query.order_id || 0);
        const product_id = Number(req.query.product_id || 0);

        if (order_id <= 0 || product_id <= 0) {
            return res.redirect('/customer/orders?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
        }

        const db = getDb();
        const order = await db.collection('orders').findOne({ id: order_id, user_id: user_id });

        if (!order) {
            return res.redirect('/customer/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng'));
        }

        const allowed_review_status = ['Đã giao', 'Đã hoàn thành'];
        if (!allowed_review_status.includes(order.order_status)) {
            return res.redirect(`/customer/orders/detail?id=${order_id}&error=` + encodeURIComponent('Chỉ được đánh giá khi đơn hàng đã giao hoặc hoàn thành'));
        }

        const product = await db.collection('order_items').findOne({ order_id: order_id, product_id: product_id });

        if (!product) {
            return res.redirect(`/customer/orders/detail?id=${order_id}&error=` + encodeURIComponent('Sản phẩm không thuộc đơn hàng này'));
        }

        const existing_review = await db.collection('reviews').findOne({
            user_id: user_id,
            order_id: order_id,
            product_id: product_id
        });

        res.render('customer/review_product', {
            order,
            product,
            order_id,
            product_id,
            existing_review,
            success: req.query.success || null,
            error: req.query.error || null,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// POST /customer/review/submit
router.post('/review/submit', async (req, res) => {
    const user_id = req.session.user_id;
    const order_id = Number(req.body.order_id || 0);
    const product_id = Number(req.body.product_id || 0);
    const rating = Number(req.body.rating || 0);
    const comment = (req.body.comment || '').trim();

    if (order_id <= 0 || product_id <= 0) {
        return res.redirect('/customer/orders?error=' + encodeURIComponent('Dữ liệu không hợp lệ'));
    }

    if (rating < 1 || rating > 5) {
        return res.redirect(`/customer/review?order_id=${order_id}&product_id=${product_id}&error=` + encodeURIComponent('Số sao phải từ 1 đến 5'));
    }

    if (comment === '') {
        return res.redirect(`/customer/review?order_id=${order_id}&product_id=${product_id}&error=` + encodeURIComponent('Vui lòng nhập nội dung đánh giá'));
    }

    if (comment.length > 1000) {
        return res.redirect(`/customer/review?order_id=${order_id}&product_id=${product_id}&error=` + encodeURIComponent('Nội dung đánh giá tối đa 1000 ký tự'));
    }

    try {
        const db = getDb();
        const order = await db.collection('orders').findOne({ id: order_id, user_id: user_id });

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        const allowed_review_status = ['Đã giao', 'Đã hoàn thành'];
        if (!allowed_review_status.includes(order.order_status)) {
            throw new Error('Chỉ được đánh giá khi đơn hàng đã giao hoặc hoàn thành');
        }

        const product = await db.collection('order_items').findOne({ order_id: order_id, product_id: product_id });
        if (!product) {
            throw new Error('Sản phẩm không thuộc đơn hàng này');
        }

        const existing_review = await db.collection('reviews').findOne({
            user_id: user_id,
            order_id: order_id,
            product_id: product_id
        });

        if (existing_review) {
            throw new Error('Bạn đã đánh giá sản phẩm này rồi');
        }

        const review_id = await getNextId('reviews');
        await db.collection('reviews').insertOne({
            id: review_id,
            numeric_id: review_id,
            user_id: user_id,
            product_id: product_id,
            order_id: order_id,
            rating: rating,
            comment: comment,
            created_at: new Date()
        });

        return res.redirect(`/customer/review?order_id=${order_id}&product_id=${product_id}&success=` + encodeURIComponent('Đánh giá sản phẩm thành công'));
    } catch (err) {
        console.error(err);
        return res.redirect(`/customer/review?order_id=${order_id}&product_id=${product_id}&error=` + encodeURIComponent(err.message));
    }
});

// GET /customer/chat
router.get('/chat', async (req, res) => {
    try {
        const customer_id = req.session.user_id;
        const db = getDb();

        // Find open conversation
        let conversation = await db.collection('chat_conversations').findOne({
            customer_id: customer_id,
            status: 'open'
        });

        let conversation_id;
        if (conversation) {
            conversation_id = Number(conversation.id);
        } else {
            conversation_id = await getNextId('chat_conversations');
            await db.collection('chat_conversations').insertOne({
                id: conversation_id,
                numeric_id: conversation_id,
                customer_id: customer_id,
                staff_id: null,
                status: 'open',
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Mark messages sender_id !== customer_id in this conversation as read
        await db.collection('chat_messages').updateMany(
            {
                conversation_id: conversation_id,
                sender_id: { $ne: customer_id },
                is_read: 0
            },
            { $set: { is_read: 1 } }
        );

        res.render('customer/chat/index', {
            conversation_id,
            db
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống: ' + err.message);
    }
});

// GET /customer/chat/fetch
router.get('/chat/fetch', async (req, res) => {
    try {
        const conversation_id = Number(req.query.conversation_id || 0);
        const customer_id = req.session.user_id;
        const db = getDb();

        const conversation = await db.collection('chat_conversations').findOne({
            id: conversation_id,
            customer_id: customer_id
        });

        if (!conversation) {
            return res.send('Không có dữ liệu.');
        }

        // Mark messages sender_id !== customer_id in this conversation as read
        await db.collection('chat_messages').updateMany(
            {
                conversation_id: conversation_id,
                sender_id: { $ne: customer_id },
                is_read: 0
            },
            { $set: { is_read: 1 } }
        );

        const pipeline = [
            { $match: { conversation_id: conversation_id } },
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
        const { formatDate } = require('../database/db');

        messages.forEach(row => {
            const is_me = Number(row.sender_id) === Number(customer_id);
            const align = is_me ? 'right' : 'left';
            const bg = is_me ? '#d1e7dd' : '#e2e3e5';
            const name = row.full_name || '';
            const msgText = (row.message || '').replace(/\n/g, '<br>');
            const timeStr = formatDate(row.created_at);

            html += `<div style="margin-bottom:10px; text-align:${align};">`;
            html += `<div style="display:inline-block; max-width:70%; padding:10px; border-radius:8px; background:${bg};">`;
            html += `<strong>${name}</strong><br>`;
            html += `${msgText}<br>`;
            html += `<small style="color:#666;">${timeStr}</small>`;
            html += `</div>`;
            html += `</div>`;
        });

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải tin nhắn: ' + err.message);
    }
});

// POST /customer/chat/send
router.post('/chat/send', async (req, res) => {
    try {
        const conversation_id = Number(req.body.conversation_id || 0);
        const message = (req.body.message || '').trim();
        const sender_id = req.session.user_id;

        if (conversation_id <= 0 || message === '') {
            return res.send('invalid');
        }

        const db = getDb();
        const conversation = await db.collection('chat_conversations').findOne({
            id: conversation_id,
            customer_id: sender_id
        });

        if (!conversation) {
            return res.send('invalid');
        }

        const msg_id = await getNextId('chat_messages');
        await db.collection('chat_messages').insertOne({
            id: msg_id,
            numeric_id: msg_id,
            conversation_id: conversation_id,
            sender_id: sender_id,
            message: message,
            is_read: 0,
            created_at: new Date()
        });

        await db.collection('chat_conversations').updateOne(
            { id: conversation_id },
            { $set: { updated_at: new Date() } }
        );

        res.send('success');
    } catch (err) {
        console.error(err);
        res.send('error');
    }
});

module.exports = router;

