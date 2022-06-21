/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const adminModel = require('../models/adminModel');
const data = require('../data/messageStore');

module.exports.fetchSettings = async(req, res) => {
  /** fetch all settings */
  try {
    const settingsList = adminModel.find({}).sort({ sequence: 1 });
    if (settingsList && settingsList.length > 0) {
      res.status(200).json({
        success: true,
        message: data.admin.found,
        detail: settingsList,
      });
    } 
    else throw data.common.notFound;
  }
  catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
}

module.exports.updateSetting = async (req, res) => {
  /** update setting with values */
  try {
    const { settingName, settingDescription, settingValue, status } = req.body;
    adminModel.findOneAndUpdate({
      name: settingName,
      settingDescription: settingDescription
    }, {
      value: settingValue,
      status: status
    }, {
      new: true,
      upsert: true
    }, (err, updatedSetting) => {
      if (err) throw err;
      res.status(200).json({
        success: true,
        message: settingName,
        detail: updatedSetting,
      });
    })
  }
  catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
}

module.exports.isHolidayMode = async (req, res, next) => {
  /** check if holiday mode is enabled. if false, allow customer to chat else reject with message */
  try {
    adminModel.findOne({
      name: data.admin.holiday
    }, (err, holidayMode) => {
      if (err) throw err;
      if (holidayMode && holidayMode.length > 0) {
        req.body.holidayMode = holidayMode;
        next();
      }
      else throw data.common.notFound;
    });
  }
  catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
}

module.exports.isWeekendMode = async (req, res, next) => {
  /** check if weekend mode is enabled. Return true & message if active and false if inactive */
  try {
    adminModel.findOne({
      name: data.admin.weekend
    }, (err, weekendMode) => {
      if (err) throw err;
      if (weekendMode && weekendMode.length > 0) {
        req.body.weekendMode = weekendMode;
        next();
      }
      else throw data.common.notFound;
    });
  }
  catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
}