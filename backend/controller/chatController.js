/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');

module.exports.addChat = async (req, res) => {
  // create a chat with agent, customer, status as approved, resolution as empty, start time as current time, end time as null
  try {
    const { agentId, agentName, custId, custUserName, status, verified } =
      req.body;
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
          rating: 0,
          resolution: '',
          chatEndedBy: '',
          startTime: new Date(),
          endTime: '',
        });
        if (chatCreate) {
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

module.exports.rateChat = async (req, res) => {
  if (req.myId && req.type === data.types.customer) {
    try {
      const { rating } = req.body;
      if (!rating || !/\d/.test(rating) || rating < 0 || rating > 5)
        throw data.chat.ratingMissing;
      const rateUpdate = await chatModel.findOneAndUpdate(
        {
          customerId: req.myId,
        },
        {
          rating: rating,
        },
        {
          new: true,
        }
      );
      if (rateUpdate && rateUpdate.status === data.chat.started) {
        res.status(200).json({
          success: true,
          message: data.chat.ratingAdded,
          detail: rateUpdate,
        });
      } else throw data.chat.ratingFailed;
    } catch (err) {
      res.status(400).json({
        error: {
          code: data.common.serverError,
          detail: err,
        },
      });
    }
  } else {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: data.authErrors.invalidType,
      },
    });
  }
};

module.exports.endChat = async (req, res) => {
  // end a chat by marking chat status as ended, resolution value, end time as current time,
  try {
    const { agentId, agentName, custId, custUserName, resolution } = req.body;
    let chatDetails = {};
    if (!agentId || !agentName) {
      //agentId and details not present. Chat must be ended by customer
      chatDetails = {
        status: data.chat.customerEnded,
        chatEndedBy: data.types.customer,
      };
    } else {
      chatDetails = {
        status: data.chat.ended,
        endTime: new Date(),
        resolution,
      };
    }
    chatModel.findOneAndUpdate(
      {
        customerId: custId,
        customerName: custUserName,
      },
      chatDetails,
      {
        new: true,
      },
      (err, chatEnded) => {
        if (err || !chatEnded) throw data.chat.endFailed;
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
    const agentId = req.type === data.types.admin ? req.body.agentId : req.myId;
    const findChats = await chatModel
      .find({
        agentId: agentId,
        status: status,
      })
      .limit(10);

    if (findChats && findChats.length > 0) {
      res.status(200).json({
        success: true,
        message: data.chat.foundChats,
        detail: findChats,
      });
    } else {
      throw data.chat.notFound;
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

module.exports.inactiveChat = async (req, res) => {
  try {
    let updateList = [];
    req.custList.forEach(async (cust) => {
      const inactiveSince =
        cust.inactiveSince.getUTCDate().toString().padStart(2, '0') +
        ':' +
        cust.inactiveSince.getUTCHours().toString().padStart(2, '0') +
        ':' +
        cust.inactiveSince.getUTCMinutes().toString().padStart(2, '0') +
        ':' +
        cust.inactiveSince.getUTCSeconds().toString().padStart(2, '0');
      const inactiveData = {
        agentId: data.common.notFound,
        agentName: data.common.notFound,
        customerId: cust._id,
        customerName: cust.userName,
        status: data.chat.timeout,
        resolution: 'inactive for ' + inactiveSince,
        rating: 0,
        startTime: new Date(),
        endTime: 0,
        chatEndedBy: data.chat.systemEnded,
      };
      chatModel.create(inactiveData, (err, chatLog) => {
        if (err) throw err;
        updateList.push(chatLog._id);
      });
    });
    if (updateList || updateList.length > 0) {
      res.status(200).json({
        success: true,
        message: data.chat.deleted,
        detail: updateList,
        info: req.deleted,
      });
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
