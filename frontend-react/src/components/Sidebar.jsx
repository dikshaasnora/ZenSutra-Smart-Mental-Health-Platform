import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activePage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? ((user.firstName || '').charAt(0) + (user.lastName || '').charAt(0)).toUpperCase() || 'U'
    : 'U';
  const fullName = user ? `${user.firstName || 'User'} ${user.lastName || ''}` : 'User';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🧠</div>
        <div>
          <div className="logo-name">Zensutra</div>
          <div className="logo-tagline">Smart Mental Health</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Overview</div>
        <NavLink to="/dashboard" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-home"></i><span>Dashboard</span></NavLink>
        <NavLink to="/mood" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-heart-pulse"></i><span>Mood Tracker</span></NavLink>

        <div className="nav-group-label">Wellness Tools</div>
        <NavLink to="/ai-support" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-robot"></i><span>Zen AI</span><span className="nav-badge">✨</span></NavLink>
        <NavLink to="/breathe" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-wind"></i><span>Breathe</span></NavLink>
        <NavLink to="/journal" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-book-open"></i><span>Journal</span></NavLink>

        <div className="nav-group-label">Care</div>
        <NavLink to="/resources" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-layer-group"></i><span>Resources</span></NavLink>
        <NavLink to="/appointment" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-calendar-check"></i><span>Appointments</span></NavLink>
        <NavLink to="/mental-home" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-clipboard-list"></i><span>Assessment</span></NavLink>
        <NavLink to="/mental-report" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-chart-line"></i><span>My Report</span></NavLink>

        <div className="nav-group-label">Account</div>
        <NavLink to="/profile" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-user"></i><span>Profile</span></NavLink>
        <NavLink to="/settings" className={navLinkClass}><div className="nav-dot"></div><i className="fas fa-sliders"></i><span>Settings</span></NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-av">{initials}</div>
          <div>
            <div className="user-name">{fullName}</div>
            <div className="user-role">Premium Member</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
