// ============================================================
//  ZENSUTRA — All Routes (combined into one file for clarity)
//  ────────────────────────────────────────────────────────────
//  Mounted in server.js:
//    /api/auth          → authRoutes
//    /api/mood          → moodRoutes
//    /api/ai            → aiRoutes
//    /api/mental-health → mentalHealthRoutes
//    /api/appointments  → appointmentRoutes
//    /api/user          → profileRoutes
//    /api/settings      → settingsRoutes
//
//  Each route file is a mini Express Router.
//  protect = JWT auth middleware (must be logged in)
// ============================================================

const express = require('express');
const multer  = require('multer');

// ── Auth middleware ───────────────────────────────────────────
const jwt  = require('jsonwebtoken');
const { User } = require('./models');

// protect middleware: extract JWT → verify → attach req.user
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'Not authorized — no token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token.' });
  }
};

// authorize middleware: restrict to specific roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' cannot access this route.` });
  next();
};

// ── Multer for image uploads (kept in memory) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed.'), false);
  },
});

// ── Controllers ───────────────────────────────────────────────
const auth  = require('./authcontroller');
const ai    = require('./aicontroller');
const ctrl  = require('./controller');   // mood, profile, mental health, appointments, settings

// ═══════════════════════════════════════════════════════════════
//  AUTH ROUTES  /api/auth
// ═══════════════════════════════════════════════════════════════
const authRouter = express.Router();

// Public
authRouter.post('/register',           auth.register);
authRouter.post('/verify-otp',         auth.verifyOTP);
authRouter.post('/resend-otp',         auth.resendOTP);
authRouter.post('/login',              auth.login);
authRouter.post('/forgot-password',    auth.forgotPassword);
authRouter.post('/reset-password/:resetToken', auth.resetPassword);
authRouter.post('/guest',              auth.createGuestAccount);

authRouter.get('/:provider',           auth.oauthRedirect);
authRouter.get('/:provider/callback',  auth.oauthCallback);

module.exports.authRoutes = authRouter;


// ═══════════════════════════════════════════════════════════════
//  MOOD ROUTES  /api/mood
// ═══════════════════════════════════════════════════════════════
const moodRouter = express.Router();
moodRouter.use(protect);

moodRouter.post('/',        ctrl.saveMood);
moodRouter.get('/',         ctrl.getMoodHistory);
moodRouter.get('/recent',   ctrl.getRecentMood);
moodRouter.post('/analyze', upload.single('image'), ctrl.analyzeMoodFromImage);

module.exports.moodRoutes = moodRouter;


// ═══════════════════════════════════════════════════════════════
//  AI ROUTES  /api/ai
// ═══════════════════════════════════════════════════════════════
const aiRouter = express.Router();
aiRouter.use(protect);

aiRouter.post('/chat',         ai.generateChatResponse);
aiRouter.get('/conversation',  ai.getConversationHistory);
aiRouter.delete('/conversation', ai.clearConversationHistory);

module.exports.aiRoutes = aiRouter;


// ═══════════════════════════════════════════════════════════════
//  MENTAL HEALTH ROUTES  /api/mental-health
// ═══════════════════════════════════════════════════════════════
const mhRouter = express.Router();
mhRouter.use(protect);

mhRouter.post('/analyze',        ctrl.analyzeMentalHealth);
mhRouter.get('/reports',         ctrl.getMentalHealthReports);
mhRouter.get('/reports/:id',     ctrl.getMentalHealthReport);

module.exports.mentalHealthRoutes = mhRouter;


// ═══════════════════════════════════════════════════════════════
//  APPOINTMENT ROUTES  /api/appointments
// ═══════════════════════════════════════════════════════════════
const aptRouter = express.Router();
aptRouter.use(protect);

aptRouter.post('/',               ctrl.bookAppointment);
aptRouter.get('/',                ctrl.getUserAppointments);
aptRouter.get('/:id',             ctrl.getAppointmentById);
aptRouter.put('/:id/cancel',      ctrl.cancelAppointment);

module.exports.appointmentRoutes = aptRouter;


// ═══════════════════════════════════════════════════════════════
//  PROFILE ROUTES  /api/user
// ═══════════════════════════════════════════════════════════════
const profileRouter = express.Router();
profileRouter.use(protect);

profileRouter.get('/profile',  ctrl.getProfile);
profileRouter.put('/profile',  ctrl.updateProfile);

module.exports.profileRoutes = profileRouter;


// ═══════════════════════════════════════════════════════════════
//  SETTINGS ROUTES  /api/settings
// ═══════════════════════════════════════════════════════════════
const settingsRouter = express.Router();
settingsRouter.use(protect);

settingsRouter.get('/account-info',    ctrl.getAccountInfo);
settingsRouter.post('/change-password',ctrl.changePassword);
settingsRouter.get('/export-data',     ctrl.exportUserData);
settingsRouter.delete('/delete-account', ctrl.deleteAccount);

module.exports.settingsRoutes = settingsRouter;


// ═══════════════════════════════════════════════════════════════
//  JOURNAL ROUTES  /api/journal
// ═══════════════════════════════════════════════════════════════
const journalRouter = express.Router();
journalRouter.use(protect);

journalRouter.get('/',       ctrl.getJournals);
journalRouter.post('/',      ctrl.saveJournal);
journalRouter.delete('/:id', ctrl.deleteJournal);

module.exports.journalRoutes = journalRouter;


// ── Email utility (re-export so server.js routes can use it) ──
// ─────────────────────────────────────────────────────────────
module.exports.protect   = protect;
module.exports.authorize = authorize;