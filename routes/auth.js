const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const { getDb, getNextId } = require('../database/db');
const { guestMiddleware } = require('../middleware/auth');

// GET /auth/login
router.get('/login', guestMiddleware, (req, res) => {
    res.render('auth/login');
});

// POST /auth/login
router.post('/login', guestMiddleware, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin'));
        }

        const db = getDb();
        const user = await db.collection('users').findOne({ email: email });

        if (!user) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('Sai tài khoản'));
        }

        let passwordValid = false;
        if (user.password === password) {
            passwordValid = true;
        } else {
            try {
                passwordValid = bcryptjs.compareSync(password, user.password);
            } catch (e) {
                passwordValid = false;
            }
        }

        if (!passwordValid) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('Sai mật khẩu'));
        }

        // Set session
        req.session.user_id = user.id;
        req.session.full_name = user.full_name;
        req.session.role = user.role;

        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (user.role === 'staff') {
            return res.redirect('/staff/dashboard');
        } else {
            return res.redirect('/customer/dashboard');
        }
    } catch (err) {
        console.error(err);
        return res.redirect('/auth/login?error=' + encodeURIComponent('Lỗi hệ thống: ' + err.message));
    }
});

// GET /auth/register
router.get('/register', guestMiddleware, (req, res) => {
    res.render('auth/register');
});

// POST /auth/register
router.post('/register', guestMiddleware, async (req, res) => {
    try {
        const full_name = (req.body.full_name || '').trim();
        const email = (req.body.email || '').trim();
        const phone = (req.body.phone || '').trim();
        const password = (req.body.password || '').trim();
        const confirm_password = (req.body.confirm_password || '').trim();

        // Validate rỗng
        if (!full_name || !email || !phone || !password || !confirm_password) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin'));
        }

        // Validate email: chỉ nhận @gmail.com
        const emailRegex = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Email phải có định dạng @gmail.com'));
        }

        // Validate số điện thoại: 10 số, bắt đầu bằng 0
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Số điện thoại phải gồm 10 số và bắt đầu bằng số 0'));
        }

        // Check mật khẩu trùng nhau
        if (password !== confirm_password) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Mật khẩu nhập lại không khớp'));
        }

        const db = getDb();

        // Check email tồn tại
        const userByEmail = await db.collection('users').findOne({ email: email });
        if (userByEmail) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Email đã tồn tại'));
        }

        // Check số điện thoại tồn tại
        const userByPhone = await db.collection('users').findOne({ phone: phone });
        if (userByPhone) {
            return res.redirect('/auth/register?error=' + encodeURIComponent('Số điện thoại đã tồn tại'));
        }

        // Hash password
        const hashedPassword = bcryptjs.hashSync(password, 10);

        // Lấy ID tự tăng cho User mới
        const user_id = await getNextId('users');

        // Chèn User vào MongoDB
        await db.collection('users').insertOne({
            id: user_id,
            numeric_id: user_id,
            full_name: full_name,
            email: email,
            phone: phone,
            password: hashedPassword,
            role: 'customer',
            status: 'active',
            address: '',
            avatar: null,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Tạo giỏ hàng mới cho User
        const cart_id = await getNextId('carts');
        await db.collection('carts').insertOne({
            id: cart_id,
            numeric_id: cart_id,
            user_id: user_id,
            created_at: new Date(),
            updated_at: new Date()
        });

        return res.redirect('/auth/login?success=' + encodeURIComponent('Đăng ký thành công'));
    } catch (err) {
        console.error(err);
        return res.redirect('/auth/register?error=' + encodeURIComponent('Lỗi hệ thống: ' + err.message));
    }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/auth/login');
    });
});

module.exports = router;
