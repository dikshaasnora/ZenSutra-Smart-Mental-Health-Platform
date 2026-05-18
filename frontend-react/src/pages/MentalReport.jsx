import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const riskColors = { low:'#52b788', moderate:'#f4a261', high:'#e07080', severe:'#ff6060' };
const sevColors  = { normal:'#52b788', mild:'#f4a261', moderate:'#e07080', severe:'#ff6060', minimal:'#74c69d' };

const MentalReport = () => {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML=''; for(let i=0;i<20;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`;pc.appendChild(p);} }
    loadReport();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [token]);

  useEffect(() => {
    if (report && chartRef.current && window.Chart) {
      if (chartInstance.current) chartInstance.current.destroy();
      const col = riskColors[report.overallRisk] || '#52b788';
      chartInstance.current = new window.Chart(chartRef.current, {
        type:'radar',
        data:{ labels:['Depression','Anxiety','Stress','GAD-7','PHQ-9'], datasets:[{ label:'Your scores', data:[Math.round(report.dass21.depression.score/42*100),Math.round(report.dass21.anxiety.score/42*100),Math.round(report.dass21.stress.score/42*100),Math.round(report.gad7.score/21*100),Math.round(report.phq9.score/27*100)], borderColor:col, backgroundColor:col+'22', pointBackgroundColor:col, pointBorderColor:'#0a0e14', pointBorderWidth:2 }] },
        options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0,max:100, grid:{color:'rgba(255,255,255,.06)'}, angleLines:{color:'rgba(255,255,255,.06)'}, ticks:{color:'rgba(255,255,255,.3)',font:{size:9}}, pointLabels:{color:'rgba(255,255,255,.5)',font:{size:10}} }}, plugins:{ legend:{display:false} } }
      });
    }
  }, [report]);

  const loadReport = async () => {
    try {
      const data = await authFetch('/api/mental-health/reports?limit=1');
      if (data?.success && data.data.length) setReport(data.data[0]);
    } catch {}
    setLoading(false);
  };

  const downloadReportJSON = () => {
    if (!report) return;
    const cleanReport = {
      overallRisk: report.overallRisk,
      dass21: report.dass21,
      gad7: report.gad7,
      phq9: report.phq9,
      vitals: report.vitals,
      lifestyle: report.lifestyle,
      recommendations: report.recommendations,
      createdAt: report.createdAt
    };
    const blob = new Blob([JSON.stringify(cleanReport, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zensutra-mental-health-report-${new Date(report.createdAt).toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderScore = (label, score, max, sev) => {
    const pct = Math.round(score/max*100);
    const col = sevColors[sev] || '#8892a4';
    return (
      <div key={label} style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px' }}>
          <span style={{ fontSize:'13px',color:'rgba(255,255,255,.7)' }}>{label}</span>
          <span style={{ fontSize:'11px',fontWeight:700,color:col }}>{sev} · {score}/{max}</span>
        </div>
        <div style={{ height:'8px',background:'rgba(255,255,255,.07)',borderRadius:'100px',overflow:'hidden' }}>
          <div style={{ width:`${pct}%`,height:'100%',borderRadius:'100px',background:col,transition:'width 1s ease' }}></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header">
            <div><div className="page-eyebrow">Your wellness journey</div><h1 className="page-title">Mental Health <em>Report</em></h1><div className="page-sub">{report ? `Generated ${new Date(report.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}` : 'Latest report'}</div></div>
            <div className="header-actions">
              {report && (
                <>
                  <button className="btn btn-ghost" onClick={downloadReportJSON} title="Download Report Data (JSON)">
                    <i className="fas fa-download"></i> Download Data
                  </button>
                  <button className="btn btn-primary" onClick={() => window.print()} title="Print or Save Report as PDF">
                    <i className="fas fa-file-pdf"></i> Print / Save PDF
                  </button>
                </>
              )}
              <button className="btn btn-ghost" onClick={()=>navigate('/mental-home')}><i className="fas fa-plus"></i> New Assessment</button>
            </div>
          </div>

          {loading && <div style={{ textAlign:'center',padding:'60px',color:'var(--muted)' }}>Loading report...</div>}
          {!loading && !report && (
            <div style={{ textAlign:'center',padding:'60px 20px',color:'var(--muted)' }}>
              <div style={{ fontSize:'48px',marginBottom:'16px' }}>📋</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:'24px',color:'#fff',marginBottom:'12px' }}>No report yet</h2>
              <p>Complete your first mental health assessment to get your personalised report.</p>
              <button className="btn btn-primary" style={{ marginTop:'20px' }} onClick={()=>navigate('/mental-home')}>Start Assessment →</button>
            </div>
          )}
          {!loading && report && (
            <>
              <div style={{ display:'flex',alignItems:'center',gap:'16px',marginBottom:'20px',flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'14px',fontWeight:700,padding:'8px 20px',borderRadius:'100px',textTransform:'uppercase',letterSpacing:'1px',background:`rgba(${report.overallRisk==='low'?'82,183,136':report.overallRisk==='moderate'?'244,162,97':'224,112,128'},.15)`,color:riskColors[report.overallRisk]||'#52b788',border:`1px solid ${riskColors[report.overallRisk]||'#52b788'}44` }}>⬤ {report.overallRisk} risk</span>
              </div>

              <div className="two-col" style={{ marginBottom:'14px' }}>
                <div className="card">
                  <div className="card-head">Assessment Scores</div>
                  {renderScore('Depression (DASS-21)', report.dass21.depression.score, 42, report.dass21.depression.severity)}
                  {renderScore('Anxiety (DASS-21)', report.dass21.anxiety.score, 42, report.dass21.anxiety.severity)}
                  {renderScore('Stress (DASS-21)', report.dass21.stress.score, 42, report.dass21.stress.severity)}
                  {renderScore('GAD-7 (Anxiety)', report.gad7.score, 21, report.gad7.severity)}
                  {renderScore('PHQ-9 (Depression)', report.phq9.score, 27, report.phq9.severity)}
                </div>
                <div className="card">
                  <div className="card-head">Vital Signs</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                    {[['Blood Pressure',`${report.vitals.systolic}/${report.vitals.diastolic} mmHg`,'💓'],['Heart Rate',`${report.vitals.heartRate} bpm`,'❤️'],['Sleep',`${report.vitals.sleepDuration} hrs`,'😴'],['Temperature',report.vitals.temperature?`${report.vitals.temperature}°C`:'—','🌡️']].map(([lbl,val,icon])=>(
                      <div key={lbl} style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'12px',padding:'14px',textAlign:'center' }}>
                        <div style={{ fontSize:'20px',marginBottom:'6px' }}>{icon}</div>
                        <div style={{ fontSize:'15px',fontWeight:700,color:'#fff' }}>{val}</div>
                        <div style={{ fontSize:'10px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginTop:'4px' }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'20px' }}>
                    <div className="card-head">Radar Overview</div>
                    <div style={{ position:'relative',height:'160px',width:'100%' }}>
                      <canvas ref={chartRef}></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">Personalised Recommendations ({report.recommendations?.length || 0})</div>
                {(report.recommendations||[]).map((rec,i)=>(
                  <div key={i} style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'14px',padding:'16px',marginBottom:'10px' }}>
                    <div style={{ fontSize:'10px',textTransform:'uppercase',letterSpacing:'1.5px',fontWeight:700,marginBottom:'6px',color:rec.priority==='high'?'var(--rose)':rec.priority==='medium'?'var(--gold)':'var(--sage2)' }}>{rec.priority} priority · {rec.category}</div>
                    <div style={{ fontSize:'14px',fontWeight:600,color:'#fff',marginBottom:'4px' }}>{rec.title}</div>
                    <div style={{ fontSize:'12px',color:'var(--muted)',lineHeight:'1.6' }}>{rec.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div></main>
      </div>
    </>
  );
};
export default MentalReport;
