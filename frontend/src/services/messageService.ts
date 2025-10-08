import { api } from "../config/axios.config";

export type Message = {
    id: number;
    groupId: number;
    senderId: number;
    sendDate: number;
    content: string;
}

export default {
    async getByGroupId(groupId: number): Promise<Message[]> {
        const res = await api.get<Message[]>(`/messages/${groupId}`);
        return res.data;
    },

    async createMessage(groupId: number, content: string): Promise<Message> {
        const res = await api.post<Message>(`/messages/${groupId}`, { content });
        return res.data;
    }
}