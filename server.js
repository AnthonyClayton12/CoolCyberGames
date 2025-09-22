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
 *                              GAME MODELS (gameDB)
 **********************************************************************************/
const { Schema } = mongoose;

// 1) Per-user per-game high score
const scoreSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  gameKey: { type: String, required: true },
  highScore: { type: Number, default: 0 },
}, { timestamps: true });

scoreSchema.index({ userId: 1, gameKey: 1 }, { unique: true });

// 2) Per-user total points (sum of highs across all games)
const totalsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
}, { timestamps: true });

// 3) Achievements catalog (two per game; thresholded by high score)
const achievementCatalogSchema = new Schema({
  key: { type: String, required: true, unique: true },
  gameKey: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  threshold: {
    type: { type: String, enum: ['score'], default: 'score' },
    value: { type: Number, required: true }
  },
  sort: { type: Number, default: 0 }
}, { timestamps: true });

// 4) One completion badge per game
const badgeCatalogSchema = new Schema({
  key: { type: String, required: true, unique: true },
  gameKey: { type: String, required: true, index: true },
  name: { type: String, required: true },
  iconUrl: String,
  // simple rule for now: 'score>0' means first valid score unlocks it
  completionRule: { type: String, default: 'score>0' },
  sort: { type: Number, default: 0 }
}, { timestamps: true });

// 5) What each user has unlocked (achievements + badges)
const userUnlocksSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  achievements: [{ key: String, unlockedAt: Date }],
  badges: [{ key: String, unlockedAt: Date }],
}, { timestamps: true });

const Score                = gameDB.model('Score', scoreSchema);
const Total                = gameDB.model('Total', totalsSchema);
const AchievementCatalog   = gameDB.model('AchievementCatalog', achievementCatalogSchema);
const BadgeCatalog         = gameDB.model('BadgeCatalog', badgeCatalogSchema);
const UserUnlocks          = gameDB.model('UserUnlocks', userUnlocksSchema);

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
app.get('/dashboard', (req, res) => res.sendFile(`${__dirname}/public/dashboard/index.html`));
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

/**********************************************************************************
 *                              HELPERS
 **********************************************************************************/
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

/**********************************************************************************
 *                              POST /api/score
 *  - Upserts per-game highScore
 *  - Updates totals.totalPoints
 *  - Unlocks 2 achievements (score thresholds) + completion badge
 **********************************************************************************/
