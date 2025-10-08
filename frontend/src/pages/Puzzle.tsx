import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Jigsaw from "../components/Jigsaw";
import type { JigsawHandle } from "../components/Jigsaw";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
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

const Puzzle: React.FC = () => {
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">(
    "unvisited"
  );
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");

  // NEW: only show key if solved now (this tab, this visit)
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const jigsawRef = useRef<JigsawHandle>(null);

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
    setSolvedThisSession(false); // reset session flag on fresh mount

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

  // When solved: stop timer, compute score, store piece, and mark session solved
  const handleSolved = () => {
    const elapsedMs = Date.now() - startRef.current;
    setRunning(false);
    setElapsed(elapsedMs);
    setSolvedThisSession(true); // gate for showing the key

    const newScore = computeScore(elapsedMs);
    const fragment = codePartFor("puzzle"); // "es"

    reportGameResult("puzzle", {
      status: "completed",
      score: newScore,
      codePart: fragment,
    });
  };

  // Restart timer on shuffle (if needed)
  const restartTimer = () => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false); // if reshuffle, hide key again until solved
  };

  const FRAME_W = 640;
  const FRAME_H = Math.round((FRAME_W * 5) / 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <ThickBorderCloseButton />
      <div>
        {/* Helper button to auto-solve (for testing) */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => jigsawRef.current?.solveNow()}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "3px solid black",
              background: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Résoudre automatiquement
          </button>
        </div>

        {!readyUrl ? (
          <div
            style={{
              width: FRAME_W,
              height: FRAME_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              background: "#fff",
              boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
            }}
          >
            Chargement de l’image…
          </div>
        ) : (
          <Jigsaw
            ref={jigsawRef}
            imageUrl={readyUrl}
            width={FRAME_W}
            onSolved={handleSolved}
            onShuffle={restartTimer}
          />
        )}

        {/* Status & key (French UI) */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "4px solid black",
            borderRadius: 16,
            background: "white",
            maxWidth: FRAME_W,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700 }}>Statut du jeu</span>
            <span
              style={{
                padding: "2px 8px",
                border: "2px solid black",
                borderRadius: 8,
              }}
            >
              {status === "completed"
                ? "Terminé"
                : status === "failed"
                ? "Échoué"
                : "Non visité"}
            </span>
            <span
              style={{
                padding: "2px 8px",
                border: "2px solid black",
                borderRadius: 8,
              }}
            >
              Score&nbsp;: {score}
            </span>
            <span
              style={{
                padding: "2px 8px",
                border: "2px solid black",
                borderRadius: 8,
              }}
            >
              Temps&nbsp;: {formatDuration(elapsed)}
            </span>
          </div>

          {/* show key ONLY if solved in this session */}
          {solvedThisSession && status === "completed" && codePart && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Clé</div>
              <div
                style={{
                  padding: "8px 10px",
                  border: "2px dashed black",
                  borderRadius: 8,
                }}
              >
                {codePart}
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link
            to="/dashboard"
            style={{ textDecoration: "underline", color: "#2563eb" }}
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
