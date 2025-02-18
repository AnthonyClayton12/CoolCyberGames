const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/about', express.static(path.join(__dirname, 'public', 'about')));
app.use('/contact', express.static(path.join(__dirname, 'public', 'contact')));

// Serve Games Homepage and Game Directories
app.use('/games', express.static(path.join(__dirname, 'public', 'games')));
app.use('/games/malware_maze', express.static(path.join(__dirname, 'public', 'games', 'malware_maze')));
app.use('/games/phaser_game_1', express.static(path.join(__dirname, 'public', 'games', 'phaser_game_1')));

// MongoDB Connections
const mainDB = mongoose.createConnection(process.env.MONGO_URI);
const userDB = mongoose.createConnection(`${process.env.MONGO_USER_URI}?tls=true`); // Added `?tls=true`

// Handle database connection events
mainDB.on('error', (error) => console.error('MainDB connection error:', error));
userDB.on('error', (error) => console.error('UserDB connection error:', error));

mainDB.once('open', () => console.log('Connected to Main MongoDB'));
userDB.once('open', () => console.log('Connected to User MongoDB'));

// Homepage Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes to privacy policy and TOS
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-of-service.html'));
});

// Route to serve the Games Homepage
app.get('/games', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'index.html'));
});

// Route to serve Malware Maze
app.get('/games/malware_maze', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'malware_maze', 'index.html'));
});

// Route to serve Phaser Game 1
app.get('/games/phaser_game_1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'phaser_game_1', 'index.html'));
});

// Test API Endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Test Database Connection
app.get('/api/db-test', async (req, res) => {
  try {
    const collections = await mainDB.db.listCollections().toArray();
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
