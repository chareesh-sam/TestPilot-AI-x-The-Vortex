import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { sound } from '../soundEffects';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Sound effect trigger
    if (type === 'success') sound.success();
    else if (type === 'error') sound.bugAlert();
    else sound.click();

    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'SUCCESS') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((message, title = 'ERROR') => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((message, title = 'WARNING') => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((message, title = 'INFO') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type} animate-slide-in`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={18} className="text-green-pass" />}
              {t.type === 'error' && <AlertOctagon size={18} className="text-red-neon" />}
              {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-warning" />}
              {t.type === 'info' && <Info size={18} className="text-cyan-neon" />}
            </div>
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button 
              className="toast-close-btn" 
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
