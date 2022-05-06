/* eslint-disable no-console */
const express = require('express');
// const path = require('path');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');

const databaseConnect = require('./config/database');
const authRoute = require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const presetRoute = require('./routes/presetRoute');
const messengerRoute = require('./routes/messengerRoute');
const chatModel = require('./models/chatModel');

dotenv.config({
  path: 'backend/config/config.env',
});
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/messenger', authRoute);
app.use('/api/messenger', chatRoute);
app.use('/api/messenger', presetRoute);
app.use('/api/messenger', messengerRoute);

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.render('customer/index', {
    server_path: process.env.SERVER_URL,
    chatId: '',
  });
});

app.get('/logout', (req, res) => {
  res.render('customer/index', { server_path: '', chatId: '' });
});

app.get('/chat/:id', async (req, res) => {
  const findChat = await chatModel.find({
    _id: req.params.id,
  });

  if (findChat && findChat.length > 0) {
    res.render('customer/chat', {
      server_path: process.env.SERVER_URL,
      chatId: req.params.id,
    });
  } else {
    res.redirect('/logout');
  }
});

app.get('/login', (req, res) => {
  res.render('common/login', { server_path: process.env.SERVER_URL });
});

app.get('/agent-register', (req, res) => {
  res.render('common/register', { server_path: process.env.SERVER_URL });
});

databaseConnect();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
