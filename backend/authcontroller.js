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

// ── GET /api/auth/:provider ──────────────────────────────────
exports.oauthRedirect = (req, res) => {
  const provider = req.params.provider.toLowerCase();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  let authUrl = '';

  switch (provider) {
    case 'google':
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${backendUrl}/api/auth/google/callback&response_type=code&scope=email profile`;
      break;
    case 'microsoft':
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&redirect_uri=${backendUrl}/api/auth/microsoft/callback&response_type=code&response_mode=query&scope=User.Read openid profile email`;
      break;

    case 'apple':
      authUrl = `https://appleid.apple.com/auth/authorize?client_id=${process.env.APPLE_CLIENT_ID}&redirect_uri=${backendUrl}/api/auth/apple/callback&response_type=code id_token&response_mode=form_post&scope=name email`;
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported provider' });
  }

  res.redirect(authUrl);
};

// ── GET or POST /api/auth/:provider/callback ─────────────────
exports.oauthCallback = async (req, res) => {
  const provider = req.params.provider.toLowerCase();
  const { code } = req.query; // For Google, Microsoft
  const bodyCode = req.body?.code; // For Apple (form_post)
  const actualCode = code || bodyCode;

  if (!actualCode) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  const redirectUri = `${backendUrl}/api/auth/${provider}/callback`;

  try {
    let email, firstName, lastName;

    if (provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: actualCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('Google token exchange failed');

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();
      email = userData.email;
      firstName = userData.given_name || 'Google';
      lastName = userData.family_name || 'User';

    } else if (provider === 'microsoft') {
      const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code: actualCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('Microsoft token exchange failed');

      const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();
      email = userData.userPrincipalName || userData.mail;
      firstName = userData.givenName || 'Microsoft';
      lastName = userData.surname || 'User';



    } else if (provider === 'apple') {
      // Apple requires generating a JWT client_secret
      const clientSecret = jwt.sign({}, process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), {
        algorithm: 'ES256',
        expiresIn: '180d',
        issuer: process.env.APPLE_TEAM_ID,
        audience: 'https://appleid.apple.com',
        subject: process.env.APPLE_CLIENT_ID,
        keyid: process.env.APPLE_KEY_ID,
      });

      const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.APPLE_CLIENT_ID,
          client_secret: clientSecret,
          code: actualCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.id_token) throw new Error('Apple token exchange failed');

      const decodedIdToken = jwt.decode(tokenData.id_token);
      email = decodedIdToken.email;
      
      // Apple only sends name on the FIRST ever login in req.body.user
      const appleUser = req.body?.user ? JSON.parse(req.body.user) : null;
      firstName = appleUser?.name?.firstName || 'Apple';
      lastName = appleUser?.name?.lastName || 'User';
    }

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_email`);
    }

    // ── Create or Find User ──
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const uuid = crypto.randomBytes(3).toString('hex');
      user = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        mobile: `${provider}_${uuid}`,
        dob: new Date('2000-01-01'),
        password: crypto.randomBytes(16).toString('hex'),
        isVerified: true,
        role: 'user',
      });
    }

    // Generate Zensutra JWT
    const token = signToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);

  } catch (err) {
    console.error(`${provider} auth error:`, err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};