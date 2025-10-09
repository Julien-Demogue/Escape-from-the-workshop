import React, { useEffect, useMemo, useRef, useState } from "react";
import chambordBlason from "../assets/images/blason/blason-chambord.png";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/memory-loire.css";
import "../styles/memory-animations.css";
import "../styles/memory-riddle.css";

import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

const CORRECT_ANSWER = 300;
const ACCEPT_TOLERANCE = 0;

// -------- Scoring by TIME ONLY --------
type TimeBand = { maxMs: number; score: number };
const BANDS: TimeBand[] = [
  { maxMs: 1 * 60 * 1000, score: 100 },
  { maxMs: 2 * 60 * 1000, score: 90 },
  { maxMs: 3 * 60 * 1000, score: 80 },
  { maxMs: 5 * 60 * 1000, score: 60 },
  { maxMs: 7 * 60 * 1000, score: 40 },
  { maxMs: 10 * 60 * 1000, score: 20 },
];
const MIN_SCORE_AFTER = 10;

function scoreByTime(elapsedMs: number): number {
  for (const b of BANDS) {
    if (elapsedMs <= b.maxMs) return b.score;
  }
  return MIN_SCORE_AFTER;
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MagicalChambordEnigma() {
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

  const [value, setValue] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Persisted result & session gate for the key
  const [savedStatus, setSavedStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");
  const [savedScore, setSavedScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // Timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  // Tick only while running
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => window.clearInterval(id);
  }, [running]);

  // Load saved + subscribe
  useEffect(() => {
    const saved = readGameResults();
    setSavedStatus(saved["chambord-enigma"].status);
    setSavedScore(saved["chambord-enigma"].score);
    setCodePart(saved["chambord-enigma"].codePart);

    return onGameResultsChange((r) => {
      setSavedStatus(r["chambord-enigma"].status);
      setSavedScore(r["chambord-enigma"].score);
      setCodePart(r["chambord-enigma"].codePart);
    });
  }, []);

  const parsed = useMemo(() => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [value]);

  function check() {
    if (parsed === null) return;
    const ok = Math.abs(parsed - CORRECT_ANSWER) <= ACCEPT_TOLERANCE;

    setStatus(ok ? "correct" : "wrong");
    setTries((t) => t + 1);

    if (ok) {
      setRunning(false);
      const score = scoreByTime(elapsed);
      setSavedScore(score);
      setSolvedThisSession(true);

      reportGameResult("chambord-enigma", {
        status: "completed",
        score: score,
        codePart: codePartFor("chambord-enigma"),
      });
    } else {
      reportGameResult("chambord-enigma", { status: "failed" });
    }
  }

  function reset() {
    setValue("");
    setStatus("idle");
    setTries(0);
    setShowHint(false);
    setRunning(true);
    startRef.current = Date.now();
    setElapsed(0);
    setSolvedThisSession(false);
  }

  return (
    <div className="memory-loire">
      <div className="memory-stars">
        {stars.map(star => (
          <div key={star.id} className="memory-star" style={star.style} />
        ))}
      </div>

      <ThickBorderCloseButton />

      <h1 className="memory-title">Énigme 2 — Chambord</h1>

      <div className="memory-content">
        <div className="memory-riddle">
          <p className="memory-instructions">
            « Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
            Combien de fois suis-je représenté ? »
          </p>
          
          {showHint && (
            <div className="memory-hint">
              <p><strong>Indice :</strong> C'est la salamandre de François Ier.</p>
              <img src={chambordBlason} alt="Blason" className="memory-image" />
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); check(); }} className="memory-form">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Entre un nombre..."
            className="memory-input"
            min="0"
          />

          <div className="memory-controls">
            <button type="submit" className="memory-button" disabled={parsed === null}>
              Valider
            </button>
            <button
              type="button"
              className="memory-button"
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              {showHint ? "Indice affiché" : "Indice"}
            </button>
            <button type="button" className="memory-button" onClick={reset}>
              Réinitialiser
            </button>
          </div>
        </form>

        <div className="memory-meta">
          <div>Tentatives : {tries}</div>
          {running ? (
            <div>Temps : {formatDuration(elapsed)}</div>
          ) : (
            <div>Temps final : {formatDuration(elapsed)}</div>
          )}
        </div>

        {status !== "idle" && (
          <div className={status === "correct" ? "memory-success" : "memory-error"}>
            {status === "correct" ? (
              <>
                <h2>Félicitations !</h2>
                <div className="memory-score">Score : {savedScore}</div>
                {codePart && (
                  <div className="memory-key">
                    <div className="memory-key-label">Clé</div>
                    <div className="memory-key-code">{codePart}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="memory-error-message">
                Ce n'est pas le bon nombre. Essaie encore !
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}