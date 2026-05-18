import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Auth popup states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register' | 'forgot'

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setShowAuthModal(false); // Close any open global popup modals on login
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const authFetch = async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, config);
      
      if (res.status === 401) {
        if (token !== 'guest') {
          logout();
        }
        openAuthModal('login');
        return null;
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('API Fetch error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, logout, authFetch,
      showAuthModal, authModalTab, openAuthModal, closeAuthModal 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
