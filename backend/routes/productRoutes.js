const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Định nghĩa API sản phẩm
router.get('/', productController.getProducts);
router.get('/my', protect, productController.getMyProducts);
router.post('/', protect, productController.createProduct);
router.get('/:id', productController.getProductById);

module.exports = router;

