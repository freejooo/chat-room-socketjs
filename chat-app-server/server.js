// server.js

// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure to import cors

// Initialize the Express app and create an HTTP server
const app = express();
app.use(cors()); // Add this line to use cors

const server = http.createServer(app);

// Initialize Socket.IO and attach it to the server with CORS configuration
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Allow this origin
    methods: ["GET", "POST"], // Allow these methods
    credentials: true // Allow credentials
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define a ChatMessage schema and model in Mongoose
const chatMessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Socket.IO logic
io.on('connection', socket => {
  console.log('A user connected');

  // Listen for chat messages
  socket.on('chat message', async data => {
    // Save the chat message to MongoDB
    
    const chatMessage = new ChatMessage(data);
    await chatMessage.save();  
    const savedMessage = await chatMessage.save();
    console.log('Message saved to MongoDB:', savedMessage);

    // Convert the timestamp to a string
    const chatMessageData = savedMessage.toObject();
    chatMessageData.timestamp = chatMessageData.timestamp.toString();

    // Broadcast the chat message to all connected clients
    console.log('Emitting message:', chatMessageData);
    io.emit('chat message', chatMessageData);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Route for fetching old messages
// Update the route for fetching old messages
app.get('/messages', async (req, res) => {
    const messages = await ChatMessage.find().sort({ timestamp: -1 }).limit(10);
    res.json(messages.reverse());
  });
  

// Start the server
const port = 3001;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
