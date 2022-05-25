const router = require('express').Router();

const {
  userRegister,
  userLogin,
  userLogout,
  userList,
  userVerify,
  userUpdateDetails,
  updateMyDetails,
  userDelete,
  custCreate,
  custAlert,
  custVerify,
  custFetchId,
  custDelete,
  userToken,
  deleteCustomer,
  inactiveCustomers,
} = require('../controller/authController');
const {
  addChat,
  inactiveChat,
  endChat,
  deleteChat,
} = require('../controller/chatController');
const { deleteMessages } = require('../controller/messengerController');
const {
  authMiddleware,
  authAdminCheck,
} = require('../middleware/authMiddleware');

router.post('/user-register', userRegister);
router.post('/user-login', userLogin);
router.post('/user-logout', authMiddleware, userLogout);
router.post('/user-list', authAdminCheck, userList);
router.post('/user-verify', authMiddleware, userVerify);
router.post('/user-update', authAdminCheck, userUpdateDetails);
router.post('/update-my-details', authMiddleware, updateMyDetails);
router.post('/user-delete', authAdminCheck, userDelete);
router.post('/cust-create', custCreate);
router.post('/cust-alert', authMiddleware, custAlert);
router.post('/cust-verify', authMiddleware, custVerify, addChat);
router.post('/cust-cancel', authMiddleware, custFetchId, custDelete);
router.post('/cust-end-chat', authMiddleware, endChat, custDelete);
router.post('/agent-end-chat', authMiddleware, endChat, custDelete);
router.post(
  '/delete-invalid-chat',
  authAdminCheck,
  deleteMessages,
  deleteChat,
  deleteCustomer
);
router.post('/inactive-cust', inactiveCustomers, inactiveChat);
router.get('/token', authMiddleware, userToken);

module.exports = router;
