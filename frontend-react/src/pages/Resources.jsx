import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const resources = [
  { color:'#52b788', tag:'Interactive Tool', tagBg:'rgba(82,183,136,.15)', tagColor:'var(--sage2)', title:'Guided Box Breathing', desc:'A highly effective physiological technique used by Navy SEALs to instantly reduce anxiety and lower heart rate.', meta:'5 mins', action:'Start Now →', link:'/breathe' },
  { color:'#9b72cf', tag:'📖 Workbook', tagBg:'rgba(155,114,207,.15)', tagColor:'var(--lavender)', title:'Cognitive Restructuring', desc:'Learn how to identify and challenge negative thought patterns with this CBT workbook.', meta:'PDF Download', action:'Download', link:'#' },
  { color:'#f4a261', tag:'🎧 Audio', tagBg:'rgba(244,162,97,.15)', tagColor:'var(--gold)', title:'Sleep Meditation: Deep Rest', desc:'A guided body scan meditation designed specifically to combat academic insomnia and promote deep, restorative sleep.', meta:'15 mins', action:'Listen', link:'#' },
  { color:'#e07080', tag:'🚨 Emergency', tagBg:'rgba(224,112,128,.15)', tagColor:'#e07080', title:'Immediate Crisis Support', desc:'A comprehensive list of verified 24/7 suicide prevention and crisis intervention helplines active across India.', meta:'24/7 Available', action:'View Helplines →', link:'#' },
  { color:'#aed9e0', tag:'🎥 Video', tagBg:'rgba(174,217,224,.15)', tagColor:'#aed9e0', title:'Understanding Burnout', desc:'Dr. Sarah explores the signs of academic burnout and provides actionable strategies to recover and prevent it.', meta:'12 mins', action:'Watch Video', link:'#' },
  { color:'#52b788', tag:'📊 Assessment', tagBg:'rgba(82,183,136,.15)', tagColor:'var(--sage2)', title:'Mental Health Checkup', desc:'Take the clinically validated DASS-21 + GAD-7 + PHQ-9 assessments to understand your mental health baseline.', meta:'8 mins', action:'Start Assessment', link:'/mental-home' },
];

const Resources = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML = ''; for (let i = 0; i < 25; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`; pc.appendChild(p); } }
  }, [token]);

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header">
            <div><div className="page-eyebrow">Curated wellness content</div><h1 className="page-title">Resource <em>Library</em></h1><div className="page-sub">Explore our curated collection of workbooks, meditations, and articles.</div></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'20px' }}>
            {resources.map((r,i) => (
              <div key={i} onClick={() => r.link !== '#' && navigate(r.link)}
                style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'20px',padding:'28px',transition:'all .25s',display:'flex',flexDirection:'column',cursor:'pointer' }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.background='var(--glass2)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.background='var(--glass)'; }}>
                <span style={{ display:'inline-block',padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',background:r.tagBg,color:r.tagColor,marginBottom:'16px' }}>{r.tag}</span>
                <h3 style={{ fontFamily:"'DM Serif Display',serif",fontSize:'22px',color:'#fff',marginBottom:'12px',lineHeight:'1.3' }}>{r.title}</h3>
                <p style={{ fontSize:'14px',color:'var(--muted)',marginBottom:'24px',flexGrow:1 }}>{r.desc}</p>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--muted)',borderTop:'1px solid var(--border)',paddingTop:'16px' }}>
                  <span>{r.meta}</span><span style={{ color:'var(--sage2)',fontWeight:500 }}>{r.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div></main>
      </div>
    </>
  );
};
export default Resources;
