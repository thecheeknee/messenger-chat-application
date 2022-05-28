const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async (req, res, next) => {
  const { authToken } = req.cookies;
  if (authToken) {
    const deCodeToken = await jwt.verify(authToken, process.env.SECRET);
    req.myId = deCodeToken.id;
    req.type = deCodeToken.type;
    req.verified = deCodeToken.verified;
    req.status = deCodeToken.status;
    req.userName = deCodeToken.userName;
    req.name = deCodeToken.name;
    next();
  } else {
    res.status(400).json({
      error: {
        errorMessage: ['No user login found'],
      },
    });
  }
};

module.exports.authChatCheck = async (req, res, next) => {
  const { authToken } = req.cookies;
  if (authToken) {
    const deCodeToken = await jwt.verify(authToken, process.env.SECRET);
    req.myId = deCodeToken.id;
    req.type = deCodeToken.type;
    req.verified = deCodeToken.verified;
    req.status = deCodeToken.status;
    next();
  } else {
    res.redirect('/logout');
  }
};

module.exports.authAdminCheck = async (req, res, next) => {
  const { authToken } = req.cookies;
  if (authToken) {
    const deCodeToken = await jwt.verify(authToken, process.env.SECRET);
    req.myId = deCodeToken.id;
    req.type = deCodeToken.type;
    req.userName = deCodeToken.userName;
    req.name = deCodeToken.name;
    if (!deCodeToken.verifiedAdmin) {
      res.status(400).json({
        error: {
          errorMessage: ['No Admin'],
        },
      });
    } else next();
  } else {
    res.status(400).json({
      error: {
        errorMessage: ['No user login found'],
      },
    });
  }
};
