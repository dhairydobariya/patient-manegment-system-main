// app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/chat-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected...");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// Define Mongoose schema and model for messages
const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String },
  media: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Set up storage and file naming for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Serve static files for uploaded media
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve HTML content
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Private Chat Application</title>
      <script src="/socket.io/socket.io.js"></script>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; }
        #messages { list-style-type: none; padding: 0; }
        #messages li { padding: 8px; margin-bottom: 4px; border-radius: 4px; max-width: 80%; }
        .my-message { background: #daf8e3; text-align: right; float: right; clear: both; }
        .incoming-message { background: #f3f3f3; text-align: left; float: left; clear: both; }
        form { display: flex; }
        input, button { padding: 8px; font-size: 1rem; margin: 4px 0; }
      </style>
    </head>
    <body>
      <h2>Private Chat Application</h2>
      <form id="loginForm">
        <input id="userId" placeholder="Enter your user ID" required />
        <input id="receiverId" placeholder="Enter receiver user ID" required />
        <button>Join Chat</button>
      </form>
      <ul id="messages" style="display: none;"></ul>
      <form id="form" style="display: none;">
        <input id="input" autocomplete="off" placeholder="Type your message..." />
        <input type="file" id="media" accept="image/*,application/pdf" />
        <button>Send</button>
      </form>

      <script>
        const socket = io();
        let userId = '';
        let receiverId = '';

        document.getElementById('loginForm').addEventListener('submit', function(e) {
          e.preventDefault();
          userId = document.getElementById('userId').value;
          receiverId = document.getElementById('receiverId').value;
          document.getElementById('loginForm').style.display = 'none';
          document.getElementById('messages').style.display = 'block';
          document.getElementById('form').style.display = 'flex';
          socket.emit('join', { userId, receiverId });
        });

        socket.on('chat history', function(history) {
          history.forEach((msg) => addMessage(msg, msg.senderId === userId ? 'my-message' : 'incoming-message'));
        });

        socket.on('private message', function(msg) {
          addMessage(msg, msg.senderId === userId ? 'my-message' : 'incoming-message');
        });

        document.getElementById('form').addEventListener('submit', function(e) {
          e.preventDefault();
          const messageText = document.getElementById('input').value;
          const mediaFile = document.getElementById('media').files[0];
          const formData = new FormData();
          formData.append('senderId', userId);
          formData.append('receiverId', receiverId);
          if (messageText) formData.append('message', messageText);
          if (mediaFile) formData.append('media', mediaFile);

          // Display the message immediately on the sender's side
          addMessage({ senderId: userId, message: messageText, media: null }, 'my-message');

          fetch('/send-message', {
            method: 'POST',
            body: formData,
          });

          document.getElementById('input').value = '';
          document.getElementById('media').value = '';
        });

        function addMessage(msg, cssClass) {
          const item = document.createElement('li');
          if (msg.message) item.textContent = msg.senderId + ": " + msg.message;
          if (msg.media) {
            const mediaElement = msg.media.endsWith('.pdf')
              ? document.createElement('a')
              : document.createElement('img');
            mediaElement.src = msg.media;
            mediaElement.href = msg.media;
            mediaElement.alt = "Media";
            mediaElement.style.maxWidth = '200px';
            item.appendChild(mediaElement);
          }
          item.className = cssClass;
          document.getElementById('messages').appendChild(item);
          item.scrollIntoView();
        }
      </script>
    </body>
    </html>`);
});

app.post('/send-message', upload.single('media'), async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;

  const newMessage = new Message({
    senderId,
    receiverId,
    message,
    media: mediaPath,
  });
  await newMessage.save();

  const receiverSocket = Array.from(io.sockets.sockets.values()).find(
    s => s.userId === receiverId
  );
  if (receiverSocket) {
    receiverSocket.emit('private message', newMessage);
  }

  res.sendStatus(200);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  socket.on('join', async ({ userId, receiverId }) => {
    socket.userId = userId;
    socket.receiverId = receiverId;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    socket.emit('chat history', messages);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.userId} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
