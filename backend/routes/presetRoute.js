const router = require('express').Router();

const {
  getPresets,
  savePreset,
  deletePreset,
} = require('../controller/presetController');
const {
  authAdminCheck,
  authMiddleware,
} = require('../middleware/authMiddleware');

router.post('/get-presets', authMiddleware, getPresets);
router.post('/save-tag', authAdminCheck, savePreset);
router.post('/delete-tag', authAdminCheck, deletePreset);

module.exports = router;
