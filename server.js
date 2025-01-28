const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (we'll set this up in Step 3)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to Cool Cyber Games!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});