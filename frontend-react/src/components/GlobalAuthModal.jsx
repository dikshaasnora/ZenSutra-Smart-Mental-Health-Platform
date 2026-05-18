import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../config';

const GlobalAuthModal = () => {
  const { showAuthModal, authModalTab, openAuthModal, closeAuthModal, login } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  // Form Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset inputs when modal tab shifts
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setMobile('');
    setDob('');
  }, [authModalTab]);



  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess(`Welcome back, ${data.user.firstName}! 🌱`);
        closeAuthModal();
        navigate('/dashboard');
      } else {
        showError(data.message || 'Login failed.');
      }
    } catch {
      showError('Connection issue. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !mobile || !dob || !password) {
      showError('Please fill in all details.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, mobile, dob, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess(`Welcome to ZenSutra, ${data.user.firstName}! 🎉`);
        closeAuthModal();
        navigate('/dashboard');
      } else {
        showError(data.message || 'Signup failed.');
      }
    } catch {
      showError('Connection issue. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) {
      showError('Please enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Reset instructions sent to your email.');
        openAuthModal('login');
      } else {
        showError(data.message || 'Could not process reset.');
      }
    } catch {
      showError('Connection issue. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialOAuth = (providerName) => {
    if (!showAuthModal) return;
    const provider = providerName.toLowerCase();
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const handleGuest = async () => {
    showInfo('Creating secure Guest session... 🍀');
    try {
      const res = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        showSuccess('Entering dashboard as Guest 🍃');
        closeAuthModal();
        navigate('/dashboard');
      } else {
        showError('Could not launch guest session.');
      }
    } catch {
      login('guest', { firstName: 'Guest', lastName: '' });
      showSuccess('Entering dashboard as Guest (Offline) 🍃');
      closeAuthModal();
      navigate('/dashboard');
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className="modal-overlay active" style={{ zIndex: 99999 }} onClick={(e) => e.target.className.includes('modal-overlay') && closeAuthModal()}>
      <div className="modal" style={{ width: '420px', maxWidth: '95%', background: 'rgba(10,15,24,0.92)', border: '1px solid rgba(82,183,136,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <button className="modal-close" onClick={closeAuthModal} style={{ color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.4)'}>
          <i className="fas fa-times"></i>
        </button>

        <div className="modal-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div className="modal-logo-icon" style={{ fontSize: '28px' }}>🧠</div>
          <span className="modal-logo-name" style={{ fontSize: '24px', fontWeight: 800, color: '#fff', fontFamily: "'DM Serif Display', serif" }}>Zensutra</span>
        </div>

        {authModalTab === 'login' && (
          <>
            <div className="modal-title" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '6px' }}>Let's check in 🌿</div>
            <div className="modal-sub" style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginBottom: '24px' }}>Please log in to proceed. Your privacy is our priority.</div>

            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Email address</label>
                <div className="input-wrap">
                  <i className="fas fa-envelope input-icon"></i>
                  <input className="form-input" type="email" placeholder="student@university.edu" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Password</label>
                <div className="input-wrap">
                  <i className="fas fa-lock input-icon"></i>
                  <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {submitting ? 'Connecting...' : <><i className="fas fa-sign-in-alt"></i> Access Account</>}
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => handleSocialOAuth('Google')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#e8eaf0' }}>
                <i className="fab fa-google" style={{ color: '#ea4335' }}></i> Google
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => handleSocialOAuth('Microsoft')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#e8eaf0' }}>
                <i className="fab fa-windows" style={{ color: '#00a4ef' }}></i> Microsoft
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => handleSocialOAuth('Discord')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#e8eaf0' }}>
                <i className="fab fa-discord" style={{ color: '#5865F2' }}></i> Discord
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => handleSocialOAuth('Apple')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#e8eaf0' }}>
                <i className="fab fa-apple" style={{ color: '#ffffff' }}></i> Apple
              </button>
            </div>

            <button className="btn btn-ghost btn-full" onClick={handleGuest} style={{ background: 'rgba(82,183,136,0.1)', color: 'var(--sage2)', fontSize: '13px', marginBottom: '16px' }}>
              🍀 Continue as Guest
            </button>

            <div className="modal-footer" style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuthModal('forgot'); }} style={{ color: 'var(--sage2)', textDecoration: 'none' }}>Forgot Password?</a>
              <span style={{ margin: '0 8px' }}>·</span>
              New user? <a href="#" onClick={(e) => { e.preventDefault(); openAuthModal('register'); }} style={{ color: 'var(--sage2)', textDecoration: 'none', fontWeight: 600 }}>Create Account</a>
            </div>
          </>
        )}

        {authModalTab === 'register' && (
          <>
            <div className="modal-title" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '6px' }}>Begin your journey 🍃</div>
            <div className="modal-sub" style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginBottom: '20px' }}>Join the smart mental health platform free.</div>

            <form onSubmit={handleSignup} style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>First Name</label>
                  <div className="input-wrap"><i className="fas fa-user input-icon"></i><input className="form-input" type="text" placeholder="Anya" required value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Last Name</label>
                  <div className="input-wrap"><i className="fas fa-user input-icon"></i><input className="form-input" type="text" placeholder="Sen" required value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Email Address</label>
                <div className="input-wrap"><i className="fas fa-envelope input-icon"></i><input className="form-input" type="email" placeholder="anya@domain.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Phone</label>
                  <div className="input-wrap"><i className="fas fa-phone input-icon"></i><input className="form-input" type="tel" placeholder="9876543210" required value={mobile} onChange={e => setMobile(e.target.value)} /></div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Date of birth</label>
                  <div className="input-wrap"><i className="fas fa-calendar input-icon"></i><input className="form-input" type="date" required value={dob} onChange={e => setDob(e.target.value)} /></div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Password</label>
                <div className="input-wrap">
                  <i className="fas fa-lock input-icon"></i>
                  <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom: '14px' }}>
                {submitting ? 'Creating account...' : <><i className="fas fa-user-plus"></i> Register & Start</>}
              </button>
            </form>

            <button className="btn btn-ghost btn-full" onClick={handleGuest} style={{ background: 'rgba(82,183,136,0.1)', color: 'var(--sage2)', fontSize: '13px', marginBottom: '16px' }}>
              🍀 Continue as Guest
            </button>

            <div className="modal-footer" style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              Already registered? <a href="#" onClick={(e) => { e.preventDefault(); openAuthModal('login'); }} style={{ color: 'var(--sage2)', textDecoration: 'none', fontWeight: 600 }}>Sign In here</a>
            </div>
          </>
        )}

        {authModalTab === 'forgot' && (
          <>
            <div className="modal-title" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '6px' }}>Recover password Key 🔐</div>
            <div className="modal-sub" style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginBottom: '24px' }}>We will send you instructions to securely reset your credentials.</div>

            <form onSubmit={handleForgot}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Your Email address</label>
                <div className="input-wrap">
                  <i className="fas fa-envelope input-icon"></i>
                  <input className="form-input" type="email" placeholder="registered-email@domain.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginBottom: '16px' }}>
                {submitting ? 'Sending...' : 'Send Recovery Email'}
              </button>
            </form>

            <div className="modal-footer" style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuthModal('login'); }} style={{ color: 'var(--sage2)', textDecoration: 'none', fontWeight: 600 }}>← Back to login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalAuthModal;
