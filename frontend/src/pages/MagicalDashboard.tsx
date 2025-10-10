import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ContextPopup from "../components/ui/ContextPopup";
import MagicalQuestionMark from "../components/ui/MagicalQuestionMark";
import { SOLO_CONTEXT } from "../constants/contextText";
import GameStateService, { type GameStates } from "../services/gameState.service";
import { readGameResults, reportGameResult } from "../state/gameResults";
import carteLoire from "../assets/Carte_Loire.png";
import partyService from "../services/partyService";

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
  'chambord-enigma': { x: 70, y: 35, title: 'Château de Chambord' },
  'brissac-enigma': { x: 18, y: 65, title: 'Château de Brissac' },
  'heraldry-quiz': { x: 45, y: 72, title: 'Château de Chaumont' },
  'puzzle': { x: 80, y: 55, title: 'Château de Villandry' },
  'memory-loire': { x: 55, y: 30, title: 'Château de Rivau' },
  'courrier-loire': { x: 30, y: 78, title: 'Le courier de la loire' }
};

// --- AJOUT : petites fiches culturelles pour points non liés à une énigme
const EXTRA_CASTLE_INFOS: Record<string, { title: string; text: string }> = {
  azay: {
    title: "Château d'Azay‑le‑Rideau",
    text: "Petit bijou de la Renaissance posé sur une île, connu pour son élégance et ses jardins."
  },
  chenonceau: {
    title: "Château de Chenonceau",
    text: "Le \"château des dames\", enjambant le Cher, célèbre pour ses galeries et son histoire féminine."
  },
  amboise: {
    title: "Château d'Amboise",
    text: "Forteresse royale offrant une vue sur la Loire ; lieu de sépulture de Léonard de Vinci à proximité."
  },
  blois: {
    title: "Château de Blois",
    text: "Palais aux architectures multiples, témoin des évolutions stylistiques de plusieurs siècles."
  },
  saumur: {
    title: "Château de Saumur",
    text: "Imposante silhouette médiévale dominant la Loire, avec une histoire chevaleresque et viticole."
  },
  valencay: {
    title: "Château de Valençay",
    text: "Résidence princière du XVIIIe siècle, remarquable pour son architecture néoclassique et ses parcs."
  },
  sully: {
    title: "Château de Sully‑sur‑Loire",
    text: "Citadelle médiévale protégée par la Loire, ancienne résidence et place forte stratégique."
  },
  langeais: {
    title: "Château de Langeais",
    text: "Connu pour son pont-levis et sa reconstitution médiévale, évoquant la vie seigneuriale."
  },
  chinon: {
    title: "Château de Chinon",
    text: "Forteresse royale où Jeanne d'Arc rencontra Charles VII ; riche en vestiges médiévaux."
  },
  gizeux: {
    title: "Château de Gizeux",
    text: "Manière plus intime de château-ducal, avec intérieurs et jardins témoignant d'une France rurale."
  }
};

