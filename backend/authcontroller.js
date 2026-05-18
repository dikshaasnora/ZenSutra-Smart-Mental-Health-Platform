// ============================================================
//  ZENSUTRA — Auth Controller
//  File: Backend/Controllers/authController.js
//  ────────────────────────────────────────────────────────────
//  Handles all authentication flows:
//    POST /api/auth/register         → register
//    POST /api/auth/verify-otp       → verifyOTP
//    POST /api/auth/resend-otp       → resendOTP
//    POST /api/auth/login            → login
//    POST /api/auth/forgot-password  → forgotPassword
//    POST /api/auth/reset-password/:token → resetPassword
// ============================================================

const crypto         = require('crypto');
const jwt            = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User }       = require('./models');
const sendEmail      = require('./emailservice');

// Helper: sign JWT
function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
}

// Helper: send token response
function sendTokenResponse(user, statusCode, res) {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:         user._id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      role:       user.role,
      isVerified: user.isVerified,
    },
  });
}

// ── POST /api/auth/register ───────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, dob, password } = req.body;

    if (!firstName || !lastName || !email || !mobile || !dob || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    // Check duplicates
    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Mobile number';
      return res.status(400).json({ success: false, message: `${field} already registered.` });
    }

    const user = await User.create({ firstName, lastName, email, mobile, dob, password, isVerified: true });

    // Instantly log the user in
    sendTokenResponse(user, 201, res);

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already in use.` });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────────
// verifyOTP and resendOTP are now deprecated but kept empty to avoid breaking legacy clients if any
exports.verifyOTP = async (req, res) => {
  res.status(400).json({ success: false, message: 'OTP verification is deprecated.' });
};

// ── POST /api/auth/resend-otp ────────────────────────────────
exports.resendOTP = async (req, res) => {
  res.status(400).json({ success: false, message: 'OTP generation is deprecated.' });
};

// ── POST /api/auth/guest ──────────────────────────────────────
exports.createGuestAccount = async (req, res) => {
  try {
    const uuid = crypto.randomBytes(4).toString('hex');
    const guestEmail = `guest_${uuid}@guest.zensutra.com`;
    const guestPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
    const guestPassword = crypto.randomBytes(8).toString('hex');

    const user = await User.create({
      firstName: 'Guest',
      lastName: 'User',
      email: guestEmail,
      mobile: guestPhone,
      dob: new Date('2000-01-01'),
      password: guestPassword,
      isVerified: true,
      role: 'user'
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Guest creation error:', err);
    res.status(500).json({ success: false, message: 'Could not create guest session.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email.',
        userId: user._id,
      });

    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user)
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    if (process.env.DEV_OTP_BYPASS === 'true') {
      console.log(`\n🔗  DEV Reset URL: ${resetUrl}\n`);
    } else {
      await sendEmail({
        to:      user.email,
        subject: 'Zensutra — Password Reset',
        text:    `Reset your password: ${resetUrl}. Valid for 10 minutes.`,
        html:    `<div style="font-family:sans-serif;background:#0a0e14;padding:32px;border-radius:16px;color:#e8eaf0;">
          <h2 style="color:#52b788">Password Reset 🔐</h2>
          <p>Click below to reset your password. Link expires in 10 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#52b788;color:#0a0e14;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
          <p style="color:#8892a4;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>`,
      });
    }

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });

  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Could not process reset request.' });
  }
};

// ── POST /api/auth/reset-password/:resetToken ─────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const hashed = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:  hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
};

// ── POST /api/auth/google ────────────────────────────────────
// Supports two flows:
//   • credential  (ID token)    → verified via google-auth-library
//   • accessToken (OAuth token) → verified via Google UserInfo API
exports.googleAuth = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    let email, firstName, lastName;

    if (credential) {
      // — Flow 1: ID token (GoogleLogin component / One Tap) —
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId)
        return res.status(500).json({ success: false, message: 'Google OAuth not configured on server.' });

      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      const payload = ticket.getPayload();
      email      = payload.email;
      firstName  = payload.given_name  || (payload.name ? payload.name.split(' ')[0] : 'Google');
      lastName   = payload.family_name || (payload.name ? payload.name.split(' ').slice(1).join(' ') : 'User');

    } else if (accessToken) {
      // — Flow 2: Access token (useGoogleLogin custom button) —
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error('Google userinfo API returned ' + resp.status);
      const info = await resp.json();
      email      = info.email;
      firstName  = info.given_name  || (info.name ? info.name.split(' ')[0] : 'Google');
      lastName   = info.family_name || (info.name ? info.name.split(' ').slice(1).join(' ') : 'User');

    } else {
      return res.status(400).json({ success: false, message: 'Google credential or accessToken is required.' });
    }

    if (!email)
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google.' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const uuid = crypto.randomBytes(3).toString('hex');
      user = await User.create({
        firstName: firstName || 'Google',
        lastName:  lastName  || 'User',
        email:     email.toLowerCase(),
        mobile:    `goauth_${uuid}`,
        dob:       new Date('2000-01-01'),
        password:  crypto.randomBytes(16).toString('hex'),
        isVerified: true,
        role:      'user',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
};

// ── POST /api/auth/microsoft ──────────────────────────────────
// Accepts MSAL-verified account info (email + name) from the browser
exports.microsoftAuth = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required for Microsoft login.' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const uuid = crypto.randomBytes(3).toString('hex');
      user = await User.create({
        firstName: firstName || 'Microsoft',
        lastName:  lastName  || 'User',
        email:     email.toLowerCase(),
        mobile:    `msauth_${uuid}`,
        dob:       new Date('2000-01-01'),
        password:  crypto.randomBytes(16).toString('hex'),
        isVerified: true,
        role:      'user',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Microsoft auth error:', err.message);
    res.status(500).json({ success: false, message: 'Microsoft authentication failed.' });
  }
};

// ── POST /api/auth/social-login ───────────────────────────────
exports.socialLogin = async (req, res) => {
  try {
    const { provider, email, firstName, lastName } = req.body;

    if (!email || !provider)
      return res.status(400).json({ success: false, message: 'Provider and email are required.' });

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a passwordless verified user for the OAuth provider
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const uuid = crypto.randomBytes(3).toString('hex');
      user = await User.create({
        firstName: firstName || provider.charAt(0).toUpperCase() + provider.slice(1),
        lastName: lastName || 'User',
        email: email.toLowerCase(),
        mobile: `oauth_${uuid}`,
        dob: new Date('2000-01-01'),
        password: randomPassword,
        isVerified: true,
        role: 'user'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ success: false, message: 'Social authentication failed.' });
  }
};