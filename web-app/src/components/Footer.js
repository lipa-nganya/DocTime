import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>
          Developed by{' '}
          <a 
            href="https://thewolfgang.tech/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            WOLFGANG
          </a>
        </p>
      </div>
    </footer>
  );
}

