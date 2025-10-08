import React from 'react';
import ThickBorderButton from './ThickBorderButton';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

const GameModal: React.FC<GameModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttons = [{ label: 'OK', onClick: onClose, variant: 'primary' }] 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="bg-white p-8 rounded-lg border-4 border-black relative w-96 max-w-3xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600"
        >
          ×
        </button>
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-lg mb-6">{message}</p>
          <div className="flex gap-4 justify-end">
            {buttons.map((button, index) => (
              <ThickBorderButton
                key={index}
                onClick={button.onClick}
                className={button.variant === 'secondary' ? 'bg-gray-100' : ''}
              >
                {button.label}
              </ThickBorderButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModal;