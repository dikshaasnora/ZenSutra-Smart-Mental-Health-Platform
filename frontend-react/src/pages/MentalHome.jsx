import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';

const OPTS = [['Never (0)','0'],['Sometimes (1)','1'],['Often (2)','2'],['Almost always (3)','3']];
const GAD_OPTS = [['Not at all (0)','0'],['Several days (1)','1'],['More than half (2)','2'],['Nearly every day (3)','3']];
const DASS_QS = ['I found it hard to wind down','I was aware of dryness of my mouth',"I couldn't seem to experience any positive feeling at all",'I experienced breathing difficulty','I found it difficult to work up the initiative to do things','I tended to over-react to situations','I experienced trembling','I felt that I was using a lot of nervous energy','I was worried about situations in which I might panic','I felt that I had nothing to look forward to'];
const GAD_QS = ['Feeling nervous, anxious or on edge','Not being able to stop or control worrying','Worrying too much about different things','Trouble relaxing','Being so restless that it is hard to sit still','Becoming easily annoyed or irritable','Feeling afraid as if something awful might happen'];
const PHQ_QS = ['Little interest or pleasure in doing things','Feeling down, depressed, or hopeless','Trouble falling or staying asleep, or sleeping too much','Feeling tired or having little energy','Poor appetite or overeating','Feeling bad about yourself — or that you are a failure','Trouble concentrating on things','Moving or speaking so slowly that other people could have noticed','Thoughts that you would be better off dead or hurting yourself'];

const MentalHome = () => {
  const { token, authFetch } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [vitals, setVitals] = useState({ sys:'',dia:'',hr:'',sleep:'' });
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML=''; for(let i=0;i<20;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`;pc.appendChild(p);} }
  }, [token]);

  const setAns = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));
  const getScore = (prefix, count) => Array.from({length:count},(_,i)=>parseInt(answers[`${prefix}${i}`]||'0')).reduce((a,b)=>a+b,0);
  const getSev = (score, t) => { for(const l of Object.keys(t)) if(score<=t[l]) return l; return Object.keys(t).at(-1); };

  const nextStep = (from) => {
    if (from===1) {
      const sysVal = +vitals.sys;
      const diaVal = +vitals.dia;
      const hrVal = +vitals.hr;
      const sleepVal = +vitals.sleep;

      if(!vitals.sys || isNaN(sysVal) || sysVal < 70 || sysVal > 250) {
        showError('Systolic BP must be between 70 and 250 mmHg.');
        return;
      }
      if(!vitals.dia || isNaN(diaVal) || diaVal < 40 || diaVal > 150) {
        showError('Diastolic BP must be between 40 and 150 mmHg.');
        return;
      }
      if(!vitals.hr || isNaN(hrVal) || hrVal < 40 || hrVal > 200) {
        showError('Heart Rate must be between 40 and 200 bpm.');
        return;
      }
      if(!vitals.sleep || isNaN(sleepVal) || sleepVal < 0 || sleepVal > 24) {
        showError('Sleep Hours must be between 0 and 24 hours.');
        return;
      }
    }
    setStep(from+1);
  };

  const submitAssessment = async () => {
    const dScore = getScore('d', DASS_QS.length);
    const gScore = getScore('g', GAD_QS.length);
    const pScore = getScore('p', PHQ_QS.length);
    const body = {
      vitals:{ systolic:+vitals.sys, diastolic:+vitals.dia, heartRate:+vitals.hr, sleepDuration:+vitals.sleep },
      dass21:{ depression:{score:Math.round(dScore*0.6),severity:getSev(dScore,{normal:4,mild:6,moderate:10,severe:999})}, anxiety:{score:Math.round(dScore*0.5),severity:getSev(dScore,{normal:3,mild:5,moderate:7,severe:999})}, stress:{score:Math.round(dScore*0.8),severity:getSev(dScore,{normal:7,mild:9,moderate:12,severe:999})} },
      gad7:{ score:gScore, severity:getSev(gScore,{normal:4,mild:9,moderate:14,severe:999}) },
      phq9:{ score:pScore, severity:getSev(pScore,{normal:4,minimal:9,mild:14,moderate:19,severe:999}) },
    };
    try {
      const data = await authFetch('/api/mental-health/analyze',{method:'POST',body});
      if(data?.success){showSuccess('Report generated! Redirecting...'); setTimeout(()=>navigate('/mental-report'),1200);}
      else showError(data?.message||'Analysis failed.');
    } catch { showError('Connection error.'); }
  };

  const dotCls = (n) => n < step ? 'done' : n === step ? 'active' : 'todo';
  const dotStyle = (n) => ({ width:'32px',height:'32px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,background:n<step?'var(--sage2)':n===step?'var(--lavender)':'rgba(255,255,255,.08)',color:n<=step?'#fff':'var(--muted)',border:n<step||n===step?'none':'1px solid var(--border)',boxShadow:n===step?'0 0 12px rgba(155,114,207,.4)':'' });
  const lineStyle = (n) => ({ flex:1,height:'2px',background:n<step?'var(--sage2)':'var(--border)',borderRadius:'2px' });
  const inputStyle = { background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 14px',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',outline:'none',width:'100%',transition:'.2s' };

  const renderQs = (qs, prefix, opts) => qs.map((q,i)=>(
    <div key={i} style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'14px',padding:'18px',marginBottom:'10px' }}>
      <div style={{ fontSize:'14px',color:'rgba(255,255,255,.85)',marginBottom:'12px',lineHeight:'1.5' }}><b>{i+1}.</b> {q}</div>
      <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
        {opts.map(o=>(
          <button key={o[1]} onClick={()=>setAns(`${prefix}${i}`,o[1])}
            style={{ padding:'8px 16px',borderRadius:'8px',fontSize:'13px',border:'1px solid',fontFamily:"'DM Sans',sans-serif",cursor:'pointer',transition:'all .2s',background:answers[`${prefix}${i}`]===o[1]?'rgba(82,183,136,.15)':'var(--glass)',borderColor:answers[`${prefix}${i}`]===o[1]?'rgba(82,183,136,.4)':'var(--border)',color:answers[`${prefix}${i}`]===o[1]?'var(--sage2)':'rgba(255,255,255,.6)' }}>
            {o[0]}
          </button>
        ))}
      </div>
    </div>
  ));

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header"><div><div className="page-eyebrow">Clinical assessment</div><h1 className="page-title">Mental Health <em>Check</em></h1><div className="page-sub">DASS-21 · GAD-7 · PHQ-9 — takes about 8 minutes</div></div></div>

          {/* Step indicator */}
          <div style={{ display:'flex',gap:'8px',alignItems:'center',marginBottom:'28px' }}>
            <div style={dotStyle(1)}>1</div><div style={lineStyle(1)}></div>
            <div style={dotStyle(2)}>2</div><div style={lineStyle(2)}></div>
            <div style={dotStyle(3)}>3</div><div style={lineStyle(3)}></div>
            <div style={dotStyle(4)}>4</div>
          </div>

          {step===1&&<div className="card">
            <div className="card-head">Step 1 — Basic Vitals</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
              <div><label style={{ fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',marginBottom:'6px',display:'block' }}>Systolic BP (mmHg)</label><input style={inputStyle} type="number" placeholder="120" value={vitals.sys} onChange={e=>setVitals(p=>({...p,sys:e.target.value}))} /></div>
              <div><label style={{ fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',marginBottom:'6px',display:'block' }}>Diastolic BP (mmHg)</label><input style={inputStyle} type="number" placeholder="80" value={vitals.dia} onChange={e=>setVitals(p=>({...p,dia:e.target.value}))} /></div>
              <div><label style={{ fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',marginBottom:'6px',display:'block' }}>Heart rate (bpm)</label><input style={inputStyle} type="number" placeholder="72" value={vitals.hr} onChange={e=>setVitals(p=>({...p,hr:e.target.value}))} /></div>
              <div><label style={{ fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',marginBottom:'6px',display:'block' }}>Sleep last night (hrs)</label><input style={inputStyle} type="number" placeholder="7" step="0.5" value={vitals.sleep} onChange={e=>setVitals(p=>({...p,sleep:e.target.value}))} /></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop:'20px' }} onClick={()=>nextStep(1)}>Next — DASS-21 →</button>
          </div>}

          {step===2&&<div className="card">
            <div className="card-head">Step 2 — DASS-21 Questionnaire</div>
            <div style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'16px' }}>Rate each for the <b>past week</b>: 0 = Never, 1 = Sometimes, 2 = Often, 3 = Almost always</div>
            {renderQs(DASS_QS,'d',OPTS)}
            <div style={{ display:'flex',gap:'10px',marginTop:'20px' }}>
              <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={()=>nextStep(2)}>Next — GAD-7 →</button>
            </div>
          </div>}

          {step===3&&<div className="card">
            <div className="card-head">Step 3 — GAD-7 (Anxiety Scale)</div>
            <div style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'16px' }}>Over the last 2 weeks, how often have you been bothered by the following?</div>
            {renderQs(GAD_QS,'g',GAD_OPTS)}
            <div style={{ display:'flex',gap:'10px',marginTop:'20px' }}>
              <button className="btn btn-ghost" onClick={()=>setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={()=>nextStep(3)}>Next — PHQ-9 →</button>
            </div>
          </div>}

          {step===4&&<div className="card">
            <div className="card-head">Step 4 — PHQ-9 (Depression Screen)</div>
            <div style={{ fontSize:'13px',color:'var(--muted)',marginBottom:'16px' }}>Over the last 2 weeks, how often have you been bothered by any of the following?</div>
            {renderQs(PHQ_QS,'p',GAD_OPTS)}
            <div style={{ display:'flex',gap:'10px',marginTop:'20px' }}>
              <button className="btn btn-ghost" onClick={()=>setStep(3)}>← Back</button>
              <button className="btn btn-primary" onClick={submitAssessment}><i className="fas fa-chart-line"></i> Generate My Report</button>
            </div>
          </div>}
        </div></main>
      </div>
    </>
  );
};
export default MentalHome;
