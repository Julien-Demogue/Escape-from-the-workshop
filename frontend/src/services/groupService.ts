import { api } from "../config/axios.config";

export type Group = {
    id: number;
    partyId: number;
    name: string;
    code: string;
    score: number;
}

export default {
    async getByPartyId(partyId: number): Promise<Group[]> {
        const res = await api.get<Group[]>(`/groups/party/${partyId}`);
        return res.data;
    },

    async createGroups(partyId: number, amount = 1): Promise<Group[]> {
        const res = await api.post<Group[]>('/groups', { partyId, amount });
        return res.data;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async joinGroup(groupId: number): Promise<any> {
        const res = await api.post(`/groups/${groupId}/join`);
        return res.data;
    },

    async updateGroupName(groupId: number, name: string): Promise<Group> {
        const res = await api.put<Group>(`/groups/${groupId}`, { name });
        return res.data;
    },

    async addPoints(groupId: number, points: number): Promise<Group> {
        const res = await api.patch<Group>(`/groups/${groupId}/points`, { points });
        return res.data;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async completeChallenge(groupId: number, challengeId: number): Promise<any> {
        const res = await api.post(`/groups/${groupId}/complete-challenge`, { challengeId });
        return res.data;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async deleteGroup(groupId: number): Promise<any> {
        const res = await api.delete(`/groups/${groupId}`);
        return res.data;
    },

    // Récupère la liste des challenges (identifiants/keys) déjà complétés par le groupe
    async getCompletedChallenges(groupId: number): Promise<string[]> {
        const res = await api.get<string[]>(`/groups/${groupId}/completed-challenges`);
        return res.data;
    },
}