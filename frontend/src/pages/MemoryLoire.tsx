import { useEffect, useMemo, useState } from "react";
import { buildMemoryDeck, type DeckCard } from "../utils/buildMemoryDeck";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";

type PlayCard = DeckCard & { revealed: boolean; matched: boolean };

const PAIRS = 20;                 // 20 parejas -> 40 cartas -> 5 filas x 8 columnas
const FLIP_BACK_DELAY_MS = 800;

export default function MemoryLoire() {
  const base = useMemo(
    () =>
      buildMemoryDeck({
        desiredPairs: PAIRS,
        buckets: ["blason"],
        placeholderLabel: "Coming soon",
      }),
    []
  );

  const [cards, setCards] = useState<PlayCard[]>(
    () => base.map((c) => ({ ...c, revealed: false, matched: false }))
  );
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true);
    }
  }, [cards]);

  function resetGame() {
    const reshuffled = buildMemoryDeck({
      desiredPairs: PAIRS,
      buckets: ["blason"],
      placeholderLabel: "Coming soon",
    }).map((c) => ({ ...c, revealed: false, matched: false }));
    setCards(reshuffled);
    setFlippedIds([]);
    setLock(false);
    setMoves(0);
    setWon(false);
  }

  function onCardClick(id: string) {
    if (lock) return;
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const card = cards[idx];
    if (card.revealed || card.matched) return;

    const next = cards.slice();
    next[idx] = { ...card, revealed: true };
    setCards(next);

    const newlyFlipped = [...flippedIds, id];
    if (newlyFlipped.length < 2) return setFlippedIds(newlyFlipped);

    setLock(true);
    setMoves((m) => m + 1);
    const [idA, idB] = newlyFlipped;
    const a = next.find((c) => c.id === idA)!;
    const b = next.find((c) => c.id === idB)!;

    if (a.pairId === b.pairId) {
      const after = next.map((c) =>
        c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
      );
      setTimeout(() => {
        setCards(after);
        setFlippedIds([]);
        setLock(false);
      }, 200);
    } else {
      setTimeout(() => {
        const after = next.map((c) =>
          c.id === a.id || c.id === b.id ? { ...c, revealed: false } : c
        );
        setCards(after);
        setFlippedIds([]);
        setLock(false);
      }, FLIP_BACK_DELAY_MS);
    }
  }

  return (
    <div style={{ margin: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <ThickBorderCloseButton />
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>Loire Memory — {PAIRS} pairs</h1>
        <div style={styles.meta}>
          <span>Moves: <strong>{moves}</strong></span>
          <button onClick={resetGame} style={styles.resetBtn}>Restart</button>
        </div>
      </div>

      {/* Contenedor con ancho máximo para 8 columnas cómodas */}
      <div style={styles.board}>
        <div style={styles.grid}>
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => onCardClick(c.id)}
              disabled={lock || (c.revealed && flippedIds.length === 2) || c.matched}
              aria-label={c.label}
              style={{ ...styles.cardBtn, ...(c.matched ? styles.cardMatched : {}) }}
            >
              <div style={{ ...styles.cardFace, opacity: c.revealed || c.matched ? 1 : 0 }}>
                <img src={c.img} alt={c.label} loading="lazy" style={styles.img} />
                <div style={styles.caption}>{c.label}</div>
              </div>
              <div style={{ ...styles.cardBack, opacity: c.revealed || c.matched ? 0 : 1 }}>
                <div style={styles.backInner}>?</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {won && (
        <div style={styles.winBox}>
          🎉 You matched all pairs in <strong>{moves}</strong> moves!
          <button onClick={resetGame} style={{ ...styles.resetBtn, marginLeft: 10 }}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 16 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  meta: { display: "flex", alignItems: "center", gap: 10 },
  resetBtn: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white",
    cursor: "pointer", fontWeight: 600,
  },

  // === Ajustes de tablero 5x8 y cuadros un poco más chicos ===
  board: {
    marginInline: "auto",
    maxWidth: "1200px", // Augmentation significative de la largeur maximale
    width: "100%",
    padding: "20px"
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", // Responsive avec une taille minimum
    justifyItems: "center",
  },
  cardBtn: {
    position: "relative",
    width: "140px",
    height: "180px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    margin: "4px",
  },
  cardMatched: { boxShadow: "inset 0 0 0 2px #16a34a" },
  cardFace: {
    position: "absolute", 
    inset: 0, 
    display: "flex",
    flexDirection: "column",
    background: "white", 
    border: "2px solid #e5e7eb", 
    borderRadius: 12,
    transition: "opacity 140ms ease", 
    overflow: "hidden",
  },
  cardBack: {
    position: "absolute", 
    inset: 0, 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12, 
    background: "#e5e7eb", 
    border: "2px solid #e5e7eb",
    transition: "opacity 140ms ease",
  },
  backInner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%", 
    height: "80%", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10, 
    background: "#c7d2fe", 
    fontSize: 48, 
    fontWeight: 700, 
    color: "#111827",
    boxShadow: "inset 0 0 0 3px #93c5fd",
  },
  img: { 
    width: "100%", 
    height: "85%",  // Laisse de l'espace pour la légende
    objectFit: "contain", 
    background: "#f8fafc",
    padding: "12px",
  },
  caption: {
    fontSize: 12, 
    color: "#6b7280", 
    padding: "6px 8px", 
    textAlign: "center",
    borderTop: "1px solid #f3f4f6",
  },
  winBox: { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#f0fdf4" },
};
