const router = require('express').Router();

const {
  userRegister,
  userLogin,
  userLogout,
  userList,
  userVerify,
  userChangePassword,
  userDelete,
  custCreate,
  custAlert,
  custVerify,
  custDelete,
  userToken,
  inactiveCustomers,
} = require('../controller/authController');
const {
  addChat,
  inactiveChat,
  endChat,
} = require('../controller/chatController');
const {
  authMiddleware,
  authAdminCheck,
} = require('../middleware/authMiddleware');

router.post('/user-register', userRegister);
router.post('/user-login', userLogin);
router.post('/user-logout', authMiddleware, userLogout);
router.post('/user-list', authAdminCheck, userList);
router.post('/user-verify', authMiddleware, userVerify);
router.post('/user-change-password', authMiddleware, userChangePassword);
router.post('/user-delete', authAdminCheck, userDelete);
router.post('/cust-create', custCreate);
router.post('/cust-alert', authMiddleware, custAlert);
router.post('/cust-verify', authMiddleware, custVerify, addChat);
router.post('/cust-end-chat', authMiddleware, endChat, custDelete);
router.post('/agent-end-chat', authMiddleware, endChat, custDelete);
router.post('/inactive-cust', inactiveCustomers, inactiveChat);
router.post('/token', authMiddleware, userToken);

module.exports = router;
