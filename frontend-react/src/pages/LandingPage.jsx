import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { token, user, openAuthModal } = useAuth();
  const { showInfo } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Generate particles
    const c = document.getElementById('particles');
    if (c) {
      c.innerHTML = '';
      for (let i = 0; i < 45; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*25+15}s;animation-delay:${-(Math.random()*25)}s;opacity:${Math.random()*0.35+0.1}`;
        c.appendChild(p);
      }
    }
  }, []);

  const checkLoginAndGo = (url) => {
    if (token) {
      navigate(url);
    } else {
      showInfo('Please log in or continue as guest to access features.');
      openAuthModal('login');
    }
  };

  return (
    <>
      {/* Backgrounds */}
      <div className="bg-orbs">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>
      <div className="particles" id="particles"></div>

      {/* ════════════════════════ HEADER ════════════════════════ */}
      <header>
        <div className="nav-inner">
          <a href="/" className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-name">Zensutra</span>
          </a>
          <nav>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#resources">Resources</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
          <div className="nav-cta" id="nav-cta">
            {token ? (
              <>
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <div style={{ display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.09)',borderRadius:'10px',padding:'6px 14px',cursor:'pointer' }} onClick={() => navigate('/profile')}>
                  <div style={{ width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#52b788,#9b72cf)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#fff' }}>
                    {user ? ((user.firstName||'').charAt(0)+(user.lastName||'').charAt(0)).toUpperCase()||'U' : 'U'}
                  </div>
                  <span style={{ fontSize:'13px',fontWeight:500,color:'#fff' }}>
                    {user ? (user.email?.includes('@guest') ? 'Guest' : user.firstName) : 'User'}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Cleaned: Removed "Continue as Guest" and "Log In" from the navbar */}
                <button className="btn btn-primary" onClick={() => openAuthModal('login')}>Get Started Free</button>
              </>
            )}
          </div>
          <div className="hamburger" id="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </div>
        </div>
        {mobileMenuOpen && (
          <div id="mobile-nav" style={{ position: 'fixed', top: '68px', left: 0, right: 0, background: 'rgba(10,14,20,.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.08)', zIndex: 99, padding: '20px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              <a href="#features" style={{ padding: '12px', borderRadius: '8px', color: 'rgba(255,255,255,.7)', fontSize: '15px' }} onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" style={{ padding: '12px', borderRadius: '8px', color: 'rgba(255,255,255,.7)', fontSize: '15px' }} onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="/about" style={{ padding: '12px', borderRadius: '8px', color: 'rgba(255,255,255,.7)', fontSize: '15px' }}>About</a>
            </nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {token ? (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</button>
              ) : (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}>Get Started Free</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span>🌱</span> Smart Mental Health Platform for Students
              </div>
              <h1>Your Mind<br />Deserves <em>Care</em><br />Too.</h1>
              <p>AI-powered wellness support, daily mood tracking, guided breathing, and confidential counseling — all in one safe space.</p>
              <div className="hero-buttons">
                {/* Cleaned: Only main trigger, guest choice pops up in modal */}
                <button className="btn btn-primary" style={{ padding: '13px 32px', fontSize: '16px' }} onClick={() => openAuthModal('login')}>
                  <i className="fas fa-sparkles"></i> Start Your Journey Free
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="brain-sphere">
                <div className="sphere-glow"></div>
                <div className="sphere-rings"></div>
                <div className="orbit-node">🧠</div>
                <div className="orbit-node">💆</div>
                <div className="orbit-node">📊</div>
                <div className="orbit-node">🤖</div>
                <span className="sphere-icon">🌿</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES ═══════════════════════ */}
        <section id="features" style={{ padding: '100px 5%' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div className="section-tag"><i className="fas fa-sparkles"></i> Core Features</div>
            <h2 className="section-title">Everything you need<br />for your wellness journey</h2>
            <p className="section-sub">Built specifically for students in India — culturally aware, bilingual, always available.</p>

            <div className="features-grid">
              <div className="feat-card" style={{ '--c': '#52b788' }} onClick={() => checkLoginAndGo('/ai-support')}>
                <div className="feat-icon" style={{ '--c': 'rgba(82,183,136,.2)' }}>🤖</div>
                <div className="feat-title">Zen AI — Your Wellness Companion</div>
                <div className="feat-desc">Powered by Google Gemini. Crisis detection, empathetic listening, coping strategies — available any time, no judgment.</div>
                <div className="feat-link">Try Zen AI →</div>
              </div>
              <div className="feat-card" style={{ '--c': '#9b72cf' }} onClick={() => checkLoginAndGo('/mood')}>
                <div className="feat-icon" style={{ '--c': 'rgba(155,114,207,.2)' }}>📊</div>
                <div className="feat-title">Mood Tracking & Insights</div>
                <div className="feat-desc">Log emotions daily, see weekly patterns via chart, and get AI-generated insights about your mental health trends.</div>
                <div className="feat-link">Track My Mood →</div>
              </div>
              <div className="feat-card" style={{ '--c': '#f4a261' }} onClick={() => checkLoginAndGo('/mental-home')}>
                <div className="feat-icon" style={{ '--c': 'rgba(244,162,97,.2)' }}>🔬</div>
                <div className="feat-title">Clinical Assessments</div>
                <div className="feat-desc">DASS-21, GAD-7, PHQ-9 — clinically validated questionnaires give you a real picture of your mental health.</div>
                <div className="feat-link">Take Assessment →</div>
              </div>
              <div className="feat-card" style={{ '--c': '#aed9e0' }} onClick={() => checkLoginAndGo('/appointment')}>
                <div className="feat-icon" style={{ '--c': 'rgba(174,217,224,.15)' }}>🩺</div>
                <div className="feat-title">Confidential Counseling</div>
                <div className="feat-desc">Book private sessions with certified counselors — video call, phone, or in-person. All conversations are encrypted.</div>
                <div className="feat-link">Book a Session →</div>
              </div>
              <div className="feat-card" style={{ '--c': '#e07080' }} onClick={() => checkLoginAndGo('/breathe')}>
                <div className="feat-icon" style={{ '--c': 'rgba(224,112,128,.15)' }}>🌬️</div>
                <div className="feat-title">Guided Breathing & Meditation</div>
                <div className="feat-desc">Box breathing, 4-7-8, physiological sigh — interactive breathing exercises with live timers and guided prompts.</div>
                <div className="feat-link">Start Breathing →</div>
              </div>
              <div className="feat-card" style={{ '--c': '#52b788' }} onClick={() => checkLoginAndGo('/resources')}>
                <div className="feat-icon" style={{ '--c': 'rgba(82,183,136,.2)' }}>📚</div>
                <div className="feat-title">Resource Library</div>
                <div className="feat-desc">Videos, guided audio meditations, CBT workbooks, inspirational quotes — curated by mental health professionals.</div>
                <div className="feat-link">Explore Resources →</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section id="how-it-works" style={{ padding: '80px 5% 100px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div className="section-tag"><i className="fas fa-route"></i> Your Journey</div>
            <h2 className="section-title">Getting started takes<br />less than 2 minutes</h2>
            <p className="section-sub" style={{ marginBottom: '40px' }}>No credit card. No jargon. Just support.</p>
            <div className="steps-grid">
              <div className="step-card"><div className="step-num">1</div><div className="step-title">Create Free Account</div><div className="step-desc">Sign up with email, verify with OTP. Your data stays private and encrypted.</div></div>
              <div className="step-card"><div className="step-num">2</div><div className="step-title">Complete Your Profile</div><div className="step-desc">Tell us about your academic life and wellness habits — we personalize the experience.</div></div>
              <div className="step-card"><div className="step-num">3</div><div className="step-title">Log Your First Mood</div><div className="step-desc">Take 30 seconds to check in. Over time, patterns emerge that reveal insights.</div></div>
              <div className="step-card"><div className="step-num">4</div><div className="step-title">Talk to Zen AI</div><div className="step-desc">Whenever you need to talk, Zen is there — day or night, no waiting room.</div></div>
              <div className="step-card"><div className="step-num">5</div><div className="step-title">Book Real Support</div><div className="step-desc">When you're ready, connect with a certified counselor for deeper support.</div></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section id="resources" style={{ padding: '0 5% 100px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div className="section-tag"><i className="fas fa-quote-left"></i> Student Stories</div>
            <h2 className="section-title">What students are saying</h2>
            <div className="testimonials-grid" style={{ marginTop: '40px' }}>
              <div className="testi-card">
                <div className="testi-stars">★★★★★</div>
                <div className="testi-text">"Zen AI helped me through my exam anxiety at 2am when no one else was awake. It felt like talking to someone who genuinely cared."</div>
                <div className="testi-author"><div className="testi-av">PR</div><div><div className="testi-name">Priya Ramesh</div><div className="testi-meta">B.Tech, IIT Madras</div></div></div>
              </div>
              <div className="testi-card">
                <div className="testi-stars">★★★★★</div>
                <div className="testi-text">"The mood tracker showed me I was consistently low on Sundays. That pattern helped me make real changes to my weekly routine."</div>
                <div className="testi-author"><div className="testi-av" style={{ background: 'linear-gradient(135deg,var(--lavender),#7c4dcc)' }}>AK</div><div><div className="testi-name">Arjun Kapoor</div><div className="testi-meta">MBA, XLRI Jamshedpur</div></div></div>
              </div>
              <div className="testi-card">
                <div className="testi-stars">★★★★★</div>
                <div className="testi-text">"I was skeptical about online mental health apps. Zensutra changed my mind — the counselor was empathetic and the booking was seamless."</div>
                <div className="testi-author"><div className="testi-av" style={{ background: 'linear-gradient(135deg,var(--gold),#e07080)' }}>SM</div><div><div className="testi-name">Sneha Mehta</div><div className="testi-meta">MBBS, AIIMS Delhi</div></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="cta-section">
          <h2>Your wellness journey<br />starts today 🌱</h2>
          <p>Join thousands of students who have taken the first step toward better mental health.</p>
          <div className="cta-buttons">
            <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => openAuthModal('login')}>Create Free Account</button>
            <button className="btn btn-outline" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => navigate('/dashboard')}>Explore Dashboard</button>
          </div>
        </div>

        {/* ═══════════════════════ FOOTER ═══════════════════════ */}
        <footer>
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-brand">
                <div className="logo" style={{ marginBottom: '14px' }}><div className="logo-icon">🧠</div><span className="logo-name">Zensutra</span></div>
                <p>Supporting student mental health across India — one conversation at a time.</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <a href="#" style={{ width: '32px', height: '32px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted)' }}><i className="fab fa-twitter"></i></a>
                  <a href="#" style={{ width: '32px', height: '32px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted)' }}><i className="fab fa-instagram"></i></a>
                  <a href="#" style={{ width: '32px', height: '32px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted)' }}><i className="fab fa-linkedin"></i></a>
                </div>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <ul>
                  <li><a href="/dashboard">Dashboard</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); checkLoginAndGo('/mood'); }}>Mood Tracker</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); checkLoginAndGo('/ai-support'); }}>Zen AI Chat</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); checkLoginAndGo('/resources'); }}>Resources</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <ul>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); checkLoginAndGo('/appointment'); }}>Book Session</a></li>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/faq">FAQ</a></li>
                  <li><a href="/policy">Privacy</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Crisis Lines</h4>
                <ul>
                  <li><a href="tel:9152987821">iCall: 9152987821</a></li>
                  <li><a href="tel:02227546669">AASRA: 022-27546669</a></li>
                  <li><a href="tel:112">Emergency: 112</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2026 Zensutra. All rights reserved. Built with 💚 for Indian students.</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <a href="/policy" style={{ fontSize: '13px', color: 'var(--muted)' }}>Privacy</a>
                <a href="/terms" style={{ fontSize: '13px', color: 'var(--muted)' }}>Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default LandingPage;
