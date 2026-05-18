import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(null);

  useEffect(() => {
    const pc = document.getElementById('particles');
    if (pc) {
      pc.innerHTML = '';
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random() * 100}%;width:${Math.random() * 3 + 1}px;height:${Math.random() * 3 + 1}px;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${-(Math.random() * 20)}s;opacity:${Math.random() * .3 + .1}`;
        pc.appendChild(p);
      }
    }
  }, []);

  const faqs = [
    { q: 'Is my conversation with Zen AI completely private?', a: 'Yes. All chat histories are encrypted using AES-256 and stored securely. Zensutra automatically deletes all AI conversations older than 90 days. We never share or sell your data.' },
    { q: 'How does the Mood Tracker work?', a: 'You can manually select your mood or use our AI facial recognition feature to detect it automatically via your webcam. The app then generates a weekly insights chart so you can understand your emotional patterns over time.' },
    { q: 'Are the counselors licensed professionals?', a: 'Absolutely. All counselors available for booking on Zensutra are board-certified psychologists or licensed clinical social workers specializing in student mental health and academic stress.' },
    { q: 'What happens if I experience a crisis?', a: 'If Zen AI detects keywords related to self-harm or severe crisis, it will immediately halt normal conversation and provide emergency hotline numbers and immediate coping resources.' },
    { q: 'Can I use Zensutra without an account?', a: 'Yes! By clicking "Continue as Guest" on the homepage, you can access the platform instantly. Your data will be tied to a temporary, anonymous session.' }
  ];

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div></div>
      <div className="particles" id="particles"></div>
      
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,14,20,.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 5%' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#2d6a4f,#9b72cf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🧠</div>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '22px', color: '#fff' }}>Zensutra</span>
          </NavLink>
          <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ fontSize: '14px', padding: '8px 18px' }}><i className="fas fa-arrow-left"></i> Back to Home</button>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, padding: '140px 5% 100px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, marginBottom: '16px', textAlign: 'center' }}>Frequently Asked Questions</h1>
        <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '60px', textAlign: 'center' }}>Find answers to common questions about privacy, features, and support.</p>

        <div>
          {faqs.map((f, i) => (
            <div key={i} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden', transition: 'all 0.25s ease' }}>
              <div onClick={() => setActiveIdx(activeIdx === i ? null : i)} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '16px', color: '#fff' }}>
                {f.q}
                <i className={`fas fa-chevron-down`} style={{ color: 'var(--sage2)', transition: 'transform 0.3s ease', transform: activeIdx === i ? 'rotate(180deg)' : 'none' }}></i>
              </div>
              <div style={{ padding: activeIdx === i ? '0 24px 24px' : '0 24px', maxHeight: activeIdx === i ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease', color: 'var(--muted)', fontSize: '15px' }}>
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};
export default FAQ;
