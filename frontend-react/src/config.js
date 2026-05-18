const isLocal = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

// When deployed on Vercel (or production), use the active deployment URL dynamically
export const API_URL = isLocal ? 'http://localhost:5001' : window.location.origin;
export const ML_URL = isLocal ? 'http://localhost:5000' : API_URL;



export const ZENSUTRA_CONFIG = {
  apiUrl: API_URL,
  mlUrl: ML_URL,
  appName: 'Zensutra',
  version: '2.0.0',
};
