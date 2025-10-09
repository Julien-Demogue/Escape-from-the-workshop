import React, { useState } from 'react';
import ThickBorderButton from './ThickBorderButton';
import ThickBorderCard from './ThickBorderCard';

interface ThickBorderBurgerMenuProps {
  items: Array<{
    label: string;
    onClick: () => void;
  }>;
}

interface ThickBorderBurgerMenuProps {
  items: Array<{
    label: string;
    onClick: () => void;
  }>;
  gameCode: string;
}

const ThickBorderBurgerMenu: React.FC<ThickBorderBurgerMenuProps> = ({ items, gameCode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-0 top-0 h-full z-50">
      {/* Bouton burger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-8 top-8 w-10 h-10 flex flex-col justify-center items-center gap-1.5 border-2 border-black rounded-lg hover:bg-gray-100 bg-white"
      >
        <div className={`w-6 h-0.5 bg-black transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <div className={`w-6 h-0.5 bg-black transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
        <div className={`w-6 h-0.5 bg-black transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Menu déroulant */}
      <div
        className={`fixed right-0 top-0 h-full w-64 bg-white border-l-2 border-black p-4 shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="mt-24 flex flex-col gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed right-8 top-8 w-10 h-10 flex flex-col justify-center items-center gap-1.5 border-2 border-black rounded-lg hover:bg-gray-100 bg-white"
          >
            X
          </button>
          <ThickBorderCard className="w-full text-center">
            {gameCode}
          </ThickBorderCard>

          {items.map((item, index) => (
            <ThickBorderButton
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="w-full justify-center"
            >
              {item.label}
            </ThickBorderButton>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThickBorderBurgerMenu;