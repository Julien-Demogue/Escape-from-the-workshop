import { useMemo, useState } from "react";
import chambordBlason from "../assets/images/blason/blason-chambord.png"; // opcional, cambia la ruta si quieres otra imagen

/**
 * Enigma:
 * "Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
 * Combien de fois suis-je représenté ?"
 *
 * Emblème: la salamandre de François Ier.
 * Ajusta la respuesta si manejas otra cifra.
 */
const CORRECT_ANSWER = 300;      // <-- cámbiala si corresponde
const ACCEPT_TOLERANCE = 0;      // 0 = exacto; pon, p.ej., 5 si aceptas ±5

export default function ChambordEnigma() {
  const [value, setValue] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const parsed = useMemo(() => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [value]);

  function check() {
    if (parsed === null) return;
    const ok =
      Math.abs(parsed - CORRECT_ANSWER) <= ACCEPT_TOLERANCE;

    setStatus(ok ? "correct" : "wrong");
    setTries((t) => t + 1);
  }

  function reset() {
    setValue("");
    setStatus("idle");
    setTries(0);
    setShowHint(false);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Énigme 3</h1>
        <p style={styles.subtitle}>
          « Je renais toujours des flammes. Cherche mon emblème dans les murs du château.
          Combien de fois suis-je représenté ? »
        </p>

        <img
          src={chambordBlason}
          alt="Blason de Chambord"
          style={styles.image}
        />

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
              <strong>✅ Bravo ! C’est la bonne réponse.</strong>
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
