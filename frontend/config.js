// ============================================================
//  ZENSUTRA — Frontend Configuration
//  File: Frontend/js/config.js
//  ────────────────────────────────────────────────────────────
//  Loaded FIRST on every page.
//  Sets window.API_URL based on hostname (local vs production).
//  All fetch() calls reference window.API_URL so you only
//  change the URL in one place for deployment.
// ============================================================

(function () {
  const isLocal = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.protocol === 'file:';

  window.API_URL   = isLocal ? 'http://localhost:5001' : 'https://your-zensutra-api.onrender.com';
  window.ML_URL    = isLocal ? 'http://localhost:5000'  : window.API_URL;

  window.ZENSUTRA_CONFIG = {
    apiUrl: window.API_URL,
    mlUrl:  window.ML_URL,
    appName:'Zensutra',
    version:'2.0.0',
  };

  console.log(`[Zensutra] API → ${window.API_URL}`);
})();