// ============================================================
//  ZENSUTRA — Combined Controllers
//  Files: moodController | profileController |
//         mentalHealthController | appointmentController |
//         settingsController
//  ────────────────────────────────────────────────────────────
//  Each section is clearly delimited with comments.
//  All controllers follow:  validate → DB → respond
// ============================================================

const { Mood, Profile, User, MentalHealthReport, Appointment, Conversation, Journal } = require('./models');
const axios      = require('axios');
const FormData   = require('form-data');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const sendEmail  = require('./emailservice');

// ╔══════════════════════════════════════════════════════════════╗
//  MOOD CONTROLLER
//  POST   /api/mood          → saveMood
//  GET    /api/mood          → getMoodHistory
//  GET    /api/mood/recent   → getRecentMood
//  POST   /api/mood/analyze  → analyzeMoodFromImage (ML service)
// ╚══════════════════════════════════════════════════════════════╝

// Save a manual mood entry
exports.saveMood = async (req, res) => {
  try {
    const { value, label, notes, energyLevel, capturedVia } = req.body;

    if (label === undefined || value === undefined)
      return res.status(400).json({ success: false, message: 'Mood label and value required.' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let mood = await Mood.findOne({
      user: req.user.id,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    if (mood) {
      mood.value = value;
      mood.label = label;
      mood.energyLevel = energyLevel || 5;
      mood.notes = notes || '';
      mood.capturedVia = capturedVia || 'manual';
      await mood.save();
    } else {
      mood = await Mood.create({
        user: req.user.id, value, label,
        energyLevel: energyLevel || 5,
        notes: notes || '',
        capturedVia: capturedVia || 'manual',
      });
    }

    res.status(mood.isNew ? 201 : 200).json({ success: true, data: mood, message: mood.isNew ? 'Mood logged.' : 'Mood updated for today.' });
  } catch (err) {
    console.error('saveMood error:', err);
    res.status(500).json({ success: false, message: 'Could not save mood.' });
  }
};

// Paginated mood history
exports.getMoodHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip  = (page - 1) * limit;

    const [moods, total] = await Promise.all([
      Mood.find({ user: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Mood.countDocuments({ user: req.user.id }),
    ]);

    res.status(200).json({
      success: true, count: moods.length, total,
      pages: Math.ceil(total / limit), data: moods,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve mood history.' });
  }
};

// Most recent mood (within last 2 hours flag)
exports.getRecentMood = async (req, res) => {
  try {
    const mood = await Mood.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!mood) return res.status(404).json({ success: false, message: 'No mood entries yet.' });

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    res.status(200).json({ success: true, data: mood, isRecent: mood.createdAt > twoHoursAgo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve recent mood.' });
  }
};

// Analyze mood from webcam image via Python ML service
exports.analyzeMoodFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });

    const form = new FormData();
    form.append('image', req.file.buffer, { filename: 'capture.jpg', contentType: req.file.mimetype });

    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000/predict_emotion';

    try {
      const mlRes = await axios.post(mlUrl, form, {
        headers: { ...form.getHeaders() },
        timeout: 10000,
      });

      if (!mlRes.data?.moodLabel)
        throw new Error('Invalid ML response.');

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      let mood = await Mood.findOne({
        user: req.user.id,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      });

      if (mood) {
        mood.value = mlRes.data.mood;
        mood.label = mlRes.data.moodLabel;
        mood.capturedVia = 'ai';
        await mood.save();
      } else {
        mood = await Mood.create({
          user: req.user.id,
          value: mlRes.data.mood,
          label: mlRes.data.moodLabel,
          capturedVia: 'ai',
        });
      }

      return res.status(200).json({ success: true, data: { ...mlRes.data, id: mood._id, createdAt: mood.createdAt } });

    } catch (mlErr) {
      console.warn('ML service unavailable, using fallback:', mlErr.message);
      // Fallback: random mood (demo only)
      const labels = ['Angry','Disgust','Fear','Happy','Neutral','Sad','Surprise'];
      const value  = Math.floor(Math.random() * 7);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      let mood = await Mood.findOne({
        user: req.user.id,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      });

      if (mood) {
        mood.value = value;
        mood.label = labels[value];
        mood.capturedVia = 'ai';
        mood.notes = 'ML fallback';
        await mood.save();
      } else {
        mood = await Mood.create({ user: req.user.id, value, label: labels[value], capturedVia: 'ai', notes: 'ML fallback' });
      }

      return res.status(200).json({ success: true, data: { mood: value, moodLabel: labels[value], id: mood._id, createdAt: mood.createdAt }, note: 'ML unavailable — fallback used.' });
    }

  } catch (err) {
    console.error('analyzeMood error:', err);
    res.status(500).json({ success: false, message: 'Could not analyze mood from image.' });
  }
};


// ╔══════════════════════════════════════════════════════════════╗
//  PROFILE CONTROLLER
//  GET /api/user/profile   → getProfile
//  PUT /api/user/profile   → updateProfile
// ╚══════════════════════════════════════════════════════════════╝

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'firstName lastName email dob');

    if (!profile) {
      // Return basic user data if no extended profile yet
      const user = await User.findById(req.user.id).select('-password');
      return res.status(200).json({
        success: true,
        profile: { firstName: user.firstName, lastName: user.lastName, email: user.email, dob: user.dob },
        message: 'No extended profile yet.',
      });
    }

    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id };
    delete data._id;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      data,
      { new: true, upsert: true, runValidators: true }
    );

    // Sync first/last name back to User doc
    const nameUpdate = {};
    if (data.firstName) nameUpdate.firstName = data.firstName;
    if (data.lastName)  nameUpdate.lastName  = data.lastName;
    if (Object.keys(nameUpdate).length) await User.findByIdAndUpdate(req.user.id, nameUpdate);

    res.status(200).json({ success: true, profile, message: 'Profile updated.' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};


// ╔══════════════════════════════════════════════════════════════╗
//  MENTAL HEALTH CONTROLLER
//  POST /api/mental-health/analyze  → analyzeMentalHealth
//  GET  /api/mental-health/reports  → getMentalHealthReports
//  GET  /api/mental-health/reports/:id → getMentalHealthReport
// ╚══════════════════════════════════════════════════════════════╝

exports.analyzeMentalHealth = async (req, res) => {
  try {
    const { vitals, lifestyle, dass21, gad7, phq9 } = req.body;

    if (!vitals || !dass21 || !gad7 || !phq9)
      return res.status(400).json({ success: false, message: 'Vitals, DASS-21, GAD-7 and PHQ-9 are required.' });

    // Convert Fahrenheit → Celsius if needed
    let v = { ...vitals };
    if (v.temperature && v.temperature > 50) {
      v.temperature = Math.round(((v.temperature - 32) * 5 / 9) * 10) / 10;
    }

    const overallRisk     = calcOverallRisk(dass21, gad7, phq9);
    const recommendations = buildRecommendations(dass21, gad7, phq9, v, lifestyle);

    const report = await MentalHealthReport.create({
      user: req.user.id, vitals: v, lifestyle: lifestyle || {},
      dass21, gad7, phq9, overallRisk, recommendations,
    });

    await report.populate('user', 'firstName lastName email');
    res.status(201).json({ success: true, message: 'Analysis complete.', data: report });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Mental health analysis error:', err);
    res.status(500).json({ success: false, message: 'Analysis failed.' });
  }
};

exports.getMentalHealthReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [reports, total] = await Promise.all([
      MentalHealthReport.find({ user: req.user.id })
        .sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit)
        .populate('user', 'firstName lastName email'),
      MentalHealthReport.countDocuments({ user: req.user.id }),
    ]);

    res.status(200).json({ success: true, data: reports, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve reports.' });
  }
};

