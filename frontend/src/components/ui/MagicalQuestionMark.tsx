import React, { useState } from 'react';

interface MagicalQuestionMarkProps {
  x: number;  // position en pourcentage de la largeur
  y: number;  // position en pourcentage de la hauteur
  onClick?: () => void;
  state?: 'completed' | 'failed' | 'unvisited' | 'in_progress';
  title?: string; // pour identifier le château/lieu
}

const MagicalQuestionMark: React.FC<MagicalQuestionMarkProps> = ({ 
  x, y, onClick, state = 'unvisited', title 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const stateStyles = {
    completed: {
      bg: 'bg-gradient-to-r from-emerald-300 to-emerald-500',
      border: 'border-emerald-600',
      glow: 'shadow-emerald-400/50',
      icon: '✓'
    },
    failed: {
      bg: 'bg-gradient-to-r from-red-300 to-red-500', 
      border: 'border-red-600',
      glow: 'shadow-red-400/50',
      icon: '✗'
    },
    in_progress: {
      bg: 'bg-gradient-to-r from-orange-300 to-orange-500',
      border: 'border-orange-600',
      glow: 'shadow-orange-400/50',
      icon: '⌛'
    },
    unvisited: {
      bg: 'bg-gradient-to-r from-amber-200 to-amber-400',
      border: 'border-amber-600', 
      glow: 'shadow-amber-400/50',
      icon: '?'
    }
  };

  const currentStyle = stateStyles[state];

  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-1/2" 
         style={{ left: `${x}%`, top: `${y}%` }}>
      
      {/* Particules magiques qui flottent */}
      {isHovered && (
        <>
          <div className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping" 
               style={{ top: '-10px', left: '-5px', animationDelay: '0s' }} />
          <div className="absolute w-1 h-1 bg-purple-300 rounded-full animate-ping" 
               style={{ top: '-8px', right: '-3px', animationDelay: '0.5s' }} />
          <div className="absolute w-1 h-1 bg-blue-300 rounded-full animate-ping" 
               style={{ bottom: '-10px', left: '2px', animationDelay: '1s' }} />
        </>
      )}
      
      {/* Lueur de fond */}
      <div className={`absolute inset-0 rounded-full ${currentStyle.glow} shadow-lg opacity-30 animate-pulse`} />
      
      {/* Bouton principal */}
      <button
        className={`relative w-10 h-10 rounded-full border-3 ${currentStyle.bg} ${currentStyle.border} 
                   flex items-center justify-center font-bold text-white 
                   transform transition-all duration-300 hover:scale-110 active:scale-95
                   ${currentStyle.glow} shadow-lg hover:shadow-xl`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`magical-question-mark-${title?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
      >
        <span className="text-lg drop-shadow-sm">{currentStyle.icon}</span>
        
        {/* Effet de scintillement */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform rotate-45 animate-pulse" />
      </button>
      
      {/* Tooltip au survol */}
      {isHovered && title && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-stone-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap font-serif">
          {title}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-stone-800 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default MagicalQuestionMark;