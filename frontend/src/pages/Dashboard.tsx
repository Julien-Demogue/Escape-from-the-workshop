import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThickBorderBurgerMenu from "../components/ui/ThickBorderBurgerMenu";
import QuestionMark from "../components/ui/QuestionMark";
import ContextPopup from "../components/ui/ContextPopup";
import Timer from "../components/ui/Timer";
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

const Dashboard: React.FC = () => {
  const gameCode = "ABCXYZ"; // À remplacer par le vrai code plus tard
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

  // Sauvegarde locale des progrès
  useEffect(() => {
    localStorage.setItem('gamesState', JSON.stringify(gamesState));
  }, [gamesState]);

  const navigate = useNavigate();

  const handleGameClick = (game: keyof typeof INITIAL_GAMES_STATE) => {
    const currentLocation = window.location.pathname.slice(1);
    if (currentLocation === game) {
      setGamesState(prev => ({
        ...prev,
        [game]: Math.random() > 0.5 ? 'completed' : 'failed' // À remplacer par la vraie logique de validation
      }));
    }
    navigate(`/${game}`);
  };

  return (
    <div className="relative w-full h-screen bg-white">
      <Timer />
      {/* Menu latéral avec code de partie intégré */}
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

      {/* Contenu principal */}
      <div className="w-full h-full p-8">

      {/* Contenu principal */}
      <div className="relative w-full h-full">
        {/* Points d'interrogation éparpillés avec liens vers les jeux */}
        <QuestionMark x={15} y={25} 
          state={gamesState['heraldry-quiz']} 
          onClick={() => handleGameClick('heraldry-quiz')} />
        <QuestionMark x={35} y={40} 
          state={gamesState['puzzle']} 
          onClick={() => handleGameClick('puzzle')} />
        <QuestionMark x={55} y={15} 
          state={gamesState['memory-loire']} 
          onClick={() => handleGameClick('memory-loire')} />
        <QuestionMark x={75} y={35} 
          state={gamesState['courrier-loire']} 
          onClick={() => handleGameClick('courrier-loire')} />
        <QuestionMark x={25} y={65} 
          state={gamesState['brissac-enigma']} 
          onClick={() => handleGameClick('brissac-enigma')} />
        <QuestionMark x={45} y={75} 
          state={gamesState['chambord-enigma']} 
          onClick={() => handleGameClick('chambord-enigma')} />
        <QuestionMark x={65} y={55} />
        <QuestionMark x={85} y={45} />
        <QuestionMark x={20} y={85} />
        <QuestionMark x={40} y={20} />
      </div>

      </div>
      
    </div>
  );
};

export default Dashboard;
