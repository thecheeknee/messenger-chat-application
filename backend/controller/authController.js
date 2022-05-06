/* eslint-disable no-console */
const validator = require('validator');
const userAuthModel = require('../models/authModel');
const chatModel = require('../models/chatModel');
const data = require('../data/messageStore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const uTypes = data.types;
const uStatus = data.status;

module.exports.userRegister = async (req, res) => {
  /** for registering new agents / admin if admin not present */
  const { userName, name, email, type, password, confirmPassword, adminName } =
    req.body;
  const error = [];

  if (!type || type === uTypes.customer) {
    throw data.authErrors.invalidType;
  }

  if (!userName || userName.length < 6 || userName.indexOf(' ') !== -1) {
    error.push(data.authErrors.invalidUName);
  }

  if (!name || /\d/.test(name)) {
    error.push(data.authErrors.invalidName);
  }

  if (!email || !validator.isEmail(email)) {
    error.push(data.authErrors.invalidEmail);
  }

  if (
    !password ||
    !confirmPassword ||
    (password !== confirmPassword && password.length < 6)
  ) {
    error.push(data.authErrors.invalidPassword);
  }

  if (error.length > 0) {
    res.status(400).json({
      error: {
        code: error,
      },
    });
  } else {
    try {
      const checkAdmin = await userAuthModel.findOne({
        type: uTypes.admin,
      });
      if (type === uTypes.admin && checkAdmin) {
        throw data.authErrors.userExists;
      }

      if (type === uTypes.agent && !checkAdmin) {
        throw data.authErrors.adminMissing;
      }

      if (type == uTypes.agent && adminName !== checkAdmin.name) {
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
            verified: type === uTypes.admin ? true : false,
            status: type === uTypes.admin ? uStatus.active : uStatus.created,
          },
          (err, userCreate) => {
            if (err) throw err;
            if (userCreate.uType === uTypes.admin) {
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

  if (!type || type === uTypes.customer) {
    error.push(data.authErrors.invalidType);
  } else if (type === uTypes.admin) {
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
        type === uTypes.admin
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
          checkUser.status === uStatus.active
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
          if (checkUser.uType === uTypes.admin) {
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
  if (req.myId && (req.type === uTypes.admin || req.type === uTypes.agent)) {
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
  const { verifyList } = req.body;
  try {
    if (req.myId && req.type === uTypes.admin) {
      /** verify all IDs under verifyList */
      verifyList.forEach(async (element) => {
        await userAuthModel.findOneAndUpdate(
          {
            userName: element.userName,
            email: element.email,
            type: uTypes.agent,
          },
          {
            verified: true,
            status: uStatus.active,
          },
          {
            new: true,
          }
        );
      });
      res.status(200).json({
        success: true,
        message: data.authSuccess.userVerified,
        detail: verifyList,
      });
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
    if (req.myId && req.type === uTypes.admin) {
      const { verified, status } = req.body;
      /** find agents who are 'created' (new + unverified), 'active' (current + verified) or 'deleted' (old + unverified) */
      userAuthModel.find(
        {
          uType: uTypes.agent,
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

module.exports.userChangePassword = async (req, res) => {
  /** check if the user and token match and allow password to be changed */
  const { userName, password, newPassword, confirmPassword } = req.body;
  try {
    if (req.type !== uTypes.customer) {
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

        if (
          checkUser.type === uTypes.admin &&
          userName !== checkUser.userName
        ) {
          /** trying to remove admin account without providing userName */
          throw data.authErrors.adminMissing;
        }

        if (
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword ||
          newPassword.length < 6
        ) {
          throw data.authErrors.incorrectPassword;
        }

        userAuthModel.findOneAndUpdate(
          {
            _id: checkUser._id,
            email: checkUser.email,
            userName: checkUser.userName,
          },
          {
            password: await bcrypt.hash(newPassword, 10),
          },
          {
            new: true,
          },
          (err, updateUser) => {
            if (err) throw data.authErrors.updateFailed;
            res.status(200).json({
              success: true,
              message: data.authSuccess.passwordUpdated,
              detail: updateUser,
            });
          }
        );
      } else {
        throw data.authErrors.userNotFound;
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

module.exports.userDelete = async (req, res) => {
  /** unverify user passed as attribute if current user type is admin */
  const { password, agentUName, agentEmail } = req.body;
  try {
    const checkAdmin = await userAuthModel
      .findOne({
        _id: req.myId,
        type: req.type,
      })
      .select('+password');

    if (checkAdmin) {
      const matchPassword = await bcrypt.compare(password, checkAdmin.password);

      if (matchPassword && req.type === uTypes.admin) {
        /** admin confirmed. Unverify user if type == agent */
        userAuthModel.findOneAndUpdate(
          {
            userName: agentUName,
            email: agentEmail,
            type: uTypes.agent,
          },
          {
            verified: false,
          },
          {
            new: true,
          },
          (err, delUser) => {
            if (err) throw data.authErrors.deleteFailed;
            res.status(200).json({
              success: true,
              message: data.authSuccess.userDeleted,
              detail: delUser,
            });
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

    const uType = uTypes.customer;

    userAuthModel.create(
      {
        userName,
        name,
        email,
        uType,
        password: await bcrypt.hash(password, 10),
        verified: false,
        status: uStatus.created,
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
    if (req.type === uTypes.agent) {
      const checkAgent = await userAuthModel.findById(req.myId);
      if (checkAgent) {
        userAuthModel.find(
          {
            uType: uTypes.customer,
            status: uStatus.created,
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
      uType: uTypes.agent,
    });

    if (agentCheck) {
      const { custId } = req.body;
      const custUpdate = await userAuthModel.findOneAndUpdate(
        {
          _id: custId,
          uType: uTypes.customer,
        },
        {
          verified: true,
          status: uStatus.active,
        },
        {
          new: true,
        }
      );
      if (custUpdate) {
        req.body = {
          agentId: agentCheck._id,
          agentName: agentCheck.name,
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
    if (req.type !== uTypes.customer) {
      /** only active agents and admin should be allowed to continue. */
      filterData.status = uStatus.active;
    }
    const checkUser = await userAuthModel.findOne(filterData);
    if (!checkUser || checkUser.status === uStatus.deleted) {
      res.status(200).cookie('authToken', '').json({
        success: true,
        message: data.authSuccess.tokenDeleted,
      });
    } else {
      if (
        checkUser.uType === uTypes.customer &&
        req.status === uStatus.created &&
        checkUser.status === uStatus.active
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
        status: uStatus.deleted,
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

module.exports.inactiveCustomers = async (req, res, next) => {
  try {
    /**
     * find customers 'created' over 5 mins ago and not active and mark them as deleted.
     * frontend to display a message to them as 'No agent available' - when userToken API runs (if the user is still waiting)
     */
    const expiryTime = Math.floor(Date.now() / 1000);
    -300;
    const list = await userAuthModel.find({
      uType: uTypes.customer,
      verified: false,
      status: uStatus.created,
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
