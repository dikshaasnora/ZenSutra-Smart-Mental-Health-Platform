import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const { user, token, authFetch, logout, openAuthModal } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState('');
  const [todayDate, setTodayDate] = useState('');
  const [wellnessScore, setWellnessScore] = useState('—');
  const [wellnessChange, setWellnessChange] = useState('↑ Loading...');
  const [streakVal, setStreakVal] = useState(0);
  const [streakLabel, setStreakLabel] = useState('Keep going!');
  const [sessionVal, setSessionVal] = useState('—');
  const [moodToday, setMoodToday] = useState('😐');
  const [moodTodayLabel, setMoodTodayLabel] = useState('Not logged yet');
  const [activeQuickMood, setActiveQuickMood] = useState(null);

  const [goals, setGoals] = useState({
    g1: { val: '0/5', fill: '0%' },
    g2: { val: '0/7', fill: '0%' },
    g3: { val: '0h / 8h', fill: '0%' },
    g4: { val: '0/3', fill: '0%' },
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!token) {
      openAuthModal('login');
      return;
    }

    // Greeting
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    
    // Date
    setTodayDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

    // Particles
    const pc = document.getElementById('particles');
    if (pc) {
      pc.innerHTML = '';
      for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random() * 100}%;width:${Math.random() * 3 + 1}px;height:${Math.random() * 3 + 1}px;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${-(Math.random() * 20)}s;opacity:${Math.random() * .3 + .1}`;
        pc.appendChild(p);
      }
    }

    // Load Data
    loadMoodData();
    loadDynamicStats();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [token]);

  const loadMoodData = async () => {
    try {
      const data = await authFetch('/api/mood?limit=30');
      if (!data?.success) return;

      const moods = data.data;
      if (!moods.length) return;

      const latest = moods[0];
      const emojiMap = { Happy: '😊', Calm: '😌', Sad: '😔', Anxious: '😟', Stressed: '😤', Angry: '😡', Ecstatic: '🤩', Neutral: '😐', Fear: '😰', Disgust: '😒', Surprise: '😲' };
      
      setMoodToday(emojiMap[latest.label] || '😐');
      setMoodTodayLabel(latest.label);

      // Wellness score
      const scoreMap = { Ecstatic: 10, Happy: 8.5, Calm: 8, Neutral: 6, Surprise: 6, Anxious: 4, Sad: 3, Fear: 3, Stressed: 3, Disgust: 2, Angry: 2 };
      const last7 = moods.slice(0, 7);
      const avg = last7.reduce((s, m) => s + (scoreMap[m.label] || 5), 0) / last7.length;
      
      setWellnessScore((Math.round(avg * 10) / 10).toString());
      setWellnessChange(avg >= 6 ? '↑ Good week!' : 'Hang in there');

      // Streak
      const loggedDates = new Set(moods.map(m => new Date(m.createdAt).setHours(0, 0, 0, 0)));
      let streak = 0;
      let checkD = new Date(); checkD.setHours(0, 0, 0, 0);
      
      if (!loggedDates.has(checkD.getTime())) checkD.setDate(checkD.getDate() - 1);
      
      while (loggedDates.has(checkD.getTime())) {
        streak++;
        checkD.setDate(checkD.getDate() - 1);
      }
      
      setStreakVal(streak);
      setStreakLabel(streak > 2 ? '🔥 Keep it going!' : (streak > 0 ? 'Good start!' : 'Log today!'));

      // Update Goal 2
      const last7DaysMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentMoods = moods.filter(m => new Date(m.createdAt).getTime() > last7DaysMs).length;
      
      setGoals(prev => ({
        ...prev,
        g2: { val: `${Math.min(recentMoods, 7)}/7`, fill: `${Math.min((recentMoods / 7) * 100, 100)}%` }
      }));

      // Render Chart
      renderWeekChart(moods);

    } catch (e) {
      console.warn('Mood API error:', e);
    }
  };

  const renderWeekChart = (history) => {
    if (!chartRef.current) return;
    
    const ctx = chartRef.current.getContext('2d');
    const scoreMap = { Ecstatic: 10, Happy: 8.5, Calm: 8, Neutral: 6, Surprise: 6, Anxious: 4, Sad: 3, Fear: 3, Stressed: 3, Disgust: 2, Angry: 2 };

    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i); return d;
    });

    const vals = days7.map(day => {
      const match = history.find(m => {
        const md = new Date(m.createdAt);
        return md.getDate() === day.getDate() && md.getMonth() === day.getMonth();
      });
      return match ? (scoreMap[match.label] || 5) : null;
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (window.Chart) {
      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: days7.map(d => d.toLocaleDateString('en', { weekday: 'short' })),
          datasets: [{
            data: vals,
            borderColor: '#52b788', fill: true,
            backgroundColor: 'rgba(82,183,136,.08)',
            tension: 0.4, pointRadius: 5, pointHoverRadius: 7,
            pointBackgroundColor: '#52b788',
            pointBorderColor: '#0a0e14', pointBorderWidth: 2,
            spanGaps: true,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, tooltip: {
              backgroundColor: 'rgba(13,17,23,.95)', borderColor: 'rgba(82,183,136,.3)', borderWidth: 1,
              titleColor: '#52b788', bodyColor: '#e8eaf0',
              callbacks: { label: c => `Mood score: ${c.raw || '—'}/10` }
            }
          },
          scales: {
            x: { display: false },
            y: { display: false, min: 0, max: 10 }
          }
        }
      });
    }
  };

  const loadDynamicStats = async () => {
    try {
      const aiData = await authFetch('/api/ai/conversation?limit=50');
      if (aiData?.success) {
        const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentSessions = aiData.conversations.filter(c => new Date(c.createdAt).getTime() > lastWeek).length;
        
        setSessionVal(aiData.conversations.length.toString());
        
        setGoals(prev => ({
          ...prev,
          g4: { val: `${Math.min(recentSessions, 3)}/3`, fill: `${Math.min((recentSessions / 3) * 100, 100)}%` }
        }));
      }
    } catch (e) {}

    const dayOfWeek = new Date().getDay() || 7;
    const medProgress = Math.min(dayOfWeek, 5);
    
    setGoals(prev => ({
      ...prev,
      g1: { val: `${medProgress}/5`, fill: `${(medProgress / 5) * 100}%` }
    }));

    const sleep = (7.2).toFixed(1);
    setGoals(prev => ({
      ...prev,
      g3: { val: `${sleep}h / 8h`, fill: `${Math.min((sleep / 8) * 100, 100)}%` }
    }));
  };

  const quickLog = async (emoji, label, value) => {
    setActiveQuickMood(label);
    try {
      const data = await authFetch('/api/mood', {
        method: 'POST',
        body: { value, label, capturedVia: 'manual', notes: 'Quick check-in from dashboard' },
      });
      if (data?.success) {
        setMoodToday(emoji);
        setMoodTodayLabel(label);
        showSuccess(`${emoji} Mood logged: ${label}`);
        loadMoodData();
      }
    } catch (e) {
      showError('Could not save mood.');
    }
  };

  const renderStreakRow = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    
    return days.map((d, i) => {
      const past = (i < (today === 0 ? 6 : today - 1));
      const isToday = (i === (today === 0 ? 6 : today - 1));
      let className = 'streak-day';
      if (isToday) className += ' today';
      else if (past) className += ' done';
      else className += ' miss';
      
      return <div key={i} className={className}>{d}</div>;
    });
  };

  const initials = user ? ((user.firstName || '').charAt(0) + (user.lastName || '').charAt(0)).toUpperCase() : 'U';
  const fullName = user ? `${user.firstName} ${user.lastName || ''}` : 'User';

  return (
    <>
      <div className="bg-orbs"><div className="orb orb1"></div><div className="orb orb2"></div><div className="orb orb3"></div></div>
      <div className="particles" id="particles"></div>

      <div className="app-layout">
        <Sidebar />

        {/* Main content */}
        <main className="main-area">
          <div className="main-inner">
            {/* Header */}
            <div className="page-header">
              <div>
                <div className="page-eyebrow" id="greeting">{greeting}</div>
                <h1 className="page-title">How are you <em>feeling</em> today?</h1>
                <div className="page-sub" id="today-date">{todayDate}</div>
              </div>
              <div className="header-actions">
                <button className="btn btn-ghost" onClick={() => navigate('/mood')}><i className="fas fa-plus"></i> Log Mood</button>
                <button className="btn btn-primary" onClick={() => navigate('/ai-support')}><i className="fas fa-sparkles"></i> Talk to Zen</button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row" id="stats-row">
              <div className="stat-card" style={{ '--accent': '#52b788' }}>
                <div className="stat-label">Wellness Score</div>
                <div className="stat-value" id="wellness-score">{wellnessScore}</div>
                <div className="stat-change up" id="wellness-change">{wellnessChange}</div>
                <i className="fas fa-brain stat-icon"></i>
              </div>
              <div className="stat-card" style={{ '--accent': '#9b72cf' }}>
                <div className="stat-label">Day Streak</div>
                <div className="stat-value" id="streak-val">{streakVal}</div>
                <div className="stat-change" id="streak-label">{streakLabel}</div>
                <i className="fas fa-fire stat-icon"></i>
              </div>
              <div className="stat-card" style={{ '--accent': '#f4a261' }}>
                <div className="stat-label">AI Sessions</div>
                <div className="stat-value" id="session-val">{sessionVal}</div>
                <div className="stat-change up">This month</div>
                <i className="fas fa-comments stat-icon"></i>
              </div>
              <div className="stat-card" style={{ '--accent': '#e07080' }}>
                <div className="stat-label">Mood Today</div>
                <div className="stat-value" id="mood-today">{moodToday}</div>
                <div className="stat-change" id="mood-today-label">{moodTodayLabel}</div>
                <i className="fas fa-heart stat-icon"></i>
              </div>
            </div>

            {/* Middle row */}
            <div className="two-col">
              {/* Quick mood check-in */}
              <div className="card">
                <div className="card-head">Quick check-in</div>
                <div className="mood-quick-grid" id="quick-mood-grid">
                  <div className={`qm-btn ${activeQuickMood === 'Happy' ? 'active' : ''}`} onClick={() => quickLog('😊', 'Happy', 3)}><span>😊</span><small>Happy</small></div>
                  <div className={`qm-btn ${activeQuickMood === 'Calm' ? 'active' : ''}`} onClick={() => quickLog('😌', 'Calm', 4)}><span>😌</span><small>Calm</small></div>
                  <div className={`qm-btn ${activeQuickMood === 'Anxious' ? 'active' : ''}`} onClick={() => quickLog('😟', 'Anxious', 2)}><span>😟</span><small>Anxious</small></div>
                  <div className={`qm-btn ${activeQuickMood === 'Sad' ? 'active' : ''}`} onClick={() => quickLog('😔', 'Sad', 5)}><span>😔</span><small>Sad</small></div>
                  <div className={`qm-btn ${activeQuickMood === 'Angry' ? 'active' : ''}`} onClick={() => quickLog('😡', 'Angry', 0)}><span>😡</span><small>Angry</small></div>
                  <div className={`qm-btn ${activeQuickMood === 'Ecstatic' ? 'active' : ''}`} onClick={() => quickLog('🤩', 'Ecstatic', 3)}><span>🤩</span><small>Ecstatic</small></div>
                </div>
                <div className="card-head" style={{ marginTop: '20px' }}>This week's streak</div>
                <div className="streak-row" id="streak-row">
                  {renderStreakRow()}
                </div>
              </div>

              {/* Mood chart */}
              <div className="card">
                <div className="card-head">Mood this week</div>
                <canvas ref={chartRef} id="weekChart" height="140"></canvas>
                <div className="chart-day-labels">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="two-col">
              {/* Recommended */}
              <div className="card">
                <div className="card-head">Recommended for you</div>
                <a href="/breathe" className="rec-card">
                  <div className="rec-tag" style={{ background: 'rgba(82,183,136,.15)', color: '#52b788' }}><i className="fas fa-wind"></i> 5 min</div>
                  <div className="rec-title">Box Breathing</div>
                  <div className="rec-desc">Reduce anxiety with this science-backed technique</div>
                </a>
                <a href="/ai-support" className="rec-card" style={{ marginTop: '10px' }}>
                  <div className="rec-tag" style={{ background: 'rgba(155,114,207,.15)', color: '#9b72cf' }}><i className="fas fa-robot"></i> AI Session</div>
                  <div className="rec-title">Evening Reflection</div>
                  <div className="rec-desc">Talk through your day with Zen AI</div>
                </a>
                <a href="/mental-home" className="rec-card" style={{ marginTop: '10px' }}>
                  <div className="rec-tag" style={{ background: 'rgba(244,162,97,.15)', color: '#f4a261' }}><i className="fas fa-clipboard-list"></i> Assessment</div>
                  <div className="rec-title">Mental Health Checkup</div>
                  <div className="rec-desc">Take the DASS-21 + GAD-7 + PHQ-9 assessment</div>
                </a>
              </div>

              {/* Weekly goals */}
              <div className="card">
                <div className="card-head">Weekly goals</div>
                <div className="goal-item">
                  <div className="goal-header"><span className="goal-name">Meditation sessions</span><span className="goal-val" style={{ color: '#52b788' }} id="g1-val">{goals.g1.val}</span></div>
                  <div className="prog-bar"><div className="prog-fill" id="g1-fill" style={{ width: goals.g1.fill, background: 'linear-gradient(90deg,#2d6a4f,#52b788)' }}></div></div>
                </div>
                <div className="goal-item">
                  <div className="goal-header"><span className="goal-name">Mood entries</span><span className="goal-val" style={{ color: '#9b72cf' }} id="g2-val">{goals.g2.val}</span></div>
                  <div className="prog-bar"><div className="prog-fill" id="g2-fill" style={{ width: goals.g2.fill, background: 'linear-gradient(90deg,#9b72cf,#d4b8f0)' }}></div></div>
                </div>
                <div className="goal-item">
                  <div className="goal-header"><span className="goal-name">Sleep hours (avg)</span><span className="goal-val" style={{ color: '#f4a261' }} id="g3-val">{goals.g3.val}</span></div>
                  <div className="prog-bar"><div className="prog-fill" id="g3-fill" style={{ width: goals.g3.fill, background: 'linear-gradient(90deg,#f4a261,#ffd6a5)' }}></div></div>
                </div>
                <div className="goal-item">
                  <div className="goal-header"><span className="goal-name">Zen AI sessions</span><span className="goal-val" style={{ color: '#e07080' }} id="g4-val">{goals.g4.val}</span></div>
                  <div className="prog-bar"><div className="prog-fill" id="g4-fill" style={{ width: goals.g4.fill, background: 'linear-gradient(90deg,#e07080,#f4a261)' }}></div></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
