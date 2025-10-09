/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../config/axios.config";
import type { Group } from "./groupService";

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
        } catch (err: any) {
            if (err?.response && err.response.status === 404) return null;
            throw err;
        }
    },

    async getUsersByGroupId(groupId: number): Promise<User[]> {
        const res = await api.get<User[]>(`/users/group/${groupId}`);
        return res.data;
    },

    async getUserGroupInParty(partyId: number): Promise<Group | null> {
        try {
            const res = await api.get<Group | null>(`/users/party/${partyId}/group`);
            return res.data ?? null;
        } catch (err: any) {
            if (err?.response && err.response.status === 404) return null;
            throw err;
        }
    },
}