import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL, MICROSOFT_CLIENT_ID } from '../config';
import { useGoogleLogin } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';

// ── Microsoft MSAL configuration ─────────────────────────────
// The instance is created once outside the component so it's stable
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
});
let msalInitialized = false;

const AuthPage = () => {
  const { login, token } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state: 'login' | 'signup' | 'forgot'
  const [tab, setTab] = useState('login');

  // Input states
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [mobile, setMobile]       = useState('');
  const [dob, setDob]             = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'microsoft' | null

  // Sync tab based on URL path
  useEffect(() => {
    if (location.pathname === '/signup') setTab('signup');
    else if (location.pathname === '/forgot-password') setTab('forgot');
    else setTab('login');
  }, [location.pathname]);

  // Redirect if already logged in + generate particles
  useEffect(() => {
    if (token) navigate('/dashboard');

    const pc = document.getElementById('particles');
    if (pc) {
      pc.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`;
        pc.appendChild(p);
      }
    }
  }, [token]);

  // Initialise MSAL once
  useEffect(() => {
    if (!msalInitialized) {
      msalInstance.initialize().then(() => { msalInitialized = true; }).catch(() => {});
    }
  }, []);

  // ── Email / password handlers ─────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showError('Please enter both email and password.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess(`Welcome back, ${data.user.firstName}! 🌱`);
        navigate('/dashboard');
      } else {
        showError(data.message || 'Login failed.');
      }
    } catch { showError('Server connection failed. Is the backend active?'); }
    finally  { setSubmitting(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !mobile || !dob || !password) {
      showError('Please fill in all registration fields.'); return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, mobile, dob, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess(`Welcome to ZenSutra, ${data.user.firstName}! 🚀`);
        navigate('/dashboard');
      } else {
        showError(data.message || 'Registration failed.');
      }
    } catch { showError('Server connection failed.'); }
    finally  { setSubmitting(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) { showError('Please write your email address.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { showSuccess('Password reset link sent to email.'); setTab('login'); }
      else               showError(data.message || 'Forgot password request failed.');
    } catch { showError('Server connection failed.'); }
    finally  { setSubmitting(false); }
  };

  const handleGuest = async () => {
    showInfo('Creating secure Guest session... 🍀');
    try {
      const res  = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess('Continuing as Guest 🍀');
        navigate('/dashboard');
      } else {
        showError('Could not launch guest session.');
      }
    } catch {
      login('guest', { firstName: 'Guest', lastName: '' });
      showSuccess('Continuing as Guest (Offline) 🍀');
      navigate('/dashboard');
    }
  };

  // ── REAL Google OAuth ─────────────────────────────────────────
  // useGoogleLogin triggers an OAuth popup → returns access_token
  // We send the access_token to our backend, which calls Google's userinfo API
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        showInfo('Verifying Google account... 🔐');
        const res  = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (data.success) {
          login(data.token, data.user);
          showSuccess(`Welcome, ${data.user.firstName}! Signed in with Google 🎉`);
          navigate('/dashboard');
        } else {
          showError(data.message || 'Google sign-in failed.');
        }
      } catch {
        showError('Google authentication error. Please try again.');
      } finally {
        setOauthLoading(null);
      }
    },
    onError: (err) => {
      console.error('Google login error:', err);
      showError('Google sign-in was cancelled or failed.');
      setOauthLoading(null);
    },
    flow: 'implicit',
  });

  const handleGoogleLogin = () => {
    setOauthLoading('google');
    googleLogin();
  };

  // ── REAL Microsoft OAuth (MSAL) ───────────────────────────────
  // MSAL loginPopup opens Microsoft's real sign-in window
  // We extract email + name from the account claims and send to backend
  const handleMicrosoftLogin = async () => {
    setOauthLoading('microsoft');
    try {
      if (!msalInitialized) await msalInstance.initialize();
      msalInitialized = true;

      const result = await msalInstance.loginPopup({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      });

      const account = result.account;
      const claims  = result.idTokenClaims || {};

      const msEmail     = account.username || claims.email || claims.preferred_username;
      const msFirstName = claims.given_name  || account.name?.split(' ')[0]  || 'Microsoft';
      const msLastName  = claims.family_name || account.name?.split(' ').slice(1).join(' ') || 'User';

      showInfo('Verifying Microsoft account... 🔐');
      const res  = await fetch(`${API_URL}/api/auth/microsoft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: msEmail, firstName: msFirstName, lastName: msLastName }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess(`Welcome, ${data.user.firstName}! Signed in with Microsoft 🎉`);
        navigate('/dashboard');
      } else {
        showError(data.message || 'Microsoft sign-in failed.');
      }
    } catch (err) {
      if (err?.errorCode === 'user_cancelled') {
        showError('Microsoft sign-in was cancelled.');
      } else {
        console.error('Microsoft login error:', err);
        showError('Microsoft sign-in failed. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  // ── Shared OAuth button label helper ────────────────────────
  const oauthBtnContent = (provider, icon, color, label) => {
    const loading = oauthLoading === provider;
    return (
      <>
        {loading
          ? <span className="oauth-spinner" />
          : <i className={`fab ${icon}`} style={{ color }} />
        }
        {loading ? 'Connecting...' : label}
      </>
    );
  };

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" /></div>
      <div className="particles" id="particles" />

      <div style={{ display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'DM Sans',sans-serif" }}>
        <div className="card" style={{ width:'440px',maxWidth:'100%',padding:'36px',background:'var(--glass)',borderRadius:'24px',border:'1px solid var(--border)',boxShadow:'var(--shadow)' }}>

          {/* Logo */}
          <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:'10px',marginBottom:'30px',cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{ fontSize:'32px' }}>🧠</div>
            <span style={{ fontSize:'26px',fontWeight:800,color:'#fff',fontFamily:"'DM Serif Display',serif" }}>Zensutra</span>
          </div>

          {/* ── LOGIN TAB ── */}
          {tab === 'login' && (
            <>
              <h2 style={{ fontSize:'22px',fontWeight:700,color:'#fff',marginBottom:'8px',textAlign:'center' }}>Welcome Back</h2>
              <p style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'24px',textAlign:'center' }}>Sign in to continue your mental wellness journey</p>

              <form onSubmit={handleLogin}>
                <div className="form-group" style={{ marginBottom:'14px' }}>
                  <label className="form-label">Email address</label>
                  <div className="input-wrap">
                    <i className="fas fa-envelope input-icon" />
                    <input className="form-input" type="email" placeholder="student@university.edu" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom:'18px' }}>
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <i className="fas fa-lock input-icon" />
                    <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                      <i className={`fas fa-eye${showPassword ? '-slash' : ''}`} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom:'16px' }}>
                  {submitting ? 'Authenticating...' : <><i className="fas fa-sign-in-alt" /> Log In</>}
                </button>
              </form>

              {/* OAuth divider */}
              <div style={{ display:'flex',alignItems:'center',gap:'10px',margin:'4px 0 14px' }}>
                <div style={{ flex:1,height:'1px',background:'var(--border)' }} />
                <span style={{ fontSize:'11px',color:'var(--muted)',whiteSpace:'nowrap' }}>or continue with</span>
                <div style={{ flex:1,height:'1px',background:'var(--border)' }} />
              </div>

              {/* Real OAuth Buttons */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px' }}>
                <button
                  id="btn-google-login"
                  className="btn btn-ghost oauth-btn"
                  onClick={handleGoogleLogin}
                  disabled={!!oauthLoading}
                  style={{ background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'13px',fontWeight:500,padding:'11px',borderRadius:'12px',cursor:oauthLoading?'not-allowed':'pointer',opacity:oauthLoading&&oauthLoading!=='google'?0.5:1,transition:'all .2s' }}
                >
                  {oauthBtnContent('google','fa-google','#ea4335','Google')}
                </button>

                <button
                  id="btn-microsoft-login"
                  className="btn btn-ghost oauth-btn"
                  onClick={handleMicrosoftLogin}
                  disabled={!!oauthLoading}
                  style={{ background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'13px',fontWeight:500,padding:'11px',borderRadius:'12px',cursor:oauthLoading?'not-allowed':'pointer',opacity:oauthLoading&&oauthLoading!=='microsoft'?0.5:1,transition:'all .2s' }}
                >
                  {oauthBtnContent('microsoft','fa-windows','#00a4ef','Microsoft')}
                </button>
              </div>

              <button className="btn btn-ghost btn-full" onClick={handleGuest} disabled={!!oauthLoading} style={{ background:'rgba(82,183,136,0.1)',color:'var(--sage2)',fontSize:'13px',marginBottom:'20px' }}>
                Continue as Guest 🍀
              </button>

              <div style={{ display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--muted)' }}>
                <a href="#" onClick={e => { e.preventDefault(); setTab('forgot'); }} style={{ color:'var(--sage2)',textDecoration:'none' }}>Forgot Password?</a>
                <span>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setTab('signup'); }} style={{ color:'var(--sage2)',textDecoration:'none',fontWeight:600 }}>Sign up</a></span>
              </div>
            </>
          )}

          {/* ── SIGNUP TAB ── */}
          {tab === 'signup' && (
            <>
              <h2 style={{ fontSize:'22px',fontWeight:700,color:'#fff',marginBottom:'8px',textAlign:'center' }}>Create Account</h2>
              <p style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'24px',textAlign:'center' }}>Join the premium mental health platform</p>

              <form onSubmit={handleSignup}>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px' }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <div className="input-wrap"><i className="fas fa-user input-icon" /><input className="form-input" type="text" placeholder="Aryan" required value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <div className="input-wrap"><i className="fas fa-user input-icon" /><input className="form-input" type="text" placeholder="Gupta" required value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom:'12px' }}>
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap"><i className="fas fa-envelope input-icon" /><input className="form-input" type="email" placeholder="your@email.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:'10px',marginBottom:'12px' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <div className="input-wrap"><i className="fas fa-phone input-icon" /><input className="form-input" type="tel" placeholder="9876543210" required value={mobile} onChange={e => setMobile(e.target.value)} /></div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of birth</label>
                    <div className="input-wrap"><i className="fas fa-calendar input-icon" /><input className="form-input" type="date" required value={dob} onChange={e => setDob(e.target.value)} /></div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom:'20px' }}>
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <i className="fas fa-lock input-icon" />
                    <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom:'16px' }}>
                  {submitting ? 'Creating account...' : <><i className="fas fa-user-plus" /> Create Account</>}
                </button>
              </form>

              {/* OAuth divider */}
              <div style={{ display:'flex',alignItems:'center',gap:'10px',margin:'4px 0 14px' }}>
                <div style={{ flex:1,height:'1px',background:'var(--border)' }} />
                <span style={{ fontSize:'11px',color:'var(--muted)',whiteSpace:'nowrap' }}>or sign up with</span>
                <div style={{ flex:1,height:'1px',background:'var(--border)' }} />
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px' }}>
                <button
                  id="btn-google-signup"
                  className="btn btn-ghost oauth-btn"
                  onClick={handleGoogleLogin}
                  disabled={!!oauthLoading}
                  style={{ background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'13px',fontWeight:500,padding:'11px',borderRadius:'12px',cursor:oauthLoading?'not-allowed':'pointer',opacity:oauthLoading&&oauthLoading!=='google'?0.5:1,transition:'all .2s' }}
                >
                  {oauthBtnContent('google','fa-google','#ea4335','Google')}
                </button>

                <button
                  id="btn-microsoft-signup"
                  className="btn btn-ghost oauth-btn"
                  onClick={handleMicrosoftLogin}
                  disabled={!!oauthLoading}
                  style={{ background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'13px',fontWeight:500,padding:'11px',borderRadius:'12px',cursor:oauthLoading?'not-allowed':'pointer',opacity:oauthLoading&&oauthLoading!=='microsoft'?0.5:1,transition:'all .2s' }}
                >
                  {oauthBtnContent('microsoft','fa-windows','#00a4ef','Microsoft')}
                </button>
              </div>

              <button className="btn btn-ghost btn-full" onClick={handleGuest} disabled={!!oauthLoading} style={{ background:'rgba(82,183,136,0.1)',color:'var(--sage2)',fontSize:'13px',marginBottom:'20px' }}>
                Continue as Guest 🍀
              </button>

              <div style={{ textAlign:'center',fontSize:'12px',color:'var(--muted)' }}>
                Already have an account? <a href="#" onClick={e => { e.preventDefault(); setTab('login'); }} style={{ color:'var(--sage2)',textDecoration:'none',fontWeight:600 }}>Log In here</a>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD TAB ── */}
          {tab === 'forgot' && (
            <>
              <h2 style={{ fontSize:'22px',fontWeight:700,color:'#fff',marginBottom:'8px',textAlign:'center' }}>Reset Password</h2>
              <p style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'24px',textAlign:'center' }}>Enter your email and we'll send a recovery link</p>

              <form onSubmit={handleForgot}>
                <div className="form-group" style={{ marginBottom:'20px' }}>
                  <label className="form-label">Email address</label>
                  <div className="input-wrap">
                    <i className="fas fa-envelope input-icon" />
                    <input className="form-input" type="email" placeholder="your@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom:'16px' }}>
                  {submitting ? 'Processing...' : 'Send Recovery Link'}
                </button>
              </form>

              <div style={{ textAlign:'center',fontSize:'12px',color:'var(--muted)' }}>
                <a href="#" onClick={e => { e.preventDefault(); setTab('login'); }} style={{ color:'var(--sage2)',textDecoration:'none',fontWeight:600 }}>← Back to Log In</a>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Inline style for spinner animation */}
      <style>{`
        .oauth-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .oauth-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #52b788;
          border-radius: 50%;
          animation: oauth-spin 0.7s linear infinite;
        }
        @keyframes oauth-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default AuthPage;
