/* eslint-disable no-console */
const validator = require('validator');
const userAuthModel = require('../models/authModel');
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.userRegister = async (req, res) => {
  /** for registering new agents / admin if admin not present */
  const { userName, name, email, type, password, confirmPassword, adminName } =
    req.body;
  const errorList = [];

  if (!type || type === data.types.customer) {
    throw data.authErrors.invalidType;
  }

  if (!userName || userName.length < 6 || userName.indexOf(' ') !== -1) {
    errorList.push(data.authErrors.invalidUName);
  }

  if (!name || /\d/.test(name)) {
    errorList.push(data.authErrors.invalidName);
  }

  if (!email || !validator.isEmail(email)) {
    errorList.push(data.authErrors.invalidEmail);
  }

  if (validator.isEmail(email) && email.split('@')[0] === userName) {
    errorList.push(data.authErrors.uNameEmailMatch);
  }

  if (
    !password ||
    !confirmPassword ||
    !/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(password) ||
    password !== confirmPassword ||
    password.length < 6
  ) {
    errorList.push(data.authErrors.invalidPassword);
  }

  if (errorList.length > 0) {
    res.status(400).json({
      error: {
        code: data.authErrors.invalidDetails,
        detail: errorList,
      },
    });
  } else {
    try {
      const checkAdmin = await userAuthModel.findOne({
        type: data.types.admin,
      });
      if (type === data.types.admin && checkAdmin) {
        throw data.authErrors.userExists;
      }

      if (type === data.types.agent && !checkAdmin) {
        throw data.authErrors.adminMissing;
      }

      if (type == data.types.agent && adminName !== checkAdmin.name) {
        throw data.authErrors.adminMissing;
      }

      const checkUser = await userAuthModel.findOne({
        email: email,
      });
      if (checkUser) {
        res.status(404).json({
          error: {
            code: data.authErrors.userExists,
          },
        });
      } else {
        userAuthModel.create(
          {
            userName,
            email,
            name,
            uType: type,
            password: await bcrypt.hash(password, 10),
            verified: type === data.types.admin ? true : false,
            status:
              type === data.types.admin
                ? data.status.active
                : data.status.created,
          },
          (err, userCreate) => {
            if (err) throw err;
            if (userCreate.uType === data.types.admin) {
              const token = jwt.sign(
                {
                  id: userCreate._id,
                  userName: userCreate.userName,
                  name: userCreate.name,
                  type: userCreate.uType,
                  verified: userCreate.verified,
                  status: userCreate.status,
                  verifiedAdmin: true,
                  registerTime: userCreate.createdAt,
                },
                process.env.SECRET,
                {
                  expiresIn: process.env.TOKEN_EXP,
                }
              );

              const options = {
                expires: new Date(
                  Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
                ),
              };

              res
                .status(201)
                .cookie('authToken', token, options)
                .json({
                  success: true,
                  message: data.authSuccess.userAdded,
                  detail: {
                    userId: userCreate._id,
                    registerTime: userCreate.createdAt,
                  },
                  token,
                });
            } else {
              res.status(200).json({
                success: true,
                message: data.authSuccess.userAdded,
                detail: userCreate.userName,
                description: 'user created. verification pending',
              });
            }
          }
        );
      }
    } catch (err) {
      res.status(500).json({
        error: {
          code: data.common.serverError,
          detail: err,
        },
      });
    }
  }
};

