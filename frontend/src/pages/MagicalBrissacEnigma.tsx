import { useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/magical-home.css";
import {
  codePartFor,
  reportGameResult,
} from "../state/gameResults";

/**
 * Magical Brissac Enigma — Version féerique et fonctionnelle ✨
 */
export default function MagicalBrissacEnigma() {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solved, setSolved] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [message, setMessage] = useState("");

  const hints = [
    "🔮 Essaie de décaler chaque lettre dans l'alphabet...",
    "🔑 Le décalage est constant pour toutes les lettres.",
    "🧭 Essaie de décaler de 10 positions en arrière.",
    "👻 Le nom est lié à la légende d’un fantôme vert...",
  ];

  const VALID_ANSWERS = ["DAME VERTE", "LA DAME VERTE"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempts((a) => a + 1);
    const clean = answer.trim().toUpperCase();

    if (VALID_ANSWERS.some((v) => v === clean)) {
      const pts = Math.max(100 - hintsUsed * 20, 40);
      setScore(pts);
      setSolved(true);
      setMessage("✨ Bravo ! Tu as percé le secret de Brissac !");
      const fragment = codePartFor("brissac-enigma");
      setCodePart(fragment);
      reportGameResult("brissac-enigma", {
        status: "completed",
        score: pts,
        codePart: fragment,
      });
    } else {
      setMessage("❌ Pas tout à fait... essaie encore !");
    }
  };

  const handleHint = () => {
    if (currentHint < hints.length) {
      setCurrentHint((n) => n + 1);
      setHintsUsed((n) => n + 1);
    }
  };

  const resetGame = () => {
    setAnswer("");
    setAttempts(0);
    setHintsUsed(0);
    setScore(0);
    setSolved(false);
    setCurrentHint(0);
    setMessage("");
  };

  return (
    <div className="magical-container">
      <div className="magical-content">
        <ThickBorderCloseButton />

        <h1 className="magical-title">Énigme de Brissac</h1>
        <p className="magical-subtitle">
          Trouve le nom caché dans ce code mystérieux :
        </p>

        <div className="magical-riddle">
          <p className="magical-code">NKWO FOBDO</p>
          {currentHint > 0 && (
            <div className="magical-hints">
              {hints.slice(0, currentHint).map((hint, i) => (
                <p key={i} className="magical-hint">
                  {hint}
                </p>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="magical-form">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tape le nom décodé..."
            className="magical-input"
            disabled={solved}
          />
          <div className="magical-buttons">
            <button
              type="submit"
              className="magical-button"
              disabled={!answer.trim() || solved}
            >
              Valider
            </button>
            <button
              type="button"
              className="magical-button"
              onClick={handleHint}
              disabled={solved || currentHint >= hints.length}
            >
              Indice {currentHint}/{hints.length}
            </button>
            <button
              type="button"
              className="magical-button"
              onClick={resetGame}
            >
              Réinitialiser
            </button>
          </div>
        </form>

        <div className="magical-stats">
          <p>Tentatives : {attempts}</p>
          <p>Indices utilisés : {hintsUsed}</p>
        </div>

        {message && (
          <div
            className={`magical-message ${
              solved ? "magical-success" : "magical-error"
            }`}
          >
            {message}
          </div>
        )}

        {solved && (
          <div className="magical-key">
            <h2 className="magical-key-title">Clé mystique</h2>
            <div className="magical-key-code">{codePart}</div>
            <div className="magical-score">Score : {score}</div>
          </div>
        )}
      </div>
    </div>
  );
}
