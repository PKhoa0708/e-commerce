const Wishlist = require('../models/Wishlist');

// GET /api/wishlist — Lấy danh sách yêu thích
const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate('product', 'name price images category rating stockQuantity')
      .sort({ createdAt: -1 });

    // Filter out items whose product has been deleted
    const validItems = items.filter(item => item.product !== null);

    res.json(validItems);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// POST /api/wishlist — Thêm sản phẩm vào wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Thiếu productId.' });
    }

    const existing = await Wishlist.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(400).json({ message: 'Sản phẩm đã có trong danh sách yêu thích.' });
    }

    const item = await Wishlist.create({ user: req.user._id, product: productId });
    res.status(201).json({ message: 'Đã thêm vào yêu thích.', item });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Sản phẩm đã có trong danh sách yêu thích.' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// DELETE /api/wishlist/:productId — Xóa sản phẩm khỏi wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

    if (!result) {
      return res.status(404).json({ message: 'Sản phẩm không có trong danh sách yêu thích.' });
    }

    res.json({ message: 'Đã xóa khỏi yêu thích.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

// POST /api/wishlist/check — Kiểm tra hàng loạt productIds nào đã được yêu thích
const checkWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Thiếu productIds.' });
    }

    const items = await Wishlist.find({
      user: req.user._id,
      product: { $in: productIds }
    }).select('product');

    const wishedIds = items.map(item => item.product.toString());
    res.json({ wishedIds });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };
