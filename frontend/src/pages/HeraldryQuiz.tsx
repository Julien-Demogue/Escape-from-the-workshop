import { useMemo, useState } from "react";

import chambord from "../assets/images/blason/blason-chambord.png";
import cheverny from "../assets/images/blason/Blason_cheverny41.svg.png";
import blois from "../assets/images/blason/Blason_de_Blois.png";
import azay from "../assets/images/blason/blason-azay-le-rideau.png";
import chenonceaux from "../assets/images/blason/blason-chenonceaux.png";
import amboise from "../assets/images/blason/Blason_ville_fr_Amboise_(Indre-et-Loire).svg.png";
import saumur from "../assets/images/blason/blason-saumur.png";
import villandry from "../assets/images/blason/Blason_ville_fr_Villandry_(Indre-et-Loire).svg.png";

type Question = {
  id: string;
  img: string;
  options: string[];      // 4 answer choices
  correctIndex: number;   // index (0..3) of the correct one within "options"
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

type Shuffled = {
  // map from visible index -> original index
  map: number[];
  // shuffled options to display
  opts: string[];
};

// Shuffle the 4 options while preserving which one is correct
function shuffleOptions(q: Question): Shuffled {
  const idxs = [0, 1, 2, 3];
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return { map: idxs, opts: idxs.map((i) => q.options[i]) };
}

export default function HeraldryQuiz() {
  const [step, setStep] = useState(0);              // current question index
  const [answers, setAnswers] = useState<number[]>([]);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [runId, setRunId] = useState(0);            // used to reshuffle on restart
  const [locked, setLocked] = useState(false);      // prevents double-clicks

  // Each question gets a stable shuffle for this run
  const mixes = useMemo(() => QUESTIONS.map((q) => shuffleOptions(q)), [runId]);

  const q = QUESTIONS[step];
  const mix = mixes[step];
  const progressPct = Math.round((step / QUESTIONS.length) * 100);

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

    // Small delay so the pressed button state is visible
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep((s) => s + 1);
        setLocked(false);
      } else {
        const allCorrect = [...correctFlags, isCorrect].every(Boolean);
        if (allCorrect) {
          alert("🎉 You win! All answers are correct.");
        } else {
          alert("❌ There was at least one mistake. You'll need to start over.");
        }
        hardReset();
      }
    }, 120);
  }

  function hardReset() {
    setStep(0);
    setAnswers([]);
    setCorrectFlags([]);
    setRunId((x) => x + 1); // new run → new shuffles
    setLocked(false);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Guess the Coat of Arms</h1>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
        </div>

        <p style={styles.meta}>
          Question {step + 1} of {QUESTIONS.length}
        </p>

        <img
          src={q.img}
          alt={`Coat of arms ${q.id}`}
          style={styles.image}
          draggable={false}
        />

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
          The game moves on even if you pick a wrong answer. If there is any
          mistake by the end, you will restart from the first question until
          you get them all right.
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
