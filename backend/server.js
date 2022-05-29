/* eslint-disable no-console */
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

io.on('connection', (socket) => {
  console.log(`user connected`);
  socket.on('request chat', (msg) => {
    console.log('new customer', msg);
    socket.broadcast.emit('chat requested');
  });
  socket.on('customer message', (chatId) => {
    socket.broadcast.emit('customer sent message', chatId);
  });
  socket.on('agent message', (chatId) => {
    socket.broadcast.emit('agent sent message', chatId);
  });
  socket.on('rating sent', (chatId) => {
    socket.broadcast.emit('rating received', chatId);
  });
  socket.on('customer chat ended', (chatId) => {
    socket.broadcast.emit('customer ended chat', chatId);
  });
  socket.on('agent chat ended', (chatId) => {
    socket.broadcast.emit('agent ended chat', chatId);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const databaseConnect = require('./config/database');
const authRoute = require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const presetRoute = require('./routes/presetRoute');
const messengerRoute = require('./routes/messengerRoute');
const { userFetchEmail } = require('./controller/authController');
const {
  authChatCheck,
  authMiddleware,
  authAdminCheck,
} = require('./middleware/authMiddleware');

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
app.use(express.static('static'));

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

app.get('/chat/:id', authChatCheck, async (req, res) => {
  res.render('customer/chat', {
    server_path: process.env.SERVER_URL,
    chatId: req.params.id,
  });
});

app.get('/login', (req, res) => {
  res.render('common/login', { server_path: process.env.SERVER_URL });
});

app.get('/account-register', (req, res) => {
  res.render('common/register', { server_path: process.env.SERVER_URL });
});

app.get('/admin-dashboard', authAdminCheck, (req, res) => {
  const { userName, name, type } = req;
  res.render('admin/dashboard', {
    server_path: process.env.SERVER_URL,
    userName: userName,
    name: name,
    accType: type,
  });
});

app.get('/agent-dashboard', authMiddleware, (req, res) => {
  const { userName, name, type } = req;
  res.render('agent/dashboard', {
    server_path: process.env.SERVER_URL,
    userName: userName,
    name: name,
    accType: type,
  });
});

app.get('/personal-info', authMiddleware, userFetchEmail, (req, res) => {
  const { myId, userName, name, type, emailId } = req;
  res.render('common/password', {
    server_path: process.env.SERVER_URL,
    agentId: myId,
    userName: userName,
    name: name,
    accType: type,
    email: emailId,
  });
});

databaseConnect();

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
