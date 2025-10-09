import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Jigsaw from "../components/Jigsaw";
import type { JigsawHandle } from "../components/Jigsaw";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import GameStateService from '../services/gameState.service';
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

// Image preload with fallback
const IMG_URL =
  "https://www.chateauvillandry.fr/wp-content/uploads/2022/01/chateauvillandry-vue-generale-2-credit-photo-f.paillet-scaled.jpg";
const FALLBACK_URL =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";

// Score by elapsed time
const SCORING_TABLE: Array<{ maxMs: number; score: number }> = [
  { maxMs: 5 * 60 * 1000, score: 100 },
  { maxMs: 7 * 60 * 1000, score: 75 },
  { maxMs: 10 * 60 * 1000, score: 50 },
];
const FALLBACK_SCORE = 25;

function computeScore(elapsedMs: number) {
  for (const { maxMs, score } of SCORING_TABLE) {
    if (elapsedMs <= maxMs) return score;
  }
  return FALLBACK_SCORE;
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const MagicalPuzzle: React.FC = () => {
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed" | "in_progress">("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const jigsawRef = useRef<JigsawHandle>(null);

  // Marquer le jeu comme "in_progress" au démarrage
  useEffect(() => {
    GameStateService.setState('puzzle', 'in_progress');
  }, []);

  // Tick only when running
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setElapsed(Date.now() - startRef.current),
      500
    );
    return () => window.clearInterval(id);
  }, [running]);

  // Mount: start timer, load saved, subscribe, preload image
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);

    const results = readGameResults();
    setStatus(results.puzzle.status);
    setScore(results.puzzle.score);
    setCodePart(results.puzzle.codePart);

    const unsub = onGameResultsChange((r) => {
      setStatus(r.puzzle.status);
      setScore(r.puzzle.score);
      setCodePart(r.puzzle.codePart);
    });

    const img = new Image();
    img.onload = () => setReadyUrl(IMG_URL);
    img.onerror = () => setReadyUrl(FALLBACK_URL);
    img.src = IMG_URL;

    return () => unsub();
  }, []);

  const handleSolved = () => {
    const elapsedMs = Date.now() - startRef.current;
    setRunning(false);
    setElapsed(elapsedMs);
    setSolvedThisSession(true);

    const newScore = computeScore(elapsedMs);
    const fragment = codePartFor("puzzle");

    // Met à jour l'état du jeu
    GameStateService.setState('puzzle', 'completed');

    reportGameResult("puzzle", {
      status: "completed",
      score: newScore,
      codePart: fragment,
    });
  };

  const restartTimer = () => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  };

  return (
    <div className="relative min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <ThickBorderCloseButton />
      <div>
        <div className="flex justify-end mb-2">
          <button
            onClick={() => jigsawRef.current?.solveNow()}
            className="px-3 py-1.5 rounded-lg border-2 border-stone-800 bg-white font-bold cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
          >
            Résoudre automatiquement
          </button>
        </div>

        {!readyUrl ? (
          <div className="w-[640px] h-[533px] flex items-center justify-center rounded-xl bg-white shadow-lg">
            Chargement de l'image…
          </div>
        ) : (
          <Jigsaw
            ref={jigsawRef}
            imageUrl={readyUrl}
            width={640}
            onSolved={handleSolved}
            onShuffle={restartTimer}
          />
        )}

        {/* Status & key (French UI) */}
        <div className="mt-4 p-3 border-2 border-stone-800 rounded-xl bg-white shadow-lg max-w-[640px]">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-bold">Statut du jeu</span>
            <span className="px-2 py-1 border-2 border-stone-600 rounded-lg">
              {status === "completed"
                ? "✓ Terminé"
                : status === "failed"
                ? "✗ Échoué"
                : status === "in_progress"
                ? "⌛ En cours"
                : "? Non commencé"}
            </span>
            <span className="px-2 py-1 border-2 border-stone-600 rounded-lg">
              Score : {score}
            </span>
            <span className="px-2 py-1 border-2 border-stone-600 rounded-lg">
              Temps : {formatDuration(elapsed)}
            </span>
          </div>

          {solvedThisSession && status === "completed" && codePart && (
            <div className="mt-3">
              <div className="font-bold mb-1">Clé</div>
              <div className="px-2.5 py-1.5 border-2 border-dashed border-stone-800 rounded-lg inline-block">
                {codePart}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MagicalPuzzle;
