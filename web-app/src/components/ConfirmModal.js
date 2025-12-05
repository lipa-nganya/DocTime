import React from 'react';
import './AlertModal.css';

export default function ConfirmModal({ 
  message, 
  onConfirm, 
  onCancel, 
  title = 'Confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'btn-modal-confirm',
  cancelButtonClass = 'btn-modal-cancel'
}) {
  if (!message) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="alert-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className={cancelButtonClass} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={confirmButtonClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

