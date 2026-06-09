const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware bảo vệ route — xác thực JWT Token từ header Authorization
const protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra header Authorization có tồn tại và đúng định dạng Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
      });
    }

    // Giải mã và xác thực token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopee_clone_secret_key_123456'
    );

    // Tìm User trong DB dựa trên id từ payload token (loại bỏ password)
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản không còn tồn tại trong hệ thống.'
      });
    }

    // Gắn thông tin user vào request để các controller phía sau sử dụng
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }
};

module.exports = { protect };
