import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThickBorderBurgerMenu from "../components/ui/ThickBorderBurgerMenu";
import QuestionMark from "../components/ui/QuestionMark";

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
  const [gamesState, setGamesState] = useState<GameState>(() => {
    const saved = localStorage.getItem('gamesState');
    return saved ? JSON.parse(saved) : INITIAL_GAMES_STATE;
  });

  useEffect(() => {
    if (showPopup === false) {
      localStorage.setItem('contextPopupShown', 'true');
    }
  }, [showPopup]);

  useEffect(() => {
    if (showPopup === false) {
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
      
      {/* Pop-up de contexte */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg border-4 border-black relative w-3/4 max-w-3xl">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600"
            >
              ×
            </button>
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-4">Contexte de la partie</h2>
              <p className="text-lg mb-4">
                Bienvenue dans l'atelier du Père Noël ! Les lutins ont besoin d'aide pour préparer les cadeaux à temps.
              </p>
              <p className="text-lg mb-4">
                Travaillez en équipe pour résoudre les énigmes et aider les lutins à terminer leur travail avant Noël.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
