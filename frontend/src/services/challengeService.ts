import { api } from "../config/axios.config";
import type { Info } from "./infoService";

export type Challenge = {
  id: number;
  flag: string;
  reward: string;
  hint: string;
  points: number;
};

export type GameStatus = "unvisited" | "completed" | "failed";

export default {
  // --- Lecturas base que ya tenías ---
  async getAll(): Promise<Challenge[]> {
    const res = await api.get<Challenge[]>("/challenges");
    return res.data;
  },

  async getById(id: number): Promise<Challenge> {
    const res = await api.get<Challenge>(`/challenges/${id}`);
    return res.data;
  },

  async getInfo(challengeId: number): Promise<Info> {
    const res = await api.get<Info>(`/challenges/${challengeId}/info`);
    return res.data;
  },

  // --- Nuevo: enviar score del juego (no suma puntos del grupo; solo se persiste el score del challenge) ---
  // Tu backend ya manejaba algo así en /challenges/validate (según el servicio previo que compartiste).
  async submitScore(gameId: string, score: number): Promise<GameStatus> {
    const res = await api.post<{ status: GameStatus }>("/challenges/validate", {
      gameId,
      score,
    });
    return res.data.status;
  },

  // --- Nuevo: traerse el progreso si te interesa sincronizar a demanda ---
  async getProgress(): Promise<Record<string, GameStatus>> {
    const res = await api.get<{ progress: Record<string, GameStatus> }>(
      "/challenges/progress"
    );
    return res.data.progress;
  },
};
