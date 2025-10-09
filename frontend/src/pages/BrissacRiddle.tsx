import { useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/magical-home.css";
import {
  codePartFor,
  reportGameResult,
} from "../state/gameResults";

export default function BrissacRiddle() {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solved, setSolved] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  const hints = [
    "Essayez de décaler chaque lettre dans l'alphabet...",
    "Le décalage est constant pour toutes les lettres...",
    "Essayez de décaler de 5 positions en arrière...",
    "La réponse est un mot en rapport avec la nature..."
  ];

  const CORRECT_ANSWER = "NKWO FOBDO"; // Le code à déchiffrer

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnswer = answer.trim().toUpperCase();
    setAttempts(prev => prev + 1);

    if (cleanAnswer === CORRECT_ANSWER) {
      const newScore = Math.max(100 - (hintsUsed * 25), 25);
      setScore(newScore);
      setSolved(true);
      const fragment = codePartFor("brissac-enigma");
      setCodePart(fragment);
      reportGameResult("brissac-enigma", {
        status: "completed",
        score: newScore,
        codePart: fragment,
      });
    }
  };

  const resetGame = () => {
    setAnswer("");
    setAttempts(0);
    setHintsUsed(0);
    setSolved(false);
  };

  return (
    <div className="magical-container">
      <div className="magical-content">
        <ThickBorderCloseButton />

        <h1 className="magical-title">Énigme 4 — Brissac</h1>

        <div className="magical-riddle">
          <p>Trouve le nom caché :</p>
          <p className="magical-code">NKWO FOBDO</p>
          {currentHint > 0 && (
            <div className="magical-hints">
              {hints.slice(0, currentHint).map((hint, index) => (
                <p key={index} className="magical-hint">
                  Indice {index + 1}: {hint}
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
            <button type="submit" className="magical-button" disabled={solved}>
              Valider
            </button>
            <button
              type="button"
              className="magical-button"
              onClick={() => {
                if (currentHint < hints.length) {
                  setCurrentHint(prev => prev + 1);
                  setHintsUsed(prev => prev + 1);
                }
              }}
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

        {solved && (
          <div className="magical-success">
            <h2>Félicitations !</h2>
            <div className="magical-score">Score : {score}</div>
            {codePart && (
              <div className="magical-key">
                <div className="magical-key-label">Clé</div>
                <div className="magical-key-code">{codePart}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}