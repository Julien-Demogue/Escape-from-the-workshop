import React from 'react';

interface GameContextPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const GameContextPopup: React.FC<GameContextPopupProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="bg-white p-8 rounded-lg border-4 border-black relative w-3/4 max-w-3xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600"
        >
          ×
        </button>
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="text-lg space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameContextPopup;