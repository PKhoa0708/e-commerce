const { getDb } = require('../database/db');

async function authMiddleware(req, res, next) {
    if (!req.session.user_id) {
        return res.redirect('/auth/login');
    }
    try {
        const db = getDb();
        const user = await db.collection('users').findOne({ id: req.session.user_id });
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth/login?error=' + encodeURIComponent('Tài khoản không tồn tại'));
        }
        if (user.status === 'blocked') {
            req.session.destroy();
            return res.redirect('/auth/login?error=' + encodeURIComponent('Tài khoản của bạn đã bị khóa'));
        }
        // Sync session with database
        req.session.full_name = user.full_name;
        req.session.email = user.email;
        req.session.role = user.role;
        res.locals.header_user = user; // Used by header.ejs
        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
}

function guestMiddleware(req, res, next) {
    if (req.session.user_id) {
        if (req.session.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (req.session.role === 'staff') {
            return res.redirect('/staff/dashboard');
        } else {
            return res.redirect('/customer/dashboard');
        }
    }
    next();
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.session.user_id) {
            return res.redirect('/auth/login');
        }
        if (!allowedRoles.includes(req.session.role)) {
            return res.redirect('/access_denied');
        }
        next();
    };
}

module.exports = {
    authMiddleware,
    guestMiddleware,
    roleMiddleware
};
