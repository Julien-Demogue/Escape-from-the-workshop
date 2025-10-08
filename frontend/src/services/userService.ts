import { api } from "../config/axios.config";


export type User = {
    id: number;
    username: string;
    hashedEmail: string;
    color: string;
}

export default {
    async getById(id: number): Promise<User | null> {
        try {
            const res = await api.get<User>(`/users/${id}`);
            return res.data ?? null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err?.response && err.response.status === 404) return null;
            throw err;
        }
    },

    async getUsersByGroupId(groupId: number): Promise<User[]> {
        const res = await api.get<User[]>(`/groups/${groupId}/users`);
        return res.data;
    },
}