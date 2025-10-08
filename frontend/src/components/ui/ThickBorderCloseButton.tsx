import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ThickBorderCloseButtonProps {
  onClose?: () => void;
  className?: string;
}

const ThickBorderCloseButton: React.FC<ThickBorderCloseButtonProps> = ({ onClose, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-gray-100 z-50 ${className}`}
      aria-label="Fermer"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L13 13M1 13L13 1"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};

export default ThickBorderCloseButton;