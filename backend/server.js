const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB and seed product data
connectDB().then(() => {
  const seedProducts = require('./config/seedProducts');
  seedProducts();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);


// API Status Route
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend API is running successfully!',
    database: 'Connected',
    timestamp: new Date()
  });
});

// Listen on configured Port
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected via socket:', socket.id);

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId.toString());
      console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId.toString());
      console.log(`Socket ${socket.id} left conversation room: ${conversationId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket user disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
