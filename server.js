const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json()); // For parsing JSON requests
app.use(cors()); // For frontend requests

// Connect to MongoDB 
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process on DB failure
  }
};

connectDB();

// Route to homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test API Endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Test Database Connection
app.get('/api/db-test', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ message: 'Database connected!', collections });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error });
  }
});

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
