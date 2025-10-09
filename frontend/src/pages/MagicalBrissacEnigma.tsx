import { useState, useEffect, useMemo } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/memory-loire.css";
import "../styles/memory-animations.css";
import "../styles/memory-riddle.css";
import {
  codePartFor,
  reportGameResult,
  readGameResults,
  onGameResultsChange,
} from "../state/gameResults";

export default function MagicalBrissacEnigma() {
  // Effet d'étoiles magiques
  const stars = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${1 + Math.random() * 2}s`,
      }
    }))
  , []);

  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solved, setSolved] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [status, setStatus] = useState<"unvisited" | "completed" | "failed">("unvisited");

  const CIPHERTEXT = "NKWO FOBDO";
  const VALID_ANSWERS = ["DAME VERTE", "LA DAME VERTE"];

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
      <div style={{ marginTop: 10, color: "#e6d5ac" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Alphabet d'aide (lecture avec décalage −{shiftBack})
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #e6d5ac", borderRadius: 12, background: "rgba(230, 213, 172, 0.1)" }}>
          <svg width="100%" height="120" viewBox="0 0 780 120">
            <rect x="0" y="0" width="780" height="120" fill="rgba(26, 28, 44, 0.95)" />
            {letters.map((ch, i) => (
              <g key={`top-${i}`}>
                <rect x={i * 30} y={10} width={30} height={40} fill="rgba(230, 213, 172, 0.1)" stroke="#e6d5ac" />
                <text x={i * 30 + 15} y={36} fontSize="18" textAnchor="middle" fill="#e6d5ac">
                  {ch}
                </text>
              </g>
            ))}
            {bottom.map((ch, i) => (
              <g key={`bot-${i}`}>
                <rect x={i * 30} y={70} width={30} height={40} fill="rgba(230, 213, 172, 0.05)" stroke="#e6d5ac" />
                <text x={i * 30 + 15} y={96} fontSize="18" textAnchor="middle" fill="#e6d5ac">
                  {ch}
                </text>
              </g>
            ))}
            <text x={5} y={8} fontSize="12" fill="#ffd700">A → Z</text>
            <text x={5} y={68} fontSize="12" fill="#ffd700">Lire avec −{shiftBack}</text>
          </svg>
        </div>
        <div style={{ color: "#ffd700", fontSize: 12, marginTop: 6 }}>
          Exemple : N → D, K → A, W → M, U → K…
        </div>
      </div>
    );
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = normalize(answer.trim());
    setAttempts(prev => prev + 1);

    const ok = VALID_ANSWERS.some((ans) => normalize(ans) === candidate);
    if (ok) {
      const pts = Math.max(100 - (hintsUsed * 20), 0);
      setScore(pts);
      setSolved(true);
      const fragment = codePartFor("brissac-enigma");
      setCodePart(fragment);
      reportGameResult("brissac-enigma", {
        status: "completed",
        score: pts,
        codePart: fragment,
      });
    } else {
      reportGameResult("brissac-enigma", { status: "failed" });
    }
  };

  const resetGame = () => {
    setAnswer("");
    setAttempts(0);
    setHintsUsed(0);
    setSolved(false);
    setCurrentHint(0);
  };

  return (
    <div className="memory-loire">
      <div className="memory-stars">
        {stars.map(star => (
          <div key={star.id} className="memory-star" style={star.style} />
        ))}
      </div>
      
      <ThickBorderCloseButton />

      <h1 className="memory-title">Énigme 4 — Brissac</h1>

      <div className="memory-content">
        <div className="memory-riddle">
          <p className="memory-instructions">Trouve le nom caché :</p>
          <p className="memory-cipher">{CIPHERTEXT}</p>
          
          <div className="memory-hints">
            {currentHint >= 1 && (
              <p className="memory-hint">
                🔎 <strong>Indice 1 :</strong> C'est un <strong>chiffrement de César</strong>.
              </p>
            )}
            {currentHint >= 2 && (
              <p className="memory-hint">
                🗝️ <strong>Indice 2 :</strong> <strong>Décalage de 10</strong>. Lis le message avec <strong>−10</strong>.
              </p>
            )}
            {currentHint >= 3 && (
              <div className="memory-hint">
                🔤 <strong>Indice 3 :</strong> Utilise cet alphabet pour décoder à la main :
                <CaesarAlphabetDiagram shiftBack={10} />
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="memory-form">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tape le nom décodé..."
            className="memory-input"
            disabled={solved}
          />
          
          <div className="memory-controls">
            <button type="submit" className="memory-button" disabled={solved || !answer.trim()}>
              Valider
            </button>
            <button
              type="button"
              className="memory-button"
              onClick={() => {
                if (currentHint < 3) {
                  setCurrentHint(prev => prev + 1);
                  setHintsUsed(prev => prev + 1);
                }
              }}
              disabled={solved || currentHint >= 3}
            >
              Indice {currentHint}/3
            </button>
            <button 
              type="button" 
              className="memory-button"
              onClick={resetGame}
            >
              Réinitialiser
            </button>
          </div>
        </form>

        <div className="memory-meta">
          <p>Tentatives : {attempts}</p>
          <p>Indices utilisés : {hintsUsed}</p>
        </div>

        {solved && (
          <div className="memory-success">
            <h2>Félicitations !</h2>
            <div className="memory-score">Score : {score}</div>
            {codePart && (
              <div className="memory-key">
                <div className="memory-key-label">Clé</div>
                <div className="memory-key-code">{codePart}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}