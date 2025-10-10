// src/pages/MagicalBrissacEnigma.tsx
import { useEffect, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/magical-home.css";

import {
  codePartFor,
  reportGameResult,
} from "../state/gameResults";

// === INFO (BDD) ===
import challengeService from "../services/challengeService";
import type { Info } from "../services/infoService";

/**
 * Magical Brissac Enigma — Version féerique et fonctionnelle ✨
 * Récupère le titre et la description depuis la BDD (table `infos`)
 * via GET /challenges/:challengeId/info
 */
export default function MagicalBrissacEnigma() {
  // --- game state ---
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [codePart, setCodePart] = useState("");
  const [solved, setSolved] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [message, setMessage] = useState("");

  // --- DB info state ---
  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  // challengeId pour Brissac (modifie si tu as un autre id en seed)
  const BRISSAC_CHALLENGE_ID = 4;

  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);

    challengeService
      .getInfo(BRISSAC_CHALLENGE_ID)
      .then((data) => {
        if (cancelled) return;
        setInfo(data);
        // aide au debug si algoire: voir ce qui vient de l'API
        // eslint-disable-next-line no-console
        console.log("[BrissacEnigma] info from API:", data);
      })
      .catch((e) => {
        if (cancelled) return;
        setInfoError(e?.response?.data?.error ?? e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- puzzle constants ---
  const hints = [
    "🔮 Essaie de décaler chaque lettre dans l'alphabet...",
    "🔑 Le décalage est constant pour toutes les lettres.",
    "🧭 Essaie de décaler de 10 positions en arrière.",
    "👻 Le nom est lié à la légende d’un fantôme vert...",
  ];
  const CIPHERTEXT = "NKWO FOBDO";
  const VALID_ANSWERS = ["DAME VERTE", "LA DAME VERTE"];

  function normalize(s: string) {
    return s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempts((a) => a + 1);
    const clean = normalize(answer);

    if (VALID_ANSWERS.some((v) => normalize(v) === clean)) {
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
      {/* étoilettes d’arrière-plan gérées par magical-home.css */}
      <div className="magical-content">
        <ThickBorderCloseButton />

        {/* Titre + description depuis BDD */}
        <div className="magical-header">
          {loadingInfo && (
            <p className="magical-loading">Chargement de la description…</p>
          )}
          {infoError && (
            <p className="magical-error-box">Erreur : {infoError}</p>
          )}
          {info ? (
            <>
              <h1 className="magical-title">{info.title}</h1>
              {info.description && (
                <p className="magical-subtitle" style={{ whiteSpace: "pre-line" }}>
                  {info.description}
                </p>
              )}
            </>
          ) : (
            !loadingInfo &&
            !infoError && (
              <>
                <h1 className="magical-title">Énigme de Brissac</h1>
                <p className="magical-subtitle">
                  Trouve le nom caché dans ce code mystérieux :
                </p>
              </>
            )
          )}
        </div>

        {/* Riddle block */}
        <div className="magical-riddle">
          <p className="magical-code">{CIPHERTEXT}</p>
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

        {/* Form */}
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

        {/* Stats */}
        <div className="magical-stats">
          <p>Tentatives : {attempts}</p>
          <p>Indices utilisés : {hintsUsed}</p>
        </div>

        {/* Feedback */}
        {message && (
          <div
            className={`magical-message ${
              solved ? "magical-success" : "magical-error"
            }`}
          >
            {message}
          </div>
        )}

        {/* Key on success */}
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
