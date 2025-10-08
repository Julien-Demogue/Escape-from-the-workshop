import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThickBorderBurgerMenu from "../components/ui/ThickBorderBurgerMenu";
import ContextPopup from "../components/ui/ContextPopup";
import MagicalQuestionMark from "../components/ui/MagicalQuestionMark";
import { SOLO_CONTEXT } from "../constants/contextText";

interface GameState {
  [key: string]: 'completed' | 'failed' | 'unvisited';
}

const INITIAL_GAMES_STATE: GameState = {
  'heraldry-quiz': 'unvisited',
  'puzzle': 'unvisited', 
  'memory-loire': 'unvisited',
  'courrier-loire': 'unvisited',
  'brissac-enigma': 'unvisited',
  'chambord-enigma': 'unvisited'
};

// Positions des châteaux sur la carte de la Loire (approximatives)
const CASTLE_POSITIONS = {
  'chambord-enigma': { x: 65, y: 45, title: 'Château de Chambord' },
  'brissac-enigma': { x: 25, y: 65, title: 'Château de Brissac' },
  'heraldry-quiz': { x: 45, y: 35, title: 'Blois - Héraldique' },
  'puzzle': { x: 75, y: 55, title: 'Énigme d\'Amboise' },
  'memory-loire': { x: 55, y: 25, title: 'Mémoire de Cheverny' },
  'courrier-loire': { x: 35, y: 75, title: 'Courrier de Saumur' }
};

const MagicalDashboard: React.FC = () => {
  const gameCode = "ABCXYZ"; 
  const [showPopup, setShowPopup] = useState(() => {
    const shown = localStorage.getItem('contextPopupShown');
    return shown !== 'true';
  });
  const [contextText] = useState(SOLO_CONTEXT);
  const [gamesState, setGamesState] = useState<GameState>(() => {
    const saved = localStorage.getItem('gamesState');
    return saved ? JSON.parse(saved) : INITIAL_GAMES_STATE;
  });

  useEffect(() => {
    if (!showPopup) {
      localStorage.setItem('contextPopupShown', 'true');
    }
  }, [showPopup]);

  useEffect(() => {
    localStorage.setItem('gamesState', JSON.stringify(gamesState));
  }, [gamesState]);

  const navigate = useNavigate();

  const handleGameClick = (game: keyof typeof INITIAL_GAMES_STATE) => {
    const currentLocation = window.location.pathname.slice(1);
    if (currentLocation === game) {
      setGamesState(prev => ({
        ...prev,
        [game]: Math.random() > 0.5 ? 'completed' : 'failed'
      }));
    }
    navigate(`/${game}`);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fond de carte ancienne avec overlay magique */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1544830826-4ccc3bf5ceb1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxsb2lyZSUyMHZhbGxleSUyMG1lZGlldmFsJTIwbWFwfGVufDB8fHx8MTc1OTkzMTAyNnww&ixlib=rb-4.1.0&q=85)',
        }}
      />
      
      {/* Overlay pour ajuster l'opacité et ajouter une texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-stone-900/30" />
      
      {/* Particules magiques flottantes */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      {/* Rivière Loire stylisée */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 10 60 Q 30 50 50 55 T 90 45"
            stroke="#3b82f6"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Menu latéral */}
      <ThickBorderBurgerMenu
        gameCode={gameCode}
        items={[
          { label: 'Modifier les groupes', onClick: () => navigate('/groupadmin') },
          { label: 'Contexte', onClick: () => setShowPopup(true) },
          { label: 'Déconnexion', onClick: () => {
            localStorage.removeItem('token');
            navigate('/');
          }},
        ]}
      />
      
      {/* Pop-up de contexte */}
      <ContextPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        text={contextText}
      />

      {/* Titre de la carte */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-amber-100 to-amber-200 px-8 py-4 rounded-lg shadow-xl border-2 border-amber-600"
             style={{
               clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
             }}>
          <h1 className="text-2xl font-bold text-amber-900 font-serif text-center">
            Carte Mystérieuse de la Loire
          </h1>
          <p className="text-amber-700 text-center font-serif mt-1">
            Découvrez les secrets des châteaux...
          </p>
        </div>
      </div>

      {/* Contenu principal - Châteaux et lieux */}
      <div className="relative w-full h-full">
        {Object.entries(CASTLE_POSITIONS).map(([gameKey, position]) => (
          <MagicalQuestionMark
            key={gameKey}
            x={position.x}
            y={position.y}
            state={gamesState[gameKey]}
            title={position.title}
            onClick={() => handleGameClick(gameKey as keyof typeof INITIAL_GAMES_STATE)}
          />
        ))}
        
        {/* Châteaux décoratifs supplémentaires (non cliquables) */}
        <MagicalQuestionMark x={15} y={35} title="Lieu mystérieux" />
        <MagicalQuestionMark x={85} y={25} title="Tour enchantée" />
        <MagicalQuestionMark x={20} y={85} title="Grotte des farfadets" />
        <MagicalQuestionMark x={80} y={75} title="Forêt magique" />
      </div>
      
      {/* Légende de la carte */}
      <div className="absolute bottom-6 right-6 bg-gradient-to-br from-stone-100 to-stone-200 p-4 rounded-lg shadow-lg border-2 border-stone-600 max-w-xs">
        <h3 className="font-bold text-stone-800 font-serif mb-2">Légende</h3>
        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-amber-200 to-amber-400 rounded-full border border-amber-600"></div>
            <span>À découvrir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full border border-emerald-600"></div>
            <span>Complété</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-300 to-red-500 rounded-full border border-red-600"></div>
            <span>Échoué</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicalDashboard;