import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';
import './MoodTracker.css';

const scoreMap = { Ecstatic: 10, Happy: 8.5, Calm: 8, Neutral: 6, Surprise: 6, Anxious: 4, Sad: 3, Fear: 3, Stressed: 3, Disgust: 2, Angry: 2 };

const MoodTracker = () => {
  const { token, authFetch } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [selectedMood, setSelectedMood] = useState(null);
  const [energy, setEnergy] = useState(6);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!token) {
      window.location.href = '/';
      return;
    }

    // Particles
    const pc = document.getElementById('particles');
    if (pc) {
      pc.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random() * 100}%;width:${Math.random() * 3 + 1}px;height:${Math.random() * 3 + 1}px;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${-(Math.random() * 20)}s;opacity:${Math.random() * .3 + .1}`;
        pc.appendChild(p);
      }
    }

    loadHistory(1);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [token]);

  useEffect(() => {
    if (history.length > 0) {
      renderTrendChart(history);
    }
  }, [history]);

  const loadHistory = async (p = 1) => {
    try {
      const data = await authFetch(`/api/mood?limit=10&page=${p}`);
      if (!data?.success) return;

      if (p === 1) {
        setHistory(data.data);
      } else {
        setHistory(prev => [...prev, ...data.data]);
      }

      if (data.data.length < 10) {
        setHasMore(false);
      }
    } catch {
      showError('Could not load mood history.');
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadHistory(nextPage);
  };

  const renderTrendChart = (moods) => {
    if (!chartRef.current) return;
    
    const ctx = chartRef.current.getContext('2d');
    const pts = moods.slice(0, 30).reverse().map(m => ({
      x: new Date(m.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      y: scoreMap[m.label] || 5
    }));

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (window.Chart) {
      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: pts.map(p => p.x),
          datasets: [{
            data: pts.map(p => p.y),
            borderColor: '#9b72cf',
            fill: true,
            backgroundColor: 'rgba(155,114,207,.08)',
            tension: .4,
            pointRadius: 4,
            pointBackgroundColor: '#9b72cf',
            pointBorderColor: '#0a0e14',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(13,17,23,.95)',
              borderColor: 'rgba(155,114,207,.3)',
              borderWidth: 1,
              callbacks: { label: c => `Score: ${c.raw}/10` }
            }
          },
          scales: {
            x: { ticks: { color: 'rgba(255,255,255,.3)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.03)' } },
            y: { min: 0, max: 10, ticks: { color: 'rgba(255,255,255,.3)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.04)' } }
          }
        }
      });
    }
  };

  const logMood = async () => {
    if (!selectedMood) { showError('Please select a mood first.'); return; }

    try {
      const data = await authFetch('/api/mood', {
        method: 'POST',
        body: { value: selectedMood.value, label: selectedMood.label, energyLevel: +energy, notes: note, capturedVia: 'manual' },
      });
      if (data?.success) {
        showSuccess(`${selectedMood.emoji} Mood logged: ${selectedMood.label}`);
        setHistory(prev => [data.data, ...prev]);
        setSelectedMood(null);
        setNote('');
        setEnergy(6);
      } else {
        showError(data?.message || 'Could not save mood.');
      }
    } catch {
      showError('Connection error.');
    }
  };

  const emojiMap = { Ecstatic: '😄', Happy: '😊', Calm: '😌', Neutral: '😐', Anxious: '😟', Sad: '😔', Stressed: '😤', Angry: '😡', Fear: '😰', Surprise: '😲', Disgust: '😒' };



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
                <div className="page-eyebrow">Daily check-in</div>
                <h1 className="page-title">Mood <em>Tracker</em></h1>
                <div className="page-sub">Log your emotions and discover patterns over time</div>
              </div>
            </div>

            <div className="two-col">
              {/* Log mood */}
              <div className="card">
                <div className="card-head">Select your mood</div>
                <div className="mood-grid-big" id="mood-selector">
                  <div className={`mood-big-btn ${selectedMood?.label === 'Ecstatic' ? 'sel' : ''}`} style={selectedMood?.label === 'Ecstatic' ? { '--sel-c': '#52b788', '--sel-bg': 'rgba(82,183,136,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😄', label: 'Ecstatic', value: 3 })}><span>😄</span><small>Ecstatic</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Happy' ? 'sel' : ''}`} style={selectedMood?.label === 'Happy' ? { '--sel-c': '#74c69d', '--sel-bg': 'rgba(116,198,157,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😊', label: 'Happy', value: 3 })}><span>😊</span><small>Happy</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Calm' ? 'sel' : ''}`} style={selectedMood?.label === 'Calm' ? { '--sel-c': '#aed9e0', '--sel-bg': 'rgba(174,217,224,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😌', label: 'Calm', value: 4 })}><span>😌</span><small>Calm</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Neutral' ? 'sel' : ''}`} style={selectedMood?.label === 'Neutral' ? { '--sel-c': '#8892a4', '--sel-bg': 'rgba(136,146,164,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😐', label: 'Neutral', value: 4 })}><span>😐</span><small>Neutral</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Anxious' ? 'sel' : ''}`} style={selectedMood?.label === 'Anxious' ? { '--sel-c': '#f4a261', '--sel-bg': 'rgba(244,162,97,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😟', label: 'Anxious', value: 2 })}><span>😟</span><small>Anxious</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Sad' ? 'sel' : ''}`} style={selectedMood?.label === 'Sad' ? { '--sel-c': '#9b72cf', '--sel-bg': 'rgba(155,114,207,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😔', label: 'Sad', value: 5 })}><span>😔</span><small>Sad</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Stressed' ? 'sel' : ''}`} style={selectedMood?.label === 'Stressed' ? { '--sel-c': '#e07080', '--sel-bg': 'rgba(224,112,128,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😤', label: 'Stressed', value: 2 })}><span>😤</span><small>Stressed</small></div>
                  <div className={`mood-big-btn ${selectedMood?.label === 'Angry' ? 'sel' : ''}`} style={selectedMood?.label === 'Angry' ? { '--sel-c': '#e05c5c', '--sel-bg': 'rgba(224,92,92,.12)' } : {}} onClick={() => setSelectedMood({ emoji: '😡', label: 'Angry', value: 0 })}><span>😡</span><small>Angry</small></div>
                </div>

                <div className="card-head">Energy level</div>
                <div className="energy-row">
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Low</span>
                  <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(e.target.value)} />
                  <span className="energy-val">{energy}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>High</span>
                </div>

                <div className="card-head" style={{ marginTop: '16px' }}>Note (optional)</div>
                <textarea style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', resize: 'none', outline: 'none', height: '80px', lineHeight: '1.5' }} placeholder="What's on your mind today?" value={note} onChange={(e) => setNote(e.target.value)}></textarea>

                <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '16px' }} onClick={logMood}>
                  <i className="fas fa-check-circle"></i> Log This Mood
                </button>
              </div>

              {/* History */}
              <div className="card">
                <div className="card-head">Recent logs</div>
                <div id="mood-history-list">
                  {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: '14px' }}>No mood entries yet. Log your first mood! 🌱</div>
                  ) : (
                    history.map((mood) => {
                      const isLow = mood.value <= 2;
                      const date = new Date(mood.createdAt);
                      const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' · ' + date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={mood._id || mood.createdAt} className="history-entry">
                          <div className="h-emoji">{emojiMap[mood.label] || '😐'}</div>
                          <div>
                            <div className="h-label">{mood.label}</div>
                            <div className="h-meta">{dateStr} · Energy {mood.energyLevel || 5}/10{mood.notes ? ' · ' + mood.notes.slice(0, 30) : ''}</div>
                          </div>
                          <div className={`h-badge ${isLow ? 'badge-low' : 'badge-good'}`}>{isLow ? 'Low energy' : 'Logged'}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                {hasMore && (
                  <button className="btn btn-ghost" style={{ width: '100%', fontSize: '12px', marginTop: '8px' }} onClick={loadMore}>Load more</button>
                )}
              </div>
            </div>

            {/* 30-day chart */}
            <div className="chart-card">
              <div className="card-head">30-day mood trend</div>
              <canvas ref={chartRef} id="trendChart" height="120"></canvas>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MoodTracker;
