/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');

module.exports.addChat = async (req, res) => {
  // create a chat with agent, customer, status as approved, resolution as empty, start time as current time, end time as null
};

module.exports.endChat = async (req, res) => {
  // end a chat by marking chat status as ended, resolution value, end time as current time,
  // to pass data ahead to set customer status as deleted ?
};
