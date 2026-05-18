import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import './Breathe.css';

const TECHS = {
  box:   { name: 'Box Breathing (4-4-4-4)', phases: [{ l: 'Inhale', p: 'Breathe in slowly...', s: 4 }, { l: 'Hold', p: 'Hold gently...', s: 4 }, { l: 'Exhale', p: 'Release slowly...', s: 4 }, { l: 'Hold', p: 'Rest empty...', s: 4 }], why: 'Box breathing activates the parasympathetic nervous system by extending the exhale. This signals safety to the amygdala, lowering cortisol and heart rate within minutes.' },
  '478': { name: '4-7-8 Breathing',         phases: [{ l: 'Inhale', p: 'Breathe in through nose...', s: 4 }, { l: 'Hold', p: 'Hold still...', s: 7 }, { l: 'Exhale', p: 'Exhale fully through mouth...', s: 8 }], why: 'The 4-7-8 technique fills the lungs completely and uses an extended exhale to trigger the relaxation response — particularly effective before sleep.' },
  phys:  { name: 'Physiological Sigh (5-2-7)', phases: [{ l: 'Inhale', p: 'Deep breath in through nose...', s: 5 }, { l: 'Sip', p: 'Quick second sip of air...', s: 2 }, { l: 'Exhale', p: 'Long, slow exhale through mouth...', s: 7 }], why: 'A double inhale followed by a long exhale is the fastest way to offload carbon dioxide from the blood, instantly calming the nervous system.' },
  equal: { name: 'Equal Breathing (5-5)',    phases: [{ l: 'Inhale', p: 'Breathe in...', s: 5 }, { l: 'Exhale', p: 'Breathe out...', s: 5 }], why: 'Equal breathing creates a balanced heart rate variability rhythm, reducing stress hormones and improving focus. Perfect for everyday use.' },
};

const Breathe = () => {
  const { token, openAuthModal } = useAuth();

  const [currentTech, setCurrentTech] = useState('box');
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(TECHS['box'].phases[0].s);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0m');

  const timerRef = useRef(null);

  useEffect(() => {
    if (!token) {
      openAuthModal('login');
      return;
    }

    // Particles
    const pc = document.getElementById('particles');
    if (pc) {
      pc.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random() * 100}%;width:${Math.random() * 3 + 1}px;height:${Math.random() * 3 + 1}px;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${-(Math.random() * 20)}s;opacity:${Math.random() * .3 + .1}`;
        pc.appendChild(p);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token]);

  useEffect(() => {
    if (running) {
      if (countdown > 0) {
        timerRef.current = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Move to next phase
        const phases = TECHS[currentTech].phases;
        const nextIdx = (phaseIdx + 1) % phases.length;
        
        if (nextIdx === 0) {
          setCycles(c => c + 1);
          if (startTime) {
            const elapsed = Math.round((Date.now() - startTime) / 60000);
            setElapsedTime(elapsed + 'm');
          }
        }
        
        setPhaseIdx(nextIdx);
        setCountdown(phases[nextIdx].s);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, countdown, phaseIdx, currentTech, startTime]);

  const selectTech = (key) => {
    if (running) resetBreath();
    setCurrentTech(key);
    setPhaseIdx(0);
    setCountdown(TECHS[key].phases[0].s);
  };

  const toggleBreath = () => {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
      if (!startTime) setStartTime(Date.now());
    }
  };

  const resetBreath = () => {
    setRunning(false);
    setPhaseIdx(0);
    setCountdown(TECHS[currentTech].phases[0].s);
    setCycles(0);
    setStartTime(null);
    setElapsedTime('0m');
  };

  const phases = TECHS[currentTech].phases;
  const currentPhase = phases[phaseIdx];
  
  let ringClass = 'breath-ring';
  if (running) {
    ringClass += ' ' + (currentPhase.l === 'Inhale' || currentPhase.l === 'Sip' ? 'inhale' : currentPhase.l === 'Exhale' ? 'exhale' : 'hold');
  }



  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>

      <div className="app-layout">
        <Sidebar />

        <main className="main-area">
          <div className="main-inner">
            <div className="page-header">
              <div>
                <div className="page-eyebrow">Calm your nervous system</div>
                <h1 className="page-title">Guided <em>Breathing</em></h1>
                <div className="page-sub">Science-backed exercises to reduce anxiety and restore calm</div>
              </div>
            </div>
            <div className="two-col">
              {/* Breathing exercise */}
              <div className="card">
                <div className="card-head" id="tech-label">{TECHS[currentTech].name}</div>
                <div className="breathe-center">
                  <div className={ringClass} id="breath-ring">
                    <div className="breath-inner">
                      <span className="breath-label" id="breath-label">{running ? currentPhase.l : 'Ready'}</span>
                      <span className="breath-count" id="breath-count">{countdown}</span>
                    </div>
                  </div>
                  <div className="breath-phase" id="breath-phase">{running ? currentPhase.p : 'Press Start to begin'}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
                  <button className="btn btn-primary" onClick={toggleBreath} style={{ padding: '12px 32px', fontSize: '15px', background: running ? 'linear-gradient(135deg,#9b72cf,#7c4dcc)' : '' }}>
                    <i className={`fas fa-${running ? 'pause' : 'play'}`}></i> {running ? 'Pause' : 'Start'}
                  </button>
                  <button className="btn btn-ghost" onClick={resetBreath} style={{ padding: '12px 20px' }}><i className="fas fa-rotate"></i></button>
                </div>
                <div className="session-stats">
                  <div className="sess-stat"><div className="sess-num" id="sess-count">{cycles}</div><div className="sess-lbl">Cycles today</div></div>
                  <div className="sess-stat"><div className="sess-num" id="sess-time">{elapsedTime}</div><div className="sess-lbl">Time practiced</div></div>
                </div>
              </div>

              {/* Technique selector */}
              <div className="card">
                <div className="card-head">Choose technique</div>
                {Object.keys(TECHS).map((key) => (
                  <div key={key} className={`technique-card ${currentTech === key ? 'active-tech' : ''}`} onClick={() => selectTech(key)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span className="tech-icon">{key === 'box' ? '🌊' : key === '478' ? '🌙' : key === 'phys' ? '🌅' : '⚖️'}</span>
                      <div>
                        <div className="tech-name">{TECHS[key].name}</div>
                        <div className="tech-desc">{TECHS[key].phases.map(p => `${p.l} ${p.s}`).join(' · ')} — {TECHS[key].why.split('—')[1] || TECHS[key].why}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="card-head" style={{ marginTop: '20px' }}>Why it works</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.7' }} id="why-text">
                  {TECHS[currentTech].why}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Breathe;
