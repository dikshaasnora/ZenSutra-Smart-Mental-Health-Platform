// ============================================================
//  ZENSUTRA — Database Setup & Seed Script
//  File: Database/setup.js
//  ────────────────────────────────────────────────────────────
//  Run once to:
//    1. Connect to MongoDB
//    2. Create all indexes (they are also created by Mongoose
//       on first server start, but this script creates them
//       explicitly and verifies them)
//    3. Seed sample data for development / demo
//
//  Usage:
//    node Database/setup.js            (connect to local MongoDB)
//    MONGO_URI=<atlas_uri> node Database/setup.js
//
//  COLLECTIONS CREATED:
//    users, profiles, moods, conversations, mentalhealthreports, appointments
//
//  ARCHITECTURE OVERVIEW:
//    ┌─────────────────────────────────────────────────────────┐
//    │                    ZENSUTRA DATABASE                    │
//    │                   (MongoDB / Mongoose)                  │
//    ├──────────────┬──────────────────┬───────────────────────┤
//    │   users      │  profiles        │  moods                │
//    │  ─────────── │  ─────────────── │  ─────────────────    │
//    │  _id         │  _id             │  _id                  │
//    │  firstName   │  user → User._id │  user → User._id      │
//    │  lastName    │  gender          │  value (0–6)          │
//    │  email (idx) │  dob             │  label                │
//    │  mobile (idx)│  college         │  energyLevel          │
//    │  dob         │  course          │  notes                │
//    │  password ✗  │  sleep pattern   │  capturedVia          │
//    │  role        │  exercise        │  createdAt (idx)      │
//    │  isVerified  │  moduleProgress  │                       │
//    │  tokens…     │  createdAt       │                       │
//    ├──────────────┴──────────────────┴───────────────────────┤
//    │   conversations    │  mentalhealthreports                │
//    │  ───────────────── │  ───────────────────────────────    │
//    │  user → User._id   │  user → User._id                   │
//    │  userMessage       │  vitals {}                         │
//    │  aiResponse        │  lifestyle {}                      │
//    │  type              │  dass21 {}                         │
//    │  mood {}           │  gad7 {}                           │
//    │  metadata {}       │  phq9 {}                           │
//    │  createdAt (TTL)   │  overallRisk                       │
//    │                    │  recommendations []                │
//    ├────────────────────┴────────────────────────────────────┤
//    │                      appointments                        │
//    │  user → User._id                                        │
//    │  patientName / email / phone                            │
//    │  specialistId / name / role / specialty                 │
//    │  appointmentDate / time / duration                      │
//    │  counselingType (video/phone/in-office)                 │
//    │  bookingId (unique)                                     │
//    │  status / paymentStatus                                 │
//    └─────────────────────────────────────────────────────────┘
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');

// Load models
const { User, Profile, Mood, Conversation, MentalHealthReport, Appointment } =
  require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zensutra';

