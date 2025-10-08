import { api } from "../config/axios.config";

export type Info = {
    id: number;
    challengeId: number;
    title: string;
    description: string;
}

export type Illustration = {
    id: number;
    infoId: number;
    url: string;
}

export default {
    async getIllustrations(infoId: number): Promise<Illustration[]> {
        const res = await api.get<Illustration[]>(`/info/${infoId}/illustrations`);
        return res.data;
    }
}