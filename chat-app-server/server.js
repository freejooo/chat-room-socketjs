// server.js

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const allowedOrigins = ['http://0.0.0.0:3000'];

const io = socketIO(server, {
  cors: {
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});



mongoose
  .connect('mongodb://localhost/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

  const chatMessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    image: String, // Add this line
    timestamp: { type: Date, default: Date.now },
  });
  
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

const activeUsers = new Set();
const userHistory = [];

io.on('connection', (socket) => {
  let username;

  socket.on('join', (user) => {
    username = user;
    socket.join('chat');
    activeUsers.add(username);
    io.to('chat').emit('active users', Array.from(activeUsers));
    console.log(`${username} user connected`);

    userHistory.push({ username, status: 'connected' });
    io.emit('user history', userHistory);
  });

  socket.on('disconnect', () => {
    if (username) {
      activeUsers.delete(username);
      io.to('chat').emit('active users', Array.from(activeUsers));
      console.log(`${username} user disconnected`);

      const userIndex = userHistory.findIndex((user) => user.username === username);
      if (userIndex !== -1) {
        userHistory[userIndex].status = 'disconnected';
        io.emit('user history', userHistory);
      }
    }
  });

  socket.on('chat message', async (data) => {
    const chatMessage = new ChatMessage(data);
    await chatMessage.save();
    const savedMessage = await chatMessage.save();
    console.log('Message saved to MongoDB:', savedMessage);

    const chatMessageData = savedMessage.toObject();
    chatMessageData.timestamp = chatMessageData.timestamp.toString();

    console.log('Emitting message:', chatMessageData);
    io.emit('chat message', chatMessageData);
  });
});

app.get('/messages', async (req, res) => {
  const messages = await ChatMessage.find()
    .sort({ timestamp: -1 })
    .limit(50);
  res.json(messages.reverse());
});

app.get('/users', (req, res) => {
  const users = Array.from(activeUsers);
  res.json(users);
});

app.get('/user-history', (req, res) => {
  res.json(userHistory);
});

const port = 3002;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});