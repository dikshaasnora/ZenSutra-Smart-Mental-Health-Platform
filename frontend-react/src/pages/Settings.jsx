import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  const { token, user, authFetch, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  const [accountInfo, setAccountInfo] = useState(null);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [toggles, setToggles] = useState({ moodReminder:true, breathingBreak:false, aptReminder:true, weeklySummary:true, anonymous:true, aiMemory:true, aiSuggestions:true });

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML=''; for(let i=0;i<25;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`;pc.appendChild(p);} }
    loadAccountInfo();
  }, [token]);

  const loadAccountInfo = async () => {
    try {
      const data = await authFetch('/api/settings/account-info');
      if (data?.success) setAccountInfo(data.accountInfo);
    } catch {}
  };

  const changePassword = async () => {
    if (!pwCurrent || !pwNew) { showError('Enter both passwords.'); return; }
    if (pwNew.length < 6) { showError('New password must be at least 6 characters.'); return; }
    try {
      const data = await authFetch('/api/settings/change-password', { method:'POST', body:{ currentPassword:pwCurrent, newPassword:pwNew } });
      if (data?.success) { showSuccess('Password updated! 🔒'); setPwCurrent(''); setPwNew(''); }
      else showError(data?.message || 'Could not update password.');
    } catch { showError('Connection error.'); }
  };

  const exportData = async () => {
    try {
      const data = await authFetch('/api/settings/export-data');
      if (!data?.success) { showError('Export failed.'); return; }
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='zensutra-data-export.json'; a.click();
      URL.revokeObjectURL(url);
      showSuccess('Data exported! 📦');
    } catch { showError('Export failed.'); }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete ALL your data.')) return;
    if (!confirm('This cannot be undone. Click OK to confirm.')) return;
    try {
      const data = await authFetch('/api/settings/delete-account', { method:'DELETE' });
      if (data?.success) { showSuccess('Account deleted. Goodbye 💚'); setTimeout(() => { logout(); navigate('/'); }, 1500); }
      else showError(data?.message || 'Could not delete account.');
    } catch { showError('Connection error.'); }
  };

  const toggle = (key) => setToggles(p => ({ ...p, [key]: !p[key] }));

  const initials = user ? ((user.firstName||'').charAt(0)+(user.lastName||'').charAt(0)).toUpperCase()||'U' : 'U';
  const fullName = user ? `${user.firstName||''} ${user.lastName||''}` : 'User';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—';

  const Toggle = ({ k }) => (
    <div onClick={() => toggle(k)} style={{ width:'44px',height:'24px',background:toggles[k]?'var(--sage2)':'rgba(255,255,255,.1)',borderRadius:'100px',position:'relative',cursor:'pointer',transition:'all .3s',flexShrink:0 }}>
      <div style={{ position:'absolute',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',top:'3px',left:toggles[k]?'23px':'3px',transition:'.3s' }}></div>
    </div>
  );

  const SettingRow = ({ label, desc, children }) => (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,.05)' }}>
      <div><div style={{ fontSize:'14px',color:'rgba(255,255,255,.8)' }}>{label}</div>{desc&&<div style={{ fontSize:'11px',color:'var(--muted)',marginTop:'3px',maxWidth:'360px' }}>{desc}</div>}</div>
      {children}
    </div>
  );

  const inputStyle = { background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'8px',padding:'9px 12px',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'13px',outline:'none',transition:'.2s',width:'100%' };

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area"><div className="main-inner">
          <div className="page-header"><div><div className="page-eyebrow">Customize</div><h1 className="page-title"><em>Settings</em></h1></div></div>

          <div className="two-col">
            {/* LEFT */}
            <div>
              {/* Account */}
              <div className="card" style={{ marginBottom:'14px' }}>
                <div className="card-head">Account</div>
                <div style={{ display:'flex',alignItems:'center',gap:'16px',padding:'14px',background:'var(--glass)',borderRadius:'12px',border:'1px solid var(--border)',marginBottom:'16px' }}>
                  <div className="user-av" style={{ width:'52px',height:'52px',fontSize:'18px' }}>{initials}</div>
                  <div>
                    <div style={{ fontSize:'17px',fontWeight:600,color:'#fff' }}>{fullName}</div>
                    <div style={{ fontSize:'13px',color:'var(--muted)' }}>{accountInfo?.email || user?.email || '—'}</div>
                    <div style={{ fontSize:'11px',color:'var(--sage2)',marginTop:'4px' }}>Premium Member</div>
                  </div>
                </div>
                <SettingRow label="Account verified" desc="Email verification status">
                  <span style={{ fontSize:'11px',padding:'4px 10px',borderRadius:'100px',background:accountInfo?.isVerified?'rgba(82,183,136,.15)':'rgba(244,162,97,.15)',color:accountInfo?.isVerified?'var(--sage2)':'var(--gold)',border:`1px solid ${accountInfo?.isVerified?'rgba(82,183,136,.2)':'rgba(244,162,97,.2)'}` }}>
                    {accountInfo ? (accountInfo.isVerified ? '✅ Verified' : '⚠️ Unverified') : 'Loading...'}
                  </span>
                </SettingRow>
                <SettingRow label="Member since">
                  <span style={{ fontSize:'13px',color:'var(--muted)' }}>{formatDate(accountInfo?.createdAt)}</span>
                </SettingRow>
              </div>

              {/* Change Password */}
              <div className="card">
                <div className="card-head">Change Password</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'14px' }}>
                  <div><label style={{ fontSize:'11px',color:'var(--muted)',display:'block',marginBottom:'5px' }}>Current password</label><input style={inputStyle} type="password" placeholder="••••••••" value={pwCurrent} onChange={e=>setPwCurrent(e.target.value)} /></div>
                  <div><label style={{ fontSize:'11px',color:'var(--muted)',display:'block',marginBottom:'5px' }}>New password</label><input style={inputStyle} type="password" placeholder="Min. 6 chars" value={pwNew} onChange={e=>setPwNew(e.target.value)} /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop:'14px' }} onClick={changePassword}><i className="fas fa-lock"></i> Update Password</button>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              {/* Notifications */}
              <div className="card" style={{ marginBottom:'14px' }}>
                <div className="card-head">Notifications</div>
                <SettingRow label="Daily mood reminder" desc="Remind me to log my mood each day"><Toggle k="moodReminder" /></SettingRow>
                <SettingRow label="Breathing break prompts" desc="Hourly prompts during study hours"><Toggle k="breathingBreak" /></SettingRow>
                <SettingRow label="Appointment reminders" desc="30 min before each session"><Toggle k="aptReminder" /></SettingRow>
                <SettingRow label="Weekly wellness summary" desc="Email digest of your week"><Toggle k="weeklySummary" /></SettingRow>
              </div>

              {/* Privacy & AI */}
              <div className="card" style={{ marginBottom:'14px' }}>
                <div className="card-head">Privacy &amp; AI</div>
                <SettingRow label="Anonymous mode" desc="Hide identity in peer support groups"><Toggle k="anonymous" /></SettingRow>
                <SettingRow label="AI conversation memory" desc="Zen AI remembers past sessions"><Toggle k="aiMemory" /></SettingRow>
                <SettingRow label="AI proactive suggestions" desc="Get tips based on your mood patterns"><Toggle k="aiSuggestions" /></SettingRow>
                <SettingRow label="Language" desc="Chat language preference">
                  <select style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'8px',padding:'7px 12px',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'13px',outline:'none' }}>
                    <option>English</option><option>Hindi</option><option>Bilingual</option>
                  </select>
                </SettingRow>
              </div>

              {/* Data */}
              <div className="card">
                <div className="card-head">Your Data</div>
                <SettingRow label="Export all data" desc="Download your moods, reports, chats as JSON">
                  <button className="btn btn-ghost" style={{ fontSize:'12px',padding:'7px 14px' }} onClick={exportData}><i className="fas fa-download"></i> Export</button>
                </SettingRow>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background:'rgba(224,112,128,.06)',border:'1px solid rgba(224,112,128,.18)',borderRadius:'16px',padding:'20px',marginTop:'14px' }}>
            <div style={{ fontSize:'11px',textTransform:'uppercase',letterSpacing:'2px',color:'var(--rose)',fontWeight:600,marginBottom:'16px' }}>⚠️ Danger Zone</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:'14px',color:'var(--rose)' }}>Delete account permanently</div>
                <div style={{ fontSize:'11px',color:'var(--muted)',marginTop:'3px',maxWidth:'400px' }}>All your data — moods, reports, conversations — will be permanently erased. This cannot be undone.</div>
              </div>
              <button style={{ background:'rgba(224,112,128,.15)',color:'var(--rose)',border:'1px solid rgba(224,112,128,.3)',fontSize:'13px',padding:'9px 18px',borderRadius:'10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }} onClick={deleteAccount}>Delete Account</button>
            </div>
          </div>
        </div></main>
      </div>
    </>
  );
};
export default Settings;
