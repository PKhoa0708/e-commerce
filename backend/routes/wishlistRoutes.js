const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// All wishlist routes require authentication
router.get('/', protect, wishlistController.getWishlist);
router.post('/', protect, wishlistController.addToWishlist);
router.post('/check', protect, wishlistController.checkWishlist);
router.delete('/:productId', protect, wishlistController.removeFromWishlist);

module.exports = router;
