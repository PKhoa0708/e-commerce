const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// POST /api/products/:id/reviews (Yêu cầu đăng nhập)
exports.addReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ số sao đánh giá và nội dung bình luận.'
      });
    }

    const ratingNumber = Number(rating);
    if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Số sao đánh giá phải từ 1 đến 5.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    // Không cho phép tự đánh giá sản phẩm của mình
    if (product.seller && product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Bạn không thể đánh giá sản phẩm do chính mình đăng bán.'
      });
    }

    // Kiểm tra xem user đã đánh giá sản phẩm này chưa, nếu rồi thì cập nhật, chưa thì tạo mới
    let review = await Review.findOne({ product: productId, user: req.user._id });
    if (review) {
      review.rating = ratingNumber;
      review.comment = comment.trim();
      await review.save();
    } else {
      review = new Review({
        product: productId,
        user: req.user._id,
        rating: ratingNumber,
        comment: comment.trim()
      });
      await review.save();
    }

    // Tính toán lại điểm trung bình cho sản phẩm
    const reviews = await Review.find({ product: productId });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    product.rating = Number(averageRating.toFixed(1));
    await product.save();

    return res.status(201).json({
      status: 'success',
      message: 'Đăng đánh giá thành công.',
      review
    });
  } catch (error) {
    console.error('Error in addReview:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi thêm đánh giá. Vui lòng thử lại sau.'
    });
  }
};

// GET /api/products/:id/reviews (Công khai)
exports.getProductReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({
        status: 'error',
        message: 'Sản phẩm không tồn tại.'
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Kiểm tra xem từng người đánh giá đã mua sản phẩm này chưa để gắn nhãn Verified Buyer
    const reviewsWithBuyerFlag = await Promise.all(
      reviews.map(async (review) => {
        // Tìm đơn hàng của user chứa sản phẩm này và không bị hủy
        const order = await Order.findOne({
          user: review.user._id,
          'items.product': productId,
          status: { $ne: 'cancelled' }
        });
        
        return {
          ...review.toObject(),
          isVerifiedBuyer: !!order
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      count: reviewsWithBuyerFlag.length,
      reviews: reviewsWithBuyerFlag
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi hệ thống khi tải danh sách đánh giá. Vui lòng thử lại sau.'
    });
  }
};
