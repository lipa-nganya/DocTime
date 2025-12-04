import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

// Logo is in public folder, use public path
const logo = '/logo.png';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-logo-container">
        <img src={logo} alt="Doc Time Logo" className="welcome-logo" />
        <div className="welcome-button-container">
          <button
            className="welcome-button welcome-button-primary"
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
          <button
            className="welcome-button welcome-button-outlined"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

