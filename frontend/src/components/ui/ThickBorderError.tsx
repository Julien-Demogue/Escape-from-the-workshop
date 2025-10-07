import React from 'react';

interface ThickBorderErrorProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

const ThickBorderError: React.FC<ThickBorderErrorProps> = ({
  message,
  onClose,
  className = '',
}) => {
  return (
    <div 
      className={`relative p-4 border-4 border-red-500 rounded-lg bg-white ${className}`}
    >
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-3 text-2xl font-bold text-red-500 hover:text-red-700"
        >
          ×
        </button>
      )}
      <p className={`text-red-500 pr-6 ${onClose ? 'mr-4' : ''}`}>
        {message}
      </p>
    </div>
  );
};

export default ThickBorderError;