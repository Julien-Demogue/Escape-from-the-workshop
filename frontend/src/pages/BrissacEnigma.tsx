// src/pages/BrissacEnigma.tsx
import { useState } from "react";

// If you prefer an image for the alphabet, add it and use the <img /> in Hint 3:
// import caesarAlphabetImg from "../assets/images/caesar/caesar-alphabet.png";

const CIPHERTEXT = "NKWO FOBDO";
const VALID_ANSWERS = ["DAME VERTE"]; // add variants if you like (e.g., "LA DAME VERTE")

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
        Alphabet helper (read by shifting −{shiftBack})
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
          <text x={5} y={68} fontSize="12" fill="#6b7280">Read with −{shiftBack}</text>
        </svg>
      </div>
      <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
        Example: N → D, K → A, W → M, U → K…
      </div>
    </div>
  );
}

export default function BrissacEnigma() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "ko">("idle");
  const [tries, setTries] = useState(0);
  // 0 = no hints, 1 = Caesar, 2 = shift 10, 3 = alphabet
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);

  function submit() {
    const candidate = normalize(value);
    const ok = VALID_ANSWERS.some((ans) => normalize(ans) === candidate);
    setState(ok ? "ok" : "ko");
    setTries((t) => t + 1);
  }

  function reset() {
    setValue("");
    setState("idle");
    setTries(0);
    setHintLevel(0);
  }

  function showHint() {
    setHintLevel((h) => (h < 3 ? ((h + 1) as 0 | 1 | 2 | 3) : h));
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Enigma 4 — Brissac</h1>
        <p style={styles.subtitle}>
          Find the hidden name: <strong>{CIPHERTEXT}</strong>
        </p>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Your answer:
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type the hidden name…"
            style={styles.input}
          />
        </div>

        <div style={styles.actions}>
          <button onClick={submit} style={styles.btnPrimary} disabled={!value.trim()}>
            Validate
          </button>
          <button onClick={showHint} style={styles.btnGhost}>
            {hintLevel === 0 ? "Hint" : hintLevel < 3 ? "Another hint" : "All hints shown"}
          </button>
          <button onClick={reset} style={styles.btnGhost}>
            Reset
          </button>
        </div>

        {/* HINTS */}
        {hintLevel >= 1 && (
          <div style={styles.hint}>
            🔎 <strong>Hint 1:</strong> It’s a <strong>Caesar cipher</strong>.
          </div>
        )}
        {hintLevel >= 2 && (
          <div style={styles.hint}>
            🗝️ <strong>Hint 2:</strong> <strong>Shift by 10</strong>. To read the message, shift <strong>−10</strong>.
          </div>
        )}
        {hintLevel >= 3 && (
          <div style={styles.hint}>
            🔤 <strong>Hint 3:</strong> Use this alphabet to decode by hand:
            <div style={{ marginTop: 8 }}>
              {/* Option A: show your own image */}
              {false && (
                <img
                  src={"" /* caesarAlphabetImg */}
                  alt="Caesar alphabet"
                  style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e7eb" }}
                />
              )}
              {/* Option B: inline diagram (no assets needed) */}
              <CaesarAlphabetDiagram shiftBack={10} />
            </div>
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
            {state === "ok" ? "✅ Correct!" : "❌ Not quite. Try again."}
          </div>
        )}

        <p style={{ marginTop: 12, color: "#6b7280" }}>Attempts: {tries}</p>
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
