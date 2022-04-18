/* eslint-disable no-console */
const presetModel = require('../models/presetModel');
const data = require('../data/messageStore');

module.exports.getPresets = async (req, res) => {
  try {
    const errors = [];
    const getTags = await presetModel.find();

    if (getTags && getTags.length > 0) {
      res.status(200).json({
        success: true,
        message: data.msgSuccess.presetList,
        detail: getTags,
      });
    } else {
      errors.push(data.msgErrors.presetNotFound);
    }

    if (errors.length > 0) {
      console.log(errors);
      throw errors;
    }
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.savePreset = async (req, res) => {
  try {
    const { tag, message } = req.body;
    if (!tag || tag === '' || !message || message === '') {
      throw data.msgErrors.presetInvalid;
    }
    const messageData = await presetModel.findOneAndUpdate(
      {
        tag: tag,
      },
      {
        message: message,
      },
      {
        new: true,
        upsert: true, // Make this update into an upsert
      }
    );

    if (messageData) {
      res.status(200).json({
        success: true,
        message: data.msgSuccess.presetSaved,
        details: messageData,
      });
    } else {
      throw data.msgErrors.updateFailed;
    }
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.msgErrors.presetInvalid,
        detail: err,
      },
    });
  }
};
