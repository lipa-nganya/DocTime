import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InfoScreen.css';

export default function InfoScreen() {
  const navigate = useNavigate();

  return (
    <div className="info-screen">
      <div className="info-menu">
        <button 
          className="info-menu-item"
          onClick={() => navigate('/info/terms')}
        >
          <span className="info-menu-icon">📄</span>
          <span className="info-menu-text">Terms of Use</span>
          <span className="info-menu-arrow">›</span>
        </button>
        
        <button 
          className="info-menu-item"
          onClick={() => navigate('/info/privacy')}
        >
          <span className="info-menu-icon">🔒</span>
          <span className="info-menu-text">Privacy Policy</span>
          <span className="info-menu-arrow">›</span>
        </button>
        
        <button 
          className="info-menu-item"
          onClick={() => navigate('/info/contact')}
        >
          <span className="info-menu-icon">📞</span>
          <span className="info-menu-text">Contact Us</span>
          <span className="info-menu-arrow">›</span>
        </button>
      </div>
    </div>
  );
}

