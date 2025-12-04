import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ScreenWithHeader.css';

export default function ScreenWithHeader({ children, title }) {
  const navigate = useNavigate();

  return (
    <div className="screen-with-header">
      <header className="screen-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        {title && <h1 className="screen-title">{title}</h1>}
      </header>
      <main className="screen-content">
        {children}
      </main>
    </div>
  );
}

