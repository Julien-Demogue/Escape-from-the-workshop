import React, { useEffect, useMemo, useRef, useState } from "react";
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
    <div style={{ margin: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <ThickBorderCloseButton />
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>Memory de la Loire — {PAIRS} paires</h1>
        <div style={styles.meta}>
          <span>Coups&nbsp;: <strong>{moves}</strong></span>
          <span>Temps&nbsp;: <strong>{formatDuration(elapsed)}</strong></span>
          <button onClick={reshuffleAndRestart} style={styles.resetBtn}>Recommencer</button>
        </div>
      </div>

      {/* Plateau */}
      <div style={styles.board}>
        <div style={styles.grid}>
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => onCardClick(c.id)}
              disabled={lock || (c.revealed && flippedIds.length === 2) || c.matched}
              aria-label={c.label}
              style={{ ...styles.cardBtn, ...(c.matched ? styles.cardMatched : {}) }}
            >
              <div style={{ ...styles.cardFace, opacity: c.revealed || c.matched ? 1 : 0 }}>
                <img src={c.img} alt={c.label} loading="lazy" style={styles.img} />
                <div style={styles.caption}>{c.label}</div>
              </div>
              <div style={{ ...styles.cardBack, opacity: c.revealed || c.matched ? 0 : 1 }}>
                <div style={styles.backInner}>?</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Statut + score + clé */}
      <div style={styles.statusBox}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>Statut du jeu</span>
          <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
            {status === "completed" ? "Terminé" : status === "failed" ? "Échoué" : "Non visité"}
          </span>
          <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
            Score&nbsp;: {score}
          </span>
          <span style={{ padding: "2px 8px", border: "2px solid black", borderRadius: 8 }}>
            Temps&nbsp;: {formatDuration(elapsed)}
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
  wrap: { padding: 16 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  meta: { display: "flex", alignItems: "center", gap: 10 },
  resetBtn: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white",
    cursor: "pointer", fontWeight: 600,
  },
  board: {
    marginInline: "auto",
    maxWidth: "1200px",
    width: "100%",
    padding: "20px",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    justifyItems: "center",
  },
  cardBtn: {
    position: "relative",
    width: "140px",
    height: "180px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    margin: "4px",
  },
  cardMatched: { boxShadow: "inset 0 0 0 2px #16a34a" },
  cardFace: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    transition: "opacity 140ms ease",
    overflow: "hidden",
  },
  cardBack: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    background: "#e5e7eb",
    border: "2px solid #e5e7eb",
    transition: "opacity 140ms ease",
  },
  backInner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%", 
    height: "80%", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10, 
    background: "#c7d2fe", 
    fontSize: 48, 
    fontWeight: 700, 
    color: "#111827",
    boxShadow: "inset 0 0 0 3px #93c5fd",
  },
  img: { 
    width: "100%", 
    height: "85%",  // Laisse de l'espace pour la légende
    objectFit: "contain", 
    background: "#f8fafc",
    padding: "12px",
  },
  caption: {
    fontSize: 12, 
    color: "#6b7280", 
    padding: "6px 8px", 
    textAlign: "center",
    borderTop: "1px solid #f3f4f6",
  },
  statusBox: {
    marginTop: 12, padding: 12, borderRadius: 12, border: "4px solid black", background: "white",
  },
  winBox: { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#f0fdf4" },
};
