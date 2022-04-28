/* eslint-disable no-console */
const User = require('../models/authModel');
const chatModel = require('../models/chatModel');
const messageModel = require('../models/messageModel');
const data = require('../data/messageStore');

module.exports.initiateMessage = async (req, res) => {
  try {
    if (req.myId && req.type === data.types.agent) {
      //requester is an agent. Initiate first message to customer. This is connected to cust-verify by UI.
      // UI will trigger initiateMessage
      // UI will reinitate getActiveCustomers as soon as success response is received to update customer list
      const getAgent = await User.findOne({
        _id: req.myId,
        uType: data.types.agent,
      });
      if (getAgent && getAgent.status === data.status.active) {
        const { custId, firstMessage } = req.body;
        if (custId && firstMessage) {
          const chatDetails = await chatModel.findOne({
            customerId: custId,
            status: data.chat.started,
          });
          const last_msg = await messageModel
            .findOne({
              $or: [
                {
                  senderId: req.myId,
                  receiverId: custId,
                },
                {
                  receiverId: req.myId,
                  senderId: custId,
                },
              ],
            })
            .sort({
              updatedAt: -1,
            });
          if (!chatDetails) throw data.chat.startFailed;
          if (last_msg) throw data.chat.chatPresent;
          messageModel.create(
            {
              senderId: req.myId,
              senderName: getAgent.name,
              receiverId: custId,
              message: {
                text: firstMessage.text,
                options: firstMessage.expectedResponse,
              },
            },
            (err, messageData) => {
              if (err) throw err;
              else {
                res.status(201).json({
                  success: true,
                  message: messageData,
                  detail: chatDetails,
                });
              }
            }
          );
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
  const { senderName, receiverId, message, options } = req.body;
  const senderId = req.myId;

  try {
    const insertMessage = await messageModel.create({
      senderId: senderId,
      senderName: senderName,
      receiverId: receiverId,
      message: {
        text: message,
        options: options,
      },
    });
    res.status(201).json({
      success: true,
      message: insertMessage,
    });
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
  const myId = req.myId;
  const fdId = req.params.id;

  try {
    let getAllMessage = await messageModel.find({
      $or: [
        {
          $and: [
            {
              senderId: {
                $eq: myId,
              },
            },
            {
              receiverId: {
                $eq: fdId,
              },
            },
          ],
        },
        {
          $and: [
            {
              senderId: {
                $eq: fdId,
              },
            },
            {
              receiverId: {
                $eq: myId,
              },
            },
          ],
        },
      ],
    });

    // getAllMessage = getAllMessage.filter(m=>m.senderId === myId && m.receiverId === fdId || m.receiverId ===  myId && m.senderId === fdId );

    res.status(200).json({
      success: true,
      message: getAllMessage,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        errorMessage: 'Internal Server error',
      },
    });
  }
};
