import { api } from "../config/axios.config";
import type { Info } from "./infoService";

export type Challenge = {
    id: number;
    flag: string;
    reward: string;
    hint: string;
    points: number;
}

export default {
    async getAll(): Promise<Challenge[]> {
        const res = await api.get<Challenge[]>('/challenges');
        return res.data;
    },

    async getById(id: number): Promise<Challenge> {
        const res = await api.get<Challenge>(`/challenges/${id}`);
        return res.data;
    },


    async getInfo(challengeId: number): Promise<Info> {
        const res = await api.get<Info>(`/challenges/${challengeId}/info`);
        return res.data;
    }
}