import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';

const SPECIALISTS = [
  { id:'sp1', name:'Dr. Rahul Mehta', initials:'RM', role:'Clinical Psychologist', specialty:'Anxiety, Depression', rating:'4.9', fee:1500, bg:'linear-gradient(135deg,#52b788,#2d6a4f)' },
  { id:'sp2', name:'Dr. Sneha Pillai', initials:'SP', role:'CBT Therapist', specialty:'Stress, Trauma', rating:'4.8', fee:1800, bg:'linear-gradient(135deg,#9b72cf,#7c4dcc)' },
  { id:'sp3', name:'Dr. Amit Vora', initials:'AV', role:'Mindfulness Expert', specialty:'Mindfulness, Focus', rating:'4.7', fee:1200, bg:'linear-gradient(135deg,#f4a261,#e07080)' },
  { id:'sp4', name:'Dr. Kavya Nair', initials:'KN', role:'Student Counselor', specialty:'Academic Stress', rating:'4.9', fee:1000, bg:'linear-gradient(135deg,#aed9e0,#52b788)' },
];
const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];
const UNAVAIL = [2, 5];

const Appointment = () => {
  const { token, user, authFetch } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [selectedSpec, setSelectedSpec] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [aptDate, setAptDate] = useState('');
  const [aptMode, setAptMode] = useState('video-call');
  const [concerns, setConcerns] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [slotsVisible, setSlotsVisible] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML = ''; for (let i = 0; i < 30; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`; pc.appendChild(p); } }
    loadAppointments();
  }, [token]);

  const loadAppointments = async () => {
    try {
      const data = await authFetch('/api/appointments?limit=5');
      if (data?.success) setAppointments(data.data);
    } catch {}
  };

  const bookAppointment = async () => {
    if (!selectedSpec) { showError('Please select a counselor.'); return; }
    if (!aptDate) { showError('Please pick a date.'); return; }
    if (!selectedTime) { showError('Please pick a time slot.'); return; }
    try {
      const body = { specialistId: selectedSpec.id, specialistName: selectedSpec.name, specialistRole: selectedSpec.role, specialistSpecialty: selectedSpec.specialty, appointmentDate: aptDate, appointmentTime: selectedTime, counselingType: aptMode, concerns, consultationFee: selectedSpec.fee, patientPhone: user?.mobile || '9999999999' };
      const data = await authFetch('/api/appointments', { method: 'POST', body });
      if (data?.success) { showSuccess(`Appointment booked! ID: ${data.data.bookingId} 🎉`); loadAppointments(); }
      else showError(data?.message || 'Booking failed.');
    } catch { showError('Connection error.'); }
  };

  const cancelApt = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const data = await authFetch(`/api/appointments/${id}/cancel`, { method: 'PUT' });
      if (data?.success) { showSuccess('Appointment cancelled.'); loadAppointments(); }
      else showError(data?.message || 'Could not cancel.');
    } catch { showError('Connection error.'); }
  };

  const inputStyle = { width:'100%',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 14px',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',outline:'none' };
  const labelStyle = { fontSize:'12px',color:'var(--muted)',marginBottom:'6px',display:'block',textTransform:'uppercase',letterSpacing:'1px' };

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header"><div><div className="page-eyebrow">Professional care</div><h1 className="page-title">Book a <em>Session</em></h1><div className="page-sub">Confidential counseling with certified professionals</div></div></div>

          <div className="card" style={{ marginBottom:'14px' }}>
            <div className="card-head">Step 1 — Choose your counselor</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px',marginBottom:'20px' }}>
              {SPECIALISTS.map(s => (
                <div key={s.id} onClick={() => setSelectedSpec(s)}
                  style={{ background:'var(--glass)',border:`1px solid ${selectedSpec?.id===s.id?'rgba(82,183,136,.5)':'var(--border)'}`,borderRadius:'16px',padding:'20px',cursor:'pointer',background: selectedSpec?.id===s.id?'rgba(82,183,136,.06)':'var(--glass)',transition:'all .22s' }}>
                  <div style={{ width:'52px',height:'52px',borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:700,color:'#fff',marginBottom:'12px' }}>{s.initials}</div>
                  <div style={{ fontSize:'15px',fontWeight:600,color:'#fff',marginBottom:'4px' }}>{s.name}</div>
                  <div style={{ fontSize:'12px',color:'var(--sage2)',marginBottom:'6px' }}>{s.role}</div>
                  <div style={{ fontSize:'11px',color:'var(--muted)' }}>⭐ {s.rating} · {s.specialty}</div>
                  <div style={{ fontSize:'12px',fontWeight:600,color:'var(--gold)',marginTop:'8px' }}>₹{s.fee.toLocaleString()} / session</div>
                </div>
              ))}
            </div>

            <div className="card-head">Step 2 — Pick date &amp; time</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px' }}>
              <div><label style={labelStyle}>Date</label><input type="date" min={new Date().toISOString().split('T')[0]} value={aptDate} onChange={e=>{setAptDate(e.target.value);setSlotsVisible(true);setSelectedTime(null);}} style={inputStyle} /></div>
              <div><label style={labelStyle}>Mode</label>
                <select value={aptMode} onChange={e=>setAptMode(e.target.value)} style={{...inputStyle,option:{background:'#12181f'}}}>
                  <option value="video-call">📹 Video Call</option>
                  <option value="phone-call">📞 Phone Call</option>
                  <option value="in-office">🏢 In-Office</option>
                </select>
              </div>
            </div>
            {slotsVisible && (<>
              <div className="card-head">Available slots</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:'8px',marginBottom:'16px' }}>
                {TIME_SLOTS.map((t,i) => (
                  <div key={t} onClick={()=>!UNAVAIL.includes(i)&&setSelectedTime(t)}
                    style={{ padding:'10px 8px',borderRadius:'10px',border:`1px solid ${selectedTime===t?'rgba(82,183,136,.5)':UNAVAIL.includes(i)?'var(--border)':'var(--border)'}`,background:selectedTime===t?'rgba(82,183,136,.12)':'var(--glass)',fontSize:'13px',fontWeight:500,color:UNAVAIL.includes(i)?'rgba(255,255,255,.2)':selectedTime===t?'var(--sage2)':'rgba(255,255,255,.6)',cursor:UNAVAIL.includes(i)?'not-allowed':'pointer',textAlign:'center' }}>
                    {t}
                  </div>
                ))}
              </div>
            </>)}

            <div className="card-head">Step 3 — Your concerns</div>
            <textarea rows="3" value={concerns} onChange={e=>setConcerns(e.target.value)} placeholder="What would you like to discuss?" style={{...inputStyle,resize:'none',marginBottom:'16px'}}></textarea>

            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px' }}>
              <div><div style={{ fontSize:'13px',color:'var(--muted)' }}>Consultation fee</div><div style={{ fontSize:'22px',fontWeight:700,color:'var(--sage2)' }}>{selectedSpec?`₹${selectedSpec.fee.toLocaleString()}`:'₹—'}</div></div>
              <button className="btn btn-primary" style={{ padding:'12px 32px',fontSize:'15px' }} onClick={bookAppointment}><i className="fas fa-calendar-check"></i> Confirm Booking</button>
            </div>
          </div>

          <div className="card" style={{ marginBottom:'14px' }}>
            <div className="card-head">Your appointments</div>
            {appointments.length === 0 ? <div style={{ textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:'14px' }}>No appointments booked yet.</div> : appointments.map(apt=>(
              <div key={apt._id} style={{ display:'flex',alignItems:'center',gap:'14px',padding:'14px',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'14px',marginBottom:'8px' }}>
                <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:'20px',color:'#fff',minWidth:'55px' }}>{apt.appointmentTime}</div>
                <div style={{ width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,var(--sage2),var(--lavender))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0 }}>{apt.specialistName.split(' ').map(w=>w[0]).join('')}</div>
                <div>
                  <div style={{ fontSize:'14px',fontWeight:600,color:'#fff' }}>{apt.specialistName}</div>
                  <div style={{ fontSize:'11px',color:'var(--muted)',marginTop:'2px' }}>{apt.specialistSpecialty} · {new Date(apt.appointmentDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})} · {apt.counselingType}</div>
                </div>
                <div style={{ marginLeft:'auto',fontSize:'10px',padding:'4px 10px',borderRadius:'100px',background:apt.status==='confirmed'?'rgba(82,183,136,.15)':apt.status==='cancelled'?'rgba(224,112,128,.1)':'rgba(244,162,97,.15)',color:apt.status==='confirmed'?'var(--sage2)':apt.status==='cancelled'?'var(--rose)':'var(--gold)',border:`1px solid ${apt.status==='confirmed'?'rgba(82,183,136,.2)':apt.status==='cancelled'?'rgba(224,112,128,.2)':'rgba(244,162,97,.2)'}` }}>{apt.status}</div>
                {apt.status !== 'cancelled' && <button onClick={()=>cancelApt(apt._id)} style={{ marginLeft:'8px',background:'none',border:'1px solid rgba(224,112,128,.3)',color:'var(--rose)',padding:'4px 10px',borderRadius:'8px',cursor:'pointer',fontSize:'11px' }}>Cancel</button>}
              </div>
            ))}
          </div>

          <div style={{ background:'rgba(224,112,128,.07)',border:'1px solid rgba(224,112,128,.18)',borderRadius:'16px',padding:'20px',marginTop:'14px' }}>
            <div style={{ fontSize:'13px',fontWeight:700,color:'var(--rose)',marginBottom:'10px' }}>🆘 Need immediate support?</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'8px',fontSize:'13px',color:'rgba(255,255,255,.7)' }}>
              <div><b>iCall:</b> <a href="tel:9152987821" style={{ color:'var(--rose)' }}>9152987821</a></div>
              <div><b>AASRA:</b> <a href="tel:02227546669" style={{ color:'var(--rose)' }}>022-27546669</a></div>
              <div><b>Vandrevala:</b> <a href="tel:18602662345" style={{ color:'var(--rose)' }}>1860-2662-345</a></div>
              <div><b>Emergency:</b> <a href="tel:112" style={{ color:'var(--rose)' }}>112</a></div>
            </div>
          </div>
        </div></main>
      </div>
    </>
  );
};
export default Appointment;
