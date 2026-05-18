import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/Sidebar';
import './AISupport.css';

const AISupport = () => {
  const { token, authFetch, openAuthModal } = useAuth();
  const { showInfo, showError, showWarning } = useNotification();

  const [messages, setMessages] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const msgsRef = useRef(null);

  useEffect(() => {
    if (!token) {
      openAuthModal('login');
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

    // Initial message
    setMessages([{
      text: "Namaste! 🙏 I'm Zen, your personal mental wellness companion. I'm here to listen — without judgment, without pressure. How are you feeling right now?",
      who: 'ai',
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    }]);

    loadHistory();
  }, [token]);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadHistory = async () => {
    try {
      const data = await authFetch('/api/ai/conversation?limit=10');
      if (data?.success && data.conversations.length > 0) {
        setHistory(data.conversations.slice(-5).reverse());
      }
    } catch {
      showError('Could not load history.');
    }
  };

  const sendMsg = async (msgText = input) => {
    const msg = msgText.trim();
    if (!msg || isTyping) return;

    setInput('');
    setShowQuickReplies(false);
    
    const time = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { text: msg, who: 'user', time }]);
    
    setIsTyping(true);

    try {
      // Build conversation context (last 3 turns)
      const ctxParts = [];
      const recentMsgs = messages.slice(-6);
      recentMsgs.forEach(m => {
        ctxParts.push((m.who === 'user' ? 'User' : 'Zen') + ': ' + m.text.slice(0, 100));
      });

      const data = await authFetch('/api/ai/chat', {
        method: 'POST',
        body: { message: msg, mood: currentMood ? { label: currentMood, createdAt: new Date().toISOString() } : null, context: ctxParts.join('\n') },
      });

      setIsTyping(false);

      if (data?.success) {
        setMessages(prev => [...prev, { text: data.response, who: 'ai', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }]);
        if (data.type === 'emergency') showWarning('If you are in crisis, please call the helplines on the left.');
      } else {
        setMessages(prev => [...prev, { text: "I'm having a moment — please try again. 🌿", who: 'ai', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "Connection issue. Check your internet and try again.", who: 'ai', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }]);
    }
  };

  const sendQuick = (text) => {
    sendMsg(text);
  };

  const clearChat = () => {
    setMessages([{
      text: "Starting fresh! 🌱 I'm here whenever you're ready. What's on your mind?",
      who: 'ai',
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    }]);
    setShowQuickReplies(true);
  };

  const setMoodCtx = (label) => {
    setCurrentMood(label);
    showInfo(`Zen will respond with ${label} in mind 💚`);
  };



  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
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
                <div className="page-eyebrow">AI-powered support</div>
                <h1 className="page-title">Zen <em>AI</em></h1>
                <div className="page-sub">Powered by Google Gemini · Safe, empathetic, confidential</div>
              </div>
              <div className="header-actions">
                <button className="btn btn-ghost" onClick={clearChat}><i className="fas fa-rotate"></i> New Session</button>
              </div>
            </div>

            <div className="chat-layout">
              {/* Chat window */}
              <div className="chat-window" style={{ gridColumn: 2, gridRow: 1 }}>
                <div className="chat-header">
                  <div className="ai-avatar">✨</div>
                  <div>
                    <div className="ai-name">Zen — Zensutra Wellness AI</div>
                    <div className="ai-status"><div className="status-dot"></div>Online · Ready to listen</div>
                  </div>
                  <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '12px', padding: '6px 12px' }} onClick={clearChat}>Clear</button>
                </div>
                
                <div className="chat-msgs" ref={msgsRef}>
                  {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.who}`}>
                      <div className="bubble" dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }}></div>
                      <div className="msg-time">{m.time}</div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="msg ai" id="typing-el">
                      <div className="typing-dots"><div className="tdot"></div><div className="tdot"></div><div className="tdot"></div></div>
                    </div>
                  )}
                </div>

                {showQuickReplies && (
                  <div className="quick-replies" id="quick-replies">
                    <div className="qr-chip" onClick={() => sendQuick('Feeling anxious today 😟')}>Feeling anxious today 😟</div>
                    <div className="qr-chip" onClick={() => sendQuick('I need to vent 💬')}>I need to vent 💬</div>
                    <div className="qr-chip" onClick={() => sendQuick('Help me breathe')}>Help me breathe</div>
                    <div className="qr-chip" onClick={() => sendQuick("I'm doing great! 😊")}>I'm doing great! 😊</div>
                    <div className="qr-chip" onClick={() => sendQuick("Can't sleep")}>Can't sleep</div>
                    <div className="qr-chip" onClick={() => sendQuick('Exam stress')}>Exam stress</div>
                  </div>
                )}

                <div className="chat-input-row">
                  <input class="chat-input" id="chat-input" placeholder="Share what's on your mind..." maxlength="1000"
                         value={input} onChange={(e) => setInput(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} />
                  <button className="send-btn" onClick={() => sendMsg()}><i className="fas fa-paper-plane"></i></button>
                </div>
              </div>

              {/* Side panel */}
              <div className="side-panel" style={{ gridColumn: 1, gridRow: 1 }}>
                {/* Mood context */}
                <div className="side-card">
                  <div className="side-title">How are you feeling?</div>
                  <div className="mood-sel">
                    {['Happy', 'Calm', 'Anxious', 'Sad', 'Stressed', 'Angry'].map((label) => (
                      <div key={label} className={`mood-opt ${currentMood === label ? 'sel' : ''}`} onClick={() => setMoodCtx(label)}>
                        {label === 'Happy' ? '😊' : label === 'Calm' ? '😌' : label === 'Anxious' ? '😟' : label === 'Sad' ? '😔' : label === 'Stressed' ? '😤' : '😡'} {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent conversations */}
                <div className="side-card">
                  <div className="side-title">Recent sessions</div>
                  <div id="history-list">
                    {history.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>Load your chat history below</div>
                    ) : (
                      history.map((c, i) => (
                        <div key={i} className="conv-item">
                          <div className="conv-user">{c.userMessage.slice(0, 50)}{c.userMessage.length > 50 ? '...' : ''}</div>
                          <div className="conv-ai">{c.aiResponse.slice(0, 60)}...</div>
                          <div className="conv-time">{timeAgo(c.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="btn btn-ghost" style={{ width: '100%', fontSize: '12px', marginTop: '8px' }} onClick={loadHistory}><i className="fas fa-history"></i> Load History</button>
                </div>

                {/* Crisis box */}
                <div className="side-card">
                  <div className="crisis-box">
                    <div className="crisis-title">🆘 Need immediate help?</div>
                    <div className="crisis-line"><a href="tel:9152987821"><b>iCall:</b> 9152987821</a></div>
                    <div className="crisis-line"><a href="tel:02227546669"><b>AASRA:</b> 022-27546669</a></div>
                    <div className="crisis-line"><a href="tel:18602662345"><b>Vandrevala:</b> 1860-2662-345</a></div>
                    <div className="crisis-line"><a href="tel:112"><b>Emergency:</b> 112</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AISupport;
