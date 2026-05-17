// ============================================================
//  ZENSUTRA — Database Models (MongoDB / Mongoose)
//  File: Backend/Controllers/models/
//  ────────────────────────────────────────────────────────────
//  Six collections power the platform:
//    1. User           — authentication & identity
//    2. Profile        — extended student/user data
//    3. Mood           — emotion log entries
//    4. Conversation   — AI chat history (auto-expires 90 days)
//    5. MentalHealthReport — DASS-21 / GAD-7 / PHQ-9 results
//    6. Appointment    — counselor session bookings
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

// ─────────────────────────────────────────────────────────────
//  1. USER MODEL
//  Stores credentials + OTP / password-reset tokens.
//  Password is hashed via bcrypt pre-save hook.
//  The `select: false` on password means it is NEVER returned
//  in normal queries — you must explicitly call .select('+password').
// ─────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name required'], trim: true },
  lastName:  { type: String, required: [true, 'Last name required'],  trim: true },

  email: {
    type: String, required: [true, 'Email required'], unique: true,
    lowercase: true, trim: true,
    match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Valid email required'],
  },
  mobile: { type: String, required: [true, 'Mobile required'], unique: true, trim: true },
  dob:    { type: Date,   required: [true, 'Date of birth required'] },

  password: {
    type: String, required: [true, 'Password required'],
    minlength: 6, select: false,   // never returned without explicit .select('+password')
  },

  role: { type: String, enum: ['user', 'counselor', 'admin'], default: 'user' },

  // Verification & security tokens (hashed, never stored plain)
  verificationToken:  String,
  verificationExpire: Date,
  isVerified: { type: Boolean, default: false },

  resetPasswordToken:  String,
  resetPasswordExpire: Date,
  lastPasswordChange:  Date,

  createdAt: { type: Date, default: Date.now },
});

// Hash password before every save (only if it was changed)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.lastPasswordChange = Date.now();
  next();
});

// Compare plain text password with stored hash
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Generate 6-digit OTP, store SHA-256 hash, return plain OTP to send via email
UserSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationToken  = crypto.createHash('sha256').update(otp).digest('hex');
  this.verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate password-reset token (20 random bytes → hex), store hash
UserSchema.methods.getResetPasswordToken = function () {
  const raw = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken  = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return raw;
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);


// ─────────────────────────────────────────────────────────────
//  2. PROFILE MODEL
//  Extended student info collected after registration.
//  One-to-one with User (unique user ref).
//  moduleProgress stores arbitrary JSON (which modules completed).
// ─────────────────────────────────────────────────────────────
const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Personal
  firstName: String, lastName: String, email: String,
  gender:    { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  dob:       Date,
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  disability: { type: String, enum: ['yes','no'] },
  disabilityDetails: String,
  height: Number, // cm
  weight: Number, // kg

  // Location
  district: String, state: String, pincode: String,

  // Academic
  currentStatus: { type: String, enum: ['job','ug','pg','12th','below-12'] },
  collegeName: String, courseName: String,
  courseDuration: { type: Number, min: 1, max: 6 },
  currentYear:    { type: Number, min: 1, max: 6 },
  expectedCompletion: Number,
  backlogs:    { type: String, enum: ['yes','no'] },
  backlogSubjects: Number,
  studyMode:   { type: String, enum: ['regular','online','hybrid'] },

  // Residence
  livingWithParents: { type: String, enum: ['yes','no'] },
  livingIn:    { type: String, enum: ['hostel','pg','rented','other'] },
  collegeDistance: Number,

  // Health
  sleepPattern:      { type: String, enum: ['<4','4-6','6-8','>8'] },
  exerciseHabit:     { type: String, enum: ['yes','no'] },
  exerciseFreq:      { type: String, enum: ['daily','weekly','occasionally'] },
  smokingDrinking:   { type: String, enum: ['yes','no'] },
  mentalHealthCondition: { type: String, enum: ['anxiety','depression','none','prefer-not-to-say'] },
  currentMedication: String,

  moduleProgress: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProfileSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });
ProfileSchema.index({ user: 1 });

const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);


// ─────────────────────────────────────────────────────────────
//  3. MOOD MODEL
//  Each document = one emotion log entry.
//  capturedVia tracks whether it came from the ML face-analysis
//  or was manually selected by the user.
//  Compound index on (user, createdAt) speeds up "last 30 days" queries.
// ─────────────────────────────────────────────────────────────
const MoodSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 0=Angry, 1=Disgust, 2=Fear, 3=Happy, 4=Neutral, 5=Sad, 6=Surprise
  value: { type: Number, required: true, min: 0, max: 6 },
  label: {
    type: String, required: true,
    enum: ['Angry','Disgust','Fear','Happy','Neutral','Sad','Surprise','Calm','Anxious','Ecstatic'],
  },
  energyLevel: { type: Number, min: 1, max: 10, default: 5 },
  notes:       { type: String, maxlength: 500 },
  capturedVia: { type: String, enum: ['manual','ai'], default: 'manual' },
  createdAt:   { type: Date, default: Date.now },
});

MoodSchema.index({ user: 1, createdAt: -1 });

const Mood = mongoose.models.Mood || mongoose.model('Mood', MoodSchema);


// ─────────────────────────────────────────────────────────────
//  4. CONVERSATION MODEL
//  Every AI chat turn is one document (userMessage + aiResponse).
//  TTL index auto-deletes documents older than 90 days to save space.
//  type='emergency' flags when crisis keywords were detected.
// ─────────────────────────────────────────────────────────────
const ConversationSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userMessage: { type: String, required: true, maxlength: 1000 },
  aiResponse:  { type: String, required: true, maxlength: 2000 },
  type:        { type: String, enum: ['normal','emergency','fallback'], default: 'normal' },

  mood: { label: String, confidence: Number, detectedAt: Date },

  metadata: {
    timestamp:      { type: Date, default: Date.now },
    responseLength: Number,
    processingTime: Number,
    aiModel:        String,
  },

  createdAt: { type: Date, default: Date.now },
});

