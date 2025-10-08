import React from 'react';

interface QuestionMarkProps {
  x: number;  // position en pourcentage de la largeur
  y: number;  // position en pourcentage de la hauteur
  onClick?: () => void;
  state?: 'completed' | 'failed' | 'unvisited';
}

const QuestionMark: React.FC<QuestionMarkProps> = ({ x, y, onClick, state = 'unvisited' }) => {
  const stateClasses = {
    completed: 'bg-lime-100 hover:bg-lime-200',
    failed: 'bg-rose-100 hover:bg-rose-200',
    unvisited: 'bg-white hover:bg-gray-100'
  };

  return (
    <button
      className={`absolute w-8 h-8 rounded-full border-2 border-black flex items-center justify-center 
        ${stateClasses[state]} transform -translate-x-1/2 -translate-y-1/2 transition-colors cursor-pointer`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
    >
      ?
    </button>
  );
};

export default QuestionMark;