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
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