module.exports.userLogin = async (req, res) => {
  const error = [];
  const { email, userName, type, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    error.push(data.authErrors.invalidEmail);
  }

  if (!type || type === data.types.customer) {
    error.push(data.authErrors.invalidType);
  } else if (type === data.types.admin) {
    if (!userName) {
      error.push(data.authErrors.invalidUName);
    }
  }

  if (!password) {
    error.push(data.authErrors.invalidPassword);
  }

  if (error.length > 0) {
    res.status(400).json({
      error: {
        code: data.authErrors.invalidDetails,
        detail: error,
      },
    });
  } else {
    try {
      const findFilter =
        type === data.types.admin
          ? {
              email: email,
              userName: userName,
            }
          : {
              email: email,
            };
      const checkUser = await userAuthModel
        .findOne(findFilter)
        .select('+password');

      if (checkUser) {
        const matchPassword = await bcrypt.compare(
          password,
          checkUser.password
        );

        if (
          matchPassword &&
          checkUser.verified &&
          checkUser.status === data.status.active
        ) {
          let tokenData = {
            id: checkUser._id,
            userName: checkUser.userName,
            name: checkUser.name,
            type: checkUser.uType,
            verified: checkUser.verified,
            status: checkUser.status,
            registerTime: checkUser.createdAt,
          };
          if (checkUser.uType === data.types.admin) {
            tokenData.verifiedAdmin = true;
          }
          const token = jwt.sign(tokenData, process.env.SECRET, {
            expiresIn: process.env.TOKEN_EXP,
          });
          const options = {
            expires: new Date(
              Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
            ),
          };

          res.status(200).cookie('authToken', token, options).json({
            success: true,
            message: data.authSuccess.userLogin,
            detail: checkUser.uType,
            info: checkUser.userName,
            token,
          });
        } else {
          res.status(400).json({
            error: {
              code:
                checkUser.verified === false
                  ? data.authErrors.verifyFailed
                  : data.authErrors.invalidPassword,
              detail: checkUser.status,
            },
          });
        }
      } else {
        res.status(400).json({
          error: {
            code: data.authErrors.userNotFound,
          },
        });
      }
    } catch (err) {
      res.status(404).json({
        error: {
          code: data.common.serverError,
          detail: err,
        },
      });
    }
  }
};

module.exports.userLogout = (req, res) => {
  if (
    req.myId &&
    (req.type === data.types.admin || req.type === data.types.agent)
  ) {
    /** update log data with logout time */
    res.status(200).cookie('authToken', '').json({
      success: true,
    });
  } else {
    res.status(400).json({
      error: {
        code: data.authErrors.userNotFound,
      },
    });
  }
};

module.exports.userVerify = async (req, res) => {
  /** to verify agents by admin */
  const { agentId } = req.body;
  try {
    if (req.myId && req.type === data.types.admin) {
      console.log(agentId);
      userAuthModel.findByIdAndUpdate(
        agentId,
        {
          verified: true,
          status: data.status.active,
        },
        {
          new: true,
        },
        (errFind, updatedAgent) => {
          if (errFind) throw errFind;

          res.status(200).json({
            success: true,
            message: data.authSuccess.userVerified,
            detail: updatedAgent,
          });
        }
      );
    } else throw data.authErrors.adminMissing;
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.authErrors.verifyFailed,
        detail: err,
      },
    });
  }
};

