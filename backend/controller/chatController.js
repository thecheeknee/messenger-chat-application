/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');

module.exports.addChat = async (req, res) => {
  // create a chat with agent, customer, status as approved, resolution as empty, start time as current time, end time as null
  try {
    const { agentId, agentName, custId, custUserName, status, verified } =
      req.body;
    console.log('chat-controller reached', agentId, custId, status, verified);
    const chatPresent = await chatModel.findOne({
      customerId: custId,
      customerName: custUserName,
    });

    if (chatPresent && chatPresent.length > 0) {
      throw data.chat.chatPresent;
    } else {
      if (status === data.status.active && verified) {
        const chatCreate = await chatModel.create({
          agentId: agentId,
          agentName: agentName,
          customerId: custId,
          customerName: custUserName,
          status: data.chat.started,
          resolution: '',
          chatEndedBy: '',
          startTime: new Date(),
          endTime: '',
        });
        if (chatCreate) {
          console.log('chat created', chatCreate);
          res.status(200).json({
            success: true,
            message: data.chat.started,
            detail: chatCreate,
          });
        } else throw data.chat.startFailed;
      } else {
        throw data.authErrors.verifyFailed;
      }
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

module.exports.endChat = async (req, res) => {
  // end a chat by marking chat status as ended, resolution value, end time as current time,
  // to pass data ahead to set customer status as deleted ?
  try {
    const { agentId, agentName, custId, custUserName, resolution } = req.body;
    const chatEndedBy =
      !agentId || !agentName ? data.types.customer : data.types.agent;
    if (!resolution || resolution === '') throw data.chat.resolutionMissing;
    chatModel.findOneAndUpdate(
      {
        customerId: custId,
        customerName: custUserName,
      },
      {
        status: data.chat.ended,
        endTime: new Date(),
        chatEndedBy,
        resolution,
      },
      {
        new: true,
      },
      (err, chatEnded) => {
        console.log(chatEnded);
        if (err) throw data.chat.endFailed;
        res.status(200).json({
          success: true,
          message: data.chat.ended,
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

module.exports.listChat = async (req, res) => {
  try {
    const { status } = req.body;
    const findChats = await chatModel.find({
      agentId: req.myId,
      status: status,
    }).limit(10);

    if (findChats && findChats.length > 0) {
      res.status(200).json({
        success: true,
        message: data.chat.foundChats,
        detail: findChats
      });
    } else {
      throw data.chat.notFound;
    }
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      }
    })
  }
}