import React from 'react';
import ThickBorderCard from './ThickBorderCard';

interface ContextPopupProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

const ContextPopup: React.FC<ContextPopupProps> = ({ isOpen, onClose, text }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <ThickBorderCard className="max-w-2xl bg-white p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg hover:bg-gray-100"
        >
          ×
        </button>
        <div className="mt-4 whitespace-pre-line">
          {text}
        </div>
      </ThickBorderCard>
    </div>
  );
};

export default ContextPopup;