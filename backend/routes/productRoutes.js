const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Định nghĩa API sản phẩm
router.get('/', productController.getProducts);
router.get('/my', protect, productController.getMyProducts);
router.post('/', protect, productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

// Định nghĩa API đánh giá & bình luận gắn liền với sản phẩm
router.post('/:id/reviews', protect, reviewController.addReview);
router.get('/:id/reviews', reviewController.getProductReviews);

module.exports = router;
