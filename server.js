const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MongoStore = require('connect-mongo');

const app = express();
const port = process.env.PORT || 3000;

// Check for required environment variables
const requiredEnvVars = ['MONGO_GAME_URI', 'MONGO_USER_URI', 'SESSION_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`${envVar} is not set. Please define it in your environment variables.`);
    process.exit(1);
  }
}

// MongoDB Connections with TLS/SSL & Error Handling
const gameDB = mongoose.createConnection(process.env.MONGO_GAME_URI);
const userDB = mongoose.createConnection(process.env.MONGO_USER_URI);

// Handle database connection events
gameDB.on('error', (error) => console.error('GameDB connection error:', error));
userDB.on('error', (error) => console.error('UserDB connection error:', error));

gameDB.once('open', () => console.log('Connected to Game MongoDB'));
userDB.once('open', () => console.log('Connected to User MongoDB'));

// ======================
// User Database Schemas
// ======================

// User Schema & Model (Scoped to userDB)
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  displayName: String,
  email: { type: String, unique: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});
const User = userDB.model('User', userSchema);

// Session Schema & Model (Scoped to userDB)
const sessionSchema = new mongoose.Schema({
  _id: String,
  expires: Date,
  session: String
});
const Session = userDB.model('Session', sessionSchema);

// ======================
// Game Database Schemas
// ======================

// Game Schema & Model (Scoped to gameDB)
const gameSchema = new mongoose.Schema({
  gameId: { type: String, unique: true },
  gameName: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Game = gameDB.model('Game', gameSchema);

// Game Progress Schema & Model (Scoped to gameDB)
const gameProgressSchema = new mongoose.Schema({
  progressId: { type: String, unique: true },
  userId: { type: String, ref: 'User' }, // References User in userDB
  gameId: { type: String, ref: 'Game' }, // References Game in gameDB
  level: Number,
  score: Number,
  lastPlayed: { type: Date, default: Date.now }
});
const GameProgress = gameDB.model('GameProgress', gameProgressSchema);

// Achievement Schema & Model (Scoped to gameDB)
const achievementSchema = new mongoose.Schema({
  achievementId: { type: String, unique: true },
  gameId: { type: String, ref: 'Game' }, // References Game in gameDB
  achievementName: String,
  description: String
});
const Achievement = gameDB.model('Achievement', achievementSchema);

// User Achievement Schema & Model (Scoped to gameDB)
const userAchievementSchema = new mongoose.Schema({
  userAchievementId: { type: String, unique: true },
  userId: { type: String, ref: 'User' }, // References User in userDB
  achievementId: { type: String, ref: 'Achievement' }, // References Achievement in gameDB
  unlockedAt: { type: Date, default: Date.now }
});
const UserAchievement = gameDB.model('UserAchievement', userAchievementSchema);

// Leaderboard Schema & Model (Scoped to gameDB)
const leaderboardSchema = new mongoose.Schema({
  leaderboardId: { type: String, unique: true },
  gameId: { type: String, ref: 'Game' }, // References Game in gameDB
  userId: { type: String, ref: 'User' }, // References User in userDB
  score: Number,
  rank: Number,
  updatedAt: { type: Date, default: Date.now }
});
const Leaderboard = gameDB.model('Leaderboard', leaderboardSchema);

// ======================
// Session Configuration
// ======================

// Secure Session Configuration
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_USER_URI,
  collectionName: 'sessions'
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production' // Set to false in development
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ======================
// Passport Configuration
// ======================

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value.replace(/=s96-c/, '=s400-c')
        });
        await user.save();
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

// Passport Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ======================
// Middleware
// ======================

// Security Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static File Serving
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// Routes
// ======================

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  (req, res) => res.redirect('/')
);

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// User API Endpoints
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id: req.user.id,
    displayName: req.user.displayName,
    email: req.user.email,
    avatar: req.user.avatar
  });
});

// Serve Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact', 'index.html'));
});

// Game Routes
app.get('/games/malware_maze', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'malware_maze', 'index.html'));
});

app.get('/games/phaser_game_1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'phaser_game_1', 'index.html'));
});

// User Routes
app.get('/user/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'login.html'));
});

app.get('/user/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'profile.html'));
});

// Privacy Policy and Terms of Service Routes
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'terms-of-service.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server Only After Databases Are Connected
Promise.all([
  new Promise((resolve) => gameDB.once('open', resolve)),
  new Promise((resolve) => userDB.once('open', resolve))
]).then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Game DB: ${gameDB.name}`);
    console.log(`User DB: ${userDB.name}`);
  });
}).catch(err => {
  console.error("Failed to start server due to database connection issues:", err);
  process.exit(1);
});
