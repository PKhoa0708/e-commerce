const mongoose = require('mongoose');
const Product = require('../models/Product');

// GET /api/products (Công khai)
exports.getProducts = async (req, res) => {
  try {
    const { excludeSeller } = req.query;
    let query = {};
    
    if (excludeSeller && mongoose.Types.ObjectId.isValid(excludeSeller)) {
      query.seller = { $ne: excludeSeller };
    }

    // Lấy toàn bộ danh sách sản phẩm theo query và sắp xếp theo ngày tạo mới nhất
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    return res.status(200).json({
      status: 'success',
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi tải danh sách sản phẩm. Vui lòng thử lại sau.'
    });
  }
};

// GET /api/products/my (Yêu cầu đăng nhập)
exports.getMyProducts = async (req, res) => {
  try {
    // Lấy danh sách sản phẩm do chính user hiện tại đăng bán
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error in getMyProducts:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi tải sản phẩm của bạn. Vui lòng thử lại sau.'
    });
  }
};

// POST /api/products (Yêu cầu đăng nhập)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images, variants, stockQuantity } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!name || !description || !price || !category || stockQuantity === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.'
      });
    }

    // Tạo sản phẩm mới gắn seller là ID của user đang đăng nhập
    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      category,
      images: images || [],
      variants: variants || { sizes: [], colors: [] },
      stockQuantity: Number(stockQuantity),
      seller: req.user._id,
      rating: 0
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      status: 'success',
      message: 'Đăng bán sản phẩm thành công.',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi đăng bán sản phẩm. Vui lòng thử lại sau.'
    });
  }
};
// GET /api/products/:id (Công khai)
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra định dạng ID hợp lệ của MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const product = await Product.findById(id).populate('seller', 'name email role');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    return res.status(200).json({
      status: 'success',
      product
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi tải thông tin sản phẩm. Vui lòng thử lại sau.'
    });
  }
};

// PUT /api/products/:id (Yêu cầu đăng nhập, là chủ sở hữu)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, images, variants, stockQuantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    // Kiểm tra quyền sở hữu
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền chỉnh sửa sản phẩm này.'
      });
    }

    // Cập nhật thông tin
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (images !== undefined) product.images = images;
    if (variants !== undefined) product.variants = variants;
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);

    const updatedProduct = await product.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật sản phẩm thành công.',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi chỉnh sửa sản phẩm. Vui lòng thử lại sau.'
    });
  }
};

// DELETE /api/products/:id (Yêu cầu đăng nhập, là chủ sở hữu)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    // Kiểm tra quyền sở hữu
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xóa sản phẩm này.'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Xóa sản phẩm thành công.'
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi xóa sản phẩm. Vui lòng thử lại sau.'
    });
  }
};

