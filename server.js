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

// MongoDB Connections
const gameDB = mongoose.createConnection(process.env.MONGO_GAME_URI);
const userDB = mongoose.createConnection(process.env.MONGO_USER_URI);

gameDB.on('error', (error) => console.error('GameDB connection error:', error));
userDB.on('error', (error) => console.error('UserDB connection error:', error));

gameDB.once('open', () => console.log('Connected to Game MongoDB'));
userDB.once('open', () => console.log('Connected to User MongoDB'));

// User Schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  displayName: String,
  email: { type: String, unique: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});
const User = userDB.model('User', userSchema);

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
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
}));

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

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
          avatar: profile.photos[0]?.value.replace(/=s96-c/, '=s400-c'),
          createdAt: new Date()
        });
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/user/login',
    successRedirect: '/'
  })
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: req.user.id,
    displayName: req.user.displayName,
    email: req.user.email,
    avatar: req.user.avatar
  });
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

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

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
