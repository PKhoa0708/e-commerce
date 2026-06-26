const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/vnpay-verify', protect, paymentController.vnpayVerify);
router.get('/vnpay-ipn', paymentController.vnpayIpn);

module.exports = router;
