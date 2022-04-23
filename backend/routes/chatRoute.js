const router = require('express').Router();

const { listChat, rateChat } = require('../controller/chatController');
const {
  authMiddleware,
  authAdminCheck,
} = require('../middleware/authMiddleware');

router.post('/list-chat', authMiddleware, listChat);
router.post('/list-agent-chats', authAdminCheck, listChat);
router.post('/rate-chat', authMiddleware, rateChat);

module.exports = router;
