const Order = require('../models/Order');
const Product = require('../models/Product');

const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

// POST /api/orders — Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống.' });
    }
    if (!shippingInfo?.fullName || !shippingInfo?.phone || !shippingInfo?.address || !shippingInfo?.city) {
      return res.status(400).json({ message: 'Thông tin giao hàng không đầy đủ.' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingInfo,
      paymentMethod: paymentMethod || 'cod',
      subtotal,
      shippingFee,
      total,
      status: 'pending',
    });

    if (paymentMethod === 'vnpay') {
      const paymentUrl = generateVNPayUrl(req, order);
      return res.status(201).json({
        message: 'Đặt hàng thành công! Đang chuyển hướng thanh toán...',
        order,
        paymentUrl
      });
    }

    res.status(201).json({ message: 'Đặt hàng thành công!', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// GET /api/orders/my — Lấy danh sách đơn hàng của user đang đăng nhập
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .populate('items.product', 'name images price');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// GET /api/orders/:id — Lấy chi tiết một đơn hàng
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images price');

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// GET /api/orders/seller — Lấy danh sách đơn hàng chứa sản phẩm của người bán hiện tại
const getSellerOrders = async (req, res) => {
  try {
    // 1. Tìm tất cả sản phẩm của người bán hiện tại
    const myProducts = await Product.find({ seller: req.user._id });
    const productIds = myProducts.map(p => p._id);

    // 2. Tìm tất cả đơn hàng chứa các sản phẩm đó
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('user', 'name email')
      .populate('items.product', 'name images price seller')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// PUT /api/orders/:id/status — Cập nhật trạng thái đơn hàng (người bán có sản phẩm trong đơn này mới có quyền)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Xác minh người dùng hiện tại là người bán của ít nhất một sản phẩm trong đơn hàng
    const myProducts = await Product.find({ seller: req.user._id });
    const myProductIds = myProducts.map(p => p._id.toString());
    const hasSellerItem = order.items.some(item => myProductIds.includes(item.product.toString()));

    if (!hasSellerItem) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái đơn hàng này.' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công!', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus };

function generateVNPayUrl(req, order) {
  const tmnCode = process.env.VNP_TMNCODE || 'TCG0409C';
  const secretKey = process.env.VNP_HASHSECRET || '8XWJHYZ3A4B8C1Z6F5E3H2T1Y0M9N8P7';
  let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURNURL || 'http://localhost:5173/checkout/vnpay-return';

  const date = new Date();
  
  function pad(n) { return n < 10 ? '0' + n : n; }
  const createDate = date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds());

  const ipAddr = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    '127.0.0.1';

  const orderId = order._id.toString();
  const amount = order.total;

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang #' + orderId;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  vnp_Params = sortObject(vnp_Params);

  const crypto = require('crypto');
  const querystring = require('qs');
  const signData = querystring.stringify(vnp_Params, { encode: false });
  
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  return vnpUrl;
}
