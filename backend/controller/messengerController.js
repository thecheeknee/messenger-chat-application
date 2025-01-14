/* eslint-disable no-console */
const User = require('../models/authModel');
const chatModel = require('../models/chatModel');
const messageModel = require('../models/messageModel');
const data = require('../data/messageStore');

module.exports.initiateMessage = async (req, res, next) => {
  try {
    if (req.myId && req.type === data.types.agent) {
      /**
       * requester is an agent. Initiate first message to customer.
       * This is connected to cust-verify by UI.
       * UI will trigger initiateMessage
       * UI will reinitate listChat as soon as success response contains initiated: true
       */
      const getAgent = await User.findOne({
        _id: req.myId,
        uType: data.types.agent,
      });
      if (getAgent && getAgent.status === data.status.active) {
        const { chatId, firstMessage } = req.body;
        if (chatId && firstMessage) {
          const chatDetails = await chatModel.findOne({
            _id: chatId,
            status: data.chat.started,
          });
          const last_msg = await messageModel
            .findOne({
              $or: [
                {
                  senderId: req.myId,
                  receiverId: chatDetails.customerId,
                },
                {
                  receiverId: req.myId,
                  senderId: chatDetails.customerId,
                },
              ],
            })
            .sort({
              updatedAt: -1,
            });
          if (!chatDetails) throw data.chat.startFailed;
          if (last_msg) throw data.chat.chatPresent;
          req.body = {
            senderName: getAgent.userName,
            chatId: chatDetails._id,
            message: firstMessage.text,
            options: firstMessage.expectedResponse,
            responseType: firstMessage.responseType,
            initiated: true,
          };
          next();
        } else throw data.authErrors.invalidName;
      } else throw data.authErrors.userNotFound;
    } else throw data.authErrors.invalidType;
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        message: err,
      },
    });
  }
};

module.exports.messageUploadDB = async (req, res) => {
  const { senderName, chatId, message, options, responseType, initiated } =
    req.body;
  const senderId = req.myId;

  try {
    chatModel.findOne(
      {
        _id: chatId,
      },
      async (err, chat) => {
        if (err) throw err;
        else if (!chat) throw data.chatAlerts.noChats;
        else {
          const receiverId =
            chat.agentId === senderId ? chat.customerId : chat.agentId;
          const insertMessage = await messageModel.create({
            chatId: chatId,
            senderId: senderId,
            senderName: senderName,
            receiverId: receiverId,
            message: {
              text: message,
              options: options,
              responseType,
            },
          });
          if (insertMessage && insertMessage._id) {
            res.status(200).json({
              success: true,
              message: data.msgSuccess.messageSent,
              initiated: initiated ? initiated : false,
            });
          }
        }
      }
    );
  } catch (err) {
    res.status(500).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.messageGet = async (req, res) => {
  const chatId = req.params.id;
  /**
   * this should trigger on socket.emit by either agent or customer
   * belonging to the same socket when they successfully exec messageUploadDB
   *  */
  try {
    chatModel.findById(chatId, async (err, docs) => {
      if (err) throw err;
      else {
        messageModel
          .find({ chatId }, (warn, messageList) => {
            if (warn) throw warn;
            /**
             * check if the last message is by the agent on the customer UI.
             * If agent, then analyse the message and take appropriate action.
             *  */
            res.status(200).json({
              success: true,
              status: docs.status,
              chatEnded: docs.chatEndedBy,
              messageList: messageList,
            });
          })
          .sort({
            createdAt: 1,
          })
          .select('-senderId -receiverId');
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: data.common.serverError,
        message: error,
      },
    });
  }
};

module.exports.deleteMessages = async (req, res, next) => {
  const { chatId } = req.body;
  try {
    messageModel.deleteMany(
      {
        chatId: chatId,
      },
      (error, deleteData) => {
        if (error) throw error;
        req.body.messagesFound = deleteData.deletedCount;
        next();
      }
    );
  } catch (errM) {
    req.body.messagesFound = 0;
    req.body.messageError = errM;
    next();
  }
};
