import { api } from "../config/axios.config";

export type Party = {
    id: number;
    code: string;
    adminUserId: number;
    endTime: number;
}

export default {
    async getById(id: number): Promise<Party> {
        const res = await api.get<Party>(`/parties/${id}`);
        return res.data;
    },

    async getByCode(code: string): Promise<Party | null> {
        try {
            const res = await api.get<Party>(`/parties/code/${code}`);
            return res.data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err?.response && err.response.status === 404) return null;
            throw err;
        }
    },

    async createParty(payload: Partial<Party>): Promise<Party> {
        const res = await api.post<Party>('/parties', payload);
        return res.data;
    },

    async startParty(id: number, endDate: string): Promise<Party> {
        const res = await api.post<Party>(`/parties/${id}/start`, { endDate });
        return res.data;
    }
}