exports.getMentalHealthReport = async (req, res) => {
  try {
    const report = await MentalHealthReport.findOne({ _id: req.params.id, user: req.user.id })
      .populate('user', 'firstName lastName email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve report.' });
  }
};

// Risk + recommendation helpers
function calcOverallRisk (dass21, gad7, phq9) {
  const scores = [
    dass21.depression.score / 42,
    dass21.anxiety.score   / 42,
    dass21.stress.score    / 42,
    gad7.score             / 21,
    phq9.score             / 27,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg < 0.15) return 'low';
  if (avg < 0.35) return 'moderate';
  if (avg < 0.55) return 'high';
  return 'severe';
}

function buildRecommendations (dass21, gad7, phq9, vitals, lifestyle) {
  const recs = [];

  if (dass21.stress.severity !== 'normal')
    recs.push({ category: 'Stress', title: 'Daily Breathing Practice', description: 'Try box breathing (4-4-4-4) twice daily to lower cortisol and reset your nervous system.', priority: 'high' });

  if (dass21.anxiety.severity !== 'normal' || gad7.score > 5)
    recs.push({ category: 'Anxiety', title: 'Ground Yourself Daily', description: 'Use the 5-4-3-2-1 grounding technique when anxiety spikes: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.', priority: 'high' });

  if (dass21.depression.severity !== 'normal' || phq9.score > 4)
    recs.push({ category: 'Depression', title: 'Sunlight & Movement', description: 'A 15-minute outdoor walk daily has proven antidepressant effects. Combine with a brief gratitude log each evening.', priority: 'high' });

  if (vitals.sleepDuration < 6)
    recs.push({ category: 'Sleep', title: 'Improve Sleep Hygiene', description: 'Aim for 7–8 hours. Keep a consistent bedtime, avoid screens 30 min before sleep, and try a short progressive muscle relaxation.', priority: 'medium' });

  if (lifestyle?.exerciseFrequency === 'never' || lifestyle?.exerciseFrequency === 'rarely')
    recs.push({ category: 'Exercise', title: 'Start Small — Move Daily', description: 'Even 20 minutes of light exercise (walk, yoga, dance) significantly reduces anxiety and depression symptoms.', priority: 'medium' });

  recs.push({ category: 'Support', title: 'Talk to a Zensutra Counselor', description: 'Book a confidential session with one of our certified counselors — the first step is always the hardest and always worth it.', priority: 'medium' });

  return recs;
}


