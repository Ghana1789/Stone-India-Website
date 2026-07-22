import express from 'express';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';

const router = express.Router();

// GET /api/chat/:roomId - Fetch chat history for a room
router.get('/:roomId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 }).limit(500);
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
