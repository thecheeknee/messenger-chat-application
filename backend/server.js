/* eslint-disable no-console */
const express = require('express');
const app = express();
const dotenv = require('dotenv');

const databaseConnect = require('./config/database');
const authRoute = require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const presetRoute = require('./routes/presetRoute');
const messengerRoute = require('./routes/messengerRoute');

dotenv.config({
  path: 'backend/config/config.env',
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/messenger', authRoute);
app.use('/api/messenger', chatRoute);
app.use('/api/messenger', presetRoute);
app.use('/api/messenger', messengerRoute);

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.send('This is from backend Sever');
});

databaseConnect();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
