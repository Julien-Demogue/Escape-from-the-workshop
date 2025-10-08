// src/pages/BrissacEnigma.tsx
import React, { useEffect, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

// Cipher data
const CIPHERTEXT = "NKWO FOBDO";
const VALID_ANSWERS = ["DAME VERTE", "LA DAME VERTE"];

// --- helpers ---
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip accents
    .replace(/[^a-zA-Z]/g, "")      // remove spaces/punct
    .toUpperCase();
}

// Inline alphabet diagram: top row A–Z, bottom row shifted backward by `shiftBack`
function CaesarAlphabetDiagram({ shiftBack = 10 }: { shiftBack?: number }) {
  const A = "A".charCodeAt(0);
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(A + i));
  const bottom = letters.map((_, i) =>
    String.fromCharCode(A + (((i - shiftBack) % 26 + 26) % 26))
  );

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Alphabet d’aide (lecture avec décalage −{shiftBack})
      </div>
      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <svg width="100%" height="120" viewBox="0 0 780 120">
          <rect x="0" y="0" width="780" height="120" fill="#ffffff" />
          {letters.map((ch, i) => (
            <g key={`top-${i}`}>
              <rect x={i * 30} y={10} width={30} height={40} fill="#f3f4f6" stroke="#e5e7eb" />
              <text x={i * 30 + 15} y={36} fontSize="18" textAnchor="middle" fill="#111827">
                {ch}
              </text>
            </g>
          ))}
          {bottom.map((ch, i) => (
            <g key={`bot-${i}`}>
              <rect x={i * 30} y={70} width={30} height={40} fill="#ffffff" stroke="#e5e7eb" />
              <text x={i * 30 + 15} y={96} fontSize="18" textAnchor="middle" fill="#111827">
                {ch}
              </text>
            </g>
          ))}
          <text x={5} y={8} fontSize="12" fill="#6b7280">A → Z</text>
          <text x={5} y={68} fontSize="12" fill="#6b7280">Lire avec −{shiftBack}</text>
        </svg>
      </div>
      <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
        Exemple : N → D, K → A, W → M, U → K…
      </div>
    </div>
  );
}

// ---- scoring: only hints affect points ----
// Base 100, -20 per hint shown (1..3). Min 0.
function computeScoreByHints(hintLevel: 0 | 1 | 2 | 3): number {
  const base = 100;
  const penaltyPerHint = 20;
  const score = base - hintLevel * penaltyPerHint;
  return Math.max(0, Math.min(100, score));
}

export default function BrissacEnigma() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "ko">("idle");
  const [tries, setTries] = useState(0);
  // 0 = no hints, 1 = Caesar, 2 = shift 10, 3 = alphabet
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);

  // persisted result + key gating
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");
  const [score, setScore] = useState<number>(0);
  const [codePart, setCodePart] = useState<string>("");
  const [solvedThisSession, setSolvedThisSession] = useState<boolean>(false);

  // load saved + subscribe
  useEffect(() => {
    const saved = readGameResults();
    setStatus(saved["brissac-enigma"].status);
    setScore(saved["brissac-enigma"].score);
    setCodePart(saved["brissac-enigma"].codePart);

    return onGameResultsChange((r) => {
      setStatus(r["brissac-enigma"].status);
      setScore(r["brissac-enigma"].score);
      setCodePart(r["brissac-enigma"].codePart);
    });
  }, []);

  function submit() {
    const candidate = normalize(value);
    const ok = VALID_ANSWERS.some((ans) => normalize(ans) === candidate);
    setState(ok ? "ok" : "ko");
    setTries((t) => t + 1);

    if (ok) {
      const pts = computeScoreByHints(hintLevel);
      setScore(pts);
      setSolvedThisSession(true);
      reportGameResult("brissac-enigma", {
        status: "completed",
        score: pts,
        codePart: codePartFor("brissac-enigma"), // 🔑 part du code pour ce jeu
      });
    } else {
      // marquer échoué (optionnel)
      reportGameResult("brissac-enigma", { status: "failed" });
    }
  }

  function reset() {
    setValue("");
    setState("idle");
    setTries(0);
    setHintLevel(0);
    setSolvedThisSession(false);
  }

  function showHint() {
    setHintLevel((h) => (h < 3 ? ((h + 1) as 0 | 1 | 2 | 3) : h));
  }

  return (
    <div style={styles.wrap}>
      <ThickBorderCloseButton />
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Énigme 4 — Brissac</h1>
        <p style={styles.subtitle}>
          Trouve le nom caché : <strong>{CIPHERTEXT}</strong>
        </p>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Ta réponse :
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tape le nom décodé…"
            style={styles.input}
          />
        </div>

        <div style={styles.actions}>
          <button onClick={submit} style={styles.btnPrimary} disabled={!value.trim()}>
            Valider
          </button>
          <button onClick={showHint} style={styles.btnGhost}>
            {hintLevel === 0 ? "Indice" : hintLevel < 3 ? "Un autre indice" : "Tous les indices affichés"}
          </button>
          <button onClick={reset} style={styles.btnGhost}>
            Réinitialiser
          </button>
        </div>

        {/* INDICES */}
        {hintLevel >= 1 && (
          <div style={styles.hint}>
            🔎 <strong>Indice 1 :</strong> C’est un <strong>chiffrement de César</strong>.
          </div>
        )}
        {hintLevel >= 2 && (
          <div style={styles.hint}>
            🗝️ <strong>Indice 2 :</strong> <strong>Décalage de 10</strong>. Lis le message avec <strong>−10</strong>.
          </div>
        )}
        {hintLevel >= 3 && (
          <div style={styles.hint}>
            🔤 <strong>Indice 3 :</strong> Utilise cet alphabet pour décoder à la main :
            <CaesarAlphabetDiagram shiftBack={10} />
          </div>
        )}

        {state !== "idle" && (
          <div
            style={{
              ...styles.result,
              background: state === "ok" ? "#dcfce7" : "#fee2e2",
              borderColor: state === "ok" ? "#16a34a" : "#ef4444",
              color: state === "ok" ? "#14532d" : "#7f1d1d",
            }}
          >
            {state === "ok" ? (
              <>
                <strong>✅ Correct !</strong>
                <div style={{ marginTop: 6 }}>
                  Score&nbsp;: <strong>{score}</strong>
                  <span style={{ color: "#6b7280" }}> &nbsp; (pénalité indices : −{hintLevel * 20})</span>
                </div>
              </>
            ) : (
              "❌ Pas tout à fait. Essaie encore."
            )}
          </div>
        )}

        {/* 🔑 Clé — visible seulement si résolu MAINTENANT dans cette session */}
        {solvedThisSession && status === "completed" && codePart && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Clé</div>
            <div style={{ padding: "8px 10px", border: "2px dashed black", borderRadius: 8 }}>
              {codePart /* ce jeu ajoute sa part via codePartFor("brissac-enigma") */}
            </div>
          </div>
        )}

        <p style={{ marginTop: 12, color: "#6b7280" }}>
          Tentatives : {tries} &nbsp;•&nbsp; Indices utilisés : {hintLevel}
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
  subtitle: { marginTop: 8, color: "#374151" },
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
