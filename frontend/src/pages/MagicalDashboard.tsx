import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThickBorderBurgerMenu from "../components/ui/ThickBorderBurgerMenu";
import ContextPopup from "../components/ui/ContextPopup";
import MagicalQuestionMark from "../components/ui/MagicalQuestionMark";
import { SOLO_CONTEXT } from "../constants/contextText";
import GameStateService, { type GameStates } from "../services/gameState.service";
import { readGameResults, reportGameResult } from "../state/gameResults";
import carteLoire from "../assets/Carte_Loire.png";

const INITIAL_GAMES_STATE: GameStates = {
  'heraldry-quiz': 'unvisited',
  'puzzle': 'unvisited',
  'memory-loire': 'unvisited',
  'courrier-loire': 'unvisited',
  'brissac-enigma': 'unvisited',
  'chambord-enigma': 'unvisited'
};

// Positions des châteaux sur la carte de la Loire (ajustées pour la nouvelle carte)
const CASTLE_POSITIONS = {
  'chambord-enigma': { x: 58, y: 42, title: 'Château de Chambord' },
  'brissac-enigma': { x: 22, y: 68, title: 'Château de Brissac' },
  'heraldry-quiz': { x: 48, y: 38, title: 'Blois - Héraldique' },
  'puzzle': { x: 68, y: 48, title: 'Énigme d\'Amboise' },
  'memory-loire': { x: 52, y: 32, title: 'Mémoire de Cheverny' },
  'courrier-loire': { x: 32, y: 72, title: 'Courrier de Saumur' }
};

const MagicalDashboard: React.FC = () => {
  const gameCode = "ABCXYZ";
  const [showPopup, setShowPopup] = useState(() => {
    const shown = localStorage.getItem('contextPopupShown');
    return shown !== 'true';
  });
  const [contextText] = useState(SOLO_CONTEXT);
  const [gamesState, setGamesState] = useState<GameStates>(() => {
    // Load initial states from both storage systems
    const gameResults = readGameResults();
    const storedStates = GameStateService.getStates();
    const initialState = { ...INITIAL_GAMES_STATE };

    // Merge states, preferring GameStateService values
    Object.entries(gameResults).forEach(([gameId, result]) => {
      if (storedStates[gameId]) {
        initialState[gameId] = storedStates[gameId];
      } else if (result?.status && result.status !== 'unvisited') {
        initialState[gameId] = result.status;
        GameStateService.setState(gameId, result.status);
      }
    });

    return initialState;
  });

  useEffect(() => {
    if (!showPopup) {
      localStorage.setItem('contextPopupShown', 'true');
    }
  }, [showPopup]);

  useEffect(() => {
    // Souscription aux changements d'état des jeux
    const unsubscribe = GameStateService.subscribe((newStates) => {
      setGamesState(newStates);
    });

    return () => unsubscribe();
  }, []);

  const navigate = useNavigate();

  const handleGameClick = (game: keyof typeof INITIAL_GAMES_STATE) => {
    // Set game to in_progress if it's unvisited and update game results
    if (gamesState[game] === 'unvisited') {
      GameStateService.setState(String(game), 'in_progress');
      // Update game results to keep systems in sync
      reportGameResult(game as 'heraldry-quiz' | 'puzzle' | 'memory-loire' | 'courrier-loire' | 'brissac-enigma' | 'chambord-enigma',
        { status: 'in_progress' }
      );
    }
    navigate(`/${game}`);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fond de carte ancienne avec overlay magique */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${carteLoire})`,
          backgroundColor: '#f4e4bc' // Couleur de fond de secours en attendant le chargement de l'image
        }}
      />

      {/* Overlay léger pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/10 via-transparent to-stone-100/10" />

      {/* Menu latéral */}
      <ThickBorderBurgerMenu
        gameCode={gameCode}
        items={[
          { label: 'Contexte', onClick: () => setShowPopup(true) },
          { label: "Messages", onClick: () => navigate('/messages') }
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
        <div className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-lg shadow-xl border-2 border-stone-600"
          style={{
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}>
          <h1 className="text-2xl font-bold text-stone-800 font-serif text-center">
            Carte Mystérieuse de la Loire
          </h1>
          <p className="text-stone-600 text-center font-serif mt-1">
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

        {/* Points d'intérêt supplémentaires sur la carte */}
        <MagicalQuestionMark x={42} y={52} state="unvisited" title="Tours" />
        <MagicalQuestionMark x={72} y={28} state="unvisited" title="Orléans" />
        <MagicalQuestionMark x={28} y={42} state="unvisited" title="Angers" />
      </div>

      {/* Légende de la carte */}
      <div className="absolute bottom-6 right-6 bg-gradient-to-br from-stone-100 to-stone-200 p-4 rounded-lg shadow-lg border-2 border-stone-600 max-w-xs">
        <h3 className="font-bold text-stone-800 font-serif mb-2">Légende</h3>
        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-amber-200 to-amber-400 rounded-full border border-amber-600"></div>
            <span>À découvrir</span>
            <span className="text-amber-600 ml-1">?</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full border border-emerald-600"></div>
            <span>Complété</span>
            <span className="text-emerald-600 ml-1">✓</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-300 to-red-500 rounded-full border border-red-600"></div>
            <span>Échoué</span>
            <span className="text-red-600 ml-1">✗</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full border border-orange-600"></div>
            <span>En cours</span>
            <span className="text-orange-600 ml-1">⌛</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicalDashboard;