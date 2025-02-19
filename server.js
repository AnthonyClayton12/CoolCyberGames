require('dotenv').config();
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

// MongoDB Connections with TLS/SSL
const mainDB = mongoose.createConnection(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false // Set to true only for testing
});

const userDB = mongoose.createConnection(process.env.MONGO_USER_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false // Set to true only for testing
});

// Handle database connection events
mainDB.on('error', (error) => console.error('MainDB connection error:', error));
userDB.on('error', (error) => console.error('UserDB connection error:', error));

mainDB.once('open', () => console.log('Connected to Main MongoDB'));
userDB.once('open', () => console.log('Connected to User MongoDB'));

// User Schema and Model
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
  collectionName: 'sessions',
  mongoOptions: {
    tls: true,
    tlsAllowInvalidCertificates: false
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
        // Create a new user if they don't exist
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value.replace(/=s96-c/, '=s400-c')
        });
        await user.save();
      }

      // Return the user object
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

// Security Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static File Serving
app.use(express.static(path.join(__dirname, 'public')));

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');
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

// Serve the Login Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
mainDB.once('open', () => {
  userDB.once('open', () => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Main DB: ${mainDB.name}`);
      console.log(`User DB: ${userDB.name}`);
    });
  });
});
