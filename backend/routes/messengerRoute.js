const router = require('express').Router();

const {
  initiateMessage,
  messageUploadDB,
  messageGet,
} = require('../controller/messengerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/initiate-chat', authMiddleware, initiateMessage);
router.post('/send-message', authMiddleware, messageUploadDB);
router.get('/get-message/:id', authMiddleware, messageGet);

module.exports = router;
