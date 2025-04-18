/**********************************************************************************
 *                                  INITIALIZATION
 **********************************************************************************/
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

/**********************************************************************************
 *                              ENVIRONMENT VARIABLES
 **********************************************************************************/
// Check for required environment variables
const requiredEnvVars = [
  'MONGO_GAME_URI', 'MONGO_USER_URI', 'SESSION_SECRET', 
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`${envVar} is not set. Please define it in your environment variables.`);
    process.exit(1);
  }
}

/**********************************************************************************
 *                              DATABASE CONNECTIONS
 **********************************************************************************/
// MongoDB Connections
const gameDB = mongoose.createConnection(process.env.MONGO_GAME_URI);
const userDB = mongoose.createConnection(process.env.MONGO_USER_URI);

gameDB.on('error', (error) => console.error('GameDB connection error:', error));
userDB.on('error', (error) => console.error('UserDB connection error:', error));

gameDB.once('open', () => console.log('Connected to Game MongoDB'));
userDB.once('open', () => console.log('Connected to User MongoDB'));

/**********************************************************************************
 *                              USER SCHEMA AND MODEL
 **********************************************************************************/
// User Schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  displayName: String,
  email: { type: String, unique: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});
const User = userDB.model('User', userSchema);

/**********************************************************************************
 *                              SESSION CONFIGURATION
 **********************************************************************************/
// Session Configuration
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
    secure: false,
    sameSite: 'lax',
    httpOnly: true
  }
}));

/**********************************************************************************
 *                              PASSPORT AUTHENTICATION
 **********************************************************************************/
// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return done(null, existingUser);
      } else {
        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value.replace(/=s96-c/, '=s400-c')
        });
        await newUser.save();
        return done(null, newUser);
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/**********************************************************************************
 *                              MIDDLEWARE
 **********************************************************************************/
// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // 🔹 Brotli support
    if (filePath.endsWith('.wasm.br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.js.br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.data.br')) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    // 🔹 Gzip fallback support
    else if (filePath.endsWith('.wasm.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.js.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.data.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

/**********************************************************************************
 *                              ROUTES
 **********************************************************************************/
// Authentication Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'user/login', successRedirect: '/' }),
    (req, res) => {
      console.log("Successful Google authentication!");
});

app.get('/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) { return next(err); }
    req.session.destroy(err => {
      if (err) { return next(err); }
      res.clearCookie('connect.sid'); 
      res.redirect('/');
    });
  });
});

// API Routes
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.email,
      avatar: req.user.avatar
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.get('/api/test', (req, res) => {
  try {
    res.json({
      status: 'API operational',
      timestamp: new Date().toISOString(),
      user: req.isAuthenticated() ? req.user.id : 'anonymous'
    });
  } catch (error) {
    console.error('API test error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health Check Endpoint
app.get('/healthz', (req, res) => {
  try {
    // Check MongoDB connections
    if (gameDB.readyState !== 1 || userDB.readyState !== 1) {
      throw new Error('MongoDB connection error');
    }

    // If everything is OK, return a 200 status
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      gameDB: gameDB.readyState === 1 ? 'Connected' : 'Disconnected',
      userDB: userDB.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'Error',
      error: error.message
    });
  }
});

// Static Routes
const serveStatic = (path) => (req, res) => res.sendFile(`${__dirname}/public/${path}`);
app.get('/', serveStatic('index.html'));
app.get('/about', serveStatic('about/index.html'));
app.get('/contact', serveStatic('contact/index.html'));
app.get('/games/malware_maze', serveStatic('games/malware_maze/index.html'));
app.get('/games/phaser_game_1', serveStatic('games/phaser_game_1/index.html'));
app.get('/user/login', serveStatic('user/login.html'));
app.get('/user/profile', serveStatic('user/profile.html'));
app.get('/privacy-policy', serveStatic('user/privacy-policy.html'));
app.get('/terms-of-service', serveStatic('user/terms-of-service.html'));

/**********************************************************************************
 *                              ERROR HANDLING
 **********************************************************************************/
// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

/**********************************************************************************
 *                              SERVER STARTUP
 **********************************************************************************/
// Start Server
Promise.all([
  new Promise(resolve => gameDB.once('open', resolve)),
  new Promise(resolve => userDB.once('open', resolve))
]).then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Game DB: ${gameDB.name}`);
    console.log(`User DB: ${userDB.name}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