app.post('/api/score', requireAuth, async (req, res) => {
  try {
    const { gameKey, score, completed } = req.body;

    if (!gameKey || typeof score !== 'number' || Number.isNaN(score)) {
      return res.status(400).json({ error: 'gameKey and numeric score are required' });
    }

    const userId = req.user._id;

    // 1) Current high
    const existing = await Score.findOne({ userId, gameKey }).lean();
    const oldHigh = existing?.highScore ?? 0;

    // 2) Upsert if better
    let newHigh = oldHigh;
    if (score > oldHigh) {
      const updated = await Score.findOneAndUpdate(
        { userId, gameKey },
        { $set: { highScore: score } },
        { upsert: true, new: true }
      ).lean();
      newHigh = updated.highScore;
    }

    // 3) Update totals if high improved
    let totalDoc = await Total.findOne({ userId }).lean();
    if (!totalDoc) {
      // first time → compute sum
      const agg = await Score.aggregate([
        { $match: { userId } },
        { $group: { _id: '$userId', sum: { $sum: '$highScore' } } }
      ]);
      const sum = agg[0]?.sum ?? newHigh;
      totalDoc = await Total.findOneAndUpdate(
        { userId },
        { $set: { totalPoints: sum } },
        { upsert: true, new: true }
      ).lean();
    } else if (newHigh > oldHigh) {
      const delta = newHigh - oldHigh;
      totalDoc = await Total.findOneAndUpdate(
        { userId },
        { $inc: { totalPoints: delta } },
        { new: true }
      ).lean();
    }

    // 4) Unlocks
    const now = new Date();
    const unlockedAchievements = [];
    const unlockedBadges = [];

    // ensure doc
    const userUnlocks = await UserUnlocks.findOneAndUpdate(
      { userId },
      { $setOnInsert: { achievements: [], badges: [] } },
      { upsert: true, new: true }
    );

    // Achievements (score thresholds)
    const achCatalog = await AchievementCatalog.find({ gameKey }).lean();
    const haveAch = new Set((userUnlocks.achievements || []).map(a => a.key));
    for (const ach of achCatalog) {
      if (ach.threshold?.type === 'score' && newHigh >= ach.threshold.value && !haveAch.has(ach.key)) {
        await UserUnlocks.updateOne(
          { userId, 'achievements.key': { $ne: ach.key } },
          { $push: { achievements: { key: ach.key, unlockedAt: now } } }
        );
        unlockedAchievements.push({ key: ach.key, name: ach.name });
      }
    }

    // Completion badge (rule: score>0 or explicit completed flag)
    const badge = await BadgeCatalog.findOne({ gameKey }).lean();
    if (badge) {
      const haveBadge = new Set((userUnlocks.badges || []).map(b => b.key));
      const rule = badge.completionRule || 'score>0';
      const met = rule === 'score>0' ? (newHigh > 0 || score > 0) : !!completed;
      if (met && !haveBadge.has(badge.key)) {
        await UserUnlocks.updateOne(
          { userId, 'badges.key': { $ne: badge.key } },
          { $push: { badges: { key: badge.key, unlockedAt: now } } }
        );
        unlockedBadges.push({ key: badge.key, name: badge.name });
      }
    }

    return res.json({
      gameKey,
      submitted: score,
      highScore: newHigh,
      totalPoints: totalDoc?.totalPoints ?? 0,
      unlockedAchievements,
      unlockedBadges
    });
  } catch (e) {
    console.error('/api/score error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**********************************************************************************
 *                              GET /api/dashboard
 *  - For logged-in users: { user, totalPoints, perGame[] }
 *  - For guests: { guest: true, loginUrl }
 **********************************************************************************/
app.get('/api/dashboard', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.json({ guest: true, loginUrl: '/auth/google' });
    }
    const userId = req.user._id;

    const [totalDoc, scores, unlocks] = await Promise.all([
      Total.findOne({ userId }).lean(),
      Score.find({ userId }).lean(),
      UserUnlocks.findOne({ userId }).lean()
    ]);

    const achSet = new Set((unlocks?.achievements || []).map(a => a.key));
    const badgeSet = new Set((unlocks?.badges || []).map(b => b.key));

    // Build per-game view
    const perGame = scores.map(s => {
      const gamePrefix = `${s.gameKey}__`;
      const achievementsUnlocked = [...achSet].filter(k => k.startsWith(gamePrefix));
      const completionBadgeUnlocked = badgeSet.has(`${s.gameKey}__completion`);
      return {
        gameKey: s.gameKey,
        highScore: s.highScore,
        achievementsUnlocked,
        completionBadgeUnlocked
      };
    });

    res.json({
      user: {
        id: req.user.id,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar
      },
      totalPoints: totalDoc?.totalPoints ?? 0,
      perGame
    });
  } catch (e) {
    console.error('/api/dashboard error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**********************************************************************************
 *                              GET /api/leaderboard
 *  - Public: returns users sorted by totalPoints desc
 *  - Query: ?limit=50&offset=0
 **********************************************************************************/
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    // 1) Get totals slice
    const totals = await Total.find({})
      .sort({ totalPoints: -1, _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const userIds = totals.map(t => t.userId);
    // 2) Fetch user display info from userDB in one go
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id displayName avatar')
      .lean();
    const uMap = new Map(users.map(u => [String(u._id), u]));

    // 3) Build rows with rank numbers
    const startRank = offset + 1;
    const items = totals.map((t, i) => {
      const u = uMap.get(String(t.userId)) || {};
      return {
        rank: startRank + i,
        userId: String(t.userId),
        displayName: u.displayName || 'Player',
        avatar: u.avatar || 'https://via.placeholder.com/40',
        totalPoints: t.totalPoints
      };
    });

    res.json({
      items,
      nextOffset: offset + items.length
    });
  } catch (e) {
    console.error('/api/leaderboard error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**********************************************************************************
 *                              DEV SEED 
 **********************************************************************************/

// (Malware Maze)
if (process.env.ENABLE_SEED === 'true') {
  app.post('/admin/seed/malware_maze', async (req, res) => {
    try {
      const ach1 = {
        key: 'malware_maze__a1',
        gameKey: 'malware_maze',
        name: 'Malware Master',
        description: 'Score 1,000+ in Malware Maze.',
        threshold: { type: 'score', value: 5000 },
        sort: 1
      };
      const ach2 = {
        key: 'malware_maze__a2',
        gameKey: 'malware_maze',
        name: 'Threat Neutralizer',
        description: 'Score 3,000+ in Malware Maze.',
        threshold: { type: 'score', value: 10000 },
        sort: 2
      };
      const badge = {
        key: 'malware_maze__completion',
        gameKey: 'malware_maze',
        name: 'Completed Malware Maze',
        iconUrl: '/assets/badges/malware_maze.svg',
        completionRule: 'score>0',
        sort: 1
      };

      await AchievementCatalog.updateOne({ key: ach1.key }, { $set: ach1 }, { upsert: true });
      await AchievementCatalog.updateOne({ key: ach2.key }, { $set: ach2 }, { upsert: true });
      await BadgeCatalog.updateOne({ key: badge.key }, { $set: badge }, { upsert: true });

      res.json({ ok: true, insertedOrUpdated: ['achievements x2', 'badge x1'] });
    } catch (e) {
      console.error('Seed error:', e);
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // (Other)

}