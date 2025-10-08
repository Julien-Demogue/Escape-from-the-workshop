import React, { useEffect, useMemo, useRef, useState } from "react";
import chambordBlason from "../assets/images/blason/blason-chambord.png";

import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

/**
 * Énigme:
 * « Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
 * Combien de fois suis-je représenté ? »
 *
 * Emblème : la salamandre de François Ier.
 * Ajustez CORRECT_ANSWER si tenéis otra cifra.
 */
const CORRECT_ANSWER = 300; // <-- ajusta si corresponde
const ACCEPT_TOLERANCE = 0; // p.ej. 5 para aceptar ±5

// -------- Scoring by TIME ONLY --------
// ≤ 1:00 -> 100
// ≤ 2:00 -> 90
// ≤ 3:00 -> 80
// ≤ 5:00 -> 60
// ≤ 7:00 -> 40
// ≤ 10:00 -> 20
//  > 10:00 -> 10 (mínimo)
type TimeBand = { maxMs: number; score: number };
const BANDS: TimeBand[] = [
  { maxMs: 1 * 60 * 1000, score: 100 },
  { maxMs: 2 * 60 * 1000, score: 90 },
  { maxMs: 3 * 60 * 1000, score: 80 },
  { maxMs: 5 * 60 * 1000, score: 60 },
  { maxMs: 7 * 60 * 1000, score: 40 },
  { maxMs: 10 * 60 * 1000, score: 20 },
];
const MIN_SCORE_AFTER = 10; // si tardan más de 10 min

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

export default function ChambordEnigma() {
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

    setTries((t) => t + 1);
    setStatus(ok ? "correct" : "wrong");

    if (ok) {
      const elapsedMs = Date.now() - startRef.current;
      setRunning(false);
      setElapsed(elapsedMs);
      setSolvedThisSession(true);

      const pts = scoreByTime(elapsedMs);
      setSavedScore(pts);

      reportGameResult("chambord-enigma", {
        status: "completed",
        score: pts,
        codePart: codePartFor("chambord-enigma"),
      });
    } else {
      // opcional: marcar fallido al validar mal
      reportGameResult("chambord-enigma", { status: "failed" });
    }
  }

  function reset() {
    setValue("");
    setStatus("idle");
    setTries(0);
    setShowHint(false);
    // restart session timing
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setSolvedThisSession(false);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Énigme — Salamandre de Chambord</h1>
        <p style={styles.subtitle}>
          « Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
          Combien de fois suis-je représenté ? »
        </p>

        <img src={chambordBlason} alt="Blason de Chambord" style={styles.image} />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Ta réponse (nombre) :
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Entrez un nombre…"
            style={styles.input}
          />
        </div>

        <div style={{ marginTop: 8, color: "#6b7280" }}>
          Temps&nbsp;: <strong>{formatDuration(elapsed)}</strong>
        </div>

        <div style={styles.actions}>
          <button onClick={check} style={styles.btnPrimary} disabled={parsed === null}>
            Valider
          </button>
          <button onClick={() => setShowHint((s) => !s)} style={styles.btnGhost}>
            {showHint ? "Masquer l’indice" : "Indice"}
          </button>
          <button onClick={reset} style={styles.btnGhost}>
            Réinitialiser
          </button>
        </div>

        {showHint && (
          <div style={styles.hint}>
            🔎 Indice : l’emblème est la <strong>salamandre</strong> de François&nbsp;I<sup>er</sup>,
            souvent sculptée parmi les décors du château.
          </div>
        )}

        {status !== "idle" && (
          <div
            style={{
              ...styles.result,
              background: status === "correct" ? "#dcfce7" : "#fee2e2",
              borderColor: status === "correct" ? "#16a34a" : "#ef4444",
              color: status === "correct" ? "#14532d" : "#7f1d1d",
            }}
          >
            {status === "correct" ? (
              <>
                <strong>✅ Bravo ! C’est la bonne réponse.</strong>
                <div style={{ marginTop: 6 }}>
                  Score&nbsp;: <strong>{savedScore}</strong> — Temps&nbsp;: <strong>{formatDuration(elapsed)}</strong>
                </div>
              </>
            ) : (
              <>
                <strong>❌ Ce n’est pas la bonne réponse.</strong>
                <div style={{ marginTop: 4 }}>
                  Essaie encore — les salamandres sont partout 😉
                </div>
              </>
            )}
          </div>
        )}

        {/* Clé: visible SEULEMENT si resuelto AHORA en esta sesión */}
        {solvedThisSession && savedStatus === "completed" && codePart && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Clé</div>
            <div style={{ padding: "8px 10px", border: "2px dashed black", borderRadius: 8 }}>
              {codePart /* ce jeu apporte son mot via codePartFor("chambord-enigma") */}
            </div>
          </div>
        )}

        <p style={{ marginTop: 12, color: "#6b7280" }}>
          Tentatives : {tries}
        </p>
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
    width: "min(720px, 100%)",
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,.2)",
  },
  subtitle: {
    marginTop: 8,
    color: "#374151",
    lineHeight: 1.4,
  },
  image: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    marginTop: 8,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontSize: 16,
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #1d4ed8",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  hint: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px dashed #d1d5db",
    background: "#f9fafb",
  },
  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid",
  },
};
