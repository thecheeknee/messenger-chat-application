const router = require('express').Router();

const {
  listChat,
  rateChat,
  getMyChat,
} = require('../controller/chatController');
const { calculateAgentRating } = require('../controller/authController');
const {
  authMiddleware,
  authAdminCheck,
} = require('../middleware/authMiddleware');

router.post('/get-my-chat', authMiddleware, getMyChat);
router.post('/list-chat', authMiddleware, listChat);
router.post(
  '/list-agent-chats',
  authAdminCheck,
  listChat,
  calculateAgentRating
);
router.post('/rate-chat', authMiddleware, rateChat);

module.exports = router;
