import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Policy = () => {
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
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '42px', marginBottom: '24px', color: '#fff' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>Last Updated: April 2026</p>
        
        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>1. Introduction</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>At Zensutra, your mental health and privacy are our top priorities. This Privacy Policy explains how we collect, use, and protect your personal and sensitive health data.</p>
        
        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>2. Data We Collect</h2>
        <ul style={{ marginLeft: '24px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>
          <li style={{ marginBottom: '8px' }}><strong>Account Information:</strong> Name, email, mobile number, and date of birth.</li>
          <li style={{ marginBottom: '8px' }}><strong>Health Data:</strong> Daily mood logs, assessment scores (DASS-21, GAD-7), and biometric vitals you choose to provide.</li>
          <li style={{ marginBottom: '8px' }}><strong>AI Conversations:</strong> Transcripts of your chats with Zen AI.</li>
        </ul>

        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>3. How We Protect Your Data</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>All sensitive health data and AI chat transcripts are encrypted at rest using AES-256 encryption. We utilize a strict 90-day retention policy for all AI chat logs, meaning they are automatically permanently deleted from our servers after 3 months.</p>

        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>4. Guest Accounts</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>If you use Zensutra in "Guest Mode", an anonymous temporary profile is created. No identifiable email or phone number is collected. Guest data is completely isolated and cannot be tied back to your real identity.</p>

        <h2 style={{ fontSize: '22px', color: '#fff', margin: '40px 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>5. Contact Us</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.7 }}>If you have questions about your privacy, please contact our Data Protection Officer at privacy@zensutra.com.</p>
      </main>
    </>
  );
};
export default Policy;
