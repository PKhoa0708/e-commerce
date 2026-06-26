const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, chatController.getConversations);
router.get('/conversations/:id/messages', protect, chatController.getMessages);
router.post('/messages', protect, chatController.sendMessage);
router.put('/conversations/:id/read', protect, chatController.markAsRead);

module.exports = router;
