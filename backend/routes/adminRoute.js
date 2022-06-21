const router = require('express').Router();

const {
  fetchSettings,
  updateSetting,
} = require('../controller/adminController');
const {
  authAdminCheck,
} = require('../middleware/authMiddleware');

router.post('/list-settings', authAdminCheck, fetchSettings);
router.post('/update-setting', authAdminCheck, updateSetting);

module.exports = router;