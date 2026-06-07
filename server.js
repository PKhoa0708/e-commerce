const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejs = require('ejs');
const nocache = require('nocache');
require('dotenv').config();

const { connectDB, getDb, formatDate } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable async EJS rendering in Express
app.engine('ejs', async (filePath, options, callback) => {
    try {
        const html = await ejs.renderFile(filePath, options, { async: true });
        callback(null, html);
    } catch (err) {
        callback(err);
    }
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(nocache());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'lotte_mart_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make common variables available to all EJS templates
app.use((req, res, next) => {
    res.locals.session = req.session || {};
    res.locals.db = getDb();
    res.locals.formatDate = formatDate;
    res.locals.query = req.query;
    res.locals.error = req.query.error || null;
    res.locals.success = req.query.success || null;
    next();
});

const { authMiddleware, guestMiddleware, roleMiddleware } = require('./middleware/auth');

// Global variable logic helper for layout rendering
app.use(async (req, res, next) => {
    if (req.session.user_id) {
        try {
            const db = getDb();
            const user = await db.collection('users').findOne({ id: req.session.user_id });
            res.locals.header_user = user;
        } catch (e) {
            res.locals.header_user = null;
        }
    } else {
        res.locals.header_user = null;
    }
    next();
});

// Import Routers
const authRouter = require('./routes/auth');
const customerRouter = require('./routes/customer');
const staffRouter = require('./routes/staff');
const adminRouter = require('./routes/admin');

app.use('/auth', authRouter);
app.use('/customer', customerRouter);
app.use('/staff', staffRouter);
app.use('/admin', adminRouter);

// Main Homepage Route
app.get('/', async (req, res) => {
    res.render('index');
});

// Access Denied page
app.get('/access_denied', (req, res) => {
    res.render('access_denied');
});

// Export middlewares for use in other routers
module.exports = {
    authMiddleware,
    guestMiddleware,
    roleMiddleware
};

// Connect to DB and Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Cannot start server because database connection failed:', err);
});