// ╔══════════════════════════════════════════════════════════════╗
//  APPOINTMENT CONTROLLER
//  POST /api/appointments        → bookAppointment
//  GET  /api/appointments        → getUserAppointments
//  GET  /api/appointments/:id    → getAppointmentById
//  PUT  /api/appointments/:id/cancel → cancelAppointment
// ╚══════════════════════════════════════════════════════════════╝

exports.bookAppointment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const aptData = {
      ...req.body,
      user: req.user.id,
      patientName:  `${user.firstName} ${user.lastName}`,
      patientEmail: user.email,
    };

    const apt = await Appointment.create(aptData);

    // Confirmation email
    sendEmail({
      to:      user.email,
      subject: `Zensutra — Appointment Confirmed (${apt.bookingId})`,
      text:    `Your appointment with ${apt.specialistName} on ${new Date(apt.appointmentDate).toDateString()} at ${apt.appointmentTime} is confirmed. Booking ID: ${apt.bookingId}`,
      html:    `<div style="font-family:sans-serif;background:#0a0e14;padding:32px;border-radius:16px;color:#e8eaf0;">
        <h2 style="color:#52b788">Appointment Confirmed ✅</h2>
        <p><b>Counselor:</b> ${apt.specialistName} (${apt.specialistSpecialty})</p>
        <p><b>Date:</b> ${new Date(apt.appointmentDate).toDateString()} at ${apt.appointmentTime}</p>
        <p><b>Mode:</b> ${apt.counselingType}</p>
        <p><b>Booking ID:</b> <code>${apt.bookingId}</code></p>
        <p style="color:#8892a4;font-size:13px;margin-top:24px;">Zensutra — Your wellness companion 💚</p>
      </div>`,
    }).catch(console.warn);

    res.status(201).json({ success: true, data: apt, message: 'Appointment booked! Confirmation sent.' });
  } catch (err) {
    console.error('bookAppointment error:', err);
    res.status(500).json({ success: false, message: 'Could not book appointment.' });
  }
};

