import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import './MainTabs.css';

export default function MainTabs() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getGreeting = () => {
    if (!user) return 'Hi';
    const prefix = user.prefix || '';
    const name = user.preferredName || '';
    if (prefix && name) {
      return `Hi ${prefix} ${name}`;
    } else if (name) {
      return `Hi ${name}`;
    } else if (prefix) {
      return `Hi ${prefix}`;
    }
    return 'Hi';
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed && typeof logout === 'function') {
      await logout();
      navigate('/welcome');
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="main-tabs-container">
      <header className="main-header">
        <h1 className="header-title">{getGreeting()}</h1>
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <Link 
          to="/" 
          className={`nav-item ${isActive('/') && location.pathname !== '/history' && location.pathname !== '/reports' ? 'active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link 
          to="/history" 
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">History</span>
        </Link>
        <Link 
          to="/reports" 
          className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Reports</span>
        </Link>
      </nav>
    </div>
  );
}

