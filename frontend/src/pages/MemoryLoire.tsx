import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/memory-loire.css";
import "../styles/memory-animations.css";
import { buildMemoryDeck, type DeckCard } from "../utils/buildMemoryDeck";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

type PlayCard = DeckCard & { revealed: boolean; matched: boolean };

const PAIRS = 20; // 20 paires -> 40 cartes -> 5 lignes x 8 colonnes
const FLIP_BACK_DELAY_MS = 800;

// --------- Scoring (hybrid: moves + time) ---------
function movesScore(moves: number): number {
  if (moves <= 30) return 50;
  if (moves >= 60) return 0;
  const t = (moves - 30) / (60 - 30);
  return Math.round(50 * (1 - t));
}

function timeScore(elapsedMs: number): number {
  const three = 3 * 60 * 1000;
  const eight = 8 * 60 * 1000;
  if (elapsedMs <= three) return 50;
  if (elapsedMs >= eight) return 0;
  const t = (elapsedMs - three) / (eight - three);
  return Math.round(50 * (1 - t));
}

function computeMemoryScoreHybrid(moves: number, elapsedMs: number): number {
  return Math.max(0, Math.min(100, movesScore(moves) + timeScore(elapsedMs)));
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MemoryLoire() {
  // Effet d'étoiles magiques
  const stars = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${1 + Math.random() * 2}s`,
      }
    }))
  , []);

  const base = useMemo(
    () =>
      buildMemoryDeck({
        desiredPairs: PAIRS,
        buckets: ["blason"],
        placeholderLabel: "Coming soon",
      }),
    []
  );

  const [cards, setCards] = useState<PlayCard[]>(
    () => base.map((c) => ({ ...c, revealed: false, matched: false }))
  );
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  // Timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  // Result persistence + session flag
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // Timer ticking
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => window.clearInterval(id);
  }, [running]);

  // Load saved result
  useEffect(() => {
    const saved = readGameResults();
    setStatus(saved["memory-loire"].status);
    setScore(saved["memory-loire"].score);
    setCodePart(saved["memory-loire"].codePart);

    return onGameResultsChange((r) => {
      setStatus(r["memory-loire"].status);
      setScore(r["memory-loire"].score);
      setCodePart(r["memory-loire"].codePart);
    });
  }, []);

  // Win detection
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true);
      const elapsedMs = Date.now() - startRef.current;
      setRunning(false);
      setElapsed(elapsedMs);
      const finalScore = computeMemoryScoreHybrid(moves, elapsedMs);
      setScore(finalScore);
      setSolvedThisSession(true);
      reportGameResult("memory-loire", {
        status: "completed",
        score: finalScore,
        codePart: codePartFor("memory-loire"), // e.g. "la"
      });
    }
  }, [cards, moves]);

  // 🔄 Reiniciar tablero (usado tanto manualmente como por penalización)
  function reshuffleAndRestart() {
    const reshuffled = buildMemoryDeck({
      desiredPairs: PAIRS,
      buckets: ["blason"],
      placeholderLabel: "Coming soon",
    }).map((c) => ({ ...c, revealed: false, matched: false }));
    setCards(reshuffled);
    setFlippedIds([]);
    setLock(false);
    setMoves(0);
    setWon(false);

    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  function onCardClick(id: string) {
    if (lock) return;
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const card = cards[idx];
    if (card.revealed || card.matched) return;

    const next = cards.slice();
    next[idx] = { ...card, revealed: true };
    setCards(next);

    const newlyFlipped = [...flippedIds, id];
    if (newlyFlipped.length < 2) {
      setFlippedIds(newlyFlipped);
      return;
    }

    setLock(true);
    const newMoves = moves + 1;
    setMoves(newMoves);

    // 🚨 Si supera 60 movimientos, reiniciamos automáticamente
    if (newMoves > 60) {
      setTimeout(() => {
        alert("Trop de coups ! Le jeu recommence 🔄");
        reshuffleAndRestart();
      }, 200);
      return;
    }

    const [idA, idB] = newlyFlipped;
    const a = next.find((c) => c.id === idA)!;
    const b = next.find((c) => c.id === idB)!;

    if (a.pairId === b.pairId) {
      const after = next.map((c) =>
        c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
      );
      setTimeout(() => {
        setCards(after);
        setFlippedIds([]);
        setLock(false);
      }, 200);
    } else {
      setTimeout(() => {
        const after = next.map((c) =>
          c.id === a.id || c.id === b.id ? { ...c, revealed: false } : c
        );
        setCards(after);
        setFlippedIds([]);
        setLock(false);
      }, FLIP_BACK_DELAY_MS);
    }
  }

  return (
    <div className="memory-loire">
      {/* Fond d'étoiles */}
      <div className="memory-stars">
        {stars.map(star => (
          <div
            key={star.id}
            className="memory-star"
            style={star.style}
          />
        ))}
      </div>
      
      <ThickBorderCloseButton />
      <div className="memory-card">
        <h1 className="memory-title">Memory de la Loire — {PAIRS} paires</h1>
        <div className="memory-meta">
          <span>Coups : <strong>{moves}</strong> /60</span>
          <span>Temps : <strong>{formatDuration(elapsed)}</strong></span>
          <button onClick={reshuffleAndRestart} className="memory-button">Recommencer</button>
        </div>

        {/* Plateau */}
        <div className="memory-grid">
          {cards.map((c) => (
            <div 
              key={c.id}
              className={`memory-card ${c.revealed || c.matched ? 'flipped' : ''} ${c.matched ? 'matched' : ''}`}
              onClick={() => onCardClick(c.id)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">
                  <span>?</span>
                </div>
                <div className="memory-card-back">
                  <img 
                    src={c.img} 
                    alt={c.label} 
                    loading="lazy" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statut + score + clé */}
      <div className="memory-status">
        <div className="flex gap-4 flex-wrap items-center">
          <span className="font-bold">Statut du jeu</span>
          <span className="px-3 py-1 border-2 border-amber-200 rounded-lg">
            {status === "completed" ? "Terminé" : status === "failed" ? "Échoué" : "Non visité"}
          </span>
          <span className="px-3 py-1 border-2 border-amber-200 rounded-lg">
            Score : {score}
          </span>
          <span className="px-3 py-1 border-2 border-amber-200 rounded-lg">
            Temps : {formatDuration(elapsed)}
          </span>
        </div>

        {solvedThisSession && status === "completed" && codePart && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Clé</div>
            <div style={{ padding: "8px 10px", border: "2px dashed black", borderRadius: 8 }}>
              {codePart}
            </div>
          </div>
        )}
      </div>

      {won && (
        <div style={styles.winBox}>
          🎉 Toutes les paires ont été trouvées en <strong>{moves}</strong> coups !
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  winBox: {
    marginTop: 12,
    padding: 12,
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    border: "2px solid rgba(253, 230, 138, 0.6)",
    backdropFilter: "blur(4px)"
  }
};
