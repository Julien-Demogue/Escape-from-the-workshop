import React, { useEffect, useMemo, useRef, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/heraldry-quiz.css";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

import chambord from "../assets/images/blason/blason-Chambord.png";
import cheverny from "../assets/images/blason/Blason_Cheverny.svg.png";
import blois from "../assets/images/blason/Blason_Blois.png";
import azay from "../assets/images/blason/blason-Azay-le-rideau.png";
import chenonceaux from "../assets/images/blason/blason-Chenonceaux.png";
import amboise from "../assets/images/blason/Blason_Amboise.svg.png";
import saumur from "../assets/images/blason/blason-Saumur.png";
import villandry from "../assets/images/blason/Blason_Villandry.svg.png";

import { Link } from "react-router-dom";

type Question = {
  id: string;
  img: string;
  options: string[];
  correctIndex: number;
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [runId, setRunId] = useState(0);
  const [locked, setLocked] = useState(false);

  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");

  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);

  const mixes = useMemo(() => QUESTIONS.map(q => shuffleOptions(q)), []);

  const q = QUESTIONS[step];
  const mix = mixes[step];
  const progressPct = Math.round((step / QUESTIONS.length) * 100);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () => setElapsed(Date.now() - startRef.current),
      500
    );
    return () => window.clearInterval(id);
  }, [running]);

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
    const fragment = codePartFor("heraldry-quiz");
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

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep((s) => s + 1);
        setLocked(false);
      } else {
        const allCorrect = [...correctFlags, isCorrect].every(Boolean);
        if (allCorrect) {
          finishSuccess();
        } else {
          finishFail();
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
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  function solveNow() {
    setAnswers(QUESTIONS.map(() => 0));
    setCorrectFlags(QUESTIONS.map(() => true));
    setStep(QUESTIONS.length - 1);
    finishSuccess();
  }

  return (
    <>
      <div className="memory-loire">
        <div className="memory-content">
          <ThickBorderCloseButton />

          <div className="memory-header">
            <h1 className="memory-title">Devine le blason</h1>
            <button onClick={solveNow} className="memory-auto-answer">
              Répondre automatiquement
            </button>
          </div>

          <div className="memory-progress-bar">
            <div 
              className="memory-progress-fill" 
              style={{ width: `${progressPct}%` }} 
            />
          </div>

          <p className="memory-meta">
            Question {step + 1} / {QUESTIONS.length} — Temps : {formatDuration(elapsed)}
          </p>

          <img 
            src={q.img} 
            alt={`Blason ${q.id}`} 
            className="memory-image"
            draggable={false} 
          />

          <div className="memory-options-grid">
            {mix.opts.map((label, i) => {
              const chosen = answers[step] === i;
              return (
                <button
                  key={i}
                  onClick={() => onPick(i)}
                  disabled={locked}
                  className={`memory-option ${chosen ? "chosen" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="memory-helper">
            Le jeu continue même si tu te trompes. S'il y a une erreur à la fin,
            tu devras recommencer depuis le début jusqu'à tout réussir d'un coup.
          </p>

          <div className="memory-status-box">
            <div className="memory-status-row">
              <span className="memory-status-label">Statut du jeu</span>
              <span className="memory-status-badge">
                {status === "completed" 
                  ? "Terminé" 
                  : status === "failed" 
                  ? "Échoué" 
                  : "Non visité"}
              </span>
              <span className="memory-status-badge">
                Score : {score}
              </span>
              <span className="memory-status-badge">
                Temps : {formatDuration(elapsed)}
              </span>
            </div>

            {solvedThisSession && status === "completed" && codePart && (
              <div className="memory-key-container">
                <div className="memory-key-label">Clé</div>
                <div className="memory-key-box">{codePart}</div>
              </div>
            )}
          </div>

          <div className="memory-back-link">
            <Link to="/dashboard" className="memory-back-link-text">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}