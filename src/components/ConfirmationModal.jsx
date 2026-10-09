import React from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { sound } from '../soundEffects';

export default function ConfirmationModal({
  isOpen,
  title = "CONFIRM DESTRUCTIVE ACTION",
  message,
  confirmLabel = "PROCEED",
  cancelLabel = "CANCEL",
  onConfirm,
  onCancel,
  severity = "danger" // 'danger' | 'warning'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div 
        className="modal-container confirmation-modal neon-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="flex-center gap-2">
            <AlertOctagon size={18} className={severity === 'danger' ? 'text-red-neon' : 'text-amber-warning'} />
            <span className="section-title text-red-neon">{title}</span>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={() => {
              sound.click();
              onCancel();
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirmation-modal-body">
          <p className="confirmation-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => {
              sound.click();
              onCancel();
            }}
          >
            {cancelLabel}
          </button>
          <button 
            type="button"
            className={severity === 'danger' ? 'btn-neon-red' : 'btn-neon-cyan'}
            onClick={() => {
              sound.warp();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