const MagicalDashboard: React.FC = () => {
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  // Use mm:ss format default
  const [timeLeft, setTimeLeft] = useState<string>("00:00");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Load party info (code + endTime) from localStorage.partyId -> partyService
  useEffect(() => {
    const loadParty = async () => {
      try {
        const stored = localStorage.getItem("partyId");
        if (!stored) return;
        const pid = parseInt(stored, 10);
        if (isNaN(pid)) return;
        const p = await partyService.getById(pid);
        if (p) {
          setPartyCode(p.code ?? null);
          if (p.endTime != null) {
            // p.endTime can be: number (seconds or ms) OR ISO string.
            let ts: number | null = null;

            // If it's already a number-like value
            if (typeof p.endTime === "number") {
              ts = p.endTime;
            } else {
              // try to coerce string to number first (e.g. "163..."), else parse as ISO date
              const asNumber = Number(p.endTime);
              if (!Number.isNaN(asNumber)) {
                ts = asNumber;
              } else {
                const parsed = Date.parse(String(p.endTime));
                if (!Number.isNaN(parsed)) ts = parsed;
              }
            }

            if (ts == null || Number.isNaN(ts)) {
              console.warn("party endTime could not be parsed:", p.endTime);
            } else {
              // If timestamp looks like seconds (reasonable cutoff), convert to ms
              if (ts < 1e12) ts = ts * 1000;
              setEndTimestamp(ts);
            }
          }
        }
      } catch (err) {
        console.warn("Impossible de charger la party :", err);
      }
    };
    loadParty();
  }, []);

  // Timer: update timeLeft every second based on endTimestamp
  useEffect(() => {
    const formatRemainingMMSS = (millis: number) => {
      if (!Number.isFinite(millis) || millis <= 0) return "00:00";
      const totalSec = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    if (!endTimestamp || !Number.isFinite(endTimestamp)) {
      setTimeLeft("00:00");
      return;
    }

    // clear previous interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const tick = () => {
      const diff = (endTimestamp as number) - Date.now();
      const display = formatRemainingMMSS(diff);
      setTimeLeft(display);
      if (diff <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [endTimestamp]);

  // Sync périodique entre readGameResults() et GameStateService
  useEffect(() => {
    const doSync = () => {
      try {
        const results = readGameResults();
        Object.entries(results).forEach(([gameId, r]) => {
          if (!r || !r.status) return;
          const current = GameStateService.getStates()[gameId as keyof GameStates];
          if (current !== r.status) {
            GameStateService.setState(gameId, r.status);
          }
        });
      } catch (err) {
        console.warn("Sync game results failed:", err);
      }
    };

    // initial sync + periodic
    doSync();
    syncRef.current = setInterval(doSync, 5000);

    return () => {
      if (syncRef.current) {
        clearInterval(syncRef.current);
        syncRef.current = null;
      }
    };
  }, []);

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

  // --- AJOUT : état pour marquer les points non-énigmes comme complétés (persisté)
  const [extraCompleted, setExtraCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("extraCompleted");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [infoPopup, setInfoPopup] = useState<{ open: boolean; id?: string; title?: string; text?: string }>({ open: false });

  // Persist extraCompleted sur changement
  useEffect(() => {
    try {
      localStorage.setItem("extraCompleted", JSON.stringify(extraCompleted));
    } catch {
      // ignore
    }
  }, [extraCompleted]);

  // Handler pour châteaux liés à des mini-fiches (non-énigmes)
  const handleExtraClick = (id: string) => {
    const info = EXTRA_CASTLE_INFOS[id];
    if (!info) return;
    // marquer comme complété (UI + persistance)
    setExtraCompleted(prev => ({ ...prev, [id]: true }));
    // ouvrir la petite popup
    setInfoPopup({ open: true, id, title: info.title, text: info.text });
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

      {/* Nouveau header : code partie à gauche, boutons Contexte/Chat à droite */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
        <div className="px-3 py-1 border-2 border-black rounded-lg font-bold bg-white">
          {partyCode}
        </div>
        <div className="px-2 py-1 rounded-md bg-white/90 border text-sm font-medium flex items-center gap-2">
          <span className="text-xs text-stone-600">Temps restant</span>
          <span className="font-mono">{timeLeft}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <button
          onClick={() => setShowPopup(true)}
          className="px-3 py-1 bg-white/90 rounded-md shadow-sm border"
        >
          Contexte
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="px-3 py-1 bg-white/90 rounded-md shadow-sm border"
        >
          Chat
        </button>
      </div>

      {/* Pop-up de contexte */}
      <ContextPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        text={contextText}
      />

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div
          className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-lg shadow-xl border-2 border-stone-600"
          style={{
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        >
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
        {/* NOTE : onClick ouvre une mini-popup et marque le point comme complété */}
        <MagicalQuestionMark key="azay" x={16} y={42} state={extraCompleted['azay'] ? 'completed' : 'unvisited'} title="Château d'Azay‑le‑Rideau" onClick={() => handleExtraClick('azay')} />
        <MagicalQuestionMark key="chenonceau" x={40} y={46} state={extraCompleted['chenonceau'] ? 'completed' : 'unvisited'} title="Château de Chenonceau" onClick={() => handleExtraClick('chenonceau')} />
        <MagicalQuestionMark key="amboise" x={60} y={34} state={extraCompleted['amboise'] ? 'completed' : 'unvisited'} title="Château d'Amboise" onClick={() => handleExtraClick('amboise')} />
        <MagicalQuestionMark key="blois" x={44} y={28} state={extraCompleted['blois'] ? 'completed' : 'unvisited'} title="Château de Blois" onClick={() => handleExtraClick('blois')} />
        <MagicalQuestionMark key="saumur" x={24} y={74} state={extraCompleted['saumur'] ? 'completed' : 'unvisited'} title="Château de Saumur" onClick={() => handleExtraClick('saumur')} />
        <MagicalQuestionMark key="valencay" x={72} y={52} state={extraCompleted['valencay'] ? 'completed' : 'unvisited'} title="Château de Valençay" onClick={() => handleExtraClick('valencay')} />
        <MagicalQuestionMark key="sully" x={82} y={28} state={extraCompleted['sully'] ? 'completed' : 'unvisited'} title="Château de Sully‑sur‑Loire" onClick={() => handleExtraClick('sully')} />
        <MagicalQuestionMark key="langeais" x={36} y={50} state={extraCompleted['langeais'] ? 'completed' : 'unvisited'} title="Château de Langeais" onClick={() => handleExtraClick('langeais')} />
        <MagicalQuestionMark key="chinon" x={34} y={62} state={extraCompleted['chinon'] ? 'completed' : 'unvisited'} title="Château de Chinon" onClick={() => handleExtraClick('chinon')} />
        <MagicalQuestionMark key="gizeux" x={62} y={66} state={extraCompleted['gizeux'] ? 'completed' : 'unvisited'} title="Château de Gizeux" onClick={() => handleExtraClick('gizeux')} />
      </div>

      {/* --- AJOUT : popup d'information pour points non-énigmes */}
      {infoPopup.open && (
        // full-screen backdrop: click outside content closes the popup
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          onClick={() => setInfoPopup({ open: false })}
        >
          <div
            className="absolute inset-0 bg-black/30"
          // background layer receives the click (handled by parent onClick)
          />
          <div
            className="relative bg-white/95 p-4 rounded-lg shadow-lg border max-w-md mx-4"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <div className="flex justify-between items-start">
              <div>
                {/* Nouveau : indication claire qu'il n'y a pas d'indice, puis titre et texte du lieu */}
                <h5 className="text-xs text-amber-700 font-semibold mb-2 uppercase">Aucun indice en ces lieux</h5>
                <h4 className="font-bold text-lg">{infoPopup.title}</h4>
                <p className="text-sm text-stone-700 mt-2">{infoPopup.text}</p>
              </div>
              <button
                aria-label="Fermer"
                onClick={() => setInfoPopup({ open: false })}
                className="ml-4 px-2 py-1 bg-stone-100 rounded border"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
      {/* ✅ Bouton finale / Endgame (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-[60]">
        <button
          onClick={() => navigate('/end-game')}
          className="px-4 py-2 rounded-lg border-2 border-amber-700 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-950 font-semibold shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)] hover:from-amber-100 hover:to-amber-300 active:translate-y-[1px] transition"
          aria-label="Entrer la solution (finale)"
          title="Entrer la solution"
        >
          ✨ Entrer la solution
        </button>
      </div>
    </div>
  );
};

export default MagicalDashboard;