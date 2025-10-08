import React, { useEffect, useMemo, useRef, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

import chambord from "../assets/images/blason/blason-chambord.png";
import cheverny from "../assets/images/blason/Blason_cheverny41.svg.png";
import blois from "../assets/images/blason/Blason_de_Blois.png";
import azay from "../assets/images/blason/blason-azay-le-rideau.png";
import chenonceaux from "../assets/images/blason/blason-chenonceaux.png";
import amboise from "../assets/images/blason/Blason_ville_fr_Amboise_(Indre-et-Loire).svg.png";
import saumur from "../assets/images/blason/blason-saumur.png";
import villandry from "../assets/images/blason/Blason_ville_fr_Villandry_(Indre-et-Loire).svg.png";

import { Link } from "react-router-dom";

type Question = {
  id: string;
  img: string;
  options: string[]; // 4 choices
  correctIndex: number; // 0..3
};

const QUESTIONS: Question[] = [
  {
    id: "chambord",
    img: chambord,
    options: ["Chambord", "Chaumont-sur-Loire", "Amboise", "Blois"],
    correctIndex: 0,
  },
  {
    id: "cheverny",
    img: cheverny,
    options: ["Cheverny", "Chenonceaux", "Villandry", "Saumur"],
    correctIndex: 0,
  },
  {
    id: "blois",
    img: blois,
    options: ["Blois", "Chambord", "Amboise", "Azay-le-Rideau"],
    correctIndex: 0,
  },
  {
    id: "azay",
    img: azay,
    options: ["Azay-le-Rideau", "Chenonceaux", "Chaumont-sur-Loire", "Saumur"],
    correctIndex: 0,
  },
  {
    id: "chenonceaux",
    img: chenonceaux,
    options: ["Chenonceaux", "Cheverny", "Villandry", "Blois"],
    correctIndex: 0,
  },
  {
    id: "amboise",
    img: amboise,
    options: ["Amboise", "Chambord", "Saumur", "Chenonceaux"],
    correctIndex: 0,
  },
  {
    id: "saumur",
    img: saumur,
    options: ["Saumur", "Villandry", "Blois", "Amboise"],
    correctIndex: 0,
  },
  {
    id: "villandry",
    img: villandry,
    options: ["Villandry", "Cheverny", "Azay-le-Rideau", "Chambord"],
    correctIndex: 0,
  },
];

type Shuffled = { map: number[]; opts: string[] };

function shuffleOptions(q: Question): Shuffled {
  const idxs = [0, 1, 2, 3];
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return { map: idxs, opts: idxs.map((i) => q.options[i]) };
}

// ----- scoring rules (same as Puzzle) -----
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

export default function HeraldryQuiz() {
  // quiz state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [runId, setRunId] = useState(0);
  const [locked, setLocked] = useState(false);

  // results (persisted)
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">(
    "unvisited"
  );
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");

  // show key only if solved now
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // timer
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  // Each question gets a stable shuffle for this run
  const mixes = useMemo(() => QUESTIONS.map((q) => shuffleOptions(q)), [runId]);

  const q = QUESTIONS[step];
  const mix = mixes[step];
  const progressPct = Math.round((step / QUESTIONS.length) * 100);

  // live ticking only while running
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setElapsed(Date.now() - startRef.current),
      500
    );
    return () => window.clearInterval(id);
  }, [running]);

  // load saved results + subscribe
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);

    const saved = readGameResults();
    setStatus(saved["heraldry-quiz"].status);
    setScore(saved["heraldry-quiz"].score);
    setCodePart(saved["heraldry-quiz"].codePart);

    return onGameResultsChange((r) => {
      setStatus(r["heraldry-quiz"].status);
      setScore(r["heraldry-quiz"].score);
      setCodePart(r["heraldry-quiz"].codePart);
    });
  }, []);

  function finishSuccess() {
    const elapsedMs = Date.now() - startRef.current;
    setRunning(false);
    setElapsed(elapsedMs);
    setSolvedThisSession(true);

    const newScore = computeScore(elapsedMs);
    setScore(newScore);
    const fragment = codePartFor("heraldry-quiz"); // "Esta"
    reportGameResult("heraldry-quiz", {
      status: "completed",
      score: newScore,
      codePart: fragment,
    });
  }

  function finishFail() {
    setRunning(false);
    reportGameResult("heraldry-quiz", {
      status: "failed",
      // keep previous score/part
    });
  }

  function onPick(visibleIndex: number) {
    if (locked) return;
    setLocked(true);

    const originalIndex = mix.map[visibleIndex];
    const isCorrect = originalIndex === q.correctIndex;

    setAnswers((prev) => {
      const next = [...prev];
      next[step] = visibleIndex;
      return next;
    });

    setCorrectFlags((prev) => {
      const next = [...prev];
      next[step] = isCorrect;
      return next;
    });

    // Small delay so pressed state is visible
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep((s) => s + 1);
        setLocked(false);
      } else {
        // last question
        const allCorrect = [...correctFlags, isCorrect].every(Boolean);
        if (allCorrect) {
          finishSuccess();
        } else {
          finishFail();
          // restart run (must get all right in one go)
          hardReset();
        }
      }
    }, 120);
  }

  function hardReset() {
    setStep(0);
    setAnswers([]);
    setCorrectFlags([]);
    setRunId((x) => x + 1);
    setLocked(false);
    // restart timer
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  // auto-solve for testing
  function solveNow() {
    setAnswers(QUESTIONS.map(() => 0)); // cosmetic
    setCorrectFlags(QUESTIONS.map(() => true));
    setStep(QUESTIONS.length - 1);
    finishSuccess();
  }

  return (
    <div style={styles.wrap}>
      <ThickBorderCloseButton />
      <div style={styles.card}>
        {/* header with actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h1 style={styles.title}>Devine le blason</h1>
          <button
            onClick={solveNow}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "3px solid black",
              background: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Répondre automatiquement
          </button>
        </div>

        {/* progress */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
        </div>

        <p style={styles.meta}>
          Question {step + 1} / {QUESTIONS.length} — Temps :{" "}
          {formatDuration(elapsed)}
        </p>

        {/* image */}
        <img
          src={q.img}
          alt={`Blason ${q.id}`}
          style={styles.image}
          draggable={false}
        />

        {/* options */}
        <div style={styles.optionsGrid}>
          {mix.opts.map((label, i) => {
            const chosen = answers[step] === i;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                disabled={locked}
                style={{
                  ...styles.optionBtn,
                  ...(chosen ? styles.optionChosen : {}),
                  ...(locked ? { opacity: 0.8, pointerEvents: "none" } : {}),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p style={styles.helper}>
          Le jeu continue même si tu te trompes. S'il y a une erreur à la fin,
          tu devras recommencer depuis le début jusqu'à tout réussir d'un coup.
        </p>

        {/* status + score + key (French UI; key word appears only if solved now) */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "4px solid black",
            borderRadius: 16,
            background: "white",
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
                {codePart /* this game contributes "Esta" */}
              </div>
            </div>
          )}
        </div>
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    background: "#0f172a",
    padding: 16,
  },
  card: {
    width: "min(960px, 100%)",
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,.2)",
  },
  title: { margin: 0, fontSize: 28 },
  progressBar: {
    width: "100%",
    height: 10,
    background: "#e5e7eb",
    borderRadius: 999,
    margin: "16px 0 10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#2563eb",
    transition: "width 200ms ease",
  },
  meta: { margin: "0 0 12px", color: "#6b7280" },
  image: {
    width: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  optionsGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  optionBtn: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontSize: 16,
    cursor: "pointer",
    background: "white",
    transition: "transform 120ms ease, box-shadow 120ms ease",
  },
  optionChosen: {
    transform: "scale(0.98)",
    boxShadow: "inset 0 0 0 2px #2563eb",
  },
  helper: { marginTop: 12, color: "#6b7280" },
};
