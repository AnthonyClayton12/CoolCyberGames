const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MongoStore = require('connect-mongo');
const morgan = require('morgan'); // Optional: For logging

const app = express();
const port = process.env.PORT || 3000;

// ✅ Logging (Optional)
app.use(morgan('dev'));

// ✅ MongoDB Connections with TLS/SSL
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

mainDB.once('open', () => console.log('✅ Connected to Main MongoDB'));
userDB.once('open', () => console.log('✅ Connected to User MongoDB'));

// ✅ User Schema & Model (Scoped to userDB)
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  displayName: String,
  email: { type: String, unique: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});
const User = userDB.model('User', userSchema);

// ✅ Secure Session Configuration
const requiredEnvVars = ['SESSION_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`⚠️ ${envVar} is not set. Please define it in your environment variables.`);
    process.exit(1);
  }
}

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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Google OAuth Strategy
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

// ✅ Passport Serialization
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

// ✅ Security Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static File Serving
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ✅ User API Endpoints
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id: req.user.id,
    displayName: req.user.displayName,
    email: req.user.email,
    avatar: req.user.avatar
  });
});

// ✅ Serve Pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ✅ Start Server Only After Databases Are Connected
Promise.all([
  new Promise((resolve) => mainDB.once('open', resolve)),
  new Promise((resolve) => userDB.once('open', resolve))
]).then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📦 Main DB: ${mainDB.name}`);
    console.log(`📦 User DB: ${userDB.name}`);
  });
}).catch(err => {
  console.error("❌ Failed to start server due to database connection issues:", err);
  process.exit(1);
});
