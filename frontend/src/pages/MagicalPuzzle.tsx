// src/pages/MagicalPuzzle.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Jigsaw from "../components/Jigsaw";
import type { JigsawHandle } from "../components/Jigsaw";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import GameStateService from "../services/gameState.service";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

// === INFO (DB) ===
import challengeService from "../services/challengeService";
import type { Info } from "../services/infoService";

/* ---------- Assets (preload + fallback) ---------- */
const IMG_URL =
  "https://www.chateauvillandry.fr/wp-content/uploads/2022/01/chateauvillandry-vue-generale-2-credit-photo-f.paillet-scaled.jpg";
const FALLBACK_URL =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";

/* ---------- Scoring ---------- */
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

/* ---------- Background stars ---------- */
function Stars({ count = 60 }: { count?: number }) {
  const stars = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 2,
    delay: `${Math.random() * 3}s`,
    dur: `${1.8 + Math.random() * 1.6}s`,
  }));
  return (
    <>
      <style>{`
        @keyframes twinklePuzzle { 0%,100% { opacity:.25; transform:scale(1) } 50% { opacity:.9; transform:scale(1.2) } }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-amber-200"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animation: `twinklePuzzle ${s.dur} ease-in-out ${s.delay} infinite`,
              boxShadow: "0 0 10px rgba(251,191,36,.35)",
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- Fireworks on success ---------- */
function Fireworks({ show }: { show: boolean }) {
  if (!show) return null;
  const bursts = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    top: `${15 + Math.random() * 50}%`,
    delay: Math.random() * 0.6,
    hue: Math.floor(Math.random() * 360),
  }));

  return (
    <>
      <style>{`
        @keyframes sparkPuzzle {
          0%   { transform: translate(-50%, -50%) rotate(var(--deg)) translateX(0) scale(.7); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--deg)) translateX(var(--dist)) scale(1); opacity: 0; }
        }
        @keyframes flashPuzzle {
          0% { transform: scale(0); opacity: .9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {bursts.map((b) => {
          const sparks = Array.from({ length: 24 });
          return (
            <div key={b.id} style={{ position: "absolute", left: b.left, top: b.top }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, hsla(${b.hue},100%,85%,.9), transparent 60%)`,
                  filter: "blur(1px)",
                  animation: `flashPuzzle 900ms ease-out ${b.delay}s forwards`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              {sparks.map((_, i) => {
                const deg = (360 / sparks.length) * i + Math.random() * 6 - 3;
                const dist = 120 + Math.random() * 40;
                const light = 65 + Math.random() * 15;
                const sat = 95;
                const alpha = 0.95;
                const size = 6 + Math.random() * 3;
                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: size,
                      height: size,
                      borderRadius: 9999,
                      background: `radial-gradient(circle, hsla(${b.hue},${sat}%,${light}%,${alpha}), transparent 70%)`,
                      boxShadow: `0 0 10px hsla(${b.hue},${sat}%,${light}%,.7)`,
                      transform: "translate(-50%, -50%)",
                      animation: `sparkPuzzle ${900 + Math.random() * 500}ms cubic-bezier(.2,.7,.2,1) ${
                        b.delay + Math.random() * 0.2
                      }s forwards`,
                      // @ts-ignore
                      "--deg": `${deg}deg`,
                      "--dist": `${dist}px`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Main component ---------- */
const PUZZLE_CHALLENGE_ID = 2; // ← id en BDD

const MagicalPuzzle: React.FC = () => {
  // === INFO (DB) ===
  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [status, setStatus] = useState<
    "unvisited" | "completed" | "failed" | "in_progress"
  >("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // NUEVO: estado local para reward/flag desde la BDD
  const [reward, setReward] = useState<string>("");
  const [flag, setFlag] = useState<string>("");

  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(true);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const jigsawRef = useRef<JigsawHandle>(null);

  // responsive width (slightly smaller than antes)
  const [width, setWidth] = useState<number>(520);
  const height = Math.round(width * (533 / 640));

  useEffect(() => {
    GameStateService.setState("puzzle", "in_progress");
  }, []);

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

    const results = readGameResults();
    setStatus(results.puzzle.status);
    setScore(results.puzzle.score);
    setCodePart(results.puzzle.codePart);

    const unsub = onGameResultsChange((r) => {
      setStatus(r.puzzle.status);
      setScore(r.puzzle.score);
      setCodePart(r.puzzle.codePart);
    });

    // preload image
    const img = new Image();
    img.onload = () => setReadyUrl(IMG_URL);
    img.onerror = () => setReadyUrl(FALLBACK_URL);
    img.src = IMG_URL;

    // responsive width
    const handleResize = () => {
      const vw = window.innerWidth;
      const byWidth = Math.floor(vw - 80);
      const w = Math.min(520, Math.max(300, byWidth));
      setWidth(w);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      unsub();
    };
  }, []);

  // === fetch title/description from DB ===
  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    challengeService
      .getInfo(PUZZLE_CHALLENGE_ID)
      .then((data) => {
        if (!cancelled) {
          setInfo(data);
          // eslint-disable-next-line no-console
          console.log("[MagicalPuzzle] info from DB:", data);
        }
      })
      .catch((e) => !cancelled && setInfoError(e?.response?.data?.error ?? e.message))
      .finally(() => !cancelled && setLoadingInfo(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Hacemos async para poder leer la BDD al completar
  const handleSolved = async () => {
    const elapsedMs = Date.now() - startRef.current;
    setRunning(false);
    setElapsed(elapsedMs);
    setSolvedThisSession(true);

    const newScore = computeScore(elapsedMs);
    setScore(newScore);

    // === Recuperar FLAG + REWARD reales desde BDD (como en los otros juegos) ===
    try {
      const ch = await challengeService.getById(PUZZLE_CHALLENGE_ID); // id = 2
      const rewardReal = ch.reward || codePartFor("puzzle"); // fallback por si acaso
      const flagReal = ch.flag || "";

      setReward(rewardReal);
      setFlag(flagReal);

      GameStateService.setState("puzzle", "completed");
      reportGameResult("puzzle", {
        status: "completed",
        score: newScore,
        codePart: rewardReal, // publicar la clé real
      });
    } catch {
      const fallback = codePartFor("puzzle");
      setReward(fallback);

      GameStateService.setState("puzzle", "completed");
      reportGameResult("puzzle", {
        status: "completed",
        score: newScore,
        codePart: fallback,
      });
    }
  };

  const restartTimer = () => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800 text-amber-50">
      {/* magic background */}
      <Stars />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,.28)_70%)]" />

      {/* close */}
      <div className="absolute left-3 top-3 z-20 scale-95">
        <ThickBorderCloseButton />
      </div>

      {/* fireworks on success */}
      <Fireworks show={solvedThisSession && status === "completed"} />

      {/* header — uses DB (fallback to static) */}
      <header className="relative z-10 mx-auto max-w-4xl px-4 pt-8 pb-3 text-center">
        {loadingInfo && (
          <p className="text-amber-100/80">Chargement de la description…</p>
        )}
        {infoError && (
          <p className="text-red-200">Erreur : {infoError}</p>
        )}
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-200 drop-shadow-[0_2px_10px_rgba(251,191,36,.3)]">
          {info?.title ?? "Puzzle Enchanté — Jardins de Villandry"}
        </h1>
        <p className="mt-1 text-sm md:text-base text-amber-100/85" style={{ whiteSpace: "pre-line" }}>
          {info?.description ?? "Reconstitue l’image pour révéler la clé magique."}
        </p>
      </header>

      {/* main card (compact paddings) */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-10">
        <div className="rounded-2xl border-2 border-amber-900/70 bg-white/10 backdrop-blur-xl p-3 md:p-4 shadow-2xl">
          {/* controls top-right */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => jigsawRef.current?.solveNow()}
              className="rounded-md border-2 border-amber-900 bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-1.5 text-sm font-semibold text-amber-950 shadow-[0_10px_24px_-12px_rgba(0,0,0,.5)] hover:from-amber-200 hover:to-amber-400 active:translate-y-[1px] transition"
              title="Résoudre automatiquement"
            >
              ✨ Résoudre auto
            </button>
          </div>

          {/* jigsaw frame */}
          <div className="rounded-xl border-2 border-amber-800/60 bg-amber-50/10 p-2 shadow-inner grid place-items-center">
            {!readyUrl ? (
              <div
                className="grid place-items-center rounded-lg bg-white/95 text-stone-700"
                style={{ width, height }}
              >
                Chargement de l’image…
              </div>
            ) : (
              <Jigsaw
                ref={jigsawRef}
                imageUrl={readyUrl}
                width={width}
                onSolved={handleSolved}
                onShuffle={restartTimer}
              />
            )}
          </div>

          {/* metrics */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-2 text-center">
              <div className="text-[11px] text-amber-100/80">Temps</div>
              <div className="text-lg font-extrabold text-amber-200">
                {formatDuration(elapsed)}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-2 text-center">
              <div className="text-[11px] text-amber-100/80">Score</div>
              <div className="text-lg font-extrabold text-amber-200">{score}</div>
            </div>
            <div className="rounded-lg border border-amber-200/40 bg-white/10 p-2 text-center">
              <div className="text-[11px] text-amber-100/80">Statut</div>
              <div className="text-lg font-extrabold text-amber-200">
                {status === "completed"
                  ? "Terminé"
                  : status === "failed"
                  ? "Échoué"
                  : status === "in_progress"
                  ? "En cours"
                  : "Non visité"}
              </div>
            </div>
          </div>

          {/* key — mostrar siempre que esté completado; preferimos reward de BDD y, si no, codePart */}
          {status === "completed" && (reward || codePart) && (
            <div className="mt-3 rounded-xl border-2 border-amber-900/70 bg-white/10 p-3">
              <div className="font-bold mb-1">Clé</div>
              <div className="rounded-lg border-2 border-dashed border-amber-900 bg-amber-50/90 px-3 py-1.5 text-amber-950 inline-block">
                {reward || codePart}
              </div>
            </div>
          )}

          {/* (Opcional) FLAG */}
          {status === "completed" && flag && (
            <div className="mt-2 rounded-xl border-2 border-amber-900/70 bg-white/10 p-3">
              <div className="font-bold mb-1">FLAG</div>
              <div className="rounded-lg border-2 border-dashed border-amber-900 bg-amber-50/90 px-3 py-1.5 text-amber-950 inline-block">
                {flag}
              </div>
            </div>
          )}

          {/* back link */}
          <div className="text-center mt-4">
            <Link
              to="/dashboard"
              className="inline-block rounded-md border-2 border-amber-900 bg-white/80 px-3 py-1.5 text-sm font-semibold text-amber-950 hover:bg-white transition"
            >
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MagicalPuzzle;
