// ============================================================
//  ZENSUTRA — Global App Utilities
//  File: Frontend/js/app.js
//  ────────────────────────────────────────────────────────────
//  Loaded on every page after config.js.
//  Provides:
//    • authFetch()      — authenticated fetch wrapper (adds JWT header)
//    • requireAuth()    — redirect to landing if not logged in
//    • getUser()        — return parsed userData from localStorage
//    • logout()         — clear tokens, redirect home
//    • showSuccess/Error/Info() — toast notification helpers
//    • updateNavbar()   — populate header with logged-in user info
// ============================================================

// ── Authenticated Fetch ───────────────────────────────────────
// Usage: const data = await authFetch('/api/mood', { method:'POST', body:{...} });
window.authFetch = async function (endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  // Only set JSON content-type for non-FormData bodies
  // FormData needs the browser to auto-set multipart/form-data with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  // If body is a plain object (not FormData), stringify it
  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  const res  = await fetch(`${window.API_URL}${endpoint}`, config);
  const data = await res.json();

  // Auto-logout on expired / invalid token
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
    return;
  }

  return data;
};

// ── Auth guard ────────────────────────────────────────────────
// Call at top of every protected page
window.requireAuth = function (redirectTo = 'index.html') {
  if (!localStorage.getItem('authToken')) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
};

// ── Get current user ──────────────────────────────────────────
window.getUser = function () {
  try { return JSON.parse(localStorage.getItem('userData') || '{}'); }
  catch { return {}; }
};

// ── Logout ────────────────────────────────────────────────────
window.logout = function () {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.href = 'index.html';
};

// ── Toast Notifications ───────────────────────────────────────
function _toast(msg, type) {
  let bar = document.getElementById('notif-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'notif-bar';
    bar.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(bar);
  }

  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const colors = {
    success: 'background:rgba(45,106,79,.9);border-color:rgba(82,183,136,.5);',
    error:   'background:rgba(120,40,40,.9);border-color:rgba(224,112,128,.5);',
    info:    'background:rgba(20,40,70,.9);border-color:rgba(82,130,200,.5);',
    warning: 'background:rgba(100,70,20,.9);border-color:rgba(244,162,97,.5);',
  };

  const n = document.createElement('div');
  n.style.cssText = `pointer-events:all;padding:13px 18px;border-radius:12px;font-size:14px;font-weight:500;color:#fff;border:1px solid;max-width:320px;display:flex;align-items:center;gap:10px;animation:notif-in .3s ease;backdrop-filter:blur(12px);${colors[type]||colors.info}`;
  n.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  bar.appendChild(n);

  setTimeout(() => {
    n.style.opacity = '0'; n.style.transform = 'translateX(30px)'; n.style.transition = 'all .3s';
    setTimeout(() => n.remove(), 350);
  }, 3500);
}

window.showSuccess = m => _toast(m,'success');
window.showError   = m => _toast(m,'error');
window.showInfo    = m => _toast(m,'info');
window.showWarning = m => _toast(m,'warning');

// Inject CSS for animation (once)
if (!document.getElementById('zen-toast-style')) {
  const s = document.createElement('style');
  s.id = 'zen-toast-style';
  s.textContent = '@keyframes notif-in{from{opacity:0;transform:translateX(30px);}to{opacity:1;transform:translateX(0);}}';
  document.head.appendChild(s);
}

// ── Update Navbar ─────────────────────────────────────────────
window.updateNavbar = function () {
  const token = localStorage.getItem('authToken');
  const user  = getUser();

  // Auth buttons area (on landing page)
  const navCta = document.getElementById('nav-cta');
  if (navCta && token) {
    const isGuest = user.email && user.email.endsWith('@guest.zensutra.com');
    const name = isGuest ? 'Guest' : (user.firstName || 'User');
    const initials = isGuest ? 'G' : (((user.firstName||'').charAt(0)+(user.lastName||'').charAt(0)).toUpperCase()||'U');
    
    navCta.innerHTML = `
      <a href="dashboard.html" style="padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);text-decoration:none;">Dashboard</a>
      <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:6px 14px;cursor:pointer;" onclick="window.location.href='dashboard.html'">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#52b788,#9b72cf);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">${initials}</div>
        <span style="font-size:13px;font-weight:500;color:#fff;">${name}</span>
      </div>`;
  }
};

// ── Format date helpers ───────────────────────────────────────
window.formatDate = function (dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
};

window.timeAgo = function (dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

// ── Run on every page load ────────────────────────────────────
document.addEventListener('DOMContentLoaded', updateNavbar);