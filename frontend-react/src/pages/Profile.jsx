import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';

const Profile = () => {
  const { token, user, authFetch, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName:'', lastName:'', gender:'', bloodGroup:'', state:'', district:'', currentStatus:'', currentYear:'', collegeName:'', courseName:'', sleepPattern:'', exerciseHabit:'', mentalHealthCondition:'', height:'', livingWithParents:'', livingIn:'', studyMode:'', collegeDistance:'' });

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML=''; for(let i=0;i<25;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`;pc.appendChild(p);} }
    if (user) setForm(f => ({ ...f, firstName: user.firstName||'', lastName: user.lastName||'' }));
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    try {
      const data = await authFetch('/api/user/profile');
      if (!data?.success || !data.profile) return;
      const p = data.profile;
      setForm(f => ({ ...f,
        firstName: p.firstName||f.firstName, lastName: p.lastName||f.lastName,
        gender: p.gender||'', bloodGroup: p.bloodGroup||'', state: p.state||'', district: p.district||'',
        currentStatus: p.currentStatus||'', currentYear: p.currentYear||'', collegeName: p.collegeName||'',
        courseName: p.courseName||'', sleepPattern: p.sleepPattern||'', exerciseHabit: p.exerciseHabit||'',
        mentalHealthCondition: p.mentalHealthCondition||'', height: p.height||'',
        livingWithParents: p.livingWithParents||'', livingIn: p.livingIn||'',
        studyMode: p.studyMode||'', collegeDistance: p.collegeDistance||''
      }));
    } catch {}
  };

  const saveProfile = async () => {
    try {
      const body = { ...form, currentYear: form.currentYear||undefined, height: form.height||undefined, collegeDistance: form.collegeDistance||undefined };
      const data = await authFetch('/api/user/profile', { method:'PUT', body });
      if (data?.success) {
        showSuccess('Profile updated! 🌿');
        const cached = JSON.parse(localStorage.getItem('userData')||'{}');
        cached.firstName = form.firstName; cached.lastName = form.lastName;
        localStorage.setItem('userData', JSON.stringify(cached));
      } else showError(data?.message || 'Could not save profile.');
    } catch { showError('Connection error.'); }
  };

  const initials = form.firstName ? ((form.firstName||'').charAt(0)+(form.lastName||'').charAt(0)).toUpperCase()||'U' : 'U';
  const inputStyle = { width:'100%',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 14px',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',outline:'none',transition:'all .2s' };
  const labelStyle = { fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',fontWeight:600,marginBottom:'6px',display:'block' };
  const f = (id) => ({ value: form[id], onChange: e => setForm(p=>({...p,[id]:e.target.value})), style: inputStyle });

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header">
            <div><div className="page-eyebrow">Your identity</div><h1 className="page-title">My <em>Profile</em></h1></div>
            <div className="header-actions"><button className="btn btn-primary" onClick={saveProfile}><i className="fas fa-save"></i> Save Changes</button></div>
          </div>

          <div style={{ background:'linear-gradient(135deg,rgba(45,106,79,.3),rgba(155,114,207,.2))',border:'1px solid rgba(82,183,136,.2)',borderRadius:'20px',padding:'28px',display:'flex',alignItems:'center',gap:'24px',marginBottom:'14px' }}>
            <div style={{ width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,var(--sage2),var(--lavender))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'30px',fontWeight:700,color:'#fff',flexShrink:0 }}>{initials}</div>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:'26px',color:'#fff' }}>{form.firstName} {form.lastName}</div>
              <div style={{ fontSize:'13px',color:'var(--muted)',marginTop:'4px' }}>{user?.email||''}</div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11px',padding:'4px 12px',borderRadius:'100px',background:'rgba(82,183,136,.15)',color:'var(--sage2)',border:'1px solid rgba(82,183,136,.2)',marginTop:'8px' }}>🏆 Premium Member · Zensutra 2026</div>
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card-head">Personal Information</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <div><label style={labelStyle}>First name</label><input {...f('firstName')} placeholder="Aryan" /></div>
                <div><label style={labelStyle}>Last name</label><input {...f('lastName')} placeholder="Rao" /></div>
                <div><label style={labelStyle}>Gender</label><select {...f('gender')} style={inputStyle}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option></select></div>
                <div><label style={labelStyle}>Blood group</label><select {...f('bloodGroup')} style={inputStyle}><option value="">Select</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}</select></div>
                <div><label style={labelStyle}>State</label><input {...f('state')} placeholder="Maharashtra" /></div>
                <div><label style={labelStyle}>District</label><input {...f('district')} placeholder="Pune" /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Academic Information</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <div><label style={labelStyle}>Current status</label><select {...f('currentStatus')} style={inputStyle}><option value="">Select</option><option value="ug">Undergraduate</option><option value="pg">Postgraduate</option><option value="12th">12th Standard</option><option value="below-12">Below 12th</option><option value="job">Working Professional</option></select></div>
                <div><label style={labelStyle}>Current year</label><select {...f('currentYear')} style={inputStyle}><option value="">Select</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
                <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>College / Institution</label><input {...f('collegeName')} placeholder="IIT Guwahati" /></div>
                <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Course name</label><input {...f('courseName')} placeholder="B.Tech Computer Science" /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Health &amp; Wellness</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <div><label style={labelStyle}>Sleep pattern</label><select {...f('sleepPattern')} style={inputStyle}><option value="">Select</option><option value="<4">Less than 4 hours</option><option value="4-6">4–6 hours</option><option value="6-8">6–8 hours</option><option value=">8">More than 8 hours</option></select></div>
                <div><label style={labelStyle}>Exercise habit</label><select {...f('exerciseHabit')} style={inputStyle}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                <div><label style={labelStyle}>Mental health condition</label><select {...f('mentalHealthCondition')} style={inputStyle}><option value="">Select</option><option value="none">None</option><option value="anxiety">Anxiety</option><option value="depression">Depression</option><option value="prefer-not-to-say">Prefer not to say</option></select></div>
                <div><label style={labelStyle}>Height (cm)</label><input {...f('height')} type="number" placeholder="170" /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">Living Situation</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <div><label style={labelStyle}>Living with parents?</label><select {...f('livingWithParents')} style={inputStyle}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                <div><label style={labelStyle}>Accommodation type</label><select {...f('livingIn')} style={inputStyle}><option value="">Select</option><option value="hostel">Hostel</option><option value="pg">PG / Paying Guest</option><option value="rented">Rented flat</option><option value="other">Other</option></select></div>
                <div><label style={labelStyle}>Study mode</label><select {...f('studyMode')} style={inputStyle}><option value="">Select</option><option value="regular">Regular</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></div>
                <div><label style={labelStyle}>Distance to college (km)</label><input {...f('collegeDistance')} type="number" placeholder="5" /></div>
              </div>
            </div>
          </div>
        </div></main>
      </div>
    </>
  );
};
export default Profile;