ConversationSchema.index({ user: 1, createdAt: -1 });
ConversationSchema.index({ user: 1, type: 1 });
// Auto-expire after 90 days
ConversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);


// ─────────────────────────────────────────────────────────────
//  5. MENTAL HEALTH REPORT MODEL
//  Stores results of clinical-style questionnaires:
//    DASS-21 — Depression Anxiety Stress Scale (21 items)
//    GAD-7   — Generalized Anxiety Disorder (7 items)
//    PHQ-9   — Patient Health Questionnaire (9 items)
//  Also stores biometric vitals and lifestyle factors.
//  overallRisk is calculated by the controller, not stored raw.
// ─────────────────────────────────────────────────────────────
const RecommendationSchema = new mongoose.Schema({
  category:    { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
}, { _id: false });

const MentalHealthReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  vitals: {
    systolic:      { type: Number, required: true, min: 70,  max: 250 },
    diastolic:     { type: Number, required: true, min: 40,  max: 150 },
    heartRate:     { type: Number, required: true, min: 40,  max: 200 },
    sleepDuration: { type: Number, required: true, min: 0,   max: 24 },
    temperature:   { type: Number, min: 35, max: 42 },  // Celsius
  },

  lifestyle: {
    exerciseFrequency: { type: String, enum: ['never','rarely','sometimes','often','daily'] },
    smokingStatus:     { type: String, enum: ['never','former','current','occasional'] },
    alcoholConsumption:{ type: String, enum: ['never','rarely','occasionally','regularly','daily'] },
    screenTime:        Number,
    chronicConditions: String,
    medications:       String,
  },

  // DASS-21 subscale results
  dass21: {
    depression: {
      score:    { type: Number, required: true, min: 0, max: 42 },
      severity: { type: String, enum: ['normal','mild','moderate','severe'], required: true },
    },
    anxiety: {
      score:    { type: Number, required: true, min: 0, max: 42 },
      severity: { type: String, enum: ['normal','mild','moderate','severe'], required: true },
    },
    stress: {
      score:    { type: Number, required: true, min: 0, max: 42 },
      severity: { type: String, enum: ['normal','mild','moderate','severe'], required: true },
    },
  },

  // Generalized Anxiety Disorder (7-item)
  gad7: {
    score:    { type: Number, required: true, min: 0, max: 21 },
    severity: { type: String, enum: ['normal','mild','moderate','severe'], required: true },
  },

  // Patient Health Questionnaire (9-item)
  phq9: {
    score:    { type: Number, required: true, min: 0, max: 27 },
    severity: { type: String, enum: ['normal','minimal','mild','moderate','severe'], required: true },
  },

  overallRisk:     { type: String, enum: ['low','moderate','high','severe'], required: true },
  recommendations: [RecommendationSchema],
  reportVersion:   { type: String, default: '2.0' },
  createdAt:       { type: Date, default: Date.now },
});

MentalHealthReportSchema.index({ user: 1, createdAt: -1 });

const MentalHealthReport = mongoose.models.MentalHealthReport ||
  mongoose.model('MentalHealthReport', MentalHealthReportSchema);


// ─────────────────────────────────────────────────────────────
//  6. APPOINTMENT MODEL
//  Counselor session bookings.
//  bookingId is auto-generated (timestamp + random = unique).
//  totalAmount = consultationFee + platformFee (computed pre-save).
// ─────────────────────────────────────────────────────────────
function generateBookingId () {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ZEN-${ts}-${rand}`;
}

const AppointmentSchema = new mongoose.Schema({
  // Patient
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName:  { type: String, required: true, trim: true },
  patientEmail: { type: String, required: true, trim: true, lowercase: true },
  patientPhone: { type: String, required: true, trim: true },

  // Specialist
  specialistId:       { type: String, required: true },
  specialistName:     { type: String, required: true },
  specialistRole:     { type: String, required: true },
  specialistSpecialty:{ type: String, required: true },

  // Schedule
  appointmentDate: { type: Date,   required: true },
  appointmentTime: { type: String, required: true },
  duration:        { type: Number, default: 60 },   // minutes

  counselingType: {
    type: String, required: true,
    enum: ['video-call','phone-call','in-office'], default: 'video-call',
  },

  concerns: { type: String, trim: true },

  // Booking meta
  bookingId:   { type: String, unique: true, default: generateBookingId },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },

  // Payment
  consultationFee: { type: Number, required: true, default: 1500 },
  platformFee:     { type: Number, default: 0 },
  totalAmount:     { type: Number },
  paymentStatus:   { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },

  // Meeting (video/phone)
  meetingLink: String,
  meetingId:   String,

  officeAddress: { type: String, default: 'Zensutra Care Centre, Main Branch' },
}, { timestamps: true });

AppointmentSchema.pre('save', function (next) {
  if (!this.bookingId) this.bookingId = generateBookingId();
  if (this.totalAmount == null) this.totalAmount = (this.consultationFee || 0) + (this.platformFee || 0);
  next();
});

AppointmentSchema.index({ user: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientEmail: 1, appointmentDate: 1 });
AppointmentSchema.index({ specialistId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ bookingId: 1 }, { unique: true });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);


// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────
module.exports = { User, Profile, Mood, Conversation, MentalHealthReport, Appointment };