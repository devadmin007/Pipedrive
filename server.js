require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Import Routes
const authRoutes = require('./server/routes/auth');
const leadRoutes = require('./server/routes/leads');
const userRoutes = require('./server/routes/users');
const notificationRoutes = require('./server/routes/notifications.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Socket.io for real-time notifications
// io.on('connection', (socket) => {
//   console.log('New client connected', socket.id);
  
//   socket.on('join', (userId) => {
//     socket.join(userId);
//     console.log(`User ${userId} joined their room`);
//   });
  
//   socket.on('disconnect', () => {
//     console.log('Client disconnected', socket.id);
//   });
// });

// Make io accessible to route handlers
// app.set('io', io);


// ✅ attach io so routes can use it
app.set("io", io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test-firebase', notificationRoutes);
// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});