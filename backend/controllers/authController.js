const User = require('../models/User');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Validate inputs
    if (!emailOrPhone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập Email/Số điện thoại và Mật khẩu.'
      });
    }

    const trimmedIdentifier = emailOrPhone.trim().toLowerCase();

    // Query User by email or phone
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier },
        { phone: emailOrPhone.trim() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản Email hoặc Số điện thoại không tồn tại.'
      });
    }

    // Verify password using schema method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Mật khẩu không chính xác.'
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'shopee_clone_secret_key_123456',
      { expiresIn: '7d' } // token active for 7 days
    );

    // Return token and user info (excluding password)
    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
    });
  }
};

// GET /api/auth/google/callback
exports.googleCallback = async (req, res) => {
  try {
    // Boilerplate for Google OAuth integration
    const { code } = req.query;
    
    return res.status(200).json({
      status: 'success',
      message: 'Đã nhận được callback từ Google. Sẵn sàng tích hợp SDK ở bước tiếp theo.',
      authCodeReceived: code || 'MockCodeForTesting'
    });
  } catch (error) {
    console.error('Error during Google login callback:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể kết nối với dịch vụ Google.'
    });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, emailOrPhone, password } = req.body;

    // 1. Xác thực dữ liệu đầu vào
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập Họ và tên.'
      });
    }
    if (!emailOrPhone || !emailOrPhone.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập Email hoặc Số điện thoại.'
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    const trimmedIdentifier = emailOrPhone.trim();
    const isEmail = trimmedIdentifier.includes('@');
    const lowerIdentifier = isEmail ? trimmedIdentifier.toLowerCase() : trimmedIdentifier;

    // 2. Kiểm tra tài khoản đã tồn tại chưa (email hoặc số điện thoại)
    const existingUser = await User.findOne({
      $or: [
        { email: lowerIdentifier },
        { phone: trimmedIdentifier }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Tài khoản đã tồn tại.'
      });
    }

    // 3. Chuẩn bị trường dữ liệu cho User mới
    const userData = {
      name: name.trim(),
      password, // Mật khẩu sẽ được tự động băm bởi userSchema.pre('save')
      role: 'customer'
    };

    if (isEmail) {
      userData.email = lowerIdentifier;
      // Để phone là undefined để không kích hoạt validation hoặc trùng lặp null
    } else {
      userData.phone = trimmedIdentifier;
      // Để email là undefined để MongoDB sparse index hoạt động chính xác
    }

    // 4. Lưu User vào cơ sở dữ liệu
    const newUser = new User(userData);
    await newUser.save();

    // 5. Tự động tạo mã JWT Token sau khi đăng ký thành công để auto-login
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'shopee_clone_secret_key_123456',
      { expiresIn: '7d' }
    );

    // 6. Trả về token và thông tin người dùng mới (ngoại trừ password)
    return res.status(201).json({
      status: 'success',
      message: 'Đăng ký tài khoản thành công.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email || null,
        phone: newUser.phone || null,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error during register:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi đăng ký. Vui lòng thử lại sau.'
    });
  }
};
