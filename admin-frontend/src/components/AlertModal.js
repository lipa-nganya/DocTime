import React from 'react';
import './AlertModal.css';

export default function AlertModal({ message, onClose, title = 'Notification' }) {
  if (!message) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="alert-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

