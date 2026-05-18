import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';

const Journal = () => {
  const { token, authFetch } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  const STORE_KEY = 'zensutra_journal_entries';
  const getLocalEntries = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } };
  const saveLocalEntries = (arr) => localStorage.setItem(STORE_KEY, JSON.stringify(arr));

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [entries, setEntries] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  const isGuest = token === 'guest';

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const pc = document.getElementById('particles');
    if (pc) { pc.innerHTML = ''; for (let i = 0; i < 25; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*20+15}s;animation-delay:${-(Math.random()*20)}s;opacity:${Math.random()*.3+.1}`; pc.appendChild(p); } }
    loadEntries();
  }, [token]);

  const loadEntries = async () => {
    setLoading(true);
    if (isGuest) {
      setEntries(getLocalEntries());
      setLoading(false);
    } else {
      try {
        const data = await authFetch('/api/journal');
        if (data?.success) {
          setEntries(data.journals);
        } else {
          showError('Could not load journals from cloud.');
        }
      } catch {
        showError('Server connection issue.');
      } finally {
        setLoading(false);
      }
    }
  };

  const updateWordCount = (val) => {
    setBody(val);
    setWordCount(val.trim().split(/\s+/).filter(Boolean).length);
  };

  const insertEmoji = (e) => setBody(prev => prev + e + ' ');

  const saveEntry = async () => {
    if (!body.trim()) { showError('Write something first!'); return; }
    const entryTitle = title.trim() || 'Untitled';
    const entryBody = body.trim();

    if (isGuest) {
      const newEntry = {
        id: Date.now().toString(),
        title: entryTitle,
        body: entryBody,
        createdAt: new Date().toISOString()
      };
      const updated = [newEntry, ...entries];
      saveLocalEntries(updated);
      setEntries(updated);
      showSuccess('Saved to local browser storage 📖');
      setTitle(''); setBody(''); setWordCount(0);
    } else {
      try {
        const data = await authFetch('/api/journal', {
          method: 'POST',
          body: { title: entryTitle, body: entryBody }
        });
        if (data?.success) {
          showSuccess('Entry saved securely to cloud 📖');
          loadEntries();
          setTitle(''); setBody(''); setWordCount(0);
        } else {
          showError(data?.message || 'Could not save entry.');
        }
      } catch {
        showError('Server connection issue.');
      }
    }
  };

  const deleteEntry = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    
    const targetId = id.toString();
    if (isGuest) {
      const updated = entries.filter(item => item.id !== id);
      saveLocalEntries(updated);
      setEntries(updated);
      showSuccess('Local entry deleted');
    } else {
      try {
        const data = await authFetch(`/api/journal/${id}`, { method: 'DELETE' });
        if (data?.success) {
          showSuccess('Entry deleted from cloud');
          loadEntries();
        } else {
          showError('Could not delete entry.');
        }
      } catch {
        showError('Server connection issue.');
      }
    }
  };

  const loadEntry = (e) => {
    setTitle(e.title);
    setBody(e.body);
    setWordCount(e.body.trim().split(/\s+/).filter(Boolean).length);
    showInfo('Loaded to editor 📝');
  };

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
                <div className="page-eyebrow">Your private space</div>
                <h1 className="page-title">My <em>Journal</em></h1>
                <div className="page-sub">Write freely — {isGuest ? 'saved locally to your browser' : 'encrypted, private, and synced to your account'}</div>
              </div>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => { setTitle(''); setBody(''); setWordCount(0); showInfo('New document ready'); }}><i className="fas fa-pen"></i> New Entry</button>
              </div>
            </div>

            <div className="two-col">
              {/* Editor */}
              <div className="card">
                <div className="card-head">Today — <span>{todayStr}</span></div>
                <div style={{ display:'flex',gap:'10px',padding:'12px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',marginBottom:'16px' }}>
                  {['😊','😔','🌱','💭','🔥','🌙','⚡','💚'].map(e => (
                    <button key={e} onClick={() => insertEmoji(e)} style={{ fontSize:'20px',cursor:'pointer',opacity:.45,border:'none',background:'none',padding:'4px',transition:'all .2s' }}
                      onMouseEnter={ev => ev.target.style.opacity=1} onMouseLeave={ev => ev.target.style.opacity=.45}>{e}</button>
                  ))}
                </div>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give this entry a title..."
                  style={{ width:'100%',background:'transparent',border:'none',borderBottom:'1px solid var(--border)',padding:'10px 0',fontFamily:"'DM Serif Display',serif",fontSize:'24px',color:'#fff',outline:'none',marginBottom:'16px' }} />
                <textarea value={body} onChange={e => updateWordCount(e.target.value)}
                  placeholder="Write freely... what happened today? How are you feeling? What are you grateful for? There is no right or wrong here."
                  style={{ width:'100%',background:'transparent',border:'none',color:'rgba(255,255,255,.8)',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',lineHeight:'1.8',outline:'none',resize:'none',height:'320px' }}></textarea>
                <div style={{ fontSize:'11px',color:'rgba(255,255,255,.25)' }}>{wordCount} word{wordCount !== 1 ? 's' : ''}</div>
                <div style={{ display:'flex',justifyContent:'flex-end',marginTop:'12px' }}>
                  <button className="btn btn-primary" onClick={saveEntry}><i className="fas fa-save"></i> Save Entry</button>
                </div>
              </div>

              {/* Past entries */}
              <div className="card">
                <div className="card-head">Past entries ({entries.length})</div>
                {loading ? (
                  <div style={{ textAlign:'center',padding:'30px 0',color:'var(--muted)',fontSize:'13px' }}>Loading entries... 🍃</div>
                ) : entries.length === 0 ? (
                  <div style={{ textAlign:'center',padding:'30px 0',color:'var(--muted)',fontSize:'13px' }}>Your journal entries will appear here 📖</div>
                ) : entries.map(e => (
                  <div key={e._id || e.id} onClick={() => loadEntry(e)}
                    style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'14px',padding:'16px',marginBottom:'8px',cursor:'pointer',transition:'all .2s',position:'relative' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px' }}>
                      <div style={{ fontSize:'14px',fontWeight:600,color:'#fff',paddingRight:'30px' }}>{e.title}</div>
                      <div style={{ fontSize:'11px',color:'rgba(255,255,255,.3)' }}>{new Date(e.createdAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</div>
                    </div>
                    <div style={{ fontSize:'12px',color:'var(--muted)',lineHeight:'1.5',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{e.body}</div>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px' }}>
                      <div style={{ fontSize:'11px',color:'rgba(255,255,255,.25)' }}>{e.body.trim().split(/\s+/).filter(Boolean).length} words</div>
                      <button onClick={(ev) => deleteEntry(e._id || e.id, ev)} 
                              style={{ background:'none',border:'none',color:'rgba(224,112,128,.5)',cursor:'pointer',fontSize:'12px',transition:'all .2s' }}
                              onMouseEnter={ev => ev.target.style.color='var(--rose)'}
                              onMouseLeave={ev => ev.target.style.color='rgba(224,112,128,.5)'}>
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Journal;
