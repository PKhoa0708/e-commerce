const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email role phone')
      .populate('product', 'name price images stockQuantity')
      .sort({ lastMessageAt: -1 });

    // For each conversation, count unread messages sent by the other participant
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          isRead: false,
          sender: { $ne: userId }
        });
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi máy chủ khi lấy danh sách hội thoại.'
    });
  }
};

// GET /api/chat/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID hội thoại không hợp lệ.'
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Hội thoại không tồn tại.'
      });
    }

    const isParticipant = conversation.participants.some(
      (pId) => pId.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập hội thoại này.'
      });
    }

    // Retrieve all messages for this conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    return res.status(200).json({
      status: 'success',
      messages
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi máy chủ khi tải tin nhắn.'
    });
  }
};

// POST /api/chat/messages
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content, productId } = req.body;
    const senderId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Nội dung tin nhắn không được để trống.'
      });
    }

    let conversation;

    // Case 1: Send to an existing conversation ID
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          status: 'error',
          message: 'ID hội thoại không hợp lệ.'
        });
      }

      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          status: 'error',
          message: 'Hội thoại không tồn tại.'
        });
      }

      // Check authorization
      const isParticipant = conversation.participants.some(
        (pId) => pId.toString() === senderId.toString()
      );
      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Bạn không có quyền gửi tin nhắn vào hội thoại này.'
        });
      }
    } 
    // Case 2: No conversation ID, target direct receiverId (e.g. from ProductDetail "Chat ngay")
    else if (receiverId) {
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({
          status: 'error',
          message: 'ID người nhận không hợp lệ.'
        });
      }

      if (senderId.toString() === receiverId.toString()) {
        return res.status(400).json({
          status: 'error',
          message: 'Bạn không thể tự nhắn tin cho chính mình.'
        });
      }

      // Check if conversation already exists between these 2 participants
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });

      // If it doesn't exist, create it
      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
          product: productId && mongoose.Types.ObjectId.isValid(productId) ? productId : null
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ID hội thoại hoặc ID người nhận.'
      });
    }

    // Link product if it's provided and valid, and update the conversation
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      conversation.product = productId;
    }

    // Save message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      content: content.trim()
    });

    await message.save();

    // Update conversation metadata
    conversation.lastMessage = content.trim();
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    // Trigger socket.io event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      // 1. Emit to the conversation room
      io.to(conversation._id.toString()).emit('new_message', {
        message
      });

      // 2. Emit to the receiver room to update sidebar / unread badges
      const resolvedReceiverId = receiverId || conversation.participants.find(
        (pId) => pId.toString() !== senderId.toString()
      );
      if (resolvedReceiverId) {
        io.to(resolvedReceiverId.toString()).emit('conversation_updated', {
          conversationId: conversation._id,
          lastMessage: content.trim(),
          senderId
        });
      }
    }

    return res.status(201).json({
      status: 'success',
      message
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi máy chủ khi gửi tin nhắn.'
    });
  }
};

// PUT /api/chat/conversations/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID hội thoại không hợp lệ.'
      });
    }

    // Check permission
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Hội thoại không tồn tại.'
      });
    }

    const isParticipant = conversation.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập hội thoại này.'
      });
    }

    // Mark messages as read where sender is not the current user
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Đã đánh dấu các tin nhắn là đã đọc.'
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi máy chủ khi cập nhật trạng thái đã đọc.'
    });
  }
};
