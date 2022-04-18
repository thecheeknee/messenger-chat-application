const router = require('express').Router();

const { getPresets, savePreset } = require('../controller/presetController');
const { authAdminCheck } = require('../middleware/authMiddleware');

router.post('/get-presets', getPresets);
router.post('/save-tag', authAdminCheck, savePreset);

module.exports = router;
