import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

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

      <main style={{ position: 'relative', zIndex: 1, padding: '120px 5% 0', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sage2)', fontWeight: 600, marginBottom: '12px' }}>Our Story</div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>Mental health support<br /><em style={{ fontStyle: 'italic', color: 'var(--sage2)' }}>actually</em> cares</h1>
        <p style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '60px' }}>Zensutra was founded in 2026 by a group of students and mental health professionals who saw a simple truth: millions of Indian students were struggling silently, with nowhere safe to turn.</p>

        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '28px', color: '#fff', marginBottom: '14px' }}>Our Mission</h2>
          <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '16px' }}>We bridge the gap between students facing mental health challenges and the professional support they need. Our platform combines AI-powered empathy, clinical-grade assessments, and real human counselors — all in one confidential space.</p>
          <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '16px' }}>We believe that mental wellness is not a luxury. It is a foundation — for learning, for growing, for living fully. Every feature in Zensutra exists to make that foundation accessible to every student, regardless of where they study or how they feel today.</p>
        </section>

        <section style={{ marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sage2)', fontWeight: 600, marginBottom: '12px' }}>What We Stand For</div>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '28px', color: '#fff', marginBottom: '14px' }}>Our values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '32px' }}>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Confidentiality First</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>Every conversation, report, and mood log is encrypted. We never share your data with institutions or third parties.</div>
            </div>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌍</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Culturally Rooted</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>Built for India — bilingual (Hindi + English), aware of academic pressures unique to the Indian education system.</div>
            </div>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤝</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Human + AI Together</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>AI is here to support, not replace. Our Zen AI handles 24/7 availability; real counselors provide depth when needed.</div>
            </div>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>💚</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Zero Judgment</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>Our platform is a stigma-free zone. Seeking help is a sign of strength — we celebrate every step you take.</div>
            </div>
          </div>
        </section>
      </main>
      
      <footer style={{ position: 'relative', zIndex: 1, marginTop: '80px', borderTop: '1px solid var(--border)', background: 'rgba(10,14,20,.7)', backdropFilter: 'blur(20px)', padding: '40px 5% 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
          <p>&copy; 2026 Zensutra. All rights reserved. Built with 💚 for Indian students.</p>
        </div>
      </footer>
    </>
  );
};
export default About;
