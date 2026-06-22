import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon" size={20} style={{ color: 'var(--color-success)' }} />;
      case 'error':
        return <AlertCircle className="toast-icon" size={20} style={{ color: 'var(--color-danger)' }} />;
      case 'warning':
        return <AlertTriangle className="toast-icon" size={20} style={{ color: 'var(--color-warning)' }} />;
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      {getIcon()}
      <div className="toast-message" style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
        {message}
      </div>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
