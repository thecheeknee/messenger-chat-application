/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');

module.exports.addChat = async (req, res) => {
  // create a chat with agent, customer, status as approved, resolution as empty, start time as current time, end time as null
  try {
    const { agentId, agentName, custId, custUserName, status, verified } =
      req.body;
    chatModel.findOne(
      {
        agent: {
          id: agentId,
          name: agentName,
        },
        customer: {
          id: custId,
          name: custUserName,
        },
      },
      (err, chatPresent) => {
        if (
          (!chatPresent || err) &&
          status === data.status.active &&
          verified === true
        ) {
          chatModel.create(
            {
              agent: {
                id: agentId,
                name: agentName,
              },
              customer: {
                id: custId,
                name: custUserName,
              },
              status: data.chat.started,
              resolution: '',
              startTime: new Date(),
              endTime: '',
            },
            (err, chatCreate) => {
              if (err) throw data.chat.startFailed;
              res.status(200).json({
                success: true,
                message: data.chat.started,
                detail: chatCreate,
              });
            }
          );
        } else throw data.msgErrors.sendFailed;
      }
    );
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.endChat = async (req, res) => {
  // end a chat by marking chat status as ended, resolution value, end time as current time,
  // to pass data ahead to set customer status as deleted ?
  try {
    const { agentId, agentName, custId, custUserName, resolution } = req.body;
    const chatEndedBy =
      !agentId || !agentName ? data.types.customer : data.types.agent;
    chatModel.findOneAndUpdate(
      {
        customer: {
          id: custId,
          name: custUserName,
        },
      },
      {
        status: data.chat.ended,
        chatEndedBy,
        resolution,
      },
      {
        new: true,
      },
      (err, chatEnded) => {
        if (err) throw data.chat.endFailed;
        res.status(200).json({
          success: true,
          message: data.chat.started,
          detail: chatEnded,
        });
      }
    );
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};
