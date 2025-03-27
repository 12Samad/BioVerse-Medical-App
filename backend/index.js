const express = require('express');
const mongoose = require('mongoose');
// const testResultRoutes = require("./routes/testresultRoutes"); // for the testresultRoutes, the new file
const cors = require('cors');
const session = require('express-session'); // Import express-session
const passport = require('passport'); // Import passport
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();  // ✅ Ensure dotenv is loaded to read from .env
const bodyParser = require('body-parser');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleWebhook } = require('./routes/paymentRoutes');

const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

app.use(cors({ origin: ["http://localhost:3000", "https://medical-frontend-phi.vercel.app", "https://medical-frontend-git-main-hassnain-aidevgens-projects.vercel.app"], credentials: true }));

// Middleware
// shift these lines with wapis leana if caused issue in wwebhooks
// app.post('/webhook', bodyParser.raw({ type: 'application/json' }), paymentRoutes);

// // ---- All other subscription routes (they can use normal JSON parser):
// app.use('/subscription', bodyParser.json(), paymentRoutes);
app.post(
  '/subscription/webhook',
  bodyParser.raw({ type: 'application/json' }),
  handleWebhook // Directly use the named export
);
app.use(express.json());

// ---- For Stripe Webhook, we need the raw body:


app.use(express.urlencoded({ extended: true }));
// express-session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());

// Logging Middleware


// Routes

app.use('/api/simulation', require("./routes/simulationRoutes"));
app.use('/api/challenge', require("./routes/challengeRoutes"));
app.use('/api/reviews', require("./routes/reviewRoutes"));
app.use('/api/mentor', require("./routes/mentorRoutes"));
// app.use('/api/mentorship', require("./routes/mentorshipRoutes"));
app.use('/api/dashboard', require("./routes/dashboardRoutes"));
app.use('/api/courses', require("./routes/courseRoutes"));
app.use('/api/booking', require("./routes/bookingRoutes"));
app.use('/api/inquiries', require("./routes/inquiriesRoutes"));
app.use('/api/badges', require("./routes/badgeRoutes"));
app.use('/api/rules', require("./routes/ruleRoutes"));
app.use('/api/user-badges', require("./routes/userBadgeRoutes"));
app.use('/api/leader-board', require("./routes/leaderboardRoutes"));

app.use('/api/user-stats', require("./routes/userStatsRoutes"));

app.use('/api/quest', require("./routes/questRoutes"));
app.use('/api/v2', require("./routes/flashcardRouts"));
app.use('/api/payment', require("./routes/paymentRoutes")); // ✅ Ensures correct route for authentication
app.use('/api/auth', require("./routes/authRoutes")); // ✅ Ensures correct route for authentication
app.use('/api/test', require("./routes/testRoutes"));
app.use('/api/test/upload-questions', require("./routes/csvRoute"));
// app.use(express.json());    // wapis leana
// app.use("/api/test-results", testResultRoutes);
// Environment Variables
const PORT = process.env.PORT || 5000;  // Ensure fallback port if not set

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));