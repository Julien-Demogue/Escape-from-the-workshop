import React from 'react';

export interface PopupProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ThickBorderPopup: React.FC<PopupProps> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        border: '3px solid black',
        borderRadius: '18px',
        minWidth: 400,
        minHeight: 250,
        padding: '32px 24px 24px 24px',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            fontSize: 28,
            fontWeight: 'bold',
            cursor: 'pointer',
            lineHeight: 1,
          }}
          aria-label="Fermer"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default ThickBorderPopup;
