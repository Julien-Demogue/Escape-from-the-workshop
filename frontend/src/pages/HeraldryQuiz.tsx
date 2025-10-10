// src/pages/HeraldryQuiz.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/heraldry-quiz.css";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

// === INFO (BDD) ===
import challengeService from "../services/challengeService";
import type { Info } from "../services/infoService";

import chambord from "../assets/images/blason/blason-Chambord.png";
import cheverny from "../assets/images/blason/Blason_Cheverny.svg.png";
import blois from "../assets/images/blason/Blason_Blois.png";
import azay from "../assets/images/blason/blason-Azay-le-rideau.png";
import chenonceaux from "../assets/images/blason/blason-Chenonceaux.png";
import amboise from "../assets/images/blason/Blason_Amboise.svg.png";
import saumur from "../assets/images/blason/blason-Saumur.png";
import villandry from "../assets/images/blason/Blason_Villandry.svg.png";

type Question = { id: string; img: string; options: string[]; correctIndex: number };
const QUESTIONS: Question[] = [
  { id: "chambord", img: chambord, options: ["Chambord","Chaumont-sur-Loire","Amboise","Blois"], correctIndex: 0 },
  { id: "cheverny", img: cheverny, options: ["Cheverny","Chenonceaux","Villandry","Saumur"], correctIndex: 0 },
  { id: "blois", img: blois, options: ["Blois","Chambord","Amboise","Azay-le-Rideau"], correctIndex: 0 },
  { id: "azay", img: azay, options: ["Azay-le-Rideau","Chenonceaux","Chaumont-sur-Loire","Saumur"], correctIndex: 0 },
  { id: "chenonceaux", img: chenonceaux, options: ["Chenonceaux","Cheverny","Villandry","Blois"], correctIndex: 0 },
  { id: "amboise", img: amboise, options: ["Amboise","Chambord","Saumur","Chenonceaux"], correctIndex: 0 },
  { id: "saumur", img: saumur, options: ["Saumur","Villandry","Blois","Amboise"], correctIndex: 0 },
  { id: "villandry", img: villandry, options: ["Villandry","Cheverny","Azay-le-Rideau","Chambord"], correctIndex: 0 },
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

const SCORING_TABLE = [
  { maxMs: 5 * 60 * 1000, score: 100 },
  { maxMs: 7 * 60 * 1000, score: 75 },
  { maxMs: 10 * 60 * 1000, score: 50 },
];
const FALLBACK_SCORE = 25;
function computeScore(ms: number) {
  for (const r of SCORING_TABLE) if (ms <= r.maxMs) return r.score;
  return FALLBACK_SCORE;
}
function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const HERALDRY_CHALLENGE_ID = 1; // ← id en BDD

export default function HeraldryQuiz() {
  // === INFO (BDD) ===
  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    challengeService
      .getInfo(HERALDRY_CHALLENGE_ID)
      .then((data) => {
        if (!cancelled) {
          setInfo(data);
          // eslint-disable-next-line no-console
          console.log("[HeraldryQuiz] info from DB:", data);
        }
      })
      .catch((e) => !cancelled && setInfoError(e?.response?.data?.error ?? e.message))
      .finally(() => !cancelled && setLoadingInfo(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [runId, setRunId] = useState(0);
  const [locked, setLocked] = useState(false);

  const [status, setStatus] = useState<"unvisited" | "completed" | "failed" | "in_progress">(
    "unvisited"
  );
  const [score, setScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solvedThisSession, setSolvedThisSession] = useState(false);

  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  const mixes = useMemo(() => QUESTIONS.map((q) => shuffleOptions(q)), [runId]);
  const q = QUESTIONS[step];
  const mix = mixes[step];
  const progressPct = Math.round((step / QUESTIONS.length) * 100);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);

    reportGameResult("heraldry-quiz", { status: "in_progress" });
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
    reportGameResult("heraldry-quiz", {
      status: "completed",
      score: newScore,
      codePart: codePartFor("heraldry-quiz"),
    });
  }
  function finishFail() {
    setRunning(false);
    reportGameResult("heraldry-quiz", { status: "failed" });
  }

  function onPick(visibleIndex: number) {
    if (locked) return;
    setLocked(true);
    const originalIndex = mix.map[visibleIndex];
    const isCorrect = originalIndex === q.correctIndex;

    setAnswers((prev) => {
      const n = [...prev];
      n[step] = visibleIndex;
      return n;
    });
    setCorrectFlags((prev) => {
      const n = [...prev];
      n[step] = isCorrect;
      return n;
    });

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep((s) => s + 1);
        setLocked(false);
      } else {
        const allCorrect = [...correctFlags, isCorrect].every(Boolean);
        allCorrect ? finishSuccess() : (finishFail(), hardReset());
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

  return (
    <div className="hq-shell">
      <div className="hq-headerbar">
        <ThickBorderCloseButton />
      </div>

      <div className="hq-card">
        {/* Título/descripcion desde BDD (fallback si no hay) */}
        {loadingInfo && <p className="hq-loading">Chargement de la description…</p>}
        {infoError && <p className="hq-error">Erreur : {infoError}</p>}
        <h1 className="hq-title">
          {info?.title ?? "Devine le blason"}
        </h1>
        {info?.description && (
          <p className="hq-intro" style={{ whiteSpace: "pre-line" }}>
            {info.description}
          </p>
        )}

        {/* Progreso */}
        <div className="hq-progress">
          <div className="hq-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>

        <p className="hq-meta">
          Question {step + 1} / {QUESTIONS.length} — Temps : {formatDuration(elapsed)}
        </p>

        {/* Imagen */}
        <div className="hq-imageWrap">
          <img src={q.img} alt={`Blason ${q.id}`} className="hq-image" draggable={false} />
        </div>

        {/* Opciones */}
        <div className="hq-grid">
          {mix.opts.map((label, i) => {
            const chosen = answers[step] === i;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                disabled={locked}
                className={`hq-btn ${chosen ? "is-chosen" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p className="hq-helper">
          Le jeu continue même si tu te trompes. Si une erreur subsiste à la fin,
          tu devras recommencer depuis le début.
        </p>

        {/* Estado + clave */}
        <div className="hq-status">
          <div className="hq-status__row">
            <span className="hq-badge hq-badge--label">Statut</span>
            <span className="hq-badge">
              {status === "completed" ? "Terminé" : status === "failed" ? "Échoué" : "En cours"}
            </span>
            <span className="hq-badge">Score : {score}</span>
            <span className="hq-badge">Temps : {formatDuration(elapsed)}</span>
          </div>

          {solvedThisSession && status === "completed" && codePart && (
            <div className="hq-key">
              <div className="hq-key__label">Clé</div>
              <div className="hq-key__code">{codePart}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
