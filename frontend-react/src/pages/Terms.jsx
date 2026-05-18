import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Terms = () => {
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

      <main style={{ position: 'relative', zIndex: 1, padding: '140px 5% 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '42px', marginBottom: '24px', color: '#fff' }}>Terms of Service</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>Last Updated: April 2026</p>
        
        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>1. Acceptance of Terms</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>By accessing and using the Zensutra platform, you accept and agree to be bound by the terms and provisions of this agreement.</p>
        
        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>2. Medical Disclaimer</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>Zensutra's Zen AI companion is designed to provide emotional support, coping strategies, and mood tracking. It is <strong style={{ color: '#fff' }}>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.</p>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>If you are experiencing a life-threatening emergency, please dial 112 or contact the iCall suicide prevention helpline at 9152987821 immediately.</p>

        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>3. User Responsibilities</h2>
        <ul style={{ marginLeft: '24px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>
          <li style={{ marginBottom: '8px' }}>You agree to provide accurate information when registering for counseling appointments.</li>
          <li style={{ marginBottom: '8px' }}>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li style={{ marginBottom: '8px' }}>You agree not to use the platform for any illegal or unauthorized purpose.</li>
        </ul>

        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>4. Platform Modifications</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>Zensutra reserves the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
      </main>
    </>
  );
};
export default Terms;
