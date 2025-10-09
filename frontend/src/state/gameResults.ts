// All code in English; UI strings can be French in pages.

export type GameId =
  | "heraldry-quiz"
  | "puzzle"
  | "memory-loire"
  | "courrier-loire"
  | "brissac-enigma"
  | "chambord-enigma";

export type GameStatus = "completed" | "failed" | "unvisited" | "in_progress";

export type GameResult = {
  status: GameStatus;
  score: number;      // 0..100 (or your scale)
  codePart: string;   // piece of the final message
};

export type GameResults = Record<GameId, GameResult>;

// Keep the canonical order here (also defines which game gives which word)
export const GAME_ORDER: GameId[] = [
  "heraldry-quiz",
  "puzzle",
  "memory-loire",
  "courrier-loire",
  "brissac-enigma",
  "chambord-enigma",
];

export const TOTAL_GAMES = GAME_ORDER.length;

export const INITIAL_RESULTS: GameResults = {
  "heraldry-quiz":  { status: "unvisited", score: 0, codePart: "" },
  "puzzle":         { status: "unvisited", score: 0, codePart: "" },
  "memory-loire":   { status: "unvisited", score: 0, codePart: "" },
  "courrier-loire": { status: "unvisited", score: 0, codePart: "" },
  "brissac-enigma": { status: "unvisited", score: 0, codePart: "" },
  "chambord-enigma":{ status: "unvisited", score: 0, codePart: "" },
};

const KEY = "gameResults";
const EVT = "game-results-updated" as const;

export function readGameResults(): GameResults {
  const raw = localStorage.getItem(KEY);
  if (!raw) return INITIAL_RESULTS;
  try {
    const parsed = JSON.parse(raw);
    return { ...INITIAL_RESULTS, ...parsed };
  } catch {
    return INITIAL_RESULTS;
  }
}

export function writeGameResults(results: GameResults) {
  localStorage.setItem(KEY, JSON.stringify(results));
  window.dispatchEvent(new CustomEvent(EVT));
}

import GameStateService from '../services/gameState.service';

export function reportGameResult(gameId: GameId, partial: Partial<GameResult>) {
  const current = readGameResults();
  const next: GameResults = {
    ...current,
    [gameId]: { ...current[gameId], ...partial },
  };
  writeGameResults(next);

  // Always sync with GameStateService
  const status = partial.status || current[gameId].status;
  GameStateService.setState(gameId, status);
}

export function onGameResultsChange(cb: (r: GameResults) => void) {
  const handle = () => cb(readGameResults());
  window.addEventListener("storage", handle);
  window.addEventListener(EVT as any, handle);

  const vis = () => {
    if (document.visibilityState === "visible") cb(readGameResults());
  };
  document.addEventListener("visibilitychange", vis);

  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(EVT as any, handle);
    document.removeEventListener("visibilitychange", vis);
  };
}

/** Which word this game contributes to the final message. */
export function codePartFor(gameId: GameId): string {
  const idx = GAME_ORDER.indexOf(gameId);
  if (idx === 0) return "Esta";
  if (idx === 1) return "es";
  if (idx === 2) return "la";
  return "llave";
}

/** Assemble the final message from completed games (in order). */
export function assembleFinalMessage(results: GameResults): string {
  const parts: string[] = [];
  for (const g of GAME_ORDER) {
    const r = results[g];
    if (r?.status === "completed" && r.codePart) parts.push(r.codePart);
  }
  return parts.join(" ");
}
