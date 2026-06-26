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

    const input = (emailOrPhone || '').trim();

    if (!input) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập Email hoặc Số điện thoại.'
      });
    }

    const isEmail = input.includes('@') || /[a-zA-Z]/.test(input);

    let phone = null;
    let email = null;

    if (isEmail) {
      // Validate email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!emailRegex.test(input)) {
        return res.status(400).json({
          status: 'error',
          message: 'Email không hợp lệ'
        });
      }
      email = input.toLowerCase();

      // Check if email already exists in DB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email đã được đăng ký.'
        });
      }
    } else {
      // Validate phone number
      const phoneDigits = input.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || input !== phoneDigits) {
        return res.status(400).json({
          status: 'error',
          message: 'Số điện thoại không hợp lệ'
        });
      }
      if (phoneDigits[0] !== '0') {
        return res.status(400).json({
          status: 'error',
          message: 'Số điện thoại không hợp lệ'
        });
      }
      if (phoneDigits[0] === phoneDigits[1]) {
        return res.status(400).json({
          status: 'error',
          message: 'Số điện thoại không hợp lệ'
        });
      }
      const allSame = phoneDigits.split('').every(d => d === phoneDigits[0]);
      if (allSame) {
        return res.status(400).json({
          status: 'error',
          message: 'Số điện thoại không hợp lệ'
        });
      }
      phone = phoneDigits;

      // Check if phone already exists in DB
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Số điện thoại đã được đăng ký.'
        });
      }
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    // 3. Chuẩn bị trường dữ liệu cho User mới
    const userData = {
      name: name.trim(),
      password: password, // Mật khẩu sẽ được tự động băm bởi userSchema.pre('save')
      role: 'customer'
    };
    if (email) {
      userData.email = email;
    } else if (phone) {
      userData.phone = phone;
      userData.email = `${phone}@urbancart.com`; // Avoid unique email index violations on null/missing email
    }

    // 4. Lưu User vào cơ sở dữ liệu
    const newUser = new User(userData);
    await newUser.save();

    // 5. Tự động tạo mã JWT Token sau khi đăng ký thành công
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

// POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu Google Token.'
      });
    }

    // Verify the Google ID Token using Google tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const data = await response.json();

    if (!response.ok || data.error_description) {
      return res.status(400).json({
        status: 'error',
        message: 'Google Token không hợp lệ hoặc đã hết hạn.'
      });
    }

    const { email, name } = data;
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Tài khoản Google không cung cấp thông tin Email.'
      });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name: name || 'Google User',
        email: email.toLowerCase(),
        authProvider: 'google',
        role: 'customer'
      });
      await user.save();
    } else {
      // If user exists but is logging in via Google for the first time, update authProvider
      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
        await user.save();
      }
    }

    // Generate system JWT Token
    const systemToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'shopee_clone_secret_key_123456',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập Google thành công.',
      token: systemToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error during googleLogin:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi đăng nhập bằng Google. Vui lòng thử lại sau.'
    });
  }
};
