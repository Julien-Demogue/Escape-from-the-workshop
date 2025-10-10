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
import challengeService from "../services/challengeService";
import type { Info } from "../services/infoService";

type PlayCard = DeckCard & { revealed: boolean; matched: boolean };

const PAIRS = 20;
const ROWS = 4;
const COLS = 10;

// Base board sizes
const BASE_W = 90;
const BASE_H = 130;
const GAP = 10;

// Shorter delay for incorrect cards (snappier)
const FLIP_BACK_DELAY_MS = 600;

// ---- Scoring helpers ----
function movesScore(m: number) {
  if (m <= 30) return 50;
  if (m >= 60) return 0;
  const t = (m - 30) / 30;
  return Math.round(50 * (1 - t));
}
function timeScore(ms: number) {
  const a = 180000, b = 480000; // 3–8 min
  if (ms <= a) return 50;
  if (ms >= b) return 0;
  const t = (ms - a) / (b - a);
  return Math.round(50 * (1 - t));
}
function totalScore(m: number, ms: number) {
  return Math.max(0, Math.min(100, movesScore(m) + timeScore(ms)));
}
function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export default function MemoryLoire() {
  // === INFO (BDD) === Rivau — “Les Familles des Blasons” (challengeId = 3)
  const CHALLENGE_ID = 3;

  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    challengeService
      .getInfo(CHALLENGE_ID)
      .then((data) => !cancelled && setInfo(data))
      .catch((e) => !cancelled && setInfoError(e?.response?.data?.error ?? e.message))
      .finally(() => !cancelled && setLoadingInfo(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Stars (light decoration)
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${1 + Math.random() * 2}s`,
        },
      })),
    []
  );

  // Deck
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
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => clearInterval(id);
  }, [running]);

  // Persistencia
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed" | "in_progress">("unvisited");
  const [finalScore, setFinalScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solvedThisSession, setSolvedThisSession] = useState(false);

  // NUEVO: estado local para reward/flag leídos desde BDD
  const [reward, setReward] = useState<string>("");
  const [flag, setFlag] = useState<string>("");

  useEffect(() => {
    reportGameResult("memory-loire", { status: "in_progress" });
    const s = readGameResults();
    setStatus(s["memory-loire"].status);
    setFinalScore(s["memory-loire"].score);
    setCodePart(s["memory-loire"].codePart);
    return onGameResultsChange((r) => {
      setStatus(r["memory-loire"].status);
      setFinalScore(r["memory-loire"].score);
      setCodePart(r["memory-loire"].codePart);
    });
  }, []);

  // Win
  useEffect(() => {
    async function handleWin() {
      setWon(true);
      const ms = Date.now() - startRef.current;
      setRunning(false);
      setElapsed(ms);
      const sc = totalScore(moves, ms);
      setFinalScore(sc);
      setSolvedThisSession(true);

      // === Recuperar FLAG + REWARD reales desde BDD (como en los otros juegos) ===
      try {
        const ch = await challengeService.getById(CHALLENGE_ID); // id = 3
        const rewardReal = ch.reward || codePartFor("memory-loire"); // fallback si algo falla
        const flagReal = ch.flag || "";

        setReward(rewardReal);
        setFlag(flagReal);

        reportGameResult("memory-loire", {
          status: "completed",
          score: sc,
          codePart: rewardReal, // publicar la clé real
        });
      } catch {
        const fallback = codePartFor("memory-loire");
        setReward(fallback);
        reportGameResult("memory-loire", {
          status: "completed",
          score: sc,
          codePart: fallback,
        });
      }
    }

    if (cards.length && cards.every((c) => c.matched)) {
      void handleWin();
    }
  }, [cards, moves]);

  // Restart
  function restart() {
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

  // Card click
  function onCardClick(id: string) {
    if (lock) return;
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const card = cards[idx];
    if (card.revealed || card.matched) return;

    // Flip instantly (flip is only CSS transform -> very fast)
    const next = cards.slice();
    next[idx] = { ...card, revealed: true };
    setCards(next);

    const newly = [...flippedIds, id];
    if (newly.length < 2) {
      setFlippedIds(newly);
      return;
    }

    setLock(true);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (newMoves > 60) {
      setTimeout(() => {
        alert("Trop de coups ! Le jeu recommence 🔄");
        restart();
      }, 150);
      return;
    }

    const [idA, idB] = newly;
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
      }, 180);
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
      {/* Estrellas */}
      <div className="memory-stars">
        {stars.map((star) => (
          <div key={star.id} className="memory-star" style={star.style} />
        ))}
      </div>

      <ThickBorderCloseButton />

      {/* Info desde BDD */}
      <div className="memory-info">
        {loadingInfo && <p className="memory-info-loading">Chargement de la description…</p>}
        {infoError && <p className="memory-info-error">Erreur: {infoError}</p>}
        {info ? (
          <>
            <h1 className="memory-title">{info.title}</h1>
            <p className="memory-description">{info.description}</p>
          </>
        ) : (
          !loadingInfo &&
          !infoError && <h1 className="memory-title">Memory de la Loire — {PAIRS} paires</h1>
        )}
      </div>

      {/* Tarjeta contenedora */}
      <div className="memory-card">
        {/* Meta / controles */}
        <div className="memory-meta">
          <span>
            Coups : <strong>{moves}</strong> /60
          </span>
          <span>
            Temps : <strong>{fmt(elapsed)}</strong>
          </span>
          <button onClick={restart} className="memory-button">Recommencer</button>
        </div>

        {/* Grille fixe 4 × 10 */}
        <div
          className="memory-grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${BASE_W}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${BASE_H}px)`,
            gap: `${GAP}px`,
          }}
        >
          {cards.map((c) => (
            <div
              key={c.id}
              className={`memory-card-item ${c.revealed || c.matched ? "flipped" : ""} ${
                c.matched ? "matched" : ""
              }`}
              onClick={() => onCardClick(c.id)}
              role="button"
              aria-label={c.label}
            >
              <div className="memory-card-inner" aria-hidden="true">
                <div className="memory-card-front">
                  <span>?</span>
                </div>
                <div className="memory-card-back">
                  <img
                    src={c.img}
                    alt={c.label}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  <div className="memory-card-caption">{c.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status + clé */}
      <div className="memory-status">
        <div className="memory-status-row">
          <span className="memory-status-label">Statut du jeu</span>
          <span className="memory-pill">
            {status === "completed" ? "Terminé" : status === "failed" ? "Échoué" : "Non visité"}
          </span>
          <span className="memory-pill">Score : {finalScore}</span>
          <span className="memory-pill">Temps : {fmt(elapsed)}</span>
        </div>

        {/* Mostrar la clé siempre que el juego esté completado; preferimos reward de BDD y si no, codePart */}
        {status === "completed" && (reward || codePart) && (
          <div className="memory-key">
            <div className="memory-key-label">Clé</div>
            <div className="memory-key-box">{reward || codePart}</div>
          </div>
        )}
      </div>

      {won && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: 12,
            border: "2px solid rgba(253, 230, 138, 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          🎉 Toutes les paires ont été trouvées en <strong>{moves}</strong> coups !
        </div>
      )}
    </div>
  );
}
