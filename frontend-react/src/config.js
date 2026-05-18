const isLocal = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

// When deployed on Vercel (or production), use the Vercel URL
export const API_URL = isLocal ? 'http://localhost:5001' : 'https://zensutra.vercel.app';
export const ML_URL = isLocal ? 'http://localhost:5000' : API_URL;

// ── OAuth Client IDs ──────────────────────────────────────────
// Replace these placeholders with your real credentials:
//   Google  → https://console.cloud.google.com/apis/credentials
//   Microsoft → https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
export const GOOGLE_CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    || 'your_google_client_id.apps.googleusercontent.com';
export const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your_microsoft_client_id_here';

export const ZENSUTRA_CONFIG = {
  apiUrl: API_URL,
  mlUrl: ML_URL,
  appName: 'Zensutra',
  version: '2.0.0',
};
