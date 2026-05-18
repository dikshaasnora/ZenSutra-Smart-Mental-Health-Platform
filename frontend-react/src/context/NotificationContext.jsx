import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, msg, type }]);
    
    // Auto remove
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  };

  const showSuccess = (msg) => addNotification(msg, 'success');
  const showError = (msg) => addNotification(msg, 'error');
  const showInfo = (msg) => addNotification(msg, 'info');
  const showWarning = (msg) => addNotification(msg, 'warning');

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      {/* Notification Container */}
      <div id="notif-bar" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ notification }) => {
  const { msg, type } = notification;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = {
    success: 'background:rgba(45,106,79,.9);border-color:rgba(82,183,136,.5);',
    error: 'background:rgba(120,40,40,.9);border-color:rgba(224,112,128,.5);',
    info: 'background:rgba(20,40,70,.9);border-color:rgba(82,130,200,.5);',
    warning: 'background:rgba(100,70,20,.9);border-color:rgba(244,162,97,.5);',
  };

  return (
    <div
      style={{
        pointerEvents: 'all',
        padding: '13px 18px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff',
        border: '1px solid',
        maxWidth: '320px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'notif-in .3s ease',
        backdropFilter: 'blur(12px)',
        ...(type === 'success' ? { background: 'rgba(45,106,79,.9)', borderColor: 'rgba(82,183,136,.5)' } : {}),
        ...(type === 'error' ? { background: 'rgba(120,40,40,.9)', borderColor: 'rgba(224,112,128,.5)' } : {}),
        ...(type === 'info' ? { background: 'rgba(20,40,70,.9)', borderColor: 'rgba(82,130,200,.5)' } : {}),
        ...(type === 'warning' ? { background: 'rgba(100,70,20,.9)', borderColor: 'rgba(244,162,97,.5)' } : {}),
      }}
    >
      <span>{icons[type] || 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  );
};