async function setup () {
  console.log('\n🔧  Zensutra Database Setup\n' + '─'.repeat(50));

  // ── Connect ────────────────────────────────────────────────
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));

  // ── Verify indexes ─────────────────────────────────────────
  console.log('\n📑  Verifying indexes...');
  await User.syncIndexes();
  await Profile.syncIndexes();
  await Mood.syncIndexes();
  await Conversation.syncIndexes();
  await MentalHealthReport.syncIndexes();
  await Appointment.syncIndexes();
  console.log('✅  All indexes synced.');

  // ── Seed demo data (only in development) ──────────────────
  if (process.env.NODE_ENV === 'production') {
    console.log('\n⚠️  Skipping seed in production mode.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n🌱  Seeding demo data...');

  // Create demo user
  const existing = await User.findOne({ email: 'demo@zensutra.app' });
  if (existing) {
    console.log('ℹ️  Demo user already exists — skipping seed.');
  } else {
    const demoUser = await User.create({
      firstName: 'Aryan',
      lastName:  'Rao',
      email:     'demo@zensutra.app',
      mobile:    '9876543210',
      dob:       new Date('2000-04-15'),
      password:  'demo1234',  // hashed by pre-save hook
      role:      'user',
      isVerified: true,
    });
    console.log(`✅  Demo user created: ${demoUser.email} (password: demo1234)`);

    // Profile
    await Profile.create({
      user:          demoUser._id,
      firstName:     'Aryan',
      lastName:      'Rao',
      email:         'demo@zensutra.app',
      gender:        'male',
      currentStatus: 'ug',
      collegeName:   'IIT Guwahati',
      courseName:    'B.Tech Computer Science',
      courseDuration: 4,
      currentYear:    3,
      sleepPattern:  '6-8',
      exerciseHabit: 'yes',
      exerciseFreq:  'weekly',
      mentalHealthCondition: 'none',
    });
    console.log('✅  Demo profile created.');

    // Seed 14 days of mood entries
    const moodLabels = ['Happy','Calm','Anxious','Sad','Happy','Angry','Calm','Happy','Neutral','Happy','Anxious','Calm','Sad','Happy'];
    const moodVals   = [3,4,2,5,3,2,4,3,4,3,2,4,5,3];
    const moods = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      moods.push({
        user:        demoUser._id,
        value:       moodVals[i],
        label:       moodLabels[i],
        energyLevel: Math.floor(Math.random() * 5) + 4,
        capturedVia: 'manual',
        createdAt:   date,
      });
    }
    await Mood.insertMany(moods);
    console.log('✅  14 days of mood data seeded.');

    // Sample conversation
    await Conversation.create({
      user:        demoUser._id,
      userMessage: "I've been feeling really stressed about my upcoming exams. I can't focus.",
      aiResponse:  "I hear you — exam stress can feel really overwhelming. Take a deep breath with me first. 🌿 One thing that often helps: try breaking your study into 25-minute focused blocks with 5-minute breaks (Pomodoro technique). This makes the task feel less daunting. Also, what's the most important subject you need to tackle today?",
      type:        'normal',
    });
    console.log('✅  Sample conversation seeded.');

    // Sample mental health report
    await MentalHealthReport.create({
      user: demoUser._id,
      vitals: { systolic: 118, diastolic: 76, heartRate: 72, sleepDuration: 7, temperature: 36.8 },
      lifestyle: { exerciseFrequency: 'sometimes', smokingStatus: 'never', alcoholConsumption: 'never', screenTime: 6 },
      dass21: {
        depression: { score: 6,  severity: 'mild' },
        anxiety:    { score: 10, severity: 'moderate' },
        stress:     { score: 14, severity: 'moderate' },
      },
      gad7:  { score: 7,  severity: 'mild' },
      phq9:  { score: 5,  severity: 'mild' },
      overallRisk: 'moderate',
      recommendations: [
        { category:'Stress',  title:'Daily Breathing Practice', description:'Try box breathing twice daily.', priority:'high' },
        { category:'Anxiety', title:'Ground Yourself Daily',    description:'Use 5-4-3-2-1 grounding technique.', priority:'high' },
        { category:'Support', title:'Talk to a Counselor',      description:'Book a session with a Zensutra counselor.', priority:'medium' },
      ],
    });
    console.log('✅  Sample mental health report seeded.');
  }

  // Print collection stats
  console.log('\n📊  Collection counts:');
  const counts = await Promise.all([
    User.countDocuments(),
    Profile.countDocuments(),
    Mood.countDocuments(),
    Conversation.countDocuments(),
    MentalHealthReport.countDocuments(),
    Appointment.countDocuments(),
  ]);
  const names = ['users','profiles','moods','conversations','reports','appointments'];
  names.forEach((n,i) => console.log(`   ${n.padEnd(15)} ${counts[i]}`));

  console.log('\n✨  Setup complete!\n');
  console.log('Demo login credentials:');
  console.log('  Email:    demo@zensutra.app');
  console.log('  Password: demo1234\n');

  await mongoose.disconnect();
}

setup().catch(err => {
  console.error('❌  Setup failed:', err);
  process.exit(1);
});