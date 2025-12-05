import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import ConfirmModal from './ConfirmModal';
import './MainTabs.css';

export default function MainTabs() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    if (typeof logout === 'function') {
      await logout();
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Exclude profile from other active states
  const isActiveExcluding = (path, excludePaths = []) => {
    if (excludePaths.some(exclude => location.pathname.startsWith(exclude))) return false;
    return isActive(path);
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

      <Footer />

      <nav className="bottom-nav">
        <Link 
          to="/" 
          className={`nav-item ${isActiveExcluding('/', ['/history', '/reports', '/profile', '/info']) ? 'active' : ''}`}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="nav-label">Home</span>
        </Link>
        <Link 
          to="/history" 
          className={`nav-item ${isActive('/history') ? 'active' : ''}`}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="nav-label">History</span>
        </Link>
        <Link 
          to="/reports" 
          className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 10V3H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="nav-label">Reports</span>
        </Link>
        <Link 
          to="/profile" 
          className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="nav-label">Profile</span>
        </Link>
        <Link 
          to="/info" 
          className={`nav-item ${isActive('/info') ? 'active' : ''}`}
        >
          <span className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="nav-label">Info</span>
        </Link>
      </nav>

      {showLogoutConfirm && (
        <ConfirmModal
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          title="Confirm Logout"
          confirmText="Logout"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}

