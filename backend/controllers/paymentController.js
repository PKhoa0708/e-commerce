const Order = require('../models/Order');
const crypto = require('crypto');

/**
 * Helper function to sort object keys and build query string for VNPay signature verification
 */
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

// GET /api/payment/vnpay-verify
// Called by frontend to verify payment result and update order status
exports.vnpayVerify = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    let secureHash = vnp_Params['vnp_SecureHash'];

    // Delete secure hash params
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    vnp_Params = sortObject(vnp_Params);

    // Build sign data
    const secretKey = process.env.VNP_HASHSECRET || '8XWJHYZ3A4B8C1Z6F5E3H2T1Y0M9N8P7';
    
    // Join query params
    const querystring = require('qs');
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    // Calculate hmac sha512
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      // Signature is valid
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
      const vnp_Amount = parseInt(vnp_Params['vnp_Amount']) / 100;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy đơn hàng tương ứng.'
        });
      }

      // Check if amount matches
      if (order.total !== vnp_Amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Số tiền thanh toán không khớp với đơn hàng.'
        });
      }

      if (responseCode === '00') {
        // Success payment
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentDetails = {
          transactionId: vnpTransactionNo,
          paymentDate: new Date(),
          vnpTxnRef: orderId,
          vnpTransactionNo: vnpTransactionNo
        };
        await order.save();

        return res.status(200).json({
          status: 'success',
          message: 'Thanh toán đơn hàng thành công!',
          orderId
        });
      } else {
        // Failed payment
        order.paymentStatus = 'failed';
        await order.save();

        return res.status(400).json({
          status: 'error',
          message: `Thanh toán không thành công. Mã lỗi: ${responseCode}`,
          orderId
        });
      }
    } else {
      console.error('VNPay secure hash mismatch');
      return res.status(400).json({
        status: 'error',
        message: 'Sai chữ ký bảo mật giao dịch (checksum mismatch).'
      });
    }
  } catch (error) {
    console.error('Error in vnpayVerify:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi máy chủ khi xác thực thanh toán.'
    });
  }
};

// GET /api/payment/vnpay-ipn
// Called backend-to-backend by VNPay to guarantee order state sync
exports.vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    
    const secretKey = process.env.VNP_HASHSECRET || '8XWJHYZ3A4B8C1Z6F5E3H2T1Y0M9N8P7';
    const querystring = require('qs');
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const vnpTransactionNo = vnp_Params['vnp_TransactionNo'];
      const vnp_Amount = parseInt(vnp_Params['vnp_Amount']) / 100;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      if (order.total !== vnp_Amount) {
        return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      }

      if (order.paymentStatus === 'paid') {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      if (responseCode === '00') {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentDetails = {
          transactionId: vnpTransactionNo,
          paymentDate: new Date(),
          vnpTxnRef: orderId,
          vnpTransactionNo: vnpTransactionNo
        };
        await order.save();
      } else {
        order.paymentStatus = 'failed';
        await order.save();
      }

      return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
    }
  } catch (error) {
    console.error('Error in vnpayIpn:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};