module.exports.userList = async (req, res) => {
  /** fetch list of users by Admin where type = agent */
  try {
    if (req.myId && req.type === data.types.admin) {
      const { verified, status } = req.body;
      /** find agents who are 'created' (new + unverified), 'active' (current + verified) or 'deleted' (old + unverified) */
      userAuthModel.find(
        {
          uType: data.types.agent,
          verified: verified,
          status: status,
        },
        (err, listAgents) => {
          if (err) throw data.authErrors.userNotFound;
          res.status(200).json({
            success: true,
            detail: {
              listAgents,
              count: listAgents.length,
            },
          });
        }
      );
    } else {
      res.status(400).json({
        error: {
          code: data.authErrors.invalidType,
        },
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

module.exports.userUpdateDetails = async (req, res) => {
  const { agentId, name, password, emailId } = req.body;
  try {
    userAuthModel.findByIdAndUpdate(
      agentId,
      {
        name,
        email: emailId,
        password: await bcrypt.hash(password, 10),
      },
      {
        new: true,
      },
      (err, agentUpdated) => {
        if (err) throw data.authErrors.updateFailed;
        res.status(200).json({
          success: true,
          message: data.authSuccess.userUpdated,
          detail: agentUpdated,
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

module.exports.calculateAgentRating = async (req, res) => {
  const { agentId, chatList, totalChatCount } = req.body;
  try {
    let chatCount = chatList.length;
    let chatTotal = 0;
    let chatRatingData = [0, 0, 0, 0];
    chatList.forEach((chat) => {
      let chatRating = 0;
      switch (chat.rating) {
        case 'notSatisfied':
          chatRating = 1;
          break;
        case 'satisfied':
          chatRating = 2;
          break;
        case 'good':
          chatRating = 3;
          break;
        case 'excellent':
          chatRating = 4;
          break;
        default:
      }
      if (chatRating === 0) {
        chatCount -= 1;
        return;
      }
      chatRatingData[chatRating - 1] += 1;
    });
    for (let rating in chatRatingData) {
      rating = parseInt(rating);
      chatTotal += chatRatingData[rating] * (rating + 1);
    }
    const totalRating = chatTotal / chatCount;
    // console.log(chatCount, chatRatingData, chatTotal, totalRating);
    userAuthModel.findByIdAndUpdate(
      agentId,
      {
        totalRating,
        totalChats: totalChatCount,
      },
      {
        new: true,
      },
      (err, chatRating) => {
        if (err) throw err;
        res.status(200).json({
          success: true,
          message: data.chat.foundChats,
          totalChatCount,
          detail: chatList,
          rating: chatRating,
        });
      }
    );
  } catch (error) {
    res.status(200).json({
      success: true,
      message: data.chat.foundChats,
      totalChatCount,
      detail: chatList,
      rating: error,
    });
  }
};

module.exports.userFetchEmail = async (req, res, next) => {
  const { myId, type, userName, name } = req;
  try {
    if (type !== data.types.customer) {
      const fetchUser = await userAuthModel.findById(myId);
      if (fetchUser.userName === userName && fetchUser.name === name) {
        req.emailId = fetchUser.email;
        next();
      } else {
        throw data.authErrors.userNotFound;
      }
    } else throw data.authErrors.invalidType;
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.updateMyDetails = async (req, res) => {
  const { name, email, password, newPassword, confirmPassword } = req.body;
  console.log(req.body, req.myId);
  try {
    if (req.type !== data.types.customer) {
      const checkUser = await userAuthModel
        .findOne({
          _id: req.myId,
          type: req.type,
        })
        .select('+password');

      if (checkUser) {
        const matchPassword = await bcrypt.compare(
          password,
          checkUser.password
        );
        if (!matchPassword) throw data.authErrors.invalidPassword;

        let changeDetails;

        if (
          (newPassword && !confirmPassword) ||
          (!newPassword && confirmPassword) ||
          newPassword !== confirmPassword
        )
          throw data.authErrors.incorrectPassword;

        if (
          newPassword &&
          /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(
            password
          ) &&
          newPassword === confirmPassword
        ) {
          //user requests a password change. NO other details will be modified
          changeDetails = {
            password: await bcrypt.hash(password, 10),
          };
        }

        if (!changeDetails && name && email) {
          changeDetails = {
            name: name,
            email: email,
          };
        }

        if (changeDetails) {
          console.log(changeDetails);
          userAuthModel.findByIdAndUpdate(
            req.myId,
            changeDetails,
            {
              new: true,
            },
            (err, changeStatus) => {
              if (err) throw err;
              if (changeStatus) {
                res.status(200).json({
                  success: true,
                  message: data.authSuccess.userUpdated,
                  detail: changeStatus,
                });
              }
            }
          );
        }
      } else throw data.authErrors.userNotFound;
    } else throw data.authErrors.invalidType;
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.userDelete = async (req, res) => {
  /** unverify user passed as attribute if current user type is admin */
  const { agentId, adminPassword } = req.body;
  try {
    const checkAdmin = await userAuthModel
      .findOne({
        _id: req.myId,
        type: req.type,
      })
      .select('+password');

    if (checkAdmin) {
      const matchPassword = await bcrypt.compare(
        adminPassword,
        checkAdmin.password
      );

      if (matchPassword && req.type === data.types.admin) {
        /** admin confirmed. Unverify user if type == agent */
        userAuthModel.findOne(
          {
            _id: agentId,
            type: data.types.agent,
          },
          async (err, agentFound) => {
            if (err) throw err;
            let agentDelete = '';
            if (agentFound.status === data.status.created) {
              // this is an unverified agent. Delete permanently
              agentDelete = await userAuthModel.findByIdAndDelete(
                agentFound._id
              );
            } else if (agentFound.status === data.status.active) {
              agentDelete = await userAuthModel.findByIdAndUpdate(
                agentFound._id,
                {
                  verified: false,
                  status: data.status.deleted,
                },
                {
                  new: true,
                }
              );
            } else throw data.common.notFound;
            if (agentDelete) {
              res.status(200).json({
                success: true,
                message:
                  agentFound.status === data.status.created
                    ? data.authSuccess.userDeleted
                    : data.authSuccess.userDeactivated,
                detail: agentDelete,
              });
            } else throw data.authErrors.deleteFailed;
          }
        );
      } else {
        res.status(400).json({
          error: {
            code: data.authErrors.adminMissing,
            detail: data.authErrors.invalidPassword,
          },
        });
      }
    } else {
      res.status(400).json({
        error: {
          code: data.authErrors.invalidType,
        },
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

module.exports.custCreate = async (req, res) => {
  /** create a temporary user */
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  const { name, pincode } = req.body;
  const errors = [];

  try {
    const { authToken } = req.cookies;
    /** check if token is already present in the system */
    if (authToken) throw data.authErrors.userExists;

    if (!name || /\d/.test(name)) {
      errors.push(data.authErrors.invalidName);
    }

    if (!pincode) {
      errors.push(data.authErrors.invalidPincode);
    }

    if (errors.length > 0) throw errors;

    const userName =
      name.replace(/\s+/g, '') +
      pincode +
      chars[Math.floor(Math.random() * 26)] +
      Math.random().toString(36).substring(2, 8);

    const email =
      chars[Math.floor(Math.random() * 26)] +
      Math.random().toString(36).substring(2, 11) +
      '@customer.com';

    const password =
      chars[Math.floor(Math.random() * 26)] +
      Math.random().toString(36).substring(2, 11);

    const uType = data.types.customer;

    userAuthModel.create(
      {
        userName,
        name,
        email,
        uType,
        password: await bcrypt.hash(password, 10),
        verified: false,
        status: data.status.created,
      },
      (err, custCreate) => {
        if (err) throw err;
        const token = jwt.sign(
          {
            id: custCreate._id,
            userName: custCreate.userName,
            name: custCreate.name,
            type: custCreate.uType,
            verified: custCreate.verified,
            status: custCreate.status,
            registerTime: custCreate.createdAt,
          },
          process.env.SECRET,
          {
            expiresIn: process.env.TOKEN_EXP,
          }
        );

        const options = {
          expires: new Date(
            Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
          ),
        };

        res.status(201).cookie('authToken', token, options).json({
          success: true,
          message: data.authSuccess.custAdded,
          token,
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

module.exports.custAlert = async (req, res) => {
  /**
   * to be run from agent end (based on availability) every 30 seconds.
   * It will keep checking if there are new customers added in the system.
   * frontend will check if agent has any slot available
   */
  try {
    if (req.type === data.types.agent) {
      const checkAgent = await userAuthModel.findById(req.myId);
      if (checkAgent) {
        userAuthModel.find(
          {
            uType: data.types.customer,
            status: data.status.created,
          },
          (err, checkCust) => {
            if (err) throw err;

            if (checkCust.length === 0) {
              res.status(404).json({
                error: {
                  code: data.common.notFound,
                  detail: data.chatAlerts.noChats,
                },
              });
            } else {
              let verifyList = checkCust.map((cust) => ({
                custId: cust._id,
                custUserName: cust.userName,
              }));
              res.status(200).json({
                success: true,
                message: data.chatAlerts.chatWaiting,
                detail: {
                  verifyList,
                },
              });
            }
          }
        );
      } else {
        throw data.authErrors.invalidUName;
      }
    } else {
      res.status(404).json({
        error: {
          code: data.common.notFound,
          detail: data.authErrors.invalidType,
        },
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

module.exports.custVerify = async (req, res, next) => {
  try {
    /** verify customer by agent and start chat */
    const agentCheck = await userAuthModel.findOne({
      _id: req.myId,
      uType: data.types.agent,
    });

    if (agentCheck) {
      const { custId } = req.body;
      const custUpdate = await userAuthModel.findOneAndUpdate(
        {
          _id: custId,
          uType: data.types.customer,
        },
        {
          verified: true,
          status: data.status.active,
        },
        {
          new: true,
        }
      );
      if (custUpdate) {
        req.body = {
          agentId: agentCheck._id,
          agentUserName: agentCheck.userName,
          custId: custUpdate._id,
          custUserName: custUpdate.userName,
          status: custUpdate.status,
          verified: custUpdate.verified,
        };
        next();
      } else throw data.authErrors.verifyFailed;
    } else {
      throw data.authErrors.invalidType;
    }
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.authErrors.invalidType,
        detail: err,
      },
    });
  }
};

module.exports.userToken = async (req, res) => {
  /**
   * keep checking if user is present in the system, else delete token.
   * To be run every 10 seconds to force session to terminate if chat has ended.
   */
  try {
    let filterData = {
      _id: req.myId,
      type: req.type,
    };
    if (req.type !== data.types.customer) {
      /** only active agents and admin should be allowed to continue. */
      filterData.status = data.status.active;
    }
    const checkUser = await userAuthModel.findOne(filterData);
    if (!checkUser || checkUser.status === data.status.deleted) {
      res.status(200).cookie('authToken', '').json({
        success: true,
        message: data.authSuccess.tokenDeleted,
      });
    } else {
      if (
        checkUser.uType === data.types.customer &&
        req.status === data.status.created &&
        checkUser.status === data.status.active
      ) {
        /**
         * customer chat request has been accepted by agent.
         * Customer is now active & verified.
         * Get chat details and create a socket between customer and agent
         */
        const chatDetails = await chatModel
          .findOne({
            customerId: checkUser._id,
            customerName: checkUser.userName,
          })
          .select('_id');

        res.status(200).json({
          success: true,
          message: data.authSuccess.custVerified,
          detail: chatDetails,
        });
      } else {
        res.status(200).json({
          success: true,
          message: data.authSuccess.userVerified,
          detail: {
            type: checkUser.uType,
            status: checkUser.status,
          },
        });
      }
    }
  } catch (err) {
    res.status(404).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};

module.exports.custFetchId = async (req, res, next) => {
  if (req.type === data.types.customer) {
    req.body = {
      custId: req.myId,
    };
    next();
  } else {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        message: data.authErrors.invalidType,
      },
    });
  }
};

module.exports.custDelete = async (req, res) => {
  /** if chat is marked as ended/customerEnded - update customer status to deleted */
  try {
    const { custId } = req.body;
    userAuthModel.findByIdAndUpdate(
      custId,
      {
        verified: false,
        status: data.status.deleted,
      },
      {
        new: true,
      },
      (err, custStatus) => {
        if (err) throw err;
        else {
          res.status(200).json({
            success: true,
            message: data.authSuccess.custDeleted,
            detail: {
              userName: custStatus.userName,
              status: custStatus.status,
            },
          });
        }
      }
    );
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        errorMessage: err,
      },
    });
  }
};

module.exports.deleteCustomer = async (req, res) => {
  try {
    const { messagesFound, messageError, chatsDeleted, customerId } = req.body;
    userAuthModel.findByIdAndDelete(customerId, (err, doc) => {
      if (err) throw err;
      res.status(200).json({
        success: true,
        message: data.authSuccess.custDeleted,
        detail: {
          messagesFound,
          messageError,
          chatsDeleted,
          doc,
        },
      });
    });
  } catch (errCust) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        message: errCust,
        detail: req.body,
      },
    });
  }
};

module.exports.inactiveCustomers = async (req, res, next) => {
  try {
    /**
     * find customers 'created' over 5 mins ago and not active and mark them as deleted.
     * frontend to display a message to them as 'No agent available' - when userToken API runs (if the user is still waiting)
     */
    const expiryTime = Math.floor(Date.now() / 1000);
    -300;
    const list = await userAuthModel.find({
      uType: data.types.customer,
      verified: false,
      status: data.status.created,
      createdAt: {
        $lte: expiryTime,
      },
    });

    if (list && list.length > 0) {
      const shortList = list.map((cust) => {
        return {
          _id: cust._id,
          userName: cust.userName,
          inactiveSince: new Date((expiryTime - cust.createdAt + 300) * 1000),
          status: data.status.deleted,
        };
      });
      const listIds = shortList.map((cust) => {
        return cust._id;
      });
      /** inactive users found. Proceed to delete */
      userAuthModel.deleteMany(
        {
          _id: {
            $in: listIds,
          },
        },
        (err, result) => {
          if (err) throw err;
          else {
            req.deleted = result;
            req.custList = list;
            next();
          }
        }
      );
    } else throw data.authErrors.userNotFound;
  } catch (err) {
    res.status(400).json({
      error: {
        code: data.common.serverError,
        detail: err,
      },
    });
  }
};
