const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users/profile — Lấy thông tin profile của user đang đăng nhập
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// PUT /api/users/profile — Cập nhật tên, email, số điện thoại và ảnh đại diện
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, email } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Tên không được để trống.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    const updateFields = { name: name.trim(), phone: phone?.trim() || null };
    if (avatar !== undefined) {
      updateFields.avatar = avatar;
    }

    if (email !== undefined && email.trim() !== '') {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== user.email) {
        if (user.authProvider === 'google') {
          return res.status(400).json({ message: 'Tài khoản liên kết Google không thể thay đổi email.' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
        }

        // Check if email already in use
        const emailExists = await User.findOne({ email: trimmedEmail, _id: { $ne: req.user._id } });
        if (emailExists) {
          return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác.' });
        }
        updateFields.email = trimmedEmail;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Cập nhật thành công!', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// PUT /api/users/change-password — Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    }

    user.password = newPassword; // pre-save hook sẽ hash tự động
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };

// ═══════════════════════════════════════════════════════════════
//   ADDRESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /api/users/addresses — Lấy tất cả địa chỉ
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// POST /api/users/addresses — Thêm địa chỉ mới
const addAddress = async (req, res) => {
  try {
    const { receiverName, receiverPhone, detailAddress, isDefault } = req.body;

    if (!receiverName?.trim() || !receiverPhone?.trim() || !detailAddress?.trim()) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin địa chỉ.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    // If this is set as default, reset all others
    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    // If this is the first address, auto-set as default
    const shouldBeDefault = user.addresses.length === 0 ? true : !!isDefault;

    user.addresses.push({
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      detailAddress: detailAddress.trim(),
      isDefault: shouldBeDefault
    });

    await user.save();
    res.status(201).json({ message: 'Thêm địa chỉ thành công.', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// PUT /api/users/addresses/:id — Cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverName, receiverPhone, detailAddress, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    const address = user.addresses.id(id);
    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });

    if (receiverName?.trim()) address.receiverName = receiverName.trim();
    if (receiverPhone?.trim()) address.receiverPhone = receiverPhone.trim();
    if (detailAddress?.trim()) address.detailAddress = detailAddress.trim();

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      address.isDefault = true;
    }

    await user.save();
    res.json({ message: 'Cập nhật địa chỉ thành công.', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// DELETE /api/users/addresses/:id — Xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    const address = user.addresses.id(id);
    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });

    const wasDefault = address.isDefault;
    user.addresses.pull(id);

    // If deleted address was default, reassign to first remaining
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: 'Xóa địa chỉ thành công.', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

module.exports = {
  getProfile, updateProfile, changePassword,
  getAddresses, addAddress, updateAddress, deleteAddress
};

