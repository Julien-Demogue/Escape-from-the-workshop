// src/pages/MagicalBrissacEnigma.tsx
import { useEffect, useRef, useState } from "react";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";
import "../styles/magical-home.css";

import challengeService from "../services/challengeService";
import groupService from "../services/groupService";
import type { Info } from "../services/infoService";

import { reportGameResult, type GameId } from "../state/gameResults";

/**
 * Enigma Brissac — conectado a BDD (usando sólo endpoints existentes)
 * - Lee título/descr. desde `infos` (getInfo).
 * - Si el grupo YA lo completó -> bloquea y muestra FLAG + reward (clé).
 * - Si validas correcto:
 *    • obtiene FLAG y REWARD reales del challenge (getById),
 *    • marca en BDD isCompleted=1 para el grupo (completeChallenge),
 *    • bloquea y muestra FLAG + score + clé (reward),
 *    • publica el resultado en el store local para el dashboard.
 */

const GAME_KEY: GameId = "brissac-enigma";
const CHALLENGE_ID = 4;

const HINTS = [
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

function computeScoreFromHints(hintsUsed: number) {
  return Math.max(100 - hintsUsed * 20, 40);
}

export default function MagicalBrissacEnigma() {
  // --- juego/UI ---
  const [answer, setAnswer] = useState("");
  const [attemptsLocal, setAttemptsLocal] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  const [flag, setFlag] = useState("");     // FLAG real desde BDD
  const [reward, setReward] = useState(""); // REWARD (clé) real desde BDD
  const [solved, setSolved] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [message, setMessage] = useState("");

  // --- info (BDD) ---
  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  // --- control de equipo / polling ---
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // título/descripcion desde infos
  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);

    challengeService
      .getInfo(CHALLENGE_ID)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((e) => {
        if (!cancelled) setInfoError(e?.response?.data?.error ?? e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // si el grupo YA lo resolvió, bloquear y mostrar flag + reward
  useEffect(() => {
    let cancelled = false;

    async function checkGroupCompletion() {
      const storedGroup = localStorage.getItem("groupId");
      const groupId = storedGroup ? parseInt(storedGroup, 10) : NaN;
      if (Number.isNaN(groupId)) return;

      try {
        const completed = await groupService.getCompletedChallenges(groupId);
        if (Array.isArray(completed) && completed.includes(GAME_KEY)) {
          // ya resuelto → leer flag y reward, bloquear
          const ch = await challengeService.getById(CHALLENGE_ID);
          if (cancelled) return;
          setSolved(true);
          setFlag(ch.flag || "");
          setReward(ch.reward || "");
          setMessage("✅ Ce défi a déjà été résolu par ton équipe.");
          reportGameResult(GAME_KEY, {
            status: "completed",
            codePart: ch.reward || "", // la clé para el enigma final
          });
        }
      } catch {
        /* ignore */
      }
    }

    checkGroupCompletion();

    // polling para detectar resolución por otro integrante
    if (!pollRef.current) {
      pollRef.current = setInterval(checkGroupCompletion, 5000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      cancelled = true;
    };
  }, []);

  // submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (solved) return;

    setAttemptsLocal((a) => a + 1);

    const clean = normalize(answer);
    const isOk = VALID_ANSWERS.some((v) => normalize(v) === clean);

    if (!isOk) {
      setMessage("❌ Pas tout à fait... essaie encore !");
      return;
    }

    const pts = computeScoreFromHints(hintsUsed);
    setScore(pts);

    try {
      // 1) obtener FLAG y REWARD reales del challenge
      const ch = await challengeService.getById(CHALLENGE_ID);
      const flagReal = ch.flag || "";
      const rewardReal = ch.reward || "";
      setFlag(flagReal);
      setReward(rewardReal);

      // 2) marcar en BDD isCompleted=1 para el grupo
      const storedGroup = localStorage.getItem("groupId");
      const groupId = storedGroup ? parseInt(storedGroup, 10) : NaN;
      if (!Number.isNaN(groupId)) {
        await groupService.completeChallenge(groupId, CHALLENGE_ID);
      }

      // 3) actualizar store local para UI/Dashboard (clave = reward)
      reportGameResult(GAME_KEY, {
        status: "completed",
        score: pts,          // hoy no se persiste en BDD (no hay endpoint), pero se muestra
        codePart: rewardReal // para enigma final
      });

      setSolved(true);
      setMessage("✨ Bravo ! Tu as percé le secret de Brissac !");
    } catch (err) {
      // si algo falla, no marcamos como resuelto
      console.warn("Brissac submit failed:", err);
      setMessage("⚠️ Erreur réseau. Réessaie dans un instant.");
    }
  };

  const handleHint = () => {
    if (solved) return;
    if (currentHint < HINTS.length) {
      setCurrentHint((n) => n + 1);
      setHintsUsed((n) => n + 1);
    }
  };

  const resetLocal = () => {
    if (solved) return; // no se puede reiniciar si ya está resuelto por el equipo
    setAnswer("");
    setCurrentHint(0);
    setHintsUsed(0);
    setMessage("");
    // attemptsLocal queda como histórico local de sesión
  };

  return (
    <div className="magical-container">
      <div className="magical-content">
        <ThickBorderCloseButton />

        {/* Header con BDD */}
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

        {/* Enigma */}
        <div className="magical-riddle">
          <p className="magical-code">{CIPHERTEXT}</p>
          {currentHint > 0 && (
            <div className="magical-hints">
              {HINTS.slice(0, currentHint).map((hint, i) => (
                <p key={i} className="magical-hint">
                  {hint}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Formulario */}
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
              disabled={solved || currentHint >= HINTS.length}
            >
              Indice {currentHint}/{HINTS.length}
            </button>
            <button
              type="button"
              className="magical-button"
              onClick={resetLocal}
              disabled={solved}
            >
              Réinitialiser
            </button>
          </div>
        </form>

        {/* Stats locales */}
        <div className="magical-stats">
          <p>Indices utilisés : {hintsUsed}</p>
        </div>

        {/* Mensajes */}
        {message && (
          <div
            className={`magical-message ${
              solved ? "magical-success" : "magical-error"
            }`}
          >
            {message}
          </div>
        )}

        {/* Resultado final */}
        {solved && (
          <div className="magical-key">
            <h2 className="magical-key-title">Résultat</h2>

            {/* FLAG (lo que pediste mostrar explícitamente) */}
            <div className="magical-key-code" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, marginRight: 8 }}>FLAG :</span>{flag}
            </div>

            {/* Clé (reward) para el enigma final */}
            {reward && (
              <div className="magical-key-code" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 700, marginRight: 8 }}>Clé :</span>{reward}
              </div>
            )}

            {/* Score local (como no hay endpoint/columna aún, no se persiste en BDD) */}
            {score !== null && (
              <div className="magical-score">Score : {score}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