exports.getUserAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const [apts, total] = await Promise.all([
      Appointment.find(query).sort({ appointmentDate: 1 }).limit(limit).skip((page - 1) * limit),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json({ success: true, data: apts, pagination: { total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve appointments.' });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const apt = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.status(200).json({ success: true, data: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve appointment.' });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    if (apt.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled.' });

    apt.status = 'cancelled';
    await apt.save();

    res.status(200).json({ success: true, message: 'Appointment cancelled.', data: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not cancel appointment.' });
  }
};


// ╔══════════════════════════════════════════════════════════════╗
//  SETTINGS CONTROLLER
//  GET  /api/settings/account-info  → getAccountInfo
//  POST /api/settings/change-password → changePassword
//  POST /api/settings/change-email   → requestEmailChange
//  GET  /api/settings/export-data    → exportUserData
//  DELETE /api/settings/delete-account → deleteAccount
// ╚══════════════════════════════════════════════════════════════╝

exports.getAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({
      success: true,
      accountInfo: {
        email:              user.email,
        createdAt:          user.createdAt,
        lastPasswordChange: user.lastPasswordChange,
        isVerified:         user.isVerified,
        role:               user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect.' });

    user.password = newPassword;
    await user.save(); // pre-save hook hashes it

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not change password.' });
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, profile, moods, conversations, reports, appointments, journals] = await Promise.all([
      User.findById(userId).select('-password -verificationToken -resetPasswordToken'),
      Profile.findOne({ user: userId }),
      Mood.find({ user: userId }).sort({ createdAt: -1 }),
      Conversation.find({ user: userId }).sort({ createdAt: -1 }).limit(200),
      MentalHealthReport.find({ user: userId }).sort({ createdAt: -1 }),
      Appointment.find({ user: userId }).sort({ appointmentDate: -1 }),
      Journal.find({ user: userId }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: { user, profile, moods, conversations, reports, appointments, journals },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not export data.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Cascade delete all user data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Profile.deleteMany({ user: userId }),
      Mood.deleteMany({ user: userId }),
      Conversation.deleteMany({ user: userId }),
      MentalHealthReport.deleteMany({ user: userId }),
      Appointment.deleteMany({ user: userId }),
      Journal.deleteMany({ user: userId }),
    ]);

    res.status(200).json({ success: true, message: 'Account and all data permanently deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete account.' });
  }
};


// ╔══════════════════════════════════════════════════════════════╗
//  JOURNAL CONTROLLER
//  POST   /api/journal      → saveJournal
//  GET    /api/journal      → getJournals
//  DELETE /api/journal/:id  → deleteJournal
// ╚══════════════════════════════════════════════════════════════╝

exports.saveJournal = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Journal body is required.' });
    }

    const journal = await Journal.create({
      user: req.user.id,
      title: title ? title.trim() : 'Untitled',
      body: body.trim(),
    });

    res.status(201).json({ success: true, message: 'Journal entry saved.', journal });
  } catch (err) {
    console.error('Save journal error:', err);
    res.status(500).json({ success: false, message: 'Could not save journal entry.' });
  }
};

exports.getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, journals });
  } catch (err) {
    console.error('Get journals error:', err);
    res.status(500).json({ success: false, message: 'Could not retrieve journal entries.' });
  }
};

exports.deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }
    res.status(200).json({ success: true, message: 'Journal entry deleted.' });
  } catch (err) {
    console.error('Delete journal error:', err);
    res.status(500).json({ success: false, message: 'Could not delete journal entry.' });
  }
};