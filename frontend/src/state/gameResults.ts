// src/state/gameResults.ts
// All code in English; UI strings can be French in pages.

import GameStateService from "../services/gameState.service";
import challengeService from "../services/challengeService";

/* ---------------------------------- Types --------------------------------- */

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
  score: number;     // 0..100 (or your scale)
  codePart: string;  // piece of the final message (comes from DB reward)
};

export type GameResults = Record<GameId, GameResult>;

/* --------------------------- Canonical game order -------------------------- */

export const GAME_ORDER: GameId[] = [
  "heraldry-quiz",
  "puzzle",
  "memory-loire",
  "courrier-loire",
  "brissac-enigma",
  "chambord-enigma",
];

export const TOTAL_GAMES = GAME_ORDER.length;

/* ----------------------------- Initial results ---------------------------- */

export const INITIAL_RESULTS: GameResults = {
  "heraldry-quiz":  { status: "unvisited", score: 0, codePart: "" },
  "puzzle":         { status: "unvisited", score: 0, codePart: "" },
  "memory-loire":   { status: "unvisited", score: 0, codePart: "" },
  "courrier-loire": { status: "unvisited", score: 0, codePart: "" },
  "brissac-enigma": { status: "unvisited", score: 0, codePart: "" },
  "chambord-enigma":{ status: "unvisited", score: 0, codePart: "" },
};

/* --------------------------- LocalStorage plumbing ------------------------- */

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

/* ------------------------------- Reward cache ------------------------------ */
/**
 * We cache rewards/flags per game to avoid extra roundtrips.
 * Structure in LS (REWARD_KEY):
 * {
 *   version: 1,
 *   items: {
 *     "heraldry-quiz": { reward: "xxx", flag: "ABC", challengeId: 1, updatedAt: 1700000000000 },
 *     ...
 *   }
 * }
 */

type RewardItem = { reward: string; flag?: string; challengeId: number; updatedAt: number };
type RewardCache = { version: 1; items: Partial<Record<GameId, RewardItem>> };

const REWARD_KEY = "rewardCacheV1";

/** Map gameId -> challengeId (adjust if your DB uses different IDs). */
export const CHALLENGE_ID_BY_GAME: Record<GameId, number> = {
  "heraldry-quiz": 1,   // ✅ confirmed in your project
  "puzzle": 2,          // ✅ Villandry / Puzzle
  "memory-loire": 3,    // ✅ Rivau
  "courrier-loire": 4,  // ⚠️ adjust if your DB uses other ID
  "brissac-enigma": 6,  // ⚠️ adjust if your DB uses other ID
  "chambord-enigma": 5, // ✅ Chambord
};

function readRewardCache(): RewardCache {
  try {
    const raw = localStorage.getItem(REWARD_KEY);
    if (!raw) return { version: 1, items: {} };
    const parsed = JSON.parse(raw) as RewardCache;
    if (parsed?.version !== 1 || typeof parsed?.items !== "object") {
      return { version: 1, items: {} };
    }
    return parsed;
  } catch {
    return { version: 1, items: {} };
  }
}

function writeRewardCache(cache: RewardCache) {
  localStorage.setItem(REWARD_KEY, JSON.stringify(cache));
}

/** Public helper to read reward/flag synchronously from cache. */
export function getRewardSync(gameId: GameId): { reward: string; flag?: string } {
  const cache = readRewardCache();
  const item = cache.items[gameId];
  return { reward: item?.reward ?? "", flag: item?.flag };
}

/**
 * Fetch rewards/flags from DB (once) and cache them.
 * Tries to be resilient to different service shapes (getChallenge/getById/getInfo).
 * Call this at app start or when the dashboard mounts.
 */
export async function refreshRewardsFromDB(): Promise<void> {
  const cache = readRewardCache();
  const now = Date.now();

  for (const gameId of GAME_ORDER) {
    const challengeId = CHALLENGE_ID_BY_GAME[gameId];
    // Skip if already cached with a reward
    if (cache.items[gameId]?.reward) continue;

    try {
      const svcAny = challengeService as any;
      let data: any | null = null;

      // Try common method names used across codebases
      if (typeof svcAny.getChallenge === "function") {
        data = await svcAny.getChallenge(challengeId);
      } else if (typeof svcAny.getById === "function") {
        data = await svcAny.getById(challengeId);
      } else if (typeof svcAny.getInfo === "function") {
        data = await svcAny.getInfo(challengeId);
      }

      const reward: string | undefined =
        data?.reward ?? data?.data?.reward ?? data?.info?.reward;
      const flag: string | undefined =
        data?.flag ?? data?.data?.flag ?? data?.info?.flag;

      if (!cache.items[gameId]) {
        cache.items[gameId] = {
          reward: reward ?? "",
          flag,
          challengeId,
          updatedAt: now,
        };
      } else {
        cache.items[gameId] = {
          ...(cache.items[gameId]!),
          reward: reward ?? cache.items[gameId]!.reward ?? "",
          flag: flag ?? cache.items[gameId]!.flag,
          updatedAt: now,
        };
      }
    } catch {
      // Swallow error -> we keep going for other games
    }
  }

  writeRewardCache(cache);
}

/* -------------------------- Results reporting API ------------------------- */

/**
 * Report partial result and keep LS + team service in sync.
 * If status is "completed" and no `codePart` is provided, it fills it from the reward cache.
 */
export function reportGameResult(gameId: GameId, partial: Partial<GameResult>) {
  const current = readGameResults();

  // If completed and codePart is missing in the payload,
  // fill codePart from cached reward (so UI always shows the DB token).
  const incomingStatus = partial.status ?? current[gameId].status;
  let maybePartial: Partial<GameResult> = { ...partial };

  if (incomingStatus === "completed") {
    const hasCode = Boolean(partial.codePart || current[gameId].codePart);
    if (!hasCode) {
      const { reward } = getRewardSync(gameId);
      if (reward) {
        maybePartial.codePart = reward;
      }
    }
  }

  const next: GameResults = {
    ...current,
    [gameId]: { ...current[gameId], ...maybePartial },
  };
  writeGameResults(next);

  // Always sync with team service
  const statusToSet = maybePartial.status || current[gameId].status;
  GameStateService.setState(gameId, statusToSet);
}

/** Subscribe to changes emitted by writeGameResults. */
export function onGameResultsChange(cb: (r: GameResults) => void) {
  const handle = () => cb(readGameResults());
  window.addEventListener("storage", handle);
  window.addEventListener(EVT, handle);

  const vis = () => {
    if (document.visibilityState === "visible") cb(readGameResults());
  };
  document.addEventListener("visibilitychange", vis);

  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(EVT, handle);
    document.removeEventListener("visibilitychange", vis);
  };
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

/* ----------------------------- Legacy helpers ----------------------------- */
/**
 * Legacy export used by older pages.
 * Returns the DB reward (code piece) cached in localStorage.
 * If rewards were not preloaded yet, it returns "" (empty string).
 */
export function codePartFor(gameId: GameId): string {
  return getRewardSync(gameId).reward ?? "";
}
